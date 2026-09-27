const { test, before, after } = require("node:test");
const assert = require("node:assert");
const os = require("os"), path = require("path"), fs = require("fs");
process.env.PORCHI_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "porchi-")), "db.json");
const server = require("../server");
const db = require("../db"), auth = require("../auth");
let base;
before(() => new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); })));
after(() => server.close());

const call = async (method, p, body, cookie) => {
  const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) });
  return { status: r.status, json: await r.json(), cookie: (r.headers.get("set-cookie") || "").split(";")[0] };
};

test("register, me, logout", async () => {
  const r = await call("POST", "/api/auth/register", { name: "A", email: "a@x.com", password: "password1" });
  assert.equal(r.status, 201); assert.equal(r.json.user.role, "student");
  assert.equal((await call("GET", "/api/auth/me", null, r.cookie)).json.user.email, "a@x.com");
  await call("POST", "/api/auth/logout", {}, r.cookie);
  assert.equal((await call("GET", "/api/auth/me", null, r.cookie)).json.user, null);
});

test("wrong password rejected, duplicate email rejected", async () => {
  assert.equal((await call("POST", "/api/auth/login", { email: "a@x.com", password: "nope" })).status, 401);
  assert.equal((await call("POST", "/api/auth/register", { name: "A", email: "a@x.com", password: "password1" })).status, 409);
});

test("students cannot use admin endpoints; super admin can", async () => {
  const s = await call("POST", "/api/auth/login", { email: "a@x.com", password: "password1" });
  assert.equal((await call("GET", "/api/admin/users", null, s.cookie)).status, 403);
  db.insert("users", { email: "boss@x.com", name: "Boss", passwordHash: auth.hash("password1"), role: "super_admin" });
  const a = await call("POST", "/api/auth/login", { email: "boss@x.com", password: "password1" });
  assert.equal((await call("GET", "/api/admin/users", null, a.cookie)).status, 200);
});

test("non-JSON mutation blocked (CSRF guard) and server folder not served", async () => {
  const r = await fetch(base + "/api/auth/logout", { method: "POST", headers: { "Content-Type": "text/plain" } });
  assert.equal(r.status, 415);
  assert.equal((await fetch(base + "/server/db.js")).status, 404);
  assert.equal((await fetch(base + "/index.html")).status, 200);
});
