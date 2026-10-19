"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { UrlResult } from "@/components/results";
import { Notice, PageHeader, useToast } from "@/components/ui";
import { useShell } from "@/components/AppShell";
import { api } from "@/lib/api-client";

function UrlScanner() {
  const params = useSearchParams();
  const toast = useToast();
  const { refreshUnread } = useShell();
  const [url, setUrl] = useState(params.get("url") || "");
  const [busy, setBusy] = useState(false);
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  const submit = async event => {
    event.preventDefault();
    setError("");
    if (!url.trim()) { setError("Enter a link to scan."); return; }
    setBusy(true);
    try {
      const data = await api("/api/scan-url", { method: "POST", body: { url } });
      setItem(data.item);
      refreshUnread();
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
        eyebrow={<><i className="bi bi-link-45deg" aria-hidden="true" />URL & link scanner</>}
        title="Scan a link before you open it"
        description="Paste a link to check for look-alike domains, hidden destinations, suspicious structure and known threats. The link is never opened."
      />
      <div className="grid grid-main-side">
        <form className="card-panel" onSubmit={submit} noValidate>
          <label className="form-label" htmlFor="url">Link to scan</label>
          <div className="d-flex gap-2 flex-wrap">
            <input id="url" className={`form-control flex-grow-1 ${error ? "is-invalid" : ""}`} style={{ minWidth: 0, flexBasis: 240 }} type="text" inputMode="url" autoComplete="off" spellCheck={false} maxLength={2048} placeholder="https://example.com/…" value={url} onChange={event => setUrl(event.target.value)} aria-invalid={Boolean(error)} aria-describedby="url-error url-help" />
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className="bi bi-search" aria-hidden="true" />}Scan link</button>
          </div>
          {error && <div id="url-error" className="invalid-feedback d-block">{error}</div>}
          <p id="url-help" className="form-hint mb-0">Tip: copy the link by long-pressing it, without tapping it. Shortened links (like bit.ly) hide where they go.</p>
        </form>
        <Notice icon="bi-shield-lock">
          <strong>Two kinds of evidence.</strong> <em>Heuristic findings</em> look at how the address is written. <em>Threat intelligence</em> checks known-dangerous lists (Google Safe Browsing) when configured. Neither can guarantee a site is safe.
        </Notice>
      </div>
      {item && <section className="mt-4" aria-label="Scan result" tabIndex={-1} ref={resultRef}><UrlResult item={item} /></section>}
    </>
  );
}

export default function UrlScannerPage() {
  return <Suspense><UrlScanner /></Suspense>;
}
