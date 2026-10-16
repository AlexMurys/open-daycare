import { cookies } from "next/headers";
import {
  mapChildRow,
  type ChildRow,
  type RoomOption,
} from "@/app/components/kids/childMapping";
import KidsScreen from "@/app/components/kids/KidsScreen";
import { createClient } from "@/utils/supabase/server";

export default async function KidsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: roomsData } = await supabase.from("rooms").select("id, name");

  const rooms: RoomOption[] = roomsData ?? [];
  const roomNameById = new Map(rooms.map((room) => [room.id, room.name]));

  const { data: childrenData } = await supabase
    .from("children")
    .select(
      "id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, room_id",
    );

  const initialKids = (childrenData ?? []).map((row) =>
    mapChildRow(row as ChildRow, roomNameById.get(row.room_id) ?? ""),
  );

  return <KidsScreen initialKids={initialKids} rooms={rooms} />;
}
