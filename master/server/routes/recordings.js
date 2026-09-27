/*
 * Speaking recordings (Blueprint §34, §44): stored only with explicit consent, owner-only access
 * (plus a teacher reviewing linked feedback), deletable any time, auto-deleted after RETENTION_DAYS.
 */
const fs = require("fs");
const path = require("path");
const DIR = path.join(path.dirname(require("../db").FILE), "recordings");
const RETENTION_DAYS = +process.env.PORCHI_RECORDING_DAYS || 90;
const MIME = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"];

function removeFile(r) { try { fs.unlinkSync(path.join(DIR, r.file)); } catch {} }

module.exports = ({ route, fail, send, str, requireRole, db, auth }) => {
  route("POST", "/api/recordings", async (req, res, { user, body }) => {
    requireRole(user);
    if (body.consent !== true) fail(400, "Recording consent is required");
    if (auth.limited("rec:" + user.id, 40, 24 * 3600e3)) fail(429, "Daily recording limit reached");
    const mime = String(body.mime || "").split(";")[0];
    if (!MIME.includes(mime)) fail(400, "Unsupported audio type");
    const buf = Buffer.from(String(body.data || ""), "base64");
    if (buf.length < 100 || buf.length > 6e6) fail(400, "Recording must be between a moment and ~5 MB");
    fs.mkdirSync(DIR, { recursive: true });
    const r = db.insert("recordings", { userId: user.id, mime, bytes: buf.length, seconds: Math.min(600, +body.seconds || 0),
      prompt: str(body.prompt, "prompt", { optional: true, max: 1000 }), consent: { at: new Date().toISOString(), text: "Store for my feedback and teacher review" },
      expiresAt: new Date(Date.now() + RETENTION_DAYS * 864e5).toISOString() });
    const file = r.id + "." + mime.split("/")[1];
    fs.writeFileSync(path.join(DIR, file), buf);
    db.update("recordings", r.id, { file });
    send(res, 201, { recording: { id: r.id, expiresAt: r.expiresAt } });
  }, { maxBody: 9e6 });

  route("GET", "/api/recordings/:id", async (req, res, { user, params }) => {
    requireRole(user);
    const r = db.find("recordings", x => x.id === params.id) || fail(404, "Not found");
    const teacherAccess = auth.CAN.review.includes(user.role) &&
      db.find("aiFeedback", f => f.input?.audioId === r.id && ["requested", "claimed", "reviewed"].includes(f.reviewStatus));
    if (r.userId !== user.id && !teacherAccess) fail(404, "Not found");
    const file = path.join(DIR, r.file || "");
    if (!r.file || !fs.existsSync(file)) fail(404, "Recording file missing");
    res.writeHead(200, { "Content-Type": r.mime, "Content-Length": fs.statSync(file).size, "Cache-Control": "private, no-store" });
    fs.createReadStream(file).pipe(res);
  });
  route("GET", "/api/me/recordings", async (req, res, { user }) => {
    requireRole(user);
    send(res, 200, { recordings: db.filter("recordings", r => r.userId === user.id).reverse()
      .map(({ id, createdAt, seconds, prompt, expiresAt }) => ({ id, createdAt, seconds, prompt, expiresAt })), retentionDays: RETENTION_DAYS });
  });
  route("DELETE", "/api/recordings/:id", async (req, res, { user, params }) => {
    requireRole(user);
    const r = db.find("recordings", x => x.id === params.id && x.userId === user.id) || fail(404, "Not found");
    removeFile(r); db.remove("recordings", r.id);
    send(res, 200, { ok: true });
  });

  /* retention sweep: on start and every 6 hours */
  const sweep = () => { const now = new Date().toISOString();
    for (const r of db.filter("recordings", x => x.expiresAt < now)) { removeFile(r); db.remove("recordings", r.id); } };
  setTimeout(sweep, 60e3).unref(); setInterval(sweep, 6 * 3600e3).unref();
};
module.exports.purgeUser = (userId, db) => { for (const r of db.filter("recordings", x => x.userId === userId)) { removeFile(r); db.remove("recordings", r.id); } };
