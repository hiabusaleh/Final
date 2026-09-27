# PORCHI — EXCLUSIVE COLLABORATION FEATURES
## Final Product & Technical Plan

**Version:** 1.0  
**Planning date:** September 2026  
**Parent product:** Porchi IELTS Master Ecosystem  
**Exclusive layer:** `Collaborate`

---

# 1. PURPOSE

This document defines the final plan for two exclusive Porchi features:

1. **Speaking Partner** — real IELTS learners practise Speaking directly with other real learners.
2. **Study Rooms** — two or more learners study together in a shared Porchi learning environment with synchronized content, audio/video conversation, annotations, chat, timers and a collaborative whiteboard.

These are not generic social features. They are **purpose-built learning collaboration features** that extend the Porchi learning loop.

Existing Porchi product principles already emphasize human learning, a clear next step, structured practice, feedback and visible progress. The collaboration layer turns those principles into live learner-to-learner experiences.

---

# 2. EXCLUSIVE PRODUCT PILLAR

Add a new primary product area:

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

## Collaborate mission

> **Study alone when you need focus. Study with people when collaboration makes learning better.**

The feature family should feel like a natural part of Porchi, not like a separate social network.

---

# 3. THE TWO EXCLUSIVE PRODUCTS

```text
COLLABORATE
│
├── SPEAKING PARTNER
│   └── Human ↔ Human IELTS Speaking Practice
│
└── STUDY ROOMS
    └── Human ↔ Human ↔ Human Collaborative Study
```

The two products share:

- identity and authentication
- availability / presence
- invitations
- safety controls
- notifications
- session history
- progress integration
- reporting and moderation
- real-time infrastructure

But their core jobs are different.

**Speaking Partner:** practise speaking with another learner.

**Study Rooms:** study together using Porchi's actual learning environment.

---

# 4. EXCLUSIVE FEATURE 01 — SPEAKING PARTNER

## 4.1 Core idea

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

This is not a dating feature, general chat app or open social feed. It is an IELTS practice system.

---

# 5. SPEAKING PARTNER GOALS

The system should support:

- Speaking Part 1 practice
- Speaking Part 2 cue-card practice
- Speaking Part 3 discussion
- fluency practice
- follow-up question practice
- confidence building
- natural conversation
- pronunciation practice
- peer feedback
- repeat practice with a compatible partner

---

# 6. SPEAKING PARTNER ONBOARDING

When a user enables Speaking Partner, collect only information necessary for matching and safe use.

### Core matching data

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

Optional fields should be designed carefully and should not turn the product into a social identity marketplace.

---

# 7. PARTNER MATCHING ENGINE

The matching system should consider learning compatibility rather than popularity.

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

The exact matching algorithm can evolve without changing the public experience.

---

# 8. SPEAKING PARTNER MODES

## A. Instant Match

```text
Find Speaking Partner
        ↓
Match available learner
        ↓
Invite / Accept
        ↓
Join practice room
```

## B. Scheduled Match

```text
Choose Date
Choose Time
Choose Duration
        ↓
Confirm Session
        ↓
Reminders
        ↓
Join Room
```

## C. Repeat Partner

After a useful session, both users can choose to practise together again.

```text
Practice History
      ↓
Repeat with this partner
```

A user must not be automatically reconnected to another user without an appropriate interaction or consent flow.

---

# 9. SPEAKING PRACTICE ROOM

Recommended desktop structure:

```text
┌───────────────────────────────────────────┐
│          PORCHI SPEAKING ROOM             │
├──────────────────────┬────────────────────┤
│                      │                    │
│      Student A       │      Student B     │
│       Camera         │       Camera       │
│                      │                    │
├──────────────────────┴────────────────────┤
│ IELTS Prompt / Cue Card / Timer            │
│                                            │
│ Part 1 / Part 2 / Part 3                  │
├────────────────────────────────────────────┤
│ Mic | Camera | Chat | Timer | Leave |      │
│ Report | Next Prompt | Feedback            │
└────────────────────────────────────────────┘
```

---

