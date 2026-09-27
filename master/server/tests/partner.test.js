const { test, before, after } = require("node:test");
const assert = require("node:assert");
const os = require("os"), path = require("path"), fs = require("fs");
process.env.PORCHI_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "porchi-")), "db.json");
const server = require("../server");
let base; const u = {};
const call = async (method, p, body, cookie) => {
  const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) });
  return { status: r.status, json: await r.json(), cookie: (r.headers.get("set-cookie") || "").split(";")[0] };
};
/* minimal SSE reader */
async function sse(p, cookie) {
  const ctrl = new AbortController();
  const r = await fetch(base + p, { headers: { Cookie: cookie }, signal: ctrl.signal });
  const reader = r.body.getReader(), dec = new TextDecoder(), events = [];
  let buf = "", waiters = [];
  (async () => { try { for (;;) { const { value, done } = await reader.read(); if (done) break; buf += dec.decode(value);
    let i; while ((i = buf.indexOf("\n\n")) >= 0) { const block = buf.slice(0, i); buf = buf.slice(i + 2);
      const ev = /event: (\w+)/.exec(block)?.[1], data = /data: (.*)/.exec(block)?.[1];
      if (ev) { events.push({ ev, data: JSON.parse(data) }); waiters.forEach(w => w()); } } } } catch {} })();
  const next = async ev => { for (;;) { const e = events.findIndex(x => x.ev === ev || x.data?.type === ev); if (e >= 0) return events.splice(e, 1)[0];
    await new Promise(r => waiters.push(r)); } };
  return { status: r.status, next, close: () => ctrl.abort() };
}
before(async () => {
  await new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }));
  for (const n of ["ana", "bob", "eve"]) {
    const r = await call("POST", "/api/auth/register", { name: n, email: n + "@x.com", password: "password1" });
    u[n] = { c: r.cookie, id: r.json.user.id };
    await call("PUT", "/api/collab/partner-prefs", { enabled: true, days: ["Sat"], times: ["evening"], communityGuidelinesAccepted: true }, r.cookie);
  }
});
after(() => server.close());

let sessionId;
test("invite → accept creates a session visible to both only", async () => {
  const when = new Date(Date.now() + 3600e3).toISOString();
  assert.equal((await call("POST", "/api/collab/partner/requests", { toUserId: u.bob.id, scheduledAt: "2000-01-01" }, u.ana.c)).status, 400);
  const rq = (await call("POST", "/api/collab/partner/requests", { toUserId: u.bob.id, scheduledAt: when }, u.ana.c)).json.request;
  const inc = (await call("GET", "/api/collab/partner/requests", null, u.bob.c)).json.incoming;
  assert.equal(inc.length, 1); assert.equal(inc[0].from.name, "ana");
  assert.equal((await call("PUT", `/api/collab/partner/requests/${rq.id}`, { action: "accept" }, u.ana.c)).status, 403); // sender cannot accept
  sessionId = (await call("PUT", `/api/collab/partner/requests/${rq.id}`, { action: "accept" }, u.bob.c)).json.session.id;
  assert.equal((await call("GET", `/api/collab/partner/sessions/${sessionId}`, null, u.ana.c)).json.session.partner.name, "bob");
  assert.equal((await call("GET", `/api/collab/partner/sessions/${sessionId}`, null, u.eve.c)).status, 404);
});

test("signalling relays messages between the two participants", async () => {
  const a = await sse(`/api/collab/partner/sessions/${sessionId}/events`, u.ana.c);
  assert.equal((await a.next("hello")).data.partnerOnline, false);
  const b = await sse(`/api/collab/partner/sessions/${sessionId}/events`, u.bob.c);
  assert.equal((await b.next("hello")).data.partnerOnline, true);
  await a.next("joined");
  const r = await call("POST", `/api/collab/partner/sessions/${sessionId}/signal`, { type: "offer", data: { sdp: "x" } }, u.ana.c);
  assert.equal(r.json.delivered, true);
  assert.equal((await b.next("offer")).data.data.sdp, "x");
  assert.equal((await call("POST", `/api/collab/partner/sessions/${sessionId}/signal`, { type: "hack", data: {} }, u.ana.c)).status, 400);
  assert.equal((await sse(`/api/collab/partner/sessions/${sessionId}/events`, u.eve.c)).status, 404);
  await call("POST", `/api/collab/partner/sessions/${sessionId}/end`, {}, u.bob.c);
  await a.next("bye");
  a.close(); b.close();
});

test("feedback once per person, shown to the partner in history", async () => {
  const fb = { ratings: { fluency: 4, vocabulary: 3, grammar: 9, pronunciation: 0 }, positive: "Clear ideas", improve: "Use more linking words" };
  assert.equal((await call("POST", `/api/collab/partner/sessions/${sessionId}/feedback`, fb, u.ana.c)).status, 201);
  assert.equal((await call("POST", `/api/collab/partner/sessions/${sessionId}/feedback`, fb, u.ana.c)).status, 409);
  const h = (await call("GET", "/api/collab/partner/sessions", null, u.bob.c)).json.sessions[0];
  assert.equal(h.status, "ended"); assert.deepEqual(h.feedbackReceived.ratings, { fluency: 4, vocabulary: 3, grammar: 5, pronunciation: 1 });
});
