const { test, before, after } = require("node:test");
const assert = require("node:assert");
const os = require("os"), path = require("path"), fs = require("fs");
process.env.PORCHI_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "porchi-")), "db.json");
process.env.PORCHI_AI_PROVIDER = "demo";
const server = require("../server"), db = require("../db"), auth = require("../auth");
let base, a, b, t, rid;
const call = async (method, p, body, cookie) => {
  const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) });
  const ct = r.headers.get("content-type") || "";
  return { status: r.status, json: ct.includes("json") ? await r.json() : null, bytes: ct.includes("audio") ? (await r.arrayBuffer()).byteLength : 0, cookie: (r.headers.get("set-cookie") || "").split(";")[0] };
};
before(async () => {
  await new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }));
  a = (await call("POST", "/api/auth/register", { name: "A", email: "a@x.com", password: "password1" })).cookie;
  b = (await call("POST", "/api/auth/register", { name: "B", email: "b@x.com", password: "password1" })).cookie;
  db.insert("users", { email: "t@x.com", name: "T", passwordHash: auth.hash("password1"), role: "teacher" });
  t = (await call("POST", "/api/auth/login", { email: "t@x.com", password: "password1" })).cookie;
});
after(() => server.close());
const audio = Buffer.alloc(3000, 7).toString("base64");

test("upload requires consent; owner can play; others cannot", async () => {
  assert.equal((await call("POST", "/api/recordings", { mime: "audio/webm", data: audio }, a)).status, 400);
  const r = await call("POST", "/api/recordings", { consent: true, mime: "audio/webm;codecs=opus", data: audio, seconds: 30, prompt: "Describe a place" }, a);
  assert.equal(r.status, 201); rid = r.json.recording.id;
  assert.equal((await call("GET", `/api/recordings/${rid}`, null, a)).bytes, 3000);
  assert.equal((await call("GET", `/api/recordings/${rid}`, null, b)).status, 404);
  assert.equal((await call("GET", `/api/recordings/${rid}`, null, t)).status, 404); // no review requested yet
});

test("teacher can listen only after review is requested; owner can delete", async () => {
  const fb = await call("POST", "/api/ai/speaking", { prompt: "Describe a place you like", transcript: "I like the park near my home because it is quiet.", recordingId: rid }, a);
  await call("POST", `/api/me/ai-feedback/${fb.json.id}/request-review`, {}, a);
  assert.equal((await call("GET", `/api/recordings/${rid}`, null, t)).bytes, 3000);
  assert.equal((await call("DELETE", `/api/recordings/${rid}`, {}, a)).status, 200);
  assert.equal((await call("GET", "/api/me/recordings", null, a)).json.recordings.length, 0);
});
