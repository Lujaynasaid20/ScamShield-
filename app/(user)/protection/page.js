"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ActionCenter } from "@/components/results";
import { EmptyState, KindChip, Loading, PageHeader, VerdictBadge } from "@/components/ui";
import { api, formatDate } from "@/lib/api-client";
import { PLAYBOOKS } from "@/lib/recommendations";

export default function ProtectionPage() {
  const [latest, setLatest] = useState(undefined);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    api("/api/history?pageSize=1")
      .then(list => (list.items[0] ? api(`/api/history/${list.items[0].id}`).then(data => data.item) : null))
      .then(setLatest)
      .catch(() => setLatest(null));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow={<><i className="bi bi-shield-check" aria-hidden="true" />Protection center</>}
        title="Your safety action plan"
        description="Step-by-step guidance based on your most recent check, plus what to do if you've already responded to a scam."
      />
      <div className="grid grid-main-side">
        <section aria-labelledby="latest-title">
          <h2 id="latest-title" className="visually-hidden">Based on your latest check</h2>
          {latest === undefined ? <div className="card-panel"><Loading /></div> : latest ? (
            <div className="stack">
              <div className="card-panel">
                <div className="small-print mb-1">Based on your latest check · {formatDate(latest.created_at)}</div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <KindChip kind={latest.kind} /><VerdictBadge verdict={latest.verdict} kind={latest.kind} />
                  <span className="text-truncate min-w-0 flex-grow-1 fw-semibold" style={{ flexBasis: 160 }}>{latest.input}</span>
                  <Link href={`/history/${latest.id}`} className="btn btn-outline btn-sm">Full result</Link>
                </div>
              </div>
              <ActionCenter recommendations={latest.details?.recommendations} reportHref={latest.kind === "sender" ? `/reports/new?sender_type=${latest.details?.type}&sender_value=${encodeURIComponent(latest.input)}` : `/reports/new?case=${latest.id}`} />
            </div>
          ) : (
            <div className="card-panel"><EmptyState icon="bi-shield-check" title="No checks yet" body="Analyze a message or scan a link, and your personalized action plan will appear here." action={<Link href="/analyze" className="btn btn-primary btn-sm">Analyze a message</Link>} /></div>
          )}
        </section>
        <section className="card-panel" aria-labelledby="playbooks-title">
          <h2 id="playbooks-title">If you already responded</h2>
          <p className="muted small">Act quickly: the sooner you contact your provider, the better the chance of limiting the damage.</p>
          {PLAYBOOKS.map(playbook => (
            <div key={playbook.id} className="border-top py-2">
              <button type="button" className="btn-link-plain d-flex align-items-center gap-2 w-100 text-start py-1" aria-expanded={open === playbook.id} aria-controls={`playbook-${playbook.id}`} onClick={() => setOpen(open === playbook.id ? null : playbook.id)}>
                <span className="row-icon" style={{ width: 32, height: 32 }}><i className={`bi ${playbook.icon}`} aria-hidden="true" /></span>
                <span className="flex-grow-1 text-body">{playbook.title}</span>
                <i className={`bi ${open === playbook.id ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" />
              </button>
              {open === playbook.id && (
                <ol id={`playbook-${playbook.id}`} className="small mt-2 mb-1 ps-4">{playbook.steps.map(step => <li key={step} className="mb-1">{step}</li>)}</ol>
              )}
            </div>
          ))}
          <div className="border-top pt-3 d-flex flex-wrap gap-2">
            <Link href="/reports/new" className="btn btn-primary btn-sm"><i className="bi bi-flag" aria-hidden="true" />Report an incident</Link>
            <Link href="/settings#security" className="btn btn-outline btn-sm"><i className="bi bi-shield-lock" aria-hidden="true" />Secure my account</Link>
          </div>
        </section>
      </div>
    </>
  );
}
