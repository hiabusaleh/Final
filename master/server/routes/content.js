/* Posts & Videos CMS (Blueprint §17, §18). Admin-only publishing; public sees published items only. */
const CATEGORIES = ["Announcement", "IELTS Tip", "New Course", "New Mock Test", "Vocabulary", "Grammar", "Test Update", "Study Advice", "Event"];
const STATUSES = ["draft", "published", "archived"];
const SKILLS = ["General", "Listening", "Reading", "Writing", "Speaking", "Skills"];

const youtubeId = url => (String(url || "").match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/) || [])[1] || null;
const safeUrl = (v, fail) => { if (v && !/^(https?:\/\/|[a-z0-9-]+\/)/i.test(v)) fail(400, "Link must be http(s) or a site path"); return v; };

module.exports = ({ route, fail, send, str, requireRole, audit, db }) => {
  const isLive = x => x.status === "published" && (!x.publishAt || x.publishAt <= new Date().toISOString());

  function cleanPost(b) {
    const category = CATEGORIES.includes(b.category) ? b.category : fail(400, "Unknown category");
    const status = STATUSES.includes(b.status) ? b.status : "draft";
    return {
      title: str(b.title, "Title", { min: 2, max: 160 }), category, status,
      excerpt: str(b.excerpt, "Excerpt", { optional: true, max: 300 }),
      body: str(b.body, "Body", { min: 1, max: 20000 }),
      image: safeUrl(str(b.image, "Image", { optional: true, max: 500 }), fail),
      link: safeUrl(str(b.link, "Link", { optional: true, max: 500 }), fail),
      pinned: !!b.pinned,
      publishAt: b.publishAt ? new Date(b.publishAt).toISOString() : ""
    };
  }
  function cleanVideo(b) {
    const youtube = str(b.youtube, "YouTube URL", { max: 300 });
    const ytId = youtubeId(youtube) || fail(400, "Not a valid YouTube URL");
    return {
      title: str(b.title, "Title", { min: 2, max: 160 }), youtube, ytId,
      skill: SKILLS.includes(b.skill) ? b.skill : "General",
      topic: str(b.topic, "Topic", { optional: true, max: 80 }),
      description: str(b.description, "Description", { optional: true, max: 2000 }),
      duration: str(b.duration, "Duration", { optional: true, max: 20 }),
      relatedCourse: safeUrl(str(b.relatedCourse, "Related course", { optional: true, max: 300 }), fail),
      relatedPractice: safeUrl(str(b.relatedPractice, "Related practice", { optional: true, max: 300 }), fail),
      status: STATUSES.includes(b.status) ? b.status : "published"
    };
  }

  for (const [table, clean] of [["posts", cleanPost], ["videos", cleanVideo]]) {
    route("GET", `/api/${table}`, async (req, res) => {
      const rows = db.filter(table, isLive).sort((a, b) => (b.pinned || 0) - (a.pinned || 0) || String(b.publishAt || b.createdAt).localeCompare(a.publishAt || a.createdAt));
      send(res, 200, { [table]: rows });
    });
    route("GET", `/api/admin/${table}`, async (req, res, { user }) => {
      requireRole(user, "content");
      send(res, 200, { [table]: db.all(table).slice().reverse(), meta: { CATEGORIES, STATUSES, SKILLS } });
    });
    route("POST", `/api/admin/${table}`, async (req, res, { user, body }) => {
      requireRole(user, "content");
      const row = db.insert(table, { ...clean(body), authorId: user.id });
      audit(user, "create", `${table}:${row.id}`, req);
      send(res, 201, { item: row });
    });
    route("PUT", `/api/admin/${table}/:id`, async (req, res, { user, body, params }) => {
      requireRole(user, "content");
      const row = db.update(table, params.id, clean(body)) || fail(404, "Not found");
      audit(user, "update", `${table}:${row.id}`, req);
      send(res, 200, { item: row });
    });
    route("DELETE", `/api/admin/${table}/:id`, async (req, res, { user, params }) => {
      requireRole(user, "content");
      db.remove(table, params.id) || fail(404, "Not found");
      audit(user, "delete", `${table}:${params.id}`, req);
      send(res, 200, { ok: true });
    });
  }
};
module.exports.youtubeId = youtubeId;
