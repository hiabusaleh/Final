/* Teacher review workspace (role: teacher / super_admin) */
(async function () {
  const A = window.PorchiAPI, { esc, root } = window.Porchi, el = document.getElementById("rv"), R = window.PorchiAI;
  const u = A.online && await A.me();
  if (!u) { el.innerHTML = `<div class="notice warn"><a href="${root}account/index.html?next=${encodeURIComponent(location.pathname)}">Login</a> করুন।</div>`; return; }
  if (!["teacher", "super_admin"].includes(u.role)) { el.innerHTML = `<div class="notice warn">শুধু শিক্ষকদের জন্য।</div>`; return; }
  const names = { task_response: "Task Response / Achievement", coherence_cohesion: "Coherence & Cohesion", lexical_resource: "Lexical Resource",
    grammar: "Grammatical Range & Accuracy", fluency_coherence: "Fluency & Coherence", pronunciation: "Pronunciation" };
  let status = "requested";
  async function list() {
    const { items } = await A.get("/review/queue?status=" + status);
    el.innerHTML = `<div class="eyebrow">Teacher</div><h1>Review queue</h1>
      <div style="margin-bottom:16px">${[["requested", "অপেক্ষমাণ"], ["claimed", "আমার হাতে"], ["reviewed", "শেষ"]].map(([k, l]) =>
        `<a href="#" class="tag" data-st="${k}" style="${k === status ? "background:var(--green);color:#fff" : ""}">${l}</a>`).join("")}</div>
      ${items.length ? `<table><tr><th>Requested</th><th>Learner</th><th>Type</th><th>AI band</th><th></th></tr>${items.map(i => `<tr>
        <td>${esc(String(i.requestedAt).slice(0, 16).replace("T", " "))}</td><td>${esc(i.learner)}</td><td>${esc(i.kind)}</td><td>${i.aiBand ?? "—"}</td>
        <td>${status === "requested" ? `<a href="#" data-claim="${i.id}">Claim</a>` : `<a href="#" data-open="${i.id}">Open</a>`}</td></tr>`).join("")}</table>`
        : `<p class="muted">কিছু নেই।</p>`}`;
  }
  async function open(id) {
    const { item: f } = await A.get("/review/" + id), done = f.reviewStatus === "reviewed";
    const ai = f.result, aiBand = k => ai[k]?.band ?? "";
    el.innerHTML = `<p><a href="#" data-back>← Queue</a></p><h1>${esc(f.learner)} · ${esc(f.kind)}</h1>
      ${f.learnerNote ? `<div class="notice">Learner note: ${esc(f.learnerNote)}</div>` : ""}
      <div class="grid grid-2" style="align-items:start">
        <div><h3>Task</h3><div class="card" style="white-space:pre-line">${esc(f.input.task || f.input.prompt || "")}</div>
          <h3 style="margin-top:16px">Response</h3><div class="card" style="white-space:pre-line;font-family:var(--font-read)">${esc(f.input.response || f.input.transcript || "")}</div>
          ${f.input.audioId ? `<audio controls src="/api/recordings/${esc(f.input.audioId)}" style="margin-top:12px;width:100%"></audio>` : ""}
          <details style="margin-top:16px"><summary><strong>AI feedback</strong></summary>${f.kind === "writing" ? R.writing(ai) : R.speaking(ai)}</details></div>
        <form class="card" id="tf"><h3>Final assessment</h3>
          ${f.criteria.map(k => `<label>${names[k]} <small class="muted">(AI: ${aiBand(k) || "—"})</small></label>
            <input name="${k}" type="number" min="0" max="9" step="0.5" required value="${done ? f.teacherReview.bands[k] : aiBand(k)}" ${done ? "disabled" : ""}>`).join("")}
          <label>মন্তব্য (learner দেখবে)</label><textarea name="comment" rows="6" required minlength="10" ${done ? "disabled" : ""}>${done ? esc(f.teacherReview.comment) : ""}</textarea>
          <label>Next actions (প্রতি লাইনে একটি)</label><textarea name="actions" rows="3" ${done ? "disabled" : ""}>${done ? esc((f.teacherReview.actions || []).join("\n")) : ""}</textarea>
          ${done ? `<p class="notice">Reviewed · ${f.teacherReview.overall}</p>` : `<button class="btn btn-primary" style="margin-top:12px">Submit review</button>`}</form></div>`;
    const tf = el.querySelector("#tf");
    tf.onsubmit = async e => { e.preventDefault();
      const bands = Object.fromEntries(f.criteria.map(k => [k, tf[k].value]));
      try { await A.put("/review/" + f.id, { bands, comment: tf.comment.value, actions: tf.actions.value.split("\n").map(s => s.trim()).filter(Boolean) }); status = "reviewed"; list(); }
      catch (x) { alert(x.message); } };
  }
  el.addEventListener("click", async e => {
    const d = e.target.dataset;
    if (d.st) { e.preventDefault(); status = d.st; list(); }
    if (d.claim) { e.preventDefault(); try { await A.post(`/review/${d.claim}/claim`); open(d.claim); } catch (x) { alert(x.message); list(); } }
    if (d.open) { e.preventDefault(); open(d.open); }
    if ("back" in d) { e.preventDefault(); list(); }
  });
  list();
})();
