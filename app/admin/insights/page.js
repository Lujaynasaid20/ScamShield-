"use client";

import { BarList } from "@/components/charts";
import { EmptyState, ErrorState, Loading, PageHeader, StatTile, useApiData } from "@/components/ui";
import { formatDate } from "@/lib/api-client";
import { REPORT_STATUSES } from "@/lib/constants";

export default function AdminInsightsPage() {
  const { data, error, loading, reload } = useApiData("/api/admin/overview");
  const alerts = useApiData("/api/admin/alerts");

  return (
    <>
      <PageHeader eyebrow={<><i className="bi bi-graph-up" aria-hidden="true" />Administration</>} title="Scam trends and detection performance" description="Report outcomes, URL detections and published scam alerts." />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && (
        <div className="stack">
          <div className="grid grid-4">
            <StatTile icon="bi-patch-check" tone="danger" label="Verified reports" value={data.reports.verified} sub="Confirmed by an administrator" />
            <StatTile icon="bi-x-circle" label="Rejected reports" value={data.reports.rejected} sub="Not a scam / insufficient evidence" />
            <StatTile icon="bi-percent" label="Verification rate" value={data.outcomes.verifiedRate === null ? "–" : `${data.outcomes.verifiedRate}%`} sub={`Of ${data.outcomes.decided} decided reports`} />
            <StatTile icon="bi-megaphone" label="Alerts published" value={data.alerts} sub="Sent to users" />
          </div>
          <div className="grid grid-3">
            <section className="card-panel">
              <h2>Report outcomes</h2>
              <BarList items={Object.entries(REPORT_STATUSES).map(([key, label]) => ({ label, count: data.reports[key] })).filter(item => item.count > 0)} emptyText="No reports yet." />
            </section>
            <section className="card-panel">
              <h2>URL detections</h2>
              <BarList items={[
                { label: "High risk (heuristics)", count: data.analyses.urls_high },
                { label: "Some warning signs", count: data.analyses.urls_medium },
                { label: "On threat-intelligence lists", count: data.analyses.urls_listed },
                { label: "No warning signs", count: data.analyses.urls - data.analyses.urls_high - data.analyses.urls_medium }
              ].filter(item => item.count > 0)} emptyText="No URLs scanned yet." />
            </section>
            <section className="card-panel">
              <h2>Message results</h2>
              <BarList items={[{ label: "Scam", count: data.analyses.scam }, { label: "Suspicious", count: data.analyses.suspicious }, { label: "Safe", count: data.analyses.safe }].filter(item => item.count > 0)} emptyText="No messages analyzed yet." />
            </section>
          </div>
          <div className="grid grid-2">
            <section className="card-panel"><h2>Scam trends: reported categories</h2><BarList items={data.reportCategories.map(row => ({ label: row.category, count: row.count }))} emptyText="No reports yet." /></section>
            <section className="card-panel">
              <h2>Published scam alerts</h2>
              {alerts.data?.items.length ? alerts.data.items.map(alert => (
                <div className="list-row" key={alert.id}>
                  <span className="row-icon tone-danger"><i className="bi bi-megaphone" aria-hidden="true" /></span>
                  <div className="list-row-main"><strong>{alert.title}</strong><small>{alert.category} · from report #{alert.report_id} · {formatDate(alert.created_at)} · {alert.author || "Administrator"}</small></div>
                </div>
              )) : alerts.loading ? <Loading /> : <EmptyState icon="bi-megaphone" title="No alerts published" body="Open a verified report to publish an alert about its scam pattern." />}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
