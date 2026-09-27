/*
 * Speaking Partner MVP — Phase B (Exclusive Features Plan §8–§15, §53).
 * Invite → accept → 1:1 session (WebRTC, signalled over Server-Sent Events) → structured IELTS prompts → feedback → history.
 * Media flows browser-to-browser; the server only relays small signalling messages and never records audio/video.
 */
const SIGNAL_TYPES = ["offer", "answer", "ice", "state", "bye"];
const RATING_KEYS = ["fluency", "vocabulary", "grammar", "pronunciation"];

module.exports = ({ route, fail, send, str, requireRole, db }) => {
  const firstName = id => (db.find("users", u => u.id === id)?.name || "Learner").split(" ")[0];
  const blocked = (a, b) => db.find("blocks", x => (x.userId === a && x.blockedId === b) || (x.userId === b && x.blockedId === a));
  const other = (s, uid) => (s.userA === uid ? s.userB : s.userA);
  const mySession = (id, uid) => db.find("partnerSessions", s => s.id === id && (s.userA === uid || s.userB === uid)) || fail(404, "Session not found");
  const view = (s, uid) => ({ id: s.id, partner: { id: other(s, uid), name: firstName(other(s, uid)) }, scheduledAt: s.scheduledAt,
    status: s.status, minutes: s.minutes, startedAt: s.startedAt, endedAt: s.endedAt, recording: "off",
    myFeedbackGiven: !!db.find("partnerFeedback", f => f.sessionId === s.id && f.fromId === uid),
    feedbackReceived: (() => { const f = db.find("partnerFeedback", f => f.sessionId === s.id && f.toId === uid); return f && { ratings: f.ratings, positive: f.positive, improve: f.improve }; })() });

  /* ---- requests ---- */
  route("POST", "/api/collab/partner/requests", async (req, res, { user, body }) => {
    requireRole(user);
    const to = str(body.toUserId, "toUserId", { max: 60 });
    const pref = db.find("partnerPrefs", p => p.userId === to && p.enabled);
    if (to === user.id || !pref || blocked(user.id, to)) fail(400, "This learner is not available");
    if (!db.find("partnerPrefs", p => p.userId === user.id && p.enabled)) fail(400, "Enable Speaking Partner first");
    const when = new Date(body.scheduledAt);
    if (isNaN(when) || when < Date.now() - 5 * 60e3 || when > Date.now() + 30 * 864e5) fail(400, "Choose a time within the next 30 days");
    if (db.filter("partnerRequests", r => r.fromId === user.id && r.status === "pending").length >= 5) fail(429, "Too many pending invitations (max 5)");
    const r = db.insert("partnerRequests", { fromId: user.id, toId: to, scheduledAt: when.toISOString(), minutes: [15, 30, 45].includes(+body.minutes) ? +body.minutes : 30,
      note: str(body.note, "note", { optional: true, max: 140 }), status: "pending" });
    send(res, 201, { request: { id: r.id, status: r.status } });
  });
  route("GET", "/api/collab/partner/requests", async (req, res, { user }) => {
    requireRole(user);
    const map = r => ({ id: r.id, from: { id: r.fromId, name: firstName(r.fromId) }, to: { id: r.toId, name: firstName(r.toId) },
      scheduledAt: r.scheduledAt, minutes: r.minutes, note: r.note, status: r.status });
    send(res, 200, {
      incoming: db.filter("partnerRequests", r => r.toId === user.id && r.status === "pending" && !blocked(r.fromId, user.id)).map(map),
      outgoing: db.filter("partnerRequests", r => r.fromId === user.id && r.status === "pending").map(map) });
  });
  route("PUT", "/api/collab/partner/requests/:id", async (req, res, { user, body, params }) => {
    requireRole(user);
    const r = db.find("partnerRequests", x => x.id === params.id && x.status === "pending") || fail(404, "Request not found");
    const action = body.action;
    if (action === "cancel" ? r.fromId !== user.id : r.toId !== user.id) fail(403, "Not allowed");
    if (!["accept", "decline", "cancel"].includes(action)) fail(400, "Unknown action");
    db.update("partnerRequests", r.id, { status: { accept: "accepted", decline: "declined", cancel: "cancelled" }[action] });
    if (action !== "accept") return send(res, 200, { ok: true });
    if (blocked(r.fromId, r.toId)) fail(400, "This learner is not available");
    const s = db.insert("partnerSessions", { requestId: r.id, userA: r.fromId, userB: r.toId, scheduledAt: r.scheduledAt, minutes: r.minutes, status: "scheduled" });
    send(res, 200, { session: view(s, user.id) });
  });

  /* ---- sessions & history ---- */
  route("GET", "/api/collab/partner/sessions", async (req, res, { user }) => {
    requireRole(user);
    send(res, 200, { sessions: db.filter("partnerSessions", s => s.userA === user.id || s.userB === user.id)
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)).map(s => view(s, user.id)) });
  });
  route("GET", "/api/collab/partner/sessions/:id", async (req, res, { user, params }) => {
    requireRole(user);
    send(res, 200, { session: view(mySession(params.id, user.id), user.id), iceServers: ICE_SERVERS });
  });
  route("POST", "/api/collab/partner/sessions/:id/end", async (req, res, { user, params }) => {
    requireRole(user);
    const s = mySession(params.id, user.id);
    if (s.status !== "ended") db.update("partnerSessions", s.id, { status: "ended", endedAt: new Date().toISOString(), endedBy: user.id });
    relay(s.id, user.id, { type: "bye", data: {} });
    send(res, 200, { ok: true });
  });
  route("POST", "/api/collab/partner/sessions/:id/feedback", async (req, res, { user, params, body }) => {
    requireRole(user);
    const s = mySession(params.id, user.id);
    if (s.status !== "ended" && !s.startedAt) fail(400, "Feedback is available after the session");
    if (db.find("partnerFeedback", f => f.sessionId === s.id && f.fromId === user.id)) fail(409, "Feedback already given");
    const rate = v => (v === undefined || v === null || v === "" || isNaN(+v) ? 3 : Math.min(5, Math.max(1, Math.round(+v))));
    const ratings = Object.fromEntries(RATING_KEYS.map(k => [k, rate(body.ratings?.[k])]));
    db.insert("partnerFeedback", { sessionId: s.id, fromId: user.id, toId: other(s, user.id), ratings,
      positive: str(body.positive, "positive", { optional: true, max: 400 }), improve: str(body.improve, "improve", { optional: true, max: 400 }),
      practiseAgain: !!body.practiseAgain });
    send(res, 201, { ok: true });
  });

  /* ---- signalling: SSE down, POST up ---- */
  route("GET", "/api/collab/partner/sessions/:id/events", async (req, res, { user, params }) => {
    requireRole(user);
    const s = mySession(params.id, user.id);
    if (s.status === "ended") fail(410, "Session has ended");
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    const room = channels.get(s.id) || new Map(); channels.set(s.id, room);
    room.get(user.id)?.end();
    room.set(user.id, res);
    const partnerOnline = room.has(other(s, user.id));
    res.write(`event: hello\ndata: ${JSON.stringify({ partnerOnline, polite: user.id === s.userB })}\n\n`);
    if (partnerOnline) relay(s.id, user.id, { type: "joined", data: {} });
    if (!s.startedAt && partnerOnline) db.update("partnerSessions", s.id, { status: "live", startedAt: new Date().toISOString() });
    const ping = setInterval(() => res.write(": ping\n\n"), 25000);
    req.on("close", () => {
      clearInterval(ping);
      if (room.get(user.id) === res) { room.delete(user.id); relay(s.id, user.id, { type: "left", data: {} }); }
      if (!room.size) channels.delete(s.id);
    });
  });
  route("POST", "/api/collab/partner/sessions/:id/signal", async (req, res, { user, params, body }) => {
    requireRole(user);
    const s = mySession(params.id, user.id);
    if (s.status === "ended") fail(410, "Session has ended");
    if (!SIGNAL_TYPES.includes(body.type)) fail(400, "Unknown signal type");
    if (JSON.stringify(body.data || {}).length > 20000) fail(413, "Signal too large");
    send(res, 200, { delivered: relay(s.id, user.id, { type: body.type, data: body.data || {} }) });
  });
};

const channels = new Map(); // sessionId → Map(userId → SSE response)
function relay(sessionId, fromId, msg) {
  let n = 0;
  for (const [uid, res] of channels.get(sessionId) || []) if (uid !== fromId) { res.write(`event: signal\ndata: ${JSON.stringify(msg)}\n\n`); n++; }
  return n > 0;
}
/* STUN is enough for most home networks; add a TURN server here for strict mobile/office networks. */
const ICE_SERVERS = process.env.PORCHI_ICE ? JSON.parse(process.env.PORCHI_ICE) : [{ urls: "stun:stun.l.google.com:19302" }];
