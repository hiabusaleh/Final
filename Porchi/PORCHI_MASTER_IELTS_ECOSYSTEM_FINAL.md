# MASTER IELTS WEBSITE — FINAL ARCHITECTURE BLUEPRINT

**Version:** 1.0
**Planning date:** September 2026
**Purpose:** Build one long-term IELTS ecosystem from the existing Listening, Reading, Writing, Speaking and Skills projects.

---

## 1. PRODUCT VISION

The final product is not simply a homepage linking five websites.

It is a **complete IELTS learning ecosystem** in which:

> Learn → Practice → Test → Analyze → Improve → Retest

The five existing projects are the initial learning modules. The Master platform becomes the central shell, content system, assessment engine, analytics layer and future student dashboard.

### Core modules

1. Listening
2. Reading
3. Writing
4. Speaking
5. Skills
6. Mock Tests
7. Practice / Question Bank
8. AI Teacher
9. Study Plan
10. Posts / Updates
11. Video Library
12. Resources / Test Information
13. Student Dashboard
14. Admin / CMS

---

## 2. RESEARCH-BASED PRODUCT PRINCIPLES

Current official IELTS preparation ecosystems repeatedly emphasize the same pattern: understand the test, diagnose current level, practise by skill/question type, track progress, receive feedback, and prepare for test day. British Council's current preparation flow explicitly includes test understanding, level checking, targeted practice, progress measurement and AI feedback; IDP similarly combines self-assessment, practice tests, quizzes, videos, courses and preparation guidance. 

Commercial platforms add study pathways, score calculators/predictors, personalised study schedules, mock tests, AI/human Writing and Speaking feedback, question-level practice, and video explanations.

Therefore the Master platform should be designed around a learning loop, not a collection of disconnected pages.

---

## 3. FINAL INFORMATION ARCHITECTURE

```text
MASTER IELTS
│
├── HOME
│
├── LEARN
│   ├── Listening
│   ├── Reading
│   ├── Writing
│   ├── Speaking
│   └── Skills
│
├── PRACTICE
│   ├── Question Bank
│   ├── Section Practice
│   ├── Question-Type Practice
│   ├── Quick Quizzes
│   └── Error Review
│
├── MOCK TESTS
│   ├── Academic
│   ├── General Training
│   ├── UKVI
│   ├── Life Skills (future/optional)
│   ├── Full Mock
│   ├── Mini Mock
│   └── Familiarisation Mode
│
├── AI TEACHER
│
├── STUDY PLAN
│
├── PROGRESS
│
├── POSTS / UPDATES
│
├── VIDEOS
│
├── RESOURCES
│   ├── IELTS Test Information
│   ├── Band Scores
│   ├── Official Resources
│   ├── Test-Day Guide
│   ├── One Skill Retake
│   └── FAQ
│
├── STUDENT DASHBOARD
│
└── ADMIN
```

---

# 4. HOME PAGE ARCHITECTURE

The landing page should be extremely clear. It should explain what the platform is within seconds.

## Section order

```text
Header
↓
Hero
↓
Choose Your IELTS Path
↓
5 Learning Platforms
↓
Diagnostic / Check Your Level
↓
Mock Tests
↓
Practice by Question Type
↓
Study Plan
↓
Latest Posts
↓
Video Learning
↓
AI Teacher
↓
Your IELTS Journey
↓
Official / Useful Resources
↓
Footer
```

### Hero

Suggested positioning:

**Complete IELTS Learning Platform**

Supporting message:

> Learn every IELTS skill, practise with purpose, take realistic tests, understand your weaknesses and follow a structured path towards your target band.

Primary CTAs:

- Start Learning
- Check Your Level
- Take a Mock Test

---

# 5. LEARNING MODULES

The existing five websites remain the source projects during development.

## Listening

Route eventually:

`/learn/listening`

## Reading

`/learn/reading`

## Writing

`/learn/writing`

## Speaking

`/learn/speaking`

## Skills

`/learn/skills`

### Migration strategy

Initially, Master can link to the local/deployed module projects.

Eventually, the five modules should be migrated route-by-route into the Master application or mounted as modular applications under one domain.

Do **not** iframe the old sites as the long-term architecture.

---

# 6. IMPORTANT: BUILD THE FIVE EXISTING SITES AS MODULES

Each current project should remain independently testable.

```text
IELTS-ECOSYSTEM/
│
├── master/
├── listening/
├── reading/
├── writing/
├── speaking/
├── skills/
├── mock-engine/
├── shared/
└── docs/
```

The eventual goal is a single public domain, for example:

```text
example.com
example.com/learn/listening
example.com/learn/reading
example.com/learn/writing
example.com/learn/speaking
example.com/learn/skills
example.com/mock-tests
example.com/practice
example.com/videos
example.com/posts
example.com/ai-teacher
example.com/dashboard
```

During development, however, the projects may remain separate.

---

# 7. DIAGNOSTIC / CHECK YOUR LEVEL

This should be added before full personalised learning is attempted.

The user answers a short diagnostic instead of immediately being told to take a full mock.

### Output

```text
Current estimated level
Listening
Reading
Writing
Speaking

Strengths
Weaknesses
Recommended next steps
```

A diagnostic should support:

- Academic / General Training selection
- Target band
- Current level
- Test date
- Time available per day

IDP currently uses a Reading/Listening self-assessment approach and recommends relevant preparation from the result, while E2 uses a short multi-skill score calculator to generate an indicative level and study pathway. citehttps://ielts.idp.com/prepare/article-top-10-resources-in-the-ielts-prepare-hubhttps://www.e2language.com/pages/features/score-calculator

The platform must clearly label diagnostic results as **indicative**, not official IELTS scores.

---

# 8. FULL MOCK TEST ENGINE

This should be a core system, not a simple page.

## Supported test families from day one

Design the engine to support:

- IELTS Academic
- IELTS General Training
- IELTS for UKVI Academic
- IELTS for UKVI General Training
- IELTS One Skill Retake practice mode
- IELTS Life Skills A1/A2/B1 as an optional future module

Official IELTS distinguishes Academic, General Training and UKVI pathways, and Life Skills uses a different Speaking/Listening assessment model. citehttps://ielts.org/take-a-test/test-typeshttps://ielts.org/take-a-test/test-types/ielts-tests-for-uk-visas-and-immigration/ielts-life-skills-test

## Test engine layers

```text
Test Definition
↓
Section Definition
↓
Part Definition
↓
Question Set
↓
Question Items
↓
Candidate Attempt
↓
Scoring
↓
Report
↓
Weakness Analysis
↓
Recommended Learning
```

## Do not hard-code

Never write the whole engine around assumptions such as:

```text
Every test = exactly 4 sections
Every Reading = 40 questions
Every scoring table = one fixed raw-score conversion
```

Instead use configuration:

