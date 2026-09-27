/* AI Teacher page: chat, writing feedback, speaking transcript analysis */
(async function () {
  const A = window.PorchiAPI, { esc, root } = window.Porchi, el = document.getElementById("ai-app"), R = window.PorchiAI;
  if (!A.online) { el.innerHTML = `<div class="notice warn" style="margin-top:20px">AI Teacher ব্যবহার করতে server চালু করতে হবে।</div>`; return; }
  const [status, user] = await Promise.all([A.get("/ai/status"), A.me()]);
  if (!status.enabled) { el.innerHTML = `<div class="notice warn" style="margin-top:20px">এই server-এ AI Teacher এখনো চালু হয়নি।<br><small>Admin: <code>npm install</code> এবং <code>ANTHROPIC_API_KEY</code> সেট করে server চালান।</small></div>`; return; }
  if (!user) { el.innerHTML = `<div class="notice" style="margin-top:20px"><a href="${root}account/index.html?next=${encodeURIComponent(location.pathname)}">Login</a> করে AI Teacher ব্যবহার করো।</div>`; return; }

  el.innerHTML = `<div style="margin:28px 0 16px">${[["chat", "💬 প্রশ্ন করি"], ["writing", "✍️ Writing feedback"], ["speaking", "🗣️ Speaking feedback"]]
      .map(([k, l]) => `<a href="#" class="tag" data-t="${k}">${l}</a>`).join("")}</div><div id="ai-panel"></div>`;
  const panel = el.querySelector("#ai-panel"), history = [];
  const busy = (btn, on) => { btn.disabled = on; btn.textContent = on ? "AI ভাবছে…" : btn.dataset.label; };
  const saved = id => `<div class="notice" style="margin-top:16px">সংরক্ষিত হয়েছে। শিক্ষকের যাচাই চাইলে → <a href="${root}feedback/index.html?id=${id}">শিক্ষকের review চাই</a></div>`;
  const fail = (box, e) => box.innerHTML = `<div class="notice warn">${esc(e.message)}</div>`;

  const views = {
    chat() {
      panel.innerHTML = `<div class="card" style="max-width:820px"><div id="log" style="max-height:55vh;overflow:auto">${history.map(m => bubble(m)).join("") ||
          `<p class="muted">যেমন: "Matching Headings কীভাবে দ্রুত করব?" বা "Task 2-এ conclusion কীভাবে লিখব?"</p>`}</div>
        <form id="cf" style="display:flex;gap:8px;margin-top:12px"><input name="q" required maxlength="4000" placeholder="তোমার প্রশ্ন…" autocomplete="off">
          <button class="btn btn-primary" data-label="পাঠাই">পাঠাই</button></form></div>`;
      const log = panel.querySelector("#log"); log.scrollTop = log.scrollHeight;
      panel.querySelector("#cf").onsubmit = async e => {
        e.preventDefault(); const btn = e.target.querySelector("button"), q = e.target.q.value.trim(); if (!q) return;
        history.push({ role: "user", content: q }); views.chat(); busy(panel.querySelector("#cf button"), true);
        try { const { result } = await A.post("/ai/chat", { messages: history }); history.push({ role: "assistant", content: result.reply }); }
        catch (x) { history.pop(); alert(x.message); }
        views.chat();
      };
    },
    writing() {
      panel.innerHTML = `<form class="card" id="wf" style="max-width:820px">
        <label>Task</label><select name="taskType"><option>Task 2</option><option>Task 1</option></select>
        <label>প্রশ্ন (task prompt)</label><textarea name="task" rows="3" required></textarea>
        <label>তোমার লেখা (যেমন লিখেছ তেমনই — কিছু ঠিক করবে না)</label>
        <textarea name="response" rows="14" required spellcheck="false" style="font-family:var(--font-read)"></textarea>
        <p class="muted">Words: <strong id="wc">0</strong></p>
        <button class="btn btn-primary" data-label="Feedback নিই">Feedback নিই</button></form><div id="wout" style="margin-top:20px;max-width:980px"></div>`;
      const f = panel.querySelector("#wf");
      f.response.oninput = () => panel.querySelector("#wc").textContent = f.response.value.trim().split(/\s+/).filter(Boolean).length;
      f.onsubmit = async e => { e.preventDefault(); const btn = f.querySelector("button"), out = panel.querySelector("#wout"); busy(btn, true);
        try { const { result, id } = await A.post("/ai/writing", Object.fromEntries(new FormData(f))); out.innerHTML = R.writing(result) + saved(id); } catch (x) { fail(out, x); }
        busy(btn, false); };
    },
    speaking() {
      panel.innerHTML = `<form class="card" id="sf" style="max-width:820px">
        <label>Part</label><select name="part"><option>Part 1</option><option selected>Part 2</option><option>Part 3</option></select>
        <label>প্রশ্ন / cue card</label><textarea name="prompt" rows="3" required></textarea>
        <label>তোমার উত্তর (transcript — বলা কথা লিখে বা phone-এর voice typing দিয়ে)</label><textarea name="transcript" rows="10" required></textarea>
        <p class="muted"><small>Text থেকে pronunciation মূল্যায়ন করা যায় না — সেটা আলাদাভাবে বলা হবে।</small></p>
        <button class="btn btn-primary" data-label="Feedback নিই">Feedback নিই</button></form><div id="sout" style="margin-top:20px;max-width:980px"></div>`;
      const f = panel.querySelector("#sf");
      f.onsubmit = async e => { e.preventDefault(); const btn = f.querySelector("button"), out = panel.querySelector("#sout"); busy(btn, true);
        try { const { result, id } = await A.post("/ai/speaking", Object.fromEntries(new FormData(f))); out.innerHTML = R.speaking(result) + saved(id); } catch (x) { fail(out, x); }
        busy(btn, false); };
    }
  };
  function bubble(m) {
    return `<div style="margin:8px 0;display:flex;${m.role === "user" ? "justify-content:flex-end" : ""}"><div style="max-width:80%;padding:10px 14px;border-radius:14px;white-space:pre-wrap;
      background:${m.role === "user" ? "var(--green);color:#fff" : "var(--mist);color:var(--ink)"}">${esc(m.content)}</div></div>`;
  }
  el.querySelector("div").onclick = e => { const t = e.target.dataset.t; if (!t) return; e.preventDefault();
    el.querySelectorAll("[data-t]").forEach(a => a.style.cssText = a.dataset.t === t ? "background:var(--green);color:#fff" : ""); views[t](); };
  el.querySelector('[data-t="chat"]').click();
})();
