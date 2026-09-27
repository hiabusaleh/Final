/* Micro practice (Blueprint §32): 5-min vocab quiz, grammar quick test, 5-question reading, Speaking Part 1, Task 2 intro drill */
(async function () {
  const A = window.PorchiAPI, { esc, root } = window.Porchi, el = document.getElementById("micro");
  const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
  const user = A.online ? await A.me() : null;
  el.innerHTML = `<div class="grid" style="margin-top:16px">
      <a class="card" href="#vq" data-go="vq"><h3>⏱️ ৫ মিনিটের vocabulary quiz</h3><p>১০টি প্রশ্ন: অর্থ দেখে সঠিক শব্দ</p></a>
      <a class="card" href="#gq" data-go="gq"><h3>✏️ Grammar quick test</h3><p>বিভিন্ন বিষয় থেকে ৫টি প্রশ্ন</p></a>
      <a class="card" href="${root}practice/index.html?skill=reading&random=1"><h3>📖 ৫-প্রশ্নের Reading challenge</h3><p>Question bank থেকে এলোমেলো প্রশ্ন</p></a>
      <a class="card" href="${root}practice/speaking/index.html"><h3>🗣️ Speaking Part 1 challenge</h3><p>রেকর্ড করে শোনো</p></a>
      <a class="card" href="#t2" data-go="t2"><h3>✍️ Task 2 introduction drill</h3><p>একটি ভূমিকা লিখে checklist ও AI feedback</p></a>
      <a class="card" href="${root}vocabulary/index.html"><h3>🃏 আজকের flashcards</h3><p>Spaced review</p></a></div>
    <div id="mx" style="margin-top:28px;max-width:820px"></div>`;
  const mx = el.querySelector("#mx");
  const done = kind => user && A.post("/me/activity", { kind }).catch(() => {});

  function vocabQuiz() {
    const words = window.PORCHI_VOCAB, qs = shuffle(words).slice(0, 10);
    let i = 0, score = 0, left = 300;
    const tick = setInterval(() => { left--; const t = mx.querySelector("#vt"); if (t) t.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; if (left <= 0) finish(); }, 1000);
    function q() {
      if (i >= qs.length) return finish();
      const w = qs[i], opts = shuffle([w, ...shuffle(words.filter(x => x.id !== w.id && x.topic === w.topic)).slice(0, 1), ...shuffle(words.filter(x => x.id !== w.id)).slice(0, 3)]
        .filter((x, k, arr) => arr.findIndex(y => y.id === x.id) === k).slice(0, 4));
      mx.innerHTML = `<div class="card"><p class="muted">প্রশ্ন ${i + 1}/10 · ⏱️ <span id="vt"></span> · Score ${score}</p>
        <h3>"${esc(w.en)}" <small class="muted">(${esc(w.bn)})</small></h3>
        <div class="btn-row">${opts.map(o => `<button class="btn btn-outline" data-w="${o.id}">${esc(o.word)}</button>`).join("")}</div><div id="vf"></div></div>`;
      mx.querySelector(".btn-row").onclick = e => { const id = e.target.dataset.w; if (!id) return;
        const ok = id === w.id; score += ok; mx.querySelectorAll("[data-w]").forEach(b => { b.disabled = true; if (b.dataset.w === w.id) b.className = "btn btn-primary"; });
        mx.querySelector("#vf").innerHTML = `<p>${ok ? "✓ সঠিক" : `✗ সঠিক: <strong>${esc(w.word)}</strong>`} — <em>${esc(w.example)}</em></p>`;
        i++; setTimeout(q, ok ? 700 : 1800); };
    }
    function finish() { clearInterval(tick); mx.innerHTML = `<div class="card"><h3>ফলাফল: <span class="score">${score}/10</span></h3>
      <p>${score >= 8 ? "দারুণ! আজও পড়ছি।" : "ভুল শব্দগুলো flashcard-এ review করো।"}</p><a class="btn btn-primary" href="${root}vocabulary/index.html">Flashcards →</a></div>`; done("vocab_quiz"); }
    q();
  }
  function grammarQuiz() {
    const qs = shuffle(window.PORCHI_GRAMMAR.flatMap(g => g.q.map(q => ({ topic: g.topic, id: g.id, q })))).slice(0, 5);
    mx.innerHTML = `<form class="card" id="gf"><h3>Grammar quick test</h3>${qs.map(({ topic, q: [s, opts] }, i) => `<div style="margin:12px 0" data-i="${i}">
      <small class="tag">${esc(topic)}</small><p style="color:var(--ink)">${esc(s)}</p>${opts.map((o, j) => `<label style="display:inline-block;font-weight:400;margin-right:16px">
      <input type="radio" name="q${i}" value="${j}" style="width:auto"> ${esc(o)}</label>`).join("")}<div class="fb"></div></div>`).join("")}
      <button class="btn btn-primary">উত্তর দেখি</button> <span id="gs"></span></form>`;
    mx.querySelector("#gf").onsubmit = e => { e.preventDefault(); let score = 0;
      qs.forEach(({ id, q: [, opts, ans, why] }, i) => { const v = e.target["q" + i].value, ok = v !== "" && +v === ans; score += ok;
        e.target.querySelector(`[data-i="${i}"] .fb`).innerHTML = `<small>${ok ? "✓" : `✗ সঠিক: <strong>${esc(opts[ans])}</strong>`} — ${esc(why)} <a href="${root}grammar/index.html#${id}">Lesson →</a></small>`; });
      mx.querySelector("#gs").innerHTML = `<span class="score">${score}/5</span>`; done("grammar"); };
  }
  function introDrill() {
    const prompts = ["Some people believe that university education should be free for everyone. To what extent do you agree or disagree?",
      "In many cities, the number of cars is increasing. What problems does this cause, and what solutions can you suggest?",
      "Some think children should start learning a foreign language at primary school; others think secondary school is better. Discuss both views and give your opinion."];
    const p = prompts[Math.floor(Math.random() * prompts.length)];
    mx.innerHTML = `<div class="card"><h3>Task 2 introduction drill</h3><div class="cue">${esc(p)}</div>
      <label>তোমার introduction (২–৩ বাক্য, ৪০–৬০ শব্দ)</label><textarea id="intro" rows="5" spellcheck="false"></textarea><p class="muted">Words: <strong id="iw">0</strong></p>
      <h3>Checklist</h3>${["প্রশ্নটি নিজের ভাষায় paraphrase করেছি", "আমার অবস্থান/উত্তর স্পষ্ট করেছি", "essay-তে কী আলোচনা হবে তার ইঙ্গিত দিয়েছি", "প্রশ্নের বাক্য হুবহু কপি করিনি"]
        .map(c => `<label style="font-weight:400"><input type="checkbox" style="width:auto"> ${c}</label>`).join("")}
      <button class="btn btn-primary" id="ia" style="margin-top:12px">🤖 AI-কে দেখাই</button><div id="io" style="margin-top:12px"></div></div>`;
    const ta = mx.querySelector("#intro"); ta.oninput = () => mx.querySelector("#iw").textContent = ta.value.trim().split(/\s+/).filter(Boolean).length;
    mx.querySelector("#ia").onclick = async () => {
      const out = mx.querySelector("#io"), text = ta.value.trim();
      if (text.split(/\s+/).length < 15) { out.innerHTML = `<div class="notice warn">আরও একটু লেখো (অন্তত ১৫ শব্দ)।</div>`; return; }
      if (!user) { out.innerHTML = `<div class="notice"><a href="${root}account/index.html?next=${encodeURIComponent(location.pathname)}">Login</a> করলে AI feedback পাবে।</div>`; return; }
      out.innerHTML = `<p class="muted">AI ভাবছে…</p>`;
      try { const { result } = await A.post("/ai/chat", { messages: [{ role: "user", content:
          `Check my IELTS Task 2 introduction. Question: "${p}"\nMy introduction: "${text}"\nTell me briefly: (1) did I paraphrase well, (2) is my position clear, (3) is there an outline, (4) one improved version under 60 words.` }] });
        out.innerHTML = `<div class="card" style="white-space:pre-wrap">${esc(result.reply)}</div><small class="muted">🤖 Porchi AI estimate</small>`; done("micro"); }
      catch (x) { out.innerHTML = `<div class="notice warn">${esc(x.message)}</div>`; }
    };
  }
  el.addEventListener("click", e => { const g = e.target.closest("[data-go]")?.dataset.go; if (!g) return; e.preventDefault();
    ({ vq: vocabQuiz, gq: grammarQuiz, t2: introDrill })[g](); mx.scrollIntoView({ behavior: "smooth" }); });
})();
