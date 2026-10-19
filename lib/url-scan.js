// Heuristic URL analysis. Never fetches the URL: every check works on the text of the address only.

const SHORTENERS = new Set(["bit.ly", "tinyurl.com", "t.co", "rb.gy", "goo.gl", "ow.ly", "is.gd", "buff.ly", "cutt.ly", "shorturl.at", "rebrand.ly", "tiny.cc", "s.id", "t.ly", "v.gd"]);
const RISKY_TLDS = new Set(["click", "country", "gq", "link", "loan", "mov", "top", "work", "xyz", "zip", "tk", "ml", "cf", "ga", "rest", "support", "cam", "buzz", "icu", "monster"]);
const MULTI_PART_SUFFIXES = new Set(["co.ke", "or.ke", "go.ke", "ac.ke", "ne.ke", "co.uk", "org.uk", "ac.uk", "gov.uk", "com.au", "co.za", "co.tz", "co.ug", "com.ng", "co.in", "com.br"]);
const DANGEROUS_EXTENSIONS = /\.(apk|exe|scr|msi|bat|cmd|js|vbs|jar|zip|rar|iso)$/i;
const SENSITIVE_WORDS = /(login|log-in|signin|sign-in|verify|verification|secure|update|account|wallet|confirm|unlock|suspend|bonus|reward|claim|password|kyc)/i;

// Well-known brands that scammers imitate, and the domains they really use.
export const BRANDS = {
  paypal: ["paypal.com"],
  google: ["google.com", "gmail.com", "youtube.com"],
  microsoft: ["microsoft.com", "live.com", "office.com", "outlook.com"],
  apple: ["apple.com", "icloud.com"],
  amazon: ["amazon.com"],
  facebook: ["facebook.com", "fb.com", "meta.com"],
  instagram: ["instagram.com"],
  whatsapp: ["whatsapp.com"],
  netflix: ["netflix.com"],
  safaricom: ["safaricom.co.ke"],
  mpesa: ["safaricom.co.ke"],
  equity: ["equitybank.co.ke", "equitygroupholdings.com"],
  kcb: ["kcbgroup.com"],
  dhl: ["dhl.com"],
  fedex: ["fedex.com"],
  binance: ["binance.com"],
  airtel: ["airtel.africa", "airtel.co.ke"],
  kra: ["kra.go.ke"]
};

const HOMOGLYPHS = [[/0/g, "o"], [/1/g, "l"], [/3/g, "e"], [/5/g, "s"], [/rn/g, "m"], [/vv/g, "w"], [/@/g, "a"]];

function editDistance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return rows[a.length][b.length];
}

export function registrableDomain(host) {
  const labels = host.split(".").filter(Boolean);
  if (labels.length <= 2) return labels.join(".");
  const lastTwo = labels.slice(-2).join(".");
  return MULTI_PART_SUFFIXES.has(lastTwo) ? labels.slice(-3).join(".") : lastTwo;
}

const isIpHost = host => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || /^\[[\da-f:.]+\]$/i.test(host) || /^\d{8,10}$/.test(host);

// Finds brand names used by a domain it does not belong to (e.g. paypal.com.account-check.xyz).
export function brandFindings(host, path = "") {
  const domain = registrableDomain(host);
  const domainLabel = domain.split(".")[0];
  const normalizedLabel = HOMOGLYPHS.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), domainLabel);
  const subdomain = host.slice(0, Math.max(0, host.length - domain.length));
  const findings = [];
  for (const [brand, officialDomains] of Object.entries(BRANDS)) {
    if (officialDomains.includes(domain) || officialDomains.some(official => host.endsWith(`.${official}`))) continue;
    if (subdomain.includes(brand)) {
      findings.push({ id: "brand_subdomain", brand, weight: 30, title: "Brand name in a subdomain", detail: `"${brand}" appears before the real domain ${domain}. The site belongs to ${domain}, not ${brand}.` });
    } else if (domainLabel !== brand && domainLabel.includes(brand)) {
      findings.push({ id: "brand_in_domain", brand, weight: 25, title: "Brand name inside another domain", detail: `${domain} contains "${brand}" but is not one of ${brand}'s known domains.` });
    } else if (domainLabel !== brand && brand.length >= 4 && (normalizedLabel === brand || editDistance(normalizedLabel, brand) === 1)) {
      findings.push({ id: "lookalike", brand, weight: 35, title: "Look-alike domain", detail: `${domain} closely resembles "${brand}" but is a different domain.` });
    } else if (path.toLowerCase().includes(brand) && SENSITIVE_WORDS.test(path)) {
      findings.push({ id: "brand_in_path", brand, weight: 10, title: "Brand name in the link path", detail: `The path mentions "${brand}" on ${domain}, which is not a ${brand} domain.` });
    }
    if (findings.length >= 2) break;
  }
  return findings;
}

