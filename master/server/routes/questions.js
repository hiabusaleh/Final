/*
 * Question bank, practice marking and mistake book (Blueprint §10, §13, §14, §25, §47).
 * Answers never leave the server until the learner submits.
 */
const SKILLS = ["listening", "reading", "writing", "speaking"];
const DIFFICULTY = ["Foundation", "Easy", "Medium", "Hard", "Band-focused"];
const STATUSES = ["draft", "published", "archived"];
const LICENSE = ["original", "licensed", "permission_pending", "unknown"];
const MISTAKE_TYPES = ["Unclassified", "Vocabulary", "Paraphrase", "Grammar", "Spelling", "Attention", "Distractor",
  "Wrong location", "Misinterpretation", "Timing", "Question-type strategy"];

const norm = s => String(s ?? "").toLowerCase().replace(/[’']/g, "'").replace(/[.,;:!?"]/g, "").replace(/\s+/g, " ").trim();
const words = s => norm(s).split(" ").filter(Boolean).length;

function mark(q, answer) {
  const given = Array.isArray(answer) ? answer.map(norm).sort().join("|") : norm(answer);
  if (!given) return false;
  if (q.word_limit && !Array.isArray(answer) && words(answer) > q.word_limit) return false;
  const accepted = [q.correct_answer, ...(q.acceptable_answers || [])]
    .map(a => Array.isArray(a) ? a.map(norm).sort().join("|") : norm(a));
  return accepted.includes(given);
}

