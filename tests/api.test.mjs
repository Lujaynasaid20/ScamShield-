// End-to-end API tests. Needs the app running (npm run dev) and the database migrated.
// Creates throwaway accounts (zz-test-*@example.test) and deletes them afterwards.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import dotenv from "dotenv";
import pg from "pg";
import { totpCode } from "../lib/totp.js";

dotenv.config({ path: ".env.local", quiet: true });
const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";
const RUN = Date.now().toString(36);
const db = new pg.Client({
  ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {}),
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "scamshield",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD
});

class Client {
  constructor() { this.cookie = ""; }
  async request(method, path, body, headers = {}) {
    const init = { method, headers: { ...headers }, redirect: "manual" };
    if (this.cookie) init.headers.cookie = this.cookie;
    if (body instanceof FormData) init.body = body;
    else if (body !== undefined) { init.body = JSON.stringify(body); init.headers["content-type"] = "application/json"; }
    const response = await fetch(`${BASE}${path}`, init);
    const setCookie = response.headers.getSetCookie?.() || [];
    for (const value of setCookie) {
      const [pair] = value.split(";");
      this.cookie = pair.endsWith("=") ? "" : pair;
    }
    const type = response.headers.get("content-type") || "";
    const data = type.includes("application/json") ? await response.json() : await response.text();
    return { status: response.status, data, headers: response.headers };
  }
  get(path) { return this.request("GET", path); }
  post(path, body, headers) { return this.request("POST", path, body, headers); }
  patch(path, body) { return this.request("PATCH", path, body); }
  put(path, body) { return this.request("PUT", path, body); }
  delete(path, body) { return this.request("DELETE", path, body); }
}

const email = name => `zz-test-${name}-${RUN}@example.test`;
const PASSWORD = "correct-horse-battery";
const alice = new Client(), bob = new Client(), admin = new Client(), anonymous = new Client();
let aliceProfile, bobProfile;

async function register(client, name) {
  const response = await client.post("/api/auth/register", { email: email(name), display_name: `Test ${name}`, password: PASSWORD });
  assert.equal(response.status, 201, JSON.stringify(response.data));
  return response.data.profile;
}

before(async () => {
  const health = await fetch(`${BASE}/api/health`).catch(() => null);
  if (!health?.ok) throw new Error(`The app is not running at ${BASE}. Start it with npm run dev.`);
  await db.connect();
  aliceProfile = await register(alice, "alice");
  bobProfile = await register(bob, "bob");
  await register(admin, "admin");
  await db.query("update profiles set role = 'admin' where email = $1", [email("admin")]);
  const login = await admin.post("/api/auth/login", { email: email("admin"), password: PASSWORD, admin: true });
  assert.equal(login.status, 200);
});

after(async () => {
  await db.query("delete from verified_senders where business_name like $1", [`%${RUN}`]);
  await db.query("delete from profiles where email like $1", [`zz-test-%-${RUN}@example.test`]);
  await db.end();
});

describe("authentication", () => {
  test("rejects bad credentials and duplicate registration", async () => {
    assert.equal((await anonymous.post("/api/auth/login", { email: email("alice"), password: "wrong-password" })).status, 401);
    assert.equal((await anonymous.post("/api/auth/register", { email: email("alice"), display_name: "Dup", password: PASSWORD })).status, 409);
    assert.equal((await anonymous.post("/api/auth/register", { email: "bad", display_name: "X", password: "short" })).status, 400);
  });

  test("keeps user and admin logins separate", async () => {
    assert.equal((await anonymous.post("/api/auth/login", { email: email("alice"), password: PASSWORD, admin: true })).status, 403);
    assert.equal((await anonymous.post("/api/auth/login", { email: email("admin"), password: PASSWORD })).status, 403);
  });

  test("session endpoint requires a session", async () => {
    assert.equal((await anonymous.get("/api/auth/session")).status, 401);
    const session = await alice.get("/api/auth/session");
    assert.equal(session.status, 200);
    assert.equal(session.data.profile.email, email("alice"));
  });

  test("blocks cross-site state-changing requests", async () => {
    const response = await alice.post("/api/analyze", { message: "hello" }, { origin: "https://evil.example" });
    assert.equal(response.status, 403);
  });
});

