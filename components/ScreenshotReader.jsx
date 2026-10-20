"use client";

import { useEffect, useRef, useState } from "react";
import { formatBytes } from "@/lib/api-client";

// Reads the text in a screenshot with tesseract.js (English + Swahili), entirely in the browser.
// The image never leaves the device; only the OCR engine and language files are downloaded (from jsDelivr).
const TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;
const LANGUAGES = ["eng", "swa"];
const STAGES = { "loading tesseract core": "Loading the text reader", "loading language traineddata": "Loading English and Swahili", "initializing api": "Starting", "recognizing text": "Reading text" };

// Upscales small screenshots and turns dark-mode (light-on-dark) text dark-on-light, which OCR reads far better.
async function prepareImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(3, Math.max(1, 1400 / bitmap.width), 4000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  let total = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    pixels[i] = pixels[i + 1] = pixels[i + 2] = gray;
    total += gray;
  }
  if (total / (pixels.length / 4) < 110) for (let i = 0; i < pixels.length; i += 4) pixels[i] = pixels[i + 1] = pixels[i + 2] = 255 - pixels[i];
  context.putImageData(image, 0, 0);
  return canvas;
}

// Drops OCR noise: blank runs, and lines without a single letter or digit.
const cleanText = text => text.split("\n").map(line => line.replace(/\s+/g, " ").trim()).filter(line => /[\p{L}\p{N}]/u.test(line)).join("\n").trim();

export default function ScreenshotReader({ onText, pasteTarget, disabled }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const workerRef = useRef(null);
  const runRef = useRef(0);
  const inputRef = useRef(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => () => { workerRef.current?.terminate(); }, []);

  const read = async picked => {
    setError("");
    if (!TYPES.includes(picked.type)) { setError("Choose a PNG, JPEG or WebP image."); return; }
    if (picked.size > MAX_BYTES) { setError(`That image is ${formatBytes(picked.size)}. The limit is 10 MB.`); return; }
    workerRef.current?.terminate();
    const run = ++runRef.current;
    const current = () => runRef.current === run;
    setDone(false);
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    setProgress({ label: "Preparing image", value: 0 });
    try {
      const image = await prepareImage(picked);
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(LANGUAGES, 1, {
        logger: message => current() && setProgress(state => state && { label: STAGES[message.status] || state.label, value: message.status === "recognizing text" ? message.progress : state.value })
      });
      if (!current()) { worker.terminate(); return; }
      workerRef.current = worker;
      const { data } = await worker.recognize(image);
      if (!current()) return;
      await worker.terminate();
      workerRef.current = null;
      const text = cleanText(data.text || "");
      if (!text) setError("No text was found in this image. Try a sharper screenshot, or type the message instead.");
      else { onTextRef.current(text); setDone(true); }
    } catch (readError) {
      if (!current()) return;
      console.error("Screenshot reading failed:", readError);
      workerRef.current?.terminate();
      workerRef.current = null;
      setError(navigator.onLine === false
        ? "You're offline. The text reader needs to download once before it can read screenshots."
        : "The screenshot couldn't be read. Check your connection and try again, or type the message instead.");
    } finally {
      if (current()) setProgress(null);
    }
  };

  const cancel = () => {
    runRef.current += 1;
    workerRef.current?.terminate();
    workerRef.current = null;
    setProgress(null);
  };
  const clear = () => { cancel(); setFile(null); setPreviewUrl(null); setError(""); };

  // Paste a screenshot (Ctrl+V / long-press) straight into the message box.
  useEffect(() => {
    const target = pasteTarget?.current;
    if (!target) return;
    const onPaste = event => {
      const image = [...(event.clipboardData?.files || [])].find(item => item.type.startsWith("image/"));
      if (!image) return;
      event.preventDefault();
      read(image);
    };
    target.addEventListener("paste", onPaste);
    return () => target.removeEventListener("paste", onPaste);
  });

  const busy = Boolean(progress);
  return (
    <div className="screenshot-reader">
      <input ref={inputRef} id="screenshot" className="visually-hidden" type="file" accept={TYPES.join(",")} disabled={disabled || busy}
        onChange={event => { const picked = event.target.files[0]; event.target.value = ""; if (picked) read(picked); }} aria-describedby="screenshot-hint" />
      <div className="d-flex flex-wrap gap-2 align-items-center">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => inputRef.current?.click()} disabled={disabled || busy}>
          <i className="bi bi-image" aria-hidden="true" />{file ? "Use another screenshot" : "Upload a screenshot"}
        </button>
        <span id="screenshot-hint" className="small-print">PNG, JPEG or WebP, up to 10 MB. You can also paste a screenshot into the box. Your screenshot stays on your phone or computer. Only the text we find in it is checked.</span>
      </div>
      {file && (
        <div className="screenshot-preview mt-2">
          {previewUrl && <img src={previewUrl} alt="Your screenshot" />}
          <div className="min-w-0 flex-grow-1">
            <div className="small text-truncate"><i className="bi bi-image me-1" aria-hidden="true" />{file.name || "Pasted screenshot"} <span className="muted">{formatBytes(file.size)}</span></div>
            {busy ? (
              <div aria-live="polite">
                <div className="small-print mt-1">{progress.label}… {progress.value ? `${Math.round(progress.value * 100)}%` : ""}</div>
                <div className="progress-bar-track mt-1" role="progressbar" aria-label="Reading screenshot" aria-valuenow={Math.round(progress.value * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="progress-bar-fill" style={{ width: `${Math.max(4, progress.value * 100)}%` }} />
                </div>
                <button type="button" className="btn-link-plain small mt-1" onClick={cancel}>Cancel</button>
              </div>
            ) : done && <div className="small-print mt-1 text-success"><i className="bi bi-check2" aria-hidden="true" /> Text added to the message box. Check it before analyzing: links and numbers are sometimes misread.</div>}
          </div>
          <button type="button" className="btn-link-plain align-self-start" onClick={clear} aria-label="Remove screenshot"><i className="bi bi-x-lg" aria-hidden="true" /></button>
        </div>
      )}
      {error && <div className="text-danger small mt-2" role="alert">{error}</div>}
    </div>
  );
}
