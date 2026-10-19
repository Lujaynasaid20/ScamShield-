"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EvidenceList, ReportSummary, Timeline } from "@/components/ReportDetail";
import { ErrorState, Loading, Notice, PageHeader, useApiData, useConfirm, useToast } from "@/components/ui";
import { api } from "@/lib/api-client";
import { REPORT_STATUSES } from "@/lib/constants";

function ReviewForm({ report, onSaved }) {
  const toast = useToast();
  const [status, setStatus] = useState(report.status);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setStatus(report.status), [report.status]);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    try {
      const { item } = await api(`/api/admin/reports/${report.id}`, { method: "PATCH", body: { status, feedback } });
      setFeedback("");
      toast("Report updated. The reporter has been notified.", "success");
      onSaved(item);
    } catch (error) { toast(error.message, "error"); } finally { setBusy(false); }
  };

  return (
    <form className="card-panel" onSubmit={submit}>
      <h2 className="h6">Review decision</h2>
      <label className="form-label" htmlFor="review-status">Status</label>
      <select id="review-status" className="form-select" value={status} onChange={event => setStatus(event.target.value)}>
        {Object.entries(REPORT_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <label className="form-label mt-3" htmlFor="review-feedback">Feedback to the reporter <span className="muted fw-normal">(optional)</span></label>
      <textarea id="review-feedback" className="form-control" rows={3} maxLength={2000} value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="Explain the decision or ask for more information." />
      <div className="form-hint">The reporter sees status changes and feedback in their report and gets a notification.</div>
      <button type="submit" className="btn btn-primary mt-3" disabled={busy || (status === report.status && !feedback.trim())}>Save decision</button>
    </form>
  );
}

function AlertForm({ report }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState({ title: "", body: "" });
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    if (!(await confirm({ title: "Send this alert to all users?", body: "Every user with scam alerts turned on will receive it as a notification. It cannot be unsent.", confirmLabel: "Publish alert" }))) return;
    setBusy(true);
    try {
      const result = await api("/api/admin/alerts", { method: "POST", body: { ...form, report_id: report.id } });
      setForm({ title: "", body: "" });
      toast(`Alert sent to ${result.recipients} user${result.recipients === 1 ? "" : "s"}.`, "success");
    } catch (error) { toast(error.message, "error"); } finally { setBusy(false); }
  };
  return (
    <form className="card-panel" onSubmit={submit}>
      <h2 className="h6"><i className="bi bi-megaphone me-1" aria-hidden="true" />Publish a confirmed scam alert</h2>
      <p className="small muted">Warn users about the pattern in this verified report. Describe the pattern; never include the reporter's personal details.</p>
      <label className="form-label" htmlFor="alert-title">Title</label>
      <input id="alert-title" className="form-control" maxLength={200} required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="e.g. Fake 'customer care' calls asking for PINs" />
      <label className="form-label mt-2" htmlFor="alert-body">Alert text</label>
      <textarea id="alert-body" className="form-control" rows={3} maxLength={2000} required value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} placeholder="What the scam looks like and what users should do." />
      <button type="submit" className="btn btn-navy mt-3" disabled={busy}>Publish alert</button>
    </form>
  );
}

export default function AdminReportDetailPage() {
  const { id } = useParams();
  const { data, error, loading, reload, setData } = useApiData(`/api/reports/${id}`);
  const report = data?.item;
  return (
    <>
      <PageHeader eyebrow={<Link href="/admin/reports" className="text-decoration-none"><i className="bi bi-arrow-left" aria-hidden="true" /> Review reports</Link>} title={report ? `Report #${report.id}` : "Report"} />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {report && (
        <div className="grid grid-main-side">
          <div className="stack">
            <ReportSummary report={report} showReporter />
            <Notice tone="warn" icon="bi-shield-exclamation">Evidence files can contain personal information. Download them only to investigate this report; each download is recorded in the audit log.</Notice>
            <EvidenceList report={report} />
          </div>
          <div className="stack">
            <ReviewForm report={report} onSaved={item => setData({ item })} />
            {["verified", "resolved"].includes(report.status) && <AlertForm report={report} />}
            <Timeline report={report} />
          </div>
        </div>
      )}
    </>
  );
}
