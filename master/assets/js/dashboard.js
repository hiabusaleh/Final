/* Dashboard, study plan and progress — local-only until accounts/backend exist (Blueprint §15, §28, §29) */
(async function () {
  const { store, root } = window.Porchi;
  const user = await window.PorchiAPI.me();
  const d = user?.profile?.diagnostic || store.get("diagnostic", null);
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const noDiag = `<div class="notice">এখনো diagnostic দেওয়া হয়নি। <a href="${root}diagnostic/index.html">কয়েক মিনিটে level যাচাই করি →</a></div>`;
  const $ = id => document.getElementById(id);

  if ($("dash")) {
    $("dash").innerHTML = `<div class="eyebrow">Student Dashboard</div><h1>Welcome back${user ? ", " + window.Porchi.esc(user.name.split(" ")[0]) : ""} 👋</h1>` + (!d ? noDiag : `
      <div class="grid">
        <div class="card"><h3>Target band</h3><div class="score">${d.target.toFixed(1)}</div></div>
        <div class="card"><h3>Current estimate</h3><div class="score">${d.overall.toFixed(1)}</div><small class="muted">Indicative</small></div>
        <div class="card"><h3>Test date</h3><div class="score" style="font-size:1.3rem">${d.date || "—"}</div></div>
      </div>
      <h2 style="margin-top:32px">Skills</h2><div class="grid">${Object.entries(d.bands).map(([s, b]) =>
        `<div class="card"><h3>${cap(s)} · ${b.toFixed(1)}</h3><div class="progress"><div style="width:${b / 9 * 100}%"></div></div></div>`).join("")}</div>
      <div class="btn-row" style="margin-top:24px"><a class="btn btn-primary" href="${root}study-plan/index.html">Continue Study Plan</a></div>`) + `
      <h2 style="margin-top:40px">Coming next</h2><div class="grid">
        ${["Today's Tasks", "Weak Areas", "Recent Tests", "Saved Items", "Mistake Book"].map(x =>
          `<div class="card"><h3>${x}</h3><span class="tag soon">Account system-এর পর</span></div>`).join("")}</div>`;
  }

  if ($("plan")) {
    if (!d) { $("plan").innerHTML = noDiag; return; }
    const days = d.date ? Math.max(7, Math.round((new Date(d.date) - new Date()) / 864e5)) : 56;
    const weeks = Math.min(12, Math.max(1, Math.ceil(days / 7)));
    const weak = d.weaknesses, strong = d.strengths;
    const focus = {
      listening: ["Listening prediction", "Map/Plan practice", "Distractor training"],
      reading: ["Reading question-type training", "TF/NG strategy", "Matching Headings"],
      writing: ["Writing Task 2 fundamentals", "Task 1 overview writing", "Coherence & linking"],
      speaking: ["Speaking Part 1 fluency", "Part 2 cue card timing", "Part 3 idea extension"]
    };
    const rows = [];
    for (let w = 1; w <= weeks; w++) {
      const i = (w - 1) % 3;
      const tasks = [...weak.map(s => focus[s][i]), ...strong.map(s => focus[s][i])];
      if (w % 2 === 0) tasks.push("Mini mock + mistake review");
      if (w === weeks) tasks.push("Full mock → retest weak areas");
      rows.push(`<div class="card" style="margin-bottom:12px"><h3>Week ${w}</h3><p>${tasks.join(" · ")}</p></div>`);
    }
    $("plan").innerHTML = `<p class="muted">Target ${d.target.toFixed(1)} · ${weeks} সপ্তাহ · দিনে ~${d.hours} ঘণ্টা ·
      Focus: ${weak.map(cap).join(", ")}</p>${rows.join("")}
      <p class="muted"><small>প্রাথমিক rule-based plan। পরে AI + progress data দিয়ে personalised হবে।</small></p>`;
  }

  if ($("progress")) {
    $("progress").innerHTML = !d ? noDiag : `<table><tr><th>Skill</th><th>Estimate</th><th>Target gap</th></tr>
      ${Object.entries(d.bands).map(([s, b]) => `<tr><td>${cap(s)}</td><td>${b.toFixed(1)}</td><td>${Math.max(0, d.target - b).toFixed(1)}</td></tr>`).join("")}</table>`;
  }
})();