# 10. CORE SPEAKING CONTROLS

Room controls:

- microphone on/off
- camera on/off
- volume
- text chat
- timer
- prompt display
- next prompt
- leave room
- report participant
- block participant

Future controls:

- hand raise
- automatic turn switching
- preparation timer
- speaking timer
- random prompt
- Part selector
- session recording, only with appropriate consent

---

# 11. STRUCTURED IELTS SPEAKING MODE

A key product rule:

> **Do not simply put two people on a video call. Give them a practice structure.**

Example 18-minute session:

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

The exact timing should be configuration-driven.

---

# 12. SPEAKING PROMPT SYSTEM

Prompts should come from the Porchi Speaking content system.

Each prompt can store:

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

This keeps Speaking Partner connected to the same content architecture as the rest of Porchi.

---

# 13. PARTNER FEEDBACK

After a session, each learner can provide lightweight peer feedback.

```text
Fluency
Vocabulary
Grammar
Pronunciation
Ideas
Confidence
```

Use descriptive feedback rather than pretending it is an official IELTS assessment.

Correct label:

> **Partner Feedback**

Not:

> **Official IELTS Score**

Not:

> **IELTS Examiner Result**

---

# 14. SPEAKING SESSION SUMMARY

Example:

```text
Speaking Practice Complete

Duration: 18 min

Practised:
✓ Part 1
✓ Part 2
✓ Part 3

Partner Feedback
Fluency       Good
Vocabulary    More practice needed
Pronunciation Good
Grammar       More practice needed

[Practice Again]
[Save Notes]
[Find Another Partner]
```

The result is a learning record, not an official score.

---

# 15. SPEAKING PARTNER HISTORY

Each session should produce a history entry:

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

This history can feed the user's Progress dashboard.

---

# 16. SPEAKING PARTNER SAFETY

Human-to-human interaction requires first-class safety controls.

Minimum controls:

```text
Mute
Block
Report
Leave Room
End Session
```

Operational systems:

```text
Community Guidelines
Abuse Reporting
Spam Detection
Repeat-Offender Controls
Moderation Queue
```

The safety model should be education-specific and should not expose unnecessary personal information.

---

# 17. RECORDING AND PRIVACY

Recording must be opt-in rather than silently enabled.

Before recording:

```text
Recording is OFF
        ↓
All required participants consent
        ↓
Recording begins
```

The product should make clear:

- who can access the recording
- how long it is stored
- whether it can be downloaded
- how it can be deleted
- whether it appears in the user's history

Audio/video data requires explicit privacy and retention controls.

---

# 18. EXCLUSIVE FEATURE 02 — STUDY ROOMS

## 18.1 Core idea

A Study Room is a private collaborative learning environment where several learners can study the same Porchi content together.

Example:

```text
Bangladesh ─┐
UK ─────────┼──→ Porchi Study Room
Australia ──┘
```

They can:

- see shared Porchi content
- talk by audio/video
- highlight text
- add notes
- point at content
- use a whiteboard
- use a timer
- chat
- work through questions
- discuss answers
- preserve a session history

---

# 19. THE MOST IMPORTANT STUDY ROOM PRINCIPLE

## Shared Learning Surface

The experience should not depend on ordinary screen sharing as the default.

Instead, Porchi should synchronize its own learning environment.

```text
Porchi Page
    ↓
Shared Page State
    ↓
Every participant sees the same learning surface
```

Example:

Student A opens:

```text
Reading → Passage 2 → Question 14
```

The room can synchronize that same route/question for everyone.

This makes the product more interactive than a generic video-call application.

---

# 20. SHARED PAGE INTERACTIONS

All participants can, subject to room permissions:

- highlight
- underline
- select text
- add notes
- draw
- point
- navigate
- answer practice questions
- view shared prompts

---

# 21. PERSONAL VS SHARED ANNOTATIONS

This distinction is required.

## Personal

Only the owner can see:

```text
My Highlight
My Note
My Bookmark
My Mistake
```

## Shared

Everyone in the room can see:

