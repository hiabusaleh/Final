const { test, before, after } = require("node:test");
const assert = require("node:assert");
const os = require("os"), path = require("path"), fs = require("fs");
process.env.PORCHI_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "porchi-")), "db.json");
const server = require("../server"), db = require("../db"), auth = require("../auth");
let base, s, admin;
const call = async (method, p, body, cookie) => {
  const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) });
  return { status: r.status, json: await r.json(), cookie: (r.headers.get("set-cookie") || "").split(";")[0] };
};
before(async () => {
  await new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }));
  s = (await call("POST", "/api/auth/register", { name: "S", email: "s@x.com", password: "password1" })).cookie;
  db.insert("users", { email: "a@x.com", name: "A", passwordHash: auth.hash("password1"), role: "super_admin" });
  admin = (await call("POST", "/api/auth/login", { email: "a@x.com", password: "password1" })).cookie;
});
after(() => server.close());

test("new posts and test date appear as notifications; read-all clears unread", async () => {
  await new Promise(r => setTimeout(r, 5));
  await call("POST", "/api/admin/posts", { title: "Fresh tip", category: "IELTS Tip", body: "b", status: "published" }, admin);
  await call("PUT", "/api/me/profile", { profile: { testDate: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10) } }, s);
  let n = (await call("GET", "/api/me/notifications", null, s)).json;
  assert.ok(n.items.some(i => i.type === "new_post")); assert.ok(n.items.some(i => i.type === "test_date"));
  assert.equal(n.unread, 1);
  await call("POST", "/api/me/notifications/read-all", {}, s);
  n = (await call("GET", "/api/me/notifications", null, s)).json;
  assert.equal(n.unread, 0); assert.ok(!n.items.some(i => i.type === "new_post"));
});

test("tracking stores only aggregates; analytics is admin-only", async () => {
  await call("POST", "/api/track", { name: "pageview", key: "/learn/index.html?x=1" });
  await call("POST", "/api/track", { name: "pageview", key: "/learn/" });
  assert.equal((await call("POST", "/api/track", { name: "evil", key: "/" })).status, 400);
  assert.equal((await call("GET", "/api/admin/analytics", null, s)).status, 403);
  const a = (await call("GET", "/api/admin/analytics", null, admin)).json;
  assert.deepEqual(a.topPages[0], { key: "/learn/", count: 2 });
  assert.equal(a.pageviews.length, 30); assert.equal(a.pageviews.at(-1).count, 2);
  assert.ok(!JSON.stringify(db.all("counters")).includes("127.0.0.1"));
});
