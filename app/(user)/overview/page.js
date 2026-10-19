"use client";

import Link from "next/link";
import { ActivityChart, BarList } from "@/components/charts";
import { EmptyState, ErrorState, KindChip, Loading, PageHeader, StatTile, useApiData, VerdictBadge } from "@/components/ui";
import { useShell } from "@/components/AppShell";
import { timeAgo } from "@/lib/api-client";

export default function OverviewPage() {
  const { profile } = useShell();
  const { data, error, loading, reload } = useApiData("/api/overview");
  const firstName = profile.display_name.split(" ")[0];

  return (
    <>
      <PageHeader
        eyebrow={<><i className="bi bi-speedometer2" aria-hidden="true" />Security overview</>}
        title={`Hello, ${firstName}`}
        description="Your personal scam-protection summary, based on the checks and reports in your account."
        actions={<Link href="/analyze" className="btn btn-primary"><i className="bi bi-chat-left-text" aria-hidden="true" />Analyze a message</Link>}
      />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && (
        <div className="stack">
          <div className="grid grid-4">
            <StatTile icon="bi-chat-left-text" label="Messages analyzed" value={data.totals.messages} sub={`${data.totals.senders} sender check${data.totals.senders === 1 ? "" : "s"}`} />
            <StatTile icon="bi-x-octagon" tone="danger" label="Scam messages" value={data.totals.scam} sub="Rated Scam" />
            <StatTile icon="bi-exclamation-triangle" tone="warn" label="Suspicious messages" value={data.totals.suspicious} sub="Rated Suspicious" />
            <StatTile icon="bi-check-circle" tone="safe" label="Safe messages" value={data.totals.safe} sub="No strong warning signs" />
            <StatTile icon="bi-link-45deg" label="URLs scanned" value={data.totals.urls} sub={`${data.totals.risky_urls} with warning signs`} />
            <StatTile icon="bi-flag" label="Reports submitted" value={data.reports.total} sub={`${data.reports.open} awaiting review`} />
            <StatTile icon="bi-mortarboard" label="Academy progress" value={`${data.academy.completed}/${data.academy.total}`} sub="Modules completed" />
            <StatTile icon={data.twoFactor ? "bi-shield-lock-fill" : "bi-shield-exclamation"} tone={data.twoFactor ? "safe" : "warn"} label="Two-factor sign-in" value={data.twoFactor ? "On" : "Off"} sub={data.twoFactor ? "Account protected" : <Link href="/settings#security">Turn it on</Link>} />
          </div>

          <div className="grid grid-main-side">
            <section className="card-panel" aria-labelledby="activity-title">
              <div className="panel-title"><h2 id="activity-title">Analysis activity</h2><span className="small-print">Last 14 days</span></div>
              <ActivityChart daily={data.daily} />
            </section>
            <section className="card-panel" aria-labelledby="recommend-title">
              <h2 id="recommend-title">Recommended for you</h2>
              {data.recommendations.map(item => (
                <div className="list-row" key={item.title}>
                  <span className="row-icon"><i className={`bi ${item.icon}`} aria-hidden="true" /></span>
                  <div className="min-w-0 flex-grow-1">
                    <strong className="d-block">{item.title}</strong>
                    <small className="muted d-block">{item.body}</small>
                    <Link href={item.href} className="small fw-semibold">{item.action} <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
                  </div>
                </div>
              ))}
            </section>
          </div>

          <div className="grid grid-2">
            <section className="card-panel" aria-labelledby="recent-title">
              <div className="panel-title"><h2 id="recent-title">Recent activity</h2><Link href="/history" className="small fw-semibold">View history</Link></div>
              {data.recent.length ? data.recent.map(item => (
                <Link href={`/history/${item.id}`} className="list-row" key={item.id}>
                  <div className="list-row-main"><strong>{item.input}</strong><small>{item.categoryLabel} · {timeAgo(item.created_at)}</small></div>
                  <div className="list-row-meta"><KindChip kind={item.kind} /><VerdictBadge verdict={item.verdict} kind={item.kind} /></div>
                </Link>
              )) : (
                <EmptyState icon="bi-activity" title="Nothing checked yet" body="When you analyze a message, scan a link or check a sender, it will appear here." action={<Link href="/analyze" className="btn btn-primary btn-sm">Check a message</Link>} />
              )}
            </section>
            <section className="card-panel" aria-labelledby="categories-title">
              <div className="panel-title"><h2 id="categories-title">Most detected scam categories</h2><span className="small-print">Suspicious + scam messages</span></div>
              <BarList items={data.categories} emptyText="No suspicious or scam messages detected yet. Categories will appear here once you've analyzed some." />
            </section>
          </div>
        </div>
      )}
    </>
  );
}