```text
exam_type
exam_version
delivery_mode
section_order
section_duration
question_count
scoring_ruleset
retake_rules
availability_rules
```

This is essential because official IELTS delivery and pathways can change. From mid-2026, IELTS moved to computer-delivered testing globally, with a Writing on Paper option in selected markets; Bangladesh's current IDP listings show computer-delivered Academic, General Training and UKVI sessions with One Skill Retake availability at listed centres. citehttps://ielts.org/news-and-insights/updates-to-ielts-test-deliveryhttps://ielts.org/take-a-test/test-types/ielts-on-computer-writing-on-paperhttps://ielts.idp.com/bangladesh/test-centre/ioc-dhanmondi

---

# 9. MOCK TEST MODES

Do not create only one mock mode.

### A. Familiarisation Mode

Purpose: learn the computer interface.

Features:

- untimed option
- highlight
- notes
- question navigation
- computer-like layout

Official IELTS practice experience includes computer-based familiarisation and functions such as highlighting and notes. citehttps://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-testhttps://ielts.idp.com/prepare/article-how-to-prepare-for-ioc-practice-habits-for-success

### B. Timed Section Practice

One section only.

### C. Mini Mock

Short multi-skill test.

### D. Full Mock

Full-length simulation.

### E. Focused Mock

Example:

- Reading Matching Headings mock
- Listening Map/Plan mock
- Writing Task 2 mock
- Speaking Part 2 mock

---

# 10. MOCK TEST QUESTION MODEL

Each item should store:

```text
question_id
exam_type
module
section
part
question_type
question_number
prompt
passage_id
audio_id
options
correct_answer
acceptable_answers
word_limit
explanation
skill_tag
subskill_tag
difficulty
source_type
license_status
exam_version
status
```

This will let you later answer:

> Which question types does this student repeatedly get wrong?

---

# 11. CURRENT IELTS SCORING ARCHITECTURE

The platform must have a versioned scoring layer.

Official IELTS states that Listening and Reading contain 40 questions and that raw scores are converted to the 9-band scale; the exact raw-score conversion can vary slightly by test version. Overall band is calculated from the four component bands and rounded according to IELTS rules. Writing and Speaking use criterion-based assessment. citehttps://ielts.org/take-a-test/your-results/ielts-scoring-in-detail

Therefore:

```text
scoring_rulesets/
├── listening_v1
├── reading_academic_v1
├── reading_gt_v1
├── writing_v1
├── speaking_v1
└── future_versions...
```

Never bury band conversion in frontend JavaScript.

---

# 12. RESULT PAGE

Result should be more than:

> You scored 31/40.

It should show:

```text
Overall estimated band
Listening
Reading
Writing
Speaking

Raw score
Band conversion
Time used
Accuracy
Question-type performance
Repeated errors
Recommended lessons
```

### Example

```text
Reading: 6.5

Strong:
Short Answer
Sentence Completion

Needs work:
Matching Information
Matching Headings

Recommended:
→ Matching Information Course
→ 20-question targeted practice
→ Retry after 48 hours
```

This creates the core:

**Test → Diagnose → Learn → Retest** loop.

---

# 13. PRACTICE / QUESTION BANK

This is one of the most important additions beyond the user's original plan.

The student should not always have to take a full mock.

## Practice categories

### By skill

- Listening
- Reading
- Writing
- Speaking

### By question type

Reading examples:

- True/False/Not Given
- Matching Headings
- Matching Information
- Matching Features
- Multiple Choice
- Sentence Completion
- Summary Completion
- Short Answer
- Diagram/Flow Chart etc.

Listening examples:

- Form Completion
- Note Completion
- Table Completion
- Multiple Choice
- Matching
- Map/Plan/Diagram
- Sentence Completion

Official IELTS sample materials identify many of these task types, so the content model should support a broad question-type taxonomy rather than a few fixed templates. citehttps://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test

### By difficulty

- Foundation
- Easy
- Medium
- Hard
- Band-focused

### By target band

- 4.0+
- 5.0+
- 6.0+
- 7.0+
- 8.0+
- 9.0

---

# 14. ERROR LOG / MISTAKE BOOK

Add a permanent mistake system.

Whenever a student gets a question wrong:

```text
Save mistake
↓
Classify mistake
↓
Explain why
↓
Recommend lesson
↓
Add to review queue
```

Possible mistake categories:

- Vocabulary
- Paraphrase
- Grammar
- Spelling
- Attention
- Distractor
- Wrong location
- Misinterpretation
- Timing
- Question-type strategy

This feature should eventually become one of the main differentiators of the platform.

---

# 15. STUDY PLAN ENGINE

Add:

```text
Target band
Current band
Exam date
Available hours/day
Weak skills
Preferred learning style
```

Then produce:

```text
Week 1
Listening prediction
Reading question-type training
Writing Task 2 fundamentals
Speaking Part 1

Week 2
...
```

Commercial IELTS platforms currently use structured study pathways and detailed study schedules, while official preparation platforms provide personalised study guidance and progress tracking. citehttps://www.e2language.com/pages/ieltshttps://takeielts.britishcouncil.org/prepare/ielts-ready

---

# 16. AI TEACHER

This should be a central feature, but do not make it the first thing you build.

## AI Teacher capabilities

### Reading

- Explain answer
- Show evidence
- Parse sentence
- Show paraphrase
- Explain distractor
- Explain why other options are wrong

### Listening

- Explain answer
- transcript analysis
- paraphrase
- distractor analysis
- pronunciation / connected speech explanation

### Writing

- Task analysis
- Idea development
- Coherence
- Vocabulary
- Grammar
- Band-descriptor-based feedback
- Rewrite suggestions

### Speaking

- transcript
- fluency analysis
- vocabulary
- grammar
- pronunciation indicators
- follow-up questions
- practice conversation

### AI safety/quality rule

AI feedback must be labelled as an estimate unless reviewed by a qualified human assessor.

Official IELTS Writing and Speaking assessment is criterion-based; Writing uses Task Achievement/Task Response, Coherence and Cohesion, Lexical Resource and Grammatical Range and Accuracy, while Speaking uses Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation. citehttps://ielts.org/take-a-test/your-results/ielts-scoring-in-detailhttps://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdfhttps://cdn.ielts.org/ielts-guides/ielts-speaking-band-descriptors.pdf

---

# 17. POST / COMMUNITY-STYLE SECTION

This is the user's planned Facebook-like section.

Do not build a general social network initially.

## Initial model

**Admin-only publishing.**

Students can:

- read
- share
- optionally like/save

Admin can:

- create
- edit
- schedule
- publish
- unpublish
- pin
- archive
- attach image/video/link

### Post categories

- Announcement
- IELTS Tip
- New Course
- New Mock Test
- Vocabulary
- Grammar
- Test Update
- Study Advice
- Event

### Social share

Support:

- Facebook
- WhatsApp
- Telegram
- X
- Copy Link

