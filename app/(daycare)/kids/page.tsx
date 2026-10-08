import { kids } from "@/app/_data/kids";
import KidsScreen from "@/app/components/kids/KidsScreen";

export default function KidsPage() {
  return <KidsScreen initialKids={kids} />;
}
