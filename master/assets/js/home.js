/* Home page renderers */
(async function () {
  await window.PorchiAPI.contentReady;
  const D = window.PORCHI_DATA, T = window.PORCHI_TESTS, P = window.PORCHI_POSTS || { posts: [], videos: [] };
  const { esc, moduleLink } = window.Porchi;

  document.getElementById("paths").innerHTML = T.profiles
    .filter(p => !p.flag || window.PORCHI_FLAGS[p.flag])
    .map(p => `<div class="card"><h3>${esc(p.name)}</h3>
      <p>${p.skills.map(s => s[0].toUpperCase() + s.slice(1)).join(" · ")}</p>
      <a class="more" href="test-info/index.html#${p.id}">বিস্তারিত →</a></div>`).join("");

  document.getElementById("modules").innerHTML = D.modules.map(m => {
    const l = moduleLink(m.id);
    return `<div class="card"><div class="icon">${m.icon}</div><h3>${m.name} <span class="muted">· ${m.bn}</span></h3>
      <p>${esc(m.desc)}</p>
      <a class="more" href="learn/${m.id}/index.html">Open ${m.name} →</a></div>`;
  }).join("");

  document.getElementById("mock-modes").innerHTML = T.mockModes.slice(0, 4)
    .map(m => `<div class="card"><h3>${esc(m.name)}</h3><p>${esc(m.desc)}</p></div>`).join("");

  const qt = D.taxonomy.questionTypes;
  document.getElementById("qtypes").innerHTML = ["reading", "listening"].map(s =>
    `<h3 style="margin-top:12px">${s[0].toUpperCase() + s.slice(1)}</h3>` +
    qt[s].map(q => `<a class="tag" href="practice/index.html?skill=${s}&type=${encodeURIComponent(q)}">${esc(q)}</a>`).join("")
  ).join("");

  document.getElementById("latest-posts").innerHTML = P.posts.slice(0, 3).map(p =>
    `<div class="card"><span class="tag">${esc(p.category)}</span><h3>${esc(p.title)}</h3>
     <p>${esc(p.excerpt)}</p><a class="more" href="posts/index.html#${p.id}">পড়ি →</a></div>`).join("")
    || `<p class="muted">শীঘ্রই নতুন পোস্ট আসছে।</p>`;

  document.getElementById("latest-videos").innerHTML = P.videos.slice(0, 3).map(v =>
    `<div class="card"><span class="tag">${esc(v.skill)}</span><h3>${esc(v.title)}</h3>
     <p>${esc(v.description)}</p><a class="more" href="videos/index.html#${v.id}">দেখি →</a></div>`).join("")
    || `<p class="muted">শীঘ্রই ভিডিও যুক্ত হবে।</p>`;
})();
