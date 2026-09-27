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

/* Live question bank + mistake book (server mode) */
(async function () {
  const A = window.PorchiAPI, { esc, root } = window.Porchi, $ = id => document.getElementById(id);
  if (!A.online) return;
  let started = Date.now();
  async function load() {
    const random = new URLSearchParams(location.search).get("random") === "1";
    const qs = new URLSearchParams({ skill: $("f-skill").value, type: $("f-type").value, difficulty: $("f-diff").value, limit: random ? 5 : 15, random: random ? 1 : 0 });
    const { questions, passages, total } = await A.get("/practice?" + qs);
    if (!questions.length) return; // keep the "no questions yet" notice
    started = Date.now();
    const byPassage = {};
    questions.forEach(q => (byPassage[q.passage_id || ""] ||= []).push(q));
    $("practice-out").innerHTML = `<form id="pf">${Object.entries(byPassage).map(([pid, list]) => {
      const p = passages.find(x => x.id === pid);
      return `<div class="grid grid-2" style="align-items:start;margin-bottom:24px">
        ${p ? `<article class="card" style="max-height:75vh;overflow:auto;position:sticky;top:80px"><h3>${esc(p.title)}</h3>
          <div style="font-family:var(--font-read);white-space:pre-line;color:var(--ink)">${esc(p.text)}</div></article>` : ""}
        <div>${list.map(q => `<div class="card" style="margin-bottom:12px" data-q="${q.id}">
          <div><small class="tag">${esc(q.question_type)}</small><small class="tag">${esc(q.difficulty)}</small></div>
          <p style="color:var(--ink)"><strong>${q.question_number || ""}.</strong> ${esc(q.prompt)}</p>
          ${q.options.length ? q.options.map(o => { const v = o.split(".")[0].trim();
            return `<label style="font-weight:400"><input type="radio" name="${q.id}" value="${esc(v)}" style="width:auto"> ${esc(o)}</label>`; }).join("")
            : `<input name="${q.id}" autocomplete="off" aria-label="Answer ${q.question_number}">`}
          <div class="fb"></div></div>`).join("")}</div></div>`; }).join("")}
      <p class="muted">${questions.length} / ${total} questions</p>
      <button class="btn btn-primary">উত্তর জমা দিই</button> <span id="pscore"></span></form>`;
    $("pf").onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const answers = questions.map(q => ({ id: q.id, answer: fd.get(q.id) || "" }));
      const r = await A.post("/practice/check", { answers, seconds: Math.round((Date.now() - started) / 1000) });
      r.results.forEach(x => {
        const box = e.target.querySelector(`[data-q="${x.id}"] .fb`);
        box.innerHTML = `<div class="notice ${x.correct ? "" : "warn"}">${x.correct ? "✓ সঠিক" : `✗ সঠিক উত্তর: <strong>${esc([].concat(x.correct_answer).join(", "))}</strong>`}
          ${x.explanation ? `<br><small>${esc(x.explanation)}</small>` : ""}
          ${!x.correct && r.saved && aiOn ? `<br><a href="#" data-ai="${x.id}" data-given="${esc([].concat(x.given).join(", "))}">🤖 AI Teacher-এর ব্যাখ্যা</a>` : ""}</div><div class="ai-out"></div>`;
      });
      $("pscore").innerHTML = `<span class="score">${r.score}/${r.total}</span> ${r.saved ? "· ভুলগুলো Mistake Book-এ গেছে"
        : `· <a href="${root}account/index.html?next=${encodeURIComponent(location.pathname)}">Login</a> করলে ভুলগুলো সংরক্ষিত হবে`}`;
      loadMistakes();
    };
  }
  async function loadMistakes() {
    const u = await A.me(); if (!u) return;
    const { mistakes, categories } = await A.get("/me/mistakes");
    const open = mistakes.filter(m => !m.reviewed);
    let box = $("mistake-list");
    if (!box) { box = document.createElement("div"); box.id = "mistake-list"; $("mistake-types").after(box); }
    box.innerHTML = !open.length ? `<p class="muted" style="margin-top:12px">Review করার মতো কোনো ভুল নেই। 🎉</p>` :
      `<div style="overflow-x:auto;margin-top:16px"><table><tr><th>Question</th><th>তোমার উত্তর</th><th>সঠিক</th><th>কারণ</th><th></th></tr>
      ${open.map(m => `<tr><td><small class="tag">${esc(m.question_type)}</small><br>${esc(m.prompt || "")}</td><td>${esc([].concat(m.given).join(", ") || "—")}</td>
        <td>${esc([].concat(m.correct_answer ?? "").join(", "))}</td>
        <td><select data-mid="${m.id}">${categories.map(c => `<option ${c === m.category ? "selected" : ""}>${c}</option>`).join("")}</select></td>
        <td><a href="#" data-done="${m.id}">Reviewed ✓</a></td></tr>`).join("")}</table></div>`;
    box.onchange = e => e.target.dataset.mid && A.put(`/me/mistakes/${e.target.dataset.mid}`, { category: e.target.value });
    box.onclick = async e => { if (!e.target.dataset.done) return; e.preventDefault();
      await A.put(`/me/mistakes/${e.target.dataset.done}`, { reviewed: true }); loadMistakes(); };
  }
  const aiOn = (await A.get("/ai/status").catch(() => ({}))).enabled;
  $("practice-out").addEventListener("click", async e => {
    const qid = e.target.dataset.ai; if (!qid) return; e.preventDefault();
    const out = e.target.closest("[data-q]").querySelector(".ai-out"); e.target.textContent = "AI ভাবছে…";
    try { const { result } = await A.post("/ai/explain", { questionId: qid, given: e.target.dataset.given }); out.innerHTML = window.PorchiAI.explain(result); e.target.remove(); }
    catch (x) { out.innerHTML = `<div class="notice warn">${esc(x.message)}</div>`; e.target.textContent = "🤖 আবার চেষ্টা করি"; }
  });
  ["f-skill", "f-type", "f-diff", "f-band"].forEach(id => $(id).addEventListener("change", () => load().catch(() => {})));
  load().catch(() => {}); loadMistakes().catch(() => {});
})();
