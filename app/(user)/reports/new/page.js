"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import EvidenceInput from "@/components/EvidenceInput";
import { Notice, PageHeader, useToast } from "@/components/ui";
import { api } from "@/lib/api-client";
import { CATEGORY_TO_REPORT, REPORT_CATEGORIES } from "@/lib/constants";

function ReportForm() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const caseId = params.get("case");
  const [form, setForm] = useState({
    category: "", details: "", message_text: "", url: "",
    sender_type: params.get("sender_type") || "phone", sender_value: params.get("sender_value") || "", claimed_identity: ""
  });
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const [linkedCase, setLinkedCase] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = field => event => setForm(current => ({ ...current, [field]: event.target.value }));

  // Pre-fill from an analysis in the user's history.
  useEffect(() => {
    if (!caseId) return;
    api(`/api/history/${caseId}`).then(({ item }) => {
      setLinkedCase(item);
      setForm(current => ({
        ...current,
        category: CATEGORY_TO_REPORT[item.category] || (item.kind === "url" ? "Phishing / fake link" : current.category),
        message_text: item.kind === "message" ? item.input : current.message_text,
        url: item.kind === "url" ? item.input : current.url,
        sender_type: item.kind === "sender" ? item.details.type : current.sender_type,
        sender_value: item.kind === "sender" ? item.input : current.sender_value,
        details: current.details || (item.kind === "message" ? `I received this message. ScamShield rated it ${item.verdictLabel} (${item.score}/100).` : item.kind === "url" ? `I received this link. ScamShield rated it ${item.score}/100.` : "")
      }));
    }).catch(() => toast("The linked analysis couldn't be loaded. You can still fill in the report.", "error"));
  }, [caseId, toast]);

  const submit = async event => {
    event.preventDefault();
    setError("");
    if (!form.category) { setError("Choose a scam category."); return; }
    if (!form.details.trim()) { setError("Describe what happened."); return; }
    setBusy(true);
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.set(key, value));
    if (!form.sender_value.trim()) body.delete("sender_type");
    if (linkedCase) body.set("case_id", linkedCase.id);
    files.forEach(file => body.append("evidence", file));
    try {
      const { item } = await api("/api/reports", { method: "POST", body });
      toast("Report submitted. You'll be notified when its status changes.", "success");
      router.push(`/reports/${item.id}`);
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.data?.report_id) setError(<>You already submitted this report. <Link href={`/reports/${requestError.data.report_id}`}>View it</Link>.</>);
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/reports" className="text-decoration-none"><i className="bi bi-arrow-left" aria-hidden="true" /> My scam reports</Link>}
        title="Report a scam"
        description="Tell us what happened. Administrators review reports, verify scam patterns and may publish alerts to warn other users."
      />
      <div className="grid grid-main-side">
        <form className="card-panel" onSubmit={submit} noValidate>
          {linkedCase && <Notice icon="bi-link-45deg">Linked to your {linkedCase.kind === "url" ? "URL scan" : linkedCase.kind === "sender" ? "sender check" : "message analysis"} from your history.</Notice>}
          <div className="field mt-2">
            <label className="form-label" htmlFor="category">Scam category <span className="text-danger" aria-hidden="true">*</span></label>
            <select id="category" className="form-select" required value={form.category} onChange={set("category")}>
              <option value="">Choose a category…</option>
              {REPORT_CATEGORIES.map(category => <option key={category}>{category}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="form-label" htmlFor="details">What happened? <span className="text-danger" aria-hidden="true">*</span></label>
            <textarea id="details" className="form-control" rows={4} maxLength={2000} required value={form.details} onChange={set("details")} placeholder="When did it happen, how were you contacted, and what were you asked to do?" />
            <div className="char-count">{form.details.length} / 2000</div>
          </div>
          <div className="field">
            <label className="form-label" htmlFor="message_text">Suspicious message <span className="muted fw-normal">(optional)</span></label>
            <textarea id="message_text" className="form-control" rows={3} maxLength={5000} value={form.message_text} onChange={set("message_text")} placeholder="Paste the message you received" />
          </div>
          <div className="field">
            <label className="form-label" htmlFor="url">Suspicious link <span className="muted fw-normal">(optional)</span></label>
            <input id="url" className="form-control" type="text" inputMode="url" maxLength={2048} spellCheck={false} value={form.url} onChange={set("url")} placeholder="https://…" />
          </div>
          <fieldset className="field">
            <legend className="form-label">Sender <span className="muted fw-normal">(optional)</span></legend>
            <div className="d-flex gap-2 flex-wrap">
              <label className="visually-hidden" htmlFor="sender_type">Sender type</label>
              <select id="sender_type" className="form-select" style={{ maxWidth: 170 }} value={form.sender_type} onChange={set("sender_type")}>
                <option value="phone">Phone number</option><option value="email">Email address</option><option value="name">Sender name</option>
              </select>
              <label className="visually-hidden" htmlFor="sender_value">Sender</label>
              <input id="sender_value" className="form-control flex-grow-1" style={{ minWidth: 0, flexBasis: 200 }} maxLength={200} value={form.sender_value} onChange={set("sender_value")} placeholder="Number, email or name used by the scammer" />
            </div>
            <label className="form-label mt-2" htmlFor="claimed_identity">Who did they claim to be? <span className="muted fw-normal">(optional)</span></label>
            <input id="claimed_identity" className="form-control" maxLength={120} value={form.claimed_identity} onChange={set("claimed_identity")} placeholder="e.g. John from KCB Bank, Safaricom customer care" />
            <div className="form-hint">Adding the sender lets other users find your report with the Sender Checker. They'll see only the category, status, date and the name the sender claimed to be.</div>
          </fieldset>
          <div className="field">
            <EvidenceInput files={files} onChange={(next, problem) => { setFiles(next); setFileError(problem); }} />
            {fileError && <div className="text-danger small mt-1">{fileError}</div>}
          </div>
          {error && <div className="alert-box tone-danger mt-3" role="alert"><i className="bi bi-exclamation-octagon" aria-hidden="true" /><div>{error}</div></div>}
          <div className="d-flex gap-2 mt-3 justify-content-end flex-wrap">
            <Link href="/reports" className="btn btn-outline">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className="bi bi-send" aria-hidden="true" />}Submit report</button>
          </div>
        </form>
        <aside className="stack">
          <Notice tone="warn" icon="bi-shield-exclamation"><strong>Don't include secrets.</strong> Never share your passwords, PINs, one-time codes or full card numbers, even in a report.</Notice>
          <div className="card-panel">
            <h2 className="h6">What happens next</h2>
            <ol className="small ps-3 mb-0">
              <li className="mb-1"><strong>Submitted</strong>: your report is saved and private to you and administrators.</li>
              <li className="mb-1"><strong>Under review</strong>: an administrator is checking it. You can add more information.</li>
              <li className="mb-1"><strong>Verified</strong> or <strong>Rejected</strong>: the decision, with feedback.</li>
              <li><strong>Resolved</strong>: no further action is needed.</li>
            </ol>
            <p className="small-print mt-2 mb-0">If you lost money, also contact your bank or payment provider right away. ScamShield can't recover funds.</p>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function NewReportPage() {
  return <Suspense><ReportForm /></Suspense>;
}
