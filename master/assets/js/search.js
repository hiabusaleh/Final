/* Client-side search over modules, question types, posts, videos (Blueprint §27). Replace with server search later. */
(async function () {
  await window.PorchiAPI.contentReady;
  const D = window.PORCHI_DATA, P = window.PORCHI_POSTS, { esc, root } = window.Porchi;
  const idx = [
    ...D.modules.map(m => ({ kind: "Course", title: m.name, text: m.desc + " " + m.features.join(" "), href: `learn/${m.id}/index.html` })),
    ...Object.entries(D.taxonomy.questionTypes).flatMap(([s, qs]) => qs.map(q =>
      ({ kind: "Practice", title: `${q} (${s})`, text: q, href: `practice/index.html?skill=${s}&type=${encodeURIComponent(q)}` }))),
    ...P.posts.map(p => ({ kind: "Post", title: p.title, text: p.body + " " + p.category, href: `posts/index.html#${p.id}` })),
    ...P.videos.map(v => ({ kind: "Video", title: v.title, text: v.description + " " + v.topic, href: `videos/index.html#${v.id}` }))
  ];
  const input = document.getElementById("q"), out = document.getElementById("results");
  const run = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { out.innerHTML = ""; return; }
    const hits = idx.filter(i => (i.title + " " + i.text).toLowerCase().includes(q));
    out.innerHTML = hits.map(h => `<a class="card" style="margin-bottom:10px;text-decoration:none;color:inherit" href="${root}${h.href}">
      <span class="tag">${h.kind}</span><strong>${esc(h.title)}</strong></a>`).join("") || `<p class="muted">কিছু পাওয়া যায়নি।</p>`;
  };
  input.value = new URLSearchParams(location.search).get("q") || "";
  input.addEventListener("input", run); run();
})();
