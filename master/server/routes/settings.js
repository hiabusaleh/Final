/* Feature flags, data export, server-side search (Blueprint §27, §44, §46) */
const fs = require("fs"), path = require("path"), vm = require("vm");
const flags = require("../flags");

/* read the static learning data (same files the pages use) */
function staticData(file, key) {
  try { const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "..", "data", file), "utf8"), ctx); return ctx.window[key] || []; }
  catch { return []; }
}

module.exports = ({ route, fail, send, str, requireRole, audit, db }) => {
  route("GET", "/api/flags", async (req, res) => send(res, 200, { flags: flags.all() }));
  route("PUT", "/api/admin/flags", async (req, res, { user, body }) => {
    requireRole(user, "users");
    const value = flags.set(body.flags || {});
    audit(user, "flags:" + Object.entries(value).map(([k, v]) => k + "=" + v).join(","), "settings:flags", req);
    send(res, 200, { flags: value });
  });

  /* account export — everything we hold about the learner (recordings listed; audio downloadable separately) */
  route("GET", "/api/me/export", async (req, res, { user }) => {
    requireRole(user);
    const mine = (t, key = "userId") => db.filter(t, x => x[key] === user.id);
    const { passwordHash, ...account } = user;
    const data = { exportedAt: new Date().toISOString(), account,
      attempts: mine("attempts"), mistakes: mine("mistakes"), aiFeedback: mine("aiFeedback"),
      recordings: mine("recordings").map(({ file, ...r }) => r), vocabProgress: mine("vocabProgress"), vocabCustom: mine("vocabCustom"),
      activity: mine("activity"), saved: mine("saved"), notifications: mine("notifications"), partnerPrefs: mine("partnerPrefs"),
      partnerSessions: db.filter("partnerSessions", s => s.userA === user.id || s.userB === user.id).map(({ userA, userB, ...s }) => s),
      partnerFeedbackGiven: mine("partnerFeedback", "fromId"), partnerFeedbackReceived: mine("partnerFeedback", "toId").map(({ fromId, ...f }) => f) };
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="porchi-export-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store" });
    res.end(JSON.stringify(data, null, 2));
  });

  /* search across content — answers are never searchable */
  route("GET", "/api/search", async (req, res, { query }) => {
    const q = String(query.get("q") || "").trim().toLowerCase().slice(0, 80);
    if (q.length < 2) return send(res, 200, { results: [] });
    const hit = (...xs) => xs.filter(Boolean).join(" ").toLowerCase().includes(q);
    const out = [];
    for (const p of db.filter("posts", x => x.status === "published" && hit(x.title, x.body, x.category))) out.push({ kind: "Post", title: p.title, href: `posts/index.html#${p.id}` });
    for (const v of db.filter("videos", x => x.status === "published" && hit(x.title, x.description, x.topic, x.skill))) out.push({ kind: "Video", title: v.title, href: `videos/index.html#${v.id}` });
    const types = new Map();
    for (const qn of db.filter("questions", x => x.status === "published" && hit(x.question_type, x.subskill_tag))) types.set(qn.module + "|" + qn.question_type, qn);
    for (const [, qn] of types) out.push({ kind: "Practice", title: `${qn.question_type} (${qn.module})`, href: `practice/index.html?skill=${qn.module}&type=${encodeURIComponent(qn.question_type)}` });
    for (const p of db.filter("passages", x => x.status === "published" && hit(x.title, x.text))) out.push({ kind: "Passage", title: p.title, href: `practice/index.html?skill=${p.module}` });
    for (const m of db.filter("mocks", x => x.status === "published" && hit(x.title, x.description))) out.push({ kind: "Mock test", title: m.title, href: "mock-tests/index.html" });
    for (const w of staticData("vocab.js", "PORCHI_VOCAB").filter(w => hit(w.word, w.en, w.bn, w.topic))) out.push({ kind: "Vocabulary", title: `${w.word} — ${w.en}`, href: "vocabulary/index.html" });
    for (const g of staticData("grammar.js", "PORCHI_GRAMMAR").filter(g => hit(g.topic, g.lesson, g.use))) out.push({ kind: "Grammar", title: g.topic, href: `grammar/index.html#${g.id}` });
    for (const g of staticData("guides.js", "PORCHI_GUIDES").filter(g => hit(g.title, g.summary, g.keywords))) out.push({ kind: "Guide", title: g.title, href: g.path + "index.html" });
    send(res, 200, { results: out.slice(0, 50) });
  });
};
