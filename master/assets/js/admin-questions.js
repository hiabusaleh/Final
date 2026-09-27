/* Admin resources: question bank + passages (loaded before admin.js) */
window.PorchiAdminResources = Object.assign(window.PorchiAdminResources || {}, {
  questions: { label: "Questions", perm: "questions", cols: ["question_number", "module", "question_type", "difficulty", "status", "version"], fields: m => [
    ["module", m.SKILLS, "Module"], ["exam_type", ["any", "academic", "general"], "Exam type"], ["section", "text", "Section"], ["part", "text", "Part"],
    ["question_type", "text", "Question type (e.g. True/False/Not Given)"], ["question_number", "number", "Question number"],
    ["prompt", "textarea", "Prompt"], ["passage_id", ["", ...m.passages.map(p => p.id)], "Passage ID (" + m.passages.map(p => p.title + " = " + p.id.slice(0, 8)).join(", ") + ")"],
    ["audio_id", "text", "Audio URL"], ["options", "json", 'Options — JSON list, e.g. ["A. …","B. …"]'],
    ["correct_answer", "text", "Correct answer"], ["acceptable_answers", "json", 'Acceptable answers — JSON list'],
    ["word_limit", "number", "Word limit (0 = none)"], ["explanation", "textarea", "Explanation"],
    ["subskill_tag", "text", "Subskill tag"], ["difficulty", m.DIFFICULTY, "Difficulty"],
    ["source_type", "text", "Source type"], ["author", "text", "Author"], ["source_url", "text", "Source URL"],
    ["license_status", m.LICENSE, "License status"], ["exam_version", "text", "Exam version"], ["status", m.STATUSES, "Status"]] },
  passages: { label: "Passages", perm: "questions", cols: ["title", "module", "license_status", "status", "id"], fields: m => [
    ["title", "text", "Title"], ["module", m.SKILLS, "Module"], ["text", "textarea", "Text"],
    ["source_type", "text", "Source type"], ["author", "text", "Author"], ["license_status", m.LICENSE, "License status"], ["status", m.STATUSES, "Status"]] }
});
window.PorchiAdminResources.mocks = { label: "Mock Tests", perm: "questions", cols: ["title", "test_profile", "mode", "status", "version"], fields: m => [
  ["title", "text", "Title"], ["test_profile", m.PROFILES, "Test profile"], ["mode", m.MODES, "Mode"], ["description", "textarea", "Description"],
  ["sections", "json", 'Sections — JSON: [{"skill":"reading","minutes":20,"questionIds":["id1","id2"]},{"skill":"writing","minutes":40,"task":"…","minWords":250}]'],
  ["exam_version", "text", "Exam version"], ["status", ["draft", "published", "archived"], "Status"]] };
