/* In-app notifications (Blueprint §38): personal rows + derived items (new content, test date approaching). */
module.exports = ({ route, send, requireRole, db }) => {
  function derived(user) {
    const since = user.profile?.notifSeenAt || user.createdAt, out = [];
    const recent = t => db.filter(t, x => x.status === "published" && (x.publishAt || x.createdAt) > since && (x.publishAt || x.createdAt) <= new Date().toISOString());
    for (const p of recent("posts")) out.push({ id: "post:" + p.id, type: "new_post", title: "নতুন পোস্ট", body: p.title, link: `posts/index.html#${p.id}`, createdAt: p.publishAt || p.createdAt });
    for (const v of recent("videos")) out.push({ id: "video:" + v.id, type: "new_video", title: "নতুন ভিডিও", body: v.title, link: `videos/index.html#${v.id}`, createdAt: v.createdAt });
    for (const m of recent("mocks")) out.push({ id: "mock:" + m.id, type: "new_mock", title: "নতুন mock test", body: m.title, link: "mock-tests/index.html", createdAt: m.createdAt });
    const d = user.profile?.testDate && new Date(user.profile.testDate);
    const days = d ? Math.ceil((d - Date.now()) / 864e5) : null;
    if (days !== null && days >= 0 && days <= 14) out.push({ id: "testdate", type: "test_date", title: "Test date কাছে", body: `আর ${days} দিন বাকি — একটি full mock দাও`, link: "mock-tests/index.html", createdAt: new Date().toISOString(), sticky: true });
    return out;
  }
  route("GET", "/api/me/notifications", async (req, res, { user }) => {
    requireRole(user);
    const personal = db.filter("notifications", n => n.userId === user.id).map(n => ({ ...n, unread: !n.read }));
    const items = [...personal, ...derived(user).map(n => ({ ...n, unread: !n.sticky }))]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50);
    send(res, 200, { items, unread: items.filter(i => i.unread).length });
  });
  route("POST", "/api/me/notifications/read-all", async (req, res, { user }) => {
    requireRole(user);
    for (const n of db.filter("notifications", n => n.userId === user.id && !n.read)) db.update("notifications", n.id, { read: true });
    db.update("users", user.id, { profile: { ...user.profile, notifSeenAt: new Date().toISOString() } });
    send(res, 200, { ok: true });
  });
};
