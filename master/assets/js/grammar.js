/* Grammar lessons + quick tests (Blueprint §31) */
(function () {
  const G = window.PORCHI_GRAMMAR, { esc } = window.Porchi, el = document.getElementById("grammar");
  el.innerHTML = `<div class="grid grid-2" style="margin-top:16px">${G.map(g => `<a class="card" href="#${g.id}" style="text-decoration:none;color:inherit">
    <h3>${esc(g.topic)}</h3><p>${esc(g.use)}</p><span class="tag">${g.level}</span></a>`).join("")}</div><div id="lesson" style="margin-top:32px"></div>`;
  function show(id) {
    const g = G.find(x => x.id === id); if (!g) return;
    const box = el.querySelector("#lesson");
    box.innerHTML = `<div class="card"><h2>${esc(g.topic)}</h2><p style="color:var(--ink)">${esc(g.lesson)}</p>
      <h3>উদাহরণ</h3><ul>${g.examples.map(x => `<li style="font-family:var(--font-read)">${esc(x)}</li>`).join("")}</ul>
      <h3>সাধারণ ভুল</h3><ul>${g.errors.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <form class="card" id="gq" style="margin-top:16px"><h3>Quick test (${g.q.length})</h3>${g.q.map(([s, opts], i) => `<div style="margin:12px 0" data-i="${i}">
        <p style="color:var(--ink)">${i + 1}. ${esc(s)}</p>${opts.map((o, j) => `<label style="display:inline-block;font-weight:400;margin-right:16px">
        <input type="radio" name="q${i}" value="${j}" style="width:auto"> ${esc(o)}</label>`).join("")}<div class="fb"></div></div>`).join("")}
        <button class="btn btn-primary">উত্তর দেখি</button> <span id="gs"></span></form>`;
    box.scrollIntoView({ behavior: "smooth" });
    box.querySelector("#gq").onsubmit = e => { e.preventDefault(); let score = 0;
      g.q.forEach(([, opts, ans, why], i) => { const v = e.target["q" + i].value, ok = +v === ans && v !== ""; score += ok;
        e.target.querySelector(`[data-i="${i}"] .fb`).innerHTML = `<small class="${ok ? "" : "muted"}">${ok ? "✓" : `✗ সঠিক: <strong>${esc(opts[ans])}</strong>`} — ${esc(why)}</small>`; });
      box.querySelector("#gs").innerHTML = `<span class="score">${score}/${g.q.length}</span>`;
      window.PorchiAPI.online && window.PorchiAPI.me().then(u => u && window.PorchiAPI.post("/me/activity", { kind: "grammar" })).catch(() => {}); };
  }
  window.addEventListener("hashchange", () => show(location.hash.slice(1)));
  if (location.hash) show(location.hash.slice(1));
})();
