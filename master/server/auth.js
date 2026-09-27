/* Password hashing (scrypt), cookie sessions, role checks, login rate limit (Blueprint §24, §43) */
const crypto = require("crypto");
const db = require("./db");

const ROLES = ["student", "teacher", "question_editor", "content_editor", "super_admin"];
const CAN = {
  content: ["content_editor", "super_admin"],
  questions: ["question_editor", "super_admin"],
  users: ["super_admin"],
  review: ["teacher", "super_admin"]
};
const SESSION_DAYS = 14;

function hash(pw, salt = crypto.randomBytes(16).toString("hex")) {
  return salt + ":" + crypto.scryptSync(pw, salt, 64).toString("hex");
}
function verify(pw, stored) {
  const [salt, h] = String(stored).split(":");
  if (!salt || !h) return false;
  const a = Buffer.from(h, "hex"), b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function publicUser(u) { return u && { id: u.id, name: u.name, email: u.email, role: u.role, profile: u.profile || {} }; }

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  db.insert("sessions", { tokenHash: sha(token), userId, expires: Date.now() + SESSION_DAYS * 864e5 });
  return token;
}
const sha = s => crypto.createHash("sha256").update(s).digest("hex");
function userFromReq(req) {
  const m = /(?:^|;\s*)porchi_sid=([a-f0-9]{64})/.exec(req.headers.cookie || "");
  if (!m) return null;
  const s = db.find("sessions", x => x.tokenHash === sha(m[1]));
  if (!s || s.expires < Date.now()) return null;
  return db.find("users", u => u.id === s.userId) || null;
}
function destroySession(req) {
  const m = /(?:^|;\s*)porchi_sid=([a-f0-9]{64})/.exec(req.headers.cookie || "");
  if (m) db.removeWhere("sessions", s => s.tokenHash === sha(m[1]));
}
function cookie(token, secure) {
  const base = `porchi_sid=${token}; HttpOnly; SameSite=Strict; Path=/`;
  return (token ? `${base}; Max-Age=${SESSION_DAYS * 86400}` : `${base}; Max-Age=0`) + (secure ? "; Secure" : "");
}

/* Simple in-memory limiter: 10 attempts / 15 min per IP+key */
const hits = new Map();
function limited(key, max = 10, windowMs = 15 * 60e3) {
  const t = Date.now(), arr = (hits.get(key) || []).filter(x => t - x < windowMs);
  arr.push(t); hits.set(key, arr);
  return arr.length > max;
}

module.exports = { ROLES, CAN, hash, verify, publicUser, createSession, userFromReq, destroySession, cookie, limited };
