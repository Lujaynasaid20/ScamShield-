// Rule-based scam message analysis (English and Kiswahili keywords). Shared by the server and the browser.
// The message is treated purely as text: nothing in it is executed or followed.
import { extractUrls, scanUrl } from "./url-scan.js";
import messageModel from "./message-model-artifact.js";
import { predictMessage } from "./message-model.js";

export const CATEGORIES = {
  phishing: "Phishing / fake login",
  financial: "Bank, payment or mobile-money fraud",
  job: "Fake job or task offer",
  delivery: "Delivery or parcel scam",
  prize: "Fake prize or lottery",
  investment: "Investment or crypto scam",
  romance: "Romance scam",
  account_takeover: "Account takeover / code theft",
  impersonation: "Impersonation",
  shopping: "Online shopping scam",
  sender: "Sender check",
  other: "No clear scam category"
};

// Labels for categories saved by the earlier version of the app.
const LEGACY_CATEGORIES = {
  typeBank: "financial", typeDelivery: "delivery", typeJob: "job", typePrize: "prize", typeInvestment: "investment",
  typeRomance: "romance", typeCredential: "account_takeover", typeImpersonation: "impersonation", typeOther: "other"
};

export const categoryLabel = key => CATEGORIES[LEGACY_CATEGORIES[key] || key] || CATEGORIES.other;
export const normalizeCategory = key => (CATEGORIES[key] ? key : LEGACY_CATEGORIES[key] || "other");

export const VERDICTS = {
  low: { verdict: "safe", label: "Safe", tone: "safe" },
  medium: { verdict: "suspicious", label: "Suspicious", tone: "warn" },
  high: { verdict: "scam", label: "Scam", tone: "danger" }
};

