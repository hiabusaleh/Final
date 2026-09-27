/*
 * Porchi Collaborate — Phase A architecture reserve (Exclusive Features Plan §6, §16, §45–§47, §53).
 * Data model, permissions, matching, invites, report/block and moderation queue.
 * Real-time sync (presence, shared page, whiteboard, chat) and audio/video are Phase B/C.
 */
const crypto = require("crypto");

const ROOM_TYPES = ["private", "friends", "group"];
const TEMPLATES = ["Reading Room", "Writing Room", "Speaking Room", "Vocabulary Room", "General IELTS Room"];
const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const TIMES = ["morning", "afternoon", "evening", "night"];
const PARTS = ["Part 1", "Part 2", "Part 3", "Full test"];
const ACTIONS = ["speak", "camera", "navigate", "annotate", "whiteboard", "chat", "share", "timer", "invite", "end"];
/* Do not grant every permission to every role (§46) */
const ROLE_PERMS = {
  owner: ACTIONS,
  host: ["speak", "camera", "navigate", "annotate", "whiteboard", "chat", "share", "timer", "invite"],
  participant: ["speak", "camera", "annotate", "whiteboard", "chat"],
  observer: ["chat"]
};
const REPORT_TYPES = ["harassment", "spam", "inappropriate content", "no-show", "other"];

