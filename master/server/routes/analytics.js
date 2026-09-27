/*
 * Privacy-conscious analytics (Blueprint §40): daily aggregate counters only — no IPs, no user IDs, no cookies.
 * Admin report combines counters with learning data (mocks, attempts, mistakes).
 */
const EVENTS = ["pageview", "video_play", "post_share"];

module.exports = ({ route, fail, send, str, requireRole, db, auth }) => {
  const day = () => new Date().toISOString().slice(0, 10);
  function bump(name, key) {
    const d = day(), c = db.find("counters", x => x.date === d && x.name === name && x.key === key);
    c ? db.update("counters", c.id, { count: c.count + 1 }) : db.insert("counters", { date: d, name, key, count: 1 });
  }
  route("POST", "/api/track", async (req, res, { body }) => {
    if (auth.limited("track:" + req.socket.remoteAddress, 300, 3600e3)) return send(res, 202, { ok: false });
    if (!EVENTS.includes(body.name)) fail(400, "Unknown event");
    const key = str(body.key, "key", { max: 120 }).replace(/[?#].*$/, "").replace(/\/index\.html$/, "/") || "/";
    bump(body.name, key);
    send(res, 202, { ok: true });
  });

  route("GET", "/api/admin/analytics", async (req, res, { user }) => {
    requireRole(user, "users");
    const since = d => new Date(Date.now() - d * 864e5).toISOString();
    const days30 = [...Array(30)].map((_, i) => new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10));
    const counters = db.filter("counters", c => c.date >= days30[0]);
    const sum = (name, by) => { const m = {}; for (const c of counters.filter(c => c.name === name)) m[by(c)] = (m[by(c)] || 0) + c.count; return m; };
    const top = (obj, n = 10) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({ key, count }));
    const pv = sum("pageview", c => c.date);
    const mocks = db.filter("attempts", a => a.kind === "mock");
    const done = mocks.filter(a => a.status === "submitted");
    const avg = xs => xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 10) / 10 : null;
    const sectionAvg = {};
    for (const a of done) for (const s of a.report.sections) if (s.band != null) (sectionAvg[s.skill] ||= []).push(s.band);
    const missed = {};
    for (const m of db.all("mistakes")) { const k = `${m.module}: ${m.question_type}`; missed[k] = (missed[k] || 0) + 1; }
    const active = d => new Set(db.filter("attempts", a => a.createdAt >= since(d)).map(a => a.userId)).size;
    send(res, 200, {
      users: { total: db.all("users").length, new7: db.filter("users", u => u.createdAt >= since(7)).length, active7: active(7), active30: active(30) },
      pageviews: days30.map(d => ({ date: d, count: pv[d] || 0 })),
      topPages: top(sum("pageview", c => c.key)),
      mocks: { started: mocks.length, completed: done.length, sectionAverages: Object.fromEntries(Object.entries(sectionAvg).map(([k, v]) => [k, avg(v)])) },
      topWeaknesses: top(missed, 20),
      topVideos: top(sum("video_play", c => c.key)),
      topShares: top(sum("post_share", c => c.key)),
      practiceAttempts: db.filter("attempts", a => a.kind === "practice").length,
      aiFeedback: db.all("aiFeedback").length, reviewsDone: db.filter("aiFeedback", f => f.reviewStatus === "reviewed").length
    });
  });
};
