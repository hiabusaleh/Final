/* Mock test engine: definitions → attempt → scoring → report → recommendations (Blueprint §8–§12) */
const { bandFor, overall, rulesetFor, SCORING_VERSION } = require("../scoring/rulesets");
const { mark } = require("./questions");
const PROFILES = { "ielts-academic": "academic", "ielts-general": "general", "ielts-ukvi-academic": "academic", "ielts-ukvi-general": "general" };
const MODES = ["familiarisation", "section", "mini", "full", "focused"];
const SKILLS = ["listening", "reading", "writing", "speaking"];

module.exports = ({ route, fail, send, str, requireRole, audit, db }) => {
  function cleanMock(b) {
    if (!Array.isArray(b.sections) || !b.sections.length) fail(400, 'sections must be a JSON list, e.g. [{"skill":"reading","minutes":20,"questionIds":["…"]}]');
    const sections = b.sections.map((s, i) => {
      if (!SKILLS.includes(s.skill)) fail(400, `Section ${i + 1}: unknown skill`);
      const questionIds = Array.isArray(s.questionIds) ? s.questionIds.map(String) : [];
      for (const q of questionIds) if (!db.find("questions", x => x.id === q)) fail(400, `Section ${i + 1}: question ${q} not found`);
      if (["writing", "speaking"].includes(s.skill) ? !s.task : !questionIds.length) fail(400, `Section ${i + 1}: needs ${s.skill === "writing" || s.skill === "speaking" ? "task" : "questionIds"}`);
      return { skill: s.skill, minutes: Math.max(1, Math.min(180, +s.minutes || 20)), questionIds,
        task: s.task ? String(s.task).slice(0, 3000) : "", minWords: +s.minWords || 0 };
    });
    return {
      title: str(b.title, "title", { min: 2, max: 160 }),
      test_profile: PROFILES[b.test_profile] ? b.test_profile : "ielts-academic",
      mode: MODES.includes(b.mode) ? b.mode : "mini",
      description: str(b.description, "description", { optional: true, max: 1000 }),
      sections, exam_version: str(b.exam_version, "exam_version", { optional: true, max: 40 }) || "IELTS_FORMAT_2026_V1",
      status: ["draft", "published", "archived"].includes(b.status) ? b.status : "draft"
    };
  }

  route("GET", "/api/admin/mocks", async (req, res, { user }) => {
    requireRole(user, "questions");
    send(res, 200, { mocks: db.all("mocks").map(({ history, ...m }) => m).reverse(), meta: { PROFILES: Object.keys(PROFILES), MODES } });
  });
  route("POST", "/api/admin/mocks", async (req, res, { user, body }) => {
    requireRole(user, "questions");
    const m = db.insert("mocks", { ...cleanMock(body), version: 1, history: [] });
    audit(user, "create", "mocks:" + m.id, req); send(res, 201, { item: m });
  });
  route("PUT", "/api/admin/mocks/:id", async (req, res, { user, body, params }) => {
    requireRole(user, "questions");
    const old = db.find("mocks", x => x.id === params.id) || fail(404, "Not found");
    const { history = [], ...snap } = old;
    const m = db.update("mocks", old.id, { ...cleanMock(body), version: (old.version || 1) + 1, history: [...history, snap] });
    audit(user, "update:v" + m.version, "mocks:" + m.id, req); send(res, 200, { item: m });
  });
  route("DELETE", "/api/admin/mocks/:id", async (req, res, { user, params }) => {
    requireRole(user, "questions");
    db.update("mocks", params.id, { status: "archived" }) || fail(404, "Not found");
    audit(user, "archive", "mocks:" + params.id, req); send(res, 200, { ok: true });
  });

  /* public list */
  route("GET", "/api/mocks", async (req, res) => {
    send(res, 200, { mocks: db.filter("mocks", m => m.status === "published").map(m => ({ id: m.id, title: m.title, mode: m.mode,
      test_profile: m.test_profile, description: m.description,
      minutes: m.sections.reduce((a, s) => a + s.minutes, 0),
      sections: m.sections.map(s => ({ skill: s.skill, minutes: s.minutes, count: s.questionIds.length })) })) });
  });

  /* start: snapshot versions so the attempt stays reproducible */
  route("POST", "/api/mocks/:id/start", async (req, res, { user, params }) => {
    requireRole(user);
    const m = db.find("mocks", x => x.id === params.id && x.status === "published") || fail(404, "Mock not found");
    const qs = m.sections.flatMap(s => s.questionIds).map(id => db.find("questions", q => q.id === id)).filter(Boolean);
    const attempt = db.insert("attempts", { userId: user.id, kind: "mock", mockId: m.id, mockVersion: m.version, status: "in_progress",
      startedAt: new Date().toISOString(), questionVersions: Object.fromEntries(qs.map(q => [q.id, q.version])) });
    const pids = [...new Set(qs.map(q => q.passage_id).filter(Boolean))];
    send(res, 201, { attempt: { id: attempt.id }, mock: { id: m.id, title: m.title, mode: m.mode, sections: m.sections },
      questions: qs.map(({ correct_answer, acceptable_answers, explanation, history, ...q }) => q),
      passages: db.filter("passages", p => pids.includes(p.id)).map(({ history, ...p }) => p) });
  });

  const questionAt = (id, version) => {
    const q = db.find("questions", x => x.id === id);
    return q && (q.version === version ? q : (q.history || []).find(h => h.version === version) || q);
  };

  route("POST", "/api/attempts/:id/submit", async (req, res, { user, body, params }) => {
    requireRole(user);
    const a = db.find("attempts", x => x.id === params.id && x.userId === user.id && x.kind === "mock") || fail(404, "Attempt not found");
    if (a.status !== "in_progress") fail(409, "Already submitted");
    const m = db.find("mocks", x => x.id === a.mockId);
    const mock = m.version === a.mockVersion ? m : (m.history || []).find(h => h.version === a.mockVersion) || m;
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    const variant = PROFILES[mock.test_profile];
    const items = [], sections = [];
    for (const s of mock.sections) {
      if (s.skill === "writing" || s.skill === "speaking") {
        const response = String(answers["task:" + mock.sections.indexOf(s)] || "").slice(0, 20000);
        sections.push({ skill: s.skill, response, words: response.trim().split(/\s+/).filter(Boolean).length, band: null, status: "pending_review" });
        continue;
      }
      let raw = 0;
      for (const qid of s.questionIds) {
        const q = questionAt(qid, a.questionVersions[qid]); if (!q) continue;
        const correct = mark(q, answers[qid]);
        raw += correct;
        items.push({ id: qid, version: q.version, module: q.module, question_type: q.question_type, question_number: q.question_number,
          given: answers[qid] ?? "", correct, correct_answer: q.correct_answer, explanation: q.explanation });
      }
      sections.push({ skill: s.skill, ...bandFor(rulesetFor(s.skill, variant), raw, s.questionIds.length) });
    }
    const byType = {};
    for (const i of items) { const t = (byType[i.question_type] ||= { attempted: 0, correct: 0, module: i.module }); t.attempted++; t.correct += i.correct; }
    const ranked = Object.entries(byType).map(([type, v]) => ({ type, ...v, accuracy: v.correct / v.attempted })).sort((x, y) => x.accuracy - y.accuracy);
    const bands = sections.filter(s => s.band != null).map(s => s.band);
    const report = {
      scoringVersion: SCORING_VERSION, sections,
      overall: overall(bands),
      raw: items.filter(i => i.correct).length, total: items.length,
      seconds: Math.max(0, Math.min(6 * 3600, +body.seconds || 0)),
      strong: ranked.filter(r => r.accuracy >= 0.75).map(r => r.type),
      needsWork: ranked.filter(r => r.accuracy < 0.6).map(r => r.type),
      byType: ranked,
      recommendations: ranked.filter(r => r.accuracy < 0.6).slice(0, 3).map(r => ({ type: r.type, module: r.module,
        steps: ["Course lesson: " + r.type, "15–20 targeted questions", "Mistake Book review", "Retry after 48 hours"] }))
    };
    require("../activity").mark(user.id);
    db.update("attempts", a.id, { status: "submitted", submittedAt: new Date().toISOString(), items, report, score: report.raw, total: report.total });
    for (const i of items.filter(i => !i.correct)) db.insert("mistakes", { userId: user.id, attemptId: a.id, questionId: i.id, questionVersion: i.version,
      module: i.module, question_type: i.question_type, given: i.given, category: "Unclassified", reviewed: false });
    send(res, 200, { attemptId: a.id });
  });

  route("GET", "/api/attempts/:id", async (req, res, { user, params }) => {
    requireRole(user);
    const a = db.find("attempts", x => x.id === params.id && x.userId === user.id && x.kind === "mock") || fail(404, "Attempt not found");
    const m = db.find("mocks", x => x.id === a.mockId);
    send(res, 200, { attempt: { ...a, mockTitle: m?.title } });
  });
  route("GET", "/api/me/attempts", async (req, res, { user }) => {
    requireRole(user);
    send(res, 200, { attempts: db.filter("attempts", x => x.userId === user.id && x.kind === "mock" && x.status === "submitted").reverse()
      .map(a => ({ id: a.id, mockTitle: db.find("mocks", m => m.id === a.mockId)?.title, submittedAt: a.submittedAt, overall: a.report.overall,
        sections: a.report.sections.map(s => ({ skill: s.skill, band: s.band })) })) });
  });
};
