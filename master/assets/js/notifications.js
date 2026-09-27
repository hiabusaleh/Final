/* Notifications list (Blueprint §38) */
(async function () {
  const A = window.PorchiAPI, { esc, root } = window.Porchi, el = document.getElementById("nt");
  if (!A.online || !(await A.me())) { el.innerHTML = `<div class="notice warn"><a href="${root}account/index.html?next=${encodeURIComponent(location.pathname)}">Login</a> করো।</div>`; return; }
  const { items, unread } = await A.get("/me/notifications");
  el.innerHTML = `<h1>🔔 Notifications</h1>${unread ? `<button class="btn btn-outline" id="ra" style="margin-bottom:16px">সব পড়া হয়েছে</button>` : ""}
    ${items.map(n => `<a class="card" href="${root}${esc(n.link || "")}" style="margin-bottom:10px;text-decoration:none;color:inherit;${n.unread ? "border-left:4px solid var(--green)" : ""}">
      <strong>${esc(n.title)}</strong><span class="muted">${esc(n.body || "")}</span><small class="muted">${esc(n.createdAt.slice(0, 16).replace("T", " "))}</small></a>`).join("")
      || `<p class="muted">কোনো notification নেই।</p>`}
    <p class="muted"><small>Email notification এখনো চালু নেই — শুধু সাইটের ভেতরে।</small></p>`;
  const ra = el.querySelector("#ra"); if (ra) ra.onclick = async () => { await A.post("/me/notifications/read-all"); location.reload(); };
})();
