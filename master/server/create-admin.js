/* Create or promote a super admin:  node server/create-admin.js you@example.com "Your Name" password123 */
const db = require("./db"), auth = require("./auth");
const [email, name, password] = process.argv.slice(2);
if (!email || !password || password.length < 8) { console.log('Usage: node server/create-admin.js EMAIL "NAME" PASSWORD(8+ chars)'); process.exit(1); }
const e = email.toLowerCase(), u = db.find("users", x => x.email === e);
if (u) db.update("users", u.id, { role: "super_admin", passwordHash: auth.hash(password) });
else db.insert("users", { email: e, name: name || "Admin", passwordHash: auth.hash(password), role: "super_admin", profile: {} });
console.log(`Super admin ready: ${e}`);
