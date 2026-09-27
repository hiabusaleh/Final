/* Short self-assessment diagnostic (Blueprint §7). Result is indicative only; saved locally for dashboard/study plan. */
(function () {
  const T = window.PORCHI_TESTS, { store, root } = window.Porchi;
  const skills = {
    listening: ["সাধারণ কথোপকথনের মূল তথ্য ধরতে পারি", "Accent বদলালেও বুঝতে পারি", "Lecture থেকে নির্দিষ্ট তথ্য লিখতে পারি", "Distractor-এ কম ভুল করি"],
    reading: ["দ্রুত skim করে main idea বুঝি", "Scan করে নির্দিষ্ট তথ্য খুঁজে পাই", "TF/NG-তে আত্মবিশ্বাসী", "৬০ মিনিটে ৪০টি প্রশ্ন শেষ করতে পারি"],
    writing: ["পরিষ্কার paragraph লিখতে পারি", "Task 2-তে নিজের মত যুক্তি দিয়ে লিখি", "Grammar ভুল কম হয়", "৪০ মিনিটে ২৫০+ শব্দ লিখতে পারি"],
    speaking: ["২ মিনিট থেমে না থেকে বলতে পারি", "Idea সাজিয়ে উত্তর দিই", "বিভিন্ন শব্দ ব্যবহার করতে পারি", "উচ্চারণ স্পষ্ট"]
  };
  const scale = ["পারি না", "একটু", "মোটামুটি", "ভালো", "খুব ভালো"];

  document.getElementById("test").innerHTML = T.profiles.filter(p => !p.flag || window.PORCHI_FLAGS[p.flag])
    .map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  document.getElementById("skill-qs").innerHTML = Object.entries(skills).map(([s, qs]) =>
    `<h3 style="margin-top:24px">${s[0].toUpperCase() + s.slice(1)}</h3>` + qs.map((q, i) =>
      `<label for="${s}${i}">${q}</label><select id="${s}${i}" name="${s}">${scale.map((o, v) =>
        `<option value="${v}" ${v === 2 ? "selected" : ""}>${o}</option>`).join("")}</select>`).join("")).join("");

  const toBand = avg => Math.min(9, Math.round((3.5 + avg * 1.25) * 2) / 2); // 0..4 → 3.5..8.5, indicative
  const overall = b => { const a = b.reduce((x, y) => x + y, 0) / b.length; return Math.round(a * 2) / 2; }; // simplified; official IELTS rounding rules differ at .25/.75

  document.getElementById("diag").addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const bands = {};
    for (const s of Object.keys(skills)) {
      const v = fd.getAll(s).map(Number);
      bands[s] = toBand(v.reduce((a, b) => a + b, 0) / v.length);
    }
    const sorted = Object.entries(bands).sort((a, b) => b[1] - a[1]);
    const result = {
      test: fd.get("test"), target: +fd.get("target"), date: fd.get("date"), hours: +fd.get("hours"),
      bands, overall: overall(Object.values(bands)), strengths: sorted.slice(0, 2).map(x => x[0]),
      weaknesses: sorted.slice(-2).map(x => x[0]), at: new Date().toISOString(), version: "DIAGNOSTIC_V1"
    };
    store.set("diagnostic", result);
    const cap = s => s[0].toUpperCase() + s.slice(1);
    document.getElementById("result").innerHTML = `<div class="card">
      <h2>এখান থেকে শুরু করলে সবচেয়ে বেশি লাভ হবে।</h2>
      <p>Estimated overall: <span class="score">${result.overall.toFixed(1)}</span> · Target: ${result.target.toFixed(1)}</p>
      <table><tr><th>Skill</th><th>Indicative band</th></tr>
        ${Object.entries(bands).map(([s, b]) => `<tr><td>${cap(s)}</td><td>${b.toFixed(1)}</td></tr>`).join("")}</table>
      <p style="margin-top:16px"><strong>Strengths:</strong> ${result.strengths.map(cap).join(", ")}<br>
        <strong>Needs work:</strong> ${result.weaknesses.map(cap).join(", ")}</p>
      <div class="btn-row"><a class="btn btn-primary" href="${root}study-plan/index.html">Study plan বানাই</a>
        <a class="btn btn-outline" href="${root}learn/${result.weaknesses[1]}/index.html">${cap(result.weaknesses[1])} শুরু করি</a></div>
      <p class="muted" style="margin-top:12px"><small>Indicative self-assessment only — not an official IELTS score.</small></p></div>`;
    document.getElementById("result").scrollIntoView({ behavior: "smooth" });
  });
})();
