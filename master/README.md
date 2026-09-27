# Porchi IELTS — Master Website

`Porchi/MASTER_IELTS_WEBSITE_ARCHITECTURE_BLUEPRINT.md` ও Brand Guide অনুযায়ী তৈরি।

## চালানোর দুই উপায়
1. **শুধু দেখার জন্য (static):** `index.html` ব্রাউজারে খুলুন। Account, admin, question bank, mock চলবে না।
2. **পূর্ণ সাইট (server):** শুধু Node.js 18+ লাগবে, কোনো `npm install` লাগবে না।
   ```bash
   cd master
   npm run seed                                   # নমুনা passage, ১০টি প্রশ্ন, ১টি mini mock (একবার)
   npm run admin -- you@example.com "Your Name" yourpassword   # super admin তৈরি
   npm start                                      # http://localhost:3000
   npm test                                       # server tests
   ```
   Data থাকে `server/storage/db.json`-এ (git-এ যায় না) — নিয়মিত backup রাখুন।
   Production-এ `NODE_ENV=production` দিন (secure cookie) এবং HTTPS-এর পেছনে চালান।

## আপনার ৫টি ওয়েবসাইট বসানো
শুধু **`assets/js/config.js`** খুলে লিংক দিন:
```js
listening: { url: "https://your-listening-site.com", newTab: false },
```
লিংক খালি থাকলে পেজে "শীঘ্রই যুক্ত হবে" দেখাবে।

## কোথায় কী বদলাবেন
| কাজ | ফাইল |
|---|---|
| Module লিংক | `assets/js/config.js` |
| Post ও YouTube ভিডিও যোগ | `data/posts.js` |
| Module বর্ণনা, question type, taxonomy | `data/content.js` |
| Test type, সময়, mock mode, feature flags | `data/test-profiles.js` |
| রং ও font | `assets/css/tokens.css` |
| Header/Footer/Menu | `assets/js/site.js` |

## পেজসমূহ (Sitemap §62)
`/` · `learn/` (+৫ module) · `diagnostic/` · `practice/` · `mock-tests/` · `study-plan/` · `progress/` ·
`dashboard/` · `ai-teacher/` · `posts/` · `videos/` · `resources/` · `test-info/` · `collaborate/` · `search/` · `admin/`

## Server features (Blueprint §43, §47, §8–§14)
- Account: register/login/logout, account মুছে ফেলা; scrypt password hash, HttpOnly session cookie, login rate limit
- Roles: student · teacher · question_editor · content_editor · super_admin — Admin → Users থেকে বদলান
- Admin CMS: Posts (draft/schedule/pin), Videos, Questions, Passages, Mock Tests, Users, Audit log
- Question Bank: server-side marking (উত্তর আগে browser-এ যায় না), word limit, alternative answers, content versioning
- Licence check: শুধু `original` বা `licensed` content publish করা যায় (§25)
- Mistake Book: ভুল স্বয়ংক্রিয়ভাবে জমা, কারণ অনুযায়ী classify, review
- Mock Engine: timer/untimed, highlight, notes, flag, question navigation, Alt+←/→ section বদল;
  versioned scoring (`server/scoring/rulesets.js`), question-type report, recommendations; Writing = review pending

## Collaborate (Speaking Partner, Study Rooms)
**Phase A ও B সম্পন্ন:**
- Partner preferences + matching, block, report, Admin → Reports moderation queue
- Study Room: invite code, owner/host/participant/observer permission
- Speaking Partner: invite → accept → 1:1 audio/video call (browser WebRTC, peer-to-peer; recording OFF),
  structured IELTS mode (Part 1/2/3, examiner ↔ candidate role swap, নিজস্ব prompts `data/speaking-prompts.js`, shared timer),
  peer feedback ও session history
- কঠোর network (কিছু mobile/office)-এ call সংযোগের জন্য TURN server লাগতে পারে:
  `PORCHI_ICE='[{"urls":"turn:your-turn:3478","username":"u","credential":"p"}]' npm start`

Phase C (Study Room-এ live shared page, whiteboard, chat, group call) বাকি — এর জন্য group call-এ media server (SFU) লাগবে।

## AI Teacher (Blueprint §16, §33, §56)
Provider-agnostic `server/ai/service.js` (`explainQuestion`, `gradeWriting`, `analyzeSpeaking`, `chat`) — provider বদলাতে শুধু
`server/ai/providers/`-এ নতুন ফাইল যোগ করুন। Default provider: Claude (official `@anthropic-ai/sdk`, model `claude-opus-5`)।
```bash
cd master && npm install                 # শুধু AI-এর জন্য SDK (optional)
ANTHROPIC_API_KEY=sk-ant-... npm start   # AI চালু
PORCHI_AI_PROVIDER=demo npm start        # API key ছাড়া "[DEMO]" উত্তর দিয়ে screen দেখা
PORCHI_AI_PROVIDER=none npm start        # AI বন্ধ
```
- AI Teacher পেজ: chat, Writing feedback (চারটি criterion-এ band + প্রমাণ + উন্নত paragraph), Speaking transcript feedback
- Practice: ভুল উত্তরের পাশে "AI ব্যাখ্যা" (evidence, paraphrase, distractor) — উত্তর দেওয়ার পরেই শুধু পাওয়া যায়
- Mock result: Writing section-এ "AI feedback নিই" → band "AI estimate" হিসেবে যুক্ত হয়
- সব AI output "Porchi AI estimate" চিহ্নিত, `aiFeedback`-এ সংরক্ষিত (`reviewStatus: ai_only` — পরে শিক্ষক review যুক্ত হবে)
- প্রতি user ঘণ্টায় ৩০টি AI request; learner-এর লেখা AI-কে পাঠানোর আগে কখনো auto-correct হয় না

## যা কাজ করে
- Diagnostic → indicative band, strengths/weaknesses (ব্রাউজারে সংরক্ষিত)
- Diagnostic থেকে সপ্তাহভিত্তিক Study Plan, Dashboard ও Progress
- Posts: category filter + Facebook/WhatsApp/Telegram/X share
- Videos: YouTube URL থেকে ID বের করে lazy embed
- Practice filter, Search, mobile menu

## পরের ধাপ
Teacher review (AI + human hybrid, §33) → Speaking recorder (§34) → Collaborate Phase C →
PostgreSQL-এ স্থানান্তর (`server/db.js`-এর function নাম একই রেখে)।
সব score **indicative**; Porchi কোনো official IELTS partner নয়।
