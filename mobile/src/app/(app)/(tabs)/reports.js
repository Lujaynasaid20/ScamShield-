import { useRouter } from "expo-router";
import { useState } from "react";
import PagedList from "@/components/PagedList";
import { Body, Button, Row, Segmented, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { usePaged } from "@/lib/usePaged";

const FILTERS = [["", "All"], ["submitted", "New"], ["under_review", "Reviewing"], ["verified", "Verified"], ["resolved", "Closed"]];

export default function ReportsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const list = usePaged("/api/reports", { status });

  return (
    <PagedList
      list={list}
      loadingLabel="Loading your reports…"
      header={<>
        <Button title="Report a scam" icon="flag-outline" onPress={() => router.push("/reports/new")} />
        <Body small muted>Administrators review every report. You'll be notified when its status changes. Reports are private to you and administrators.</Body>
        <Segmented options={FILTERS} value={status} onChange={setStatus} />
      </>}
      renderItem={report => (
        <Row
          icon="flag-outline"
          title={`#${report.id} · ${report.category}`}
          subtitle={`${formatDate(report.created_at, { time: false })}${report.evidence_count ? ` · ${report.evidence_count} file${report.evidence_count === 1 ? "" : "s"}` : ""}${report.sender_value ? ` · ${report.sender_value}` : ""}`}
          right={<StatusBadge status={report.status} />}
          onPress={() => router.push({ pathname: "/reports/[id]", params: { id: report.id } })}
        />
      )}
      empty={status
        ? { icon: "flag-outline", title: "No reports with this status" }
        : { icon: "flag-outline", title: "No reports yet", body: "If you've received a scam, report it to help warn other users." }}
    />
  );
}
