"use client";

import { formatBytes, formatDate } from "@/lib/api-client";
import { StatusBadge } from "./ui";

const KIND_TEXT = { created: "Report submitted", status: "Status changed", feedback: "Administrator feedback", user_note: "Additional information added" };

// Shared by the reporter's view and the admin review page.
export function ReportSummary({ report, showReporter = false }) {
  return (
    <section className="card-panel" aria-labelledby="report-summary-title">
      <div className="panel-title"><h2 id="report-summary-title">Report #{report.id}</h2><StatusBadge status={report.status} /></div>
      <dl className="dl-grid">
        <dt>Category</dt><dd>{report.category}</dd>
        {showReporter && <><dt>Reported by</dt><dd>{report.reporter_name} ({report.reporter_email})</dd></>}
        <dt>Submitted</dt><dd>{formatDate(report.created_at)}</dd>
        <dt>Last updated</dt><dd>{formatDate(report.updated_at)}</dd>
        <dt>Description</dt><dd style={{ whiteSpace: "pre-wrap" }}>{report.details}</dd>
        {report.message_text && <><dt>Message</dt><dd><div className="highlighted-message">{report.message_text}</div></dd></>}
        {report.url && <><dt>Link</dt><dd className="mono">{report.url}</dd></>}
        {report.sender_value && <><dt>Sender</dt><dd><span className="text-capitalize">{report.sender_type}</span>: <span className="mono">{report.sender_value}</span></dd></>}
        {report.case_id && <><dt>Linked analysis</dt><dd>#{report.case_id}</dd></>}
      </dl>
      {report.admin_feedback && (
        <div className="alert-box tone-info mt-3"><i className="bi bi-chat-left-dots" aria-hidden="true" /><div><strong>Administrator feedback</strong><div style={{ whiteSpace: "pre-wrap" }}>{report.admin_feedback}</div></div></div>
      )}
    </section>
  );
}

export function EvidenceList({ report }) {
  return (
    <section className="card-panel" aria-labelledby="evidence-title">
      <h2 id="evidence-title" className="h6">Evidence</h2>
      {report.evidence.length ? report.evidence.map(file => (
        <div className="list-row" key={file.id}>
          <span className="row-icon"><i className={`bi ${file.mime_type.startsWith("image/") ? "bi-file-image" : file.mime_type === "application/pdf" ? "bi-file-pdf" : "bi-file-text"}`} aria-hidden="true" /></span>
          <div className="list-row-main"><strong>{file.file_name}</strong><small>{formatBytes(file.size_bytes)} · {formatDate(file.created_at)}</small></div>
          <a className="btn btn-outline btn-sm" href={`/api/reports/${report.id}/evidence/${file.id}`} download><i className="bi bi-download" aria-hidden="true" />Download</a>
        </div>
      )) : <p className="muted mb-0 small">No files attached.</p>}
    </section>
  );
}

export function Timeline({ report }) {
  return (
    <section className="card-panel" aria-labelledby="timeline-title">
      <h2 id="timeline-title" className="h6">Status history</h2>
      <ol className="timeline">
        {report.timeline.map(entry => (
          <li key={entry.id}>
            <span className="timeline-dot" aria-hidden="true" />
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <strong>{KIND_TEXT[entry.kind]}</strong>
              {entry.to_status && <StatusBadge status={entry.to_status} />}
            </div>
            <small className="muted">{entry.by} · {formatDate(entry.created_at)}</small>
            {entry.note && <div className="timeline-note">{entry.note}</div>}
          </li>
        ))}
      </ol>
    </section>
  );
}
