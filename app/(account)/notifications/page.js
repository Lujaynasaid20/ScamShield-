"use client";

import Link from "next/link";
import { useState } from "react";
import { useShell } from "@/components/AppShell";
import { EmptyState, ErrorState, Loading, PageHeader, Pagination, useApiData, useToast } from "@/components/ui";
import { api, formatDate, timeAgo } from "@/lib/api-client";
import { NOTIFICATION_TYPES } from "@/lib/constants";

export default function NotificationsPage() {
  const toast = useToast();
  const { refreshUnread } = useShell();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const { data, error, loading, reload, setData } = useApiData(`/api/notifications?page=${page}&filter=${filter}`);

  const mark = async (body, local) => {
    try {
      const result = await api("/api/notifications", { method: "PATCH", body });
      setData(current => ({ ...current, unread: result.unread, items: current.items.map(local) }));
      refreshUnread();
      if (filter === "unread") reload();
    } catch (requestError) { toast(requestError.message, "error"); }
  };
  const now = new Date().toISOString();

  return (
    <>
      <PageHeader
        eyebrow={<><i className="bi bi-bell" aria-hidden="true" />Notifications</>}
        title="Notifications"
        description="Updates about your reports, analyses, new lessons, confirmed scam alerts and account security."
        actions={<>
          <Link href="/settings#notifications" className="btn btn-outline"><i className="bi bi-sliders" aria-hidden="true" />Preferences</Link>
          <button type="button" className="btn btn-primary" disabled={!data?.unread} onClick={() => mark({ all: true }, item => ({ ...item, read_at: item.read_at || now }))}><i className="bi bi-check2-all" aria-hidden="true" />Mark all as read</button>
        </>}
      />
      <div className="card-panel">
        <div className="toolbar mb-2">
          <div className="segmented" role="group" aria-label="Filter notifications">
            <button type="button" aria-pressed={filter === "all"} onClick={() => { setFilter("all"); setPage(1); }}>All</button>
            <button type="button" aria-pressed={filter === "unread"} onClick={() => { setFilter("unread"); setPage(1); }}>Unread{data?.unread ? ` (${data.unread})` : ""}</button>
          </div>
        </div>
        {error && <ErrorState message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && (data.items.length ? (
          <>
            {data.items.map(item => {
              const type = NOTIFICATION_TYPES[item.type];
              return (
                <div key={item.id} className={`notification-item ${item.read_at ? "" : "unread"}`}>
                  <span className={`row-icon ${item.type === "threat_alert" ? "tone-danger" : item.type === "security" ? "tone-warn" : ""}`}><i className={`bi ${type?.icon || "bi-bell"}`} aria-hidden="true" /></span>
                  <div className="min-w-0 flex-grow-1">
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      {!item.read_at && <span className="unread-dot" aria-label="Unread" />}
                      <span className="notification-title break-anywhere">{item.title}</span>
                    </div>
                    {item.body && <div className="small muted break-anywhere">{item.body}</div>}
                    <div className="small-print"><span title={formatDate(item.created_at)}>{timeAgo(item.created_at)}</span> · {type?.label}</div>
                  </div>
                  <div className="d-flex gap-1 flex-wrap justify-content-end align-items-start">
                    {item.link && <Link href={item.link} className="btn btn-outline btn-sm" onClick={() => !item.read_at && mark({ ids: [item.id] }, entry => (entry.id === item.id ? { ...entry, read_at: now } : entry))}>Open</Link>}
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => mark(item.read_at ? { ids: [item.id], unread: true } : { ids: [item.id] }, entry => (entry.id === item.id ? { ...entry, read_at: item.read_at ? null : now } : entry))}>
                      {item.read_at ? "Mark unread" : "Mark read"}
                    </button>
                  </div>
                </div>
              );
            })}
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </>
        ) : (
          <EmptyState icon="bi-bell-slash" title={filter === "unread" ? "You're all caught up" : "No notifications yet"} body={filter === "unread" ? "You have no unread notifications." : "You'll be notified when your reports change status, new lessons arrive, or an administrator confirms a scam pattern."} />
        ))}
      </div>
    </>
  );
}
