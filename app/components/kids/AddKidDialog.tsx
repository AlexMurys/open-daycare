"use client";

import { useEffect, useRef } from "react";
import { rooms } from "@/app/_data/rooms";

const LABEL_CLASS =
  "mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-ink-faint";
const INPUT_CLASS =
  "w-full rounded-[14px] border-[1.5px] border-auth-line bg-white px-4 py-[13px] text-[15px] text-ink placeholder:text-[#b6a99b] focus:outline-none";

type AddKidDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function AddKidDialog({ open, onClose }: AddKidDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Agregar niño"
      onClose={onClose}
      className="m-auto max-h-[calc(100vh-48px)] w-[calc(100%-32px)] max-w-[520px] overflow-hidden rounded-[24px] border border-line bg-auth-canvas p-0 shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] [&::backdrop]:bg-[rgba(63,54,46,0.45)]"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
        }}
        className="flex max-h-[calc(100vh-48px)] flex-col"
      >
        <div className="flex flex-none items-center justify-between border-b border-line px-[26px] py-5">
          <button
            type="button"
            onClick={onClose}
            className="text-[15px] font-bold text-ink-faint"
          >
            Cancelar
          </button>
          <span className="font-display text-[18px] font-semibold text-ink">
            Agregar niño
          </span>
          <button
            type="submit"
            className="text-[15px] font-extrabold text-accent"
          >
            Guardar
          </button>
        </div>

        <div className="overflow-y-auto px-[26px] py-6">
          <label htmlFor="add-kid-name" className={LABEL_CLASS}>
            NOMBRE COMPLETO
          </label>
          <input
            id="add-kid-name"
            type="text"
            placeholder="Ej. Martina López"
            className={`${INPUT_CLASS} mb-[18px]`}
          />

          <div className="mb-[18px] flex flex-col gap-[14px] sm:flex-row">
            <div className="flex-1">
              <label htmlFor="add-kid-birthdate" className={LABEL_CLASS}>
                FECHA DE NACIMIENTO
              </label>
              <input
                id="add-kid-birthdate"
                type="text"
                placeholder="dd/mm/aaaa"
                className={INPUT_CLASS}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="add-kid-room" className={LABEL_CLASS}>
                SALA
              </label>
              <div className="relative">
                <select
                  id="add-kid-room"
                  defaultValue={rooms[0]}
                  className={`${INPUT_CLASS} cursor-pointer appearance-none pr-10 font-bold`}
                >
                  {rooms.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B0A290"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          <label htmlFor="add-kid-allergies" className={LABEL_CLASS}>
            ALERGIAS (ETIQUETAS)
          </label>
          <input
            id="add-kid-allergies"
            type="text"
            placeholder="Ej. Maní, Lactosa"
            className={`${INPUT_CLASS} mb-[18px]`}
          />

          <label htmlFor="add-kid-notes" className={LABEL_CLASS}>
            NOTAS MÉDICAS
          </label>
          <textarea
            id="add-kid-notes"
            placeholder="Indicaciones, medicación, contactos…"
            className={`${INPUT_CLASS} min-h-[90px] resize-y leading-normal`}
          />
        </div>
      </form>
    </dialog>
  );
}
