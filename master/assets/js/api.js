/* API client + header login state. Works gracefully when opened as plain files (no server). */
(function () {
  const root = window.Porchi.root;
  const online = location.protocol.startsWith("http");
  async function call(method, path, body) {
    if (!online) throw new Error("Server চালু নেই — `npm start` দিয়ে চালান।");
    const r = await fetch("/api" + path, {
      method, credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || "Error " + r.status), { status: r.status });
    return j;
  }
  let mePromise;
  const me = () => (mePromise ||= online ? call("GET", "/auth/me").then(j => j.user).catch(() => null) : Promise.resolve(null));
  window.PorchiAPI = { online, call, me, get: p => call("GET", p), post: (p, b) => call("POST", p, b || {}),
    put: (p, b) => call("PUT", p, b), del: p => call("DELETE", p, {}) };

  /* Header slot */
  const nav = document.querySelector(".site-header .nav");
  const slot = document.createElement("span");
  slot.style.cssText = "display:flex;gap:4px;align-items:center";
  nav.append(slot);
  me().then(u => {
    const esc = window.Porchi.esc;
    if (!u) { slot.innerHTML = `<a href="${root}account/index.html" class="btn btn-primary" style="padding:6px 14px;color:#fff">Login</a>`; return; }
    slot.innerHTML = (["teacher", "super_admin"].includes(u.role) ? `<a href="${root}review/index.html">Review</a>` : "") +
      (!["student", "teacher"].includes(u.role) ? `<a href="${root}admin/index.html">Admin</a>` : "") +
      `<a href="${root}account/index.html" title="Account">👤 ${esc(u.name.split(" ")[0])}</a>`;
  });
})();

/* Posts/videos: when the server has published items, they replace the static data/posts.js entries */
window.PorchiAPI.contentReady = (async () => {
  const A = window.PorchiAPI, P = window.PORCHI_POSTS = window.PORCHI_POSTS || { posts: [], videos: [] };
  if (!A.online) return;
  try {
    const [{ posts }, { videos }] = await Promise.all([A.get("/posts"), A.get("/videos")]);
    if (posts.length) P.posts = posts.map(p => ({ ...p, date: (p.publishAt || p.createdAt).slice(0, 10), excerpt: p.excerpt || p.body.slice(0, 140) }));
    if (videos.length) P.videos = videos;
  } catch { /* keep static data */ }
})();