const SIGNALS = [
  {
    id: "urgency", weight: 18, title: "Pressure or urgency",
    body: "Scammers rush people so they act before checking the facts.",
    pattern: /\b(urgent(?:ly)?|immediately|act now|within 24 hours|today only|final (?:warning|notice)|suspended|expires?|expiring|limited time|last chance|haraka|mara moja|sasa hivi|leo tu|imeisha muda)\b/gi
  },
  {
    id: "money", weight: 25, title: "Money or payment request",
    body: "The message pushes you to send money, pay a fee, or use an unusual payment method.",
    pattern: /\b(send money|transfer|payment|pay now|processing fee|registration fee|clearance fee|wire|gift ?cards?|deposit|tuma pesa|lipa|malipo|ada ya|fedha|gharama ya usafirishaji)\b/gi
  },
  {
    id: "secret", weight: 30, title: "Sensitive information request",
    body: "Legitimate organizations do not ask for your password, PIN, or one-time code by message.",
    pattern: /\b(password|passcode|pin|one[- ]time (?:code|password)|verification code|otp|bank details|card number|cvv|nambari ya siri|nywila|msimbo wa uthibitisho|taarifa za akaunti)\b/gi
  },
  {
    id: "prize", weight: 23, title: "Unexpected reward or offer",
    body: "A prize you did not enter for is often bait to collect money or personal information.",
    pattern: /\b(you(?:'ve| have) won|winner|claim your (?:prize|reward)|free gift|congratulations|selected to receive|umeshinda|zawadi(?: yako)?|bahati nasibu)\b/gi
  },
  {
    id: "threat", weight: 20, title: "Threat or account warning",
    body: "Threats of account closure, arrest or legal action are a common pressure tactic.",
    pattern: /\b(account (?:will be |has been |is )?(?:locked|suspended|closed|blocked|deactivated)|arrest(?:ed)?|legal action|warrant|kufungwa kwa akaunti|imefungwa|imesimamishwa|kukamatwa|hatua za kisheria)\b/gi
  },
  {
    id: "offplatform", weight: 12, title: "Moves the conversation elsewhere",
    body: "Asking you to continue on WhatsApp, Telegram or a private number avoids platform protections.",
    pattern: /\b(whatsapp me|text me on|contact (?:me|us) on (?:whatsapp|telegram)|telegram|signal app|nitumie whatsapp)\b/gi
  },
  {
    id: "too_good", weight: 15, title: "Too good to be true",
    body: "Guaranteed profits, easy daily earnings or huge discounts are classic scam hooks.",
    pattern: /\b(guaranteed (?:returns?|profit|income)|double your (?:money|investment)|earn \$?\d[\d,]* (?:daily|per day|a day|weekly)|risk[- ]free|90% off|faida ya uhakika)\b/gi
  }
];

const CATEGORY_PATTERNS = [
  ["account_takeover", /\b(one[- ]time (?:code|password)|verification code|otp|reset your password|msimbo wa uthibitisho)\b/i],
  ["prize", /\b(won|winner|prize|lottery|claim your prize|umeshinda|zawadi|bahati nasibu)\b/i],
  ["job", /\b(job offer|work from home|task job|part[- ]time job|recruitment|hiring|employment|salary|kazi ya nyumbani|ajira)\b/i],
  ["investment", /\b(crypto|cryptocurrency|bitcoin|usdt|investment|invest now|forex|trading|guaranteed returns?|sarafu ya kidijitali|uwekezaji)\b/i],
  ["romance", /\b(dating|romance|my love|sweetheart|darling|lover|mpenzi|mahusiano)\b/i],
  ["delivery", /\b(delivery|parcel|package|courier|shipment|customs|usafirishaji|kifurushi)\b/i],
  ["shopping", /\b(order|discount|sale|shop|cheap|seller|buyer|item)\b/i],
  ["financial", /\b(bank|banking|account|m-?pesa|mobile money|paybill|till number|card|benki|akaunti)\b/i],
  ["phishing", /\b(login|log in|sign in|verify your|confirm your|update your (?:details|account))\b/i],
  ["impersonation", /\b(police|government|tax office|kra|irs|support team|customer care|official|polisi|serikali|mamlaka)\b/i]
];

const SWAHILI_HINT = /\b(tuma pesa|akaunti yako|nambari ya siri|zawadi|bonyeza|haraka sana|ada ya usafirishaji|umeshinda|uthibitishe|lipa sasa)\b/i;

function collectMatches(message, pattern) {
  const matches = [];
  for (const match of message.matchAll(new RegExp(pattern.source, pattern.flags))) {
    matches.push({ start: match.index, end: match.index + match[0].length, text: match[0] });
    if (matches.length >= 20) break;
  }
  return matches;
}

function mergeHighlights(spans) {
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  const merged = [];
  for (const span of sorted) {
    const last = merged[merged.length - 1];
    if (last && span.start < last.end) {
      last.end = Math.max(last.end, span.end);
      if (!last.signals.includes(span.signal)) last.signals.push(span.signal);
    } else merged.push({ start: span.start, end: span.end, signals: [span.signal] });
  }
  return merged;
}

export function analyzeMessage(rawMessage) {
  const message = String(rawMessage || "").slice(0, 5000);
  let modelAssessment = null;
  try {
    modelAssessment = predictMessage(messageModel, message);
  } catch {
    modelAssessment = null;
  }
  const signals = [];
  const spans = [];

  for (const rule of SIGNALS) {
    const matches = collectMatches(message, rule.pattern);
    if (!matches.length) continue;
    signals.push({ id: rule.id, title: rule.title, body: rule.body, weight: rule.weight, matches: [...new Set(matches.map(item => item.text.toLowerCase()))].slice(0, 5) });
    matches.forEach(item => spans.push({ ...item, signal: rule.id }));
  }

  const urlChecks = extractUrls(message).map(value => {
    const scan = scanUrl(value);
    return scan.valid
      ? { value, score: scan.score, level: scan.level, domain: scan.domain, reasons: scan.indicators.filter(item => item.weight > 0).map(item => item.title) }
      : { value, score: 0, level: "low", domain: "", reasons: [] };
  });
  if (urlChecks.length) {
    const riskiest = Math.max(...urlChecks.map(item => item.score));
    const weight = riskiest >= 50 ? 30 : riskiest >= 20 ? 24 : 18;
    signals.push({
      id: "link", weight, title: riskiest >= 20 ? "Suspicious link" : "Link or web address",
      body: riskiest >= 20 ? "The message contains a link with warning signs (see the link check below)." : "Unexpected links can lead to fake sign-in pages or unsafe downloads.",
      matches: urlChecks.map(item => item.value).slice(0, 5)
    });
    urlChecks.forEach(item => {
      const start = message.indexOf(item.value);
      if (start >= 0) spans.push({ start, end: start + item.value.length, text: item.value, signal: "link" });
    });
  }

  const phoneChecks = [];
  for (const match of message.matchAll(/(?<![\w+])\+?\d[\d\s().-]{6,}\d(?!\w)/g)) {
    const value = match[0].trim();
    if (/^\d{1,2}[:.]\d{2}/.test(value) || /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(value)) continue;
    const digits = value.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) continue;
    if (!phoneChecks.some(item => item.digits === digits)) phoneChecks.push({ value, digits, validFormat: true });
    if (phoneChecks.length >= 10) break;
  }

  let score = Math.min(98, signals.reduce((sum, signal) => sum + signal.weight, 0));
  if (SWAHILI_HINT.test(message) && signals.length && score < 22) score = 28;
  let level = score >= 55 ? "high" : score >= 25 ? "medium" : "low";
  if (level === "low" && modelAssessment?.label === "needs_review") level = "medium";
  const text = message.toLowerCase();
  const category = signals.length ? CATEGORY_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] || (urlChecks.length ? "phishing" : "other") : "other";

  const strongSignals = signals.filter(signal => signal.weight >= 20).length;
  const confidence = signals.length >= 3 || (signals.length >= 2 && strongSignals >= 2) ? "high" : signals.length === 2 ? "medium" : "low";
  const wordCount = message.trim().split(/\s+/).filter(Boolean).length;
  const limitations = [];
  if (wordCount < 6) limitations.push("The message is very short, so there is little to analyze.");
  if (!signals.length) limitations.push("No known warning signs were found, but new or well-written scams can avoid these checks.");
  if (signals.length === 1) limitations.push("Only one warning sign was found, so this result is uncertain.");
  limitations.push("This is an automated, rule-based assessment. It cannot confirm who sent the message.");

  const verdictInfo = VERDICTS[level];
  const signalList = signals.map(signal => signal.title.toLowerCase());
  const ruleExplanation = !signals.length
    ? "We did not find common scam warning signs such as pressure, payment requests, requests for codes, or suspicious links. That does not prove the message is genuine."
    : `This message was rated ${verdictInfo.label.toLowerCase()} (${score}/100) because it shows ${signalList.length === 1 ? signalList[0] : `${signalList.slice(0, -1).join(", ")} and ${signalList.at(-1)}`}. ${level === "high" ? "Several strong scam signals appear together, a pattern typical of fraud." : level === "medium" ? "These signs are common in scams but also appear in some genuine messages, so verify independently." : "The signs found are weak on their own."}`;
  const modelExplanation = modelAssessment && modelAssessment.label !== "safe"
    ? ` The experimental text model suggested ${modelAssessment.label === "scam" ? "scam-like language" : "caution or insufficiently familiar language"}${modelAssessment.evidence.length ? ` based on patterns including ${modelAssessment.evidence.join(", ")}` : ""}; this is a learned text pattern, not proof of fraud.`
    : "";
  const explanation = ruleExplanation + modelExplanation;
  if (modelAssessment?.label === "needs_review") limitations.push("The experimental text model found insufficiently reliable or familiar patterns; verify the sender independently.");
  if (modelAssessment) limitations.push("The text model is trained on a small synthetic sample and is not production-validated; its class scores are not calibrated probabilities.");

  return {
    message,
    score,
    level,
    verdict: verdictInfo.verdict,
    verdictLabel: verdictInfo.label,
    classification: level === "medium" && score < 25 && modelAssessment?.label === "needs_review" ? "needs_review" : verdictInfo.verdict,
    classificationLabel: level === "medium" && score < 25 && modelAssessment?.label === "needs_review" ? "Suspicious / Needs Review" : verdictInfo.label,
    category,
    categoryLabel: categoryLabel(category),
    modelAssessment,
    scoreBasis: "rule_indicators",
    signals,
    highlights: mergeHighlights(spans),
    urlChecks,
    phoneChecks,
    confidence,
    limitations,
    explanation
  };
}

// Splits a message into plain and highlighted segments for display (no HTML involved).
export function highlightSegments(message, highlights = []) {
  const segments = [];
  let cursor = 0;
  for (const span of highlights) {
    if (span.start < cursor || span.end > message.length) continue;
    if (span.start > cursor) segments.push({ text: message.slice(cursor, span.start) });
    segments.push({ text: message.slice(span.start, span.end), signals: span.signals });
    cursor = span.end;
  }
  if (cursor < message.length) segments.push({ text: message.slice(cursor) });
  return segments;
}
