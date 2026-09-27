/* Study plan page: goal form, today's tasks, recommendations, weekly plan, One Skill Retake (Blueprint §15, §20, §30) */
(async function () {
  const A = window.PorchiAPI, { esc, root, store } = window.Porchi, el = document.getElementById("plan");
  const user = A.online ? await A.me() : null;
  if (!user) { // logged-out: simple local plan from the diagnostic
    const d = store.get("diagnostic", null);
    el.innerHTML = `<div class="notice">${d ? "নিচে diagnostic থেকে একটি সাধারণ plan।" : `আগে <a href="${root}diagnostic/index.html">level যাচাই করো</a>।`}
      <a href="${root}account/index.html?next=${encodeURIComponent(location.pathname)}">Login</a> করলে তোমার আসল ভুল ও mock থেকে ব্যক্তিগত plan, আজকের কাজ ও One Skill Retake mode পাবে।</div>`;
    return;
  }
  const cap = s => s[0].toUpperCase() + s.slice(1), SK = ["listening", "reading", "writing", "speaking"];
  const CHECK = ["সর্বশেষ full test-এর তারিখ থেকে ৬০ দিনের মধ্যে আছি (official শর্ত যাচাই করেছি)", "Test centre One Skill Retake দেয় কি না নিশ্চিত করেছি",
    "Focus skill-এ অন্তত ২টি timed mock দিয়েছি", "Mistake Book-এ কোনো খোলা ভুল নেই", "শেষ ২টি mock-এ target band পেয়েছি"];

  async function render() {
    const [p, me] = [await A.get("/me/plan"), await A.me()];
    const pr = me.profile || {}, w = p.weakness, osr = p.osr;
    el.innerHTML = `<form class="card" id="goal" style="margin:16px 0"><h3>🎯 আমার লক্ষ্য</h3><div class="grid">
        <div><label>Test type</label><select name="testType">${["ielts-academic", "ielts-general", "ielts-ukvi-academic", "ielts-ukvi-general"].map(t => `<option value="${t}" ${t === (pr.testType || pr.diagnostic?.test) ? "selected" : ""}>${t.replace("ielts-", "").replace("-", " ")}</option>`).join("")}</select></div>
        <div><label>Target band</label><input name="targetBand" type="number" min="4" max="9" step="0.5" value="${w.target}"></div>
        <div><label>Test date</label><input name="testDate" type="date" value="${esc(pr.testDate || pr.diagnostic?.date || "")}"></div>
        <div><label>দৈনিক সময় (ঘণ্টা)</label><input name="hoursPerDay" type="number" min="0.25" max="8" step="0.25" value="${p.hours}"></div></div>
        <button class="btn btn-primary" style="margin-top:12px">Plan আপডেট করি</button></form>
      <div class="grid grid-2" style="align-items:start">
        <div class="card"><h3>📅 আজকের কাজ</h3>${p.today.map(t => `<label style="font-weight:400;display:flex;gap:8px;align-items:center">
          <input type="checkbox" data-task="${t.id}" style="width:auto" ${t.done ? "checked" : ""}>
          <span style="${t.done ? "text-decoration:line-through;color:var(--muted)" : ""}"><a href="${root}${esc(t.link)}">${esc(t.title)}</a> · ${t.minutes} মিনিট</span></label>`).join("")}
          <small class="muted">${p.today.every(t => t.done) ? "আজকের কাজ শেষ। আজও পড়ছি! 🎉" : `${p.days} দিন বাকি · দিনে ~${p.hours} ঘণ্টা`}</small></div>
        <div class="card"><h3>🔍 দুর্বল জায়গা</h3>
          <p>Skill: ${w.weakSkills.map(s => `<span class="tag">${cap(s)}${w.bands[s] != null ? " " + w.bands[s] : ""}</span>`).join("")}</p>
          ${w.weakTypes.length ? `<p>Question types: ${w.weakTypes.slice(0, 5).map(t => `<span class="tag">${esc(t.type)} ${t.accuracy}%</span>`).join("")}</p>` : `<p class="muted"><small>আরও practice করলে question-type দুর্বলতা দেখা যাবে।</small></p>`}
          <small class="muted">Open mistakes: ${w.openMistakes} · Mocks: ${w.mockCount}</small></div></div>
      ${p.recommendations.length ? `<h2 style="margin-top:32px">এখান থেকে শুরু করলে সবচেয়ে বেশি লাভ হবে</h2><div class="grid">${p.recommendations.map(r => `<div class="card">
        <h3>${esc(r.type)} <small class="muted">${r.accuracy}%</small></h3><ol>${r.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol><a class="more" href="${root}${r.link}">শুরু করি →</a></div>`).join("")}</div>` : ""}
      <div class="btn-row" style="margin-top:24px"><button class="btn btn-outline" id="adv">🤖 AI-এর ব্যক্তিগত পরামর্শ</button></div><div id="advout"></div>
      <h2 style="margin-top:32px">সপ্তাহভিত্তিক plan</h2>${p.weeks.map(k => `<details class="card" style="margin-bottom:10px" ${k.week === 1 ? "open" : ""}>
        <summary><strong>Week ${k.week}</strong> <span class="tag">${k.stage}</span></summary><ul>${k.tasks.map(t => `<li>${esc(t)}</li>`).join("")}</ul></details>`).join("")}
      <h2 style="margin-top:40px" id="osr">🔁 One Skill Retake mode</h2>
      <div class="notice warn"><small>Porchi eligibility নিশ্চিত করে না। সাধারণত একটি eligible full computer-delivered test-এর পর ৬০ দিনের মধ্যে, নির্দিষ্ট centre-এ — সর্বশেষ শর্ত
        <a target="_blank" rel="noopener" href="https://ielts.org/take-a-test/booking-your-test/one-skill-retake">official page</a> ও test centre-এ যাচাই করো।</small></div>
      <form class="card" id="osrf"><p>তোমার full test-এর result দাও; সবচেয়ে কম band-এর skill focus হবে (চাইলে বদলাও)।</p><div class="grid">
        ${SK.map(s => `<div><label>${cap(s)}</label><input name="${s}" type="number" min="0" max="9" step="0.5" value="${osr?.bands?.[s] ?? ""}"></div>`).join("")}</div>
        <label>Full test date</label><input name="fullTestDate" type="date" value="${esc(osr?.fullTestDate || "")}" style="max-width:240px">
        <label>Focus skill</label><select name="focusSkill" style="max-width:240px"><option value="">(সবচেয়ে কম band)</option>${SK.map(s => `<option ${osr?.focusSkill === s ? "selected" : ""}>${s}</option>`).join("")}</select>
        ${osr ? `<h3 style="margin-top:16px">Retake readiness checklist · ${cap(osr.focusSkill)}</h3>${CHECK.map((c, i) => `<label style="font-weight:400"><input type="checkbox" name="c${i}" style="width:auto" ${osr.checklist?.[i] ? "checked" : ""}> ${c}</label>`).join("")}` : ""}
        <div class="btn-row" style="margin-top:12px"><button class="btn btn-primary">${osr ? "আপডেট করি" : "OSR mode চালু করি"}</button>${osr ? `<button type="button" class="btn btn-outline" id="osroff">OSR mode বন্ধ</button>` : ""}</div></form>`;

    el.querySelector("#goal").onsubmit = async e => { e.preventDefault(); await A.put("/me/profile", { profile: Object.fromEntries(new FormData(e.target)) }); render(); };
    el.querySelectorAll("[data-task]").forEach(c => c.onchange = async () => { await A.post("/me/plan/done", { taskId: c.dataset.task, done: c.checked }); render(); });
    el.querySelector("#adv").onclick = async e => { const out = el.querySelector("#advout"); e.target.disabled = true; out.innerHTML = `<p class="muted">AI ভাবছে…</p>`;
      try { const { result: r } = await A.post("/me/plan/ai-advice"); out.innerHTML = `<div class="card" style="margin-top:12px"><p style="color:var(--ink)">${esc(r.summary)}</p>
        <h3>Priorities</h3><ul>${r.priorities.map(x => `<li>${esc(x)}</li>`).join("")}</ul><h3>Daily routine</h3><ul>${r.daily_routine.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        <h3>সতর্ক সংকেত</h3><ul>${r.warning_signs.map(x => `<li>${esc(x)}</li>`).join("")}</ul>${r.bangla_tip ? `<div class="notice">💡 ${esc(r.bangla_tip)}</div>` : ""}<small class="muted">🤖 ${esc(r.label)}</small></div>`; }
      catch (x) { out.innerHTML = `<div class="notice warn">${esc(x.message)}</div>`; } e.target.disabled = false; };
    el.querySelector("#osrf").onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target);
      const bands = Object.fromEntries(SK.map(s => [s, +f.get(s) || 0]));
      const focusSkill = f.get("focusSkill") || SK.filter(s => bands[s] > 0).sort((a, b) => bands[a] - bands[b])[0];
      if (!focusSkill) return alert("অন্তত একটি band দাও।");
      await A.put("/me/profile", { profile: { osr: { bands, focusSkill, fullTestDate: f.get("fullTestDate"), checklist: CHECK.map((_, i) => f.has("c" + i)) } } }); render(); };
    const off = el.querySelector("#osroff"); if (off) off.onclick = async () => { await A.put("/me/profile", { profile: { osr: null } }); render(); };
  }
  render();
})();
