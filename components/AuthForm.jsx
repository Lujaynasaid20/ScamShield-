"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";

const MODES = {
  login: { tab: "Log in", title: "Welcome back", subtitle: "Log in to your ScamShield account.", submit: "Log in" },
  register: { tab: "Register", title: "Create your account", subtitle: "Free tools to check messages, links and senders.", submit: "Create account" },
  admin: { tab: "Admin", title: "Admin login", subtitle: "Log in with your administrator account.", submit: "Log in as admin" }
};

export default function AuthForm() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ display_name: "", email: "", password: "", confirm: "", code: "" });
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const copy = MODES[mode];
  const set = field => event => setForm(current => ({ ...current, [field]: event.target.value }));

  const switchMode = next => { setMode(next); setError(""); setNeedsCode(false); setForm(current => ({ ...current, password: "", confirm: "", code: "" })); };

  const submit = async event => {
    event.preventDefault();
    setError("");
    if (mode === "register" && form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      let result;
      if (mode === "register") {
        result = await api("/api/auth/register", { method: "POST", body: { display_name: form.display_name, email: form.email, password: form.password } });
      } else {
        result = await api("/api/auth/login", { method: "POST", body: { email: form.email, password: form.password, admin: mode === "admin", ...(needsCode ? { code: form.code } : {}) } });
        if (result.two_factor_required) { setNeedsCode(true); setBusy(false); return; }
      }
      const next = new URLSearchParams(window.location.search).get("next");
      const home = result.profile.role === "admin" ? "/admin" : "/overview";
      const allowed = next && next.startsWith("/") && !next.startsWith("//") && (result.profile.role === "admin") === next.startsWith("/admin");
      window.location.assign(allowed ? next : home);
    } catch (requestError) {
      if (requestError.data?.two_factor_required) setNeedsCode(true);
      setError(requestError.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-visual" aria-label="About ScamShield">
        <div className="d-flex align-items-center gap-2 mb-auto fw-bold fs-5"><span className="brand-mark"><i className="bi bi-shield-check" aria-hidden="true" /></span>ScamShield AI</div>
        <h1>Pause. Check. Protect.</h1>
        <p>Check suspicious messages, links and senders, understand the warning signs, and help your community stay safer.</p>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Account access">
            {Object.entries(MODES).map(([key, value]) => (
              <button key={key} type="button" role="tab" aria-selected={mode === key} onClick={() => switchMode(key)}>{value.tab}</button>
            ))}
          </div>
          <h2 className="h4">{needsCode ? "Two-factor verification" : copy.title}</h2>
          <p className="muted">{needsCode ? "Enter the 6-digit code from your authenticator app." : copy.subtitle}</p>
          <form onSubmit={submit} noValidate={false}>
            {needsCode ? (
              <div className="field">
                <label className="form-label" htmlFor="auth-code">Verification code</label>
                <input id="auth-code" className="form-control form-control-lg" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required autoFocus value={form.code} onChange={set("code")} />
              </div>
            ) : (
              <>
                {mode === "register" && (
                  <div className="field">
                    <label className="form-label" htmlFor="auth-name">Full name</label>
                    <input id="auth-name" className="form-control" autoComplete="name" minLength={2} maxLength={120} required value={form.display_name} onChange={set("display_name")} />
                  </div>
                )}
                <div className="field">
                  <label className="form-label" htmlFor="auth-email">Email address</label>
                  <input id="auth-email" className="form-control" type="email" autoComplete="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" />
                </div>
                <div className="field">
                  <label className="form-label" htmlFor="auth-password">Password</label>
                  <input id="auth-password" className="form-control" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={8} required value={form.password} onChange={set("password")} />
                  {mode === "register" && <div className="form-hint">At least 8 characters. A longer passphrase is stronger.</div>}
                </div>
                {mode === "register" && (
                  <div className="field">
                    <label className="form-label" htmlFor="auth-confirm">Confirm password</label>
                    <input id="auth-confirm" className="form-control" type="password" autoComplete="new-password" minLength={8} required value={form.confirm} onChange={set("confirm")} />
                  </div>
                )}
              </>
            )}
            {error && <div className="alert-box tone-danger mt-3" role="alert"><i className="bi bi-exclamation-octagon" aria-hidden="true" /><div>{error}</div></div>}
            <button type="submit" className="btn btn-primary w-100 mt-3" disabled={busy}>
              {busy && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
              {needsCode ? "Verify and log in" : copy.submit}
            </button>
            {needsCode && <button type="button" className="btn btn-outline w-100 mt-2" onClick={() => { setNeedsCode(false); setError(""); }}>Back</button>}
          </form>
          <p className="small-print mt-4"><i className="bi bi-lock me-1" aria-hidden="true" />Passwords are hashed with bcrypt. Your analyses and reports are private to your account.</p>
        </div>
      </section>
    </div>
  );
}
