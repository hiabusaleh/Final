/* Collaborate Phase A UI: Speaking Partner preferences + matches, Study Room create/join, report/block */
(async function () {
  const A = window.PorchiAPI, { esc, root } = window.Porchi, el = document.getElementById("collab");
  if (!A.online) return;
  const user = await A.me();
  if (!user) { el.innerHTML = `<div class="notice" style="margin-top:16px"><a href="${root}account/index.html?next=${encodeURIComponent(location.pathname)}">Login</a> করে Speaking Partner ও Study Room চালু করো।</div>`; return; }
  const chk = (name, list, sel = []) => list.map(v => `<label style="display:inline-block;font-weight:400;margin-right:12px"><input type="checkbox" name="${name}" value="${v}" style="width:auto" ${sel.includes(v) ? "checked" : ""}> ${v}</label>`).join("");

  async function render() {
    const [{ prefs, options }, { rooms, options: ro }] = await Promise.all([A.get("/collab/partner-prefs"), A.get("/collab/rooms")]);
    const p = prefs || { testType: "academic", targetBand: 6.5, speakingLevel: 5.5, parts: [], days: [], times: [], minutes: 30 };
    el.innerHTML = `<div class="grid grid-2" style="margin-top:32px;align-items:start">
      <form class="card" id="pf"><h3>🗣️ Speaking Partner</h3>
        <label><input type="checkbox" name="enabled" style="width:auto" ${p.enabled ? "checked" : ""}> Speaking Partner চালু</label>
        <label>Test type</label><select name="testType"><option value="academic">Academic</option><option value="general" ${p.testType === "general" ? "selected" : ""}>General Training</option></select>
        <label>Target band</label><input name="targetBand" type="number" step="0.5" min="4" max="9" value="${p.targetBand}">
        <label>বর্তমান Speaking level (আনুমানিক)</label><input name="speakingLevel" type="number" step="0.5" min="1" max="9" value="${p.speakingLevel}">
        <label>Parts</label>${chk("parts", options.PARTS, p.parts)}
        <label>Days</label>${chk("days", options.DAYS, p.days)}
        <label>Times</label>${chk("times", options.TIMES, p.times)}
        <label>Session length</label><select name="minutes">${[15, 30, 45].map(m => `<option ${m === p.minutes ? "selected" : ""}>${m}</option>`).join("")}</select>
        <label><input type="checkbox" name="communityGuidelinesAccepted" style="width:auto" ${p.communityGuidelinesAccepted ? "checked" : ""}>
          Community guidelines মানব — সম্মানজনক আচরণ, ব্যক্তিগত তথ্য চাওয়া নয়, শুধু IELTS practice</label>
        <p class="notice warn" id="perr" hidden></p>
        <button class="btn btn-primary" style="margin-top:12px">Save</button>
        <div id="matches"></div></form>
      <div><div class="card"><h3>📚 Study Rooms</h3>
        <form id="rf"><label>Room name</label><input name="name" required maxlength="80">
          <label>Template</label><select name="template">${ro.TEMPLATES.map(t => `<option>${t}</option>`).join("")}</select>
          <label>Type</label><select name="type">${ro.ROOM_TYPES.map(t => `<option>${t}</option>`).join("")}</select>
          <label>Max members</label><input name="maxMembers" type="number" min="2" max="8" value="4">
          <button class="btn btn-primary" style="margin-top:12px">Room বানাই</button></form>
        <form id="jf" style="margin-top:20px"><label>Invite code দিয়ে join</label><input name="code" maxlength="20" placeholder="e.g. 3F9A21BC">
          <button class="btn btn-outline" style="margin-top:8px">Join</button></form>
        <p class="notice warn" id="rerr" hidden></p></div>
        <div id="rooms" style="margin-top:16px">${rooms.map(r => `<div class="card" style="margin-bottom:12px"><h3>${esc(r.name)} <span class="tag">${esc(r.myRole)}</span></h3>
          <p>${esc(r.template)} · ${esc(r.type)} · ${r.members.length}/${r.maxMembers}${r.inviteCode ? ` · Invite code: <strong style="font-family:var(--font-mono)">${esc(r.inviteCode)}</strong>` : ""}<br>
          Members: ${r.members.map(m => `${esc(m.name)} (${m.role})${m.userId !== user.id ? ` <a href="#" data-report="${m.userId}" data-room="${r.id}" title="Report">⚑</a>` : ""}`).join(", ")}<br>
          <small>Live audio/video, shared page ও whiteboard — Phase C-তে আসবে।</small></p>
          <a href="#" data-leave="${r.id}">${r.myRole === "owner" ? "Room বন্ধ করি" : "Leave"}</a></div>`).join("")}</div></div></div>`;

    const err = (id, e) => { const x = el.querySelector(id); x.hidden = false; x.textContent = e.message; };
    el.querySelector("#pf").onsubmit = async e => {
      e.preventDefault(); const fd = new FormData(e.target);
      const body = { ...Object.fromEntries(fd), enabled: fd.has("enabled"), communityGuidelinesAccepted: fd.has("communityGuidelinesAccepted"),
        parts: fd.getAll("parts"), days: fd.getAll("days"), times: fd.getAll("times") };
      try { await A.put("/collab/partner-prefs", body); await render(); if (body.enabled) showMatches(); } catch (x) { err("#perr", x); }
    };
    el.querySelector("#rf").onsubmit = async e => { e.preventDefault(); try { await A.post("/collab/rooms", Object.fromEntries(new FormData(e.target))); render(); } catch (x) { err("#rerr", x); } };
    el.querySelector("#jf").onsubmit = async e => { e.preventDefault(); try { await A.post("/collab/rooms/join", Object.fromEntries(new FormData(e.target))); render(); } catch (x) { err("#rerr", x); } };
    if (p.enabled) showMatches();
  }
  async function showMatches() {
    const box = el.querySelector("#matches");
    try {
      const { matches } = await A.get("/collab/partner-matches");
      box.innerHTML = `<h3 style="margin-top:20px">Suggested partners</h3>` + (matches.map(m => `<div class="notice">${esc(m.name)} · Speaking ~${m.speakingLevel} · Target ${m.targetBand}<br>
        <small>${m.commonDays.join(", ")} · ${m.commonTimes.join(", ")} · ${m.parts.join(", ")}</small><br>
        <small><a href="#" data-block="${m.userId}">Block</a> · <a href="#" data-report="${m.userId}">Report</a> · Session booking Phase B-তে আসবে</small></div>`).join("")
        || `<p class="muted">এখনো মিলে যাওয়ার মতো partner নেই — পরে আবার দেখো।</p>`);
    } catch (x) { box.innerHTML = `<p class="muted">${esc(x.message)}</p>`; }
  }
  el.addEventListener("click", async e => {
    const d = e.target.dataset;
    if (d.leave) { e.preventDefault(); if (confirm("নিশ্চিত?")) { await A.post(`/collab/rooms/${d.leave}/leave`); render(); } }
    if (d.block) { e.preventDefault(); if (confirm("Block করবে? এরপর একে আর match বা room-এ দেখবে না।")) { await A.post("/collab/blocks", { userId: d.block }); showMatches(); } }
    if (d.report) { e.preventDefault(); const description = prompt("কী হয়েছে সংক্ষেপে লেখো (অন্তত ৫ অক্ষর):"); if (!description) return;
      try { await A.post("/collab/reports", { reportedUserId: d.report, roomId: d.room || "", eventType: "other", description }); alert("Report জমা হয়েছে। ধন্যবাদ।"); } catch (x) { alert(x.message); } }
  });
  render();
})();
