// Optional URL reputation lookup through Google Safe Browsing (Lookup API v4).
// Only the URL itself is sent, never the user's message. The URL is not visited.

const ENDPOINT = "https://safebrowsing.googleapis.com/v4/threatMatches:find";
const THREAT_LABELS = {
  MALWARE: "Malware",
  SOCIAL_ENGINEERING: "Phishing / social engineering",
  UNWANTED_SOFTWARE: "Unwanted software",
  POTENTIALLY_HARMFUL_APPLICATION: "Potentially harmful app"
};

export const reputationConfigured = () => Boolean(process.env.GOOGLE_SAFE_BROWSING_API_KEY);

export async function checkUrlReputation(url) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    return { provider: "Google Safe Browsing", status: "not_configured", threats: [], message: "Threat-intelligence lookup is not configured, so only heuristic checks were run." };
  }
  try {
    const response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "scamshield-ai", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: Object.keys(THREAT_LABELS),
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }]
        }
      }),
      signal: AbortSignal.timeout(5000),
      redirect: "error"
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const threats = [...new Set((data.matches || []).map(match => THREAT_LABELS[match.threatType] || match.threatType))];
    return threats.length
      ? { provider: "Google Safe Browsing", status: "match", threats, message: `Listed by Google Safe Browsing as: ${threats.join(", ")}.` }
      : { provider: "Google Safe Browsing", status: "no_match", threats: [], message: "Not found on Google Safe Browsing threat lists. New scam sites are often not listed yet, so this is not proof of safety." };
  } catch (error) {
    console.error("Safe Browsing lookup failed:", error.message);
    return { provider: "Google Safe Browsing", status: "error", threats: [], message: "The threat-intelligence service could not be reached, so only heuristic checks were run." };
  }
}
