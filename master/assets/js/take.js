/* Mock test player: sections, timer, highlight, notes, flag, navigation (Blueprint §9, §21, §35) */
(async function () {
  const A = window.PorchiAPI, { esc, root } = window.Porchi, el = document.getElementById("take");
  const qp = new URLSearchParams(location.search), mockId = qp.get("id"), untimed = qp.get("untimed") === "1";
  const fatal = html => el.innerHTML = `<section class="page-hero"><div class="container"><div class="notice warn">${html}</div>
    <p><a href="${root}mock-tests/index.html">← Mock Tests</a></p></div></section>`;
  if (!A.online) return fatal("Mock দিতে server চালু করতে হবে (<code>npm start</code>)।");
  if (!(await A.me())) { location.href = `${root}account/index.html?next=${encodeURIComponent(location.pathname + location.search)}`; return; }
  let data;
  try { data = await A.post(`/mocks/${encodeURIComponent(mockId)}/start`); } catch (e) { return fatal(esc(e.message)); }

  const { mock, questions, passages } = data, attemptId = data.attempt.id;
  const answers = {}, flags = new Set(), started = Date.now();
  let sec = 0, left = mock.sections.reduce((a, s) => a + s.minutes, 0) * 60, submitted = false;
  const qById = Object.fromEntries(questions.map(q => [q.id, q]));

  el.innerHTML = `<div class="t-bar"><strong>${esc(mock.title)}</strong>
      <span id="tabs">${mock.sections.map((s, i) => `<button data-sec="${i}">${i + 1}. ${s.skill}</button>`).join(" ")}</span>
      <button id="hl" title="Select text in the passage, then press">🖍 Highlight</button>
      <button id="nt">📝 Notes</button>
      <span class="timer" id="timer">${untimed ? "Untimed" : ""}</span>
      <button id="finish" style="background:var(--lime);color:var(--ink);border:0">Submit</button></div>
    <div id="sec"></div><nav class="t-nav" id="nav" aria-label="Questions"></nav>
    <div class="card t-notes" id="notes"><strong>Notes</strong><small class="muted">শুধু তোমার জন্য — জমা হবে না</small>
      <textarea rows="8" spellcheck="false"></textarea></div>`;
  const $ = s => el.querySelector(s);

  function render() {
    const s = mock.sections[sec];
    el.querySelectorAll("[data-sec]").forEach(b => b.classList.toggle("on", +b.dataset.sec === sec));
    if (s.skill === "writing" || s.skill === "speaking") {
      const key = "task:" + sec;
      $("#sec").innerHTML = `<div class="t-body"><div class="t-pane"><h3>${s.skill === "writing" ? "Writing task" : "Speaking task"}</h3>
        <div class="t-passage">${esc(s.task)}</div></div>
        <div class="t-pane q t-writing"><label for="wr">তোমার উত্তর ${s.skill === "speaking" ? "(notes/transcript)" : ""}</label>
        <textarea id="wr" spellcheck="false" autocorrect="off" autocapitalize="off">${esc(answers[key] || "")}</textarea>
        <p class="muted">Words: <strong id="wc">0</strong>${s.minWords ? ` / at least ${s.minWords}` : ""} · Spellcheck off, like the test</p></div></div>`;
      const ta = $("#wr"), wc = () => $("#wc").textContent = ta.value.trim().split(/\s+/).filter(Boolean).length;
      ta.oninput = () => { answers[key] = ta.value; wc(); }; wc();
      $("#nav").innerHTML = ""; return;
    }
    const qs = s.questionIds.map(id => qById[id]).filter(Boolean);
    const pids = [...new Set(qs.map(q => q.passage_id).filter(Boolean))];
    $("#sec").innerHTML = `<div class="t-body"><div class="t-pane" id="pp">${pids.map(pid => {
        const p = passages.find(x => x.id === pid); return p ? `<h3>${esc(p.title)}</h3><div class="t-passage">${esc(p.text)}</div>` : ""; }).join("<hr>")
        || `<p class="muted">${s.skill === "listening" ? "Audio player এখানে থাকবে।" : ""}</p>`}</div>
      <div class="t-pane q">${qs.map(q => `<div class="t-q ${flags.has(q.id) ? "flag" : ""}" id="q-${q.id}">
        <div style="display:flex;justify-content:space-between"><strong>${q.question_number}.</strong>
          <a href="#" data-flag="${q.id}" style="font-size:.85rem">${flags.has(q.id) ? "Unflag" : "⚑ Flag"}</a></div>
        <p>${esc(q.prompt)}</p>${q.audio_id ? `<audio controls preload="none" src="${esc(q.audio_id)}"></audio>` : ""}
        ${q.options.length ? q.options.map(o => { const v = o.split(".")[0].trim(); return `<label style="font-weight:400">
          <input type="radio" name="${q.id}" value="${esc(v)}" style="width:auto" ${answers[q.id] === v ? "checked" : ""}> ${esc(o)}</label>`; }).join("")
          : `<input name="${q.id}" value="${esc(answers[q.id] || "")}" autocomplete="off" spellcheck="false" aria-label="Answer ${q.question_number}">`}
      </div>`).join("")}</div></div>`;
    $("#sec").oninput = $("#sec").onchange = e => { if (e.target.name && qById[e.target.name]) { answers[e.target.name] = e.target.value; nav(); } };
    nav();
  }
  function nav() {
    const s = mock.sections[sec];
    $("#nav").innerHTML = s.questionIds.map(id => qById[id]).filter(Boolean).map(q =>
      `<a href="#q-${q.id}" class="${answers[q.id] ? "done" : ""} ${flags.has(q.id) ? "flag" : ""}">${q.question_number}</a>`).join("");
  }

  el.addEventListener("click", e => {
    const t = e.target;
    if (t.dataset.sec) { sec = +t.dataset.sec; render(); }
    if (t.dataset.flag) { e.preventDefault(); flags.has(t.dataset.flag) ? flags.delete(t.dataset.flag) : flags.add(t.dataset.flag); render(); }
    if (t.tagName === "MARK" && t.closest(".t-passage")) t.replaceWith(...t.childNodes);          // click a highlight to remove it
    if (t.closest(".t-nav a")) { e.preventDefault(); document.querySelector(t.getAttribute("href"))?.scrollIntoView({ behavior: "smooth", block: "center" }); }
  });
  $("#hl").onmousedown = e => e.preventDefault(); // keep the text selection
  $("#hl").onclick = () => {
    const sel = getSelection(); if (!sel.rangeCount || sel.isCollapsed) return;
    const r = sel.getRangeAt(0); if (!r.commonAncestorContainer.parentElement?.closest(".t-passage") && !r.commonAncestorContainer.closest?.(".t-passage")) return;
    const m = document.createElement("mark"); m.append(r.extractContents()); r.insertNode(m); sel.removeAllRanges();
  };
  $("#nt").onclick = () => $("#notes").classList.toggle("open");
  document.addEventListener("keydown", e => { if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); sec = Math.min(mock.sections.length - 1, sec + 1); render(); }
    if (e.altKey && e.key === "ArrowLeft") { e.preventDefault(); sec = Math.max(0, sec - 1); render(); } });

  async function submit(auto) {
    if (submitted) return;
    const unanswered = questions.filter(q => !answers[q.id]).length;
    if (!auto && !confirm(unanswered ? `${unanswered}টি প্রশ্নের উত্তর নেই। তবুও জমা দেবে?` : "জমা দেবে?")) return;
    submitted = true;
    try {
      await A.post(`/attempts/${attemptId}/submit`, { answers, seconds: Math.round((Date.now() - started) / 1000) });
      location.href = `${root}mock-tests/results/index.html?id=${attemptId}`;
    } catch (e) { submitted = false; alert(e.message); }
  }
  $("#finish").onclick = () => submit(false);
  window.addEventListener("beforeunload", e => { if (!submitted) { e.preventDefault(); e.returnValue = ""; } });

  if (!untimed) {
    const tick = () => {
      left--; const m = Math.floor(Math.max(0, left) / 60), s = Math.max(0, left) % 60;
      $("#timer").textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      $("#timer").classList.toggle("low", left <= 300);
      if (left <= 0) { clearInterval(iv); submit(true); }
    };
    const iv = setInterval(tick, 1000); left++; tick();
  }
  render();
})();