describe("authorization", () => {
  test("anonymous users get 401 on protected endpoints", async () => {
    for (const path of ["/api/overview", "/api/history", "/api/reports", "/api/notifications", "/api/academy", "/api/settings/sessions"]) {
      assert.equal((await anonymous.get(path)).status, 401, path);
    }
  });

  test("normal users cannot use admin endpoints", async () => {
    for (const path of ["/api/admin/overview", "/api/admin/reports", "/api/admin/cases", "/api/admin/users", "/api/admin/alerts"]) {
      assert.equal((await alice.get(path)).status, 403, path);
    }
    assert.equal((await alice.post("/api/admin/promote", { email: email("alice") })).status, 403);
    assert.equal((await alice.post("/api/admin/alerts", { title: "x", body: "y", report_id: 1 })).status, 403);
  });

  test("admins cannot use the user-only tools", async () => {
    assert.equal((await admin.post("/api/analyze", { message: "hi there" })).status, 403);
  });
});

describe("message analysis and history", () => {
  let scamId;
  test("analyzes, explains and saves a message", async () => {
    const response = await alice.post("/api/analyze", { message: "URGENT: your account will be suspended. Send your PIN and pay the processing fee at http://paypal.com.verify-now.xyz/login" });
    assert.equal(response.status, 201);
    const { item, result, recommendations } = response.data;
    assert.equal(item.verdict, "scam");
    assert.ok(result.explanation.length > 20);
    assert.ok(result.highlights.length > 0);
    assert.ok(recommendations.steps.some(step => step.id === "noCodes"));
    scamId = item.id;
  });

  test("validates input and avoids duplicate saves", async () => {
    assert.equal((await alice.post("/api/analyze", { message: "   " })).status, 400);
    assert.equal((await alice.post("/api/analyze", { message: "x".repeat(5001) })).status, 400);
    const message = `Your parcel ${RUN} arrives tomorrow.`;
    const first = await alice.post("/api/analyze", { message });
    const second = await alice.post("/api/analyze", { message });
    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    assert.equal(first.data.item.id, second.data.item.id);
    assert.equal(first.data.item.verdict, "safe");
  });

  test("filters, searches and paginates history", async () => {
    const scams = await alice.get("/api/history?verdict=scam");
    assert.ok(scams.data.items.every(item => item.verdict === "scam"));
    const search = await alice.get(`/api/history?q=${RUN}`);
    assert.equal(search.data.total, 1);
    const paged = await alice.get("/api/history?pageSize=1&page=2&sort=oldest");
    assert.equal(paged.data.pageSize, 1);
    assert.equal(paged.data.items.length, 1);
  });

  test("history detail is private to its owner", async () => {
    const own = await alice.get(`/api/history/${scamId}`);
    assert.equal(own.status, 200);
    assert.ok(own.data.item.details.recommendations);
    assert.equal((await bob.get(`/api/history/${scamId}`)).status, 404);
    assert.equal((await bob.delete(`/api/history/${scamId}`)).status, 404);
    assert.equal((await bob.get("/api/history")).data.total, 0);
  });
});

describe("URL scanner", () => {
  test("rejects invalid URLs", async () => {
    assert.equal((await alice.post("/api/scan-url", { url: "javascript:alert(1)" })).status, 400);
    assert.equal((await alice.post("/api/scan-url", { url: "not a url" })).status, 400);
  });

  test("scores a phishing URL and separates heuristics from threat intelligence", async () => {
    const response = await alice.post("/api/scan-url", { url: "http://paypal.com.account-verify.xyz/login" });
    assert.equal(response.status, 201);
    const { item } = response.data;
    assert.equal(item.kind, "url");
    assert.equal(item.level, "high");
    assert.ok(item.details.indicators.length > 0);
    assert.ok(["not_configured", "no_match", "match", "error"].includes(item.details.reputation.status));
  });

  test("a clean result is never called safe outright", async () => {
    const response = await alice.post("/api/scan-url", { url: "https://www.safaricom.co.ke/" });
    assert.equal(response.data.item.level, "low");
    assert.match(response.data.item.details.explanation, /does not prove/);
  });

  test("history filters by type", async () => {
    const urls = await alice.get("/api/history?kind=url");
    assert.equal(urls.data.total, 2);
    assert.ok(urls.data.items.every(item => item.kind === "url"));
  });
});

