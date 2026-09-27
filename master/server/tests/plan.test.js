const { test, before, after } = require("node:test");
const assert = require("node:assert");
const os = require("os"), path = require("path"), fs = require("fs");
process.env.PORCHI_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "porchi-")), "db.json");
process.env.PORCHI_AI_PROVIDER = "demo";
require("child_process").execFileSync("node", [path.join(__dirname, "..", "seed.js")], { env: process.env });
const server = require("../server"), db = require("../db");
let base, s;
const call = async (method, p, body, cookie) => {
  const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) });
  return { status: r.status, json: await r.json(), cookie: (r.headers.get("set-cookie") || "").split(";")[0] };
};
before(async () => {
  await new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }));
  s = (await call("POST", "/api/auth/register", { name: "S", email: "s@x.com", password: "password1" })).cookie;
});
after(() => server.close());

test("plan follows test date, weak skills and real weak question types", async () => {
  const date = new Date(Date.now() + 20 * 864e5).toISOString().slice(0, 10);
  await call("PUT", "/api/me/profile", { profile: { targetBand: 7, testDate: date, hoursPerDay: 2,
    diagnostic: { bands: { listening: 7, reading: 6, writing: 5.5, speaking: 6.5 }, weaknesses: ["writing", "reading"] } } }, s);
  const tfng = db.filter("questions", q => q.question_type === "True/False/Not Given");
  await call("POST", "/api/practice/check", { answers: tfng.map(q => ({ id: q.id, answer: "X" })) }, s);
  const p = (await call("GET", "/api/me/plan", null, s)).json;
  assert.equal(p.weeks.length, 3);
  assert.deepEqual(p.weakness.weakSkills.slice(0, 2), ["writing", "reading"]);
  assert.equal(p.weakness.weakTypes[0].type, "True/False/Not Given");
  assert.ok(p.today.some(t => t.id === "target"));
  assert.ok(p.weeks.at(-1).tasks.some(t => /Full mock/.test(t)));
  await call("POST", "/api/me/plan/done", { taskId: "vocab" }, s);
  assert.ok((await call("GET", "/api/me/plan", null, s)).json.today.find(t => t.id === "vocab").done);
});

test("One Skill Retake mode focuses on one skill; profile fields merge", async () => {
  await call("PUT", "/api/me/profile", { profile: { osr: { bands: { listening: 7, reading: 7.5, writing: 6, speaking: 7 }, focusSkill: "writing" } } }, s);
  const p = (await call("GET", "/api/me/plan", null, s)).json;
  assert.deepEqual(p.weakness.weakSkills, ["writing"]);
  assert.ok(p.weeks[0].tasks.every(t => !/^Listening|^Speaking/.test(t)));
  assert.equal(p.hours, 2); // earlier field kept
  await call("PUT", "/api/me/profile", { profile: { osr: null } }, s);
  assert.equal((await call("GET", "/api/me/plan", null, s)).json.osr, null);
});

test("saved items and AI advice", async () => {
  const it = (await call("POST", "/api/me/saved", { kind: "post", refId: "p1", title: "Tip", link: "posts/index.html#p1" }, s)).json.item;
  assert.equal((await call("POST", "/api/me/saved", { kind: "post", refId: "p2", title: "Bad", link: "https://evil.example" }, s)).status, 400);
  assert.equal((await call("GET", "/api/me/saved", null, s)).json.items.length, 1);
  await call("DELETE", `/api/me/saved/${it.id}`, {}, s);
  assert.equal((await call("GET", "/api/me/saved", null, s)).json.items.length, 0);
  assert.match((await call("POST", "/api/me/plan/ai-advice", {}, s)).json.result.label, /AI/);
});
