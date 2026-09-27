/* Mock tests landing — rendered from data/test-profiles.js (Blueprint §8–§12) */
(function () {
  const T = window.PORCHI_TESTS, F = window.PORCHI_FLAGS, { esc } = window.Porchi;
  const $ = id => document.getElementById(id);
  $("profiles").innerHTML = T.profiles.map(p => {
    const on = !p.flag || F[p.flag];
    return `<div class="card" id="${p.id}"><h3>${esc(p.name)}</h3>
      <p>${p.skills.join(" · ")}</p>${on ? `<span class="tag">Mock শীঘ্রই</span>` : `<span class="tag soon">Future module</span>`}</div>`;
  }).join("");
  $("modes").innerHTML = T.mockModes.map(m => `<div class="card"><h3>${esc(m.name)}</h3><p>${esc(m.desc)}</p></div>`).join("");
  $("fmt").textContent = T.formatVersion;
  $("sections").innerHTML = `<table><tr><th>Section</th><th>Time</th><th>Items</th></tr>${Object.entries(T.sections).map(([s, v]) =>
    `<tr><td>${s}</td><td>${v.minutes} min${s === "speaking" ? " (approx. 11–14)" : ""}</td><td>${v.questions || v.tasks || v.parts} ${v.questions ? "questions" : v.tasks ? "tasks" : "parts"}</td></tr>`).join("")}</table>`;
})();

/* Published mocks + history (server mode) */
(async function () {
  const A = window.PorchiAPI, { esc, root } = window.Porchi, el = document.getElementById("available");
  if (!A.online) return;
  const [{ mocks }, user] = await Promise.all([A.get("/mocks"), A.me()]);
  const hist = user ? (await A.get("/me/attempts")).attempts : [];
  el.innerHTML = `<h2 style="margin-top:32px">এখন দেওয়া যাবে</h2><div class="grid">${mocks.map(m => `<div class="card">
      <span class="tag">${esc(m.mode)}</span><h3>${esc(m.title)}</h3><p>${esc(m.description)}<br>
      ${m.sections.map(s => `${s.skill} · ${s.minutes} min`).join(" | ")}</p>
      <label style="font-weight:400"><input type="checkbox" data-untimed="${m.id}" style="width:auto"> Untimed (familiarisation)</label>
      <a class="btn btn-primary" data-start="${m.id}" href="${root}mock-tests/take/index.html?id=${m.id}">Start →</a></div>`).join("")
      || `<p class="muted">এখনো কোনো mock প্রকাশিত হয়নি।</p>`}</div>
    ${hist.length ? `<h2 style="margin-top:32px">তোমার আগের mock</h2><table><tr><th>Mock</th><th>Date</th><th>Bands</th><th></th></tr>
      ${hist.map(a => `<tr><td>${esc(a.mockTitle || "")}</td><td>${esc(a.submittedAt.slice(0, 10))}</td>
        <td>${a.sections.map(s => `${s.skill} ${s.band ?? "—"}`).join(" · ")}</td>
        <td><a href="${root}mock-tests/results/index.html?id=${a.id}">Report →</a></td></tr>`).join("")}</table>` : ""}`;
  el.onclick = e => { const id = e.target.dataset.start; if (!id) return;
    if (el.querySelector(`[data-untimed="${id}"]`).checked) { e.preventDefault(); location.href = e.target.href + "&untimed=1"; } };
})();
