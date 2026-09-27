const { test, before, after } = require("node:test");
const assert = require("node:assert");
const os = require("os"), path = require("path"), fs = require("fs");
process.env.PORCHI_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "porchi-")), "db.json");
process.env.PORCHI_AI_PROVIDER = "demo";
const server = require("../server"), db = require("../db"), auth = require("../auth");
let base, s, t, t2, fid;
const call = async (method, p, body, cookie) => {
  const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) });
  return { status: r.status, json: await r.json(), cookie: (r.headers.get("set-cookie") || "").split(";")[0] };
};
before(async () => {
  await new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }));
  s = (await call("POST", "/api/auth/register", { name: "Sara K", email: "s@x.com", password: "password1" })).cookie;
  for (const [e, v] of [["t@x.com", "t"], ["t2@x.com", "t2"]]) db.insert("users", { email: e, name: "Teacher " + v, passwordHash: auth.hash("password1"), role: "teacher" });
  t = (await call("POST", "/api/auth/login", { email: "t@x.com", password: "password1" })).cookie;
  t2 = (await call("POST", "/api/auth/login", { email: "t2@x.com", password: "password1" })).cookie;
  fid = (await call("POST", "/api/ai/writing", { task: "Discuss both views and give your opinion.", response: "word ".repeat(260) }, s)).json.id;
});
after(() => server.close());

test("learner requests review; students cannot see the queue", async () => {
  assert.equal((await call("GET", "/api/review/queue", null, s)).status, 403);
  assert.equal((await call("POST", `/api/me/ai-feedback/${fid}/request-review`, { note: "Please check TR" }, s)).status, 200);
  assert.equal((await call("POST", `/api/me/ai-feedback/${fid}/request-review`, {}, s)).status, 409);
  const q = (await call("GET", "/api/review/queue", null, t)).json.items;
  assert.equal(q.length, 1); assert.equal(q[0].learner, "Sara");
  assert.ok(!JSON.stringify((await call("GET", `/api/review/${fid}`, null, t)).json).includes("s@x.com"));
});

test("only the claiming teacher can submit; learner sees final report and a notification", async () => {
  assert.equal((await call("PUT", `/api/review/${fid}`, { bands: {}, comment: "x" }, t)).status, 409);
  await call("POST", `/api/review/${fid}/claim`, {}, t);
  assert.equal((await call("POST", `/api/review/${fid}/claim`, {}, t2)).status, 409);
  const bands = { task_response: 6, coherence_cohesion: 6.5, lexical_resource: 6.5, grammar: 6 };
  assert.equal((await call("PUT", `/api/review/${fid}`, { bands, comment: "Good structure, develop examples." }, t2)).status, 409);
  assert.equal((await call("PUT", `/api/review/${fid}`, { bands: { ...bands, grammar: 12 }, comment: "Good structure, develop examples." }, t)).status, 400);
  const r = await call("PUT", `/api/review/${fid}`, { bands, comment: "Good structure, develop examples.", actions: ["Add one example per paragraph"] }, t);
  assert.equal(r.json.overall, 6.5); // 6.25 → 6.5
  const item = (await call("GET", `/api/me/ai-feedback/${fid}`, null, s)).json.item;
  assert.equal(item.reviewStatus, "reviewed"); assert.equal(item.teacherReview.teacher, "Teacher");
  assert.equal(db.filter("notifications", n => n.type === "review_done").length, 1);
});
