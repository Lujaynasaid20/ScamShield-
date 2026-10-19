"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ResultForItem } from "@/components/results";
import { ErrorState, Loading, PageHeader, useApiData, useConfirm, useToast } from "@/components/ui";
import { api } from "@/lib/api-client";

const TITLES = { message: "Message analysis", url: "URL scan", sender: "Sender check" };

export default function HistoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, loading, reload } = useApiData(`/api/history/${id}`);

  const remove = async () => {
    if (!(await confirm({ title: "Delete this entry?", body: "It will be permanently removed from your Scam History.", confirmLabel: "Delete", danger: true }))) return;
    try { await api(`/api/history/${id}`, { method: "DELETE" }); toast("Entry deleted.", "success"); router.push("/history"); } catch (requestError) { toast(requestError.message, "error"); }
  };

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/history" className="text-decoration-none"><i className="bi bi-arrow-left" aria-hidden="true" /> Scam history</Link>}
        title={data ? TITLES[data.item.kind] : "History entry"}
        actions={data && <button type="button" className="btn btn-outline" onClick={remove}><i className="bi bi-trash" aria-hidden="true" />Delete</button>}
      />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && <ResultForItem item={data.item} />}
    </>
  );
}
