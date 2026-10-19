"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useShell } from "@/components/AppShell";
import { Loading, Modal, Notice, PageHeader, useApiData, useConfirm, useToast } from "@/components/ui";
import { api, formatDate, timeAgo } from "@/lib/api-client";
import { NOTIFICATION_TYPES } from "@/lib/constants";

function ProfileSection() {
  const { profile, setProfile } = useShell();
  const toast = useToast();
  const [form, setForm] = useState({ display_name: profile.display_name, email: profile.email, current_password: "" });
  const [busy, setBusy] = useState(false);
  const emailChanged = form.email.trim().toLowerCase() !== profile.email;

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await api("/api/settings/profile", { method: "PATCH", body: form });
      setProfile(data.profile);
      setForm(current => ({ ...current, current_password: "" }));
      toast("Profile updated.", "success");
    } catch (error) { toast(error.message, "error"); } finally { setBusy(false); }
  };

  return (
    <form className="card-panel section-anchor" id="profile" onSubmit={submit}>
      <h2>Profile</h2>
      <div className="grid grid-2">
        <div><label className="form-label" htmlFor="profile-name">Name</label><input id="profile-name" className="form-control" required minLength={2} maxLength={120} value={form.display_name} onChange={event => setForm({ ...form, display_name: event.target.value })} /></div>
        <div><label className="form-label" htmlFor="profile-email">Email</label><input id="profile-email" className="form-control" type="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></div>
      </div>
      {emailChanged && <div className="field mt-3"><label className="form-label" htmlFor="profile-password">Current password (required to change your email)</label><input id="profile-password" className="form-control" type="password" autoComplete="current-password" required value={form.current_password} onChange={event => setForm({ ...form, current_password: event.target.value })} /></div>}
      <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
        <span className="small-print">Account type: {profile.role === "admin" ? "Administrator" : "User"} · Member since {formatDate(profile.created_at, { time: false })}</span>
        <button type="submit" className="btn btn-primary" disabled={busy}>Save profile</button>
      </div>
    </form>
  );
}

function PasswordSection() {
  const toast = useToast();
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    if (form.new_password !== form.confirm) { toast("The new passwords don't match.", "error"); return; }
    setBusy(true);
    try {
      const data = await api("/api/settings/password", { method: "POST", body: form });
      setForm({ current_password: "", new_password: "", confirm: "" });
      toast(`Password changed.${data.other_sessions_revoked ? ` ${data.other_sessions_revoked} other session(s) signed out.` : ""}`, "success");
    } catch (error) { toast(error.message, "error"); } finally { setBusy(false); }
  };
  return (
    <form className="card-panel" onSubmit={submit}>
      <h3>Change password</h3>
      <div className="grid grid-3">
        <div><label className="form-label" htmlFor="pw-current">Current password</label><input id="pw-current" className="form-control" type="password" autoComplete="current-password" required value={form.current_password} onChange={event => setForm({ ...form, current_password: event.target.value })} /></div>
        <div><label className="form-label" htmlFor="pw-new">New password</label><input id="pw-new" className="form-control" type="password" autoComplete="new-password" minLength={8} required value={form.new_password} onChange={event => setForm({ ...form, new_password: event.target.value })} /></div>
        <div><label className="form-label" htmlFor="pw-confirm">Confirm new password</label><input id="pw-confirm" className="form-control" type="password" autoComplete="new-password" minLength={8} required value={form.confirm} onChange={event => setForm({ ...form, confirm: event.target.value })} /></div>
      </div>
      <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
        <span className="small-print">Changing your password signs out all your other devices.</span>
        <button type="submit" className="btn btn-primary" disabled={busy}>Change password</button>
      </div>
    </form>
  );
}

