import { fetchBattles } from "@/lib/data";
import MapExperience from "@/components/MapExperience";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const battles = await fetchBattles();
  return <MapExperience battles={battles} />;
}
