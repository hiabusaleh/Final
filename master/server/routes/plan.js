/* Study plan, today's tasks, saved items (Blueprint §15, §20, §28, §30, §50) */
const planner = require("../planner");
const activity = require("../activity");
const ai = require("../ai/service");

module.exports = ({ route, fail, send, str, requireRole, db, auth }) => {
  route("GET", "/api/me/plan", async (req, res, { user }) => { requireRole(user); send(res, 200, planner.build(user)); });
  route("POST", "/api/me/plan/done", async (req, res, { user, body }) => {
    requireRole(user);
    const taskId = str(body.taskId, "taskId", { max: 40 }), date = new Date().toISOString().slice(0, 10);
    const cur = db.find("planDone", x => x.userId === user.id && x.date === date && x.taskId === taskId);
    body.done === false ? cur && db.remove("planDone", cur.id) : !cur && db.insert("planDone", { userId: user.id, date, taskId });
    if (body.done !== false) activity.mark(user.id);
    send(res, 200, { ok: true });
  });
  /* optional AI advice layered on the rule-based plan */
  route("POST", "/api/me/plan/ai-advice", async (req, res, { user }) => {
    requireRole(user);
    if (auth.limited("ai:" + user.id, 30, 3600e3)) fail(429, "AI limit reached (30 per hour) — try later");
    const p = planner.build(user);
    try { send(res, 200, { result: await ai.createStudyPlan({ plan: p, profile: user.profile || {} }) }); }
    catch (e) { fail(e.status || 502, e.status ? e.message : "AI service error"); }
  });

  /* saved items */
  route("GET", "/api/me/saved", async (req, res, { user }) => {
    requireRole(user);
    send(res, 200, { items: db.filter("saved", s => s.userId === user.id).reverse().map(({ userId, ...s }) => s) });
  });
  route("POST", "/api/me/saved", async (req, res, { user, body }) => {
    requireRole(user);
    const kind = ["post", "video", "question", "lesson", "word"].includes(body.kind) ? body.kind : fail(400, "Unknown kind");
    const refId = str(body.refId, "refId", { max: 80 });
    const existing = db.find("saved", s => s.userId === user.id && s.kind === kind && s.refId === refId);
    if (existing) return send(res, 200, { item: existing });
    if (db.filter("saved", s => s.userId === user.id).length >= 300) fail(400, "Saved list is full (300)");
    const link = str(body.link, "link", { max: 300 });
    if (!/^[a-z0-9-]+\//i.test(link)) fail(400, "Invalid link");
    send(res, 201, { item: db.insert("saved", { userId: user.id, kind, refId, title: str(body.title, "title", { min: 1, max: 160 }), link }) });
  });
  route("DELETE", "/api/me/saved/:id", async (req, res, { user, params }) => {
    requireRole(user);
    db.find("saved", s => s.id === params.id && s.userId === user.id) || fail(404, "Not found");
    db.remove("saved", params.id); send(res, 200, { ok: true });
  });
};
