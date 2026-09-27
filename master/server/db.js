/* Tiny JSON-file store. Swap for PostgreSQL later — keep the same function names. */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FILE = process.env.PORCHI_DB || path.join(__dirname, "storage", "db.json");
const EMPTY = { users: [], sessions: [], posts: [], videos: [], questions: [], passages: [], mocks: [], partnerPrefs: [], rooms: [], roomMembers: [], reports: [], blocks: [], partnerRequests: [], partnerSessions: [], partnerFeedback: [], aiFeedback: [], attempts: [], mistakes: [], audit: [] };

let data;
function load() {
  if (data) return data;
  try { data = { ...EMPTY, ...JSON.parse(fs.readFileSync(FILE, "utf8")) }; }
  catch { data = structuredClone(EMPTY); }
  return data;
}
function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 1));
  fs.renameSync(tmp, FILE);
}
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

module.exports = {
  all: t => load()[t],
  find: (t, fn) => load()[t].find(fn),
  filter: (t, fn) => load()[t].filter(fn),
  insert(t, row) { const r = { id: id(), createdAt: now(), ...row }; load()[t].push(r); save(); return r; },
  update(t, rid, patch) {
    const r = load()[t].find(x => x.id === rid); if (!r) return null;
    Object.assign(r, patch, { id: r.id, updatedAt: now() }); save(); return r;
  },
  remove(t, rid) { const a = load()[t]; const i = a.findIndex(x => x.id === rid); if (i < 0) return false; a.splice(i, 1); save(); return true; },
  removeWhere(t, fn) { const d = load(); d[t] = d[t].filter(x => !fn(x)); save(); },
  reset() { data = structuredClone(EMPTY); save(); },
  isEmpty: () => load().users.length === 0,
  FILE
};
