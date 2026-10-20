// Copied from the website's lib/constants.js; keep in sync. The server validates every value.
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

// Notification types: preference field, label, icon and description.
export const NOTIFICATION_TYPES = {
  analysis: { field: "notify_analysis", label: "Analysis results", icon: "pulse-outline", description: "When a message, link or sender check finishes." },
  report_status: { field: "notify_report_status", label: "Report updates", icon: "flag-outline", description: "When an administrator changes the status of your report or leaves feedback." },
  education: { field: "notify_education", label: "New lessons", icon: "school-outline", description: "When new Scam Awareness Academy content is added." },
  threat_alert: { field: "notify_threat_alerts", label: "Confirmed scam alerts", icon: "warning-outline", description: "Scam patterns confirmed by an administrator." },
  security: { field: "notify_security", label: "Account security", icon: "lock-closed-outline", description: "Password, two-factor and session changes on your account." }
};
