/*
 * AIService — provider-agnostic AI layer (Blueprint §16, §33, §56).
 * Pages and routes call these functions only; swap providers in one place.
 * Every result is labelled as an estimate (never an official IELTS score).
 */
const LABEL = "Porchi AI estimate — not an official IELTS score";

let provider;
function getProvider() {
  if (provider !== undefined) return provider;
  const name = process.env.PORCHI_AI_PROVIDER || "claude";
  provider = name === "none" ? null : require("./providers/" + name.replace(/[^a-z]/g, "")).create();
  return provider;
}
function setProvider(p) { provider = p; } // tests / future providers
function need() {
  const p = getProvider();
  if (!p) throw Object.assign(new Error("AI Teacher is not enabled on this server"), { status: 503 });
  return p;
}

const TEACHER = `You are Porchi AI Teacher, an IELTS tutor for Bangladeshi learners.
Explain clearly in simple English; add a short Bangla (বাংলা) tip when it helps understanding.
Be encouraging but honest and specific. Never claim to be an official IELTS examiner and never promise a band score.
Only help with English learning and IELTS preparation; politely decline anything else.`;

const band = { type: "number", description: "Band 0–9 in 0.5 steps" };
const str = { type: "string" };
const strs = { type: "array", items: str };
const obj = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const criterion = obj({ band, strengths: strs, improvements: strs });
const roundHalf = x => Math.max(0, Math.min(9, Math.round(+x * 2) / 2));

/* Reading/Listening: why the answer is right, evidence, paraphrase, distractor */
async function explainQuestion({ question, passage, given }) {
  const r = await need().complete({
    system: TEACHER, effort: "medium",
    schema: obj({ why_correct: str, evidence: str, paraphrase: str, why_given_wrong: str, strategy_tip: str, bangla_tip: str }),
    messages: [{ role: "user", content:
`Explain this IELTS ${question.module} question to a learner.
Question type: ${question.question_type}
Question: ${question.prompt}
Options: ${question.options?.length ? question.options.join(" | ") : "(none — write the answer)"}
Correct answer: ${[].concat(question.correct_answer).join(", ")}${question.acceptable_answers?.length ? " (also accepted: " + question.acceptable_answers.join(", ") + ")" : ""}
Learner's answer: ${[].concat(given ?? "").join(", ") || "(blank)"}
${question.explanation ? "Teacher's note: " + question.explanation : ""}
${passage ? "\nPassage:\n" + passage.text.slice(0, 12000) : ""}

Quote the exact evidence from the passage, show how the question paraphrases it, explain why the learner's answer is wrong (or say it is correct), and give one strategy tip for this question type.` }]
  });
  return { ...r, label: LABEL };
}

/* Writing: criterion-based estimate (TR/TA, CC, LR, GRA). The response is never auto-corrected before assessment. */
async function gradeWriting({ task, response, taskType = "Task 2" }) {
  const words = String(response).trim().split(/\s+/).filter(Boolean).length;
  const r = await need().complete({
    system: TEACHER + `\nYou assess IELTS Writing using the four public criteria: Task Response/Task Achievement, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy. Base each band on evidence quoted from the learner's text. Be calibrated: most learners are between 5 and 7.`,
    effort: "high",
    schema: obj({ task_response: criterion, coherence_cohesion: criterion, lexical_resource: criterion, grammar: criterion,
      summary: str, top_three_actions: strs, improved_paragraph: str, bangla_tip: str }),
    messages: [{ role: "user", content:
`IELTS Writing ${taskType}. Word count: ${words}${taskType === "Task 2" && words < 250 ? " (under the 250-word minimum — this affects Task Response)" : ""}.

Task:
${task}

Learner's response (exactly as written):
${response}

Give a band and evidence-based strengths/improvements for each criterion, a short overall summary, the three most useful next actions, and rewrite ONE weak paragraph from the response at a higher level.` }]
  });
  const bands = [r.task_response, r.coherence_cohesion, r.lexical_resource, r.grammar].map(c => roundHalf(c.band));
  [r.task_response.band, r.coherence_cohesion.band, r.lexical_resource.band, r.grammar.band] = bands;
  return { ...r, words, overall: roundHalf(bands.reduce((a, b) => a + b, 0) / 4), label: LABEL };
}

/* Speaking (from a transcript): fluency/coherence, vocabulary, grammar; pronunciation cannot be judged from text. */
async function analyzeSpeaking({ prompt, transcript, part = "Part 2" }) {
  const r = await need().complete({
    system: TEACHER + `\nYou assess IELTS Speaking from a TRANSCRIPT only. You cannot hear pronunciation, so do not give a pronunciation band — only transcript-visible indicators (e.g. likely hesitation markers, self-corrections).`,
    effort: "medium",
    schema: obj({ fluency_coherence: criterion, lexical_resource: criterion, grammar: criterion, pronunciation_note: str,
      follow_up_questions: strs, better_answer_sample: str, bangla_tip: str }),
    messages: [{ role: "user", content: `IELTS Speaking ${part}.\nPrompt: ${prompt}\n\nTranscript:\n${transcript}` }]
  });
  for (const k of ["fluency_coherence", "lexical_resource", "grammar"]) r[k].band = roundHalf(r[k].band);
  return { ...r, label: LABEL + " — pronunciation not assessed from text" };
}

/* Free chat with the AI Teacher */
async function chat({ messages, learner }) {
  const text = await need().complete({
    system: TEACHER + (learner ? `\nLearner profile: target band ${learner.targetBand || "unknown"}, test type ${learner.testType || "unknown"}, weaker skills: ${(learner.weaknesses || []).join(", ") || "unknown"}.` : ""),
    effort: "low", maxTokens: 4000, messages
  });
  return { reply: text, label: "Porchi AI Teacher" };
}

module.exports = { explainQuestion, gradeWriting, analyzeSpeaking, chat, setProvider, status: () => { const p = getProvider(); return { enabled: !!p, provider: p?.name || null }; }, LABEL };
