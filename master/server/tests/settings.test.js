const { test, before, after } = require("node:test");
const assert = require("node:assert");
const os = require("os"), path = require("path"), fs = require("fs");
process.env.PORCHI_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "porchi-")), "db.json");
process.env.PORCHI_AI_PROVIDER = "demo";
require("child_process").execFileSync("node", [path.join(__dirname, "..", "seed.js")], { env: process.env });
const server = require("../server"), db = require("../db"), auth = require("../auth");
let base, s, admin;
const call = async (method, p, body, cookie) => {
  const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) });
  const text = await r.text();
  return { status: r.status, json: JSON.parse(text), headers: r.headers, cookie: (r.headers.get("set-cookie") || "").split(";")[0] };
};
before(async () => {
  await new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }));
  s = (await call("POST", "/api/auth/register", { name: "S", email: "s@x.com", password: "password1" })).cookie;
  db.insert("users", { email: "a@x.com", name: "A", passwordHash: auth.hash("password1"), role: "super_admin" });
  admin = (await call("POST", "/api/auth/login", { email: "a@x.com", password: "password1" })).cookie;
});
after(() => server.close());

test("flags: admin-only, enforced on the server", async () => {
  assert.equal((await call("PUT", "/api/admin/flags", { flags: { AI_WRITING_ENABLED: false } }, s)).status, 403);
  await call("PUT", "/api/admin/flags", { flags: { AI_WRITING_ENABLED: false, COLLABORATE_ENABLED: false, UNKNOWN: true } }, admin);
  const f = (await call("GET", "/api/flags")).json.flags;
  assert.equal(f.AI_WRITING_ENABLED, false); assert.equal(f.UNKNOWN, undefined);
  assert.equal((await call("POST", "/api/ai/writing", { task: "Discuss both views here.", response: "word ".repeat(80) }, s)).status, 503);
  assert.equal((await call("GET", "/api/collab/rooms", null, s)).status, 503);
  await call("PUT", "/api/admin/flags", { flags: { AI_WRITING_ENABLED: true, COLLABORATE_ENABLED: true } }, admin);
  assert.equal((await call("POST", "/api/ai/writing", { task: "Discuss both views here.", response: "word ".repeat(80) }, s)).status, 200);
});

test("export contains learner data but no password hash or other users", async () => {
  const r = await call("GET", "/api/me/export", null, s);
  assert.match(r.headers.get("content-disposition"), /attachment/);
  assert.equal(r.json.account.email, "s@x.com"); assert.equal(r.json.account.passwordHash, undefined);
  assert.equal(r.json.aiFeedback.length, 1);
  assert.ok(!JSON.stringify(r.json).includes("a@x.com"));
});

test("search finds content, vocabulary and grammar but never answers", async () => {
  const r = (await call("GET", "/api/search?q=matching")).json.results;
  assert.ok(r.some(x => x.kind === "Practice"));
  assert.ok((await call("GET", "/api/search?q=sustainable")).json.results.some(x => x.kind === "Vocabulary"));
  assert.ok((await call("GET", "/api/search?q=passive")).json.results.some(x => x.kind === "Grammar"));
  const q = db.all("questions")[0];
  assert.ok(!JSON.stringify((await call("GET", "/api/search?q=" + encodeURIComponent(q.prompt.slice(0, 20)))).json).includes("correct_answer"));
});
