const { test, before, after } = require("node:test");
const assert = require("node:assert");
const os = require("os"), path = require("path"), fs = require("fs");
process.env.PORCHI_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "porchi-")), "db.json");
const server = require("../server"), db = require("../db"), activity = require("../activity");
const { nextState } = require("../routes/vocab");
let base, s, uid;
const call = async (method, p, body, cookie) => {
  const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) });
  return { status: r.status, json: await r.json(), cookie: (r.headers.get("set-cookie") || "").split(";")[0] };
};
before(async () => {
  await new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }));
  const r = await call("POST", "/api/auth/register", { name: "S", email: "s@x.com", password: "password1" }); s = r.cookie; uid = r.json.user.id;
});
after(() => server.close());

test("Leitner boxes: good +1, easy +2, again resets to 1, capped at 5", () => {
  assert.equal(nextState(null, "good").box, 1);
  assert.equal(nextState({ box: 2 }, "easy").box, 4);
  assert.equal(nextState({ box: 5 }, "easy").box, 5);
  assert.equal(nextState({ box: 4 }, "again").box, 1);
  assert.equal(nextState({ box: 1 }, "good").due, new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10));
});

test("reviews and personal words are per learner", async () => {
  await call("POST", "/api/me/vocab/review", { wordId: "w1", result: "good" }, s);
  await call("POST", "/api/me/vocab/review", { wordId: "w1", result: "easy" }, s);
  const w = (await call("POST", "/api/me/vocab/custom", { word: "resilient", bn: "সহনশীল" }, s)).json.word;
  const v = (await call("GET", "/api/me/vocab", null, s)).json;
  assert.equal(v.progress.w1.box, 3); assert.equal(v.progress.w1.reviews, 2); assert.equal(v.custom[0].word, "resilient");
  await call("DELETE", `/api/me/vocab/custom/${w.id}`, {}, s);
  assert.equal((await call("GET", "/api/me/vocab", null, s)).json.custom.length, 0);
});

test("streak counts consecutive study days", async () => {
  const d = i => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
  for (const i of [1, 2, 3, 6, 7]) db.insert("activity", { userId: uid, date: d(i) });
  const st = (await call("GET", "/api/me/streak", null, s)).json;
  assert.equal(st.current, 4); assert.equal(st.today, true); assert.equal(st.longest, 4);
  assert.equal(activity.streak("nobody").current, 0);
});
