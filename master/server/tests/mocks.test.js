const { test, before, after } = require("node:test");
const assert = require("node:assert");
const os = require("os"), path = require("path"), fs = require("fs");
process.env.PORCHI_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "porchi-")), "db.json");
require("child_process").execFileSync("node", [path.join(__dirname, "..", "seed.js")], { env: process.env });
const server = require("../server"), db = require("../db");
const { bandFor, overall } = require("../scoring/rulesets");
let base, s1, s2;
const call = async (method, p, body, cookie) => {
  const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) });
  return { status: r.status, json: await r.json(), cookie: (r.headers.get("set-cookie") || "").split(";")[0] };
};
before(async () => {
  await new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }));
  s1 = (await call("POST", "/api/auth/register", { name: "A", email: "a@x.com", password: "password1" })).cookie;
  s2 = (await call("POST", "/api/auth/register", { name: "B", email: "b@x.com", password: "password1" })).cookie;
});
after(() => server.close());

test("band conversion and IELTS overall rounding", () => {
  assert.equal(bandFor("reading_academic_v1", 30, 40).band, 7);
  assert.equal(bandFor("listening_v1", 40, 40).band, 9);
  assert.equal(bandFor("reading_academic_v1", 5, 10).scaled, 20);
  assert.equal(overall([6.5, 6.5, 5, 7]), 6.5);   // 6.25 → 6.5
  assert.equal(overall([4, 3.5, 4, 3.5]), 4);     // 3.75 → 4
  assert.equal(overall([6.5, 6.5, 6, 6]), 6.5);   // 6.25 → 6.5
  assert.equal(overall([6, 6, 6, 6.5]), 6);       // 6.125 → 6
});

test("full mock flow: start hides answers, submit scores, result private, no double submit", async () => {
  const { mocks } = (await call("GET", "/api/mocks")).json;
  assert.equal(mocks.length, 1);
  assert.equal((await call("POST", `/api/mocks/${mocks[0].id}/start`, {})).status, 401);
  const st = (await call("POST", `/api/mocks/${mocks[0].id}/start`, {}, s1)).json;
  assert.ok(st.questions.every(q => q.correct_answer === undefined));
  const answers = { "task:1": "Rooftop gardens are useful. ".repeat(20) };
  for (const q of db.all("questions")) answers[q.id] = q.correct_answer;
  const sub = await call("POST", `/api/attempts/${st.attempt.id}/submit`, { answers, seconds: 600 }, s1);
  assert.equal(sub.status, 200);
  const r = (await call("GET", `/api/attempts/${st.attempt.id}`, null, s1)).json.attempt.report;
  assert.equal(r.raw, 10); assert.equal(r.sections[0].band, 9);
  assert.equal(r.sections[1].status, "pending_review"); assert.equal(r.sections[1].words, 80);
  assert.equal(r.overall, null); // needs all four skills
  assert.equal((await call("GET", `/api/attempts/${st.attempt.id}`, null, s2)).status, 404);
  assert.equal((await call("POST", `/api/attempts/${st.attempt.id}/submit`, { answers }, s1)).status, 409);
  assert.equal((await call("GET", "/api/me/attempts", null, s1)).json.attempts.length, 1);
});
