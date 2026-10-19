"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { EmptyState, ErrorState, Loading, PageHeader, Pagination, StatusBadge, useApiData } from "@/components/ui";
import { formatDate } from "@/lib/api-client";
import { REPORT_STATUSES } from "@/lib/constants";

function AdminReports() {
  const params = useSearchParams();
  const [status, setStatus] = useState(params.get("status") || "");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350); return () => clearTimeout(timer); }, [search]);
  const { data, error, loading, reload } = useApiData(`/api/admin/reports?page=${page}${status ? `&status=${status}` : ""}${query ? `&q=${encodeURIComponent(query)}` : ""}`);

  return (
    <>
      <PageHeader eyebrow={<><i className="bi bi-flag" aria-hidden="true" />Administration</>} title="Review reported scams" description="Open a report to inspect details and evidence, change its status and send feedback to the reporter." />
      <div className="card-panel">
        <div className="toolbar mb-3">
          <div className="grow"><label className="visually-hidden" htmlFor="report-search">Search reports</label><input id="report-search" type="search" className="form-control w-100" placeholder="Search description, sender, link or reporter email" value={search} onChange={event => setSearch(event.target.value)} /></div>
          <label className="visually-hidden" htmlFor="report-status">Status</label>
          <select id="report-status" className="form-select" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
            <option value="">All statuses</option><option value="open">Open (submitted + under review)</option>
            {Object.entries(REPORT_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        {error && <ErrorState message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && (data.items.length ? (
          <>
            <div className="small-print mb-1">{data.total} report{data.total === 1 ? "" : "s"}</div>
            {data.items.map(report => (
              <Link href={`/admin/reports/${report.id}`} className="list-row" key={report.id}>
                <div className="list-row-main">
                  <strong>#{report.id} · {report.category}</strong>
                  <small>{report.details}</small>
                  <small>{report.reporter_email} · {formatDate(report.created_at)}{report.evidence_count ? ` · ${report.evidence_count} file${report.evidence_count === 1 ? "" : "s"}` : ""}{report.sender_value ? ` · Sender: ${report.sender_value}` : ""}</small>
                </div>
                <StatusBadge status={report.status} />
              </Link>
            ))}
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </>
        ) : <EmptyState icon="bi-inbox" title="No reports found" body={status || query ? "Try a different status or search." : "Reports submitted by users will appear here."} />)}
      </div>
    </>
  );
}

export default function AdminReportsPage() {
  return <Suspense><AdminReports /></Suspense>;
}
