"use client";

import { useState } from "react";
import type { Kid, KidAvatarColor } from "@/app/_data/kids";
import AddKidButton from "./AddKidButton";
import type { NewKidInput } from "./AddKidDialog";
import KidsList from "./KidsList";

const ES_MONTHS = [
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

const AVATAR_ORDER: KidAvatarColor[] = [
  "sky",
  "rose",
  "mint",
  "amber",
  "violet",
  "blue",
];

function ageFromBirthdate(birthdate: string): number {
  const [day, month, year] = birthdate.split("/").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const beforeBirthday =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

function formatBirthDate(birthdate: string): string {
  const [day, month, year] = birthdate.split("/");
  return `${day} ${ES_MONTHS[Number(month) - 1]} ${year}`;
}

function currentEnrolledSince(): string {
  const today = new Date();
  return `${ES_MONTHS[today.getMonth()]} ${today.getFullYear()}`;
}

function toKid(input: NewKidInput, prev: Kid[]): Kid {
  const id = prev.reduce((max, kid) => Math.max(max, kid.id), 0) + 1;
  const name = input.name.trim();
  const allergyLabel = input.allergies[0]?.trim().toUpperCase();
  const allergyNotes = input.notes.trim();

  return {
    id,
    name,
    initial: name.charAt(0).toUpperCase(),
    age: ageFromBirthdate(input.birthdate),
    parents: [],
    avatarColor: AVATAR_ORDER[prev.length % AVATAR_ORDER.length],
    ...(allergyLabel ? { allergyLabel } : {}),
    ...(allergyNotes ? { allergyNotes } : {}),
    birthDate: formatBirthDate(input.birthdate),
    room: input.room,
    enrolledSince: currentEnrolledSince(),
  };
}

type KidsScreenProps = {
  initialKids: Kid[];
};

export default function KidsScreen({ initialKids }: KidsScreenProps) {
  const [list, setList] = useState<Kid[]>(initialKids);

  function handleAddKid(input: NewKidInput) {
    setList((prev) => [...prev, toKid(input, prev)]);
  }

  const count = list.length;

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pt-20 pb-20 md:px-10 md:pt-[34px] md:pb-20">
      <header className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-accent">
            GESTIÓN
          </div>
          <h1 className="m-0 font-display text-[30px] font-semibold text-ink">
            Niños
          </h1>
        </div>
        <AddKidButton onAddKid={handleAddKid} />
      </header>

      <KidsList kids={list}>
        <div className="mb-[14px] flex items-center gap-3">
          <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
            SALA SOLES
          </span>
          <span className="text-[13px] text-ink-ghost">
            {count} {count === 1 ? "niño" : "niños"}
          </span>
          <span className="h-px flex-1 bg-line-strong" />
        </div>
      </KidsList>
    </div>
  );
}
