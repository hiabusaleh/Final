/*
 * Posts ও Videos — এখানে নতুন এন্ট্রি যোগ করুন (পরে Admin CMS থেকে আসবে)।
 * Video: শুধু YouTube URL দিন, ID স্বয়ংক্রিয়ভাবে বের হবে।
 * Categories: Announcement, IELTS Tip, New Course, New Mock Test, Vocabulary, Grammar, Test Update, Study Advice, Event
 */
window.PORCHI_POSTS = {
  posts: [
    { id: "welcome", title: "Porchi IELTS-এ স্বাগতম", category: "Announcement", date: "2026-09-27", pinned: true,
      excerpt: "Learn → Practice → Test → Analyse → Improve → Retest — এক জায়গায়।",
      body: "Porchi IELTS-এর প্রথম সংস্করণ তৈরি হচ্ছে। শুরুতে পাঁচটি learning module, diagnostic ও resources পাবে।" },
    { id: "tfng-tip", title: "True/False/Not Given: Not Given কখন?", category: "IELTS Tip", date: "2026-09-26",
      excerpt: "Passage-এ তথ্যটি নেই — এবং বিপরীতও বলা নেই — তখনই Not Given।",
      body: "False মানে passage স্পষ্টভাবে বিপরীত কথা বলছে। Not Given মানে passage বিষয়টি নিশ্চিত বা অস্বীকার কোনোটাই করছে না।" },
    { id: "daily-15", title: "দিনে ১৫ মিনিট: ছোট practice-এর শক্তি", category: "Study Advice", date: "2026-09-25",
      excerpt: "আজকের ছোট practice, আগামী দিনের confidence।",
      body: "প্রতিদিন একটি ছোট কাজ: ১০টি শব্দ রিভিউ, ৫টি Reading প্রশ্ন, একটি Speaking Part 1 উত্তর।" }
  ],
  videos: [
    { id: "sample-video", title: "Sample: IELTS overview", youtube: "",
      skill: "General", topic: "Test format", description: "এখানে আপনার YouTube ভিডিওর URL বসান।",
      relatedCourse: "learn/index.html", relatedPractice: "practice/index.html" }
  ]
};
