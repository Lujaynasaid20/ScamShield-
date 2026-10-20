"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { SenderResult } from "@/components/results";
import { Notice, PageHeader, useToast } from "@/components/ui";
import { api } from "@/lib/api-client";
import { detectSenderType } from "@/lib/sender";

const TYPES = [["auto", "Detect automatically"], ["phone", "Phone number"], ["email", "Email address"], ["name", "Sender name"]];

function SenderChecker() {
  const params = useSearchParams();
  const toast = useToast();
  const [value, setValue] = useState(params.get("value") || "");
  const [type, setType] = useState("auto");
  const [save, setSave] = useState(true);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [error, setError] = useState("");
  const resultRef = useRef(null);
  const detected = value.trim() ? detectSenderType(value) : null;

  const submit = async event => {
    event.preventDefault();
    setError("");
    if (!value.trim()) { setError("Enter a phone number, email address or sender name."); return; }
    setBusy(true);
    try {
      const data = await api("/api/check-sender", { method: "POST", body: { value, type: type === "auto" ? undefined : type, save } });
      const item = data.item || { id: null, kind: "sender", input: data.result.display, verdict: { high: "scam", medium: "suspicious" }[data.result.riskLevel] || "safe", created_at: new Date().toISOString(), details: data.result };
      setOutcome({ item, result: data.result });
      setTimeout(() => resultRef.current?.focus(), 50);
    } catch (requestError) {
      if (requestError.status === 400) setError(requestError.message); else toast(requestError.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={<><i className="bi bi-person-vcard" aria-hidden="true" />Sender checker</>}
        title="Check a phone number, email or sender"
        description="Check a phone number, email address or sender name: its country and network, whether it's a verified business contact, and what other users have reported."
      />
      <div className="grid grid-main-side">
        <form className="card-panel" onSubmit={submit} noValidate>
          <div className="field">
            <label className="form-label" htmlFor="sender-value">Phone number, email address or sender name</label>
            <input id="sender-value" className={`form-control ${error ? "is-invalid" : ""}`} maxLength={200} autoComplete="off" value={value} onChange={event => setValue(event.target.value)} placeholder="e.g. +255 754 123 456, support@paypa1-help.com, or 'M-PESA Support'" aria-invalid={Boolean(error)} aria-describedby="sender-hint sender-error" />
            <div id="sender-hint" className="form-hint">For phone numbers, include the country code (like +255) to see the country and network.</div>
            {error && <div id="sender-error" className="invalid-feedback d-block">{error}</div>}
          </div>
          <div className="field">
            <label className="form-label" htmlFor="sender-type">Type</label>
            <select id="sender-type" className="form-select" value={type} onChange={event => setType(event.target.value)}>
              {TYPES.map(([key, label]) => <option key={key} value={key}>{label}{key === "auto" && detected ? ` (looks like: ${detected})` : ""}</option>)}
            </select>
          </div>
          <div className="form-check mt-3">
            <input className="form-check-input" type="checkbox" id="sender-save" checked={save} onChange={event => setSave(event.target.checked)} />
            <label className="form-check-label" htmlFor="sender-save">Save this check to my Scam History</label>
          </div>
          <button type="submit" className="btn btn-primary mt-3" disabled={busy}>{busy ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className="bi bi-search" aria-hidden="true" />}{busy ? "Checking…" : "Check sender"}</button>
        </form>
        <Notice tone="warn" icon="bi-exclamation-triangle">
          <strong>Reports are allegations.</strong> A community report is not proof until an administrator verifies it, and scammers can spoof numbers and names. ScamShield only names a sender when an administrator has confirmed it as an official business contact. It never shows private owners' names.
        </Notice>
      </div>
      {outcome && <section className="mt-4" aria-label="Sender check result" tabIndex={-1} ref={resultRef}><SenderResult item={outcome.item} result={outcome.result} /></section>}
    </>
  );
}

export default function SenderPage() {
  return <Suspense><SenderChecker /></Suspense>;
}
