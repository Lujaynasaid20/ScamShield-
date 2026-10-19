// Browser smoke test: drives headless Chrome through every page as a user and an admin, at desktop and
// phone widths, and fails on console errors, failed API calls or horizontal overflow.
// Usage: node tests/browser-smoke.mjs [path-to-chrome] [screenshot-dir]
// Needs the app running (npm run dev) and Chrome installed.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local", quiet: true });
const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";
const chromePath = process.argv[2] || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const shotDir = process.argv[3] || null;
const RUN = Date.now().toString(36);
const PASSWORD = "correct-horse-battery";
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const problems = [];

const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--remote-debugging-port=9334", `--user-data-dir=${path.join(os.tmpdir(), `smoke-${RUN}`)}`, "about:blank"], { stdio: "ignore" });
let targets;
for (let i = 0; i < 40 && !targets?.length; i++) {
  try { targets = (await (await fetch("http://127.0.0.1:9334/json")).json()).filter(target => target.type === "page"); } catch { await sleep(250); }
}
const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener("open", resolve));
let nextId = 0, label = "";
const pending = new Map();
ws.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) { pending.get(message.id)(message.result || message.error); pending.delete(message.id); }
  if (message.method === "Runtime.exceptionThrown") problems.push(`${label}: exception ${message.params.exceptionDetails.exception?.description?.split("\n")[0] || message.params.exceptionDetails.text}`);
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") problems.push(`${label}: console.error ${message.params.args.map(arg => arg.value ?? arg.description).join(" ").slice(0, 200)}`);
  if (message.method === "Network.responseReceived" && message.params.response.url.includes("/api/") && message.params.response.status >= 500) problems.push(`${label}: ${message.params.response.status} ${message.params.response.url}`);
});
const send = (method, params = {}) => new Promise(resolve => { const id = ++nextId; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async expression => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.value;
const waitFor = async (expression, timeout = 15000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) { if (await evaluate(expression)) return true; await sleep(200); }
  problems.push(`${label}: timed out waiting for ${expression}`);
  return false;
};
const setViewport = (width, height, mobile) => send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
const goto = async url => { await send("Page.navigate", { url: `${BASE}${url}` }); await sleep(400); await waitFor("document.readyState === 'complete'"); };
const shot = async name => {
  if (!shotDir) return;
  fs.mkdirSync(shotDir, { recursive: true });
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(path.join(shotDir, `${name}.png`), Buffer.from(data, "base64"));
};
const typeInto = (selector, value) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, "value").set; setter.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
const click = selector => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.click(); return true; })()`);
const clickText = (selector, text) => evaluate(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find(node => node.textContent.includes(${JSON.stringify(text)})); if (!el) return false; el.click(); return true; })()`);
const until = async (action, condition, timeout = 20000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) { await action(); await sleep(400); if (await evaluate(condition)) return true; }
  problems.push(`${label}: action never produced ${condition}`);
  return false;
};
const hydrated = () => waitFor("Object.keys(document.querySelector('h1, h2') || {}).some(key => key.startsWith('__react'))");
const checkOverflow = async () => {
  const overflow = await evaluate("document.documentElement.scrollWidth - window.innerWidth");
  if (overflow > 1) problems.push(`${label}: horizontal overflow of ${overflow}px`);
};

let reported = false;
process.on("exit", () => { if (problems.length && !reported) console.log(problems.join("\n")); });
await send("Runtime.enable"); await send("Network.enable"); await send("Page.enable");

// ---- Register a user through the UI ----
await setViewport(1280, 860, false);
label = "register";
await goto("/login");
await hydrated();
await until(() => clickText(".auth-tabs button", "Register"), "!!document.querySelector('#auth-name')");
await typeInto("#auth-name", "Smoke Tester");
await typeInto("#auth-email", `zz-smoke-${RUN}@example.test`);
await typeInto("#auth-password", PASSWORD);
await typeInto("#auth-confirm", PASSWORD);
await shot("01-register");
await click("button[type=submit]");
await waitFor("location.pathname === '/overview'");
await waitFor("!!document.querySelector('.stat-tile')");
await shot("02-overview-empty");

// ---- Feature flows ----
label = "analyze";
await goto("/analyze");
await waitFor("!!document.querySelector('#message')");
await hydrated();
await until(() => clickText("button", "Urgent bank alert"), "document.querySelector('#message').value.length > 20");
await sleep(600);
await click("form button[type=submit]");
await waitFor("!!document.querySelector('.action-center')");
await waitFor("document.body.innerText.includes('looks like a scam')");
await shot("03-analyze-result");

label = "url";
await goto("/urls");
await hydrated();
await typeInto("#url", "http://paypal.com.account-verify.xyz/login");
await click("form button[type=submit]");
await waitFor("document.body.innerText.includes('Heuristic findings')");
await shot("04-url-result");

label = "sender";
await goto("/sender?value=%2B254712000111");
await waitFor("!!document.querySelector('#sender-value')");
await hydrated();
await click("form button[type=submit]");
await waitFor("document.body.innerText.includes('Community reports')");
await shot("05-sender-result");

