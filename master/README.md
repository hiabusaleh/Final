# Porchi IELTS — Master Website (মূল কাঠামো)

`Porchi/MASTER_IELTS_WEBSITE_ARCHITECTURE_BLUEPRINT.md` ও Brand Guide অনুযায়ী তৈরি **Stage 2 — Master shell**।
কোনো build tool লাগে না: `index.html` ব্রাউজারে খুললেই চলে (GitHub Pages / Netlify-তে সরাসরি deploy করা যায়)।

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

## যা কাজ করে
- Diagnostic → indicative band, strengths/weaknesses (ব্রাউজারে সংরক্ষিত)
- Diagnostic থেকে সপ্তাহভিত্তিক Study Plan, Dashboard ও Progress
- Posts: category filter + Facebook/WhatsApp/Telegram/X share
- Videos: YouTube URL থেকে ID বের করে lazy embed
- Practice filter, Search, mobile menu

## পরের ধাপ (Blueprint §64)
Account/backend (Next.js + PostgreSQL) → Admin CMS → Question Bank → Mock Engine → Results → AI Teacher.
সব score **indicative**; Porchi কোনো official IELTS partner নয়।
