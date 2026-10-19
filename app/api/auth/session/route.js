import { ACADEMY_VERSION, MODULES } from "@/lib/academy";
import { pool } from "@/lib/db";
import { notify } from "@/lib/notify";
import { authenticate, json, publicProfile, route } from "@/lib/server";

export const GET = route(async () => {
  const profile = await authenticate();
  // Announce academy content the user has not been told about yet (a real content change, once per version).
  if (profile.role === "user" && profile.academy_notified_version < ACADEMY_VERSION) {
    const updated = await pool.query("update profiles set academy_notified_version = $1 where id = $2 and academy_notified_version < $1 returning id", [ACADEMY_VERSION, profile.id]);
    if (updated.rowCount) {
      await notify(profile.id, "education", {
        title: `${MODULES.length} lessons are available in the Scam Awareness Academy`,
        body: "Short lessons with quizzes on phishing, mobile-money fraud, fake jobs and more.",
        link: "/academy"
      });
    }
  }
  return json({ profile: publicProfile(profile) });
});
