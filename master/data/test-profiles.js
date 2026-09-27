/* Configurable, versioned test definitions (Blueprint §8, §22, §45, §46).
   Never hard-code "Academic" or fixed section counts elsewhere. */
window.PORCHI_TESTS = {
  formatVersion: "IELTS_FORMAT_2026_V1",
  profiles: [
    { id: "ielts-academic", name: "IELTS Academic", skills: ["listening", "reading", "writing", "speaking"],
      delivery_modes: ["computer"], writing_delivery_modes: ["typed", "writing_on_paper_where_supported"],
      reading_variant: "academic", writing_variant: "academic", scoring_profile: "ielts-standard-v1" },
    { id: "ielts-general", name: "IELTS General Training", skills: ["listening", "reading", "writing", "speaking"],
      delivery_modes: ["computer"], writing_delivery_modes: ["typed", "writing_on_paper_where_supported"],
      reading_variant: "general", writing_variant: "general", scoring_profile: "ielts-standard-v1" },
    { id: "ielts-ukvi-academic", name: "IELTS for UKVI (Academic)", skills: ["listening", "reading", "writing", "speaking"],
      delivery_modes: ["computer"], reading_variant: "academic", writing_variant: "academic", scoring_profile: "ielts-standard-v1" },
    { id: "ielts-ukvi-general", name: "IELTS for UKVI (General Training)", skills: ["listening", "reading", "writing", "speaking"],
      delivery_modes: ["computer"], reading_variant: "general", writing_variant: "general", scoring_profile: "ielts-standard-v1" },
    { id: "ielts-life-skills", name: "IELTS Life Skills (A1/A2/B1)", skills: ["listening", "speaking"],
      delivery_modes: ["face_to_face"], scoring_profile: "life-skills-v1", flag: "LIFE_SKILLS_ENABLED" }
  ],
  sections: {
    listening: { minutes: 30, questions: 40 },
    reading:   { minutes: 60, questions: 40 },
    writing:   { minutes: 60, tasks: 2 },
    speaking:  { minutes: 14, parts: 3 }
  },
  mockModes: [
    { id: "familiarisation", name: "Familiarisation Mode", desc: "Computer interface শেখা — untimed, highlight, notes, navigation।" },
    { id: "section", name: "Timed Section Practice", desc: "শুধু একটি section, আসল সময় ধরে।" },
    { id: "mini", name: "Mini Mock", desc: "ছোট multi-skill টেস্ট — ব্যস্ত দিনের জন্য।" },
    { id: "full", name: "Full Mock", desc: "পূর্ণ দৈর্ঘ্যের simulation।" },
    { id: "focused", name: "Focused Mock", desc: "একটি question type-এর উপর টেস্ট — যেমন Matching Headings।" }
  ]
};

window.PORCHI_FLAGS = {
  WRITING_ON_PAPER_ENABLED: true,
  ONE_SKILL_RETAKE_INFO_ENABLED: true,
  LIFE_SKILLS_ENABLED: false,
  AI_SPEAKING_ENABLED: false,
  AI_WRITING_ENABLED: false,
  TEACHER_REVIEW_ENABLED: false,
  COLLABORATE_ENABLED: false
};
