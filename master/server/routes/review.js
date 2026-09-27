/* AI + human hybrid feedback (Blueprint §33): learner requests review → teacher claims → final report. */
const CRITERIA = {
  writing: ["task_response", "coherence_cohesion", "lexical_resource", "grammar"],
  speaking: ["fluency_coherence", "lexical_resource", "grammar", "pronunciation"]
};
const roundHalf = x => Math.round(x * 2) / 2;

module.exports = ({ route, fail, send, str, requireRole, audit, db }) => {
  const firstName = id => (db.find("users", u => u.id === id)?.name || "Learner").split(" ")[0];
  const reviewable = f => CRITERIA[f.kind];

  route("POST", "/api/me/ai-feedback/:id/request-review", async (req, res, { user, params, body }) => {
    requireRole(user);
    const f = db.find("aiFeedback", x => x.id === params.id && x.userId === user.id) || fail(404, "Not found");
    if (!require("../flags").on("TEACHER_REVIEW_ENABLED")) fail(503, "Teacher review is not available right now");
    if (!reviewable(f)) fail(400, "Only writing and speaking feedback can be reviewed");
    if (f.reviewStatus !== "ai_only") fail(409, "Review already requested");
    if (db.filter("aiFeedback", x => x.userId === user.id && ["requested", "claimed"].includes(x.reviewStatus)).length >= 3) fail(429, "You can have 3 open review requests at a time");
    db.update("aiFeedback", f.id, { reviewStatus: "requested", reviewRequestedAt: new Date().toISOString(),
      learnerNote: str(body.note, "note", { optional: true, max: 300 }) });
    send(res, 200, { ok: true });
  });

  route("GET", "/api/review/queue", async (req, res, { user, query }) => {
    requireRole(user, "review");
    const status = ["requested", "claimed", "reviewed"].includes(query.get("status")) ? query.get("status") : "requested";
    const rows = db.filter("aiFeedback", f => f.reviewStatus === status && (status === "requested" || f.teacherId === user.id))
      .sort((a, b) => String(a.reviewRequestedAt).localeCompare(String(b.reviewRequestedAt)));
    send(res, 200, { items: rows.map(f => ({ id: f.id, kind: f.kind, learner: firstName(f.userId), requestedAt: f.reviewRequestedAt,
      aiBand: f.result.overall ?? null, words: f.result.words ?? null })) });
  });
  route("GET", "/api/review/:id", async (req, res, { user, params }) => {
    requireRole(user, "review");
    const f = db.find("aiFeedback", x => x.id === params.id && reviewable(x) && x.reviewStatus !== "ai_only") || fail(404, "Not found");
    const { userId, ...rest } = f;
    send(res, 200, { item: { ...rest, learner: firstName(userId), criteria: CRITERIA[f.kind] } });
  });
  route("POST", "/api/review/:id/claim", async (req, res, { user, params }) => {
    requireRole(user, "review");
    const f = db.find("aiFeedback", x => x.id === params.id) || fail(404, "Not found");
    if (f.reviewStatus !== "requested") fail(409, "Already claimed");
    db.update("aiFeedback", f.id, { reviewStatus: "claimed", teacherId: user.id, claimedAt: new Date().toISOString() });
    send(res, 200, { ok: true });
  });
  route("PUT", "/api/review/:id", async (req, res, { user, params, body }) => {
    requireRole(user, "review");
    const f = db.find("aiFeedback", x => x.id === params.id) || fail(404, "Not found");
    if (f.reviewStatus !== "claimed" || f.teacherId !== user.id) fail(409, "Claim this review first");
    const bands = {};
    for (const k of CRITERIA[f.kind]) {
      const v = +body.bands?.[k];
      if (!(v >= 0 && v <= 9)) fail(400, `Band for ${k} must be 0–9`);
      bands[k] = roundHalf(v);
    }
    const overall = roundHalf(Object.values(bands).reduce((a, b) => a + b, 0) / 4);
    const teacherReview = { teacherId: user.id, teacher: firstName(user.id), bands, overall,
      comment: str(body.comment, "comment", { min: 10, max: 4000 }), actions: (Array.isArray(body.actions) ? body.actions : []).map(String).filter(Boolean).slice(0, 5),
      reviewedAt: new Date().toISOString() };
    db.update("aiFeedback", f.id, { reviewStatus: "reviewed", teacherReview });
    if (f.input?.attemptId != null) {                                   // final band replaces the AI estimate on the mock report
      const a = db.find("attempts", x => x.id === f.input.attemptId);
      if (a?.report?.sections?.[f.input.sectionIndex]) {
        Object.assign(a.report.sections[f.input.sectionIndex], { band: overall, status: "teacher_reviewed" });
        db.update("attempts", a.id, { report: a.report });
      }
    }
    db.insert("notifications", { userId: f.userId, type: "review_done", title: "শিক্ষকের review এসেছে", body: `${f.kind === "writing" ? "Writing" : "Speaking"} · band ${overall}`, link: `feedback/index.html?id=${f.id}`, read: false });
    audit(user, "review", "aiFeedback:" + f.id, req);
    send(res, 200, { ok: true, overall });
  });
};
module.exports.CRITERIA = CRITERIA;