Each post should generate Open Graph metadata so shared links have a proper title, image and description.

---

# 18. VIDEO LIBRARY

Admin adds YouTube URLs.

```text
YouTube URL
↓
System extracts video ID
↓
Creates embed
↓
Video page
↓
Related learning resource
```

Every video should contain:

- title
- thumbnail
- category
- description
- skill
- topic
- duration (optional)
- YouTube URL
- related course
- related practice

### Example

```text
How to Solve Matching Headings

[Watch Video]

[Practice Matching Headings →]

[Open Reading Course →]
```

The video section should therefore feed students into learning and practice instead of becoming a separate entertainment library.

---

# 19. RESOURCES HUB

Create one central resources page.

### Sections

- IELTS Academic
- IELTS General Training
- IELTS for UKVI
- Life Skills
- Test format
- Band scores
- Writing descriptors
- Speaking descriptors
- One Skill Retake
- Computer familiarisation
- Test-day preparation
- Official IELTS links
- Test booking links
- Test centre information

Official IELTS currently provides official sample questions, familiarisation resources, videos, apps, courses, webinars and articles; your resource hub can point students to official sources rather than republishing protected materials. citehttps://www.ielts.org/take-a-test/preparation-resourceshttps://ielts.org/take-a-test/preparation-resources/sample-test-questions

---

# 20. ONE SKILL RETAKE SUPPORT

Because One Skill Retake is an active IELTS pathway, the platform should have an information and practice architecture for it.

Official IELTS states that eligible test takers can retake one of Listening, Reading, Writing or Speaking after an eligible full computer-delivered IELTS test, generally within 60 days, at centres offering the service. Availability and requirements should always be checked with the test centre. citehttps://ielts.org/take-a-test/booking-your-test/one-skill-retake

Possible feature:

```text
My Full Test
↓
Listening 7.0
Reading 7.5
Writing 6.0
Speaking 7.0

Focus Skill: Writing
↓
Writing practice pathway
↓
Writing mock
↓
Retake readiness checklist
```

The platform must never promise eligibility; it should direct the user to official current requirements.

---

# 21. COMPUTER TEST FAMILIARISATION

This should be a dedicated feature because IELTS delivery has moved toward computer-first testing.

Include:

- realistic reading pane
- question pane
- answer navigation
- highlight
- note tool
- timer
- typed writing interface
- keyboard shortcuts where appropriate
- screen-size responsive layout

This should be a training simulator, not a claim that it is the official IELTS test interface.

---

# 22. TEST TYPE ARCHITECTURE

Do not make "Academic" a permanent global constant.

Create a `test_profile` object.

Example:

```json
{
  "id": "ielts-academic",
  "name": "IELTS Academic",
  "skills": ["listening", "reading", "writing", "speaking"],
  "delivery_modes": ["computer"],
  "writing_delivery_modes": ["typed", "writing_on_paper_where_supported"],
  "reading_variant": "academic",
  "writing_variant": "academic",
  "scoring_profile": "ielts-standard-v1"
}
```

This prevents major rewrites if IELTS adds or changes a delivery mode, test family or component.

---

# 23. CONTENT MANAGEMENT SYSTEM

Everything should eventually be managed through Admin.

## Admin sections

```text
Dashboard
│
├── Users
├── Posts
├── Videos
├── Courses
├── Lessons
├── Question Bank
├── Mock Tests
├── Audio
├── Writing Tasks
├── Speaking Tasks
├── AI Settings
├── Study Plans
├── Resources
├── Reports / Analytics
├── Site Settings
└── Content Versioning
```

---

# 24. ADMIN ROLES

Even if only one person runs the platform initially, design for roles.

### Super Admin
Everything.

### Content Editor
Posts, videos, lessons, resources.

### Question Editor
Questions and mock tests.

### Teacher / Assessor
Writing/Speaking evaluation.

### Student
Learning and test-taking only.

Do not give every account admin rights.

---

# 25. CONTENT LICENSING SYSTEM

This is essential.

Each content item should store:

```text
source_type
source_url
author
license_status
permission_reference
attribution_required
commercial_use_allowed
last_verified
```

Never build the public Mock Test library by copying Cambridge/IELTS official material without appropriate permission/licensing.

IELTS explicitly states that material from IELTS.org is protected and cannot simply be republished on another website or used commercially without written permission. citehttps://ielts.org/legal/ielts-copyright-and-trade-mark-statement

The platform should instead prioritise:

1. Original questions created for your platform.
2. Properly licensed content.
3. Official external links/resources where appropriate.

---

# 26. CONTENT MODEL

Create reusable content types.

```text
Course
Lesson
Topic
Question
QuestionSet
Passage
Audio
WritingTask
SpeakingTask
MockTest
Video
Post
Resource
Quiz
StudyPlan
Announcement
```

All content should be taggable by:

```text
skill
question_type
exam_type
band_level
difficulty
topic
subskill
source
version
status
```

---

# 27. GLOBAL SEARCH

Eventually add one search box for:

- Lessons
- Questions
- Question types
- Videos
- Posts
- Resources
- Vocabulary
- Grammar topics

Example:

> Matching Information

Results:

```text
Course
Practice
Video
Article
AI explanation
Mock tests
```

---

# 28. STUDENT DASHBOARD

The dashboard becomes the student's home after login.

```text
Welcome back

Target Band: 7.0
Test Date: 18 Dec 2026

Current estimated level: 5.5

Listening 6.0
Reading 5.5
Writing 5.0
Speaking 5.5

[ Continue Study Plan ]

Today's Tasks
Weak Areas
Recent Tests
Saved Items
```

---

# 29. PROGRESS ENGINE

Track:

```text
Questions attempted
Questions correct
Accuracy
Time per question
Question-type performance
Skill performance
Course completion
Mock history
Writing submissions
Speaking recordings
Study streak
```

The data model should allow future analytics without redesigning the database.

---

# 30. PERSONALISATION ENGINE

Future recommendation engine:

```text
Student data
↓
Performance data
↓
Weakness model
↓
Goal + exam date
↓
Recommended next action
```

Example:

```text
Student target: 7.0
Current Reading: 5.5

Weakness:
Matching Information

Recommendation:
1. Study course lesson
2. Complete 15 targeted questions
3. Review mistake log
4. Take mini test
5. Repeat after 2–3 days
```

---

# 31. VOCABULARY + GRAMMAR SYSTEM

The existing Skills project can eventually become the foundation.

### Vocabulary

- word
- meaning
- pronunciation
- part of speech
- collocations
- example
- IELTS context
- synonym/antonym
- personal flashcard
- spaced review

### Grammar

- topic
- level
- lesson
- examples
- error patterns
- practice questions
- connection to Writing/Speaking

