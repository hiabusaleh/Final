/* Admin CMS — schema-driven CRUD for posts, videos, questions, mocks + users & audit (Blueprint §23, §24) */
(function () {
  const A = window.PorchiAPI, { esc, root } = window.Porchi, el = document.getElementById("admin");
  if (!A.online) { el.innerHTML = `<div class="notice warn">Admin ব্যবহার করতে server চালু করুন: <code>cd master && npm start</code></div>`; return; }

  /* Resource definitions — add more (questions, mocks) via window.PorchiAdminResources */
  const R = window.PorchiAdminResources = window.PorchiAdminResources || {};
  Object.assign(R, {
    posts: { label: "Posts", perm: "content", cols: ["title", "category", "status", "pinned"], fields: m => [
      ["title", "text", "Title"], ["category", m.CATEGORIES, "Category"], ["status", m.STATUSES, "Status"],
      ["excerpt", "text", "Excerpt"], ["body", "textarea", "Body"], ["image", "text", "Image URL"], ["link", "text", "Link"],
      ["pinned", "checkbox", "Pinned"], ["publishAt", "datetime-local", "Schedule publish (optional)"]] },
    videos: { label: "Videos", perm: "content", cols: ["title", "skill", "status"], fields: m => [
      ["title", "text", "Title"], ["youtube", "text", "YouTube URL"], ["skill", m.SKILLS, "Skill"], ["topic", "text", "Topic"],
      ["description", "textarea", "Description"], ["duration", "text", "Duration"], ["relatedCourse", "text", "Related course (e.g. learn/reading/index.html)"],
      ["relatedPractice", "text", "Related practice"], ["status", m.STATUSES, "Status"]] }
  });
  const PERMS = { content: ["content_editor", "super_admin"], questions: ["question_editor", "super_admin"], users: ["super_admin"], moderate: ["super_admin"] };

  let user, tab;
  A.me().then(u => {
    user = u;
    if (!u) { location.href = root + "account/index.html?next=" + encodeURIComponent(location.pathname); return; }
    const tabs = Object.entries(R).filter(([, r]) => PERMS[r.perm].includes(u.role)).map(([k, r]) => [k, r.label]);
    if (PERMS.users.includes(u.role)) tabs.push(["users", "Users"], ["audit", "Audit log"]);
    if (PERMS.moderate.includes(u.role)) tabs.push(["reports", "Reports"]);
    if (!tabs.length) { el.innerHTML = `<div class="notice warn">এই account-এর Admin অনুমতি নেই।</div>`; return; }
    el.innerHTML = `<div id="tabs" style="margin-bottom:20px">${tabs.map(([k, l]) => `<a href="#${k}" class="tag" data-tab="${k}">${l}</a>`).join("")}</div><div id="panel"></div>`;
    el.querySelector("#tabs").onclick = e => { const t = e.target.dataset.tab; if (t) { e.preventDefault(); open(t); } };
    open(location.hash.slice(1) && tabs.some(t => t[0] === location.hash.slice(1)) ? location.hash.slice(1) : tabs[0][0]);
  });

  const panel = () => el.querySelector("#panel");
  function open(t) {
    tab = t; history.replaceState(null, "", "#" + t);
    el.querySelectorAll("[data-tab]").forEach(a => a.style.cssText = a.dataset.tab === t ? "background:var(--green);color:#fff" : "");
    ({ users: showUsers, audit: showAudit, reports: showReports })[t]?.() ?? showList(t);
  }

  async function showList(t) {
    const r = R[t];
    const j = await A.get(`/admin/${t}`);
    const rows = j[t] || j.items || [];
    r.meta = j.meta || {};
    panel().innerHTML = `<div class="btn-row" style="margin-bottom:12px"><button class="btn btn-primary" id="new">+ নতুন ${r.label}</button></div>
      <div style="overflow-x:auto"><table><tr>${r.cols.map(c => `<th>${c}</th>`).join("")}<th></th></tr>
      ${rows.map(x => `<tr>${r.cols.map(c => `<td>${esc(Array.isArray(x[c]) ? x[c].join(", ") : x[c] ?? "")}</td>`).join("")}
        <td style="white-space:nowrap"><a href="#" data-edit="${x.id}">Edit</a> · <a href="#" data-del="${x.id}" style="color:var(--coral)">Delete</a></td></tr>`).join("")
        || `<tr><td colspan="${r.cols.length + 1}" class="muted">এখনো কিছু নেই।</td></tr>`}</table></div><div id="editor"></div>`;
    panel().querySelector("#new").onclick = () => edit(t, {});
    panel().onclick = async e => {
      const id = e.target.dataset.edit || e.target.dataset.del; if (!id) return; e.preventDefault();
      if (e.target.dataset.edit) return edit(t, rows.find(x => x.id === id));
      if (confirm("মুছে ফেলবেন?")) { await A.del(`/admin/${t}/${id}`); showList(t); }
    };
  }

  function field([name, type, label], v) {
    v = v ?? "";
    if (Array.isArray(type)) return `<label>${label}</label><select name="${name}">${type.map(o => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    if (type === "textarea") return `<label>${label}</label><textarea name="${name}" rows="5">${esc(v)}</textarea>`;
    if (type === "json") return `<label>${label}</label><textarea name="${name}" data-json rows="3" style="font-family:var(--font-mono)">${esc(JSON.stringify(v || null))}</textarea>`;
    if (type === "checkbox") return `<label><input type="checkbox" name="${name}" style="width:auto" ${v ? "checked" : ""}> ${label}</label>`;
    if (type === "datetime-local" && v) v = v.slice(0, 16);
    return `<label>${label}</label><input name="${name}" type="${type}" value="${esc(v)}">`;
  }
  function edit(t, item) {
    const r = R[t], ed = panel().querySelector("#editor");
    ed.innerHTML = `<form class="card" style="margin-top:20px"><h3>${item.id ? "Edit" : "New"} ${r.label}</h3>
      ${r.fields(r.meta).map(f => field(f, item[f[0]])).join("")}
      <p class="notice warn" id="err" hidden></p>
      <div class="btn-row" style="margin-top:16px"><button class="btn btn-primary">Save</button><button type="button" class="btn btn-outline" id="cancel">Cancel</button></div></form>`;
    ed.scrollIntoView({ behavior: "smooth" });
    ed.querySelector("#cancel").onclick = () => ed.innerHTML = "";
    ed.querySelector("form").onsubmit = async e => {
      e.preventDefault();
      const body = {};
      try {
        for (const inp of e.target.querySelectorAll("[name]")) {
          body[inp.name] = inp.type === "checkbox" ? inp.checked : inp.dataset.json !== undefined ? JSON.parse(inp.value || "null") : inp.value;
        }
        item.id ? await A.put(`/admin/${t}/${item.id}`, body) : await A.post(`/admin/${t}`, body);
        showList(t);
      } catch (err) { const p = ed.querySelector("#err"); p.hidden = false; p.textContent = err.message; }
    };
  }

  async function showUsers() {
    const { users, roles } = await A.get("/admin/users");
    panel().innerHTML = `<div style="overflow-x:auto"><table><tr><th>Name</th><th>Email</th><th>Role</th></tr>${users.map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td>
      <td>${u.id === user.id ? esc(u.role) : `<select data-uid="${u.id}">${roles.map(r => `<option ${r === u.role ? "selected" : ""}>${r}</option>`).join("")}</select>`}</td></tr>`).join("")}</table></div>`;
    panel().onchange = async e => { const id = e.target.dataset.uid; if (!id) return;
      try { await A.put(`/admin/users/${id}/role`, { role: e.target.value }); } catch (err) { alert(err.message); showUsers(); } };
  }
  async function showReports() {
    const { reports } = await A.get("/admin/reports");
    panel().innerHTML = `<div style="overflow-x:auto"><table><tr><th>Date</th><th>Reporter → Reported</th><th>Type</th><th>Description</th><th>Status</th></tr>
      ${reports.map(r => `<tr><td>${esc(r.createdAt.slice(0, 10))}</td><td>${esc(r.reporter)} → ${esc(r.reported)}
        ${r.priorReports > 1 ? `<br><span class="tag soon">${r.priorReports} reports</span>` : ""}</td><td>${esc(r.event_type)}</td><td>${esc(r.description)}</td>
        <td><select data-rid="${r.id}">${["open", "reviewing", "resolved", "dismissed"].map(s => `<option ${s === r.status ? "selected" : ""}>${s}</option>`).join("")}</select></td></tr>`).join("")
        || `<tr><td colspan="5" class="muted">কোনো report নেই।</td></tr>`}</table></div>`;
    panel().onclick = null;
    panel().onchange = async e => { const id = e.target.dataset.rid; if (!id) return;
      const resolution = e.target.value === "resolved" || e.target.value === "dismissed" ? prompt("Resolution note (optional)") || "" : "";
      await A.put(`/admin/reports/${id}`, { status: e.target.value, resolution }); };
  }
  async function showAudit() {
    const { audit } = await A.get("/admin/audit");
    panel().innerHTML = `<div style="overflow-x:auto"><table><tr><th>Time</th><th>User</th><th>Action</th><th>Object</th><th>IP</th></tr>${audit.map(a =>
      `<tr><td>${esc(a.createdAt.slice(0, 16).replace("T", " "))}</td><td>${esc(a.userId || "")}</td><td>${esc(a.action)}</td><td>${esc(a.object)}</td><td>${esc(a.ip || "")}</td></tr>`).join("")}</table></div>`;
    panel().onclick = null;
  }
})();
