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
**Phase A সম্পন্ন:** partner preferences + matching, Study Room (invite code, owner/host/participant/observer permission),
block, report ও Admin → Reports moderation queue। Frontend: `collaborate/` · Backend: `server/routes/collaborate.js`।
Phase B/C-র জন্য real-time layer (WebSocket) ও
audio/video media layer লাগবে — `Porchi/PORCHI_EXCLUSIVE_FEATURES_FINAL_PLAN.md` §42, §53 দেখুন।

## যা কাজ করে
- Diagnostic → indicative band, strengths/weaknesses (ব্রাউজারে সংরক্ষিত)
- Diagnostic থেকে সপ্তাহভিত্তিক Study Plan, Dashboard ও Progress
- Posts: category filter + Facebook/WhatsApp/Telegram/X share
- Videos: YouTube URL থেকে ID বের করে lazy embed
- Practice filter, Search, mobile menu

## পরের ধাপ
Collaborate Phase B (Speaking Partner session) → AI Teacher (provider-agnostic `AIService`) → Writing/Speaking feedback →
PostgreSQL-এ স্থানান্তর (`server/db.js`-এর function নাম একই রেখে)।
সব score **indicative**; Porchi কোনো official IELTS partner নয়।
