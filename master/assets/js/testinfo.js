/* Test profiles overview from config (Blueprint §22) */
(function () {
  const T = window.PORCHI_TESTS, { esc } = window.Porchi;
  document.getElementById("profiles-info").innerHTML = T.profiles.map(p => `<div class="card" id="${p.id}">
    <h3>${esc(p.name)}</h3><p>Skills: ${p.skills.join(", ")}<br>Delivery: ${p.delivery_modes.join(", ")}
    ${p.reading_variant ? `<br>Reading/Writing: ${p.reading_variant}` : ""}</p>
    ${p.flag && !window.PORCHI_FLAGS[p.flag] ? '<span class="tag soon">Future module</span>' : ""}</div>`).join("");
})();
