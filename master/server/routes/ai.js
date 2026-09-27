/* AI Teacher endpoints (Blueprint §16, §33). All outputs are stored and labelled as AI estimates, open to later human review. */
const ai = require("../ai/service");

module.exports = ({ route, fail, send, str, requireRole, db, auth }) => {
  const limit = user => { if (auth.limited("ai:" + user.id, 30, 60 * 60e3)) fail(429, "AI limit reached (30 per hour) — try later"); };
  const run = async fn => { try { return await fn(); } catch (e) { if (e.status) fail(e.status, e.message); console.error(e); fail(502, "AI service error"); } };
  const save = (user, kind, input, result, extra = {}) =>
    (require("../activity").mark(user.id), db.insert("aiFeedback", { userId: user.id, kind, input, result, reviewStatus: "ai_only", ...extra })); // teacher review can be added later

  route("GET", "/api/ai/status", async (req, res) => send(res, 200, ai.status()));

  /* Explain a question the learner has already attempted (prevents answer fishing) */
  route("POST", "/api/ai/explain", async (req, res, { user, body }) => {
    requireRole(user); limit(user);
    const qid = str(body.questionId, "questionId", { max: 60 });
    const attempted = db.filter("attempts", a => a.userId === user.id && a.status !== "in_progress").some(a => (a.items || []).some(i => i.id === qid));
    if (!attempted) fail(403, "Answer the question first, then ask for an explanation");
    const question = db.find("questions", q => q.id === qid) || fail(404, "Question not found");
    const passage = question.passage_id && db.find("passages", p => p.id === question.passage_id);
    const result = await run(() => ai.explainQuestion({ question, passage, given: body.given }));
    save(user, "explain", { questionId: qid, given: body.given }, result);
    send(res, 200, { result });
  });

  /* Writing feedback — free text, or a writing section from one of the learner's mock attempts */
  route("POST", "/api/ai/writing", async (req, res, { user, body }) => {
    requireRole(user); limit(user);
    let task, response, attempt, sectionIndex;
    if (body.attemptId) {
      attempt = db.find("attempts", a => a.id === body.attemptId && a.userId === user.id && a.status === "submitted") || fail(404, "Attempt not found");
      sectionIndex = attempt.report.sections.findIndex((s, i) => s.skill === "writing" && i === +body.sectionIndex);
      if (sectionIndex < 0) fail(400, "No writing section there");
      const mock = db.find("mocks", m => m.id === attempt.mockId);
      const def = (mock.version === attempt.mockVersion ? mock : (mock.history || []).find(h => h.version === attempt.mockVersion) || mock).sections[sectionIndex];
      task = def.task; response = attempt.report.sections[sectionIndex].response;
    } else {
      task = str(body.task, "Task", { min: 10, max: 3000 });
      response = str(body.response, "Response", { min: 1, max: 12000 });
    }
    const words = String(response).trim().split(/\s+/).filter(Boolean).length;
    if (words < 50) fail(400, "Write at least 50 words for useful feedback");
    const result = await run(() => ai.gradeWriting({ task, response, taskType: body.taskType === "Task 1" ? "Task 1" : "Task 2" }));
    const fb = save(user, "writing", { task, response, attemptId: attempt?.id, sectionIndex }, result);
    if (attempt) {
      attempt.report.sections[sectionIndex] = { ...attempt.report.sections[sectionIndex], band: result.overall, status: "ai_estimated", aiFeedbackId: fb.id };
      db.update("attempts", attempt.id, { report: attempt.report });
    }
    send(res, 200, { result, id: fb.id });
  });

  route("POST", "/api/ai/speaking", async (req, res, { user, body }) => {
    requireRole(user); limit(user);
    const prompt = str(body.prompt, "Prompt", { min: 5, max: 2000 }), transcript = str(body.transcript, "Transcript", { min: 20, max: 8000 });
    const result = await run(() => ai.analyzeSpeaking({ prompt, transcript, part: ["Part 1", "Part 2", "Part 3"].includes(body.part) ? body.part : "Part 2" }));
    let audioId;
    if (body.recordingId) audioId = (db.find("recordings", r => r.id === body.recordingId && r.userId === user.id) || fail(404, "Recording not found")).id;
    const fb = save(user, "speaking", { prompt, transcript, audioId, part: body.part }, result);
    send(res, 200, { result, id: fb.id });
  });

  route("POST", "/api/ai/chat", async (req, res, { user, body }) => {
    requireRole(user); limit(user);
    if (!Array.isArray(body.messages) || !body.messages.length) fail(400, "messages required");
    const messages = body.messages.slice(-20).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: str(m.content, "message", { min: 1, max: 4000 }) }));
    if (messages[messages.length - 1].role !== "user") fail(400, "Last message must be from the learner");
    const d = user.profile?.diagnostic;
    const result = await run(() => ai.chat({ messages, learner: { targetBand: user.profile?.targetBand, testType: user.profile?.testType, weaknesses: d?.weaknesses } }));
    send(res, 200, { result });
  });

  route("GET", "/api/me/ai-feedback", async (req, res, { user }) => {
    requireRole(user);
    send(res, 200, { items: db.filter("aiFeedback", f => f.userId === user.id).reverse().slice(0, 50)
      .map(f => ({ id: f.id, kind: f.kind, createdAt: f.createdAt, overall: f.result.overall, reviewStatus: f.reviewStatus })) });
  });
  route("GET", "/api/me/ai-feedback/:id", async (req, res, { user, params }) => {
    requireRole(user);
    send(res, 200, { item: db.find("aiFeedback", f => f.id === params.id && f.userId === user.id) || fail(404, "Not found") });
  });
};
