/* Shared renderers for AI feedback objects (writing / speaking / explanation) */
window.PorchiAI = (function () {
  const { esc } = window.Porchi;
  const list = a => a?.length ? `<ul>${a.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
  const crit = (name, c) => `<div class="card"><h3>${name}${c.band != null ? ` · <span class="score" style="font-size:1.2rem">${c.band.toFixed(1)}</span>` : ""}</h3>
    ${c.strengths?.length ? `<strong>👍</strong>${list(c.strengths)}` : ""}${c.improvements?.length ? `<strong>🔧</strong>${list(c.improvements)}` : ""}</div>`;
  const tip = t => t ? `<div class="notice">💡 ${esc(t)}</div>` : "";
  const label = r => `<p class="muted"><small>🤖 ${esc(r.label)}</small></p>`;
  return {
    writing: r => `${label(r)}<div class="card" style="margin-bottom:16px"><h3>Estimated band <span class="score">${r.overall.toFixed(1)}</span></h3>
        <p style="color:var(--ink)">${esc(r.summary)}</p><small class="muted">${r.words} words</small></div>
      <div class="grid grid-2">${crit("Task Response", r.task_response)}${crit("Coherence &amp; Cohesion", r.coherence_cohesion)}
        ${crit("Lexical Resource", r.lexical_resource)}${crit("Grammar", r.grammar)}</div>
      <h3 style="margin-top:20px">পরের ৩টি কাজ</h3>${list(r.top_three_actions)}
      <h3>একটি paragraph উন্নত করে</h3><div class="card" style="font-family:var(--font-read);white-space:pre-line">${esc(r.improved_paragraph)}</div>${tip(r.bangla_tip)}`,
    speaking: r => `${label(r)}<div class="grid grid-2">${crit("Fluency &amp; Coherence", r.fluency_coherence)}${crit("Lexical Resource", r.lexical_resource)}${crit("Grammar", r.grammar)}
        <div class="card"><h3>Pronunciation</h3><p>${esc(r.pronunciation_note)}</p></div></div>
      <h3 style="margin-top:20px">Follow-up questions</h3>${list(r.follow_up_questions)}
      <h3>Better answer (sample)</h3><div class="card" style="white-space:pre-line">${esc(r.better_answer_sample)}</div>${tip(r.bangla_tip)}`,
    explain: r => `<div class="notice" style="margin-top:8px"><strong>কেন সঠিক:</strong> ${esc(r.why_correct)}<br>
      <strong>Evidence:</strong> <em>${esc(r.evidence)}</em><br><strong>Paraphrase:</strong> ${esc(r.paraphrase)}<br>
      <strong>তোমার উত্তর:</strong> ${esc(r.why_given_wrong)}<br><strong>Tip:</strong> ${esc(r.strategy_tip)}${r.bangla_tip ? `<br>💡 ${esc(r.bangla_tip)}` : ""}
      <br><small class="muted">🤖 ${esc(r.label)}</small></div>`
  };
})();
