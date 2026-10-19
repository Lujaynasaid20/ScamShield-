"use client";

import { useEffect } from "react";
import { initApp } from "@/lib/client-app";

export default function ScamShieldApp() {
  useEffect(() => {
    let cancelled = false;
    import("bootstrap/dist/js/bootstrap.bundle.min.js").then(module => {
      if (!cancelled) initApp(module.default ?? module);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <div className="app-shell">
        <main className="main-area">
          <header className="topbar" id="app-header" hidden>
            <a className="topbar-brand" href="#home" data-go="home" aria-label="ScamShield home"><span className="brand-mark"><i className="bi bi-shield-check"></i></span><span className="brand-name">ScamShield</span></a>
            <div className="top-actions">
              <div className="top-auth-actions" id="auth-actions"><button className="btn btn-outline-app" type="button" data-role="user" data-view="profile"><i className="bi bi-person me-1"></i><span data-i18n="navProfile">Profile</span></button><div className="dropdown"><button className="btn btn-outline-app menu-toggle" id="menu-button" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Menu"><i className="bi bi-list"></i></button><div className="dropdown-menu dropdown-menu-end app-menu" aria-labelledby="menu-button"><button className="dropdown-item" type="button" data-role="user" data-view="url-scanner"><i className="bi bi-shield-check"></i><span data-i18n="checkerTitle">URL &amp; phone checker</span></button><button className="dropdown-item" type="button" data-role="user" data-view="history"><i className="bi bi-clock-history"></i><span data-i18n="navHistory">Scam history</span></button><button className="dropdown-item" type="button" data-role="user" data-view="awareness"><i className="bi bi-book"></i><span data-i18n="navAwareness">Scam awareness</span></button><button className="dropdown-item" type="button" data-role="user" data-view="results"><i className="bi bi-lightbulb"></i><span data-i18n="navExplain">Explainable AI</span></button><hr className="dropdown-divider" data-role="user" /><button className="dropdown-item" type="button" id="logout-button" hidden><i className="bi bi-box-arrow-right"></i><span data-i18n="logout">Log out</span></button></div></div></div>
            </div>
            <nav className="top-nav" id="feature-navigation" aria-label="Main navigation" hidden>
              <button className="top-nav-link active" type="button" data-role="user" data-view="home"><i className="bi bi-house-door"></i><span data-i18n="navHome">Home</span></button>
              <button className="top-nav-link" type="button" data-role="user" data-view="analyzer"><i className="bi bi-activity"></i><span data-i18n="navAnalyzer">Message analyzer</span></button>
              <button className="top-nav-link" type="button" data-role="admin" data-view="dashboard"><i className="bi bi-grid-1x2"></i><span data-i18n="navDashboard">Admin dashboard</span></button>
              <button className="top-nav-link" type="button" data-role="admin" data-view="admin-reports"><i className="bi bi-flag"></i><span data-i18n="adminReportsTitle">Review reports</span></button>
              <button className="top-nav-link" type="button" data-role="admin" data-view="scam-database"><i className="bi bi-collection"></i><span data-i18n="scamDatabaseTitle">Scam database</span></button>
              <button className="top-nav-link" type="button" data-role="admin" data-view="admin-users"><i className="bi bi-people"></i><span data-i18n="usersTitle">Users</span></button>
              <button className="top-nav-link" type="button" data-role="admin" data-view="admin-insights"><i className="bi bi-graph-up"></i><span data-i18n="insightsTitle">Trends & performance</span></button>
              <button className="top-nav-link" type="button" data-role="user" data-report-open><i className="bi bi-flag"></i><span data-i18n="navReport">Report a scam</span></button>
            </nav>
          </header>

          <section className="page active" id="page-auth" aria-labelledby="auth-title">
            <div className="page-head"><div><div className="eyebrow"><span className="eyebrow-dot"></span><span data-i18n="accountAccess">Account access</span></div><h1 id="auth-title" data-i18n="authPageTitle">Join ScamShield</h1><p data-i18n="authPageSub">Create an account to keep your safety tools close.</p></div></div>
            <div className="auth-layout">
              <section className="auth-story"><img className="auth-story-image" src="/images/auth-shield.jpg" alt="Cybersecurity shield protection illustration" /></section>
              <section className="auth-panel">
                <div className="auth-mode-switch" role="tablist" aria-label="Account access"><button type="button" className="active" data-auth-mode="login" role="tab" aria-selected="true" data-i18n="login">Log in</button><button type="button" data-auth-mode="register" role="tab" aria-selected="false" data-i18n="register">Register</button><button type="button" data-auth-mode="admin" role="tab" aria-selected="false" data-i18n="adminTab">Admin</button></div>
                <h2 id="auth-form-title" data-i18n="welcomeBack">Welcome back</h2><p id="auth-form-subtitle" data-i18n="loginSubtitle">Log in to your ScamShield account.</p>
                <form className="auth-form" id="auth-form">
                  <div id="auth-name-field" hidden><label className="form-label" htmlFor="auth-name" data-i18n="fullName">Full name</label><input className="form-control" id="auth-name" autoComplete="name" minLength="2" data-i18n-placeholder="namePlaceholder" placeholder="Your name" /></div>
                  <label className="form-label" htmlFor="auth-email" data-i18n="emailAddress">Email address</label><input className="form-control" id="auth-email" type="email" autoComplete="email" data-i18n-placeholder="emailPlaceholder" placeholder="you@example.com" required />
                  <label className="form-label" htmlFor="auth-password" data-i18n="password">Password</label><input className="form-control" id="auth-password" type="password" autoComplete="current-password" minLength="8" data-i18n-placeholder="passwordPlaceholder" placeholder="At least 8 characters" required />
                  <div id="auth-confirm-field" hidden><label className="form-label" htmlFor="auth-confirm" data-i18n="confirmPassword">Confirm password</label><input className="form-control" id="auth-confirm" type="password" autoComplete="new-password" minLength="8" data-i18n-placeholder="confirmPlaceholder" placeholder="Enter your password again" /></div>
                  <button className="btn btn-green mt-1" id="auth-submit" type="submit" data-i18n="login">Log in</button>
                </form>
                <p className="auth-note"><i className="bi bi-info-circle me-1"></i><span data-i18n="authDemoNote">Accounts are stored in this PostgreSQL database.</span></p>
              </section>
            </div>
          </section>

          <section className="page" id="page-home" aria-labelledby="home-title">
            <div className="page-head"><div><div className="eyebrow"><span className="eyebrow-dot"></span><span data-i18n="saferInbox">A safer inbox starts here</span></div><h1 id="home-title" data-i18n="homeTitle">Pause. Check. Protect.</h1><p data-i18n="homeSub">A second opinion for the messages that don't feel right.</p></div></div>
            <section className="hero">
              <div className="hero-copy"><div className="hero-kicker"><i className="bi bi-stars me-1"></i><span data-i18n="heroKicker">Your personal scam spotter</span></div><h2 data-i18n="heroTitle">Trust your gut.<br />Verify the message.</h2><p data-i18n="heroBody">Spot pressure tactics, suspicious links, and requests for money before they catch you off guard.</p><button className="btn btn-lime" data-go="analyzer"><span data-i18n="checkMessage">Check a message</span><i className="bi bi-arrow-up-right ms-2"></i></button></div>
              <div className="hero-art" aria-hidden="true"><span className="shield-orb"><i className="bi bi-shield-check"></i></span><span className="orbit-tag one"><i className="bi bi-link-45deg me-1"></i>Link check</span><span className="orbit-tag two"><i className="bi bi-exclamation-circle me-1"></i>Risk signals</span></div>
            </section>
            <div className="home-grid">
              <section className="surface">
                <div className="surface-title"><h3 data-i18n="howItWorks">How it works</h3></div>
                <div className="how-list">
                  <div className="how-row"><span className="how-number">01</span><div><strong data-i18n="stepOne">Paste the message</strong><small data-i18n="stepOneBody">SMS, email, social post, or chat.</small></div></div>
                  <div className="how-row"><span className="how-number">02</span><div><strong data-i18n="stepTwo">Review the signals</strong><small data-i18n="stepTwoBody">See what looks risky and why.</small></div></div>
                  <div className="how-row"><span className="how-number">03</span><div><strong data-i18n="stepThree">Choose your next step</strong><small data-i18n="stepThreeBody">Get practical guidance, not just a score.</small></div></div>
                </div>
              </section>
            </div>
          </section>

          <section className="page" id="page-analyzer" aria-labelledby="analyzer-title">
            <div className="page-head"><div><div className="eyebrow"><span className="eyebrow-dot"></span><span data-i18n="checkBefore">Check before you click</span></div><h1 id="analyzer-title" data-i18n="analyzerTitle">Message analyzer</h1><p data-i18n="analyzerSub">Paste the full message for a clearer risk assessment.</p></div></div>
            <div className="analyzer-wrap">
              <div className="analysis-intro"><h2 data-i18n="whatLooksOff">Let's see what looks off.</h2><p data-i18n="analyzerIntro">We look for pressure, payment requests, suspicious links, and personal information requests.</p></div>
              <section className="analyzer-box">
                <label className="form-label" htmlFor="analyzer-message" data-i18n="messageLabel">Suspicious message</label>
                <textarea className="message-input" id="analyzer-message" maxLength="5000" data-i18n-placeholder="pasteHere" placeholder="Paste your suspicious message here"></textarea>
                <div className="live-analysis" id="live-analysis" role="status" aria-live="polite" hidden></div>
                <div className="tool-row"><span><i className="bi bi-lock me-1"></i><span id="analysis-disclosure" data-i18n="localAnalysis">Demo analysis happens locally in this browser.</span></span><span id="char-count">0 / 5000</span></div>
                <div className="d-flex justify-content-end mt-3"><button className="btn btn-green" data-analyze="analyzer-message"><i className="bi bi-shield-check me-2"></i><span data-i18n="analyzeMessage">Analyze message</span></button></div>
              </section>
              <div className="example-chips"><span data-i18n="tryExample">Try an example:</span><button className="example-chip" data-example="urgent"><span data-i18n="exampleUrgent">Urgent bank alert</span></button><button className="example-chip" data-example="prize"><span data-i18n="examplePrize">Prize message</span></button><button className="example-chip" data-example="safe"><span data-i18n="exampleSafe">Normal delivery update</span></button></div>
              <div className="trust-strip"><span><i className="bi bi-check-circle"></i><span data-i18n="noAccount">No account needed</span></span><span><i className="bi bi-check-circle"></i><span data-i18n="historyStored">Cases saved in this browser</span></span><span><i className="bi bi-check-circle"></i><span data-i18n="explainable">Every flag explained</span></span></div>
            </div>
          </section>

          <section className="page" id="page-url-scanner" aria-labelledby="url-page-title">
            <div className="page-head"><div><div className="eyebrow"><span className="eyebrow-dot"></span><span data-i18n="checkerTitle">URL &amp; phone checker</span></div><h1 id="url-page-title" data-i18n="checkerTitle">URL &amp; phone checker</h1><p data-i18n="checkerHint">Check a link or a phone number for common warning signs.</p></div></div>
            <div className="analyzer-wrap checker-grid"><section className="analyzer-box"><h2 className="checker-heading"><i className="bi bi-link-45deg"></i><span data-i18n="urlScanTitle">URL scanner</span></h2><form id="url-form"><label className="form-label" htmlFor="url-input" data-i18n="urlInputLabel">Link to check</label><input className="form-control" id="url-input" type="text" inputMode="url" autoComplete="url" required /><div className="d-flex justify-content-end mt-3"><button className="btn btn-green" type="submit" data-i18n="scanUrl">Scan URL</button></div></form><div className="check-list mt-3" id="single-url-result" aria-live="polite"></div><p className="input-help mt-3" data-i18n="localUrlCaveat">Checks run locally. This does not query live threat-intelligence services.</p></section><section className="analyzer-box"><h2 className="checker-heading"><i className="bi bi-telephone"></i><span data-i18n="phoneCheckTitle">Phone number checker</span></h2><form id="phone-form"><label className="form-label" htmlFor="phone-input" data-i18n="phoneInputLabel">Phone number</label><input className="form-control" id="phone-input" type="tel" autoComplete="tel" required /><div className="d-flex justify-content-end mt-3"><button className="btn btn-green" type="submit" data-i18n="checkPhone">Check number</button></div></form><div className="check-list mt-3" id="single-phone-result" aria-live="polite"></div><p className="input-help mt-3" data-i18n="localPhoneCaveat">Format checks and your own history only; the owner is not verified.</p></section></div>
          </section>

          <section className="page" id="page-awareness" aria-labelledby="awareness-title">
            <div className="page-head"><div><div className="eyebrow"><span className="eyebrow-dot"></span><span data-i18n="navAwareness">Scam awareness</span></div><h1 id="awareness-title" data-i18n="awarenessTitle">Scam awareness</h1><p data-i18n="awarenessSubtitle">Simple habits that make common scams harder to pull off.</p></div></div>
            <div className="surface awareness-list"><article><h2 data-i18n="awarenessUrgency">Pause when a message creates urgency</h2><p data-i18n="awarenessUrgencyBody">Contact the organization through its official app or a number you find independently.</p></article><article><h2 data-i18n="awarenessCodes">Never share sign-in codes</h2><p data-i18n="awarenessCodesBody">Banks and legitimate services do not need you to send a PIN, password, or one-time code in a message.</p></article><article><h2 data-i18n="awarenessLinks">Check links before opening them</h2><p data-i18n="awarenessLinksBody">Read the full domain carefully and avoid shortened links in unexpected messages.</p></article><article><h2 data-i18n="awarenessPayments">Pause unusual payment requests</h2><p data-i18n="awarenessPaymentsBody">Gift cards, crypto, and urgent transfer requests are hard to reverse. Verify first.</p></article></div>
          </section>

          <section className="page" id="page-profile" aria-labelledby="profile-title">
            <div className="page-head"><div><div className="eyebrow"><span className="eyebrow-dot"></span><span data-i18n="navProfile">Profile</span></div><h1 id="profile-title" data-i18n="profileTitle">Profile and settings</h1></div></div>
            <section className="surface profile-details"><div><span data-i18n="fullName">Name</span><strong id="profile-name"></strong></div><div><span data-i18n="emailAddress">Email</span><strong id="profile-email"></strong></div><div><span data-i18n="accountRole">Account type</span><strong id="profile-role"></strong></div><button className="btn btn-outline-app" type="button" data-action="delete-own-history" data-i18n="clearHistory">Clear my scam history</button><button className="btn btn-outline-app" type="button" data-action="invite-admin" data-i18n="inviteAdmin" hidden>Invite admin</button></section>
          </section>

          <section className="page" id="page-results" aria-labelledby="results-title">
            <div className="page-head"><div><div className="eyebrow"><span className="eyebrow-dot"></span><span data-i18n="analysisComplete">Analysis complete</span></div><h1 id="results-title" data-i18n="resultsTitle">Your message breakdown</h1><p data-i18n="resultsSub">Here are the signals behind this assessment.</p></div><button className="btn btn-outline-app" data-go="analyzer"><i className="bi bi-arrow-left me-1"></i><span data-i18n="checkAnother">Check another</span></button></div>
            <div className="result-wrap">
              <div className="result-banner" id="result-banner" style={{ "--risk-color": "#bc5943", "--risk-deg": "0deg" }}>
                <div className="risk-gauge"><span className="risk-score" id="risk-score">--</span></div>
                <div className="risk-copy"><div className="eyebrow"><span className="eyebrow-dot"></span><span data-i18n="riskLevel">Risk level</span></div><h2 id="risk-title">Waiting for a message</h2><p id="risk-summary">Analyze a message to see its risk assessment.</p></div>
                <div className="result-actions"><button className="btn btn-outline-app" id="copy-report"><i className="bi bi-copy me-1"></i><span data-i18n="copySummary">Copy summary</span></button><button className="btn btn-outline-app" data-role="user" data-report-open><i className="bi bi-flag me-1"></i><span data-i18n="reportIt">Report it</span></button></div>
              </div>
              <div className="history-match" id="history-match" hidden></div>
              <div className="result-columns">
                <section className="surface"><div className="surface-title"><h3 data-i18n="whyFlagged">Why this was flagged</h3><span id="signal-count">0 signals</span></div><div className="signal-list" id="signal-list"></div></section>
                <section className="surface"><div className="surface-title"><h3 data-i18n="messageReviewed">Message reviewed</h3></div><div className="quoted-message" id="quoted-message"></div><div className="advice-box"><strong><i className="bi bi-shield-exclamation me-1"></i><span data-i18n="whatToDo">What to do next</span></strong><span id="risk-advice"></span></div></section>
              </div>
              <div className="result-checks">
                <section className="surface"><div className="surface-title"><h3 data-i18n="scamTypeTitle">Scam type</h3></div><strong id="scam-type-result"></strong></section>
                <section className="surface"><div className="surface-title"><h3 data-i18n="urlScanTitle">URL scanner</h3></div><div className="check-list" id="url-results"></div></section>
                <section className="surface"><div className="surface-title"><h3 data-i18n="phoneCheckTitle">Phone number checker</h3></div><div className="check-list" id="phone-results"></div></section>
              </div>
            </div>
          </section>

          <section className="page" id="page-history" aria-labelledby="history-title">
            <div className="page-head"><div><div className="eyebrow"><span className="eyebrow-dot"></span><span data-i18n="navHistory">Scam history</span></div><h1 id="history-title" data-i18n="historyTitle">Scam history</h1><p data-i18n="historySubtitle">Cases checked in this browser.</p></div></div>
            <section className="surface"><div className="surface-title"><h3 data-i18n="historyTitle">Scam history</h3><span id="history-count">0</span></div><div className="history-list" id="history-list"></div></section>
          </section>

          <section className="page" id="page-dashboard" aria-labelledby="dashboard-title">
            <div className="page-head dashboard-head"><div><div className="eyebrow"><span className="eyebrow-dot"></span><span data-i18n="overview">Overview</span></div><h1 id="dashboard-title" data-i18n="dashboardTitle">Admin dashboard</h1><p data-i18n="dashboardSub">A local snapshot of checks and community reports.</p></div></div>
            <div className="dashboard-metrics">
              <article className="metric"><span className="metric-label" data-i18n="totalChecks">Messages checked</span><strong className="metric-value" id="metric-checks">0</strong><span className="metric-note"><i className="bi bi-arrow-up-right"></i> <span data-i18n="localSession">This browser session</span></span></article>
              <article className="metric"><span className="metric-label" data-i18n="highRisk">High risk flags</span><strong className="metric-value" id="metric-high">0</strong><span className="metric-note" data-i18n="riskSignals">Needs extra caution</span></article>
              <article className="metric"><span className="metric-label" data-i18n="reportsFiled">Reports filed</span><strong className="metric-value" id="metric-reports">0</strong><span className="metric-note" data-i18n="communityData">In this browser</span></article>
              <article className="metric"><span className="metric-label" data-i18n="usersTitle">Users</span><strong className="metric-value" id="metric-users">0</strong><span className="metric-note" data-i18n="adminAccountsNote">Accounts in this project</span></article>
            </div>
            <div className="dashboard-grid">
              <section className="surface"><div className="surface-title"><h3 data-i18n="riskActivity">Risk activity</h3><span data-i18n="recentChecks">Recent checks</span></div><div className="chart-bars" id="chart-bars" aria-label="Risk activity chart"></div></section>
              <section className="surface"><div className="surface-title"><h3 data-i18n="recentReports">Recent reports</h3><span id="report-total">0</span></div><div className="activity-list" id="activity-list"><div className="activity-item"><span className="activity-icon"><i className="bi bi-inbox"></i></span><div><strong data-i18n="noReportsYet">No reports yet</strong><small data-i18n="reportsAppear">Submitted reports appear here.</small></div></div></div></section>
            </div>
            <p className="input-help mt-3" data-i18n="adminDataNote">Admin statistics cover accounts and reports in this Supabase project.</p>
          </section>

          <section className="page" id="page-admin-reports" aria-labelledby="admin-reports-title"><div className="page-head"><div><div className="eyebrow"><span className="eyebrow-dot"></span><span data-i18n="overview">Admin</span></div><h1 id="admin-reports-title" data-i18n="adminReportsTitle">Review reported scams</h1></div></div><section className="surface"><div className="history-list" id="admin-reports-list"></div></section></section>
          <section className="page" id="page-scam-database" aria-labelledby="scam-database-title"><div className="page-head"><div><div className="eyebrow"><span className="eyebrow-dot"></span><span data-i18n="overview">Admin</span></div><h1 id="scam-database-title" data-i18n="scamDatabaseTitle">Scam database</h1><p data-i18n="databaseHint">Analyzed cases across all accounts.</p></div></div><section className="surface"><div className="history-list" id="admin-cases-list"></div></section></section>
          <section className="page" id="page-admin-users" aria-labelledby="admin-users-title"><div className="page-head"><div><div className="eyebrow"><span className="eyebrow-dot"></span><span data-i18n="overview">Admin</span></div><h1 id="admin-users-title" data-i18n="usersTitle">Users</h1></div></div><section className="surface"><form id="admin-invite-form" className="d-flex gap-2 mb-3"><label className="visually-hidden" htmlFor="admin-invite-email" data-i18n="emailAddress">Email address</label><input className="form-control" id="admin-invite-email" type="email" required data-i18n-placeholder="inviteAdminPlaceholder" placeholder="Invite admin by email" /><button className="btn btn-green text-nowrap" type="submit" data-i18n="inviteAdmin">Invite admin</button></form><div id="admin-users-list" className="history-list"></div></section></section>
          <section className="page" id="page-admin-insights" aria-labelledby="admin-insights-title"><div className="page-head"><div><div className="eyebrow"><span className="eyebrow-dot"></span><span data-i18n="overview">Admin</span></div><h1 id="admin-insights-title" data-i18n="insightsTitle">Scam trends and detection performance</h1></div></div><div className="dashboard-grid"><section className="surface"><div className="surface-title"><h2 data-i18n="scamTrends">Scam trends</h2></div><div id="admin-trends-list" className="history-list"></div></section><section className="surface"><div className="surface-title"><h2 data-i18n="detectionPerformance">Detection performance</h2></div><div id="admin-performance-list" className="history-list"></div></section></div></section>
        </main>
      </div>
      <div className="modal fade" id="report-modal" tabIndex="-1" aria-labelledby="report-title" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered"><div className="modal-content"><div className="modal-header"><div><div className="eyebrow mb-1"><span className="eyebrow-dot"></span><span data-i18n="communitySafety">Community safety</span></div><h2 className="modal-title fs-5" id="report-title" data-i18n="reportScamTitle">Report a scam</h2></div><button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
          <form id="report-form"><div className="modal-body"><p className="text-secondary small mb-3" data-i18n="reportIntro">Share the details without including passwords, PINs, or account numbers.</p><label className="form-label" htmlFor="report-type" data-i18n="scamType">Scam type</label><select className="form-select mb-3" id="report-type"><option value="SMS / messaging">SMS / messaging</option><option value="Bank impersonation">Bank impersonation</option><option value="Job offer">Job offer</option><option value="Online shopping">Online shopping</option><option value="Other">Other</option></select><label className="form-label" htmlFor="report-details" data-i18n="reportDetails">What happened?</label><textarea className="form-control" id="report-details" rows="3" maxLength="500" data-i18n-placeholder="reportPlaceholder" placeholder="Describe the suspicious message or interaction" required></textarea><div className="d-flex justify-content-end mt-3"><button className="btn btn-green" type="submit"><i className="bi bi-send me-1"></i><span data-i18n="submitReport">Submit report</span></button></div></div></form>
        </div></div>
      </div>
      <div className="toast-container position-fixed bottom-0 end-0 p-3"><div className="toast" id="app-toast" role="status" aria-live="polite"><div className="toast-body d-flex justify-content-between align-items-center"><span id="toast-message"></span><button type="button" className="btn-close ms-3" data-bs-dismiss="toast" aria-label="Close"></button></div></div></div>
    </>
  );
}