```text
Shared Highlight
Shared Note
Shared Drawing
Shared Pointer
```

Users must always know whether they are writing privately or to the room.

---

# 22. SHARED CURSOR / POINTER

Each participant can have a live pointer.

Example:

```text
● Student A
● Student B
● Student C
```

A learner can point to a sentence and say:

> “This sentence is the evidence.”

Everyone sees the same pointer location.

---

# 23. WHITEBOARD

Every Study Room should have a collaborative whiteboard.

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

Optional future tools:

- sticky notes
- image insert
- templates
- voting
- timer-linked activities

---

# 24. WHITEBOARD USE CASES

## Reading

```text
Main Idea
Evidence
Keyword
Paraphrase
```

## Writing

```text
Introduction
      ↓
Body 1
      ↓
Body 2
      ↓
Conclusion
```

## Speaking

```text
Person
Place
Reason
Example
```

## Vocabulary

```text
Word
Meaning
Collocation
Example
Synonym
```

---

# 25. AUDIO + VIDEO

Study Rooms support:

```text
Group Audio
Group Video
```

Initial room-size guidance should stay intentionally small enough for meaningful study conversations. Exact limits can be adjusted after testing.

---

# 26. GROUP CHAT

Room chat should support:

- text messages
- reactions
- relevant links
- short study notes

It should remain **study-context chat**, not an unrestricted social inbox.

---

# 27. STUDY ROOM CONTENT MODES

Three complementary modes are recommended.

## Mode 1 — Shared Page

Everyone follows the same synchronized Porchi page.

## Mode 2 — Presenter Mode

One participant controls the shared route/page.

```text
Presenter: Student A
```

## Mode 3 — Free Explore

Participants can browse independently while staying in the same audio/video/chat/whiteboard room.

---

# 28. SYNCHRONIZED STATE

Possible synchronized state:

```text
Shared Route
Shared Question
Shared Selection
Shared Highlight
Shared Annotation
Shared Scroll / Focus Position
Shared Timer
Presenter State
```

The exact synchronized state should be kept minimal enough to remain reliable.

---

# 29. HOST CONTROLS

Study Room host controls:

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

Permissions should be explicit rather than implicit.

---

# 30. STUDY TIMER

Study Rooms can provide structured focus sessions.

Example:

```text
25 min Focus
5 min Discussion
10 min Practice
5 min Review
```

This creates a purposeful study session instead of an unstructured call.

---

# 31. STUDY ROOM TEMPLATES

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

# 32. ROOM TYPES

## Private Room

Only invited learners can join.

## Friends Room

Existing trusted connections can be invited.

## Small Study Group

Learners collaborate around one shared goal.

## Public Practice Room — Future

A moderated open room model can be considered later.

Public rooms should not be required for the initial collaboration launch.

---

# 33. INVITATIONS

Room invitations can use:

```text
Invite Link
Invite Code
Direct Friend Invite
```

Example:

```text
porchi.example/room/ABC123
```

The invitation layer should validate authentication and room permissions before admitting a participant.

---

# 34. STUDY ROOM MEMORY

A completed Study Room session should preserve a useful history.

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

Historical access must respect each participant's privacy and permission settings.

---

# 35. GROUP ACTIVITY + PERSONAL PROGRESS

A core data rule:

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

Each learner's mistakes, accuracy and progress are private to that learner unless they explicitly share them.

---

# 36. GROUP STUDY + MISTAKE BOOK

When a learner gets a question wrong:

```text
Save to My Mistake Book
```

Only their account receives the personal error record.

Optionally:

```text
Share this question with room
```

Then the question can become a group discussion topic.

---

# 37. AI INSIDE COLLABORATION — FUTURE LAYER

The collaboration architecture should reserve space for an optional AI room assistant.

Examples:

> Explain why B is correct.

> Give us another question like this.

> Give this group a Speaking Part 2 topic.

> Summarise today's study session.

The AI should remain clearly identified as Porchi AI feedback/assistance and should not be represented as an official IELTS examiner or official IELTS scoring service.

---

