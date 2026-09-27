/* Login / register / profile (Blueprint §50 Student: Account) */
(function () {
  const A = window.PorchiAPI, { esc, store, root } = window.Porchi, el = document.getElementById("account");
  if (!A.online) {
    el.innerHTML = `<h1>Account</h1><div class="notice warn">Account ব্যবহার করতে server চালু করতে হবে:
      <br><code>cd master && npm start</code> তারপর <code>http://localhost:3000</code> খুলুন।</div>`;
    return;
  }
  const form = mode => `<h1>${mode === "login" ? "Login" : "নতুন account"}</h1>
    <form class="card" id="f">${mode === "register" ? `<label for="name">নাম</label><input id="name" name="name" required maxlength="80">` : ""}
      <label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="email">
      <label for="password">Password ${mode === "register" ? "(অন্তত ৮ অক্ষর)" : ""}</label>
      <input id="password" name="password" type="password" required minlength="${mode === "register" ? 8 : 1}"
        autocomplete="${mode === "login" ? "current-password" : "new-password"}">
      <p id="err" class="notice warn" hidden></p>
      <button class="btn btn-primary" style="margin-top:16px">${mode === "login" ? "Login" : "Account খুলি"}</button>
    </form>
    <p style="margin-top:12px">${mode === "login" ? `Account নেই? <a href="#" data-mode="register">নতুন account খুলি</a>`
      : `আগে থেকে account আছে? <a href="#" data-mode="login">Login</a>`}</p>`;

  function showForm(mode) {
    el.innerHTML = form(mode);
    el.querySelector("[data-mode]").onclick = e => { e.preventDefault(); showForm(e.target.dataset.mode); };
    el.querySelector("#f").onsubmit = async e => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(e.target));
      try {
        const { user } = await A.post("/auth/" + mode, body);
        const d = store.get("diagnostic", null); // carry over a pre-login diagnostic
        if (d && !user.profile?.diagnostic) await A.put("/me/profile", { profile: { diagnostic: d, targetBand: d.target, testDate: d.date, testType: d.test } });
        location.href = new URLSearchParams(location.search).get("next") || root + "dashboard/index.html";
      } catch (err) { const p = el.querySelector("#err"); p.hidden = false; p.textContent = err.message; }
    };
  }

  A.me().then(u => {
    if (!u) return showForm("login");
    el.innerHTML = `<h1>👤 ${esc(u.name)}</h1><div class="card"><p style="color:var(--ink)">${esc(u.email)}<br>
      Role: <span class="tag">${esc(u.role)}</span></p>
      <div class="btn-row"><a class="btn btn-primary" href="${root}dashboard/index.html">Dashboard</a>
      <button class="btn btn-outline" id="logout">Logout</button></div></div>
      <details class="card" style="margin-top:24px"><summary><strong>Account মুছে ফেলা</strong></summary>
        <p>তোমার attempts, mistakes ও profile স্থায়ীভাবে মুছে যাবে।</p>
        <button class="btn btn-outline" style="border-color:var(--coral);color:var(--coral)" id="del">স্থায়ীভাবে মুছি</button></details>`;
    el.querySelector("#logout").onclick = async () => { await A.post("/auth/logout"); location.href = root + "index.html"; };
    el.querySelector("#del").onclick = async () => {
      if (!confirm("নিশ্চিত? এটি ফেরানো যাবে না।")) return;
      try { await A.del("/me"); location.href = root + "index.html"; } catch (e) { alert(e.message); }
    };
  });
})();
