/* Feature flags (Blueprint §46) — admin-editable, enforced on the server, mirrored to pages via /api/flags. */
const db = require("./db");
const DEFAULTS = {
  WRITING_ON_PAPER_ENABLED: true, ONE_SKILL_RETAKE_INFO_ENABLED: true, LIFE_SKILLS_ENABLED: false,
  AI_WRITING_ENABLED: true, AI_SPEAKING_ENABLED: true, TEACHER_REVIEW_ENABLED: true, COLLABORATE_ENABLED: true
};
function all() { const s = db.find("settings", x => x.key === "flags"); return { ...DEFAULTS, ...(s?.value || {}) }; }
const on = name => !!all()[name];
function set(patch) {
  const value = Object.fromEntries(Object.entries({ ...all(), ...patch }).filter(([k]) => k in DEFAULTS).map(([k, v]) => [k, !!v]));
  const s = db.find("settings", x => x.key === "flags");
  s ? db.update("settings", s.id, { value }) : db.insert("settings", { key: "flags", value });
  return value;
}
module.exports = { DEFAULTS, all, on, set };
