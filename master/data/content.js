/* Module catalogue + shared taxonomy (Blueprint §5, §13, §14, §58) */
window.PORCHI_DATA = {
  modules: [
    { id: "listening", name: "Listening", bn: "লিসেনিং", icon: "🎧",
      desc: "Section-wise course, question-type practice ও audio analysis।",
      features: ["Form/Note/Table Completion", "Map/Plan/Diagram", "Multiple Choice & Matching", "Distractor training"] },
    { id: "reading", name: "Reading", bn: "রিডিং", icon: "📖",
      desc: "Question-type strategy, timed passage practice ও error analysis।",
      features: ["True/False/Not Given", "Matching Headings/Information", "Summary & Sentence Completion", "Skimming & scanning"] },
    { id: "writing", name: "Writing", bn: "রাইটিং", icon: "✍️",
      desc: "Task 1 + Task 2: Learn → Practice → Analyse।",
      features: ["Task 1 Academic & GT", "Task 2 essay types", "Band-descriptor checklist", "Error Bank"] },
    { id: "speaking", name: "Speaking", bn: "স্পিকিং", icon: "🗣️",
      desc: "Part 1, 2, 3 — fluency ও natural-answer training।",
      features: ["Part 1 topics", "Cue card practice", "Part 3 discussion", "Fluency drills"] },
    { id: "skills", name: "Skills", bn: "স্কিলস", icon: "🧩",
      desc: "Vocabulary, grammar, pronunciation, paraphrasing — English-এর ভিত্তি।",
      features: ["Vocabulary & collocations", "Grammar", "Paraphrasing", "Sentence structure"] }
  ],

  taxonomy: {
    skills: ["listening", "reading", "writing", "speaking"],
    questionTypes: {
      reading: ["True/False/Not Given", "Yes/No/Not Given", "Matching Headings", "Matching Information",
        "Matching Features", "Matching Sentence Endings", "Multiple Choice", "Sentence Completion",
        "Summary Completion", "Short Answer", "Diagram/Flow Chart/Table"],
      listening: ["Form Completion", "Note Completion", "Table Completion", "Multiple Choice",
        "Matching", "Map/Plan/Diagram", "Sentence Completion", "Short Answer"],
      writing: ["Task 1 Academic", "Task 1 General (Letter)", "Task 2 Opinion", "Task 2 Discussion",
        "Task 2 Problem/Solution", "Task 2 Advantages/Disadvantages", "Task 2 Two-part"],
      speaking: ["Part 1", "Part 2 (Cue Card)", "Part 3"]
    },
    difficulty: ["Foundation", "Easy", "Medium", "Hard", "Band-focused"],
    bands: ["4.0+", "5.0+", "6.0+", "7.0+", "8.0+", "9.0"],
    mistakeTypes: ["Vocabulary", "Paraphrase", "Grammar", "Spelling", "Attention", "Distractor",
      "Wrong location", "Misinterpretation", "Timing", "Question-type strategy"]
  }
};
