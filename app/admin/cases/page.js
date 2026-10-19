"use client";

import { useEffect, useState } from "react";
import { EmptyState, ErrorState, KindChip, Loading, PageHeader, Pagination, useApiData, VerdictBadge } from "@/components/ui";
import { formatDate } from "@/lib/api-client";

export default function AdminCasesPage() {
  const [filters, setFilters] = useState({ kind: "", verdict: "", q: "" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => { const timer = setTimeout(() => { setFilters(current => ({ ...current, q: search.trim() })); setPage(1); }, 350); return () => clearTimeout(timer); }, [search]);
  const params = new URLSearchParams(Object.entries({ ...filters, page }).filter(([, value]) => value !== "")).toString();
  const { data, error, loading, reload } = useApiData(`/api/admin/cases?${params}`);
  const update = patch => { setFilters(current => ({ ...current, ...patch })); setPage(1); };

  return (
    <>
      <PageHeader eyebrow={<><i className="bi bi-collection" aria-hidden="true" />Administration</>} title="Scam database" description="Analyzed messages, URL scans and sender checks across all accounts." />
      <div className="card-panel">
        <div className="toolbar mb-3">
          <div className="grow"><label className="visually-hidden" htmlFor="case-search">Search</label><input id="case-search" type="search" className="form-control w-100" placeholder="Search content or account email" value={search} onChange={event => setSearch(event.target.value)} /></div>
          <label className="visually-hidden" htmlFor="case-kind">Type</label>
          <select id="case-kind" className="form-select" value={filters.kind} onChange={event => update({ kind: event.target.value })}><option value="">All types</option><option value="message">Messages</option><option value="url">URL scans</option><option value="sender">Sender checks</option></select>
          <label className="visually-hidden" htmlFor="case-verdict">Result</label>
          <select id="case-verdict" className="form-select" value={filters.verdict} onChange={event => update({ verdict: event.target.value })}><option value="">All results</option><option value="scam">Scam / high</option><option value="suspicious">Suspicious</option><option value="safe">Safe / low</option></select>
        </div>
        {error && <ErrorState message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && (data.items.length ? (
          <>
            <div className="small-print mb-1">{data.total} record{data.total === 1 ? "" : "s"}</div>
            {data.items.map(item => (
              <div className="list-row" key={item.id}>
                <div className="list-row-main"><strong>{item.input}</strong><small>{item.owner_email} · {item.categoryLabel} · {formatDate(item.created_at)}{item.kind !== "sender" ? ` · ${item.score}/100` : ""}</small></div>
                <div className="list-row-meta"><KindChip kind={item.kind} /><VerdictBadge verdict={item.verdict} kind={item.kind} /></div>
              </div>
            ))}
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </>
        ) : <EmptyState icon="bi-collection" title="No records found" body="Analyses from all users appear here." />)}
      </div>
    </>
  );
}
