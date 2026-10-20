"use client";

import { useEffect, useRef, useState } from "react";
import { MessageResult } from "@/components/results";
import ScreenshotReader from "@/components/ScreenshotReader";
import { PageHeader, useToast } from "@/components/ui";
import { useShell } from "@/components/AppShell";
import { analyzeMessage } from "@/lib/analyzer";
import { api } from "@/lib/api-client";

// Illustrative examples written for this tool, not real reported messages.
const EXAMPLES = {
  "Urgent bank alert": "URGENT: Your bank account will be suspended today. Verify your PIN now at https://bit.ly/verify-account or access will be blocked.",
  "Prize message": "Congratulations! You have won a free gift. Pay a small processing fee now to claim your prize: www.claim-reward.example",
  "Job offer": "Hello! We are hiring part-time online reviewers. Earn $200 daily from home. Pay a registration fee of $15 to start today. WhatsApp me for details.",
  "Normal delivery update": "Your delivery is scheduled for tomorrow between 10:00 and 12:00. Track your parcel in the courier app you already use."
};
const LEVEL_TONE = { low: "tone-safe", medium: "tone-warn", high: "tone-danger" };

export default function AnalyzePage() {
  const toast = useToast();
  const { refreshUnread } = useShell();
  const [message, setMessage] = useState("");
  const [fromScreenshot, setFromScreenshot] = useState(false);
  const messageRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const resultRef = useRef(null);

  useEffect(() => {
    const trimmed = message.trim();
    if (!trimmed) { setPreview(null); return; }
    const timer = setTimeout(() => setPreview(analyzeMessage(trimmed)), 400);
    return () => clearTimeout(timer);
  }, [message]);

  const submit = async event => {
    event.preventDefault();
    if (!message.trim()) { toast("Paste a message first so it can be checked.", "error"); return; }
    setBusy(true);
    try {
      const data = await api("/api/analyze", { method: "POST", body: { message, source: fromScreenshot ? "screenshot" : "text" } });
      setOutcome({ item: { ...data.item, details: { ...data.item.details, recommendations: data.recommendations } }, result: data.result });
      refreshUnread();
      setTimeout(() => resultRef.current?.focus(), 50);
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const addScreenshotText = text => {
    const combined = message.trim() ? `${message.trim()}

${text}` : text;
    if (combined.length > 5000) toast("The screenshot had more text than fits (5,000 characters), so the end was cut off.", "error");
    setMessage(combined.slice(0, 5000));
    setFromScreenshot(true);
    messageRef.current?.focus();
  };

  return (
    <>
      <PageHeader
        eyebrow={<><i className="bi bi-chat-left-text" aria-hidden="true" />Check before you click</>}
        title="Analyze a message"
        description="Paste an SMS, email, social-media message or chat, or upload a screenshot of it. Rule-based checks and an experimental English/Swahili text model assess warning signs and explain the evidence."
      />
      <div className="grid grid-main-side">
        <form className="card-panel" onSubmit={submit}>
          <label className="form-label" htmlFor="message">Suspicious message</label>
          <textarea ref={messageRef} id="message" className="form-control message-input" maxLength={5000} value={message} onChange={event => setMessage(event.target.value)} placeholder="Paste the full message or a screenshot here…" aria-describedby="message-help" />
          <div className="mt-2"><ScreenshotReader onText={addScreenshotText} pasteTarget={messageRef} disabled={busy} /></div>
          <div className="d-flex justify-content-between align-items-center mt-2 gap-2 flex-wrap">
            <div aria-live="polite">
              {preview && <span className={`badge-status ${LEVEL_TONE[preview.level]}`}>Live preview: {preview.verdictLabel} · {preview.score}/100</span>}
            </div>
            <span className="char-count">{message.length} / 5000</span>
          </div>
          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-3">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className="small-print">Try an example:</span>
              {Object.entries(EXAMPLES).map(([label, text]) => <button key={label} type="button" className="btn btn-outline btn-sm" onClick={() => { setMessage(text); setFromScreenshot(false); }}>{label}</button>)}
            </div>
            <div className="d-flex gap-2">
              {message && <button type="button" className="btn btn-outline" onClick={() => { setMessage(""); setFromScreenshot(false); setOutcome(null); }}>Clear</button>}
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className="bi bi-shield-check" aria-hidden="true" />}Analyze message
              </button>
            </div>
          </div>
        </form>
        <aside className="card-panel" id="message-help">
          <h2 className="h6"><i className="bi bi-lock me-1" aria-hidden="true" />How your message is handled</h2>
          <ul className="tick-list small">
            <li><i className="bi bi-check2 text-success" aria-hidden="true" /><span>Checked by ScamShield's rule-based engine and an experimental local text model. It is <strong>not</strong> sent to an outside AI service.</span></li>
            <li><i className="bi bi-check2 text-success" aria-hidden="true" /><span>Saved to your private Scam History so you can review it later. You can delete it at any time.</span></li>
            <li><i className="bi bi-check2 text-success" aria-hidden="true" /><span>Your screenshot stays on your phone or computer. Only the text we find in it is checked, and the image is never saved.</span></li>
            <li><i className="bi bi-check2 text-success" aria-hidden="true" /><span>Links in the message are never opened.</span></li>
            <li><i className="bi bi-exclamation-circle text-warning" aria-hidden="true" /><span>Remove passwords, PINs and account numbers before pasting, and crop them out of screenshots.</span></li>
          </ul>
          <p className="small-print mb-0">Automated checks can miss new scams and occasionally flag genuine messages. When in doubt, contact the organization through an official channel.</p>
        </aside>
      </div>
      {outcome && (
        <section className="mt-4" aria-label="Analysis result" tabIndex={-1} ref={resultRef}>
          <MessageResult item={outcome.item} result={outcome.result} />
        </section>
      )}
    </>
  );
}
