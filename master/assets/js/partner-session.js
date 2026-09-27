/*
 * Speaking Partner session (Exclusive Features Plan §9–§14):
 * 1:1 WebRTC call + structured IELTS Speaking mode (roles, parts, prompts, timer) synced between both learners + feedback.
 * Media is peer-to-peer; recording is OFF and not implemented.
 */
(async function () {
  const A = window.PorchiAPI, { esc, root } = window.Porchi, P = window.PORCHI_SPEAKING, el = document.getElementById("ps");
  const id = new URLSearchParams(location.search).get("id");
  const back = `<p><a href="${root}collaborate/index.html">← Porchi Collaborate</a></p>`;
  if (!A.online) { el.innerHTML = `<div class="notice warn">Session-এর জন্য server চালু থাকতে হবে।</div>${back}`; return; }
  const me = await A.me();
  if (!me) { location.href = `${root}account/index.html?next=${encodeURIComponent(location.pathname + location.search)}`; return; }
  let info;
  try { info = await A.get(`/collab/partner/sessions/${encodeURIComponent(id)}`); } catch (e) { el.innerHTML = `<div class="notice warn">${esc(e.message)}</div>${back}`; return; }
  const { session, iceServers } = info, partner = session.partner;
  if (session.status === "ended") return feedback();

  /* ---------- pre-join: device check + privacy ---------- */
  el.innerHTML = `<div class="eyebrow">Speaking Partner</div><h1>${esc(partner.name)}-এর সাথে practice</h1>
    <p class="muted">${new Date(session.scheduledAt).toLocaleString()} · ${session.minutes} মিনিট</p>
    <div class="notice">🔒 Recording <strong>OFF</strong>. Audio/video সরাসরি তোমাদের দুজনের ব্রাউজারের মধ্যে যায় — Porchi server-এ জমা হয় না।
      ব্যক্তিগত তথ্য (ফোন, ঠিকানা, social media) শেয়ার করো না।</div>
    <div class="card" style="max-width:520px"><label><input type="checkbox" id="cam" style="width:auto" checked> Camera চালু রাখি (বন্ধ রাখলে শুধু audio)</label>
      <button class="btn btn-primary" id="join" style="margin-top:12px">Microphone চালু করে যোগ দিই</button>
      <p class="notice warn" id="jerr" hidden></p></div>${back}`;
  el.querySelector("#join").onclick = async () => {
    const withCam = el.querySelector("#cam").checked;
    try { start(await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: withCam })); }
    catch (e) {
      const x = el.querySelector("#jerr"); x.hidden = false;
      x.textContent = e.name === "NotAllowedError" ? "Microphone-এর অনুমতি দেওয়া হয়নি। ব্রাউজারের address bar-এর 🔒 থেকে অনুমতি দাও।"
        : e.name === "NotFoundError" ? "কোনো microphone/camera পাওয়া যায়নি।" : "Device চালু করা যায়নি: " + e.message;
    }
  };

  /* ---------- live call ---------- */
  function start(local) {
    const state = { examiner: [me.id, partner.id].sort()[0], part: 1, idx: 0, q: 0, timer: null };
    let pc, es, ended = false, tick;
    el.innerHTML = `<div class="call"><div>
        <div class="videos"><video class="remote" autoplay playsinline></video><span id="ph">${esc(partner.name)}-এর জন্য অপেক্ষা…</span>
          <video class="local" autoplay playsinline muted></video><span class="status" id="st">Connecting…</span></div>
        <div class="controls">
          <button class="btn btn-outline" id="mic">🎙 Mute</button>
          ${local.getVideoTracks().length ? `<button class="btn btn-outline" id="camb">📷 Camera off</button>` : ""}
          <button class="btn btn-danger" id="end">End session</button>
          <button class="btn btn-outline" id="rep">⚑ Report</button>
          <button class="btn btn-outline" id="blk">Block</button></div>
        <p class="muted" style="margin-top:8px"><small>Noise কম এমন জায়গায় বসো এবং headphone ব্যবহার করলে echo হবে না।</small></p></div>
      <div class="card" id="mode"></div></div>`;
    const $ = s => el.querySelector(s);
    $(".local").srcObject = local;
    const status = t => $("#st").textContent = t;
    const signal = (type, data) => A.post(`/collab/partner/sessions/${session.id}/signal`, { type, data }).catch(() => {});

    function newPeer() {
      pc?.close();
      pc = new RTCPeerConnection({ iceServers });
      local.getTracks().forEach(t => pc.addTrack(t, local));
      pc.onicecandidate = e => e.candidate && signal("ice", e.candidate.toJSON());
      pc.ontrack = e => { $(".remote").srcObject = e.streams[0]; $("#ph").hidden = true; };
      pc.onconnectionstatechange = () => status({ connected: "● Connected", connecting: "Connecting…", disconnected: "Reconnecting…", failed: "Connection failed — network may need a TURN server" }[pc.connectionState] || pc.connectionState);
      return pc;
    }
    async function call() {                        // the learner who joins second makes the offer
      newPeer();
      await pc.setLocalDescription(await pc.createOffer());
      signal("offer", pc.localDescription.toJSON());
      signal("state", state);
    }
    es = new EventSource(`/api/collab/partner/sessions/${session.id}/events`);
    es.addEventListener("hello", e => { const d = JSON.parse(e.data); if (d.partnerOnline) call(); else { newPeer(); status("Waiting for " + partner.name); } });
    es.addEventListener("signal", async e => {
      const { type, data } = JSON.parse(e.data);
      if (type === "offer") { newPeer(); await pc.setRemoteDescription(data); await pc.setLocalDescription(await pc.createAnswer()); signal("answer", pc.localDescription.toJSON()); }
      else if (type === "answer") await pc.setRemoteDescription(data);
      else if (type === "ice") { try { await pc.addIceCandidate(data); } catch {} }
      else if (type === "state") { Object.assign(state, data); render(); }
      else if (type === "left") { status(partner.name + " left — waiting to reconnect"); $("#ph").hidden = false; $(".remote").srcObject = null; }
      else if (type === "bye") finish(false);
    });
    es.onerror = () => { if (!ended) status("Reconnecting to Porchi…"); };

    $("#mic").onclick = () => { const t = local.getAudioTracks()[0]; t.enabled = !t.enabled; $("#mic").textContent = t.enabled ? "🎙 Mute" : "🔇 Unmute"; };
    if ($("#camb")) $("#camb").onclick = () => { const t = local.getVideoTracks()[0]; t.enabled = !t.enabled; $("#camb").textContent = t.enabled ? "📷 Camera off" : "📷 Camera on"; };
    $("#end").onclick = () => confirm("Session শেষ করবে?") && finish(true);
    $("#rep").onclick = async () => { const d = prompt("কী হয়েছে সংক্ষেপে লেখো:"); if (!d) return;
      try { await A.post("/collab/reports", { reportedUserId: partner.id, sessionId: session.id, eventType: "other", description: d }); alert("Report জমা হয়েছে।"); } catch (x) { alert(x.message); } };
    $("#blk").onclick = async () => { if (!confirm(`${partner.name}-কে block করবে? Session শেষ হয়ে যাবে।`)) return;
      await A.post("/collab/blocks", { userId: partner.id }); finish(true); };

    /* structured IELTS mode — any change is shared with the partner */
    const setState = patch => { Object.assign(state, patch); render(); signal("state", state); };
    function timer(label, secs) { setState({ timer: { label, endsAt: Date.now() + secs * 1000 } }); }
    function render() {
      const amExaminer = state.examiner === me.id, p1 = P.part1[state.idx % P.part1.length], p2 = P.part2[state.idx % P.part2.length];
      const partTabs = [1, 2, 3].map(n => `<button class="btn ${state.part === n ? "btn-primary" : "btn-outline"}" data-part="${n}" style="padding:6px 12px">Part ${n}</button>`).join(" ");
      let body = "";
      if (state.part === 1) body = amExaminer
        ? `<p><strong>Topic: ${esc(p1.topic)}</strong></p><p class="cue">${esc(p1.questions[state.q % p1.questions.length])}</p>
           <button class="btn btn-outline" data-next-q>Next question →</button>`
        : `<p>Examiner তোমাকে <strong>${esc(p1.topic)}</strong> নিয়ে প্রশ্ন করবে। ২–৩ বাক্যে, কারণ ও উদাহরণ দিয়ে উত্তর দাও।</p>`;
      if (state.part === 2) body = `<div class="cue"><strong>${esc(p2.card)}</strong><br>You should say:<ul>${p2.points.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <p class="muted">${amExaminer ? "Candidate ১ মিনিট প্রস্তুতি নেবে, তারপর ২ মিনিট বলবে। মাঝে থামিও না।" : "১ মিনিটে note নাও, তারপর ২ মিনিট বলো।"}</p>
        <div class="btn-row"><button class="btn btn-outline" data-timer="prep">▶ 1-min prep</button><button class="btn btn-outline" data-timer="talk">▶ 2-min talk</button></div>`;
      if (state.part === 3) body = amExaminer
        ? `<p class="cue">${esc(p2.part3[state.q % p2.part3.length])}</p><button class="btn btn-outline" data-next-q>Next question →</button>`
        : `<p>Part 2-এর বিষয়ের সাথে সম্পর্কিত গভীর প্রশ্ন আসবে। মত + কারণ + উদাহরণ + বিপরীত দিক।</p>`;
      const t = state.timer, left = t ? Math.max(0, Math.round((t.endsAt - Date.now()) / 1000)) : null;
      $("#mode").innerHTML = `<h3>IELTS Speaking mode</h3>
        <p>তুমি এখন: <span class="tag">${amExaminer ? "Examiner" : "Candidate"}</span>
          <a href="#" data-swap>Role বদলাই ↔</a> · <a href="#" data-new>নতুন topic</a></p>
        <div class="btn-row" style="margin-bottom:12px">${partTabs}</div>${body}
        <div style="margin-top:16px" aria-live="polite">${t ? `<span class="muted">${esc(t.label)}:</span> <span class="score" style="font-size:1.4rem">${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}</span>${left === 0 ? " ⏰" : ""}` : ""}
          ${state.part !== 2 ? `<button class="btn btn-outline" data-timer="part" style="padding:6px 12px;margin-left:8px">▶ ${P.timings["part" + state.part] / 60}-min timer</button>` : ""}</div>`;
      clearInterval(tick);
      if (t && left > 0) tick = setInterval(render, 1000);
    }
    $("#mode").addEventListener("click", e => {
      const d = e.target.dataset;
      if (d.part) setState({ part: +d.part, q: 0, timer: null });
      if ("nextQ" in d) setState({ q: state.q + 1 });
      if ("swap" in d) { e.preventDefault(); setState({ examiner: state.examiner === me.id ? partner.id : me.id, q: 0, timer: null }); }
      if ("new" in d) { e.preventDefault(); setState({ idx: state.idx + 1, q: 0, timer: null }); }
      if (d.timer === "prep") timer("Preparation", P.timings.part2prep);
      if (d.timer === "talk") timer("Talking", P.timings.part2talk);
      if (d.timer === "part") timer("Part " + state.part, P.timings["part" + state.part]);
    });
    render();

    async function finish(byMe) {
      if (ended) return; ended = true;
      clearInterval(tick); es.close(); pc?.close(); local.getTracks().forEach(t => t.stop());
      if (byMe) await A.post(`/collab/partner/sessions/${session.id}/end`).catch(() => {});
      session.status = "ended"; feedback(byMe ? "" : `${partner.name} session শেষ করেছে।`);
    }
    window.addEventListener("beforeunload", () => { local.getTracks().forEach(t => t.stop()); es?.close(); });
  }

  /* ---------- feedback (§13) ---------- */
  async function feedback(note = "") {
    const s = (await A.get(`/collab/partner/sessions/${encodeURIComponent(id)}`)).session;
    const labels = { fluency: "Fluency", vocabulary: "Vocabulary", grammar: "Grammar", pronunciation: "Pronunciation" };
    el.innerHTML = `<div class="eyebrow">Speaking Partner</div><h1>Session শেষ</h1>${note ? `<p class="notice">${esc(note)}</p>` : ""}
      ${s.myFeedbackGiven ? `<div class="notice">তোমার feedback জমা হয়েছে — ধন্যবাদ।</div>` : `<form class="card" id="fb" style="max-width:620px">
        <h3>${esc(partner.name)}-কে feedback দাও</h3><p class="muted"><small>Peer feedback — official band নয়। সদয় ও নির্দিষ্ট থাকো।</small></p>
        ${Object.entries(labels).map(([k, l]) => `<label>${l}</label><select name="${k}">${[1, 2, 3, 4, 5].map(v => `<option ${v === 3 ? "selected" : ""}>${v}</option>`).join("")}</select>`).join("")}
        <label>একটি জিনিস যা ভালো হয়েছে</label><input name="positive" maxlength="400">
        <label>একটি জিনিস যা উন্নত করা যায়</label><input name="improve" maxlength="400">
        <label><input type="checkbox" name="practiseAgain" style="width:auto"> আবার এর সাথে practice করতে চাই</label>
        <button class="btn btn-primary" style="margin-top:12px">Feedback জমা দিই</button></form>`}
      ${s.feedbackReceived ? `<div class="card" style="margin-top:20px;max-width:620px"><h3>তুমি যে feedback পেয়েছ</h3>
        <p style="color:var(--ink)">${Object.entries(s.feedbackReceived.ratings).map(([k, v]) => `${labels[k]} ${v}/5`).join(" · ")}<br>
        👍 ${esc(s.feedbackReceived.positive || "—")}<br>🔧 ${esc(s.feedbackReceived.improve || "—")}</p></div>` : ""}
      <div class="btn-row" style="margin-top:20px"><a class="btn btn-outline" href="${root}collaborate/index.html">Session history →</a>
        <a class="btn btn-outline" href="${root}learn/speaking/index.html">Speaking course →</a></div>`;
    const f = el.querySelector("#fb");
    if (f) f.onsubmit = async e => { e.preventDefault(); const fd = new FormData(f);
      await A.post(`/collab/partner/sessions/${s.id}/feedback`, { ratings: Object.fromEntries(Object.keys(labels).map(k => [k, fd.get(k)])),
        positive: fd.get("positive"), improve: fd.get("improve"), practiseAgain: fd.has("practiseAgain") }).catch(x => alert(x.message));
      feedback(); };
  }
})();
