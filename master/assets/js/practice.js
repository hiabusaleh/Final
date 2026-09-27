/* Question-bank filter shell (Blueprint §13, §14). Reads ?skill=&type= from URL. */
(function () {
  const tx = window.PORCHI_DATA.taxonomy, { esc } = window.Porchi;
  const q = new URLSearchParams(location.search);
  const $ = id => document.getElementById(id);
  const opts = (arr, sel) => arr.map(v => `<option ${v === sel ? "selected" : ""}>${esc(v)}</option>`).join("");
  $("f-skill").innerHTML = opts(tx.skills, q.get("skill") || "reading");
  $("f-diff").innerHTML = opts(["Any", ...tx.difficulty]);
  $("f-band").innerHTML = opts(["Any", ...tx.bands]);
  const fillTypes = sel => { $("f-type").innerHTML = opts(["All", ...tx.questionTypes[$("f-skill").value]], sel); };
  const render = () => {
    $("practice-out").innerHTML = `<div class="notice">
      <strong>${esc($("f-skill").value)}</strong> · ${esc($("f-type").value)} · ${esc($("f-diff").value)} · ${esc($("f-band").value)}<br>
      এই ফিল্টারে এখনো প্রশ্ন যুক্ত হয়নি। Question bank Admin → Questions থেকে পূরণ হবে।</div>`;
  };
  fillTypes(q.get("type"));
  $("f-skill").addEventListener("change", () => { fillTypes(); render(); });
  ["f-type", "f-diff", "f-band"].forEach(id => $(id).addEventListener("change", render));
  render();
  $("mistake-types").innerHTML = tx.mistakeTypes.map(m => `<span class="tag">${esc(m)}</span>`).join("");
})();
