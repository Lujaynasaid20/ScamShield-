"use client";

import Link from "next/link";
import { ActivityChart, BarList } from "@/components/charts";
import { EmptyState, ErrorState, Loading, PageHeader, StatTile, StatusBadge, useApiData } from "@/components/ui";
import { timeAgo } from "@/lib/api-client";

export default function AdminDashboardPage() {
  const { data, error, loading, reload } = useApiData("/api/admin/overview");

  return (
    <>
      <PageHeader
        eyebrow={<><i className="bi bi-grid-1x2" aria-hidden="true" />Overview</>}
        title="Admin dashboard"
        description="Project-wide view of checks, community reports and outcomes, from live database records."
        actions={<Link href="/admin/reports?status=open" className="btn btn-primary"><i className="bi bi-flag" aria-hidden="true" />Review open reports</Link>}
      />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && (
        <div className="stack">
          <div className="grid grid-4">
            <StatTile icon="bi-chat-left-text" label="Messages checked" value={data.analyses.messages} sub={`${data.analyses.scam} scam · ${data.analyses.suspicious} suspicious`} />
            <StatTile icon="bi-link-45deg" label="URLs scanned" value={data.analyses.urls} sub={`${data.analyses.urls_high} high risk · ${data.analyses.urls_listed} on threat lists`} />
            <StatTile icon="bi-flag" tone="warn" label="Open reports" value={data.reports.open} sub={`${data.reports.total} reports in total`} />
            <StatTile icon="bi-people" label="Users" value={data.users.users} sub={`${data.users.new_this_week} new this week · ${data.users.admins} admin${data.users.admins === 1 ? "" : "s"}`} />
          </div>
          <div className="grid grid-main-side">
            <section className="card-panel" aria-labelledby="admin-activity-title">
              <div className="panel-title"><h2 id="admin-activity-title">Risk activity</h2><span className="small-print">All checks, last 14 days</span></div>
              <ActivityChart daily={data.daily} />
            </section>
            <section className="card-panel" aria-labelledby="recent-reports-title">
              <div className="panel-title"><h2 id="recent-reports-title">Recent reports</h2><Link href="/admin/reports" className="small fw-semibold">View all</Link></div>
              {data.recentReports.length ? data.recentReports.map(report => (
                <Link href={`/admin/reports/${report.id}`} className="list-row" key={report.id}>
                  <span className="row-icon"><i className="bi bi-flag" aria-hidden="true" /></span>
                  <div className="list-row-main"><strong>{report.category}</strong><small>{report.reporter_email} · {timeAgo(report.created_at)}</small></div>
                  <StatusBadge status={report.status} />
                </Link>
              )) : <EmptyState icon="bi-inbox" title="No reports yet" body="Submitted reports appear here." />}
            </section>
          </div>
          <div className="grid grid-2">
            <section className="card-panel"><h2>Reported scam categories</h2><BarList items={data.reportCategories.map(row => ({ label: row.category, count: row.count }))} emptyText="No reports yet." /></section>
            <section className="card-panel"><h2>Detected categories (suspicious + scam messages)</h2><BarList items={data.detectionCategories} emptyText="No risky messages analyzed yet." /></section>
          </div>
        </div>
      )}
    </>
  );
}
