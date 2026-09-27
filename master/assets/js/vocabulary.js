/* Vocabulary browser + flashcards (Blueprint §31) */
(async function () {
  const V = window.PorchiVocab, { esc, root } = window.Porchi, el = document.getElementById("vocab");
  const { user } = await V.load();
  let topic = "All", mode = "browse";
  const say = w => { try { const u = new SpeechSynthesisUtterance(w); u.lang = "en-GB"; speechSynthesis.speak(u); } catch {} };
  const boxLabel = b => ["নতুন", "শিখছি", "শিখছি", "মনে আছে", "ভালো জানি", "আয়ত্ত"][b || 0];

  function render() {
    const words = V.all(), topics = ["All", ...new Set(words.map(w => w.topic))], due = V.due();
    const P = V.progress(), mastered = words.filter(w => (P[w.id]?.box || 0) >= 4).length;
    el.innerHTML = `${user ? "" : `<div class="notice"><small>Login না করলে অগ্রগতি শুধু এই ব্রাউজারে থাকবে। <a href="${root}account/index.html?next=${encodeURIComponent(location.pathname)}">Login</a></small></div>`}
      <div class="grid" style="margin:16px 0">
        <div class="card stat"><span class="muted">আজ review করার</span><strong>${due.length}</strong></div>
        <div class="card stat"><span class="muted">আয়ত্ত হয়েছে</span><strong>${mastered} / ${words.length}</strong></div></div>
      <div class="btn-row" style="margin-bottom:16px"><button class="btn ${mode === "cards" ? "btn-primary" : "btn-outline"}" data-mode="cards">🃏 Flashcard review (${due.length})</button>
        <button class="btn ${mode === "browse" ? "btn-primary" : "btn-outline"}" data-mode="browse">📖 সব শব্দ</button>
        <button class="btn btn-outline" data-mode="add">+ নিজের শব্দ</button></div>
      <div id="vv"></div>`;
    const vv = el.querySelector("#vv");
    if (mode === "browse") {
      vv.innerHTML = `<div style="margin-bottom:12px">${topics.map(t => `<a href="#" class="tag" data-topic="${esc(t)}" style="${t === topic ? "background:var(--green);color:#fff" : ""}">${esc(t)}</a>`).join("")}</div>
        <div class="grid grid-2">${words.filter(w => topic === "All" || w.topic === topic).map(w => `<div class="card">
          <h3>${esc(w.word)} <small class="muted">${esc(w.pos)} ${esc(w.ipa)}</small> <a href="#" data-say="${esc(w.word)}" title="Pronounce" aria-label="Pronounce ${esc(w.word)}">🔊</a></h3>
          <p style="color:var(--ink)">${esc(w.en || "")}${w.bn ? ` · <span>${esc(w.bn)}</span>` : ""}</p>
          ${w.collocations?.length ? `<p><small><strong>Collocations:</strong> ${w.collocations.map(esc).join(" · ")}</small></p>` : ""}
          ${w.example ? `<p style="font-family:var(--font-read)"><em>${esc(w.example)}</em></p>` : ""}
          ${w.context ? `<small class="muted">IELTS: ${esc(w.context)}</small>` : ""}
          ${w.syn?.length || w.ant?.length ? `<small class="muted">≈ ${w.syn.map(esc).join(", ") || "—"} · ≠ ${w.ant.map(esc).join(", ") || "—"}</small>` : ""}
          <div><span class="tag">${boxLabel(P[w.id]?.box)}</span>${w.level ? `<span class="tag">${esc(w.level)}</span>` : ""}
          ${w.custom ? `<a href="#" data-del="${w.id}" style="color:var(--coral);font-size:.85rem">মুছি</a>` : ""}</div></div>`).join("")}</div>`;
    }
    if (mode === "add") {
      vv.innerHTML = `<form class="card" id="af" style="max-width:560px"><label>শব্দ</label><input name="word" required maxlength="60">
        <label>English meaning</label><input name="en" maxlength="200"><label>বাংলা অর্থ</label><input name="bn" maxlength="200">
        <label>Example sentence</label><input name="example" maxlength="300"><button class="btn btn-primary" style="margin-top:12px">যোগ করি</button></form>`;
      vv.querySelector("#af").onsubmit = async e => { e.preventDefault(); try { await V.addCustom(Object.fromEntries(new FormData(e.target))); mode = "browse"; topic = "My words"; render(); } catch (x) { alert(x.message); } };
    }
    if (mode === "cards") cards(vv, due);
  }
  function cards(vv, queue) {
    if (!queue.length) { vv.innerHTML = `<div class="notice">🎉 আজকের review শেষ! আজও পড়ছি।</div>`; V.activity("vocab_quiz"); return; }
    const w = queue[0];
    vv.innerHTML = `<div class="card" style="max-width:560px;text-align:center;min-height:260px;justify-content:center">
        <small class="muted">${queue.length} বাকি</small><h2 style="margin:12px 0">${esc(w.word)}</h2><small class="muted">${esc(w.ipa || "")}</small>
        <div id="back" hidden><p style="color:var(--ink)">${esc(w.en || "")}${w.bn ? " · " + esc(w.bn) : ""}</p>${w.example ? `<p style="font-family:var(--font-read)"><em>${esc(w.example)}</em></p>` : ""}</div>
        <div class="btn-row" style="justify-content:center;margin-top:16px" id="acts"><button class="btn btn-primary" id="flip">অর্থ দেখি</button></div></div>`;
    say(w.word);
    vv.querySelector("#flip").onclick = () => { vv.querySelector("#back").hidden = false;
      vv.querySelector("#acts").innerHTML = `<button class="btn btn-outline" data-r="again">আবার ↺</button><button class="btn btn-primary" data-r="good">মনে ছিল ✓</button><button class="btn btn-outline" data-r="easy">খুব সহজ ⚡</button>`; };
    vv.querySelector("#acts").onclick = async e => { const r = e.target.dataset.r; if (!r) return;
      await V.review(w.id, r); cards(vv, r === "again" ? [...queue.slice(1), w] : queue.slice(1)); };
  }
  el.addEventListener("click", async e => {
    const d = e.target.dataset;
    if (d.mode) { mode = d.mode; render(); }
    if (d.topic) { e.preventDefault(); topic = d.topic; render(); }
    if (d.say) { e.preventDefault(); say(d.say); }
    if (d.del) { e.preventDefault(); if (confirm("মুছবে?")) { await V.removeCustom(d.del); render(); } }
  });
  render();
})();