describe("reports, evidence, status tracking and sender checks", () => {
  let reportId, evidenceId;
  const phone = `+25471${String(Date.now()).slice(-7)}`;

  test("validates report input", async () => {
    assert.equal((await alice.post("/api/reports", { category: "Not a category", details: "x" })).status, 400);
    assert.equal((await alice.post("/api/reports", { category: "Other", details: "" })).status, 400);
    assert.equal((await alice.post("/api/reports", { category: "Other", details: "x", url: "javascript:alert(1)" })).status, 400);
  });

  test("rejects disallowed evidence files", async () => {
    const form = new FormData();
    form.set("category", "Other");
    form.set("details", `Bad file ${RUN}`);
    form.append("evidence", new Blob([Buffer.from([0x4d, 0x5a, 0x90, 0x00])], { type: "image/png" }), "fake.png");
    const response = await alice.post("/api/reports", form);
    assert.equal(response.status, 400);
  });

  test("submits a report with evidence and blocks duplicates", async () => {
    const form = new FormData();
    form.set("category", "Bank or mobile-money fraud");
    form.set("details", `Caller asked for my PIN ${RUN}`);
    form.set("message_text", "Send your PIN to unlock your account");
    form.set("sender_type", "phone");
    form.set("sender_value", phone);
    form.set("claimed_identity", "  John   from KCB Bank ");
    form.append("evidence", new Blob(["Call log: 10:02 unknown caller"], { type: "text/plain" }), "notes.txt");
    const response = await alice.post("/api/reports", form);
    assert.equal(response.status, 201, JSON.stringify(response.data));
    assert.equal(response.data.item.status, "submitted");
    assert.equal(response.data.item.evidence_count, 1);
    assert.equal(response.data.item.claimed_identity, "John from KCB Bank");
    reportId = response.data.item.id;
    const duplicate = await alice.post("/api/reports", { category: "Bank or mobile-money fraud", details: `Caller asked for my PIN ${RUN}` });
    assert.equal(duplicate.status, 409);
  });

  test("reports are private to the reporter and admins", async () => {
    const own = await alice.get(`/api/reports/${reportId}`);
    assert.equal(own.status, 200);
    assert.equal(own.data.item.timeline[0].kind, "created");
    evidenceId = own.data.item.evidence[0].id;
    assert.equal((await bob.get(`/api/reports/${reportId}`)).status, 404);
    assert.equal((await bob.get(`/api/reports/${reportId}/evidence/${evidenceId}`)).status, 404);
    assert.equal((await bob.post(`/api/reports/${reportId}/updates`, { note: "hijack" })).status, 404);
    assert.equal((await bob.get("/api/reports")).data.total, 0);
    const download = await alice.get(`/api/reports/${reportId}/evidence/${evidenceId}`);
    assert.equal(download.status, 200);
    assert.match(download.headers.get("content-disposition"), /attachment/);
    assert.equal(download.headers.get("x-content-type-options"), "nosniff");
    assert.equal((await admin.get(`/api/reports/${reportId}/evidence/${evidenceId}`)).status, 200);
  });

  test("reporter can add information while open", async () => {
    const response = await alice.post(`/api/reports/${reportId}/updates`, { note: "They called again from the same number." });
    assert.equal(response.status, 201);
    assert.ok(response.data.item.timeline.some(entry => entry.kind === "user_note"));
  });

  test("sender check shows unverified community reports without private details", async () => {
    const response = await bob.post("/api/check-sender", { value: phone.replace("+254", "0") });
    assert.equal(response.status, 200);
    const { result } = response.data;
    assert.equal(result.type, "phone");
    assert.equal(result.counts.total, 1);
    assert.equal(result.counts.unverified, 1);
    assert.equal(result.recommendations.severity, "medium");
    assert.deepEqual(result.claimedNames, [{ name: "John from KCB Bank", reports: 1, verified: false }]);
    assert.equal(result.riskLevel, "medium");
    assert.deepEqual(result.categories, [{ category: "Bank or mobile-money fraud", reports: 1 }]);
    assert.ok(result.statuses.some(status => status.id === "reported_unverified"));
    assert.equal(result.identity.status, "unavailable");
    assert.equal(result.identity.name, null);
    // Without a country code the country is unknown, but reports still match on the last 9 digits.
    assert.equal(result.phone.status, "no_country_code");
    const international = (await bob.post("/api/check-sender", { value: phone, save: false })).data.result;
    assert.equal(international.phone.country, "KE");
    assert.equal(international.counts.total, 1);
    // The same last 9 digits in another country is a different number.
    const otherCountry = (await bob.post("/api/check-sender", { value: phone.replace("+254", "+255"), save: false })).data.result;
    assert.equal(otherCountry.counts.total, 0);
    assert.equal(JSON.stringify(result).includes("Caller asked for my PIN"), false, "report description must not leak");
    assert.equal(JSON.stringify(result).includes("unlock your account"), false, "reported message must not leak");
    assert.equal(JSON.stringify(result).includes(email("alice")), false, "reporter must not leak");
    assert.equal((await bob.post("/api/check-sender", { value: "", type: "email" })).status, 400);
  });

  test("only admins change status; the reporter is notified and sees feedback", async () => {
    assert.equal((await alice.patch(`/api/admin/reports/${reportId}`, { status: "verified" })).status, 403);
    assert.equal((await admin.patch(`/api/admin/reports/${reportId}`, { status: "bogus" })).status, 400);
    const update = await admin.patch(`/api/admin/reports/${reportId}`, { status: "verified", feedback: "Confirmed: this number is used in a PIN scam." });
    assert.equal(update.status, 200);
    const report = await alice.get(`/api/reports/${reportId}`);
    assert.equal(report.data.item.status, "verified");
    assert.equal(report.data.item.admin_feedback, "Confirmed: this number is used in a PIN scam.");
    assert.equal(report.data.item.can_add_info, false);
    assert.equal((await alice.post(`/api/reports/${reportId}/updates`, { note: "late" })).status, 409);
    const notifications = await alice.get("/api/notifications");
    assert.ok(notifications.data.items.some(item => item.type === "report_status" && item.link === `/reports/${reportId}`));
    const sender = await bob.post("/api/check-sender", { value: phone, save: false });
    assert.equal(sender.data.result.counts.verified, 1);
    assert.equal(sender.data.item, null);
  });

  test("unknown senders are Unknown risk, not scams; verified directory entries show the business", async () => {
    const official = `+25575${String(Date.now()).slice(-7)}`;
    const before = await bob.post("/api/check-sender", { value: official });
    assert.equal(before.status, 200);
    assert.equal(before.data.result.riskLevel, "unknown");
    assert.deepEqual(before.data.result.statuses.map(status => status.id), ["no_reports", "identity_unavailable"]);
    assert.equal(before.data.result.phone.countryName, "Tanzania");
    assert.equal(before.data.item.details.riskLevel, "unknown");

    const entry = { type: "phone", value: official, business_name: `Example Bank ${RUN}`, source: "Contact page on the bank's official website" };
    assert.equal((await bob.post("/api/admin/verified-senders", entry)).status, 403);
    assert.equal((await admin.post("/api/admin/verified-senders", { ...entry, value: official.replace("+255", "0") })).status, 400, "country code required");
    assert.equal((await admin.post("/api/admin/verified-senders", { ...entry, source: "" })).status, 400, "source required");
    const added = await admin.post("/api/admin/verified-senders", entry);
    assert.equal(added.status, 201, JSON.stringify(added.data));
    assert.equal((await admin.post("/api/admin/verified-senders", entry)).status, 409);

    const after = (await bob.post("/api/check-sender", { value: official, save: false })).data.result;
    assert.equal(after.identity.status, "verified");
    assert.equal(after.identity.name, entry.business_name);
    assert.equal(after.riskLevel, "low");
    assert.equal(after.statuses[0].id, "verified_business");
    assert.ok(after.recommendations.steps.some(step => step.id === "spoofed"));
    // A local number can't prove which country it belongs to, so it isn't shown as verified.
    assert.equal((await bob.post("/api/check-sender", { value: official.replace("+255", "0"), save: false })).data.result.identity.status, "unavailable");

    assert.equal((await admin.delete(`/api/admin/verified-senders/${added.data.item.id}`)).status, 204);
    assert.equal((await bob.post("/api/check-sender", { value: official, save: false })).data.result.identity.status, "unavailable");
  });

  test("admins publish alerts only from verified reports", async () => {
    assert.equal((await admin.post("/api/admin/alerts", { title: "PIN scam calls", body: "Callers ask for PINs.", report_id: 999999999 })).status, 404);
    const response = await admin.post("/api/admin/alerts", { title: `PIN scam calls ${RUN}`, body: "Callers pretending to be customer care ask for your PIN.", report_id: reportId });
    assert.equal(response.status, 201);
    assert.ok(response.data.recipients >= 2);
    const bobNotifications = await bob.get("/api/notifications");
    assert.ok(bobNotifications.data.items.some(item => item.type === "threat_alert" && item.title.includes(RUN)));
  });

  test("admin lists include reports, cases and users", async () => {
    assert.ok((await admin.get(`/api/admin/reports?q=${RUN}`)).data.total >= 1);
    assert.ok((await admin.get("/api/admin/cases?kind=url")).data.total >= 2);
    assert.ok((await admin.get(`/api/admin/users?q=${RUN}`)).data.total === 3);
    const overview = await admin.get("/api/admin/overview");
    assert.equal(overview.status, 200);
    assert.equal(overview.data.daily.length, 14);
  });
});

