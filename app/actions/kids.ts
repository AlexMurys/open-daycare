"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { Kid } from "@/app/_data/kids";
import { mapChildRow, type ChildRow } from "@/app/components/kids/childMapping";
import { createClient } from "@/utils/supabase/server";

export interface ChildInput {
  fullName: string;
  birthDate: string;
  roomId: string;
  allergyTags: string[];
  medicalNotes: string;
}

export interface AddChildResult {
  error: string | null;
  kid: Kid | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export async function addChild(input: ChildInput): Promise<AddChildResult> {
  const fullName = input.fullName.trim();
  const medicalNotes = input.medicalNotes.trim();

  if (!fullName || !isValidIsoDate(input.birthDate)) {
    return { error: "No se pudo guardar el niño.", kid: null };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("id", input.roomId)
    .maybeSingle();

  if (roomError || !room) {
    return { error: "No se pudo guardar el niño.", kid: null };
  }

  const { data, error } = await supabase
    .from("children")
    .insert({
      full_name: fullName,
      room_id: input.roomId,
      birth_date: input.birthDate,
      allergy_tags: input.allergyTags,
      medical_notes: medicalNotes || null,
    })
    .select(
      "id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, room_id",
    )
    .single();

  if (error || !data) {
    return { error: "No se pudo guardar el niño.", kid: null };
  }

  revalidatePath("/kids");

  return { error: null, kid: mapChildRow(data as ChildRow, room.name) };
}
