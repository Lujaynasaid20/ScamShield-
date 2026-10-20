"use client";

import { useEffect, useState } from "react";
import { EmptyState, ErrorState, Loading, Notice, PageHeader, Pagination, useApiData, useConfirm, useToast } from "@/components/ui";
import { api, formatDate } from "@/lib/api-client";

const EMPTY_FORM = { type: "phone", value: "", business_name: "", source: "" };

export default function VerifiedSendersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350); return () => clearTimeout(timer); }, [search]);
  const { data, error, loading, reload } = useApiData(`/api/admin/verified-senders?page=${page}${query ? `&q=${encodeURIComponent(query)}` : ""}`);
  const set = field => event => setForm(current => ({ ...current, [field]: event.target.value }));

  const add = async event => {
    event.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      await api("/api/admin/verified-senders", { method: "POST", body: form });
      setForm(current => ({ ...EMPTY_FORM, type: current.type }));
      toast("Added to the verified business directory.", "success");
      reload();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async entry => {
    if (!(await confirm({ title: "Remove from directory?", body: `${entry.value} will no longer show as a verified contact for ${entry.business_name}.`, confirmLabel: "Remove", danger: true }))) return;
    try { await api(`/api/admin/verified-senders/${entry.id}`, { method: "DELETE" }); toast("Removed from the directory.", "success"); reload(); } catch (requestError) { toast(requestError.message, "error"); }
  };

  return (
    <>
      <PageHeader eyebrow={<><i className="bi bi-patch-check" aria-hidden="true" />Administration</>} title="Verified business directory" description="Official phone numbers and email addresses of real businesses. The Sender Checker shows these as Verified Business." />
      <div className="grid grid-main-side">
        <form className="card-panel" onSubmit={add} noValidate>
          <h2 className="h6">Add an official contact</h2>
          <div className="field">
            <label className="form-label" htmlFor="vs-type">Type</label>
            <select id="vs-type" className="form-select" value={form.type} onChange={set("type")}>
              <option value="phone">Phone number</option><option value="email">Email address</option>
            </select>
          </div>
          <div className="field">
            <label className="form-label" htmlFor="vs-value">{form.type === "phone" ? "Phone number, with country code" : "Email address"}</label>
            <input id="vs-value" className="form-control" maxLength={200} autoComplete="off" required value={form.value} onChange={set("value")} placeholder={form.type === "phone" ? "+255 754 123 456" : "support@example.co.tz"} />
          </div>
          <div className="field">
            <label className="form-label" htmlFor="vs-name">Business name</label>
            <input id="vs-name" className="form-control" maxLength={120} required value={form.business_name} onChange={set("business_name")} placeholder="e.g. Example Bank Tanzania" />
          </div>
          <div className="field">
            <label className="form-label" htmlFor="vs-source">Where you confirmed it</label>
            <input id="vs-source" className="form-control" maxLength={300} required value={form.source} onChange={set("source")} placeholder="e.g. Contact page on the bank's official website" />
            <div className="form-hint">Users see this source. Use a source the business controls: its website, app, card or statement.</div>
          </div>
          {formError && <div className="alert-box tone-danger mt-3" role="alert"><i className="bi bi-exclamation-octagon" aria-hidden="true" /><div>{formError}</div></div>}
          <button type="submit" className="btn btn-navy mt-3" disabled={busy}>{busy ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className="bi bi-plus-lg" aria-hidden="true" />}Add to directory</button>
        </form>
        <Notice tone="warn" icon="bi-shield-exclamation">
          <strong>Only add contacts you've confirmed yourself</strong> from a source the business controls. Never add a number because a caller or message said it was official.
        </Notice>
      </div>
      <div className="card-panel mt-4">
        <div className="toolbar mb-3"><div className="grow"><label className="visually-hidden" htmlFor="vs-search">Search directory</label><input id="vs-search" type="search" className="form-control w-100" placeholder="Search by business, number or email" value={search} onChange={event => setSearch(event.target.value)} /></div></div>
        {error && <ErrorState message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && (data.items.length ? (
          <>
            <div className="small-print mb-1">{data.total} contact{data.total === 1 ? "" : "s"}</div>
            {data.items.map(entry => (
              <div className="list-row" key={entry.id}>
                <div className="list-row-main">
                  <strong>{entry.business_name}</strong>
                  <small><i className={`bi ${entry.type === "phone" ? "bi-telephone" : "bi-envelope"}`} aria-hidden="true" /> <span className="mono">{entry.value}</span></small>
                  <small>Source: {entry.source} · Added {formatDate(entry.created_at, { time: false })}{entry.added_by ? ` by ${entry.added_by}` : ""}</small>
                </div>
                <div className="list-row-meta"><button type="button" className="btn btn-danger-soft btn-sm" onClick={() => remove(entry)} aria-label={`Remove ${entry.value}`}><i className="bi bi-trash" aria-hidden="true" />Remove</button></div>
              </div>
            ))}
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </>
        ) : <EmptyState icon="bi-patch-check" title={query ? "No matching contacts" : "No verified contacts yet"} body={query ? "Try a different search." : "Add official numbers and email addresses of banks, mobile-money providers and other businesses users often hear from."} />)}
      </div>
    </>
  );
}
