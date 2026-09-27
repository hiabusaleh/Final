/* Seed ORIGINAL sample content written for Porchi (no third-party material).  npm run seed */
const db = require("./db");
if (db.all("questions").length) { console.log("Questions already exist — seed skipped."); process.exit(0); }

const lic = { source_type: "original", author: "Porchi", license_status: "original", commercial_use_allowed: true, status: "published" };
const passage = db.insert("passages", { ...lic, module: "reading", version: 1, history: [], title: "Gardens Above the City",
  text: `A. In many crowded cities, flat rooftops were once seen as wasted space. Over the past two decades, however, architects and residents have begun to turn these surfaces into gardens. Some are small collections of potted herbs; others cover entire buildings with grass, shrubs and even fruit trees.

B. The most frequently cited benefit is temperature control. A bare roof absorbs heat during the day and releases it at night, which adds to the so-called urban heat island effect. Plants and soil, by contrast, shade the surface and cool the air through evaporation. Measurements taken on one office building showed that the planted section of the roof stayed up to twenty degrees cooler than the uncovered section on summer afternoons.

C. Rooftop gardens also slow the flow of rainwater. During heavy storms, city drains can overflow because water runs quickly off hard surfaces. Soil holds a proportion of that water and releases it gradually, reducing pressure on drainage systems.

D. Critics point out that these gardens are not cheap. Older buildings often need structural reinforcement before they can carry the weight of wet soil, and waterproof layers must be installed to protect the rooms below. Maintenance is another concern: without regular care, a green roof can quickly become dry and unattractive.

E. Despite these costs, several city governments now offer grants to building owners who install green roofs. Supporters argue that the public benefits — cooler streets, fewer floods and new spaces for insects and birds — justify the use of public money.` });

const qs = [
  ["True/False/Not Given", "Rooftop gardens have only become common in the last twenty years or so.", ["TRUE", "FALSE", "NOT GIVEN"], "TRUE", "Paragraph A: \"Over the past two decades … have begun to turn these surfaces into gardens.\" 'Two decades' = 'twenty years'.", "Easy"],
  ["True/False/Not Given", "Bare roofs lose all the heat they absorb before the next morning.", ["TRUE", "FALSE", "NOT GIVEN"], "NOT GIVEN", "Paragraph B says heat is released at night, but not whether ALL of it is lost by morning.", "Medium"],
  ["True/False/Not Given", "Plants on roofs make the air warmer through evaporation.", ["TRUE", "FALSE", "NOT GIVEN"], "FALSE", "Paragraph B: plants 'cool the air through evaporation' — the opposite of warmer.", "Easy"],
  ["True/False/Not Given", "Most city governments pay the full cost of installing a green roof.", ["TRUE", "FALSE", "NOT GIVEN"], "NOT GIVEN", "Paragraph E mentions grants from 'several' governments but says nothing about paying the full cost.", "Hard"],
  ["Multiple Choice", "According to paragraph C, how do rooftop gardens help during heavy storms?", ["A. They increase the size of city drains", "B. They hold some water and release it slowly", "C. They stop all rainwater from reaching the ground", "D. They make hard surfaces less slippery"], "B", "Paragraph C: soil 'holds a proportion of that water and releases it gradually'. C is a distractor: 'a proportion' ≠ 'all'.", "Medium"],
  ["Multiple Choice", "Which problem with older buildings is mentioned by critics?", ["A. They are too tall for gardens", "B. They may need strengthening to carry heavy soil", "C. Their roofs are usually not flat", "D. Their owners do not want gardens"], "B", "Paragraph D: 'Older buildings often need structural reinforcement … to carry the weight of wet soil.' 'Reinforcement' is paraphrased as 'strengthening'.", "Medium"],
  ["Sentence Completion", "On one office building, the planted part of the roof was up to ______ degrees cooler. (ONE WORD ONLY)", [], "twenty", "Paragraph B: 'up to twenty degrees cooler'.", "Easy", ["20"], 1],
  ["Sentence Completion", "Without regular ______, a green roof can become dry and unattractive. (ONE WORD ONLY)", [], "care", "Paragraph D: 'without regular care'.", "Easy", ["maintenance"], 1],
  ["Short Answer", "Apart from insects, which animals may gain new spaces from green roofs? (ONE WORD ONLY)", [], "birds", "Paragraph E: 'new spaces for insects and birds'.", "Easy", [], 1],
  ["Matching Information", "Which paragraph mentions a layer that protects rooms beneath the roof? (Write A–E)", ["A", "B", "C", "D", "E"], "D", "Paragraph D: 'waterproof layers must be installed to protect the rooms below'.", "Medium"]
];
qs.forEach(([question_type, prompt, options, correct_answer, explanation, difficulty, acceptable_answers = [], word_limit = 0], i) =>
  db.insert("questions", { ...lic, exam_type: "academic", module: "reading", section: "Reading", part: "Passage 1", question_type,
    question_number: i + 1, prompt, passage_id: passage.id, audio_id: "", options, correct_answer, acceptable_answers, word_limit,
    explanation, skill_tag: "reading", subskill_tag: question_type, difficulty, exam_version: "IELTS_FORMAT_2026_V1", version: 1, history: [] }));

console.log(`Seeded 1 passage and ${qs.length} original reading questions.`);

const ids = db.all("questions").filter(q => q.passage_id === passage.id).map(q => q.id);
db.insert("mocks", { title: "Porchi Mini Mock 1 — Reading + Writing", test_profile: "ielts-academic", mode: "mini", status: "published",
  description: "Original short Reading passage (10 questions) and one Writing Task 2 prompt. Indicative band only.",
  exam_version: "IELTS_FORMAT_2026_V1", version: 1, history: [],
  sections: [
    { skill: "reading", minutes: 15, questionIds: ids, task: "", minWords: 0 },
    { skill: "writing", minutes: 40, questionIds: [], minWords: 250,
      task: "Some people believe that every new building in a city should include a garden on its roof. To what extent do you agree or disagree?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words." }
  ] });
console.log("Seeded 1 published mini mock.");
