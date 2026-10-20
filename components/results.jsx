"use client";

import Link from "next/link";
import { highlightSegments } from "@/lib/analyzer";
import { formatDate } from "@/lib/api-client";
import { Notice, StatusBadge, VerdictBadge } from "./ui";

const GAUGE_COLOR = { low: "var(--safe-mark)", medium: "var(--warn-mark)", high: "var(--danger-mark)" };
const CONFIDENCE_TEXT = {
  high: "Several independent warning signs agree, so this assessment is fairly reliable.",
  medium: "Two warning signs were found. Treat the result as a strong hint, not a certainty.",
  low: "Little evidence either way, so this result is uncertain."
};
const PRIORITY_TONE = { high: "tone-danger", medium: "tone-warn", low: "tone-info" };

export function RiskGauge({ score, level, label = "risk" }) {
  return (
    <div className="gauge" style={{ "--value": score, "--color": GAUGE_COLOR[level] }} role="img" aria-label={`Risk score ${score} out of 100`}>
      <div className="gauge-inner"><div><strong>{score}</strong><br /><span>/100 {label}</span></div></div>
    </div>
  );
}

export function HighlightedMessage({ message, highlights, signals = [] }) {
  const titles = Object.fromEntries(signals.map(signal => [signal.id, signal.title]));
  return (
    <div className="highlighted-message" tabIndex={0} aria-label="Message with suspicious phrases highlighted">
      {highlightSegments(message, highlights).map((segment, index) => segment.signals
        ? <mark key={index} title={segment.signals.map(id => titles[id] || id).join(", ")}>{segment.text}</mark>
        : <span key={index}>{segment.text}</span>)}
    </div>
  );
}

