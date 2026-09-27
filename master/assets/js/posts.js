/* Admin-published posts with category filter + social share (Blueprint §17) */
(function () {
  const { posts } = window.PORCHI_POSTS, { esc } = window.Porchi;
  const cats = ["All", ...new Set(posts.map(p => p.category))];
  let active = "All";
  const share = p => {
    const url = encodeURIComponent(location.href.split("#")[0] + "#" + p.id), t = encodeURIComponent(p.title);
    return `<div class="btn-row" style="margin-top:8px">
      <a class="tag" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${url}">Facebook</a>
      <a class="tag" target="_blank" rel="noopener" href="https://wa.me/?text=${t}%20${url}">WhatsApp</a>
      <a class="tag" target="_blank" rel="noopener" href="https://t.me/share/url?url=${url}&text=${t}">Telegram</a>
      <a class="tag" target="_blank" rel="noopener" href="https://x.com/intent/post?url=${url}&text=${t}">X</a>
      <a class="tag" href="#" data-copy="${p.id}">Copy link</a></div>`;
  };
  const render = () => {
    const list = posts.filter(p => active === "All" || p.category === active)
      .sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date));
    document.getElementById("post-cats").innerHTML = cats.map(c =>
      `<a href="#" class="tag" data-cat="${esc(c)}" style="${c === active ? "background:var(--green);color:#fff" : ""}">${esc(c)}</a>`).join("");
    document.getElementById("post-list").innerHTML = list.map(p => `<article class="card" id="${p.id}" style="margin-bottom:20px">
      <div><span class="tag">${esc(p.category)}</span>${p.pinned ? '<span class="tag">📌 Pinned</span>' : ""}
        <small class="muted">${esc(p.date)}</small></div>
      <h2>${esc(p.title)}</h2><p style="color:var(--ink)">${esc(p.body)}</p>${share(p)}</article>`).join("");
  };
  document.addEventListener("click", e => {
    const c = e.target.dataset.cat, cp = e.target.dataset.copy;
    if (c) { e.preventDefault(); active = c; render(); }
    if (cp) { e.preventDefault(); navigator.clipboard?.writeText(location.href.split("#")[0] + "#" + cp); e.target.textContent = "Copied ✓"; }
  });
  render();
})();
