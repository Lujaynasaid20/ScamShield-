// Values shared by the server and the browser.

export const REPORT_STATUSES = {
  submitted: "Submitted",
  under_review: "Under review",
  verified: "Verified",
  rejected: "Rejected",
  resolved: "Resolved"
};

export const REPORT_CATEGORIES = [
  "Phishing / fake link",
  "Bank or mobile-money fraud",
  "Fake job offer",
  "Fake prize or lottery",
  "Impersonation",
  "Romance scam",
  "Investment or crypto scam",
  "Account takeover / code theft",
  "Online shopping scam",
  "Delivery scam",
  "Other"
];

// Suggested report category for an analysis category.
export const CATEGORY_TO_REPORT = {
  phishing: "Phishing / fake link",
  financial: "Bank or mobile-money fraud",
  job: "Fake job offer",
  prize: "Fake prize or lottery",
  impersonation: "Impersonation",
  romance: "Romance scam",
  investment: "Investment or crypto scam",
  account_takeover: "Account takeover / code theft",
  shopping: "Online shopping scam",
  delivery: "Delivery scam"
};

export const NOTIFICATION_TYPES = {
  analysis: { label: "Analysis results", icon: "bi-activity", description: "When a message, link or sender check finishes." },
  report_status: { label: "Report updates", icon: "bi-flag", description: "When an administrator changes the status of your report or leaves feedback." },
  education: { label: "New lessons", icon: "bi-mortarboard", description: "When new Scam Awareness Academy content is added." },
  threat_alert: { label: "Confirmed scam alerts", icon: "bi-exclamation-triangle", description: "Scam patterns confirmed by an administrator." },
  security: { label: "Account security", icon: "bi-shield-lock", description: "Password, two-factor and session changes on your account." }
};
