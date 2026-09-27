/* Vocabulary flashcards with Leitner spaced review, personal words, and study streak (Blueprint §29, §31, §32). */
const activity = require("../activity");
const INTERVALS = [0, 1, 3, 7, 16, 35]; // days until next review for boxes 0..5

function nextState(cur, result) {
  let box = cur?.box ?? 0;
  box = result === "again" ? 1 : result === "easy" ? Math.min(5, box + 2) : Math.min(5, box + 1);
  return { box, due: new Date(Date.now() + INTERVALS[box] * 864e5).toISOString().slice(0, 10), reviews: (cur?.reviews || 0) + 1 };
}

module.exports = ({ route, fail, send, str, requireRole, db, auth }) => {
  route("GET", "/api/me/vocab", async (req, res, { user }) => {
    requireRole(user);
    const progress = Object.fromEntries(db.filter("vocabProgress", p => p.userId === user.id).map(p => [p.wordId, { box: p.box, due: p.due, reviews: p.reviews }]));
    send(res, 200, { progress, custom: db.filter("vocabCustom", c => c.userId === user.id).map(({ userId, ...c }) => c) });
  });
  route("POST", "/api/me/vocab/review", async (req, res, { user, body }) => {
    requireRole(user);
    const wordId = str(body.wordId, "wordId", { max: 60 });
    if (!["again", "good", "easy"].includes(body.result)) fail(400, "result must be again/good/easy");
    const cur = db.find("vocabProgress", p => p.userId === user.id && p.wordId === wordId);
    const next = nextState(cur, body.result);
    cur ? db.update("vocabProgress", cur.id, next) : db.insert("vocabProgress", { userId: user.id, wordId, ...next });
    activity.mark(user.id);
    send(res, 200, { state: next });
  });
  route("POST", "/api/me/vocab/custom", async (req, res, { user, body }) => {
    requireRole(user);
    if (db.filter("vocabCustom", c => c.userId === user.id).length >= 500) fail(400, "Personal word limit reached (500)");
    const c = db.insert("vocabCustom", { userId: user.id, word: str(body.word, "Word", { min: 1, max: 60 }),
      en: str(body.en, "Meaning", { optional: true, max: 200 }), bn: str(body.bn, "বাংলা অর্থ", { optional: true, max: 200 }),
      example: str(body.example, "Example", { optional: true, max: 300 }) });
    send(res, 201, { word: { id: c.id, word: c.word, en: c.en, bn: c.bn, example: c.example } });
  });
  route("DELETE", "/api/me/vocab/custom/:id", async (req, res, { user, params }) => {
    requireRole(user);
    db.find("vocabCustom", c => c.id === params.id && c.userId === user.id) || fail(404, "Not found");
    db.remove("vocabCustom", params.id); db.removeWhere("vocabProgress", p => p.userId === user.id && p.wordId === params.id);
    send(res, 200, { ok: true });
  });

  /* streak + client-only activities (grammar quiz, micro drills) */
  route("POST", "/api/me/activity", async (req, res, { user, body }) => {
    requireRole(user);
    if (!["grammar", "micro", "vocab_quiz", "recorder"].includes(body.kind)) fail(400, "Unknown activity");
    activity.mark(user.id);
    send(res, 200, { streak: activity.streak(user.id) });
  });
  route("GET", "/api/me/streak", async (req, res, { user }) => { requireRole(user); send(res, 200, activity.streak(user.id)); });
};
module.exports.nextState = nextState;
