/* Speaking recorder (Blueprint §34): prompt → prep timer → record → playback → delete/re-record → transcript → AI feedback → optional teacher review */
(function () {
  const A = window.PorchiAPI, { esc, root } = window.Porchi, P = window.PORCHI_SPEAKING, el = document.getElementById("rec");
  const LIMIT = { "Part 1": 45, "Part 2": 120, "Part 3": 90 }, PREP = { "Part 1": 0, "Part 2": 60, "Part 3": 0 };
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let part = "Part 2", idx = 0, stream, recorder, chunks = [], blob, startedAt, timer, recog, transcript = "";

  function promptFor() {
    if (part === "Part 1") { const t = P.part1[idx % P.part1.length]; return { title: t.topic, text: t.questions[0], full: `${t.topic}: ${t.questions[0]}` }; }
    const c = P.part2[idx % P.part2.length];
    if (part === "Part 3") return { title: "Discussion", text: c.part3[0], full: c.part3[0] };
    return { title: "Cue card", text: `${c.card}\nYou should say:\n• ${c.points.join("\n• ")}`, full: c.card + " You should say: " + c.points.join("; ") };
  }

  function render(stage = "ready") {
    const p = promptFor();
    el.innerHTML = `<div class="btn-row" style="margin:16px 0">${Object.keys(LIMIT).map(k => `<button class="btn ${k === part ? "btn-primary" : "btn-outline"}" data-part="${k}" style="padding:6px 14px">${k}</button>`).join("")}
        <a href="#" data-next style="align-self:center">নতুন প্রশ্ন ↻</a></div>
      <div class="cue" style="white-space:pre-line"><strong>${esc(p.title)}</strong>\n${esc(p.text)}</div>
      <div class="card" style="margin-top:16px" id="stage"></div>
      <div class="notice" style="margin-top:16px"><small>🔒 রেকর্ডিং শুধু তোমার ব্রাউজারে থাকে। তুমি নিজে "শিক্ষকের জন্য সংরক্ষণ" বেছে নিলে তবেই server-এ যায়, এবং ${90} দিন পরে নিজে থেকে মুছে যায়। যেকোনো সময় মুছতে পারবে।</small></div>`;
    stageView(stage);
  }
  const $ = s => el.querySelector(s);
  const clock = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  function stageView(stage) {
    const st = $("#stage"); clearInterval(timer);
    if (stage === "ready") {
      st.innerHTML = `<p>Headphone বা শান্ত জায়গা ভালো। Microphone অনুমতি চাইবে।</p>
        <div class="btn-row">${PREP[part] ? `<button class="btn btn-outline" data-go="prep">▶ ${PREP[part]} সেকেন্ড প্রস্তুতি</button>` : ""}
        <button class="btn btn-primary" data-go="record">🎙️ রেকর্ড শুরু</button></div>
        ${PREP[part] ? `<label style="margin-top:16px">Notes (প্রস্তুতির সময়)</label><textarea rows="3" id="notes"></textarea>` : ""}`;
    }
    if (stage === "prep") {
      let left = PREP[part];
      st.innerHTML = `<p>প্রস্তুতি: <span class="score" id="pt">${clock(left)}</span></p><label>Notes</label><textarea rows="4" id="notes" autofocus></textarea>
        <button class="btn btn-primary" data-go="record" style="margin-top:12px">এখনই রেকর্ড শুরু</button>`;
      timer = setInterval(() => { left--; $("#pt").textContent = clock(Math.max(0, left)); if (left <= 0) startRecording(); }, 1000);
    }
    if (stage === "recording") {
      st.innerHTML = `<p><span style="color:var(--coral)">● REC</span> <span class="score" id="rt">00:00</span> / ${clock(LIMIT[part])}</p>
        <div class="progress"><div id="rp" style="width:0"></div></div>
        ${SR ? `<p class="muted" id="live" style="margin-top:12px"><small>Live transcript…</small></p>` : ""}
        <button class="btn btn-primary" data-go="stop" style="margin-top:12px">■ থামাই</button>`;
    }
    if (stage === "review") {
      const url = URL.createObjectURL(blob), secs = Math.round((Date.now() - startedAt) / 1000);
      st.innerHTML = `<h3>শুনে দেখো</h3><audio controls src="${url}" style="width:100%"></audio>
        <div class="btn-row" style="margin:12px 0"><button class="btn btn-outline" data-go="redo">↺ মুছে আবার রেকর্ড</button></div>
        <label>Transcript ${SR ? "(স্বয়ংক্রিয় — ভুল থাকলে ঠিক করো)" : "(যা বলেছ লিখে দাও — phone-এর voice typing ব্যবহার করতে পারো)"}</label>
        <textarea id="tr" rows="6">${esc(transcript)}</textarea>
        ${A.online ? `<label style="font-weight:400;margin-top:12px"><input type="checkbox" id="keep" style="width:auto">
          শিক্ষকের review-এর জন্য রেকর্ডিং Porchi server-এ সংরক্ষণে সম্মতি দিচ্ছি (৯০ দিন, যেকোনো সময় মুছতে পারব)</label>
        <button class="btn btn-primary" data-go="ai" style="margin-top:12px">🤖 AI feedback নিই</button>` : `<p class="notice warn">AI feedback-এর জন্য server চালু থাকতে হবে।</p>`}
        <div id="aiout" style="margin-top:20px"></div>`;
      st.dataset.secs = secs;
    }
  }

  async function startRecording() {
    clearInterval(timer);
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { $("#stage").innerHTML = `<div class="notice warn">${e.name === "NotAllowedError" ? "Microphone-এর অনুমতি দেওয়া হয়নি। Address bar-এর 🔒 থেকে অনুমতি দাও।" : "Microphone পাওয়া যায়নি: " + esc(e.message)}</div>`; return; }
    chunks = []; transcript = "";
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
    recorder.onstop = () => { blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" }); stream.getTracks().forEach(t => t.stop()); stageView("review"); };
    recorder.start(); startedAt = Date.now(); stageView("recording");
    if (SR) { try { recog = new SR(); recog.lang = "en-GB"; recog.continuous = true; recog.interimResults = true;
      recog.onresult = e => { transcript = [...e.results].map(r => r[0].transcript).join(" "); const l = $("#live"); if (l) l.textContent = transcript; };
      recog.start(); } catch { recog = null; } }
    timer = setInterval(() => { const s = Math.round((Date.now() - startedAt) / 1000); $("#rt").textContent = clock(s);
      $("#rp").style.width = Math.min(100, s / LIMIT[part] * 100) + "%"; if (s >= LIMIT[part]) stop(); }, 500);
  }
  function stop() { clearInterval(timer); try { recog?.stop(); } catch {} if (recorder?.state === "recording") recorder.stop(); }

  async function aiFeedback(btn) {
    const out = $("#aiout"), text = $("#tr").value.trim();
    if (text.split(/\s+/).length < 5) { out.innerHTML = `<div class="notice warn">Transcript-এ আরও কিছু লেখা দরকার।</div>`; return; }
    if (!(await A.me())) { out.innerHTML = `<div class="notice"><a href="${root}account/index.html?next=${encodeURIComponent(location.pathname)}">Login</a> করলে AI feedback পাবে।</div>`; return; }
    btn.disabled = true; btn.textContent = "AI ভাবছে…";
    try {
      let recordingId;
      if ($("#keep").checked) {
        const data = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(",")[1]); fr.readAsDataURL(blob); });
        recordingId = (await A.post("/recordings", { consent: true, mime: blob.type, data, seconds: +$("#stage").dataset.secs, prompt: promptFor().full })).recording.id;
      }
      const { result, id } = await A.post("/ai/speaking", { prompt: promptFor().full, transcript: text, part, recordingId });
      out.innerHTML = window.PorchiAI.speaking(result) + `<div class="notice" style="margin-top:16px">সংরক্ষিত।
        ${recordingId ? `<a href="${root}feedback/index.html?id=${id}">শিক্ষকের review চাই →</a>` : "শিক্ষকের review-এর জন্য রেকর্ডিং সংরক্ষণে সম্মতি দিয়ে আবার চেষ্টা করো।"}</div>`;
    } catch (x) { out.innerHTML = `<div class="notice warn">${esc(x.message)}</div>`; }
    btn.disabled = false; btn.textContent = "🤖 AI feedback নিই";
  }

  el.addEventListener("click", e => {
    const d = e.target.dataset;
    if (d.part) { stop(); part = d.part; render(); }
    if ("next" in d) { e.preventDefault(); stop(); idx++; render(); }
    if (d.go === "prep") stageView("prep");
    if (d.go === "record") startRecording();
    if (d.go === "stop") stop();
    if (d.go === "redo") { blob = null; transcript = ""; stageView("ready"); }
    if (d.go === "ai") aiFeedback(e.target);
  });
  if (!window.MediaRecorder || !navigator.mediaDevices) { el.innerHTML = `<div class="notice warn">এই ব্রাউজারে রেকর্ডিং সমর্থিত নয়। Chrome, Edge বা Firefox-এর নতুন সংস্করণ ব্যবহার করো।</div>`; return; }
  render();
})();
