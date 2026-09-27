/*
 * Study plan + personalisation engine (Blueprint §15, §20, §30).
 * Rule-based and deterministic: learner goal + diagnostic + real performance → weakness model → next actions.
 */
const db = require("./db");
const SKILLS = ["listening", "reading", "writing", "speaking"];
const FOCUS = {
  listening: ["Listening: prediction before audio", "Listening: Form/Note completion practice", "Listening: Map/Plan labelling", "Listening: distractor training"],
  reading: ["Reading: skimming & scanning drill", "Reading: True/False/Not Given strategy", "Reading: Matching Headings", "Reading: timed passage (20 min)"],
  writing: ["Writing: Task 2 structure & introduction", "Writing: Task 1 overview & key features", "Writing: coherence & linking", "Writing: full Task 2 under time"],
  speaking: ["Speaking: Part 1 fluent answers", "Speaking: Part 2 cue card timing", "Speaking: Part 3 extending ideas", "Speaking: full recorded test"]
};
const LINK = {
  listening: "learn/listening/index.html", reading: "practice/index.html?skill=reading",
  writing: "ai-teacher/index.html", speaking: "practice/speaking/index.html"
};

function weaknessModel(user) {
  const p = user.profile || {}, d = p.diagnostic;
  const bands = { ...(d?.bands || {}) };
  const mocks = db.filter("attempts", a => a.userId === user.id && a.kind === "mock" && a.status === "submitted");
  for (const a of mocks.slice(-3)) for (const s of a.report.sections) if (s.band != null) bands[s.skill] = s.band; // latest evidence wins
  const byType = {};
  for (const a of db.filter("attempts", a => a.userId === user.id)) for (const i of a.items || []) {
    const k = i.question_type, t = (byType[k] ||= { module: i.module, attempted: 0, correct: 0 }); t.attempted++; t.correct += i.correct ? 1 : 0;
  }
  const weakTypes = Object.entries(byType).filter(([, v]) => v.attempted >= 3 && v.correct / v.attempted < 0.6)
    .map(([type, v]) => ({ type, module: v.module, accuracy: Math.round(v.correct / v.attempted * 100) })).sort((a, b) => a.accuracy - b.accuracy);
  const target = p.targetBand || d?.target || 6.5;
  let weakSkills = SKILLS.filter(s => bands[s] != null).sort((a, b) => bands[a] - bands[b]).filter(s => bands[s] < target);
  if (!weakSkills.length) weakSkills = d?.weaknesses?.length ? d.weaknesses : ["writing", "speaking"];
  if (p.osr?.focusSkill) weakSkills = [p.osr.focusSkill];
  const openMistakes = db.filter("mistakes", m => m.userId === user.id && !m.reviewed).length;
  return { bands, target, weakSkills, weakTypes, openMistakes, mockCount: mocks.length };
}

function build(user) {
  const p = user.profile || {}, w = weaknessModel(user), osr = !!p.osr?.focusSkill;
  const date = p.testDate || p.diagnostic?.date;
  const days = date ? Math.max(1, Math.ceil((new Date(date) - Date.now()) / 864e5)) : 56;
  const weeks = Math.min(12, Math.max(1, Math.ceil(days / 7)));
  const hours = p.hoursPerDay || p.diagnostic?.hours || 1;
  const plan = [];
  for (let n = 1; n <= weeks; n++) {
    const stage = n === weeks ? "final" : n <= Math.ceil(weeks / 3) ? "foundation" : "build";
    const tasks = [];
    for (const s of osr ? w.weakSkills : [...w.weakSkills.slice(0, 2), ...SKILLS.filter(x => !w.weakSkills.slice(0, 2).includes(x))]) {
      const list = FOCUS[s], main = w.weakSkills.includes(s);
      tasks.push(list[(n - 1 + (main ? 0 : 2)) % list.length] + (main ? " ×3 sessions" : " ×1 session"));
      if (osr) tasks.push(list[n % list.length] + " ×2 sessions");
    }
    if (w.weakTypes[0] && stage !== "final") tasks.push(`Targeted: ${w.weakTypes[(n - 1) % w.weakTypes.length].type} — 20 questions`);
    tasks.push("Mistake Book review", "Vocabulary flashcards daily (10 min)");
    if (n % 2 === 0 || stage === "final") tasks.push(stage === "final" ? (osr ? `Full ${w.weakSkills[0]} mock + retake readiness checklist` : "Full mock under test conditions") : "Mini mock");
    plan.push({ week: n, stage, tasks });
  }
  const today = todayTasks(user, w, hours, osr);
  const recommendations = w.weakTypes.slice(0, 3).map(t => ({ type: t.type, module: t.module, accuracy: t.accuracy,
    steps: [`Study: ${t.type} strategy lesson`, "Complete 15 targeted questions", "Review your Mistake Book", "Take a mini test", "Repeat after 2–3 days"],
    link: `practice/index.html?skill=${t.module}&type=${encodeURIComponent(t.type)}` }));
  return { weeks: plan, days, hours, today, weakness: w, recommendations, osr: p.osr || null, version: "PLAN_RULES_V1" };
}

function todayTasks(user, w, hours, osr) {
  const date = new Date().toISOString().slice(0, 10);
  const done = new Set(db.filter("planDone", x => x.userId === user.id && x.date === date).map(x => x.taskId));
  const s1 = w.weakSkills[0] || "reading", s2 = osr ? s1 : (w.weakSkills[1] || "listening");
  const dayIdx = Math.floor(Date.now() / 864e5);
  const tasks = [
    { id: "vocab", title: "Vocabulary flashcards", minutes: 10, link: "vocabulary/index.html" },
    { id: "main", title: FOCUS[s1][dayIdx % 4], minutes: Math.round(hours * 60 * 0.45), link: LINK[s1] },
    w.weakTypes[0] ? { id: "target", title: `Targeted practice: ${w.weakTypes[0].type}`, minutes: 15, link: `practice/index.html?skill=${w.weakTypes[0].module}&type=${encodeURIComponent(w.weakTypes[0].type)}` }
      : { id: "second", title: FOCUS[s2][(dayIdx + 1) % 4], minutes: Math.round(hours * 60 * 0.3), link: LINK[s2] },
    w.openMistakes ? { id: "mistakes", title: `Mistake Book review (${w.openMistakes} open)`, minutes: 10, link: "practice/index.html#mistakes" }
      : { id: "micro", title: "Micro practice", minutes: 10, link: "practice/micro/index.html" }
  ];
  if (hours < 0.75) tasks.splice(2, 1);
  return tasks.map(t => ({ ...t, done: done.has(t.id) }));
}
module.exports = { build, weaknessModel };