module.exports = ({ route, fail, send, str, requireRole, audit, db }) => {
  const pick = (v, allowed) => (Array.isArray(v) ? v : []).filter(x => allowed.includes(x));
  const blocked = (a, b) => db.find("blocks", x => (x.userId === a && x.blockedId === b) || (x.userId === b && x.blockedId === a));
  const firstName = id => (db.find("users", u => u.id === id)?.name || "Learner").split(" ")[0]; // never expose email (§16)

  /* ---- Speaking Partner preferences & matching ---- */
  route("GET", "/api/collab/partner-prefs", async (req, res, { user }) => {
    requireRole(user);
    send(res, 200, { prefs: db.find("partnerPrefs", p => p.userId === user.id) || null, options: { DAYS, TIMES, PARTS } });
  });
  route("PUT", "/api/collab/partner-prefs", async (req, res, { user, body }) => {
    requireRole(user);
    const prefs = {
      enabled: !!body.enabled, testType: ["academic", "general"].includes(body.testType) ? body.testType : "academic",
      targetBand: Math.min(9, Math.max(4, +body.targetBand || 6.5)), speakingLevel: Math.min(9, Math.max(1, +body.speakingLevel || 5.5)),
      parts: pick(body.parts, PARTS), minutes: [15, 30, 45].includes(+body.minutes) ? +body.minutes : 30,
      days: pick(body.days, DAYS), times: pick(body.times, TIMES),
      timezone: str(body.timezone, "timezone", { optional: true, max: 60 }) || "Asia/Dhaka",
      languageComfort: str(body.languageComfort, "languageComfort", { optional: true, max: 60 }),
      communityGuidelinesAccepted: !!body.communityGuidelinesAccepted
    };
    if (prefs.enabled && !prefs.communityGuidelinesAccepted) fail(400, "Community guidelines must be accepted");
    const cur = db.find("partnerPrefs", p => p.userId === user.id);
    send(res, 200, { prefs: cur ? db.update("partnerPrefs", cur.id, prefs) : db.insert("partnerPrefs", { userId: user.id, ...prefs }) });
  });
  route("GET", "/api/collab/partner-matches", async (req, res, { user }) => {
    requireRole(user);
    const me = db.find("partnerPrefs", p => p.userId === user.id && p.enabled) || fail(400, "Enable Speaking Partner first");
    const overlap = (a, b) => a.filter(x => b.includes(x)).length;
    const matches = db.filter("partnerPrefs", p => p.enabled && p.userId !== user.id && p.testType === me.testType && !blocked(user.id, p.userId))
      .map(p => ({ p, score: 3 - Math.abs(p.speakingLevel - me.speakingLevel) + overlap(p.days, me.days) + overlap(p.times, me.times) + overlap(p.parts, me.parts) }))
      .filter(x => Math.abs(x.p.speakingLevel - me.speakingLevel) <= 1.5 && overlap(x.p.days, me.days) && overlap(x.p.times, me.times))
      .sort((a, b) => b.score - a.score).slice(0, 10)
      .map(({ p }) => ({ userId: p.userId, name: firstName(p.userId), speakingLevel: p.speakingLevel, targetBand: p.targetBand,
        commonDays: p.days.filter(d => me.days.includes(d)), commonTimes: p.times.filter(t => me.times.includes(t)), parts: p.parts }));
    send(res, 200, { matches });
  });

  /* ---- Study Rooms ---- */
  const membership = (roomId, userId) => db.find("roomMembers", m => m.roomId === roomId && m.userId === userId && !m.leftAt);
  const roomView = (r, userId) => {
    const me = membership(r.id, userId);
    return { id: r.id, name: r.name, template: r.template, type: r.type, maxMembers: r.maxMembers, createdAt: r.createdAt,
      inviteCode: me && ROLE_PERMS[me.role].includes("invite") ? r.inviteCode : undefined,
      myRole: me?.role, myPermissions: me ? ROLE_PERMS[me.role] : [],
      members: db.filter("roomMembers", m => m.roomId === r.id && !m.leftAt).map(m => ({ userId: m.userId, name: firstName(m.userId), role: m.role })) };
  };
  route("POST", "/api/collab/rooms", async (req, res, { user, body }) => {
    requireRole(user);
    if (db.filter("rooms", r => r.ownerId === user.id && !r.closedAt).length >= 10) fail(400, "Room limit reached (10)");
    const r = db.insert("rooms", { ownerId: user.id, name: str(body.name, "Room name", { min: 2, max: 80 }),
      template: TEMPLATES.includes(body.template) ? body.template : "General IELTS Room",
      type: ROOM_TYPES.includes(body.type) ? body.type : "private",
      maxMembers: Math.min(8, Math.max(2, +body.maxMembers || 4)), inviteCode: crypto.randomBytes(4).toString("hex").toUpperCase(),
      recording: "off" });
    db.insert("roomMembers", { roomId: r.id, userId: user.id, role: "owner" });
    send(res, 201, { room: roomView(r, user.id) });
  });
  route("GET", "/api/collab/rooms", async (req, res, { user }) => {
    requireRole(user);
    const ids = db.filter("roomMembers", m => m.userId === user.id && !m.leftAt).map(m => m.roomId);
    send(res, 200, { rooms: db.filter("rooms", r => ids.includes(r.id) && !r.closedAt).map(r => roomView(r, user.id)), options: { TEMPLATES, ROOM_TYPES, ROLE_PERMS } });
  });
  route("POST", "/api/collab/rooms/join", async (req, res, { user, body }) => {
    requireRole(user);
    const code = str(body.code, "Invite code", { max: 20 }).toUpperCase();
    const r = db.find("rooms", x => x.inviteCode === code && !x.closedAt) || fail(404, "Invalid invite code");
    if (membership(r.id, user.id)) return send(res, 200, { room: roomView(r, user.id) });
    if (db.filter("roomMembers", m => m.roomId === r.id && !m.leftAt).some(m => blocked(m.userId, user.id))) fail(403, "You cannot join this room");
    if (db.filter("roomMembers", m => m.roomId === r.id && !m.leftAt).length >= r.maxMembers) fail(409, "Room is full");
    db.insert("roomMembers", { roomId: r.id, userId: user.id, role: "participant" });
    send(res, 200, { room: roomView(r, user.id) });
  });
  route("POST", "/api/collab/rooms/:id/leave", async (req, res, { user, params }) => {
    requireRole(user);
    const m = membership(params.id, user.id) || fail(404, "Not a member");
    if (m.role === "owner") db.update("rooms", params.id, { closedAt: new Date().toISOString() }); // owner leaving closes the room
    db.update("roomMembers", m.id, { leftAt: new Date().toISOString() });
    send(res, 200, { ok: true });
  });
  route("PUT", "/api/collab/rooms/:id/members/:uid", async (req, res, { user, params, body }) => {
    requireRole(user);
    const me = membership(params.id, user.id);
    if (me?.role !== "owner") fail(403, "Only the owner can change roles");
    if (!["host", "participant", "observer"].includes(body.role)) fail(400, "Unknown role");
    const m = membership(params.id, params.uid) || fail(404, "Member not found");
    if (m.role === "owner") fail(400, "Owner role cannot change");
    db.update("roomMembers", m.id, { role: body.role });
    send(res, 200, { room: roomView(db.find("rooms", r => r.id === params.id), user.id) });
  });

  /* ---- Safety: block, report, moderation queue (§16, §47) ---- */
  route("POST", "/api/collab/blocks", async (req, res, { user, body }) => {
    requireRole(user);
    const target = str(body.userId, "userId", { max: 60 });
    if (target === user.id || !db.find("users", u => u.id === target)) fail(400, "Invalid user");
    if (!db.find("blocks", b => b.userId === user.id && b.blockedId === target)) db.insert("blocks", { userId: user.id, blockedId: target });
    send(res, 200, { ok: true });
  });
  route("POST", "/api/collab/reports", async (req, res, { user, body }) => {
    requireRole(user);
    const r = db.insert("reports", { reporter_id: user.id, reported_user_id: str(body.reportedUserId, "reportedUserId", { max: 60 }),
      room_id: str(body.roomId, "roomId", { optional: true, max: 60 }), session_id: str(body.sessionId, "sessionId", { optional: true, max: 60 }),
      event_type: REPORT_TYPES.includes(body.eventType) ? body.eventType : "other",
      description: str(body.description, "description", { min: 5, max: 2000 }), status: "open", resolution: "", moderator_id: "" });
    send(res, 201, { report: { id: r.id, status: r.status } });
  });
  route("GET", "/api/admin/reports", async (req, res, { user }) => {
    requireRole(user, "moderate");
    send(res, 200, { reports: db.all("reports").slice().reverse().map(r => ({ ...r, reporter: firstName(r.reporter_id), reported: firstName(r.reported_user_id),
      priorReports: db.filter("reports", x => x.reported_user_id === r.reported_user_id).length })) });
  });
  route("PUT", "/api/admin/reports/:id", async (req, res, { user, params, body }) => {
    requireRole(user, "moderate");
    const status = ["open", "reviewing", "resolved", "dismissed"].includes(body.status) ? body.status : fail(400, "Unknown status");
    const r = db.update("reports", params.id, { status, resolution: str(body.resolution, "resolution", { optional: true, max: 1000 }), moderator_id: user.id }) || fail(404, "Not found");
    audit(user, "moderate:" + status, "report:" + r.id, req);
    send(res, 200, { report: r });
  });
};
module.exports.ROLE_PERMS = ROLE_PERMS;