export function ActionCenter({ recommendations, reportHref, extra }) {
  if (!recommendations) return null;
  const tone = recommendations.severity === "high" ? "tone-danger" : recommendations.severity === "medium" ? "tone-warn" : "tone-safe";
  const severityLabel = recommendations.severity === "high" ? "High severity" : recommendations.severity === "medium" ? "Caution" : "Low risk";
  return (
    <section className="action-center" aria-labelledby="action-center-title">
      <div className="action-center-head">
        <i className="bi bi-shield-exclamation fs-4" aria-hidden="true" />
        <div className="min-w-0">
          <div className="small text-uppercase fw-bold" style={{ color: "#8fb0ff", letterSpacing: ".06em" }}>Safety Action Center</div>
          <h2 id="action-center-title">{recommendations.headline}</h2>
        </div>
        <span className={`badge-status ${tone} sev`}>{severityLabel}</span>
      </div>
      <ol className="action-steps">
        {recommendations.steps.map(step => (
          <li className="action-step" key={step.id}>
            <span className="action-step-icon"><i className={`bi ${step.icon}`} aria-hidden="true" /></span>
            <div>
              <strong>{step.title}<span className={`priority ${PRIORITY_TONE[step.priority]}`}>{step.priority === "high" ? "Do now" : step.priority === "medium" ? "Important" : "Tip"}</span></strong>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="action-center-foot">
        {reportHref && <Link href={reportHref} className="btn btn-primary btn-sm"><i className="bi bi-flag" aria-hidden="true" />Report this incident</Link>}
        <Link href="/protection" className="btn btn-outline btn-sm"><i className="bi bi-life-preserver" aria-hidden="true" />What to do if you already responded</Link>
        {extra}
      </div>
    </section>
  );
}

function ResultHeader({ item, title, summary, verdictLabel, badge }) {
  return (
    <div className="card-panel">
      <div className="result-hero">
        {item.kind !== "sender" && <RiskGauge score={item.score} level={item.level} label={item.kind === "message" ? "rule score" : "risk"} />}
        <div className="result-hero-copy">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {badge || <VerdictBadge verdict={item.verdict} kind={item.kind} label={verdictLabel} />}
            {item.kind !== "sender" && <span className="kind-chip">{item.categoryLabel}</span>}
            <span className="small-print">{formatDate(item.created_at)}</span>
          </div>
          <h2>{title}</h2>
          <p className="mb-0 muted">{summary}</p>
        </div>
      </div>
    </div>
  );
}

export function MessageResult({ item, result }) {
  const details = item.details || {};
  const signals = result?.signals || item.signals || [];
  const highlights = result?.highlights || details.highlights || [];
  const confidence = result?.confidence || details.confidence;
  const limitations = result?.limitations || details.limitations || [];
  const modelAssessment = result?.modelAssessment || details.modelAssessment;
  const recommendations = details.recommendations;
  const urlChecks = result?.urlChecks || item.url_checks || [];
  const phoneChecks = result?.phoneChecks || item.phone_checks || [];
  const needsReview = modelAssessment?.label === "needs_review" && item.score < 25;
  const title = needsReview ? "Review this message before trusting it" : item.verdict === "scam" ? "This message looks like a scam" : item.verdict === "suspicious" ? "This message is suspicious" : "No common scam signs found";

  return (
    <div className="stack">
      <ResultHeader item={item} title={title} summary={result?.explanation || details.explanation} verdictLabel={needsReview ? "Suspicious / Needs Review" : undefined} />
      <div className="grid grid-main-side">
        <div className="stack">
          <section className="card-panel" aria-labelledby="why-title">
            <div className="panel-title"><h3 id="why-title">Why it was rated this way</h3><span className="small-print">{signals.length} signal{signals.length === 1 ? "" : "s"}</span></div>
            {confidence && <div className="confidence mb-2"><i className="bi bi-speedometer" aria-hidden="true" /><div><strong>Confidence: {confidence}.</strong> {CONFIDENCE_TEXT[confidence]}</div></div>}
            {signals.length ? signals.map(signal => (
              <div className="signal-item" key={signal.id}>
                <span className={`signal-icon ${signal.weight >= 25 ? "tone-danger" : "tone-warn"}`}><i className="bi bi-exclamation-lg" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <strong>{signal.title}</strong>
                  <p>{signal.body}</p>
                  {signal.matches?.length > 0 && <div className="signal-matches" aria-label="Matched phrases">{signal.matches.map(match => <span key={match}>{match}</span>)}</div>}
                </div>
              </div>
            )) : (
              <div className="signal-item"><span className="signal-icon tone-safe"><i className="bi bi-check-lg" aria-hidden="true" /></span><div><strong>No strong scam signals found</strong><p>That does not guarantee the message is safe. Verify unexpected requests independently.</p></div></div>
            )}
            {modelAssessment && (
              <div className="signal-item">
                <span className="signal-icon tone-info"><i className="bi bi-cpu" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <strong>Experimental text model: {modelAssessment.label === "needs_review" ? "needs review" : modelAssessment.label}</strong>
                  <p>Learned text patterns are a secondary caution signal, not proof. The risk score above counts explicit rule indicators only.</p>
                  {modelAssessment.evidence.length > 0 && <div className="signal-matches" aria-label="Model evidence patterns">{modelAssessment.evidence.map(match => <span key={match}>{match}</span>)}</div>}
                </div>
              </div>
            )}
          </section>
          <section className="card-panel" aria-labelledby="message-title">
            <div className="panel-title"><h3 id="message-title">Message reviewed</h3>{highlights.length > 0 && <span className="small-print"><mark style={{ background: "#ffe8a3" }}>Highlighted</mark> = warning sign</span>}</div>
            <HighlightedMessage message={item.input} highlights={highlights} signals={signals} />
          </section>
          {(urlChecks.length > 0 || phoneChecks.length > 0) && (
            <section className="card-panel" aria-labelledby="checks-title">
              <h3 id="checks-title">Links and numbers in the message</h3>
              {urlChecks.map(check => (
                <div className="list-row" key={check.value}>
                  <span className="row-icon"><i className="bi bi-link-45deg" aria-hidden="true" /></span>
                  <div className="list-row-main"><strong className="mono">{check.value}</strong><small>{check.reasons?.length ? check.reasons.join(" · ") : "No heuristic warning signs in the address"}</small></div>
                  <div className="list-row-meta">
                    <VerdictBadge verdict={{ low: "safe", medium: "suspicious", high: "scam" }[check.level || "low"]} kind="url" />
                    <Link href={`/urls?url=${encodeURIComponent(check.value)}`} className="btn btn-outline btn-sm">Full scan</Link>
                  </div>
                </div>
              ))}
              {phoneChecks.map(check => (
                <div className="list-row" key={check.value}>
                  <span className="row-icon"><i className="bi bi-telephone" aria-hidden="true" /></span>
                  <div className="list-row-main"><strong>{check.value}</strong><small>ScamShield cannot verify who owns a number. Check community reports.</small></div>
                  <div className="list-row-meta"><Link href={`/sender?value=${encodeURIComponent(check.value)}`} className="btn btn-outline btn-sm">Check sender</Link></div>
                </div>
              ))}
            </section>
          )}
        </div>
        <div className="stack">
          <ActionCenter recommendations={recommendations} reportHref={`/reports/new?case=${item.id}`} />
          <Notice icon="bi-info-circle">
            <strong>About this result.</strong>
            <ul className="mb-0 ps-3 mt-1">{limitations.map(note => <li key={note}>{note}</li>)}</ul>
          </Notice>
        </div>
      </div>
    </div>
  );
}

const REPUTATION_STYLE = {
  match: { tone: "danger", icon: "bi-shield-x" },
  no_match: { tone: "info", icon: "bi-shield" },
  not_configured: { tone: "neutral", icon: "bi-plug" },
  error: { tone: "warn", icon: "bi-wifi-off" }
};

export function UrlResult({ item }) {
  const details = item.details || {};
  const reputation = details.reputation || { status: "not_configured", message: "Threat-intelligence lookup was not run." };
  const indicators = (details.indicators || []).filter(indicator => indicator.weight > 0);
  const notes = (details.indicators || []).filter(indicator => indicator.weight === 0);
  const repStyle = REPUTATION_STYLE[reputation.status] || REPUTATION_STYLE.not_configured;
  const title = reputation.status === "match" ? "This link is on a threat list" : item.level === "high" ? "This link shows strong scam warning signs" : item.level === "medium" ? "This link has some warning signs" : "No warning signs found in this address";

  return (
    <div className="stack">
      <ResultHeader item={item} title={title} summary={details.explanation} />
      <div className="grid grid-main-side">
        <div className="stack">
          <section className="card-panel">
            <dl className="dl-grid">
              <dt>Link scanned</dt><dd className="mono">{item.input}</dd>
              <dt>Real domain</dt><dd><strong>{details.domain}</strong> <span className="small-print">(the site you would actually visit)</span></dd>
            </dl>
            <p className="small-print mt-3 mb-0"><i className="bi bi-eye-slash me-1" aria-hidden="true" />ScamShield never opens the link. Only the text of the address is analyzed.</p>
          </section>
          <section className="card-panel" aria-labelledby="intel-title">
            <div className="panel-title"><h3 id="intel-title">Threat intelligence</h3><span className={`source-tag tone-${repStyle.tone}`}><i className={`bi ${repStyle.icon}`} aria-hidden="true" />{reputation.status === "match" ? "Verified threat" : reputation.status === "no_match" ? "Not listed" : reputation.status === "error" ? "Unavailable" : "Not configured"}</span></div>
            <p className="mb-1">{reputation.message}</p>
            {reputation.threats?.length > 0 && <p className="mb-0"><strong>Listed as:</strong> {reputation.threats.join(", ")}</p>}
            <p className="small-print mb-0 mt-2">Source: {reputation.provider || "Google Safe Browsing"}. Threat lists confirm known dangerous sites; they can't vouch for new ones.</p>
          </section>
          <section className="card-panel" aria-labelledby="heuristic-title">
            <div className="panel-title"><h3 id="heuristic-title">Heuristic findings</h3><span className="source-tag tone-info"><i className="bi bi-cpu" aria-hidden="true" />Pattern analysis · score {details.heuristicScore ?? item.score}/100</span></div>
            {indicators.length ? (
              <ul className="indicator-list">
                {indicators.map(indicator => (
                  <li key={`${indicator.id}-${indicator.brand || ""}`}>
                    <span className={`signal-icon ${indicator.weight >= 25 ? "tone-danger" : "tone-warn"}`}><i className="bi bi-exclamation-lg" aria-hidden="true" /></span>
                    <div className="min-w-0"><strong>{indicator.title}</strong> <span className="small-print">+{indicator.weight}</span><p className="break-anywhere">{indicator.detail}</p></div>
                  </li>
                ))}
              </ul>
            ) : <p className="muted mb-0">No suspicious patterns were found in how this address is written. Scam sites can still use ordinary-looking addresses.</p>}
            {notes.map(note => <p key={note.id} className="small-print mb-0 mt-2"><i className="bi bi-info-circle me-1" aria-hidden="true" />{note.detail}</p>)}
          </section>
        </div>
        <div className="stack">
          <ActionCenter recommendations={details.recommendations} reportHref={`/reports/new?case=${item.id}`} />
        </div>
      </div>
    </div>
  );
}

const RISK = {
  high: { label: "High", tone: "tone-danger", icon: "bi-x-octagon-fill" },
  medium: { label: "Medium", tone: "tone-warn", icon: "bi-exclamation-triangle-fill" },
  low: { label: "Low", tone: "tone-safe", icon: "bi-check-circle-fill" },
  unknown: { label: "Unknown", tone: "tone-neutral", icon: "bi-question-circle-fill" }
};
const STATUS_TONE = { safe: "tone-safe", danger: "tone-danger", warn: "tone-warn", neutral: "tone-neutral" };
const Unavailable = ({ children }) => <span className="muted">{children}</span>;

function senderTitle(details, counts) {
  if (counts.verified > 0) return "Reported scam number: an administrator has verified reports";
  if (counts.total > counts.rejected) return "Other users have reported this sender";
  if (details.identity?.status === "verified") return `Official ${details.identity.name} contact, with no reports`;
  return "No reports found. That doesn't prove this sender is safe";
}

function CarrierValue({ carrier }) {
  if (!carrier) return <Unavailable>Not available</Unavailable>;
  if (carrier.status === "found" && carrier.carrier) return <>{carrier.carrier} <span className="small-print">({carrier.provider})</span></>;
  return <Unavailable>{carrier.status === "not_configured" ? "Not available: network lookup isn't set up" : carrier.message}</Unavailable>;
}

export function SenderResult({ item, result }) {
  const details = result || item.details || {};
  const counts = details.counts || { total: 0, verified: 0, unverified: 0, rejected: 0, resolved: 0 };
  const reports = result?.reports;
  // Checks saved before identity lookups existed have no riskLevel.
  const riskLevel = details.riskLevel || (counts.verified ? "high" : counts.total > counts.rejected ? "medium" : "unknown");
  const risk = RISK[riskLevel];
  const { phone, carrier, identity } = details;
  const isPhone = details.type === "phone";
  const typeLabel = isPhone ? "number" : details.type === "email" ? "email address" : "sender name";
  const lineType = carrier?.lineTypeLabel || phone?.lineTypeLabel;
  const summary = counts.total
    ? `${counts.total} community report${counts.total === 1 ? "" : "s"} match this ${typeLabel}.`
    : `No one has reported this ${typeLabel} in ScamShield yet. That is not proof the sender is trustworthy.`;

  return (
    <div className="stack">
      <ResultHeader item={item} title={senderTitle(details, counts)} summary={summary}
        badge={<span className={`badge-status ${risk.tone}`}><i className={`bi ${risk.icon}`} aria-hidden="true" />Risk: {risk.label}</span>} />
      <div className="grid grid-main-side">
        <div className="stack">
          {details.statuses?.length > 0 && (
            <section className="card-panel" aria-labelledby="status-title">
              <h3 id="status-title" className="visually-hidden">Status</h3>
              {details.statuses.map(status => (
                <div className="list-row" key={status.id}>
                  <div className="list-row-main"><span><span className={`badge-status ${STATUS_TONE[status.tone]}`}><i className={`bi ${status.icon}`} aria-hidden="true" />{status.label}</span></span><small>{status.detail}</small></div>
                </div>
              ))}
            </section>
          )}
          <section className="card-panel" aria-labelledby="sender-facts-title">
            <h3 id="sender-facts-title">Sender details</h3>
            <dl className="dl-grid">
              <dt>{isPhone ? "Number entered" : "Checked"}</dt><dd className="mono">{item.input}</dd>
              <dt>{details.type === "email" || isPhone ? "Verified identity" : "Identity"}</dt>
              <dd>
                {identity?.status === "verified" && <><strong>{identity.name}</strong> <span className="badge-status tone-safe"><i className="bi bi-patch-check" aria-hidden="true" />Verified Business</span><div className="small-print">Source: {identity.detail}</div></>}
                {identity?.status === "registered" && <><strong>{identity.name}</strong> <span className="badge-status tone-info"><i className="bi bi-building" aria-hidden="true" />Registered business name</span><div className="small-print">{identity.source}. {identity.detail}</div></>}
                {(!identity || identity.status === "unavailable") && <><Unavailable>Identity unavailable</Unavailable>{identity?.detail && <div className="small-print">{identity.detail}</div>}</>}
              </dd>
              {isPhone && <>
                <dt>Country</dt>
                <dd>{phone?.countryName ? `${phone.countryName} (${phone.callingCode})` : phone?.callingCode || <Unavailable>{phone?.status === "short_code" ? "Short code: no country" : "Unknown: include the country code, like +255"}</Unavailable>}</dd>
                <dt>Carrier / network</dt>
                <dd>{phone?.status === "valid" ? <CarrierValue carrier={carrier} /> : <Unavailable>Not available</Unavailable>}</dd>
                {lineType && <><dt>Line type</dt><dd>{lineType}</dd></>}
                {phone?.status === "invalid" && <><dt>Number check</dt><dd className="text-danger">Not a valid number{phone.countryName ? ` for ${phone.countryName}` : ""}</dd></>}
              </>}
              {!isPhone && <><dt>Type</dt><dd className="text-capitalize">{details.type}</dd></>}
              <dt>Scam reports</dt><dd>{counts.total} <span className="small-print">({counts.verified} verified by admin)</span></dd>
              {details.categories?.length > 0 && <><dt>Reported categories</dt><dd>{details.categories.map(entry => `${entry.category} (${entry.reports})`).join(", ")}</dd></>}
              <dt>Risk level</dt><dd><span className={`badge-status ${risk.tone}`}><i className={`bi ${risk.icon}`} aria-hidden="true" />{risk.label}</span></dd>
              {details.firstReported && <><dt>First reported</dt><dd>{formatDate(details.firstReported)}</dd></>}
              {details.lastReported && <><dt>Last reported</dt><dd>{formatDate(details.lastReported)}</dd></>}
            </dl>
          </section>
          <section className="card-panel" aria-labelledby="community-title">
            <div className="panel-title"><h3 id="community-title">Community reports</h3><span className="source-tag tone-neutral"><i className="bi bi-people" aria-hidden="true" />Community</span></div>
            <div className="grid grid-4 mb-3">
              <div><div className="small-print">Total</div><strong className="fs-4">{counts.total}</strong></div>
              <div><div className="small-print">Verified by admin</div><strong className="fs-4">{counts.verified}</strong></div>
              <div><div className="small-print">Unverified</div><strong className="fs-4">{counts.unverified}</strong></div>
              <div><div className="small-print">Rejected</div><strong className="fs-4">{counts.rejected}</strong></div>
            </div>
            <Notice tone="warn" icon="bi-exclamation-triangle">A community report is an <strong>allegation</strong> until an administrator verifies it. Numbers and names can also be spoofed, so a report doesn't prove who is behind a message.</Notice>
            {reports?.length > 0 && (
              <div className="mt-2">
                {reports.slice(0, 10).map((report, index) => (
                  <div className="list-row" key={index}>
                    <div className="list-row-main"><strong>{report.category}</strong><small>Reported {formatDate(report.created_at, { time: false })}</small></div>
                    <div className="list-row-meta"><StatusBadge status={report.status} /></div>
                  </div>
                ))}
                <p className="small-print mb-0 mt-2">Reporter identities and report details are private and never shown.</p>
              </div>
            )}
          </section>
          {details.claimedNames?.length > 0 && (
            <section className="card-panel" aria-labelledby="claimed-title">
              <div className="panel-title"><h3 id="claimed-title">Names this sender has used</h3><span className="source-tag tone-neutral"><i className="bi bi-people" aria-hidden="true" />Community</span></div>
              {details.claimedNames.length > 1 && <Notice tone="danger" icon="bi-exclamation-octagon">This sender has claimed to be <strong>{details.claimedNames.length} different people or organizations</strong>. Real businesses don't switch identities.</Notice>}
              <div className="mt-2">
                {details.claimedNames.map(entry => (
                  <div className="list-row" key={entry.name}>
                    <div className="list-row-main"><strong>&ldquo;{entry.name}&rdquo;</strong><small>{entry.reports} report{entry.reports === 1 ? "" : "s"}</small></div>
                    {entry.verified && <div className="list-row-meta"><StatusBadge status="verified" /></div>}
                  </div>
                ))}
              </div>
              <p className="small-print mb-0 mt-2">These are names the sender <strong>claimed</strong> to be, as told by people who reported them. They are not the real owner of the {details.type}.</p>
            </section>
          )}
          {details.notes?.length > 0 && (
            <section className="card-panel" aria-labelledby="format-title">
              <h3 id="format-title">Notes about this sender</h3>
              <ul className="tick-list">{details.notes.map(note => <li key={note}><i className="bi bi-info-circle text-primary" aria-hidden="true" /><span>{note}</span></li>)}</ul>
            </section>
          )}
        </div>
        <div className="stack">
          <ActionCenter recommendations={details.recommendations} reportHref={`/reports/new?sender_type=${details.type}&sender_value=${encodeURIComponent(item.input)}`} />
        </div>
      </div>
    </div>
  );
}

export function ResultForItem({ item, result }) {
  if (item.kind === "url") return <UrlResult item={item} />;
  if (item.kind === "sender") return <SenderResult item={item} result={result} />;
  return <MessageResult item={item} result={result} />;
}