# 38. SPEAKING PARTNER ↔ STUDY ROOMS CONNECTION

These features should connect to one another.

### Flow A

```text
Study Room
    ↓
Need Speaking Practice
    ↓
Create Speaking Session
    ↓
Practise
    ↓
Feedback
```

### Flow B

```text
Speaking Partner
    ↓
Good Repeat Partner
    ↓
Create Study Room
    ↓
Continue Other Skills Together
```

This increases usefulness without creating a separate social network.

---

# 39. DASHBOARD INTEGRATION

Student dashboard should contain a Collaborate block:

```text
COLLABORATE

[Find Speaking Partner]
[Join Study Room]
[Create Study Room]

Upcoming Sessions
Recent Sessions
Repeat Partner
```

Collaboration must remain visible from the dashboard because it is part of the learning journey.

---

# 40. NOTIFICATION INTEGRATION

Use the existing future notification layer for:

```text
Partner Request
Partner Session Reminder
Study Room Invitation
Study Room Starting Soon
Room Session Summary
Repeat Partner Invitation
```

Do not use notifications as spam.

---

# 41. SHARED CONTENT ARCHITECTURE

Study Rooms need access to Porchi content without duplicating it.

The room should reference existing entities:

```text
Course
Lesson
Question
QuestionSet
Passage
Audio
Video
WritingTask
SpeakingTask
Quiz
Resource
```

The room stores a reference to the content, not a second copy of the content itself.

---

# 42. REAL-TIME ARCHITECTURE

Traditional page requests alone are not enough for these features.

The platform needs a real-time layer for:

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

Separate media infrastructure is required for:

```text
Audio
Video
```

Recommended conceptual architecture:

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

The exact vendors can be selected later; the product architecture should remain provider-agnostic.

---

# 43. WHY SHARED PAGE STATE IS BETTER THAN DEFAULT SCREEN SHARING

The default Study Room experience should not simply broadcast one user's entire computer screen.

Instead:

```text
Shared Porchi Page
+
Shared State
+
Shared Interaction
```

Advantages:

- lower unnecessary bandwidth
- more reliable interaction
- better mobile compatibility
- direct use of Porchi learning tools
- precise shared-question state
- persistent collaboration data
- stronger control over permissions

Traditional screen sharing may remain an optional future tool when it has a clear educational use case.

---

# 44. RESPONSIVE / MOBILE BEHAVIOUR

## Desktop

Recommended composition:

```text
Participants
       │
Shared IELTS Workspace
       │
Chat / Whiteboard / Controls
```

## Mobile

Use progressive panels/tabs rather than displaying every tool at once.

Example:

```text
Video
↓
Shared Content
↓
Chat / Whiteboard
```

The user should always know which tool is active.

---

# 45. COLLABORATION DATA MODEL

Add these entities to the Master schema:

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

These entities must connect to the existing User, Content, Progress and Notification systems.

---

# 46. PERMISSION MODEL

Permissions should exist at room and action level.

Example:

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

Do not grant every permission to every role by default.

---

# 47. MODERATION MODEL

Minimum moderation data:

```text
report_id
reporter_id
reported_user_id
room_id
session_id
event_type
description
created_at
status
resolution
moderator_id
```

Safety and moderation should be built into the collaboration system rather than added after launch.

---

# 48. RECORDING / CONTENT PRIVACY

The platform must distinguish:

- personal notes
- shared room notes
- recordings
- AI interactions
- private learner progress
- public community content

No recording or learner artifact should automatically become public content.

---

# 49. BRAND EXPERIENCE

The two features must use Porchi's existing language system.

### Master brand

**Porchi — স্বপ্ন পূরণের জন্য পড়ছি।**

### Collaboration message

**একা নয়, একসাথে এগিয়ে যাই।**

### Speaking Partner CTA

**Speaking Partner খুঁজি**

### Study Room CTA

**Study Room তৈরি করি**

### Re-entry copy

**আজ একসাথে একটু এগিয়ে যাই।**

The tone should remain warm, clear, modern, capable and encouraging.

