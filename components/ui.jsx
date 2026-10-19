"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { REPORT_STATUSES } from "@/lib/constants";

/* ---------- Toasts ---------- */
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(current => [...current, { id, message, type }]);
    setTimeout(() => setToasts(current => current.filter(toast => toast.id !== id)), type === "error" ? 6000 : 3500);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            <i className={`bi lead ${toast.type === "error" ? "bi-exclamation-octagon" : toast.type === "success" ? "bi-check-circle" : "bi-info-circle"}`} aria-hidden="true" />
            <span>{toast.message}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setToasts(current => current.filter(item => item.id !== toast.id))}><i className="bi bi-x-lg" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ---------- Modal & confirmation ---------- */
export function Modal({ title, children, onClose, labelledBy = "modal-title" }) {
  const cardRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const focusable = cardRef.current?.querySelector("input, textarea, select, button:not([data-close])");
    (focusable || cardRef.current)?.focus();
    const onKey = event => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && cardRef.current) {
        const items = [...cardRef.current.querySelectorAll("a, button, input, textarea, select")].filter(item => !item.disabled);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); previous?.focus?.(); };
  }, [onClose]);
  return (
    <div className="modal-backdrop-custom" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={cardRef} tabIndex={-1}>
        <h2 id={labelledBy}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

const ConfirmContext = createContext(async () => false);
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const confirm = useCallback(options => new Promise(resolve => setRequest({ ...options, resolve })), []);
  const close = value => { request?.resolve(value); setRequest(null); };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <Modal title={request.title} onClose={() => close(false)} labelledBy="confirm-title">
          <p className="muted">{request.body}</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" data-close onClick={() => close(false)}>Cancel</button>
            <button type="button" className={`btn ${request.danger ? "btn-danger" : "btn-primary"}`} onClick={() => close(true)}>{request.confirmLabel || "Confirm"}</button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

/* ---------- Display helpers ---------- */
export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="toolbar">{actions}</div>}
    </div>
  );
}

const VERDICT_STYLE = {
  safe: { tone: "tone-safe", icon: "bi-check-circle-fill", label: "Safe" },
  suspicious: { tone: "tone-warn", icon: "bi-exclamation-triangle-fill", label: "Suspicious" },
  scam: { tone: "tone-danger", icon: "bi-x-octagon-fill", label: "Scam" }
};
export const LEVEL_TO_VERDICT = { low: "safe", medium: "suspicious", high: "scam" };

// For sender checks the "safe" label would overclaim, so different wording is used per kind.
export function VerdictBadge({ verdict, kind }) {
  const style = VERDICT_STYLE[verdict] || VERDICT_STYLE.safe;
  let label = style.label;
  if (kind === "sender") label = verdict === "scam" ? "Verified reports" : verdict === "suspicious" ? "Reported" : "No reports";
  else if (kind === "url" && verdict === "safe") label = "No warning signs";
  else if (kind === "url" && verdict === "scam") label = "High risk";
  return <span className={`badge-status ${style.tone}`}><i className={`bi ${style.icon}`} aria-hidden="true" />{label}</span>;
}

const STATUS_STYLE = {
  submitted: { tone: "tone-info", icon: "bi-send" },
  under_review: { tone: "tone-warn", icon: "bi-hourglass-split" },
  verified: { tone: "tone-danger", icon: "bi-patch-check-fill" },
  rejected: { tone: "tone-neutral", icon: "bi-x-circle" },
  resolved: { tone: "tone-safe", icon: "bi-check2-all" }
};
export function StatusBadge({ status }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE.submitted;
  return <span className={`badge-status ${style.tone}`}><i className={`bi ${style.icon}`} aria-hidden="true" />{REPORT_STATUSES[status] || status}</span>;
}

export const KIND_LABELS = { message: ["bi-chat-left-text", "Message"], url: ["bi-link-45deg", "URL"], sender: ["bi-person-vcard", "Sender"] };
export function KindChip({ kind }) {
  const [icon, label] = KIND_LABELS[kind] || KIND_LABELS.message;
  return <span className="kind-chip"><i className={`bi ${icon}`} aria-hidden="true" />{label}</span>;
}

export function EmptyState({ icon = "bi-inbox", title, body, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><i className={`bi ${icon}`} aria-hidden="true" /></div>
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

export function Loading({ label = "Loading…" }) {
  return <div className="loading-block" role="status"><span className="spinner-border spinner-border-sm" aria-hidden="true" />{label}</div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="alert-box tone-danger" role="alert">
      <i className="bi bi-exclamation-octagon" aria-hidden="true" />
      <div>
        <strong>Something went wrong.</strong> {message}
        {onRetry && <div><button type="button" className="btn-link-plain mt-1" onClick={onRetry}>Try again</button></div>}
      </div>
    </div>
  );
}

export function Notice({ tone = "info", icon = "bi-info-circle", children }) {
  return <div className={`alert-box tone-${tone}`}><i className={`bi ${icon}`} aria-hidden="true" /><div>{children}</div></div>;
}

export function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <nav className="d-flex align-items-center justify-content-between gap-2 mt-3 flex-wrap" aria-label="Pagination">
      <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}><i className="bi bi-chevron-left" aria-hidden="true" />Previous</button>
      <span className="small-print">Page {page} of {totalPages}</span>
      <button type="button" className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next<i className="bi bi-chevron-right" aria-hidden="true" /></button>
    </nav>
  );
}

export function StatTile({ icon, tone = "info", label, value, sub }) {
  return (
    <div className="stat-tile">
      <div className={`stat-icon tone-${tone}`}><i className={`bi ${icon}`} aria-hidden="true" /></div>
      <div className="min-w-0">
        <div className="label">{label}</div>
        <div className="value">{value}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
    </div>
  );
}

export function ButtonLink({ href, children, variant = "btn-primary", className = "" }) {
  return <Link href={href} className={`btn ${variant} ${className}`}>{children}</Link>;
}

// Loads data from an API path; returns { data, error, loading, reload, setData }.
export function useApiData(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    setState(current => ({ ...current, loading: true, error: null }));
    api(path, { signal: controller.signal })
      .then(data => setState({ data, error: null, loading: false }))
      .catch(error => { if (error.name !== "AbortError") setState(current => ({ data: current.data, error: error.message, loading: false })); });
    return () => controller.abort();
  }, [path, version]);
  return { ...state, reload: () => setVersion(value => value + 1), setData: data => setState(current => ({ ...current, data: typeof data === "function" ? data(current.data) : data })) };
}