IDP currently uses short quizzes and flashcards for grammar and vocabulary practice, showing the value of small, repeatable activities alongside full mocks. citehttps://ielts.idp.com/prepare/article-prepare-smarter-with-our-ielts-quizzes

---

# 32. MICRO PRACTICE

Add 5–10 minute activities.

Examples:

```text
5-minute vocabulary quiz
10-minute Listening drill
5-question Reading challenge
1 Speaking Part 1 challenge
1 Task 2 introduction drill
Grammar quick test
```

This complements full mocks and increases repeated engagement.

---

# 33. AI + HUMAN HYBRID FEEDBACK

Do not make AI the only feedback layer forever.

Architecture:

```text
AI Feedback
      ↓
Optional Human Review
      ↓
Final Feedback Report
```

This enables future paid human assessment without redesigning the product.

Commercial platforms such as Magoosh and E2 currently combine automated/AI feedback with expert or teacher assessment options. citehttps://ielts.magoosh.com/featureshttps://www.e2language.com/pages/features/mock-tests

---

# 34. SPEAKING RECORDER

Future-ready browser recorder:

```text
Prompt
↓
Preparation timer
↓
Recording
↓
Playback
↓
Transcript
↓
AI feedback
↓
Optional teacher review
```

Support:

- microphone permission handling
- noise notice
- recording duration
- replay
- delete/re-record
- privacy consent

---

# 35. WRITING WORKSPACE

Create a dedicated writing environment.

```text
Prompt
│
├── Timer
├── Word count
├── Draft
├── Final answer
├── Spellcheck indicator
├── AI feedback
└── Submission history
```

Never silently auto-correct the candidate's response before evaluation.

---

# 36. TEST-DAY CENTER

A dedicated section:

```text
Test Format
What to Bring
Timing
Computer Test Familiarisation
Speaking
Results
One Skill Retake
Accessibility
Common Mistakes
```

Official IELTS provides access arrangements for candidates with different support needs, so accessibility should be treated as a product requirement, not an afterthought. citehttps://ielts.org/take-a-test/booking-your-test/access-arrangements

---

# 37. BOOKING / TEST CENTRE LINKS

Do not rebuild official booking systems.

Provide:

- Official booking links
- Official test centre links
- Official test type guidance
- Country-specific information

For Bangladesh, the Master platform can eventually link users to current IDP/British Council test-centre information rather than storing stale schedules in your own database.

---

# 38. NOTIFICATION SYSTEM

Future-ready notifications:

### In-app

- New mock test
- New post
- New video
- Study task due
- Test date approaching
- Score improvement

### Email

- Welcome
- Study plan
- Results
- Teacher feedback
- Important announcements

### Push notification

Optional future PWA/mobile feature.

---

# 39. PWA / MOBILE FUTURE

Build the frontend responsive from day one.

Later:

```text
Website
↓
PWA
↓
Install on phone
↓
Offline flashcards / selected resources
```

Native apps should not be required for the first release.

---

# 40. ANALYTICS

Admin analytics should include:

```text
Visitors
Most visited modules
Mock starts
Mock completions
Average scores
Most missed question types
Most viewed videos
Most shared posts
Course completion
Student retention
```

A particularly valuable report:

> Top 20 weaknesses across all students.

This can guide future course creation.

---

# 41. SEO ARCHITECTURE

Use indexable public content.

Examples:

```text
/ielts-reading/matching-headings
/ielts-listening/map-labelling
/ielts-writing/task-2
/ielts-speaking/part-2
/ielts-band-score
/ielts-one-skill-retake
/ielts-computer-test
```

Do not make all educational content hidden behind login.

Use free public educational content for SEO and discovery; keep deeper analytics, assessments and personalised features behind account access if needed.

---

# 42. PERFORMANCE

Requirements:

- lazy-load video embeds
- optimise images
- compress audio
- cache public content
- avoid unnecessary client-side JavaScript
- use CDN for static assets
- paginate question/post lists
- do not load the entire question bank at once

---

# 43. SECURITY

Minimum requirements:

- secure admin login
- password hashing / managed auth
- role-based access control
- server-side validation
- rate limiting
- CSRF/XSS protections as applicable
- database backups
- audit log
- secure file upload handling
- API authentication

Admin activity should be logged.

Example:

```text
User
Action
Object
Timestamp
IP/device metadata where appropriate
```

---

# 44. DATA PRIVACY

The platform may eventually store:

- email
- writing submissions
- voice recordings
- progress data
- test results
- AI feedback

Therefore build:

- Privacy Policy
- Terms
- consent controls
- data deletion process
- account export/delete plan
- retention rules

Special care is needed for voice recordings and student writing.

---

# 45. VERSIONING — CRITICAL FUTURE-PROOF FEATURE

Every major IELTS format definition should have a version.

```text
IELTS_FORMAT_2026_V1
IELTS_FORMAT_2027_V1
IELTS_SCORING_2026_V1
QUESTION_SCHEMA_V1
```

Every mock test must store the version under which it was authored.

This means old practice attempts remain reproducible even after the platform changes.

---

# 46. FEATURE FLAGS

Use feature flags for future IELTS changes.

Examples:

```text
WRITING_ON_PAPER_ENABLED
ONE_SKILL_RETAKE_INFO_ENABLED
LIFE_SKILLS_ENABLED
AI_SPEAKING_ENABLED
AI_WRITING_ENABLED
TEACHER_REVIEW_ENABLED
```

This is much safer than rebuilding the whole site whenever a feature changes.

---

# 47. CONTENT VERSIONING

If a lesson or question changes:

```text
Question v1
Question v2
Question v3
```

Old student attempts still point to the original version.

Never silently rewrite historical attempts.

---

# 48. FUTURE FEATURE RESERVE

Reserve architecture for possible future additions without promising that IELTS itself will adopt them.

### Potential platform features

- advanced AI tutor
- adaptive practice
- AI Writing coach
- AI Speaking coach
- human teacher marking
- live classes
- recorded classes
- live webinars
- study groups
- teacher dashboard
- parent/student reporting where appropriate
- certificates
- paid courses
- subscriptions
- coupons
- payments
- referral system
- affiliate links
- institution/classroom accounts
- school dashboard
- mobile app
- multilingual interface
- offline study packs
- downloadable worksheets
- resource marketplace

These are **platform expansion possibilities**, not claims about future IELTS test changes.

---

# 49. WHAT NOT TO BUILD IN VERSION 1

Do not start with:

- social networking
- messaging
- complicated gamification
- native Android/iOS apps
- a huge payment system
- an enormous AI agent system
- 100 mock tests
- every IELTS type at once
- a teacher marketplace

First make the core learning loop reliable.

---

# 50. MVP — FIRST MASTER RELEASE

The first Master release should contain:

### Public

- Home
- Learn
- Listening
- Reading
- Writing
- Speaking
- Skills
- Mock Tests landing
- Posts
- Videos
- Resources
- Test Information
- Official links

### Student

