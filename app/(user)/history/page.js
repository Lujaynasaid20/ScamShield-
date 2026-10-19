"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { EmptyState, ErrorState, KindChip, Loading, PageHeader, Pagination, useApiData, useConfirm, useToast, VerdictBadge } from "@/components/ui";
import { api, formatDate } from "@/lib/api-client";

const VERDICTS = [["", "All results"], ["scam", "Scam"], ["suspicious", "Suspicious"], ["safe", "Safe"]];

function History() {
  const params = useSearchParams();
  const toast = useToast();
  const confirm = useConfirm();
  const [filters, setFilters] = useState(() => ({
    q: "",
    verdict: VERDICTS.some(([value]) => value && value === params.get("verdict")) ? params.get("verdict") : "",
    kind: ["message", "url", "sender"].includes(params.get("kind")) ? params.get("kind") : "",
    sort: "newest",
    page: 1
  }));
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setFilters(current => (current.q === search.trim() ? current : { ...current, q: search.trim(), page: 1 })), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const query = new URLSearchParams(Object.entries({ ...filters, pageSize: 10 }).filter(([, value]) => value !== "")).toString();
  const { data, error, loading, reload } = useApiData(`/api/history?${query}`);
  const update = patch => setFilters(current => ({ ...current, ...patch, page: patch.page ?? 1 }));
  const filtered = filters.q || filters.verdict || filters.kind;

  const remove = async item => {
    if (!(await confirm({ title: "Delete this entry?", body: "This removes it from your Scam History permanently. Reports you submitted are not affected.", confirmLabel: "Delete", danger: true }))) return;
    try { await api(`/api/history/${item.id}`, { method: "DELETE" }); toast("Entry deleted.", "success"); reload(); } catch (requestError) { toast(requestError.message, "error"); }
  };
  const clearAll = async () => {
    if (!(await confirm({ title: "Clear your entire Scam History?", body: `All ${data.total} saved analyses, URL scans and sender checks will be permanently deleted. This can't be undone.`, confirmLabel: "Clear history", danger: true }))) return;
    try { await api("/api/history", { method: "DELETE" }); toast("Your Scam History was cleared.", "success"); update({}); reload(); } catch (requestError) { toast(requestError.message, "error"); }
  };

  return (
    <>
      <PageHeader
        eyebrow={<><i className="bi bi-clock-history" aria-hidden="true" />My records</>}
        title="Scam history"
        description="Every message analysis, URL scan and sender check you've saved. Only you can see these."
        actions={data?.total > 0 && !filtered ? <button type="button" className="btn btn-danger-soft" onClick={clearAll}><i className="bi bi-trash" aria-hidden="true" />Clear history</button> : null}
      />
      <div className="card-panel">
        <div className="toolbar mb-3">
          <div className="grow position-relative">
            <label className="visually-hidden" htmlFor="history-search">Search history</label>
            <input id="history-search" className="form-control w-100" type="search" placeholder="Search messages, links or senders" value={search} onChange={event => setSearch(event.target.value)} />
          </div>
          <div className="segmented" role="group" aria-label="Filter by result">
            {VERDICTS.map(([value, label]) => <button key={value} type="button" aria-pressed={filters.verdict === value} onClick={() => update({ verdict: value })}>{label}</button>)}
          </div>
          <label className="visually-hidden" htmlFor="history-kind">Type</label>
          <select id="history-kind" className="form-select" value={filters.kind} onChange={event => update({ kind: event.target.value })}>
            <option value="">All types</option><option value="message">Messages</option><option value="url">URL scans</option><option value="sender">Sender checks</option>
          </select>
          <label className="visually-hidden" htmlFor="history-sort">Sort</label>
          <select id="history-sort" className="form-select" value={filters.sort} onChange={event => update({ sort: event.target.value })}>
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
          </select>
        </div>
        {error && <ErrorState message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && (data.items.length ? (
          <>
            <div className="small-print mb-1" aria-live="polite">{data.total} result{data.total === 1 ? "" : "s"}</div>
            {data.items.map(item => (
              <div className="list-row" key={item.id}>
                <div className="list-row-main">
                  <Link href={`/history/${item.id}`} className="text-reset text-decoration-none"><strong>{item.input}</strong></Link>
                  <small>{item.categoryLabel} · {formatDate(item.created_at)}{item.kind !== "sender" ? ` · ${item.score}/100` : ""}</small>
                </div>
                <div className="list-row-meta">
                  <KindChip kind={item.kind} />
                  <VerdictBadge verdict={item.verdict} kind={item.kind} />
                  <Link href={`/history/${item.id}`} className="btn btn-outline btn-sm">View</Link>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => remove(item)} aria-label={`Delete entry from ${formatDate(item.created_at)}`}><i className="bi bi-trash" aria-hidden="true" /></button>
                </div>
              </div>
            ))}
            <Pagination page={data.page} totalPages={data.totalPages} onChange={page => setFilters(current => ({ ...current, page }))} />
          </>
        ) : filtered ? (
          <EmptyState icon="bi-funnel" title="No matching entries" body="Try a different search or clear the filters." action={<button type="button" className="btn btn-outline btn-sm" onClick={() => { setSearch(""); setFilters({ q: "", verdict: "", kind: "", sort: "newest", page: 1 }); }}>Clear filters</button>} />
        ) : (
          <EmptyState icon="bi-clock-history" title="Your history is empty" body="Analyze a message, scan a link or check a sender, and the results will be saved here for you to review." action={<div className="d-flex gap-2 justify-content-center flex-wrap"><Link href="/analyze" className="btn btn-primary btn-sm">Analyze a message</Link><Link href="/urls" className="btn btn-outline btn-sm">Scan a link</Link></div>} />
        ))}
      </div>
    </>
  );
}

export default function HistoryPage() {
  return <Suspense><History /></Suspense>;
}
