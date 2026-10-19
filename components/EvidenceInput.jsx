"use client";

import { formatBytes } from "@/lib/api-client";

const ACCEPT = ".png,.jpg,.jpeg,.pdf,.txt,image/png,image/jpeg,application/pdf,text/plain";
const MAX_BYTES = 2 * 1024 * 1024;

// File picker for report evidence. The server re-checks every file's real type and size.
export default function EvidenceInput({ files, onChange, max = 5, id = "evidence" }) {
  const add = event => {
    const picked = [...event.target.files];
    event.target.value = "";
    const problems = picked.filter(file => file.size > MAX_BYTES).map(file => `${file.name} is larger than 2 MB.`);
    const accepted = picked.filter(file => file.size <= MAX_BYTES);
    onChange([...files, ...accepted].slice(0, max), problems.length ? problems.join(" ") : files.length + accepted.length > max ? `Only ${max} files can be attached.` : "");
  };
  return (
    <div>
      <label className="form-label" htmlFor={id}>Supporting evidence <span className="muted fw-normal">(optional)</span></label>
      <input id={id} className="form-control" type="file" multiple accept={ACCEPT} onChange={add} disabled={files.length >= max} aria-describedby={`${id}-hint`} />
      <div id={`${id}-hint`} className="form-hint">Screenshots (PNG/JPEG), PDF or text files, up to 2 MB each, {max} files maximum. Hide passwords, PINs and full account numbers first. Files are only visible to you and administrators.</div>
      {files.length > 0 && (
        <ul className="list-unstyled mt-2 mb-0">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="d-flex align-items-center gap-2 small py-1">
              <i className="bi bi-paperclip" aria-hidden="true" /><span className="text-truncate">{file.name}</span><span className="muted">{formatBytes(file.size)}</span>
              <button type="button" className="btn-link-plain ms-auto" onClick={() => onChange(files.filter((_, i) => i !== index), "")} aria-label={`Remove ${file.name}`}><i className="bi bi-x-lg" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