describe("notifications and preferences", () => {
  test("unread counts, mark read and mark all read", async () => {
    const before = await alice.get("/api/notifications?countOnly=1");
    assert.ok(before.data.unread >= 1);
    const list = await alice.get("/api/notifications?filter=unread");
    const first = list.data.items[0];
    const marked = await alice.patch("/api/notifications", { ids: [first.id] });
    assert.equal(marked.data.unread, before.data.unread - 1);
    assert.equal((await alice.patch("/api/notifications", { all: true })).data.unread, 0);
    assert.equal((await bob.patch("/api/notifications", { ids: [first.id], unread: true })).data.unread >= 0, true);
    const stillRead = await alice.get("/api/notifications?countOnly=1");
    assert.equal(stillRead.data.unread, 0, "another user cannot change my notifications");
  });

  test("preferences control which notifications are created", async () => {
    const off = await alice.put("/api/settings/preferences", { notify_analysis: false });
    assert.equal(off.data.preferences.notify_analysis, false);
    await alice.put("/api/settings/preferences", { notify_analysis: true });
    await alice.post("/api/analyze", { message: `Prize ${RUN}: you have won, pay the fee now` });
    const list = await alice.get("/api/notifications?filter=unread");
    assert.ok(list.data.items.some(item => item.type === "analysis"));
  });
});

