/*
 * Versioned scoring rulesets (Blueprint §11, §45). Kept on the server — never in frontend JS.
 * Tables are widely used INDICATIVE conversions; official conversion varies slightly per test version.
 * Add a new version (e.g. listening_v2) instead of editing an old one, so past attempts stay reproducible.
 */
const table = rows => raw => { for (const [min, band] of rows) if (raw >= min) return band; return 0; };

const RULESETS = {
  listening_v1: { total: 40, convert: table([[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1]]) },
  reading_academic_v1: { total: 40, convert: table([[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1]]) },
  reading_gt_v1: { total: 40, convert: table([[40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6], [27, 5.5], [23, 5], [19, 4.5], [15, 4], [12, 3.5], [9, 3], [6, 2.5], [3, 2], [1, 1]]) }
};

/* Short mocks are scaled to 40 before conversion — clearly an estimate. */
function bandFor(rulesetId, raw, count) {
  const rs = RULESETS[rulesetId];
  if (!rs || !count) return null;
  const scaled = Math.round(raw / count * rs.total);
  return { ruleset: rulesetId, raw, count, scaled, band: rs.convert(scaled), scaledFromShortTest: count !== rs.total };
}

/* IELTS overall: mean of the four bands, rounded to nearest half band (.25 → .5, .75 → next whole). */
const overall = bands => bands.length === 4 ? Math.round(bands.reduce((a, b) => a + b, 0) / 4 * 2) / 2 : null;

function rulesetFor(skill, readingVariant) {
  if (skill === "listening") return "listening_v1";
  if (skill === "reading") return readingVariant === "general" ? "reading_gt_v1" : "reading_academic_v1";
  return null; // writing/speaking: criterion-based — needs AI or human assessment
}

module.exports = { RULESETS, bandFor, overall, rulesetFor, SCORING_VERSION: "IELTS_SCORING_2026_V1" };
