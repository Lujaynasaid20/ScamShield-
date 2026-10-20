// Explained results for message, link and sender checks. Mirrors the website's result pages using the same API data.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { formatDate } from "@/lib/format";
import { colors, radius, space, tones } from "@/theme";
import { Badge, Body, Button, Card, Heading, Notice, VerdictBadge } from "./ui";

// The server sends Bootstrap icon names; these are their closest Ionicons.
const ICONS = {
  "bi-link-45deg": "link-outline", "bi-key": "key-outline", "bi-telephone-outbound": "call-outline", "bi-cash-coin": "cash-outline",
  "bi-bank": "business-outline", "bi-receipt": "receipt-outline", "bi-slash-circle": "ban-outline", "bi-shield-lock": "lock-closed-outline",
  "bi-download": "download-outline", "bi-pause-circle": "pause-circle-outline", "bi-eye": "eye-outline", "bi-mortarboard": "school-outline",
  "bi-telephone-x": "call-outline", "bi-patch-check": "checkmark-done-circle-outline", "bi-exclamation-octagon": "alert-circle-outline",
  "bi-flag": "flag-outline", "bi-search": "search-outline", "bi-person-dash": "person-remove-outline"
};
export const icon = name => ICONS[name] || "shield-checkmark-outline";

const CONFIDENCE_TEXT = {
  high: "Several independent warning signs agree, so this assessment is fairly reliable.",
  medium: "Two warning signs were found. Treat the result as a strong hint, not a certainty.",
  low: "Little evidence either way, so this result is uncertain."
};
const PRIORITY = { high: { tone: "danger", label: "Do now" }, medium: { tone: "warn", label: "Important" }, low: { tone: "info", label: "Tip" } };

function ResultHeader({ item, title, summary, badge }) {
  return (
    <Card>
      <View style={s.headerRow}>
        {badge || <VerdictBadge verdict={item.verdict} kind={item.kind} />}
        {item.kind !== "sender" && <Text style={s.score}>{item.score}/100</Text>}
      </View>
      <Heading level={1} style={s.title}>{title}</Heading>
      {summary ? <Body>{summary}</Body> : null}
      <Body small muted>{formatDate(item.created_at)}</Body>
    </Card>
  );
}

