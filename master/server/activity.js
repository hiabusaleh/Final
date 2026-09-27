/* Study-day log for streaks (Blueprint §29). One row per learner per day. */
const db = require("./db");
function mark(userId) {
  if (!userId) return;
  const date = new Date().toISOString().slice(0, 10);
  if (!db.find("activity", a => a.userId === userId && a.date === date)) db.insert("activity", { userId, date });
}
function streak(userId) {
  const days = new Set(db.filter("activity", a => a.userId === userId).map(a => a.date));
  const iso = d => d.toISOString().slice(0, 10);
  let d = new Date(), current = 0;
  if (!days.has(iso(d))) d = new Date(Date.now() - 864e5);        // today not done yet: streak can still continue
  while (days.has(iso(d))) { current++; d = new Date(d - 864e5); }
  const sorted = [...days].sort(); let longest = 0, run = 0, prev;
  for (const s of sorted) { run = prev && (new Date(s) - new Date(prev)) === 864e5 ? run + 1 : 1; longest = Math.max(longest, run); prev = s; }
  const last30 = [...Array(30)].map((_, i) => { const x = iso(new Date(Date.now() - (29 - i) * 864e5)); return { date: x, active: days.has(x) }; });
  return { current, longest, today: days.has(iso(new Date())), last30 };
}
module.exports = { mark, streak };