function TwoFactorSection() {
  const { profile, setProfile } = useShell();
  const toast = useToast();
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableForm, setDisableForm] = useState({ password: "", code: "" });
  const [busy, setBusy] = useState(false);

  const call = async (body, done) => {
    setBusy(true);
    try { done(await api("/api/settings/two-factor", { method: "POST", body })); } catch (error) { toast(error.message, "error"); } finally { setBusy(false); }
  };

  return (
    <section className="card-panel">
      <div className="panel-title">
        <h3>Two-factor authentication</h3>
        <span className={`badge-status ${profile.totp_enabled ? "tone-safe" : "tone-warn"}`}><i className={`bi ${profile.totp_enabled ? "bi-shield-lock-fill" : "bi-shield-exclamation"}`} aria-hidden="true" />{profile.totp_enabled ? "On" : "Off"}</span>
      </div>
      <p className="muted small">Require a 6-digit code from an authenticator app (such as Google Authenticator, Microsoft Authenticator or Authy) when you sign in.</p>
      {profile.totp_enabled ? (
        <button type="button" className="btn btn-danger-soft" onClick={() => setDisableOpen(true)}>Turn off two-factor authentication</button>
      ) : !setup ? (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => call({ action: "setup" }, setSetup)}><i className="bi bi-qr-code" aria-hidden="true" />Set up two-factor authentication</button>
      ) : (
        <div className="d-flex gap-3 flex-wrap align-items-start">
          <div className="qr-box" dangerouslySetInnerHTML={{ __html: setup.qr_svg }} role="img" aria-label="QR code for your authenticator app" />
          <form className="flex-grow-1" style={{ minWidth: 220 }} onSubmit={event => { event.preventDefault(); call({ action: "enable", code }, () => { setProfile({ ...profile, totp_enabled: true }); setSetup(null); setCode(""); toast("Two-factor authentication is on.", "success"); }); }}>
            <ol className="small ps-3">
              <li>Scan the QR code with your authenticator app, or enter this key: <span className="mono d-inline-block">{setup.secret.match(/.{1,4}/g).join(" ")}</span></li>
              <li>Enter the 6-digit code the app shows.</li>
            </ol>
            <label className="form-label" htmlFor="totp-code">Verification code</label>
            <div className="d-flex gap-2 flex-wrap">
              <input id="totp-code" className="form-control" style={{ maxWidth: 160 }} inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} />
              <button type="submit" className="btn btn-primary" disabled={busy || code.length !== 6}>Turn on</button>
              <button type="button" className="btn btn-outline" onClick={() => { setSetup(null); setCode(""); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {disableOpen && (
        <Modal title="Turn off two-factor authentication" onClose={() => setDisableOpen(false)}>
          <form onSubmit={event => { event.preventDefault(); call({ action: "disable", ...disableForm }, () => { setProfile({ ...profile, totp_enabled: false }); setDisableOpen(false); setDisableForm({ password: "", code: "" }); toast("Two-factor authentication is off.", "success"); }); }}>
            <p className="muted small">Your account will be easier to break into. Confirm with your password and a current code.</p>
            <label className="form-label" htmlFor="disable-password">Password</label>
            <input id="disable-password" className="form-control" type="password" autoComplete="current-password" required value={disableForm.password} onChange={event => setDisableForm({ ...disableForm, password: event.target.value })} />
            <label className="form-label mt-2" htmlFor="disable-code">Authenticator code</label>
            <input id="disable-code" className="form-control" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={disableForm.code} onChange={event => setDisableForm({ ...disableForm, code: event.target.value.replace(/\D/g, "") })} />
            <div className="modal-actions"><button type="button" className="btn btn-outline" data-close onClick={() => setDisableOpen(false)}>Cancel</button><button type="submit" className="btn btn-danger" disabled={busy}>Turn off</button></div>
          </form>
        </Modal>
      )}
    </section>
  );
}

function SessionsSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, reload } = useApiData("/api/settings/sessions");
  const activity = useApiData("/api/settings/account");

  const revoke = async session => {
    if (!(await confirm({ title: "Sign out this session?", body: `${session.device} will be signed out immediately.`, confirmLabel: "Sign out" }))) return;
    try { await api(`/api/settings/sessions/${session.id}`, { method: "DELETE" }); toast("Session signed out.", "success"); reload(); activity.reload(); } catch (error) { toast(error.message, "error"); }
  };
  const revokeOthers = async () => {
    if (!(await confirm({ title: "Sign out all other sessions?", body: "Every device except this one will be signed out.", confirmLabel: "Sign out others" }))) return;
    try { const result = await api("/api/settings/sessions", { method: "DELETE" }); toast(`${result.revoked} session(s) signed out.`, "success"); reload(); activity.reload(); } catch (error) { toast(error.message, "error"); }
  };

  return (
    <div className="grid grid-2">
      <section className="card-panel">
        <div className="panel-title"><h3>Active sessions</h3>{data?.sessions.length > 1 && <button type="button" className="btn btn-outline btn-sm" onClick={revokeOthers}>Sign out others</button>}</div>
        {loading && !data ? <Loading /> : data?.sessions.map(session => (
          <div className="list-row" key={session.id}>
            <span className="row-icon"><i className="bi bi-laptop" aria-hidden="true" /></span>
            <div className="list-row-main"><strong>{session.device}{session.current && <span className="badge-status tone-safe ms-2">This device</span>}</strong><small>Signed in {formatDate(session.created_at)} · Active {timeAgo(session.last_seen_at)}</small></div>
            {!session.current && <button type="button" className="btn btn-outline btn-sm" onClick={() => revoke(session)}>Sign out</button>}
          </div>
        ))}
      </section>
      <section className="card-panel">
        <h3>Recent security activity</h3>
        {activity.loading && !activity.data ? <Loading /> : activity.data?.events.length ? activity.data.events.map(event => (
          <div className="list-row" key={event.id}>
            <span className={`row-icon ${event.event === "login_failed" ? "tone-danger" : ""}`}><i className={`bi ${event.event === "login_failed" ? "bi-exclamation-triangle" : "bi-shield-check"}`} aria-hidden="true" /></span>
            <div className="list-row-main"><strong>{event.label}</strong><small>{formatDate(event.created_at)}</small></div>
          </div>
        )) : <p className="muted small mb-0">No security events yet.</p>}
      </section>
    </div>
  );
}

