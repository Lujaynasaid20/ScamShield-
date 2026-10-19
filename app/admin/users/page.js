"use client";

import { useEffect, useState } from "react";
import { EmptyState, ErrorState, Loading, PageHeader, Pagination, useApiData, useConfirm, useToast } from "@/components/ui";
import { api, formatDate } from "@/lib/api-client";

export default function AdminUsersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [email, setEmail] = useState("");
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350); return () => clearTimeout(timer); }, [search]);
  const { data, error, loading, reload } = useApiData(`/api/admin/users?page=${page}${query ? `&q=${encodeURIComponent(query)}` : ""}`);

  const promote = async event => {
    event.preventDefault();
    if (!(await confirm({ title: "Grant administrator access?", body: `${email} will be able to see all reports, evidence and analyses, and change report statuses.`, confirmLabel: "Grant access" }))) return;
    try { await api("/api/admin/promote", { method: "POST", body: { email } }); setEmail(""); toast("Administrator access granted.", "success"); reload(); } catch (requestError) { toast(requestError.message, "error"); }
  };

  return (
    <>
      <PageHeader eyebrow={<><i className="bi bi-people" aria-hidden="true" />Administration</>} title="Users" description="Registered accounts and their activity. Promote a registered user to administrator." />
      <form className="card-panel" onSubmit={promote}>
        <label className="form-label" htmlFor="promote-email">Promote a registered user by email</label>
        <div className="d-flex gap-2 flex-wrap">
          <input id="promote-email" className="form-control flex-grow-1" style={{ minWidth: 0, flexBasis: 220 }} type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="user@example.com" />
          <button type="submit" className="btn btn-navy">Promote to admin</button>
        </div>
        <div className="form-hint">The user must sign out and sign in through the Admin tab to use the admin area.</div>
      </form>
      <div className="card-panel">
        <div className="toolbar mb-3"><div className="grow"><label className="visually-hidden" htmlFor="user-search">Search users</label><input id="user-search" type="search" className="form-control w-100" placeholder="Search by name or email" value={search} onChange={event => setSearch(event.target.value)} /></div></div>
        {error && <ErrorState message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && (data.items.length ? (
          <>
            {data.items.map(user => (
              <div className="list-row" key={user.id}>
                <span className="avatar" aria-hidden="true">{(user.display_name || user.email).slice(0, 1).toUpperCase()}</span>
                <div className="list-row-main"><strong>{user.display_name || user.email}</strong><small>{user.email} · Joined {formatDate(user.created_at, { time: false })} · {user.analyses} checks · {user.reports} reports</small></div>
                <div className="list-row-meta">
                  {user.totp_enabled && <span className="badge-status tone-safe" title="Two-factor authentication on"><i className="bi bi-shield-lock" aria-hidden="true" />2FA</span>}
                  <span className={`badge-status ${user.role === "admin" ? "tone-info" : "tone-neutral"}`}>{user.role === "admin" ? "Administrator" : "User"}</span>
                </div>
              </div>
            ))}
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </>
        ) : <EmptyState icon="bi-people" title="No users found" />)}
      </div>
    </>
  );
}
