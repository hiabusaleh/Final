const { test, before, after } = require("node:test");
const assert = require("node:assert");
const os = require("os"), path = require("path"), fs = require("fs");
process.env.PORCHI_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "porchi-")), "db.json");
const server = require("../server"), db = require("../db"), auth = require("../auth");
const { youtubeId } = require("../routes/content");
let base, editor, student;
const call = async (method, p, body, cookie) => {
  const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) });
  return { status: r.status, json: await r.json(), cookie: (r.headers.get("set-cookie") || "").split(";")[0] };
};
before(async () => {
  await new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }));
  db.insert("users", { email: "ed@x.com", name: "Ed", passwordHash: auth.hash("password1"), role: "content_editor" });
  editor = (await call("POST", "/api/auth/login", { email: "ed@x.com", password: "password1" })).cookie;
  student = (await call("POST", "/api/auth/register", { name: "S", email: "s@x.com", password: "password1" })).cookie;
});
after(() => server.close());

test("youtube id extraction", () => {
  assert.equal(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1"), "dQw4w9WgXcQ");
  assert.equal(youtubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(youtubeId("https://example.com"), null);
});

test("only published, due posts are public; students cannot create", async () => {
  assert.equal((await call("POST", "/api/admin/posts", { title: "Hi", category: "Announcement", body: "x" }, student)).status, 403);
  await call("POST", "/api/admin/posts", { title: "Live", category: "IELTS Tip", body: "b", status: "published" }, editor);
  await call("POST", "/api/admin/posts", { title: "Draft", category: "IELTS Tip", body: "b", status: "draft" }, editor);
  await call("POST", "/api/admin/posts", { title: "Later", category: "IELTS Tip", body: "b", status: "published", publishAt: "2099-01-01T00:00" }, editor);
  const titles = (await call("GET", "/api/posts")).json.posts.map(p => p.title);
  assert.deepEqual(titles, ["Live"]);
});

test("invalid video URL rejected, valid one stored with id", async () => {
  assert.equal((await call("POST", "/api/admin/videos", { title: "V", youtube: "https://vimeo.com/1" }, editor)).status, 400);
  const r = await call("POST", "/api/admin/videos", { title: "Video", youtube: "https://youtu.be/dQw4w9WgXcQ" }, editor);
  assert.equal(r.json.item.ytId, "dQw4w9WgXcQ");
  assert.ok(db.all("audit").some(a => a.action === "create" && a.object.startsWith("videos:")));
});