- Account
- Basic dashboard
- Diagnostic
- Practice
- Mock attempt
- Results
- Saved items

### Admin

- Posts
- Videos
- Question bank
- Mock tests
- Users
- Resources

That is enough for a strong first release.

---

# 51. VERSION 2

Add:

- AI Teacher
- Study Plan
- Progress analytics
- Mistake Book
- Writing workspace
- Speaking recorder
- AI scoring
- personalised recommendations
- notifications

---

# 52. VERSION 3

Add:

- teacher review
- live classes
- paid courses
- subscriptions
- advanced adaptive practice
- PWA
- institution dashboard
- advanced analytics

---

# 53. DEVELOPMENT ROADMAP FOR THE USER'S CURRENT FIVE PROJECTS

Do not stop development of the five existing projects.

## Project 1 — Listening

Finish its course, practice, question-type and analysis system.

## Project 2 — Reading

Finish its question-type and strategy architecture.

## Project 3 — Writing

Finish Task 1 + Task 2 + assessment framework.

## Project 4 — Speaking

Finish Part 1 + 2 + 3 + fluency/natural-answer training.

## Project 5 — Skills

Build the shared English foundation layer:

```text
Vocabulary
Grammar
Pronunciation
Sentence structure
Paraphrasing
Academic English
Natural English
```

Then connect the modules through the Master platform.

---

# 54. TRANSITION FROM FIVE LOCAL SITES TO ONE MASTER SITE

### Stage 1 — Current

```text
Five separate local projects
```

### Stage 2 — Master shell

```text
Master local project
        ↓
links to five local projects
```

### Stage 3 — Unified data model

```text
Common question schema
Common lesson schema
Common user schema
Common taxonomy
```

### Stage 4 — Route migration

Migrate one module at a time:

```text
Listening
↓
Reading
↓
Writing
↓
Speaking
↓
Skills
```

### Stage 5 — One public application

```text
example.com
```

with internal routes for every module.

---

# 55. RECOMMENDED MASTER TECHNICAL STACK

A practical modern stack:

```text
Frontend / Full-stack:
Next.js + TypeScript

UI:
Tailwind CSS or a consistent component system

Database:
PostgreSQL

ORM:
Prisma or Drizzle

Authentication:
Managed authentication or secure server auth

Storage:
Object storage for images/audio/files

Video:
YouTube embeds

Search:
PostgreSQL search initially; dedicated search later if needed

AI:
Provider-agnostic AI service layer

Analytics:
Privacy-conscious web analytics + custom event tracking

Deployment:
Cloud hosting + CDN
```

The exact stack can change. The architecture should not depend on one AI provider or one hosting provider.

---

# 56. AI PROVIDER ABSTRACTION

Never connect the entire application directly to one model provider.

Create:

```text
AIService
├── chat()
├── explainQuestion()
├── gradeWriting()
├── analyzeSpeaking()
├── createStudyPlan()
└── generatePractice()
```

Then providers can be changed later.

---

# 57. SHARED DESIGN SYSTEM

Because five projects will eventually become one ecosystem, create shared design tokens now.

```text
Brand colors
Typography
Spacing
Buttons
Cards
Forms
Alerts
Tabs
Modals
Question components
Audio player
Timer
Progress bar
Score cards
```

This will dramatically reduce the work required during final consolidation.

---

# 58. SHARED IELTS TAXONOMY

Create one master taxonomy now.

```text
Skill
Question Type
Subskill
Difficulty
Band
Test Type
Topic
Grammar
Vocabulary
Mistake Type
```

The same taxonomy should be used by all five sites and the Master platform.

---

# 59. MASTER CONTENT RELATIONSHIP

Every learning item should eventually know what it connects to.

Example:

```text
Video
↓
Lesson
↓
Practice set
↓
Mock question type
↓
Mistake category
↓
Recommended lesson
```

This creates a connected ecosystem instead of isolated content pages.

---

# 60. THE MOST IMPORTANT PRODUCT LOOP

The complete future platform should behave like this:

```text
NEW STUDENT
      ↓
Choose test / target
      ↓
Diagnostic
      ↓
Personalised study plan
      ↓
Learn
      ↓
Targeted practice
      ↓
Mistake review
      ↓
Mini test
      ↓
Full mock
      ↓
Score + analysis
      ↓
Weakness detection
      ↓
Recommended learning
      ↓
Retest
      ↓
Target readiness
```

This should be the central product philosophy.

---

# 61. FINAL NAVIGATION

Recommended long-term header:

```text
LOGO

Home
Learn ▾
Practice ▾
Mock Tests
AI Teacher
Study Plan
Videos
Posts
Resources
```

Logged-in user additionally gets:

```text
Dashboard
Progress
Profile
```

Admin gets:

```text
Admin
```

---

# 62. FINAL SITEMAP

```text
/
├── learn/
│   ├── listening/
│   ├── reading/
│   ├── writing/
│   ├── speaking/
│   └── skills/
│
├── practice/
│   ├── question-bank/
│   ├── listening/
│   ├── reading/
│   ├── writing/
│   ├── speaking/
│   └── quick-quizzes/
│
├── mock-tests/
│   ├── academic/
│   ├── general-training/
│   ├── ukvi/
│   ├── familiarisation/
│   └── results/
│
├── ai-teacher/
├── study-plan/
├── progress/
├── posts/
├── videos/
├── resources/
├── test-info/
├── diagnostic/
├── search/
├── dashboard/
│
└── admin/
    ├── dashboard/
    ├── users/
    ├── posts/
    ├── videos/
    ├── lessons/
    ├── questions/
    ├── mocks/
    ├── resources/
    ├── analytics/
    └── settings/
```

---

# 63. FINAL DECISION

The user's current plan should **not** be changed.

The right strategy is:

> **Build the five specialized IELTS websites now. Build them as clean, modular products. Do not duplicate work. Create a Master platform later that connects and gradually absorbs those modules.**

The Master platform should not merely link to the five sites. It should own the shared infrastructure:

```text
Users
Authentication
Question taxonomy
Mock engine
Scoring engine
Progress
Analytics
AI layer
Posts
Videos
Study plans
Resources
Admin CMS
```

The five skill sites own the deep learning experiences.

This separation lets the platform grow without forcing you to rebuild everything every time IELTS, technology or your content strategy changes.

---

# 64. THE FIRST DEVELOPMENT TARGET

Do **not** build all features at once.

Build these in order:

```text
1. Finish the five learning modules
2. Define shared taxonomy
3. Define shared content schema
4. Build Master shell
5. Build Admin CMS
6. Build Posts
7. Build Video Library
8. Build Diagnostic
9. Build Question Bank
10. Build Mock Engine
11. Build Results + Analytics
12. Build Student Dashboard
13. Build AI Teacher
14. Build personalised Study Plan
15. Add advanced future features
```

