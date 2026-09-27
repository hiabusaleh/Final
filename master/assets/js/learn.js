/* Learn hub + individual module pages (Blueprint §5). Links come from config.js */
(function () {
  const D = window.PORCHI_DATA, { esc, moduleLink, root } = window.Porchi;

  const hub = document.getElementById("learn-modules");
  if (hub) {
    hub.innerHTML = D.modules.map(m => `<div class="card"><div class="icon">${m.icon}</div>
      <h3>${m.name} <span class="muted">· ${m.bn}</span></h3><p>${esc(m.desc)}</p>
      <a class="more" href="${m.id}/index.html">Open ${m.name} →</a></div>`).join("");
  }

  const el = document.getElementById("module");
  if (el) {
    const m = D.modules.find(x => x.id === el.dataset.module);
    const l = moduleLink(m.id);
    el.innerHTML = `
      <div class="eyebrow"><a href="${root}learn/index.html">Learn</a> / ${m.name}</div>
      <h1>${m.icon} IELTS ${m.name} <span class="muted">· ${m.bn}</span></h1>
      <p class="muted" style="max-width:680px">${esc(m.desc)}</p>
      ${l.ready
        ? `<a class="btn btn-primary" href="${esc(l.href)}" target="${l.target}" rel="noopener">${m.name} course খুলি →</a>`
        : `<div class="notice">এই module-এর ওয়েবসাইট শীঘ্রই যুক্ত হবে।
             <br><small class="muted">Admin: <code>assets/js/config.js</code> ফাইলে <code>${m.id}.url</code> বসান।</small></div>`}
      <h2 style="margin-top:40px">এই module-এ যা থাকবে</h2>
      <div class="grid">${m.features.map(f => `<div class="card"><h3>${esc(f)}</h3></div>`).join("")}</div>
      <h2 style="margin-top:40px">Learning loop</h2>
      <div class="loop"><span>Learn</span><i>→</i><span>Practice</span><i>→</i><span>Feedback</span><i>→</i>
        <span>Repair</span><i>→</i><span>Retry</span></div>
      <div class="btn-row" style="margin-top:28px">
        <a class="btn btn-outline" href="${root}practice/index.html?skill=${m.id}">${m.name} practice</a>
        <a class="btn btn-outline" href="${root}videos/index.html?skill=${m.id}">${m.name} videos</a>
      </div>`;
  }
})();
