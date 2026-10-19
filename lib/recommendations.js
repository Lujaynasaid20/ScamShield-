// AI Safety Action Center: next steps chosen from the actual analysis result.

const STEP = {
  noClick: { id: "noClick", icon: "bi-link-45deg", title: "Do not open the link", body: "Don't tap links in this message. If you need the service, type its official address yourself or use its app." },
  noCodes: { id: "noCodes", icon: "bi-key", title: "Never share passwords, PINs or codes", body: "No bank, mobile-money provider or support team needs your PIN, password or one-time code. Anyone asking is likely trying to take over your account." },
  verify: { id: "verify", icon: "bi-telephone-outbound", title: "Verify through an official contact", body: "Contact the organization using a number or website you find yourself (on your card, statement or official app), not one from this message." },
  noPay: { id: "noPay", icon: "bi-cash-coin", title: "Do not send money or pay fees", body: "Genuine prizes, jobs and refunds never require you to pay first. Payments by gift card, crypto or mobile money are very hard to reverse." },
  bank: { id: "bank", icon: "bi-bank", title: "If you shared financial details, call your provider now", body: "Contact your bank or mobile-money provider through its official helpline, ask them to block access, and change your PIN from a trusted device." },
  lostMoney: { id: "lostMoney", icon: "bi-receipt", title: "If you already paid, act quickly", body: "Contact your payment provider immediately to try to stop or reverse the transfer. Keep screenshots, transaction IDs and phone numbers as evidence." },
  block: { id: "block", icon: "bi-slash-circle", title: "Block and report the sender", body: "Block the number or account, and report it to your platform or network. Reporting it here also helps warn other users." },
  password: { id: "password", icon: "bi-shield-lock", title: "If you entered a password, change it", body: "Change the password on the real site, sign out of other sessions, and turn on two-factor authentication." },
  noInstall: { id: "noInstall", icon: "bi-download", title: "Do not install apps from links", body: "Only install apps from the official app store. Apps sent by message can steal codes and banking details." },
  pause: { id: "pause", icon: "bi-pause-circle", title: "Pause before you act", body: "Take time to check. Real organizations will not punish you for verifying a request first." },
  stayAlert: { id: "stayAlert", icon: "bi-eye", title: "Stay alert", body: "No warning signs were found, but a low score is not a guarantee. Be careful with unexpected links, payments or requests for information." },
  learn: { id: "learn", icon: "bi-mortarboard", title: "Learn the warning signs", body: "The Scam Awareness Academy has short lessons on this type of scam." }
};

export function getRecommendations({ kind = "message", level = "low", signals = [], category = "other", reputationMatch = false, indicators = [], reportCounts = null } = {}) {
  const ids = new Set(signals.map(signal => (typeof signal === "string" ? signal : signal.id)));
  const indicatorIds = new Set(indicators.map(item => item.id));
  const steps = [];
  const push = (step, priority) => { if (!steps.some(item => item.id === step.id)) steps.push({ ...step, priority }); };

  if (kind === "sender") {
    const reported = reportCounts && (reportCounts.verified > 0 || reportCounts.unverified > 0);
    if (reportCounts?.verified > 0) { push(STEP.block, "high"); push(STEP.noPay, "high"); push(STEP.noCodes, "high"); }
    else if (reported) { push(STEP.verify, "medium"); push(STEP.noCodes, "medium"); }
    else push(STEP.stayAlert, "low");
    push(STEP.verify, reported ? "medium" : "low");
    return {
      severity: reportCounts?.verified > 0 ? "high" : reported ? "medium" : "low",
      headline: reportCounts?.verified > 0 ? "An administrator has verified reports about this sender" : reported ? "Other users have reported this sender (unverified)" : "No community reports found",
      steps
    };
  }

  if (kind === "url") {
    if (level === "high" || reputationMatch) {
      push(STEP.noClick, "high");
      push(STEP.password, "high");
      push(STEP.noCodes, "high");
      if (indicatorIds.has("download")) push(STEP.noInstall, "high");
      push(STEP.block, "medium");
    } else if (level === "medium") {
      push(STEP.verify, "medium");
      push(STEP.noClick, "medium");
      if (indicatorIds.has("download")) push(STEP.noInstall, "medium");
      push(STEP.noCodes, "medium");
    } else {
      push(STEP.stayAlert, "low");
      push(STEP.verify, "low");
    }
    return {
      severity: reputationMatch ? "high" : level,
      headline: reputationMatch ? "This link is on a threat list. Do not open it." : level === "high" ? "This link shows strong signs of being a scam" : level === "medium" ? "Verify this link before you open it" : "No strong warning signs, but stay cautious",
      steps
    };
  }

  if (level === "high") {
    if (ids.has("link")) push(STEP.noClick, "high");
    if (ids.has("secret") || category === "account_takeover") push(STEP.noCodes, "high");
    if (ids.has("money") || ["prize", "job", "investment", "delivery", "shopping", "romance"].includes(category)) push(STEP.noPay, "high");
    push(STEP.verify, "high");
    if (ids.has("secret") || ids.has("money") || category === "financial") push(STEP.bank, "high");
    if (ids.has("money")) push(STEP.lostMoney, "medium");
    if (ids.has("link")) push(STEP.password, "medium");
    push(STEP.block, "medium");
  } else if (level === "medium") {
    push(STEP.pause, "medium");
    push(STEP.verify, "medium");
    if (ids.has("link")) push(STEP.noClick, "medium");
    if (ids.has("secret")) push(STEP.noCodes, "medium");
    if (ids.has("money")) push(STEP.noPay, "medium");
  } else {
    push(STEP.stayAlert, "low");
    if (ids.has("link")) push(STEP.verify, "low");
  }
  if (category !== "other" && level !== "low") push(STEP.learn, "low");

  return {
    severity: level,
    headline: level === "high" ? "Treat this message as a scam" : level === "medium" ? "Verify before you take any action" : "No strong warning signs, but stay cautious",
    steps
  };
}

// General playbooks for the Protection Center, for situations that already happened.
export const PLAYBOOKS = [
  {
    id: "shared-pin", icon: "bi-key", title: "I shared my PIN, password or a code",
    steps: ["Call your bank or mobile-money provider now using the number on your card or official app.", "Ask them to block access and reverse pending transactions.", "Change your PIN or password from a trusted device.", "Turn on two-factor authentication wherever it is offered."]
  },
  {
    id: "clicked-link", icon: "bi-link-45deg", title: "I opened a suspicious link",
    steps: ["Close the page and do not enter any information.", "If you typed a password, change it on the real site right away.", "If a file or app downloaded, do not open it; delete it and run a security scan.", "Watch your accounts for unfamiliar activity."]
  },
  {
    id: "sent-money", icon: "bi-cash-coin", title: "I sent money to a scammer",
    steps: ["Contact your payment provider immediately and ask for the transfer to be stopped or reversed.", "Save screenshots, transaction IDs, phone numbers and usernames.", "Report the incident to the police or your national fraud reporting service.", "Be wary of \"recovery\" offers: scammers often target victims a second time."]
  },
  {
    id: "account-taken", icon: "bi-person-lock", title: "Someone took over my account",
    steps: ["Use the service's official account-recovery process.", "Warn your contacts that messages from your account may be fake.", "Change passwords on other accounts that used the same password.", "Enable two-factor authentication once you regain access."]
  }
];