The most important early engineering decision is to make the content, test format and scoring layers **configurable and versioned**.

---

# 65. RESEARCH SOURCES USED FOR THIS ARCHITECTURE

Official IELTS:

- IELTS test types: https://ielts.org/take-a-test/test-types
- IELTS test delivery update: https://ielts.org/news-and-insights/updates-to-ielts-test-delivery
- IELTS preparation resources: https://ielts.org/take-a-test/preparation-resources
- Official sample questions: https://ielts.org/take-a-test/preparation-resources/sample-test-questions
- Academic sample tests / familiarisation: https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test
- IELTS scoring: https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail
- One Skill Retake: https://ielts.org/take-a-test/booking-your-test/one-skill-retake
- Life Skills: https://ielts.org/take-a-test/test-types/ielts-life-skills-test
- Access arrangements: https://ielts.org/take-a-test/booking-your-test/access-arrangements
- IELTS copyright/trademark: https://ielts.org/legal/ielts-copyright-and-trade-mark-statement

Official preparation ecosystems:

- British Council IELTS preparation: https://takeielts.britishcouncil.org/prepare
- British Council IELTS Ready: https://takeielts.britishcouncil.org/prepare/ielts-ready
- IDP IELTS preparation: https://ielts.idp.com/prepare
- IDP practice tests: https://ielts.idp.com/prepare/practice-test
- IDP quiz / micro-practice: https://ielts.idp.com/prepare/article-prepare-smarter-with-our-ielts-quizzes

Commercial platform feature research:

- Magoosh IELTS features: https://ielts.magoosh.com/features
- Magoosh IELTS plans: https://ielts.magoosh.com/plans
- E2 IELTS: https://www.e2language.com/pages/ielts
- E2 score calculator: https://www.e2language.com/pages/features/score-calculator
- E2 mock tests: https://www.e2language.com/pages/features/mock-tests
- IELTS Advantage: https://www.ieltsadvantage.com/

---

## FINAL PRODUCT PRINCIPLE

**The Master Website is not a replacement for the five learning systems. It is the operating system that connects them.**

```text
CONTENT
   ↓
LEARNING
   ↓
PRACTICE
   ↓
ASSESSMENT
   ↓
ANALYSIS
   ↓
PERSONALISATION
   ↓
IMPROVEMENT
```

That is the architecture to build toward.


---

# 66. EXCLUSIVE COLLABORATION LAYER — FINAL INTEGRATION

## 66.1 Purpose

Porchi's Master architecture now includes two exclusive collaboration products:

1. **Speaking Partner** — real IELTS learners practise Speaking directly with other real learners.
2. **Study Rooms** — two or more learners study together inside a shared Porchi learning environment using synchronized content, audio/video, annotations, chat, timers and a collaborative whiteboard.

These features are not a replacement for the original learning architecture. They extend it with a dedicated human collaboration layer.

The original blueprint identifies study groups and related collaboration capabilities as future platform expansion possibilities, while deliberately avoiding a general social-network build in the first release. The new plan keeps that distinction: collaboration is purpose-built around IELTS learning rather than general social networking. 

---

# 67. NEW MASTER PRODUCT PILLAR

The navigation becomes:

```text
PORCHI
│
├── Learn
├── Practice
├── Mock Tests
├── AI Teacher
├── Study Plan
├── Progress
│
├── Collaborate
│   ├── Speaking Partner
│   └── Study Rooms
│
├── Videos
├── Posts
├── Resources
└── Dashboard
```

The new product principle is:

> **Learn alone, practise with humans, use AI when useful, and keep every activity connected to progress.**

---

# 68. EXCLUSIVE FEATURE 01 — SPEAKING PARTNER

## Core idea

A learner can find another real learner and start a structured IELTS Speaking practice session.

```text
Student A
    ↓
Partner Matching
    ↓
Student B
    ↓
Speaking Practice Room
    ↓
Partner Feedback
    ↓
Practice History
```

This is an IELTS practice matching system, not a dating app, general-purpose chat service or open social network.

---

## 68.1 Matching profile

Core data:

```text
Test Type
Academic / General Training
Target Band
Current Estimated Speaking Level
Preferred Speaking Parts
Preferred Practice Duration
Preferred Days
Preferred Times
Timezone
Language Comfort
```

The matching system should optimise for learning compatibility:

```text
Target compatibility
+
Approximate level compatibility
+
Availability overlap
+
Practice goal compatibility
+
Preferred Speaking Parts
+
Session duration
+
Language comfort
=
Partner Match
```

---

## 68.2 Speaking Partner modes

### Instant Match

```text
Find Speaking Partner
        ↓
Match available learner
        ↓
Invite / Accept
        ↓
Join practice room
```

### Scheduled Match

```text
Choose Date
Choose Time
Choose Duration
        ↓
Confirm Session
        ↓
Reminder
        ↓
Join Room
```

### Repeat Partner

After a useful session, both learners can practise together again.

```text
Practice History
      ↓
Repeat with this partner
```

---

## 68.3 Speaking Practice Room

```text
┌───────────────────────────────────────────┐
│          PORCHI SPEAKING ROOM             │
├──────────────────────┬────────────────────┤
│      Student A       │      Student B     │
│       Camera         │       Camera       │
├──────────────────────┴────────────────────┤
│ IELTS Prompt / Cue Card / Timer            │
│ Part 1 / Part 2 / Part 3                  │
├────────────────────────────────────────────┤
│ Mic | Camera | Chat | Timer | Leave |      │
│ Report | Next Prompt | Feedback            │
└────────────────────────────────────────────┘
```

Controls:

- microphone
- camera
- volume
- chat
- timer
- prompt display
- next prompt
- leave
- report
- block

---

## 68.4 Structured IELTS Speaking mode

The room should provide a practice structure rather than acting as a generic video call.

Example:

```text
Part 1
4 minutes

Part 2
1 minute preparation
2 minutes speaking

Part 3
7 minutes discussion

Feedback
4 minutes
```

Timing remains configuration-driven.

---

## 68.5 Prompt integration

Speaking prompts reference the shared Porchi content architecture:

```text
prompt_id
exam_type
part
topic
difficulty
band_focus
prompt_text
follow_up_questions
source_type
license_status
version
status
```

---

## 68.6 Partner Feedback

After the session, learners can provide descriptive peer feedback:

```text
Fluency
Vocabulary
Grammar
Pronunciation
Ideas
Confidence
```

This is labelled **Partner Feedback** and never presented as an official IELTS score or official examiner result.

---

## 68.7 Speaking history

Each session creates a learning record:

```text
Session Date
Duration
Partner
Parts Practised
Prompts Used
Peer Feedback
Personal Notes
Recording Status
Report Status
```

The activity can contribute to Progress without exposing one learner's private analytics to another.

---

## 68.8 Safety / recording

Required safety controls:

```text
Mute
Block
Report
Leave Room
End Session
```