describe("academy", () => {
  test("tracks lessons and grades quizzes on the server", async () => {
    const modules = await alice.get("/api/academy");
    assert.equal(modules.data.total, 10);
    assert.equal((await alice.get("/api/academy/not-a-module")).status, 404);
    const module = (await alice.get("/api/academy/phishing")).data.module;
    assert.equal((await alice.post("/api/academy/phishing", { action: "lesson" })).data.progress.lesson_completed, true);
    const fail = await alice.post("/api/academy/phishing", { action: "quiz", answers: [9, 9, 9] });
    assert.equal(fail.data.grade.passed, false);
    const pass = await alice.post("/api/academy/phishing", { action: "quiz", answers: module.quiz.map(question => question.answer) });
    assert.equal(pass.data.grade.passed, true);
    assert.equal(pass.data.progress.attempts, 2);
    assert.equal((await alice.get("/api/academy")).data.completed, 1);
    assert.equal((await bob.get("/api/academy")).data.completed, 0);
  });
});

describe("dashboard", () => {
  test("overview counts only the user's own records", async () => {
    const overview = await alice.get("/api/overview");
    assert.equal(overview.status, 200);
    const { totals, reports, daily, academy } = overview.data;
    assert.equal(totals.urls, 2);
    assert.ok(totals.messages >= 3);
    assert.equal(totals.messages, totals.scam + totals.suspicious + totals.safe);
    assert.equal(reports.total, 1);
    assert.equal(daily.length, 14);
    assert.equal(academy.completed, 1);
    const empty = await bob.get("/api/overview");
    assert.equal(empty.data.totals.messages, 0);
    assert.equal(empty.data.reports.total, 0);
  });
});

