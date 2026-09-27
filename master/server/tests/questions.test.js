const { test, before, after } = require("node:test");
const assert = require("node:assert");
const os = require("os"), path = require("path"), fs = require("fs");
process.env.PORCHI_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "porchi-")), "db.json");
const server = require("../server"), db = require("../db"), auth = require("../auth");
const { mark } = require("../routes/questions");
require("child_process").execFileSync("node", [path.join(__dirname, "..", "seed.js")], { env: process.env });
let base, student, qe;
const call = async (method, p, body, cookie) => {
  const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) });
  return { status: r.status, json: await r.json(), cookie: (r.headers.get("set-cookie") || "").split(";")[0] };
};
before(async () => {
  await new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }));
  student = (await call("POST", "/api/auth/register", { name: "S", email: "s@x.com", password: "password1" })).cookie;
  db.insert("users", { email: "q@x.com", name: "Q", passwordHash: auth.hash("password1"), role: "question_editor" });
  qe = (await call("POST", "/api/auth/login", { email: "q@x.com", password: "password1" })).cookie;
});
after(() => server.close());

test("marking: case, punctuation, alternatives, word limit", () => {
  const q = { correct_answer: "twenty", acceptable_answers: ["20"], word_limit: 1 };
  assert.ok(mark(q, " Twenty. ")); assert.ok(mark(q, "20"));
  assert.ok(!mark(q, "twenty degrees")); assert.ok(!mark(q, ""));
});

test("practice list hides answers; check marks and saves mistakes", async () => {
  const { json } = await call("GET", "/api/practice?skill=reading&type=True/False/Not Given");
  assert.equal(json.questions.length, 4); assert.equal(json.passages.length, 1);
  assert.ok(json.questions.every(q => q.correct_answer === undefined && q.explanation === undefined));
  const answers = json.questions.map(q => ({ id: q.id, answer: "TRUE" }));
  const r = await call("POST", "/api/practice/check", { answers }, student);
  assert.equal(r.json.score, 1); assert.equal(r.json.saved, true);
  const m = await call("GET", "/api/me/mistakes", null, student);
  assert.equal(m.json.mistakes.length, 3);
  assert.equal((await call("PUT", `/api/me/mistakes/${m.json.mistakes[0].id}`, { category: "Paraphrase" }, student)).status, 200);
  const s = await call("GET", "/api/me/stats", null, student);
  assert.equal(s.json.attempted, 4);
});

test("editing a question keeps old version for past mistakes; unlicensed content cannot be published", async () => {
  const mistake = (await call("GET", "/api/me/mistakes", null, student)).json.mistakes[0];
  const q = db.find("questions", x => x.id === mistake.questionId);
  const r = await call("PUT", `/api/admin/questions/${q.id}`, { ...q, prompt: "Changed prompt" }, qe);
  assert.equal(r.json.item.version, 2);
  const again = (await call("GET", "/api/me/mistakes", null, student)).json.mistakes.find(m => m.id === mistake.id);
  assert.notEqual(again.prompt, "Changed prompt");
  const bad = await call("POST", "/api/admin/questions", { module: "reading", question_type: "MCQ", prompt: "x", correct_answer: "A", status: "published", license_status: "unknown" }, qe);
  assert.equal(bad.status, 400);
  assert.equal((await call("GET", "/api/admin/questions", null, student)).status, 403);
});