export function parseUrlInput(raw) {
  const value = String(raw || "").trim();
  if (!value) return { error: "Enter a link to scan." };
  if (value.length > 2048) return { error: "That link is too long to scan (2048 characters maximum)." };
  if (/\s/.test(value)) return { error: "A link cannot contain spaces." };
  if (/^(javascript|data|vbscript|file):/i.test(value)) return { error: "Only web links (http or https) can be scanned." };
  const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(value);
  if (hasScheme && !/^https?:\/\//i.test(value)) return { error: "Only web links (http or https) can be scanned." };
  let url;
  try {
    url = new URL(hasScheme ? value : `http://${value}`);
  } catch {
    return { error: "That does not look like a valid web address." };
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || (!host.includes(".") && !isIpHost(host) && host !== "localhost")) return { error: "That does not look like a valid web address." };
  return { url, value, hasScheme, host };
}

export function scanUrl(raw) {
  const parsed = parseUrlInput(raw);
  if (parsed.error) return { valid: false, error: parsed.error };
  const { url, value, hasScheme, host } = parsed;
  const bareHost = host.replace(/^www\./, "");
  const domain = isIpHost(host) ? host : registrableDomain(bareHost);
  const indicators = [];
  const add = (id, weight, title, detail) => indicators.push({ id, weight, title, detail });
  const rawHostPart = value.replace(/^[a-z]+:\/\//i, "").split(/[/?#]/)[0];
  const path = `${url.pathname}${url.search}`;

  if (hasScheme && url.protocol === "http:") add("no_https", 10, "Not encrypted (HTTP)", "The link uses http:// instead of https://, so anything you type could be intercepted.");
  if (!hasScheme) add("no_scheme", 0, "No protocol given", "The address was written without http:// or https://. It was scanned as written.");
  if (isIpHost(host)) add("ip_host", 25, "Numeric IP address instead of a name", "Legitimate organizations almost always use a domain name. IP-address links hide who runs the site.");
  if (/(^|\.)xn--/i.test(host)) add("punycode", 25, "International characters in the domain", "The domain uses characters that can imitate normal letters (for example a Cyrillic \"а\" instead of \"a\").");
  if (SHORTENERS.has(bareHost)) add("shortener", 20, "Shortened link", "Link shorteners hide the real destination. Expand it with a preview service before trusting it.");
  if (RISKY_TLDS.has(host.split(".").pop())) add("risky_tld", 15, `Uncommon domain ending (.${host.split(".").pop()})`, "This domain ending is cheap and frequently used in scam campaigns. That alone does not make the site malicious.");
  const subdomainDepth = isIpHost(host) ? 0 : bareHost.split(".").length - domain.split(".").length;
  if (subdomainDepth >= 3) add("deep_subdomains", 10, "Unusually many subdomains", `The address has ${subdomainDepth} levels before ${domain}, a pattern used to push the real domain out of view.`);
  if (url.username || url.password || rawHostPart.includes("@")) add("userinfo", 25, "Hidden destination using \"@\"", "Everything before \"@\" in a link is ignored by the browser. This is a classic trick to disguise the real site.");
  if (/%[0-9a-f]{2}/i.test(rawHostPart)) add("encoded_host", 20, "Encoded characters in the domain", "Percent-encoding inside the domain is unusual and can hide the real address.");
  const encodedCount = (path.match(/%[0-9a-f]{2}/gi) || []).length;
  if (/%25[0-9a-f]{2}/i.test(path) || encodedCount > 12) add("heavy_encoding", 10, "Heavily encoded link", "Large amounts of encoded text can hide where a link really leads.");
  if (url.port && !["80", "443"].includes(url.port)) add("odd_port", 10, `Unusual port (${url.port})`, "Websites normally do not specify a port. A custom port can indicate a temporary or self-hosted scam page.");
  if (value.length > 150) add("long_url", 5, "Very long link", "Very long links are harder to read and can hide suspicious parts.");
  if (!isIpHost(host) && (domain.split(".")[0].match(/-/g) || []).length >= 2) add("many_hyphens", 10, "Many hyphens in the domain", "Domains like secure-login-update-account.com are commonly used for phishing.");
  if (/[?&](url|redirect|redirect_uri|next|target|dest|destination|continue|goto)=(https?%3a|https?:|\/\/)/i.test(url.search)) add("redirect", 10, "Redirects to another site", "The link contains another web address and may forward you somewhere else.");
  if (DANGEROUS_EXTENSIONS.test(url.pathname)) add("download", 20, "Downloads a file or app", "The link points to a file (such as an .apk or .exe). Installing apps from links is a common way to spread malware.");
  if (!isIpHost(host)) for (const finding of brandFindings(bareHost, path)) indicators.push(finding);
  if (SENSITIVE_WORDS.test(`${bareHost}${url.pathname}`) && indicators.some(item => item.weight > 0)) {
    add("sensitive_words", 8, "Account or payment wording", "Words like \"verify\", \"login\" or \"wallet\" combined with other warning signs suggest a phishing page.");
  }

  const score = Math.min(98, indicators.reduce((sum, item) => sum + item.weight, 0));
  return {
    valid: true,
    input: value,
    normalized: url.href,
    host,
    domain,
    score,
    level: score >= 50 ? "high" : score >= 20 ? "medium" : "low",
    indicators
  };
}

// Pulls web addresses out of free text (used by the message analyzer).
export function extractUrls(message) {
  const candidates = String(message).match(/(?:https?:\/\/|www\.)[^\s<>"']+|\b(?:[a-z0-9-]+\.)+(?:com|net|org|info|xyz|top|link|click|ly|gy|co|ke|io|me|app|site|online|shop|live|zip|mov)\/[^\s<>"']*/gi) || [];
  return [...new Set(candidates.map(value => value.replace(/[),.;!?\]}]+$/g, "")))].slice(0, 10);
}
