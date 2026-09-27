/* Mock result report: bands, raw, time, question-type performance, recommendations (Blueprint §12) */
(async function () {
  const A = window.PorchiAPI, { esc, root } = window.Porchi, el = document.getElementById("result");
  if (!A.online) { el.innerHTML = `<div class="notice warn">Result দেখতে server চালু করতে হবে।</div>`; return; }
  let a;
  try { a = (await A.get("/attempts/" + encodeURIComponent(new URLSearchParams(location.search).get("id")))).attempt; }
  catch (e) { el.innerHTML = `<div class="notice warn">${esc(e.message)}</div>`; return; }
  const aiOn = (await A.get("/ai/status").catch(() => ({}))).enabled;
  const r = a.report, cap = s => s[0].toUpperCase() + s.slice(1), pct = x => Math.round(x * 100) + "%";
  const mins = Math.floor(r.seconds / 60) + "m " + (r.seconds % 60) + "s";
  el.innerHTML = `<div class="eyebrow"><a href="${root}mock-tests/index.html">Mock Tests</a> / Result</div>
    <h1>${esc(a.mockTitle || "Mock result")}</h1>
    <div class="notice">সব band <strong>indicative estimate</strong> (${esc(r.scoringVersion)}) — official IELTS score নয়।</div>
    <div class="grid">
      <div class="card"><h3>Overall</h3><div class="score">${r.overall ?? "—"}</div>
        <small class="muted">${r.overall == null ? "চারটি skill-এর band লাগবে" : "Mean of four skills, IELTS rounding"}</small></div>
      ${r.sections.map((s, i) => `<div class="card"><h3>${cap(s.skill)}</h3>
        ${s.band != null ? `<div class="score">${s.band.toFixed(1)}</div><small class="muted">Raw ${s.raw}/${s.count}${s.scaledFromShortTest ? ` → scaled ${s.scaled}/40` : ""}</small>`
          : `<div class="score" style="font-size:1.1rem">Review pending</div><small class="muted">${s.words} words</small>
             ${s.skill === "writing" && aiOn ? `<br><a class="btn btn-outline" style="margin-top:8px;padding:6px 12px" href="#" data-aiw="${i}">🤖 AI feedback নিই</a>` : ""}`}
        ${s.status === "ai_estimated" ? `<br><small class="muted">🤖 AI estimate · <a href="#" data-aiw="${i}" data-show="1">দেখি</a></small>` : ""}</div>`).join("")}
      <div class="card"><h3>Accuracy &amp; time</h3><div class="score">${r.total ? pct(r.raw / r.total) : "—"}</div><small class="muted">${r.raw}/${r.total} · ${mins}</small></div>
    </div>
    <div class="grid grid-2" style="margin-top:24px">
      <div class="card"><h3>💪 Strong</h3><p style="color:var(--ink)">${r.strong.map(esc).join(", ") || "—"}</p></div>
      <div class="card"><h3>🔧 Needs work</h3><p style="color:var(--ink)">${r.needsWork.map(esc).join(", ") || "—"}</p></div>
    </div>
    <div id="ai-writing"></div>
    <h2 style="margin-top:32px">Question-type performance</h2>
    <table><tr><th>Type</th><th>Score</th><th style="width:40%">Accuracy</th></tr>${r.byType.map(t => `<tr><td>${esc(t.type)}</td><td>${t.correct}/${t.attempted}</td>
      <td><div class="progress"><div style="width:${pct(t.accuracy)};${t.accuracy < .6 ? "background:var(--coral)" : ""}"></div></div></td></tr>`).join("")}</table>
    ${r.recommendations.length ? `<h2 style="margin-top:32px">এখান থেকে শুরু করলে সবচেয়ে বেশি লাভ হবে</h2><div class="grid">${r.recommendations.map(x => `<div class="card">
      <h3>${esc(x.type)}</h3><ol>${x.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
      <a class="more" href="${root}practice/index.html?skill=${x.module}&type=${encodeURIComponent(x.type)}">Targeted practice →</a></div>`).join("")}</div>` : ""}
    <h2 style="margin-top:32px">Answer review</h2>
    <div>${a.items.map(i => `<div class="card" style="margin-bottom:10px;border-left:4px solid ${i.correct ? "var(--green)" : "var(--coral)"}">
      <p style="color:var(--ink)"><strong>${i.question_number}.</strong> ${i.correct ? "✓" : "✗"} তোমার উত্তর: <strong>${esc([].concat(i.given).join(", ") || "—")}</strong>
      ${i.correct ? "" : ` · সঠিক: <strong>${esc([].concat(i.correct_answer).join(", "))}</strong>`}</p>
      ${i.explanation ? `<small class="muted">${esc(i.explanation)}</small>` : ""}</div>`).join("")}</div>
    <div class="btn-row" style="margin-top:24px"><a class="btn btn-primary" href="${root}practice/index.html#mistakes">Mistake Book →</a>
      <a class="btn btn-outline" href="${root}mock-tests/index.html">আরেকটি mock</a></div>`;
  el.addEventListener("click", async e => {
    const i = e.target.dataset.aiw; if (i === undefined) return; e.preventDefault();
    const out = el.querySelector("#ai-writing"), sec = r.sections[i];
    out.innerHTML = `<div class="notice">AI তোমার লেখা পড়ছে… (৩০–৯০ সেকেন্ড লাগতে পারে)</div>`;
    try {
      const result = e.target.dataset.show ? (await A.get("/me/ai-feedback/" + sec.aiFeedbackId)).item.result
        : (await A.post("/ai/writing", { attemptId: a.id, sectionIndex: +i })).result;
      out.innerHTML = `<h2 style="margin-top:32px">✍️ Writing feedback</h2>` + window.PorchiAI.writing(result);
      out.scrollIntoView({ behavior: "smooth" });
    } catch (x) { out.innerHTML = `<div class="notice warn">${esc(x.message)}</div>`; }
  });
})();
