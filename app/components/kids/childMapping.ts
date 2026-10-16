import type { Kid, KidAvatarColor } from "@/app/_data/kids";

export const ES_MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export const AVATAR_ORDER: KidAvatarColor[] = [
  "sky",
  "rose",
  "mint",
  "amber",
  "violet",
  "blue",
];

export interface RoomOption {
  id: string;
  name: string;
}

export interface ChildRow {
  id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string | null;
  allergy_tags: string[];
  room_id: string;
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function ageFromIso(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const beforeBirthday =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

function formatBirthDateIso(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day} ${ES_MONTHS[Number(month) - 1]} ${year}`;
}

function monthYearFromIso(iso: string): string {
  const [year, month] = iso.split("-");
  return `${ES_MONTHS[Number(month) - 1]} ${year}`;
}

export function mapChildRow(row: ChildRow, roomName: string): Kid {
  const name = row.full_name.trim();
  const allergyLabel = row.allergy_tags[0]?.trim().toUpperCase();
  const allergyNotes = row.medical_notes?.trim();

  return {
    id: row.id,
    name,
    initial: name.charAt(0).toUpperCase(),
    age: ageFromIso(row.birth_date),
    parents: [],
    avatarColor: AVATAR_ORDER[hashString(row.id) % AVATAR_ORDER.length],
    ...(allergyLabel ? { allergyLabel } : {}),
    ...(allergyNotes ? { allergyNotes } : {}),
    birthDate: formatBirthDateIso(row.birth_date),
    room: roomName,
    enrolledSince: monthYearFromIso(row.enrolled_at),
  };
}