describe("account security and privacy", () => {
  test("profile updates validate input and require the password for email changes", async () => {
    assert.equal((await alice.patch("/api/settings/profile", { display_name: "A" })).status, 400);
    assert.equal((await alice.patch("/api/settings/profile", { email: email("alice2") })).status, 400);
    const renamed = await alice.patch("/api/settings/profile", { display_name: "Alice Updated" });
    assert.equal(renamed.data.profile.display_name, "Alice Updated");
    assert.equal((await alice.patch("/api/settings/profile", { email: email("bob"), current_password: PASSWORD })).status, 409);
  });

  test("sessions can be listed and revoked; password change signs out other sessions", async () => {
    const second = new Client();
    assert.equal((await second.post("/api/auth/login", { email: email("alice"), password: PASSWORD })).status, 200);
    const sessions = await alice.get("/api/settings/sessions");
    assert.ok(sessions.data.sessions.length >= 2);
    const other = sessions.data.sessions.find(session => !session.current);
    assert.equal((await bob.delete(`/api/settings/sessions/${other.id}`)).status, 404, "cannot revoke another user's session");
    assert.equal((await alice.delete(`/api/settings/sessions/${other.id}`)).status, 204);
    assert.equal((await second.get("/api/auth/session")).status, 401);

    const third = new Client();
    await third.post("/api/auth/login", { email: email("alice"), password: PASSWORD });
    assert.equal((await alice.post("/api/settings/password", { current_password: "wrong", new_password: "another-password" })).status, 400);
    const changed = await alice.post("/api/settings/password", { current_password: PASSWORD, new_password: "a-brand-new-password" });
    assert.equal(changed.status, 200);
    assert.equal((await third.get("/api/auth/session")).status, 401);
    assert.equal((await alice.get("/api/auth/session")).status, 200);
    const hash = (await db.query("select password_hash from profiles where email = $1", [email("alice")])).rows[0].password_hash;
    assert.match(hash, /^\$2[aby]\$12\$/);
    await alice.post("/api/settings/password", { current_password: "a-brand-new-password", new_password: PASSWORD });
  });

  test("two-factor authentication setup, login and disable", async () => {
    const setup = await bob.post("/api/settings/two-factor", { action: "setup" });
    assert.equal(setup.status, 200);
    assert.match(setup.data.qr_svg, /<svg/);
    const stored = (await db.query("select totp_secret from profiles where email = $1", [email("bob")])).rows[0].totp_secret;
    assert.ok(!stored.includes(setup.data.secret), "secret is encrypted at rest");
    assert.equal((await bob.post("/api/settings/two-factor", { action: "enable", code: "000000" })).status, 400);
    const step = Math.floor(Date.now() / 30000);
    assert.equal((await bob.post("/api/settings/two-factor", { action: "enable", code: totpCode(setup.data.secret, step) })).status, 200);

    const device = new Client();
    const first = await device.post("/api/auth/login", { email: email("bob"), password: PASSWORD });
    assert.equal(first.data.two_factor_required, true);
    assert.equal((await device.get("/api/auth/session")).status, 401);
    assert.equal((await device.post("/api/auth/login", { email: email("bob"), password: PASSWORD, code: "123456" })).status, 401);
    const nextCode = totpCode(setup.data.secret, step + 1);
    assert.equal((await device.post("/api/auth/login", { email: email("bob"), password: PASSWORD, code: nextCode })).status, 200);
    assert.equal((await new Client().post("/api/auth/login", { email: email("bob"), password: PASSWORD, code: nextCode })).status, 401, "codes cannot be reused");

    assert.equal((await bob.post("/api/settings/two-factor", { action: "disable", password: "wrong", code: "000000" })).status, 400);
    await db.query("update profiles set totp_last_step = null where email = $1", [email("bob")]);
    const disable = await bob.post("/api/settings/two-factor", { action: "disable", password: PASSWORD, code: totpCode(setup.data.secret, Math.floor(Date.now() / 30000)) });
    assert.equal(disable.status, 200);
  });

  test("security activity is recorded without sensitive data", async () => {
    const activity = await bob.get("/api/settings/account");
    const events = activity.data.events.map(event => event.event);
    assert.ok(events.includes("two_factor_enabled") && events.includes("two_factor_disabled"));
    const raw = await db.query("select details::text from audit_events where user_id = $1", [bobProfile.id]);
    assert.ok(raw.rows.every(row => !row.details.includes(PASSWORD)));
  });

  test("clearing history and deleting the account remove the user's data", async () => {
    assert.equal((await alice.delete("/api/history")).status, 204);
    assert.equal((await alice.get("/api/history")).data.total, 0);
    assert.equal((await alice.delete("/api/settings/account", { password: PASSWORD, confirm: "nope" })).status, 400);
    assert.equal((await alice.delete("/api/settings/account", { password: "wrong", confirm: "DELETE" })).status, 400);
    assert.equal((await alice.delete("/api/settings/account", { password: PASSWORD, confirm: "DELETE" })).status, 204);
    assert.equal((await alice.get("/api/auth/session")).status, 401);
    const remaining = await db.query("select (select count(*) from scam_reports where user_id = $1) as reports, (select count(*) from notifications where user_id = $1) as notifications", [aliceProfile.id]);
    assert.equal(Number(remaining.rows[0].reports), 0);
    assert.equal(Number(remaining.rows[0].notifications), 0);
  });
});
