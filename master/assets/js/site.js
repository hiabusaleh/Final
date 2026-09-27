/* Shared shell: header, footer, nav, helpers. Each page sets <body data-root="../"> etc. */
(function () {
  const root = document.body.dataset.root || "";
  const page = document.body.dataset.page || "";
  const cfg = window.PORCHI_CONFIG || {};

  const nav = [
    ["home", "", "Home"],
    ["learn", "learn/", "Learn"],
    ["practice", "practice/", "Practice"],
    ["mock-tests", "mock-tests/", "Mock Tests"],
    ["ai-teacher", "ai-teacher/", "AI Teacher"],
    ["study-plan", "study-plan/", "Study Plan"],
    ["videos", "videos/", "Videos"],
    ["posts", "posts/", "Posts"],
    ["resources", "resources/", "Resources"],
    ["dashboard", "dashboard/", "Dashboard"]
  ];

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="container bar">
      <a class="logo" href="${root}index.html">Porchi<small>${cfg.tagline || ""}</small></a>
      <button class="nav-toggle" aria-label="Menu" aria-expanded="false">☰</button>
      <nav class="nav" aria-label="Main">
        ${nav.map(([id, href, label]) =>
          `<a href="${root}${href}${href ? "index.html" : "index.html"}" class="${id === page ? "active" : ""}">${label}</a>`).join("")}
      </nav>
    </div>`;
  document.body.prepend(header);
  const toggle = header.querySelector(".nav-toggle");
  toggle.addEventListener("click", () => {
    const open = header.querySelector(".nav").classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div><div class="logo" style="color:#fff">Porchi</div><p>${cfg.tagline || ""}</p></div>
        <div><strong>Learn</strong><ul>
          ${["listening", "reading", "writing", "speaking", "skills"].map(m =>
            `<li><a href="${root}learn/${m}/index.html">${m[0].toUpperCase() + m.slice(1)}</a></li>`).join("")}
        </ul></div>
        <div><strong>Prepare</strong><ul>
          <li><a href="${root}diagnostic/index.html">Check Your Level</a></li>
          <li><a href="${root}practice/index.html">Practice</a></li>
          <li><a href="${root}mock-tests/index.html">Mock Tests</a></li>
          <li><a href="${root}study-plan/index.html">Study Plan</a></li>
          <li><a href="${root}collaborate/index.html">Porchi Collaborate</a></li>
        </ul></div>
        <div><strong>Info</strong><ul>
          <li><a href="${root}resources/index.html">Resources</a></li>
          <li><a href="${root}test-info/index.html">Test Information</a></li>
          <li><a href="${root}search/index.html">Search</a></li>
          <li><a href="${root}admin/index.html">Admin</a></li>
        </ul></div>
      </div>
      <div class="footer-note">
        Porchi is an independent learning platform. IELTS is jointly owned by the British Council, IDP IELTS and
        Cambridge University Press &amp; Assessment. Porchi is not affiliated with or endorsed by them.
        All scores on this site are indicative estimates, not official IELTS results.
      </div>
    </div>`;
  document.body.append(footer);

  /* Helper: link for one of the five existing module sites */
  window.Porchi = {
    root,
    moduleLink(id) {
      const m = (cfg.modules || {})[id] || {};
      return m.url ? { href: m.url, target: m.newTab ? "_blank" : "_self", ready: true }
                   : { href: `${root}learn/${id}/index.html`, target: "_self", ready: false };
    },
    esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
    store: {
      get(k, d) { try { return JSON.parse(localStorage.getItem("porchi:" + k)) ?? d; } catch { return d; } },
      set(k, v) { try { localStorage.setItem("porchi:" + k, JSON.stringify(v)); } catch {} }
    }
  };
})();
