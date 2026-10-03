import { fetchBattlesResult } from "@/lib/data";
import { BATTLES_REVALIDATE } from "@/lib/supabase";
import MapExperience from "@/components/MapExperience";

// Cached on the server (refreshed every 5 minutes, and instantly after an
// admin save). The client also re-syncs live, so visitors never see stale data.
export const revalidate = BATTLES_REVALIDATE;

export default async function MapPage() {
  const { battles, source, error } = await fetchBattlesResult();
  // Throw rather than cache an empty map: Next keeps serving the last good page.
  if (source === "error") throw new Error(`Battle data unavailable: ${error}`);
  return <MapExperience battles={battles} />;
}
