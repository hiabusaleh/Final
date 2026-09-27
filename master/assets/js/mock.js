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
