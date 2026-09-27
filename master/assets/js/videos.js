/* YouTube library: URL → video ID → lazy embed (Blueprint §18). Add videos in data/posts.js */
(async function () {
  await window.PorchiAPI.contentReady;
  const { videos } = window.PORCHI_POSTS, { esc, root } = window.Porchi;
  const ytId = url => {
    const m = String(url || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  };
  const link = u => esc(/^https?:/.test(u) ? u : root + u);
  const skill = new URLSearchParams(location.search).get("skill");
  const list = videos.filter(v => !skill || v.skill.toLowerCase() === skill);
  const el = document.getElementById("video-list");
  el.innerHTML = list.map(v => {
    const id = ytId(v.youtube);
    const media = id
      ? `<button class="yt" data-id="${id}" aria-label="Play ${esc(v.title)}" style="border:0;padding:0;cursor:pointer;position:relative">
           <img loading="lazy" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" style="border-radius:var(--radius)">
           <span style="position:absolute;inset:0;display:grid;place-items:center;font-size:3rem">▶️</span></button>`
      : `<div class="notice">YouTube URL যুক্ত হয়নি (data/posts.js)।</div>`;
    return `<div class="card" id="${v.id}">${media}<div style="margin-top:12px"><span class="tag">${esc(v.skill)}</span><span class="tag">${esc(v.topic)}</span></div>
      <h3>${esc(v.title)}</h3><p>${esc(v.description)}</p>
      <div class="btn-row">${v.relatedPractice ? `<a class="btn btn-outline" href="${link(v.relatedPractice)}">Practice →</a>` : ""}
      ${v.relatedCourse ? `<a class="btn btn-outline" href="${link(v.relatedCourse)}">Course →</a>` : ""}</div></div>`;
  }).join("") || `<p class="muted">এই skill-এর ভিডিও শীঘ্রই আসছে।</p>`;
  el.addEventListener("click", e => {
    const b = e.target.closest(".yt"); if (!b) return;
    window.PorchiAPI.track("video_play", b.closest(".card")?.id || b.dataset.id);
    b.outerHTML = `<iframe class="video-frame" src="https://www.youtube-nocookie.com/embed/${b.dataset.id}?autoplay=1"
      allow="autoplay; encrypted-media" allowfullscreen title="YouTube video"></iframe>`;
  });
})();
