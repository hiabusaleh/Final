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
before(async () => {
  await new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }));
  for (const n of ["ana", "bob", "cy"]) {
    const r = await call("POST", "/api/auth/register", { name: n + " X", email: n + "@x.com", password: "password1" });
    u[n] = { c: r.cookie, id: r.json.user.id };
  }
});
after(() => server.close());

const prefs = { enabled: true, testType: "academic", speakingLevel: 6, days: ["Sat", "Mon"], times: ["evening"], parts: ["Part 2"], communityGuidelinesAccepted: true };

test("partner matching respects level, schedule and blocks; hides emails", async () => {
  assert.equal((await call("PUT", "/api/collab/partner-prefs", { ...prefs, communityGuidelinesAccepted: false }, u.ana.c)).status, 400);
  await call("PUT", "/api/collab/partner-prefs", prefs, u.ana.c);
  await call("PUT", "/api/collab/partner-prefs", { ...prefs, speakingLevel: 6.5 }, u.bob.c);
  await call("PUT", "/api/collab/partner-prefs", { ...prefs, days: ["Fri"] }, u.cy.c);
  const m = (await call("GET", "/api/collab/partner-matches", null, u.ana.c)).json.matches;
  assert.deepEqual(m.map(x => x.name), ["bob"]);
  assert.ok(!JSON.stringify(m).includes("@"));
  await call("POST", "/api/collab/blocks", { userId: u.bob.id }, u.ana.c);
  assert.equal((await call("GET", "/api/collab/partner-matches", null, u.bob.c)).json.matches.length, 0);
});

test("rooms: invite code, role permissions, capacity, owner-only role changes", async () => {
  const r = (await call("POST", "/api/collab/rooms", { name: "Reading club", maxMembers: 2 }, u.cy.c)).json.room;
  assert.equal(r.myRole, "owner"); assert.ok(r.inviteCode);
  const j = (await call("POST", "/api/collab/rooms/join", { code: r.inviteCode.toLowerCase() }, u.ana.c)).json.room;
  assert.equal(j.myRole, "participant"); assert.equal(j.inviteCode, undefined); assert.ok(!j.myPermissions.includes("end"));
  assert.equal((await call("POST", "/api/collab/rooms/join", { code: r.inviteCode }, u.bob.c)).status, 403); // blocked by a member
  const dee = (await call("POST", "/api/auth/register", { name: "Dee", email: "dee@x.com", password: "password1" })).cookie;
  assert.equal((await call("POST", "/api/collab/rooms/join", { code: r.inviteCode }, dee)).status, 409);      // room full
  assert.equal((await call("PUT", `/api/collab/rooms/${r.id}/members/${u.cy.id}`, { role: "observer" }, u.ana.c)).status, 403);
  const h = (await call("PUT", `/api/collab/rooms/${r.id}/members/${u.ana.id}`, { role: "host" }, u.cy.c)).json.room;
  assert.equal(h.members.find(m => m.name === "ana").role, "host");
});

test("reports go to moderation queue; students cannot moderate", async () => {
  assert.equal((await call("POST", "/api/collab/reports", { reportedUserId: u.bob.id, eventType: "spam", description: "Sent links repeatedly" }, u.ana.c)).status, 201);
  assert.equal((await call("GET", "/api/admin/reports", null, u.ana.c)).status, 403);
});