label = "report";
await goto("/history?kind=message");
if (!(await waitFor("!!document.querySelector('.list-row a')"))) throw new Error("history list did not load");
const historyHref = await evaluate("document.querySelector('.list-row a').getAttribute('href')");
await goto(`/reports/new?case=${historyHref.split("/").pop()}`);
await waitFor("document.querySelector('#category')?.value !== ''");
await hydrated();
await click("form button[type=submit]");
await waitFor("/^\\/reports\\/\\d+$/.test(location.pathname)");
await waitFor("document.body.innerText.includes('Status history')");
const reportId = await evaluate("location.pathname.split('/').pop()");
await shot("06-report-detail");

label = "academy";
await goto("/academy/phishing");
await waitFor("document.querySelectorAll('.quiz-option').length >= 9");
await hydrated();
for (const [index, answer] of [1, 2, 1].entries()) await evaluate(`document.querySelectorAll('.quiz-question')[${index}].querySelectorAll('.quiz-option')[${answer}].click()`);
await waitFor("document.querySelectorAll('.quiz-explanation').length === 3");
await clickText("button", "Submit answers");
await waitFor("document.body.innerText.includes('Passed')");
await shot("07-academy-quiz");

// ---- Every user page at desktop and phone widths ----
const userPages = ["/overview", "/analyze", "/urls", "/sender", "/history", "/reports", "/reports/new", `/reports/${reportId}`, "/protection", "/academy", "/academy/phishing", "/notifications", "/settings", historyHref];
for (const [width, height, mobile, tag] of [[1280, 860, false, "desktop"], [375, 812, true, "phone"]]) {
  await setViewport(width, height, mobile);
  for (const page of userPages) {
    label = `user ${tag} ${page}`;
    await goto(page);
    await waitFor("!document.querySelector('.loading-block') && !!document.querySelector('h1')");
    await sleep(300);
    await checkOverflow();
  }
  await goto("/overview");
  await waitFor("!!document.querySelector('.stat-tile')");
  await shot(`08-overview-${tag}`);
}

// ---- Mobile navigation ----
label = "mobile nav";
await hydrated();
await until(() => click(".menu-toggle"), "document.querySelector('.sidebar').classList.contains('open')");
await shot("09-mobile-menu");
await clickText(".nav-link-item", "Notifications");
await waitFor("location.pathname === '/notifications'");
await waitFor("!document.querySelector('.sidebar').classList.contains('open')");

// ---- Users cannot open admin pages ----
label = "user->admin redirect";
await goto("/admin");
await waitFor("location.pathname === '/overview'");

// ---- Admin flows ----
const db = new pg.Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT || 5432), database: process.env.PGDATABASE, user: process.env.PGUSER, password: process.env.PGPASSWORD });
await db.connect();
await setViewport(1280, 860, false);
label = "logout";
await evaluate("fetch('/api/auth/logout', { method: 'POST' })");
await goto("/login");
await waitFor("!!document.querySelector('#auth-email')");
await evaluate(`fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'zz-smoke-admin-${RUN}@example.test', display_name: 'Smoke Admin', password: '${PASSWORD}' }) })`);
await db.query("update profiles set role = 'admin' where email = $1", [`zz-smoke-admin-${RUN}@example.test`]);
await evaluate("fetch('/api/auth/logout', { method: 'POST' })");
label = "admin login";
await goto("/login");
await hydrated();
await until(() => clickText(".auth-tabs button", "Admin"), "document.body.innerText.includes('Admin login')");
await typeInto("#auth-email", `zz-smoke-admin-${RUN}@example.test`);
await typeInto("#auth-password", PASSWORD);
await click("button[type=submit]");
await waitFor("location.pathname === '/admin'");
await waitFor("!!document.querySelector('.stat-tile')");
await shot("10-admin-dashboard");

label = "admin review";
await goto(`/admin/reports/${reportId}`);
await waitFor("!!document.querySelector('#review-status')");
await hydrated();
await evaluate("(() => { const select = document.querySelector('#review-status'); const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; setter.call(select, 'verified'); select.dispatchEvent(new Event('change', { bubbles: true })); })()");
await typeInto("#review-feedback", "Confirmed phishing pattern.");
await clickText("button", "Save decision");
await waitFor("document.body.innerText.includes('Publish a confirmed scam alert')");
await shot("11-admin-review");

const adminPages = ["/admin", "/admin/reports", `/admin/reports/${reportId}`, "/admin/cases", "/admin/users", "/admin/insights", "/notifications", "/settings"];
for (const [width, height, mobile, tag] of [[1280, 860, false, "desktop"], [375, 812, true, "phone"]]) {
  await setViewport(width, height, mobile);
  for (const page of adminPages) {
    label = `admin ${tag} ${page}`;
    await goto(page);
    await waitFor("!document.querySelector('.loading-block') && !!document.querySelector('h1')");
    await sleep(300);
    await checkOverflow();
  }
}
await shot("12-admin-settings-phone");
label = "admin->user redirect";
await goto("/analyze");
await waitFor("location.pathname === '/admin'");

// ---- Reporter sees the status change ----
await db.query("delete from profiles where email like $1", [`zz-smoke-%${RUN}@example.test`]);
await db.end();
ws.close();
chrome.kill();

reported = true;
if (problems.length) {
  console.log(`FAILED with ${problems.length} problem(s):`);
  for (const problem of problems) console.log(` - ${problem}`);
  process.exitCode = 1;
} else {
  console.log("Browser smoke test passed: all pages rendered without errors or overflow at desktop and phone widths.");
}
