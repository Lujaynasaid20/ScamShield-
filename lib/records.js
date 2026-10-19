import crypto from "node:crypto";
import { categoryLabel, VERDICTS } from "./analyzer.js";
import { REPORT_STATUSES } from "./constants.js";
import { HttpError } from "./server";

export { REPORT_CATEGORIES, REPORT_STATUSES } from "./constants.js";

export function historyItem(row, { full = false } = {}) {
  const verdict = VERDICTS[row.risk_level] || VERDICTS.low;
  const item = {
    id: row.id,
    kind: row.kind || "message",
    input: full ? row.message : row.message.length > 160 ? `${row.message.slice(0, 160)}…` : row.message,
    score: row.score,
    level: row.risk_level,
    verdict: verdict.verdict,
    verdictLabel: verdict.label,
    category: row.scam_type,
    categoryLabel: row.kind === "sender" ? "Sender check" : categoryLabel(row.scam_type),
    created_at: row.created_at
  };
  if (full) {
    item.details = row.details || {};
    item.signals = row.signals || [];
    item.url_checks = row.url_checks || [];
    item.phone_checks = row.phone_checks || [];
  }
  return item;
}

export function reportItem(row) {
  return {
    id: row.id,
    category: row.scam_type,
    details: row.details,
    message_text: row.message_text,
    url: row.url,
    sender_type: row.sender_type,
    sender_value: row.sender_value,
    case_id: row.case_id,
    status: row.status,
    statusLabel: REPORT_STATUSES[row.status] || row.status,
    admin_feedback: row.admin_feedback,
    created_at: row.created_at,
    updated_at: row.updated_at,
    ...(row.reporter_email !== undefined ? { reporter_email: row.reporter_email, reporter_name: row.reporter_name } : {}),
    ...(row.evidence_count !== undefined ? { evidence_count: Number(row.evidence_count) } : {})
  };
}

const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_EVIDENCE_PER_REPORT = 5;

function detectMime(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (!buffer.includes(0)) {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      return "text/plain";
    } catch { return null; }
  }
  return null;
}

// Validates uploaded evidence by content (magic bytes), not by the name or type the browser claims.
export async function readEvidenceFiles(formData, existingCount = 0) {
  const files = formData ? formData.getAll("evidence").filter(file => typeof file === "object" && file && file.size > 0) : [];
  if (existingCount + files.length > MAX_EVIDENCE_PER_REPORT) throw new HttpError(400, `A report can have at most ${MAX_EVIDENCE_PER_REPORT} evidence files.`);
  const accepted = [];
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) throw new HttpError(400, `${file.name || "A file"} is larger than 2 MB.`);
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = detectMime(buffer);
    if (!mime) throw new HttpError(400, `${file.name || "A file"} is not an allowed type. Upload PNG, JPEG, PDF or plain-text files.`);
    const baseName = String(file.name || "evidence").split(/[\\/]/).pop().replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "evidence";
    const extension = { "image/png": ".png", "image/jpeg": ".jpg", "application/pdf": ".pdf", "text/plain": ".txt" }[mime];
    const fileName = baseName.toLowerCase().endsWith(extension) ? baseName : `${baseName.replace(/\.[^.]*$/, "")}${extension}`;
    accepted.push({ fileName, mime, size: buffer.length, sha256: crypto.createHash("sha256").update(buffer).digest("hex"), data: buffer });
  }
  return accepted;
}

export async function insertEvidence(db, reportId, uploaderId, files) {
  for (const file of files) {
    await db.query(
      "insert into report_evidence (report_id, uploader_id, file_name, mime_type, size_bytes, sha256, data) values ($1, $2, $3, $4, $5, $6, $7)",
      [reportId, uploaderId, file.fileName, file.mime, file.size, file.sha256, file.data]
    );
  }
}

// Accepts JSON or multipart form data; returns plain fields plus the FormData (for files).
export async function readReportRequest(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    let formData;
    try { formData = await request.formData(); } catch { throw new HttpError(400, "The form could not be read."); }
    const fields = {};
    for (const [key, value] of formData.entries()) if (typeof value === "string") fields[key] = value;
    return { fields, formData };
  }
  try {
    const body = await request.json();
    return { fields: body && typeof body === "object" ? body : {}, formData: null };
  } catch {
    return { fields: {}, formData: null };
  }
}

// Maps an analysis category to the most relevant academy module.
export const CATEGORY_MODULE = {
  phishing: "phishing", financial: "mobile-money", job: "jobs", delivery: "shopping", prize: "prizes",
  investment: "investment", romance: "romance", account_takeover: "account-takeover", impersonation: "impersonation", shopping: "shopping",
  typeBank: "mobile-money", typeDelivery: "shopping", typeJob: "jobs", typePrize: "prizes", typeInvestment: "investment",
  typeRomance: "romance", typeCredential: "account-takeover", typeImpersonation: "impersonation"
};
