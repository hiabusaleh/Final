/*
 * Porchi master server — zero dependencies (Node 18+).
 *   node server/server.js            → http://localhost:3000
 * Serves the static site from master/ and a JSON API under /api.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const db = require("./db");
const auth = require("./auth");

const ROOT = path.resolve(__dirname, "..");
const PORT = +process.env.PORT || 3000;
const SECURE = process.env.NODE_ENV === "production";
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".mp3": "audio/mpeg", ".webp": "image/webp" };

/* ---------- tiny router ---------- */
const routes = [];
function route(method, pattern, handler, opts = {}) {
  const keys = [];
  const re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "$");
  routes.push({ method, re, keys, handler, opts });
}
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const fail = (status, msg) => { throw new HttpError(status, msg); };

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  res.end(JSON.stringify(body));
}
async function readJson(req, max = 1e6) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > max) fail(413, "Body too large"); chunks.push(c); }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { fail(400, "Invalid JSON"); }
}

/* Validation helpers — server-side validation (Blueprint §43) */
const str = (v, name, { min = 0, max = 5000, optional = false } = {}) => {
  if (v === undefined || v === null || v === "") { if (optional) return ""; fail(400, `${name} is required`); }
  if (typeof v !== "string") fail(400, `${name} must be text`);
  v = v.trim();
  if (v.length < min || v.length > max) fail(400, `${name} must be ${min}–${max} characters`);
  return v;
};
function requireRole(user, perm) {
  if (!user) fail(401, "Login required");
  if (perm && !auth.CAN[perm].includes(user.role)) fail(403, "Not allowed");
}
function audit(user, action, object, req) {
  db.insert("audit", { userId: user?.id, action, object, ip: req.socket.remoteAddress, ua: String(req.headers["user-agent"] || "").slice(0, 120) });
}

/* ---------- auth & users ---------- */
route("POST", "/api/auth/register", async (req, res, { body }) => {
  if (auth.limited("reg:" + req.socket.remoteAddress, 20)) fail(429, "Too many attempts, try later");
  const name = str(body.name, "Name", { min: 1, max: 80 });
  const email = str(body.email, "Email", { max: 200 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, "Invalid email");
  const password = str(body.password, "Password", { min: 8, max: 200 });
  if (db.find("users", u => u.email === email)) fail(409, "Email already registered");
  const u = db.insert("users", { name, email, passwordHash: auth.hash(password), role: "student", profile: {} });
  const token = auth.createSession(u.id);
  send(res, 201, { user: auth.publicUser(u) }, { "Set-Cookie": auth.cookie(token, SECURE) });
});

route("POST", "/api/auth/login", async (req, res, { body }) => {
  const email = str(body.email, "Email").toLowerCase();
  if (auth.limited("login:" + req.socket.remoteAddress + email)) fail(429, "Too many attempts, try later");
  const u = db.find("users", x => x.email === email);
  if (!u || !auth.verify(String(body.password || ""), u.passwordHash)) fail(401, "Wrong email or password");
  if (u.role !== "student") audit(u, "login", "admin-session", req);
  send(res, 200, { user: auth.publicUser(u) }, { "Set-Cookie": auth.cookie(auth.createSession(u.id), SECURE) });
});

route("POST", "/api/auth/logout", async (req, res) => {
  auth.destroySession(req);
  send(res, 200, { ok: true }, { "Set-Cookie": auth.cookie("", SECURE) });
});

route("GET", "/api/auth/me", async (req, res, { user }) => send(res, 200, { user: auth.publicUser(user) }));

route("PUT", "/api/me/profile", async (req, res, { user, body }) => {
  requireRole(user);
  const p = body.profile || {};
  const profile = {
    testType: str(p.testType, "testType", { optional: true, max: 60 }),
    targetBand: Math.min(9, Math.max(0, +p.targetBand || 0)) || undefined,
    testDate: str(p.testDate, "testDate", { optional: true, max: 20 }),
    diagnostic: p.diagnostic && typeof p.diagnostic === "object" ? p.diagnostic : user.profile?.diagnostic
  };
  send(res, 200, { user: auth.publicUser(db.update("users", user.id, { profile })) });
});

route("DELETE", "/api/me", async (req, res, { user }) => {
  requireRole(user);
  if (user.role === "super_admin" && db.filter("users", u => u.role === "super_admin").length === 1) fail(400, "Last super admin cannot be deleted");
  require("./routes/recordings").purgeUser?.(user.id, db);
  for (const t of ["attempts", "mistakes", "sessions", "partnerPrefs", "blocks", "aiFeedback", "notifications", "vocabProgress", "vocabCustom", "activity"]) db.removeWhere(t, x => x.userId === user.id);
  db.removeWhere("partnerRequests", r => r.fromId === user.id || r.toId === user.id);
  db.remove("users", user.id);
  send(res, 200, { ok: true }, { "Set-Cookie": auth.cookie("", SECURE) });
}); // data deletion (Blueprint §44)

route("GET", "/api/admin/users", async (req, res, { user }) => {
  requireRole(user, "users");
  send(res, 200, { users: db.all("users").map(auth.publicUser), roles: auth.ROLES });
});
route("PUT", "/api/admin/users/:id/role", async (req, res, { user, body, params }) => {
  requireRole(user, "users");
  if (!auth.ROLES.includes(body.role)) fail(400, "Unknown role");
  if (params.id === user.id) fail(400, "You cannot change your own role");
  const u = db.update("users", params.id, { role: body.role }) || fail(404, "User not found");
  audit(user, "set-role:" + body.role, "user:" + u.id, req);
  send(res, 200, { user: auth.publicUser(u) });
});
route("GET", "/api/admin/audit", async (req, res, { user }) => {
  requireRole(user, "users");
  send(res, 200, { audit: db.all("audit").slice(-200).reverse() });
});

/* Feature modules register more routes */
for (const m of ["content", "questions", "mocks", "collaborate", "partner", "ai", "review", "recordings", "notifications", "analytics", "vocab"]) {
  const f = path.join(__dirname, "routes", m + ".js");
  if (fs.existsSync(f)) require(f)({ route, fail, send, str, requireRole, audit, db, auth });
}

/* ---------- static files ---------- */
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.normalize(path.join(ROOT, rel));
  const blocked = !file.startsWith(ROOT + path.sep) || file.startsWith(path.join(ROOT, "server") + path.sep) || /(^|[\\/])\./.test(path.relative(ROOT, file));
  if (blocked) { res.writeHead(404); return res.end("Not found"); }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) { res.writeHead(301, { Location: pathname.replace(/\/?$/, "/") }); return res.end(); }
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "public, max-age=300" });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  const url = new URL(req.url, "http://x");
  if (!url.pathname.startsWith("/api/")) return serveStatic(req, res, url.pathname);
  try {
    const r = routes.find(r => r.method === req.method && r.re.test(url.pathname));
    if (!r) fail(404, "Not found");
    // CSRF: SameSite=Strict cookie + mutating requests must be JSON (cross-site forms cannot send it without CORS)
    if (req.method !== "GET" && !String(req.headers["content-type"] || "").startsWith("application/json")) fail(415, "JSON required");
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(r.re.exec(url.pathname)[i + 1])]));
    const body = req.method === "GET" ? {} : await readJson(req, r.opts.maxBody);
    await r.handler(req, res, { user: auth.userFromReq(req), body, params, query: url.searchParams });
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    send(res, e.status || 500, { error: e.status ? e.message : "Server error" });
  }
});

if (require.main === module) server.listen(PORT, () => console.log(`Porchi running → http://localhost:${PORT}`));
module.exports = server;
