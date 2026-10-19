"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorState, Loading, PageHeader, Pagination, StatusBadge, useApiData } from "@/components/ui";
import { formatDate } from "@/lib/api-client";
import { REPORT_STATUSES } from "@/lib/constants";

export default function ReportsPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApiData(`/api/reports?page=${page}&pageSize=10${status ? `&status=${status}` : ""}`);

  return (
    <>
      <PageHeader
        eyebrow={<><i className="bi bi-flag" aria-hidden="true" />My records</>}
        title="My scam reports"
        description="Incidents you've reported for investigation. Track their status and read feedback from administrators. (Your own checks live in Scam History.)"
        actions={<Link href="/reports/new" className="btn btn-primary"><i className="bi bi-plus-lg" aria-hidden="true" />Report a scam</Link>}
      />
      <div className="card-panel">
        <div className="toolbar mb-3">
          <div className="segmented" role="group" aria-label="Filter by status">
            {[["", "All"], ...Object.entries(REPORT_STATUSES)].map(([value, label]) => (
              <button key={value} type="button" aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }}>{label}</button>
            ))}
          </div>
        </div>
        {error && <ErrorState message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && (data.items.length ? (
          <>
            {data.items.map(report => (
              <Link href={`/reports/${report.id}`} className="list-row" key={report.id}>
                <span className="row-icon"><i className="bi bi-flag" aria-hidden="true" /></span>
                <div className="list-row-main">
                  <strong>#{report.id} · {report.category}</strong>
                  <small>{report.details}</small>
                  <small>Submitted {formatDate(report.created_at)}{report.updated_at !== report.created_at ? ` · Updated ${formatDate(report.updated_at)}` : ""}{report.evidence_count ? ` · ${report.evidence_count} file${report.evidence_count === 1 ? "" : "s"}` : ""}</small>
                </div>
                <div className="list-row-meta">
                  {report.admin_feedback && <span className="badge-status tone-info"><i className="bi bi-chat-left-dots" aria-hidden="true" />Feedback</span>}
                  <StatusBadge status={report.status} />
                </div>
              </Link>
            ))}
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </>
        ) : status ? (
          <EmptyState icon="bi-funnel" title={`No ${REPORT_STATUSES[status].toLowerCase()} reports`} body="Choose another status to see more reports." />
        ) : (
          <EmptyState icon="bi-flag" title="You haven't reported any scams yet" body="If you've received a scam message, call or link, reporting it helps administrators confirm patterns and warn other users." action={<Link href="/reports/new" className="btn btn-primary btn-sm">Report a scam</Link>} />
        ))}
      </div>
    </>
  );
}