module.exports = ({ route, fail, send, str, requireRole, audit, db }) => {
  const list = (v, name) => { if (v == null || v === "") return []; if (!Array.isArray(v)) fail(400, `${name} must be a JSON list`); return v.map(String).slice(0, 30); };
  const licence = b => ({
    source_type: str(b.source_type, "source_type", { optional: true, max: 60 }) || "original",
    source_url: str(b.source_url, "source_url", { optional: true, max: 500 }),
    author: str(b.author, "author", { optional: true, max: 120 }),
    license_status: LICENSE.includes(b.license_status) ? b.license_status : "original",
    commercial_use_allowed: b.commercial_use_allowed !== false
  });

  function cleanQuestion(b) {
    const q = {
      exam_type: str(b.exam_type, "exam_type", { optional: true, max: 40 }) || "any",
      module: SKILLS.includes(b.module) ? b.module : fail(400, "module must be listening/reading/writing/speaking"),
      section: str(b.section, "section", { optional: true, max: 40 }),
      part: str(b.part, "part", { optional: true, max: 40 }),
      question_type: str(b.question_type, "question_type", { min: 2, max: 80 }),
      question_number: +b.question_number || 0,
      prompt: str(b.prompt, "prompt", { min: 1, max: 4000 }),
      passage_id: str(b.passage_id, "passage_id", { optional: true, max: 60 }),
      audio_id: str(b.audio_id, "audio_id", { optional: true, max: 300 }),
      options: list(b.options, "options"),
      correct_answer: Array.isArray(b.correct_answer) ? b.correct_answer.map(String) : str(String(b.correct_answer ?? ""), "correct_answer", { min: 1, max: 300 }),
      acceptable_answers: list(b.acceptable_answers, "acceptable_answers"),
      word_limit: +b.word_limit || 0,
      explanation: str(b.explanation, "explanation", { optional: true, max: 4000 }),
      skill_tag: str(b.skill_tag, "skill_tag", { optional: true, max: 60 }),
      subskill_tag: str(b.subskill_tag, "subskill_tag", { optional: true, max: 60 }),
      difficulty: DIFFICULTY.includes(b.difficulty) ? b.difficulty : "Medium",
      exam_version: str(b.exam_version, "exam_version", { optional: true, max: 40 }) || "IELTS_FORMAT_2026_V1",
      status: STATUSES.includes(b.status) ? b.status : "draft",
      ...licence(b)
    };
    if (q.passage_id && !db.find("passages", p => p.id === q.passage_id)) fail(400, "passage_id not found");
    if (q.status === "published" && !["original", "licensed"].includes(q.license_status)) fail(400, "Only original or licensed content can be published");
    return q;
  }
  function cleanPassage(b) {
    const p = { title: str(b.title, "title", { min: 2, max: 200 }), module: SKILLS.includes(b.module) ? b.module : "reading",
      text: str(b.text, "text", { min: 20, max: 30000 }), status: STATUSES.includes(b.status) ? b.status : "draft", ...licence(b) };
    if (p.status === "published" && !["original", "licensed"].includes(p.license_status)) fail(400, "Only original or licensed content can be published");
    return p;
  }

  /* ---- admin CRUD with content versioning ---- */
  for (const [table, clean] of [["questions", cleanQuestion], ["passages", cleanPassage]]) {
    route("GET", `/api/admin/${table}`, async (req, res, { user }) => {
      requireRole(user, "questions");
      send(res, 200, { [table]: db.all(table).map(({ history, ...x }) => x).reverse(),
        meta: { SKILLS, DIFFICULTY, STATUSES, LICENSE, passages: db.all("passages").map(p => ({ id: p.id, title: p.title })) } });
    });
    route("POST", `/api/admin/${table}`, async (req, res, { user, body }) => {
      requireRole(user, "questions");
      const row = db.insert(table, { ...clean(body), version: 1, history: [] });
      audit(user, "create", `${table}:${row.id}`, req);
      send(res, 201, { item: row });
    });
    route("PUT", `/api/admin/${table}/:id`, async (req, res, { user, body, params }) => {
      requireRole(user, "questions");
      const old = db.find(table, x => x.id === params.id) || fail(404, "Not found");
      const { history = [], ...snapshot } = old;            // keep previous version: old attempts stay reproducible
      const row = db.update(table, old.id, { ...clean(body), version: (old.version || 1) + 1, history: [...history, snapshot] });
      audit(user, "update:v" + row.version, `${table}:${row.id}`, req);
      send(res, 200, { item: row });
    });
    route("DELETE", `/api/admin/${table}/:id`, async (req, res, { user, params }) => {
      requireRole(user, "questions");
      // soft delete keeps historical attempts valid
      const row = db.update(table, params.id, { status: "archived" }) || fail(404, "Not found");
      audit(user, "archive", `${table}:${row.id}`, req);
      send(res, 200, { ok: true });
    });
  }

  /* ---- public practice ---- */
  const publicQ = ({ correct_answer, acceptable_answers, explanation, history, source_url, permission_reference, ...q }) => q;

  route("GET", "/api/practice", async (req, res, { query }) => {
    const skill = query.get("skill"), type = query.get("type"), diff = query.get("difficulty");
    const limit = Math.min(20, +query.get("limit") || 10), offset = Math.max(0, +query.get("offset") || 0), random = query.get("random") === "1";
    const all = db.filter("questions", q => q.status === "published" && (!skill || q.module === skill)
      && (!type || type === "All" || q.question_type === type) && (!diff || diff === "Any" || q.difficulty === diff))
      .sort((a, b) => String(a.passage_id).localeCompare(String(b.passage_id)) || a.question_number - b.question_number);
    if (random) for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    const page = random ? all.slice(0, limit).sort((a, b) => String(a.passage_id).localeCompare(String(b.passage_id)) || a.question_number - b.question_number) : all.slice(offset, offset + limit);
    const pids = [...new Set(page.map(q => q.passage_id).filter(Boolean))];
    send(res, 200, { total: all.length, questions: page.map(publicQ),
      passages: db.filter("passages", p => pids.includes(p.id)).map(({ history, ...p }) => p) });
  });

  route("POST", "/api/practice/check", async (req, res, { user, body }) => {
    if (!Array.isArray(body.answers) || body.answers.length > 60) fail(400, "answers must be a list (max 60)");
    const results = body.answers.map(a => {
      const q = db.find("questions", x => x.id === a.id && x.status === "published");
      if (!q) return { id: a.id, error: "not found" };
      return { id: q.id, version: q.version, question_type: q.question_type, module: q.module, given: a.answer,
        correct: mark(q, a.answer), correct_answer: q.correct_answer, explanation: q.explanation };
    }).filter(r => !r.error);
    const score = results.filter(r => r.correct).length;
    if (user) {
      require("../activity").mark(user.id);
      const attempt = db.insert("attempts", { userId: user.id, kind: "practice", seconds: +body.seconds || 0,
        items: results.map(({ explanation, ...r }) => r), score, total: results.length });
      for (const r of results.filter(r => !r.correct)) {
        db.insert("mistakes", { userId: user.id, attemptId: attempt.id, questionId: r.id, questionVersion: r.version,
          module: r.module, question_type: r.question_type, given: r.given, category: "Unclassified", reviewed: false });
      }
    }
    send(res, 200, { score, total: results.length, results, saved: !!user });
  });

  /* ---- mistake book & stats ---- */
  route("GET", "/api/me/mistakes", async (req, res, { user }) => {
    requireRole(user);
    const rows = db.filter("mistakes", m => m.userId === user.id).reverse().slice(0, 200).map(m => {
      const q = db.find("questions", x => x.id === m.questionId);
      const v = q && (q.version === m.questionVersion ? q : (q.history || []).find(h => h.version === m.questionVersion)) || q;
      return { ...m, prompt: v?.prompt, correct_answer: v?.correct_answer, explanation: v?.explanation };
    });
    send(res, 200, { mistakes: rows, categories: MISTAKE_TYPES });
  });
  route("PUT", "/api/me/mistakes/:id", async (req, res, { user, body, params }) => {
    requireRole(user);
    const m = db.find("mistakes", x => x.id === params.id && x.userId === user.id) || fail(404, "Not found");
    const patch = {};
    if (body.category !== undefined) patch.category = MISTAKE_TYPES.includes(body.category) ? body.category : fail(400, "Unknown category");
    if (body.reviewed !== undefined) patch.reviewed = !!body.reviewed;
    send(res, 200, { mistake: db.update("mistakes", m.id, patch) });
  });
  route("GET", "/api/me/stats", async (req, res, { user }) => {
    requireRole(user);
    const byType = {};
    let attempted = 0, correct = 0;
    for (const a of db.filter("attempts", x => x.userId === user.id)) for (const i of a.items || []) {
      const k = `${i.module}: ${i.question_type}`;
      byType[k] ||= { attempted: 0, correct: 0 };
      byType[k].attempted++; attempted++;
      if (i.correct) { byType[k].correct++; correct++; }
    }
    send(res, 200, { attempted, correct, byType, openMistakes: db.filter("mistakes", m => m.userId === user.id && !m.reviewed).length });
  });
};
module.exports.mark = mark;