Recording is opt-in. Before recording:

```text
Recording is OFF
        ↓
All required participants consent
        ↓
Recording begins
```

The system must define access, retention and deletion rules for audio/video data.

---

# 69. EXCLUSIVE FEATURE 02 — STUDY ROOMS

## Core idea

A Study Room is a private collaborative learning environment where several learners study the same Porchi content together.

```text
Bangladesh ─┐
UK ─────────┼──→ Porchi Study Room
Australia ──┘
```

The room supports:

- synchronized Porchi content
- audio
- video
- shared highlight
- shared notes
- pointer/cursor
- whiteboard
- chat
- timer
- group practice
- session history

---

# 70. SHARED LEARNING SURFACE

This is the core Study Room innovation.

The default should not simply broadcast one person's entire computer screen. Instead, Porchi synchronizes its own learning environment.

```text
Porchi Page
    ↓
Shared Page State
    ↓
Every participant sees the same learning surface
```

Example:

```text
Reading → Passage 2 → Question 14
```

All room members can see and interact with the shared learning context.

---

# 71. SHARED INTERACTION

Participants can, subject to permissions:

- highlight
- underline
- select text
- add notes
- draw
- point
- navigate
- answer practice questions
- view shared prompts

This turns the room into a collaborative learning surface rather than a generic call window.

---

# 72. PERSONAL VS SHARED ANNOTATION

## Personal

```text
My Highlight
My Note
My Bookmark
My Mistake
```

Only the owner can see these.

## Shared

```text
Shared Highlight
Shared Note
Shared Drawing
Shared Pointer
```

Everyone in the room can see these, subject to room permissions.

The UI must make the current state obvious so users do not accidentally publish private notes to the group.

---

# 73. WHITEBOARD

Every Study Room gets a collaborative whiteboard.

Tools:

```text
Pen
Highlighter
Text
Arrow
Shape
Eraser
Undo
Redo
Clear
```

Use cases:

### Reading

```text
Main Idea
Evidence
Keyword
Paraphrase
```

### Writing

```text
Introduction
      ↓
Body 1
      ↓
Body 2
      ↓
Conclusion
```

### Speaking

```text
Person
Place
Reason
Example
```

### Vocabulary

```text
Word
Meaning
Collocation
Example
Synonym
```

---

# 74. AUDIO / VIDEO / CHAT

Study Rooms support group audio and video, plus study-context chat.

Initial room size should remain intentionally small enough for meaningful study interaction; exact limits can be adjusted after testing.

Chat can support:

- text
- reactions
- relevant links
- short study notes

It should not become a general social inbox.

---

# 75. STUDY ROOM MODES

### Shared Page

Everyone follows the same synchronized Porchi page.

### Presenter Mode

One participant controls the shared route/page.

```text
Presenter: Student A
```

### Free Explore

Participants can browse independently while remaining inside the same audio/video/chat/whiteboard room.

---

# 76. SYNCHRONIZED STATE

Possible shared state:

```text
Shared Route
Shared Question
Shared Selection
Shared Highlight
Shared Annotation
Shared Cursor / Focus
Shared Timer
Presenter State
```

The shared state model should stay minimal enough to remain reliable.

---

# 77. HOST CONTROLS

```text
Lock Shared Page
Allow Everyone to Navigate
Allow Shared Annotation
Clear Shared Annotations
Start Timer
Pause Timer
Transfer Host
End Room
```

Permissions should be explicit.

---

# 78. STUDY ROOM TEMPLATES

## Reading Room

```text
Reading Passage
Questions
Shared Highlight
Timer
Whiteboard
Discussion
```

## Writing Room

```text
Writing Prompt
Shared Brainstorm
Whiteboard
Writing Workspace
Discussion
```

## Speaking Room

```text
Cue Card
Timer
Video Call
Turn Taking
Feedback
```

## Vocabulary Room

```text
Vocabulary List
Quiz
Whiteboard
Audio
Discussion
```

## General IELTS Room

All compatible collaboration tools.

---

# 79. ROOM TYPES / INVITATIONS

Room types:

```text
Private Room
Friends Room
Small Study Group
Public Practice Room — future / moderated
```

Invitations:

```text
Invite Link
Invite Code
Direct Friend Invite
```

The initial release should focus on private and small-group rooms.

---

# 80. STUDY ROOM MEMORY

Session history can include:

```text
Study Session
Date
Duration
Participants
Content Studied
Questions Practised
Shared Notes
Whiteboard
Highlights
Host
```

Possible action:

> **Continue Study Session**

Historical access must respect participant privacy and room permissions.

---

# 81. GROUP ACTIVITY + PERSONAL PROGRESS

Core data rule:

> **Group activity is shared; progress is personal.**

Example:

```text
Room:
Reading Passage 2 completed

Student A → 8/10
Student B → 6/10
Student C → 9/10
Student D → 7/10
```

Each student's mistakes and progress remain private unless explicitly shared.

---

# 82. GROUP STUDY + MISTAKE BOOK

A learner can save a wrong answer to their personal Mistake Book:

```text
Save to My Mistake Book
```

Optionally:

```text
Share this question with room
```

That converts an individual mistake into a group learning discussion without exposing unrelated private data.

---

# 83. AI INSIDE COLLABORATION — FUTURE LAYER

The architecture reserves room for a contextual AI assistant.

Examples:

> Explain why B is correct.

> Give us another question like this.

> Give this group a Speaking Part 2 topic.

> Summarise today's study session.

The assistant remains clearly identified as Porchi AI support and never as an official IELTS examiner or official IELTS scoring service.

---

# 84. SPEAKING PARTNER ↔ STUDY ROOMS

These features should connect directly.

### Flow A

```text
Study Room
    ↓
Need Speaking Practice
    ↓
Create Speaking Session
    ↓
Practice
    ↓
Feedback
```

### Flow B

```text
Speaking Partner
    ↓
Repeat Partner
    ↓
Create Study Room
    ↓
Continue Other Skills Together
```

---

# 85. DASHBOARD / NOTIFICATION INTEGRATION

Dashboard block:

```text
COLLABORATE

[Find Speaking Partner]
[Join Study Room]
[Create Study Room]

Upcoming Sessions
Recent Sessions
Repeat Partner
```

Notification events:

```text
Partner Request
Partner Session Reminder
Study Room Invitation
Study Room Starting Soon
Room Session Summary
Repeat Partner Invitation
```

---

# 86. COLLABORATION DATA MODEL

Add to the existing Master schema:

```text
SpeakingPartnerPreference
PartnerMatch
PartnerSession
PartnerFeedback

StudyRoom
StudyRoomMember
StudyRoomSession
StudyRoomPermission
StudyRoomInvite

SharedPageState
SharedAnnotation
SharedHighlight
SharedNote
SharedCursor

Whiteboard
WhiteboardObject

RoomMessage
RoomEvent

CallSession
RecordingConsent

Report
Block
ModerationEvent
```

