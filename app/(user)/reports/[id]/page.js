"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import EvidenceInput from "@/components/EvidenceInput";
import { EvidenceList, ReportSummary, Timeline } from "@/components/ReportDetail";
import { ErrorState, Loading, Notice, PageHeader, useApiData, useToast } from "@/components/ui";
import { api } from "@/lib/api-client";

function AddInformation({ report, onAdded }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const [busy, setBusy] = useState(false);
  const remaining = Math.max(0, 5 - report.evidence.length);

  const submit = async event => {
    event.preventDefault();
    if (!note.trim() && !files.length) { toast("Write a note or attach a file.", "error"); return; }
    setBusy(true);
    const body = new FormData();
    body.set("note", note);
    files.forEach(file => body.append("evidence", file));
    try {
      const { item } = await api(`/api/reports/${report.id}/updates`, { method: "POST", body });
      setNote(""); setFiles([]);
      toast("Information added to your report.", "success");
      onAdded(item);
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card-panel" onSubmit={submit}>
      <h2 className="h6">Add more information</h2>
      <label className="visually-hidden" htmlFor="extra-note">Additional information</label>
      <textarea id="extra-note" className="form-control" rows={3} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} placeholder="Anything new? For example, the scammer contacted you again." />
      {remaining > 0 && <div className="mt-2"><EvidenceInput id="extra-evidence" files={files} max={remaining} onChange={(next, problem) => { setFiles(next); setFileError(problem); }} /></div>}
      {fileError && <div className="text-danger small mt-1">{fileError}</div>}
      <button type="submit" className="btn btn-primary btn-sm mt-2" disabled={busy}>{busy && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}Add to report</button>
    </form>
  );
}

export default function ReportDetailPage() {
  const { id } = useParams();
  const { data, error, loading, reload, setData } = useApiData(`/api/reports/${id}`);
  const report = data?.item;

  return (
    <>
      <PageHeader eyebrow={<Link href="/reports" className="text-decoration-none"><i className="bi bi-arrow-left" aria-hidden="true" /> My scam reports</Link>} title={report ? `Report #${report.id}` : "Report"} />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {report && (
        <div className="grid grid-main-side">
          <div className="stack">
            <ReportSummary report={report} />
            {report.can_add_info ? <AddInformation report={report} onAdded={item => setData({ item })} /> : <Notice icon="bi-lock">This report is {report.statusLabel.toLowerCase()}, so it can no longer be changed. Submit a new report if something else happens.</Notice>}
          </div>
          <div className="stack">
            <Timeline report={report} />
            <EvidenceList report={report} />
          </div>
        </div>
      )}
    </>
  );
}
