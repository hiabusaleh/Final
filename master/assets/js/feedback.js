/* Learner's saved AI feedback + teacher review (Blueprint §33) */
(async function () {
  const A = window.PorchiAPI, { esc, root } = window.Porchi, el = document.getElementById("fbk"), R = window.PorchiAI;
  if (!A.online || !(await A.me())) { el.innerHTML = `<div class="notice warn">দেখতে <a href="${root}account/index.html?next=${encodeURIComponent(location.pathname + location.search)}">login</a> করো (server চালু থাকতে হবে)।</div>`; return; }
  const id = new URLSearchParams(location.search).get("id");
  const statusTag = s => ({ ai_only: "AI only", requested: "Review requested", claimed: "Teacher reviewing", reviewed: "✓ Teacher reviewed" }[s] || s);
  if (!id) {
    const { items } = await A.get("/me/ai-feedback");
    el.innerHTML = `<div class="eyebrow">My feedback</div><h1>আমার feedback</h1>` + (items.length ? `<table><tr><th>Date</th><th>Type</th><th>Band</th><th>Status</th><th></th></tr>
      ${items.map(f => `<tr><td>${esc(f.createdAt.slice(0, 10))}</td><td>${esc(f.kind)}</td><td>${f.overall ?? "—"}</td><td><span class="tag">${statusTag(f.reviewStatus)}</span></td>
        <td><a href="?id=${f.id}">Open →</a></td></tr>`).join("")}</table>` : `<p class="muted">এখনো কোনো feedback নেই। <a href="${root}ai-teacher/index.html">AI Teacher →</a></p>`);
    return;
  }
  const { item: f } = await A.get("/me/ai-feedback/" + encodeURIComponent(id));
  const t = f.teacherReview, names = { task_response: "Task Response", coherence_cohesion: "Coherence & Cohesion", lexical_resource: "Lexical Resource",
    grammar: "Grammar", fluency_coherence: "Fluency & Coherence", pronunciation: "Pronunciation" };
  el.innerHTML = `<div class="eyebrow"><a href="./index.html">My feedback</a> / ${esc(f.kind)}</div>
    <h1>${f.kind === "writing" ? "✍️ Writing" : f.kind === "speaking" ? "🗣️ Speaking" : "🤖"} feedback <span class="tag">${statusTag(f.reviewStatus)}</span></h1>
    ${t ? `<div class="card" style="border-left:4px solid var(--green);margin-bottom:24px"><h2>👩‍🏫 শিক্ষকের চূড়ান্ত মূল্যায়ন · <span class="score">${t.overall.toFixed(1)}</span></h2>
      <p class="muted">${esc(t.teacher)} · ${esc(t.reviewedAt.slice(0, 10))} · Teacher-reviewed estimate (not an official IELTS score)</p>
      <table>${Object.entries(t.bands).map(([k, v]) => `<tr><td>${names[k] || k}</td><td><strong>${v.toFixed(1)}</strong></td></tr>`).join("")}</table>
      <p style="color:var(--ink);white-space:pre-line;margin-top:12px">${esc(t.comment)}</p>
      ${t.actions?.length ? `<ul>${t.actions.map(a => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}</div>` : ""}
    ${f.reviewStatus === "ai_only" && f.kind !== "explain" ? `<form class="card" id="rq" style="margin-bottom:24px"><h3>শিক্ষকের review চাই</h3>
      <p class="muted">একজন শিক্ষক AI-এর মূল্যায়ন যাচাই করে চূড়ান্ত band ও মন্তব্য দেবেন।</p>
      <label>শিক্ষকের জন্য note (optional)</label><input name="note" maxlength="300">
      <button class="btn btn-primary" style="margin-top:12px">Review চাই</button></form>` : ""}
    <details ${t ? "" : "open"}><summary><strong>AI feedback</strong></summary>
      ${f.kind === "writing" ? R.writing(f.result) : f.kind === "speaking" ? R.speaking(f.result) : R.explain(f.result)}</details>
    <details style="margin-top:16px"><summary><strong>তোমার জমা দেওয়া লেখা</strong></summary>
      <div class="card" style="white-space:pre-line;font-family:var(--font-read)">${esc(f.input.response || f.input.transcript || "")}</div></details>`;
  const rq = el.querySelector("#rq");
  if (rq) rq.onsubmit = async e => { e.preventDefault();
    try { await A.post(`/me/ai-feedback/${f.id}/request-review`, { note: rq.note.value }); location.reload(); } catch (x) { alert(x.message); } };
})();