These entities connect to User, Content, Progress, Notification and Admin systems.

---

# 87. REAL-TIME ARCHITECTURE

The collaboration layer requires real-time infrastructure for:

```text
Presence
Room Membership
Page Sync
Cursor
Highlights
Annotations
Whiteboard
Chat
Timers
Participant Join/Leave
Room Events
```

And a separate media layer for:

```text
Audio
Video
```

Conceptually:

```text
Browser
   ↓
Porchi Application
   ↓
Real-time Layer
   ├── Presence
   ├── Shared State
   ├── Whiteboard
   ├── Chat
   └── Room Events

Media Layer
   ├── Audio
   └── Video

Persistent Database
   ├── Users
   ├── Rooms
   ├── Sessions
   ├── Collaboration History
   └── Progress
```

The provider can be selected later; the product architecture should remain provider-agnostic.

---

# 88. RESPONSIVE EXPERIENCE

### Desktop

```text
Participants
       │
Shared IELTS Workspace
       │
Chat / Whiteboard / Controls
```

### Mobile

Use progressive panels rather than displaying every tool simultaneously:

```text
Video
↓
Shared Content
↓
Chat / Whiteboard
```

---

# 89. PERMISSIONS / SAFETY / MODERATION

Suggested room roles:

```text
Room Owner
Host
Participant
Observer — future
```

Action permissions:

```text
Can Speak
Can Use Camera
Can Navigate
Can Annotate
Can Edit Whiteboard
Can Send Chat
Can Share Content
Can Start Timer
Can Invite
Can End Session
```

Moderation entities:

```text
Report
Block
ModerationEvent
```

Collaboration safety is part of the architecture, not a post-launch patch.

---

# 90. HOMEPAGE POSITIONING

Add a visible product-proof block:

```text
STUDY ALONE OR TOGETHER

Need speaking practice?
→ Find a Speaking Partner

Studying with friends?
→ Create a Study Room

[Watch how it works]
```

Use actual product demonstrations instead of generic feature icons.

---

# 91. BRAND CONNECTION

Master brand:

> **Porchi — স্বপ্ন পূরণের জন্য পড়ছি।**

Collaboration expression:

> **একা নয়, একসাথে এগিয়ে যাই।**

Speaking Partner CTA:

> **Speaking Partner খুঁজি**

Study Room CTA:

> **Study Room তৈরি করি**

Daily collaboration message:

> **আজ একসাথে একটু এগিয়ে যাই।**

The language should remain warm, clear, modern, capable and encouraging.

---

# 92. NEW MASTER LEARNING LOOP

Original:

```text
Learn
↓
Practice
↓
Feedback
↓
Repair
↓
Retry
```

Updated:

```text
Learn
↓
Practice Alone
↓
Practice With Humans
↓
Collaborate
↓
Feedback
↓
Repair
↓
Mock
↓
Analyse
↓
Progress
↓
Retry
```

Three complementary learning modes now exist:

```text
Individual Learning
+
Human Collaboration
+
AI Assistance
```

---

# 93. RELEASE ROADMAP UPDATE

The original Master roadmap remains valid, with the following addition.

## Phase 0 — Architecture Reserve

Reserve:

- room/session entities
- permissions
- presence
- shared-content state
- moderation
- notifications
- recording/privacy
- real-time interfaces

## Phase 1 — Core Master Learning Platform

Complete the original five modules and core Master platform.

## Phase 2 — Diagnostic + Practice + Mock + Progress

Stabilise the original learning loop.

## Phase 3 — Speaking Partner

Launch:

- preferences
- matching
- one-to-one audio/video
- IELTS prompts
- timer
- feedback
- session history
- report/block

## Phase 4 — Study Rooms

Launch:

- private rooms
- invitation link/code
- group audio/video
- shared Porchi page
- shared highlight
- shared notes
- whiteboard
- chat
- timer
- host controls
- session history

## Phase 5 — Deep Collaboration Integration

Add:

- dashboard
- notifications
- personal progress
- Mistake Book
- templates
- repeat partner
- scheduling
- richer permissions

## Phase 6 — Advanced Collaboration

Potential additions:

- AI study assistant
- teacher-led rooms
- moderated public rooms
- session summaries
- collaborative quizzes
- collaborative speaking drills
- advanced collaboration analytics

---

# 94. WHAT NOT TO BUILD AS PART OF COLLABORATION

Avoid turning Collaborate into a generic social network.

Do not prioritise:

- general-purpose social feed
- unrelated entertainment chat
- dating/social matching
- uncontrolled public video rooms
- automatic public recordings
- gamification that publicly ranks struggling learners

The job of Collaborate is learning.

---

# 95. SUCCESS METRICS

## Speaking Partner

```text
Match Requests
Successful Matches
Session Starts
Session Completion
Repeat Partner Sessions
Average Practice Duration
Feedback Completion
Report Rate
```

## Study Rooms

```text
Rooms Created
Rooms Joined
Sessions Completed
Average Participants
Study Time
Shared Pages Used
Whiteboard Usage
Practice Questions Completed
Repeat Sessions
```

## Learning impact

```text
Practice Completion
Accuracy
Question-Type Improvement
Speaking Practice Frequency
Mock Participation
Progress by Skill
```

Room usage alone is not a learning outcome; collaboration metrics should be connected to learning activity and progress.

---

# 96. FINAL MASTER PRODUCT MODEL — UPDATED

```text
                         PORCHI
                            │
                  স্বপ্ন পূরণের জন্য পড়ছি
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
      LEARN              PRACTICE              ASSESS
        │                   │                    │
        └───────────────────┼────────────────────┘
                            │
                       COLLABORATE
                       /          \
                      /            \
             SPEAKING PARTNER   STUDY ROOMS
                    │               │
              Human ↔ Human    Humans ↔ Humans
                    │               │
                    └──────┬────────┘
                           │
                        FEEDBACK
                           │
                          REPAIR
                           │
                           MOCK
                           │
                         ANALYSE
                           │
                        PROGRESS
                           │
                         RETEST
```

---

# 97. FINAL MASTER PRINCIPLE

The Master Website remains the operating system that connects the five learning systems.

The updated ecosystem adds a dedicated human-collaboration layer:

> **Porchi gives learners a place to learn, a place to practise, a place to practise together, and a clear way to see the result of that work.**

Final architecture:

```text
CONTENT
   ↓
LEARNING
   ↓
PRACTICE
   ↓
COLLABORATION
   ↓
ASSESSMENT
   ↓
FEEDBACK
   ↓
ANALYSIS
   ↓
PERSONALISATION
   ↓
IMPROVEMENT
   ↓
RETEST
```

The collaboration layer is therefore part of Porchi's long-term product identity, while remaining tightly bound to its core learning mission.