function NotificationPreferences() {
  const toast = useToast();
  const { data, setData } = useApiData("/api/settings/preferences");
  const toggle = async (field, value) => {
    const previous = data.preferences;
    setData({ preferences: { ...previous, [field]: value } });
    try { await api("/api/settings/preferences", { method: "PUT", body: { [field]: value } }); } catch (error) { setData({ preferences: previous }); toast(error.message, "error"); }
  };
  const fields = { analysis: "notify_analysis", report_status: "notify_report_status", education: "notify_education", threat_alert: "notify_threat_alerts", security: "notify_security" };
  return (
    <section className="card-panel section-anchor" id="notifications">
      <h2>Notification preferences</h2>
      {!data ? <Loading /> : Object.entries(NOTIFICATION_TYPES).map(([type, info]) => (
        <div className="check-row form-switch" key={type}>
          <input className="form-check-input" type="checkbox" role="switch" id={`pref-${type}`} checked={data.preferences[fields[type]]} onChange={event => toggle(fields[type], event.target.checked)} />
          <label htmlFor={`pref-${type}`} className="flex-grow-1"><strong className="d-block">{info.label}</strong><span className="small muted">{info.description}</span></label>
        </div>
      ))}
    </section>
  );
}

function PrivacySection() {
  const { profile } = useShell();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const isUser = profile.role === "user";

  const clearHistory = async () => {
    if (!(await confirm({ title: "Clear your Scam History?", body: "All saved message analyses, URL scans and sender checks will be permanently deleted. Your reports are kept.", confirmLabel: "Clear history", danger: true }))) return;
    try { await api("/api/history", { method: "DELETE" }); toast("Your Scam History was cleared.", "success"); } catch (error) { toast(error.message, "error"); }
  };
  const deleteAccount = async event => {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/settings/account", { method: "DELETE", body: form });
      router.replace("/login");
      router.refresh();
    } catch (error) { toast(error.message, "error"); setBusy(false); }
  };

  return (
    <section className="card-panel section-anchor" id="privacy">
      <h2>Privacy and your data</h2>
      <Notice icon="bi-incognito">
        <strong>What ScamShield stores.</strong> Your name, email and a bcrypt hash of your password; the messages, links and senders you choose to check; reports and evidence you submit; your learning progress, notifications and preferences; and a log of security events (sign-ins, password changes) without message contents.
        Messages are analyzed by ScamShield's own rules and never sent to outside AI services. If URL reputation is enabled, only the link itself is sent to Google Safe Browsing. Administrators can see reports and analyses to investigate scams.
      </Notice>
      <div className="d-flex flex-wrap gap-2 mt-3">
        {isUser && <button type="button" className="btn btn-outline" onClick={clearHistory}><i className="bi bi-clock-history" aria-hidden="true" />Clear my Scam History</button>}
        <button type="button" className="btn btn-danger-soft" onClick={() => setDeleteOpen(true)}><i className="bi bi-person-x" aria-hidden="true" />Delete my account and data</button>
      </div>
      {deleteOpen && (
        <Modal title="Delete your account?" onClose={() => setDeleteOpen(false)}>
          <form onSubmit={deleteAccount}>
            <p className="muted small">This permanently deletes your account, Scam History, reports and evidence, notifications and learning progress. It can't be undone.</p>
            <label className="form-label" htmlFor="delete-password">Password</label>
            <input id="delete-password" className="form-control" type="password" autoComplete="current-password" required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
            <label className="form-label mt-2" htmlFor="delete-confirm">Type DELETE to confirm</label>
            <input id="delete-confirm" className="form-control" required value={form.confirm} onChange={event => setForm({ ...form, confirm: event.target.value })} />
            <div className="modal-actions"><button type="button" className="btn btn-outline" data-close onClick={() => setDeleteOpen(false)}>Cancel</button><button type="submit" className="btn btn-danger" disabled={busy || form.confirm !== "DELETE"}>Delete permanently</button></div>
          </form>
        </Modal>
      )}
    </section>
  );
}

export default function SettingsPage() {
  useEffect(() => {
    if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView();
  }, []);
  return (
    <>
      <PageHeader eyebrow={<><i className="bi bi-gear" aria-hidden="true" />Account</>} title="Profile & settings" description="Manage your profile, account security, notifications and privacy." />
      <div className="stack">
        <ProfileSection />
        <div className="section-anchor stack" id="security">
          <h2 className="mt-2 mb-0">Account security</h2>
          <PasswordSection />
          <TwoFactorSection />
          <SessionsSection />
        </div>
        <NotificationPreferences />
        <PrivacySection />
      </div>
    </>
  );
}