export function ActionCenter({ recommendations }) {
  if (!recommendations) return null;
  const tone = recommendations.severity === "high" ? "danger" : recommendations.severity === "medium" ? "warn" : "safe";
  return (
    <View style={s.action} accessibilityLabel="Safety Action Center">
      <Text style={s.actionKicker}>SAFETY ACTION CENTER</Text>
      <Text style={s.actionTitle} accessibilityRole="header">{recommendations.headline}</Text>
      <Badge tone={tone} label={recommendations.severity === "high" ? "High severity" : recommendations.severity === "medium" ? "Caution" : "Low risk"} />
      {recommendations.steps.map((step, index) => (
        <View key={step.id} style={s.step}>
          <View style={s.stepIcon}><Ionicons name={icon(step.icon)} size={18} color="#fff" /></View>
          <View style={s.flex}>
            <Text style={s.stepTitle}>{index + 1}. {step.title}</Text>
            <Badge tone={PRIORITY[step.priority]?.tone} label={PRIORITY[step.priority]?.label} style={s.stepBadge} />
            <Text style={s.stepBody}>{step.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Signal({ tone, iconName, title, body, chips }) {
  const look = tones[tone];
  return (
    <View style={s.signal}>
      <View style={[s.signalIcon, { backgroundColor: look.bg }]}><Ionicons name={iconName} size={16} color={look.fg} /></View>
      <View style={s.flex}>
        <Text style={s.signalTitle}>{title}</Text>
        {body ? <Body small>{body}</Body> : null}
        {chips?.length > 0 && <View style={s.chips}>{chips.map(chip => <Text key={chip} style={s.chip}>{chip}</Text>)}</View>}
      </View>
    </View>
  );
}

function HighlightedMessage({ message, highlights = [] }) {
  const segments = [];
  let cursor = 0;
  for (const span of highlights) {
    if (span.start < cursor || span.end > message.length) continue;
    if (span.start > cursor) segments.push({ text: message.slice(cursor, span.start) });
    segments.push({ text: message.slice(span.start, span.end), marked: true });
    cursor = span.end;
  }
  if (cursor < message.length) segments.push({ text: message.slice(cursor) });
  return (
    <Text style={s.message} selectable>
      {segments.map((segment, index) => <Text key={index} style={segment.marked ? s.mark : undefined}>{segment.text}</Text>)}
    </Text>
  );
}

export function MessageResult({ item, result }) {
  const router = useRouter();
  const details = item.details || {};
  const signals = result?.signals || item.signals || [];
  const highlights = result?.highlights || details.highlights || [];
  const confidence = result?.confidence || details.confidence;
  const limitations = result?.limitations || details.limitations || [];
  const modelAssessment = result?.modelAssessment || details.modelAssessment;
  const urlChecks = result?.urlChecks || item.url_checks || [];
  const phoneChecks = result?.phoneChecks || item.phone_checks || [];
  const needsReview = modelAssessment?.label === "needs_review" && item.score < 25;
  const title = needsReview ? "Review this message before trusting it" : item.verdict === "scam" ? "This message looks like a scam" : item.verdict === "suspicious" ? "This message is suspicious" : "No common scam signs found";

  return (
    <View style={s.stack}>
      <ResultHeader item={item} title={title} summary={result?.explanation || details.explanation}
        badge={needsReview ? <Badge tone="warn" icon="warning" label="Suspicious / Needs Review" /> : null} />
      <ActionCenter recommendations={details.recommendations} />
      <Card>
        <Heading level={2}>Why it was rated this way</Heading>
        {!!confidence && <Notice icon="speedometer-outline"><Text style={s.noticeText}><Text style={s.bold}>Confidence: {confidence}. </Text>{CONFIDENCE_TEXT[confidence]}</Text></Notice>}
        {signals.length
          ? signals.map(signal => <Signal key={signal.id} tone={signal.weight >= 25 ? "danger" : "warn"} iconName="alert" title={signal.title} body={signal.body} chips={signal.matches} />)
          : <Signal tone="safe" iconName="checkmark" title="No strong scam signals found" body="That does not guarantee the message is safe. Verify unexpected requests independently." />}
        {!!modelAssessment && (
          <Signal tone="info" iconName="hardware-chip-outline"
            title={`Experimental text model: ${modelAssessment.label === "needs_review" ? "needs review" : modelAssessment.label}`}
            body="Learned text patterns are a secondary caution signal, not proof. The risk score counts explicit rule indicators only."
            chips={modelAssessment.evidence} />
        )}
      </Card>
      <Card>
        <Heading level={2}>Message reviewed</Heading>
        {highlights.length > 0 && <Body small muted><Text style={s.mark}>Highlighted</Text> = warning sign</Body>}
        <HighlightedMessage message={item.input} highlights={highlights} />
      </Card>
      {(urlChecks.length > 0 || phoneChecks.length > 0) && (
        <Card>
          <Heading level={2}>Links and numbers in the message</Heading>
          {urlChecks.map(check => (
            <View key={check.value} style={s.checkRow}>
              <Text style={s.mono} selectable>{check.value}</Text>
              <Body small muted>{check.reasons?.length ? check.reasons.join(" · ") : "No heuristic warning signs in the address"}</Body>
              <Button small variant="outline" icon="scan-outline" title="Full link scan" onPress={() => router.push({ pathname: "/check", params: { mode: "url", value: check.value } })} />
            </View>
          ))}
          {phoneChecks.map(check => (
            <View key={check.value} style={s.checkRow}>
              <Text style={s.bold} selectable>{check.value}</Text>
              <Body small muted>Check whether other people have reported this number.</Body>
              <Button small variant="outline" icon="person-circle-outline" title="Check sender" onPress={() => router.push({ pathname: "/check", params: { mode: "sender", value: check.value } })} />
            </View>
          ))}
        </Card>
      )}
      <Notice>
        <Text style={[s.noticeText, s.bold]}>About this result</Text>
        {limitations.map(note => <Text key={note} style={s.noticeText}>• {note}</Text>)}
      </Notice>
    </View>
  );
}

const REPUTATION = {
  match: { tone: "danger", label: "Verified threat" },
  no_match: { tone: "info", label: "Not listed" },
  error: { tone: "warn", label: "Unavailable" },
  not_configured: { tone: "neutral", label: "Not configured" }
};

export function UrlResult({ item }) {
  const details = item.details || {};
  const reputation = details.reputation || { status: "not_configured", message: "Threat-intelligence lookup was not run." };
  const indicators = (details.indicators || []).filter(indicator => indicator.weight > 0);
  const notes = (details.indicators || []).filter(indicator => indicator.weight === 0);
  const rep = REPUTATION[reputation.status] || REPUTATION.not_configured;
  const title = reputation.status === "match" ? "This link is on a threat list" : item.level === "high" ? "This link shows strong scam warning signs" : item.level === "medium" ? "This link has some warning signs" : "No warning signs found in this address";

  return (
    <View style={s.stack}>
      <ResultHeader item={item} title={title} summary={details.explanation} />
      <ActionCenter recommendations={details.recommendations} />
      <Card>
        <Body small muted>Link scanned</Body>
        <Text style={s.mono} selectable>{item.input}</Text>
        <Body small muted>Real domain (the site you would actually visit)</Body>
        <Text style={s.domain}>{details.domain}</Text>
        <Notice tone="neutral" icon="eye-off-outline">ScamShield never opens the link. Only the text of the address is analyzed.</Notice>
      </Card>
      <Card>
        <View style={s.headerRow}><Heading level={2}>Threat intelligence</Heading><Badge tone={rep.tone} label={rep.label} /></View>
        <Body>{reputation.message}</Body>
        {reputation.threats?.length > 0 && <Body><Text style={s.bold}>Listed as: </Text>{reputation.threats.join(", ")}</Body>}
        <Body small muted>Source: {reputation.provider || "Google Safe Browsing"}. Threat lists confirm known dangerous sites; they can't vouch for new ones.</Body>
      </Card>
      <Card>
        <View style={s.headerRow}><Heading level={2}>Address warning signs</Heading><Badge tone="info" label={`Score ${details.heuristicScore ?? item.score}/100`} /></View>
        {indicators.length
          ? indicators.map(indicator => <Signal key={`${indicator.id}-${indicator.brand || ""}`} tone={indicator.weight >= 25 ? "danger" : "warn"} iconName="alert" title={`${indicator.title} (+${indicator.weight})`} body={indicator.detail} />)
          : <Body muted>No suspicious patterns were found in how this address is written. Scam sites can still use ordinary-looking addresses.</Body>}
        {notes.map(note => <Body key={note.id} small muted>ⓘ {note.detail}</Body>)}
      </Card>
    </View>
  );
}

const RISK = {
  high: { label: "High", tone: "danger", icon: "close-circle" },
  medium: { label: "Medium", tone: "warn", icon: "warning" },
  low: { label: "Low", tone: "safe", icon: "checkmark-circle" },
  unknown: { label: "Unknown", tone: "neutral", icon: "help-circle" }
};

function Fact({ label, children }) {
  return (
    <View style={s.fact}>
      <Text style={s.factLabel}>{label}</Text>
      {typeof children === "string" || typeof children === "number" ? <Body>{children}</Body> : children}
    </View>
  );
}

export function SenderResult({ item, result }) {
  const details = result || item.details || {};
  const counts = details.counts || { total: 0, verified: 0, unverified: 0, rejected: 0, resolved: 0 };
  const reports = result?.reports;
  const riskLevel = details.riskLevel || (counts.verified ? "high" : counts.total > counts.rejected ? "medium" : "unknown");
  const risk = RISK[riskLevel];
  const { phone, carrier, identity } = details;
  const isPhone = details.type === "phone";
  const typeLabel = isPhone ? "number" : details.type === "email" ? "email address" : "sender name";
  const lineType = carrier?.lineTypeLabel || phone?.lineTypeLabel;
  const title = counts.verified > 0 ? "Reported scam number: an administrator has verified reports"
    : counts.total > counts.rejected ? "Other users have reported this sender"
    : identity?.status === "verified" ? `Official ${identity.name} contact, with no reports`
    : "No reports found. That doesn't prove this sender is safe";
  const summary = counts.total ? `${counts.total} community report${counts.total === 1 ? "" : "s"} match this ${typeLabel}.` : `No one has reported this ${typeLabel} in ScamShield yet. That is not proof the sender is trustworthy.`;
  const carrierText = !isPhone ? null : phone?.status !== "valid" ? "Not available"
    : carrier?.status === "found" && carrier.carrier ? `${carrier.carrier} (${carrier.provider})`
    : carrier?.status === "not_configured" ? "Not available: network lookup isn't set up" : carrier?.message || "Not available";

  return (
    <View style={s.stack}>
      <ResultHeader item={item} title={title} summary={summary} badge={<Badge tone={risk.tone} icon={risk.icon} label={`Risk: ${risk.label}`} />} />
      {details.statuses?.length > 0 && (
        <Card>
          {details.statuses.map(status => (
            <View key={status.id} style={s.status}>
              <Badge tone={status.tone} icon={icon(status.icon)} label={status.label} />
              <Body small>{status.detail}</Body>
            </View>
          ))}
        </Card>
      )}
      <ActionCenter recommendations={details.recommendations} />
      <Card>
        <Heading level={2}>Sender details</Heading>
        <Fact label={isPhone ? "Number entered" : "Checked"}><Text style={s.mono} selectable>{item.input}</Text></Fact>
        <Fact label="Verified identity">
          {identity?.status === "verified" ? <><Text style={s.bold}>{identity.name}</Text><Badge tone="safe" icon="checkmark-done-circle-outline" label="Verified Business" /><Body small muted>Source: {identity.detail}</Body></>
            : identity?.status === "registered" ? <><Text style={s.bold}>{identity.name}</Text><Badge tone="info" icon="business-outline" label="Registered business name" /><Body small muted>{identity.source}. {identity.detail}</Body></>
            : <><Body muted>Identity unavailable</Body>{identity?.detail ? <Body small muted>{identity.detail}</Body> : null}</>}
        </Fact>
        {!!isPhone && <Fact label="Country">{phone?.countryName ? `${phone.countryName} (${phone.callingCode})` : phone?.status === "short_code" ? "Short code: no country" : "Unknown: include the country code, like +255"}</Fact>}
        {!!isPhone && <Fact label="Carrier / network">{carrierText}</Fact>}
        {!!lineType && <Fact label="Line type">{lineType}</Fact>}
        {phone?.status === "invalid" && <Fact label="Number check"><Text style={s.danger}>Not a valid number{phone.countryName ? ` for ${phone.countryName}` : ""}</Text></Fact>}
        <Fact label="Scam reports">{`${counts.total} (${counts.verified} verified by admin)`}</Fact>
        {details.categories?.length > 0 && <Fact label="Reported categories">{details.categories.map(entry => `${entry.category} (${entry.reports})`).join(", ")}</Fact>}
        <Fact label="Risk level"><Badge tone={risk.tone} icon={risk.icon} label={risk.label} /></Fact>
        {!!details.firstReported && <Fact label="First reported">{formatDate(details.firstReported)}</Fact>}
        {!!details.lastReported && <Fact label="Last reported">{formatDate(details.lastReported)}</Fact>}
      </Card>
      {details.claimedNames?.length > 0 && (
        <Card>
          <Heading level={2}>Names this sender has used</Heading>
          {details.claimedNames.length > 1 && <Notice tone="danger" icon="alert-circle">{`This sender has claimed to be ${details.claimedNames.length} different people or organizations. Real businesses don't switch identities.`}</Notice>}
          {details.claimedNames.map(entry => (
            <View key={entry.name} style={s.status}>
              <Text style={s.bold}>“{entry.name}”</Text>
              <Body small muted>{entry.reports} report{entry.reports === 1 ? "" : "s"}{entry.verified ? " · includes a verified report" : ""}</Body>
            </View>
          ))}
          <Body small muted>These are names the sender claimed to be, as told by people who reported them. They are not the real owner.</Body>
        </Card>
      )}
      {reports?.length > 0 && (
        <Card>
          <Heading level={2}>Community reports</Heading>
          <Notice tone="warn" icon="warning-outline">A community report is an allegation until an administrator verifies it. Numbers and names can also be spoofed.</Notice>
          {reports.slice(0, 10).map((report, index) => (
            <View key={index} style={s.status}>
              <Text style={s.bold}>{report.category}</Text>
              <Body small muted>{report.statusLabel} · reported {formatDate(report.created_at, { time: false })}</Body>
            </View>
          ))}
          <Body small muted>Reporter identities and report details are private and never shown.</Body>
        </Card>
      )}
      {details.notes?.length > 0 && (
        <Card>
          <Heading level={2}>Notes about this sender</Heading>
          {details.notes.map(note => <Body key={note} small>• {note}</Body>)}
        </Card>
      )}
    </View>
  );
}

export function ResultForItem({ item, result }) {
  if (item.kind === "url") return <UrlResult item={item} />;
  if (item.kind === "sender") return <SenderResult item={item} result={result} />;
  return <MessageResult item={item} result={result} />;
}

const s = StyleSheet.create({
  stack: { gap: space.md },
  flex: { flex: 1, minWidth: 0 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm, flexWrap: "wrap" },
  score: { fontSize: 15, fontWeight: "700", color: colors.muted },
  title: { fontSize: 22 },
  bold: { fontWeight: "700", color: colors.ink },
  danger: { color: colors.dangerText, fontWeight: "600" },
  noticeText: { fontSize: 14, lineHeight: 20, color: colors.infoText },
  mono: { fontFamily: "monospace", fontSize: 14, color: colors.ink },
  domain: { fontSize: 18, fontWeight: "700", color: colors.ink },
  message: { fontSize: 15, lineHeight: 23, color: colors.ink, backgroundColor: colors.surface2, borderRadius: radius.sm, padding: space.md, borderWidth: 1, borderColor: colors.line },
  mark: { backgroundColor: colors.highlight, color: colors.ink },
  signal: { flexDirection: "row", gap: space.md, paddingVertical: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  signalIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", marginTop: 2 },
  signalTitle: { fontSize: 15, fontWeight: "700", color: colors.ink, marginBottom: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  chip: { fontSize: 12, color: colors.ink2, backgroundColor: colors.highlight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, overflow: "hidden" },
  checkRow: { gap: 6, paddingVertical: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  action: { backgroundColor: colors.navy900, borderRadius: radius.md, padding: space.lg, gap: space.sm },
  actionKicker: { color: "#8fb0ff", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  actionTitle: { color: "#fff", fontSize: 19, fontWeight: "700" },
  step: { flexDirection: "row", gap: space.md, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#2a3d66" },
  stepIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.navy800, alignItems: "center", justifyContent: "center" },
  stepTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  stepBadge: { marginVertical: 4 },
  stepBody: { color: "#c9d5f0", fontSize: 14, lineHeight: 20 },
  fact: { gap: 4, paddingVertical: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  factLabel: { fontSize: 13, fontWeight: "700", color: colors.muted },
  status: { gap: 4, paddingVertical: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }
});
