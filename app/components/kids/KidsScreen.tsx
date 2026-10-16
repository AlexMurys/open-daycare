"use client";

import { useState } from "react";
import { addChild } from "@/app/actions/kids";
import type { Kid } from "@/app/_data/kids";
import AddKidButton from "./AddKidButton";
import type { NewKidInput } from "./AddKidDialog";
import type { RoomOption } from "./childMapping";
import KidsList from "./KidsList";

function toIsoDate(birthdate: string): string {
  const [day, month, year] = birthdate.split("/");
  return `${year}-${month}-${day}`;
}

type KidsScreenProps = {
  initialKids: Kid[];
  rooms: RoomOption[];
};

export default function KidsScreen({ initialKids, rooms }: KidsScreenProps) {
  const [list, setList] = useState<Kid[]>(initialKids);

  async function handleAddKid(
    input: NewKidInput,
  ): Promise<{ error: string | null }> {
    const room = rooms.find((option) => option.name === input.room);
    if (!room) {
      return { error: "No se pudo guardar el niño." };
    }

    const result = await addChild({
      fullName: input.name,
      birthDate: toIsoDate(input.birthdate),
      roomId: room.id,
      allergyTags: input.allergies,
      medicalNotes: input.notes,
    });

    if (result.error || !result.kid) {
      return { error: result.error ?? "No se pudo guardar el niño." };
    }

    const newKid = result.kid;
    setList((prev) => [...prev, newKid]);
    return { error: null };
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
        <AddKidButton rooms={rooms} onAddKid={handleAddKid} />
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
