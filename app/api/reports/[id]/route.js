import { loadAccessibleReport, reportDetail } from "@/lib/report-access";
import { json, route } from "@/lib/server";

export const GET = route(async (request, { params }) => {
  const { profile, report } = await loadAccessibleReport((await params).id);
  return json({ item: await reportDetail(report, profile) });
});