---

# 50. HOMEPAGE PLACEMENT

The collaboration layer deserves a visible homepage product-proof block.

Recommended section:

```text
STUDY ALONE OR TOGETHER

Need speaking practice?
→ Find a Speaking Partner

Studying with friends?
→ Create a Study Room

[Watch how it works]
```

The block should show the real product experience rather than only icon cards.

---

# 51. EXCLUSIVE POSITIONING

Porchi should not market this as:

> “We also have video calls.”

The value is the combination:

```text
Human Partner
+
IELTS Structure
+
Shared Learning Content
+
Live Collaboration
+
Whiteboard
+
Shared Annotations
+
Personal Progress
```

That is the exclusive product proposition.

---

# 52. FINAL COLLABORATION LEARNING LOOP

Original Porchi learning loop:

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

With collaboration:

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

Three complementary learning modes now coexist:

```text
Individual Learning
+
Human Collaboration
+
AI Assistance
```

---

# 53. RELEASE ROADMAP

## Phase A — Architecture Reserve

Before building the live collaboration UI:

- define room/session entities
- define permissions
- define presence model
- define shared-content state model
- define moderation model
- define notification events
- define recording/privacy model

## Phase B — Speaking Partner MVP

Build:

- learner availability
- partner preferences
- basic matching
- one-to-one audio/video room
- IELTS Speaking prompts
- timer
- feedback
- session history
- report/block

## Phase C — Study Room MVP

Build:

- private rooms
- invitation link/code
- group audio/video
- shared Porchi page
- shared highlight
- shared notes
- whiteboard
- chat
- shared timer
- basic host controls
- session history

## Phase D — Deep Integration

Add:

- dashboard integration
- personal progress tracking
- Mistake Book integration
- study templates
- repeat partner
- scheduled sessions
- richer permissions
- notifications

## Phase E — Advanced Collaboration

Potential additions:

- AI study assistant
- teacher-led rooms
- public moderated rooms
- session summaries
- collaborative quizzes
- collaborative speaking drills
- advanced analytics

---

# 54. WHAT SHOULD NOT BE ADDED

These features should remain out of scope unless they directly strengthen learning:

- general-purpose social feed
- unrelated entertainment chat
- dating/social matching
- uncontrolled public video rooms
- automatic public recordings
- arbitrary external content broadcasting as the core experience
- gamification that publicly ranks struggling learners

Porchi collaboration exists to help learners study, not to become another social network.

---

# 55. SUCCESS METRICS

## Speaking Partner

Track:

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

Track:

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

## Learning outcomes

Measure collaboration alongside learning metrics:

```text
Practice Completion
Accuracy
Question-Type Improvement
Speaking Practice Frequency
Mock Participation
Progress by Skill
```

Avoid treating room usage alone as learning success.

---

# 56. FINAL EXCLUSIVE PRODUCT ARCHITECTURE

```text
PORCHI COLLABORATE
│
├── SPEAKING PARTNER
│   ├── Preferences
│   ├── Matching
│   ├── Instant Match
│   ├── Scheduled Session
│   ├── Repeat Partner
│   ├── Speaking Room
│   ├── IELTS Prompts
│   ├── Timer
│   ├── Partner Feedback
│   ├── Session History
│   └── Safety
│
└── STUDY ROOMS
    ├── Create Room
    ├── Invite Friends
    ├── Private Room
    ├── Shared Porchi Page
    ├── Shared Navigation
    ├── Shared Highlight
    ├── Shared Notes
    ├── Shared Cursor
    ├── Audio
    ├── Video
    ├── Chat
    ├── Whiteboard
    ├── Timer
    ├── Host Controls
    ├── Session History
    └── Personal Progress Integration
```

---

# 57. FINAL PRODUCT PRINCIPLE

> **Porchi gives learners a place to learn, a place to practise, and now a place to practise together.**

The collaboration layer should always answer one question:

> **Does this make the learner's preparation more useful, more structured, or more human?**

If yes, it belongs in Collaborate.

If not, it belongs outside the product.
