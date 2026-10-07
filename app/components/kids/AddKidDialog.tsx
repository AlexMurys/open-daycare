"use client";

import { useEffect, useRef, useState } from "react";
import { rooms } from "@/app/_data/rooms";

const LABEL_CLASS =
  "mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-ink-faint";
const INPUT_CLASS =
  "w-full rounded-[14px] border-[1.5px] border-auth-line bg-white px-4 py-[13px] text-[15px] text-ink placeholder:text-[#b6a99b] focus:outline-none";
const ERROR_CLASS = "mt-1.5 block text-[13px] font-bold text-accent";

const DAY_MAX = 31;
const MONTH_MAX = 12;

function exceedsMax(candidate: string): boolean {
  if (candidate.length === 2) return Number(candidate) > DAY_MAX;
  if (candidate.length === 4) return Number(candidate.slice(2)) > MONTH_MAX;
  return false;
}

function formatBirthdate(digits: string, deleting: boolean): string {
  if (digits.length <= 2) {
    return digits.length === 2 && !deleting ? `${digits}/` : digits;
  }
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  if (digits.length <= 4) {
    return digits.length === 4 && !deleting
      ? `${day}/${month}/`
      : `${day}/${month}`;
  }
  return `${day}/${month}/${digits.slice(4)}`;
}

function maskBirthdate(prev: string, raw: string): string {
  const deleting = raw.length < prev.length;
  const rawDigits = raw.replace(/\D/g, "").slice(0, 8);
  let digits = "";
  for (const digit of rawDigits) {
    const candidate = digits + digit;
    if (exceedsMax(candidate)) continue;
    digits = candidate;
  }
  return formatBirthdate(digits, deleting);
}

function validateBirthdate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return "Ingresá la fecha completa (dd/mm/aaaa).";
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  if (!isRealDate) return "Ingresá una fecha de nacimiento válida.";
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (date.getTime() > todayStart.getTime())
    return "La fecha no puede ser futura.";
  return null;
}

type AddKidDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function AddKidDialog({ open, onClose }: AddKidDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const prevBirthdateRef = useRef("");
  const roomWrapRef = useRef<HTMLDivElement>(null);
  const roomTriggerRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [room, setRoom] = useState<string>(rooms[0]);
  const [roomOpen, setRoomOpen] = useState(false);
  const [roomUp, setRoomUp] = useState(false);
  const [roomHighlight, setRoomHighlight] = useState(0);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyDraft, setAllergyDraft] = useState("");
  const [notes, setNotes] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [birthdateError, setBirthdateError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setBirthdate("");
    setRoom(rooms[0]);
    setRoomOpen(false);
    setAllergies([]);
    setAllergyDraft("");
    setNotes("");
    setNameError(null);
    setBirthdateError(null);
    prevBirthdateRef.current = "";
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      nameInputRef.current?.focus();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!roomOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!roomWrapRef.current?.contains(event.target as Node)) {
        setRoomOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [roomOpen]);

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) handleClose();
  }

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Escape" && roomOpen) {
      event.preventDefault();
      setRoomOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    if (roomOpen) setRoomOpen(false);
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        "button, input, select, textarea, a[href], [tabindex]"
      )
    ).filter(
      (el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0
    );
    if (focusables.length === 0) return;
    const active = document.activeElement as HTMLElement | null;
    const index = active ? focusables.indexOf(active) : -1;
    event.preventDefault();
    if (event.shiftKey) {
      const prev = index <= 0 ? focusables.length - 1 : index - 1;
      focusables[prev].focus();
    } else {
      const next = index === -1 || index === focusables.length - 1 ? 0 : index + 1;
      focusables[next].focus();
    }
  }

  function openRoomList() {
    setRoomOpen(true);
    setRoomHighlight(Math.max(0, rooms.indexOf(room)));
  }

  function toggleRoomList() {
    if (roomOpen) {
      setRoomOpen(false);
      return;
    }
    const wrap = roomWrapRef.current;
    const dialog = dialogRef.current;
    let up = false;
    if (wrap && dialog) {
      const wrapRect = wrap.getBoundingClientRect();
      const dialogRect = dialog.getBoundingClientRect();
      const menuHeight = rooms.length * 44 + 11;
      const spaceBelow = dialogRect.bottom - wrapRect.bottom;
      const spaceAbove = wrapRect.top - dialogRect.top;
      up = menuHeight + 12 > spaceBelow && spaceAbove > spaceBelow;
    }
    setRoomUp(up);
    openRoomList();
  }

  function selectRoom(option: string) {
    setRoom(option);
    setRoomOpen(false);
    roomTriggerRef.current?.focus();
  }

  function handleRoomKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!roomOpen) openRoomList();
        else setRoomHighlight((index) => (index + 1) % rooms.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!roomOpen) openRoomList();
        else
          setRoomHighlight(
            (index) => (index - 1 + rooms.length) % rooms.length
          );
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!roomOpen) openRoomList();
        else selectRoom(rooms[roomHighlight]);
        break;
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextNameError = name.trim() ? null : "Ingresá el nombre completo.";
    const nextBirthdateError = validateBirthdate(birthdate);
    setNameError(nextNameError);
    setBirthdateError(nextBirthdateError);
    if (nextNameError || nextBirthdateError) return;
    handleClose();
  }

  function handleBirthdateChange(raw: string) {
    const prev = prevBirthdateRef.current;
    const masked = maskBirthdate(prev, raw);
    prevBirthdateRef.current = masked;
    setBirthdate(masked);
    if (birthdateError) setBirthdateError(null);
  }

  function addAllergy(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setAllergies((prev) => [...prev, trimmed]);
    setAllergyDraft("");
  }

  function handleAllergyChange(value: string) {
    if (!value.includes(",")) {
      setAllergyDraft(value);
      return;
    }
    const parts = value.split(",");
    addAllergy(parts[0]);
    setAllergyDraft(parts.slice(1).join(","));
  }

  function handleAllergyKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addAllergy(allergyDraft);
  }

  function removeAllergy(index: number) {
    setAllergies((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Agregar niño"
      onClose={handleClose}
      onClick={handleBackdropClick}
      onKeyDown={handleDialogKeyDown}
      onCancel={(event) => {
        if (roomOpen) {
          event.preventDefault();
          setRoomOpen(false);
        }
      }}
      className="m-auto max-h-[calc(100vh-48px)] w-[calc(100%-32px)] max-w-[520px] overflow-hidden rounded-[24px] border border-line bg-auth-canvas p-0 shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] [&::backdrop]:bg-[rgba(63,54,46,0.45)]"
    >
      <form onSubmit={handleSubmit} className="flex max-h-[calc(100vh-48px)] flex-col">
        <div className="flex flex-none items-center justify-between border-b border-line px-[26px] py-5">
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer text-[15px] font-bold text-ink-faint"
          >
            Cancelar
          </button>
          <span className="font-display text-[18px] font-semibold text-ink">
            Agregar niño
          </span>
          <button
            type="submit"
            className="cursor-pointer text-[15px] font-extrabold text-accent"
          >
            Guardar
          </button>
        </div>

        <div className="overflow-y-auto px-[26px] py-6">
          <div className="mb-[18px]">
            <label htmlFor="add-kid-name" className={LABEL_CLASS}>
              NOMBRE COMPLETO
            </label>
            <input
              id="add-kid-name"
              ref={nameInputRef}
              type="text"
              placeholder="Ej. Martina López"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (nameError) setNameError(null);
              }}
              aria-invalid={nameError ? true : undefined}
              className={`${INPUT_CLASS} ${nameError ? "border-accent" : ""}`}
            />
            {nameError && <p className={ERROR_CLASS}>{nameError}</p>}
          </div>

          <div className="mb-[18px] flex flex-col gap-[14px] sm:flex-row">
            <div className="flex-1">
              <label htmlFor="add-kid-birthdate" className={LABEL_CLASS}>
                FECHA DE NACIMIENTO
              </label>
              <input
                id="add-kid-birthdate"
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="dd/mm/aaaa"
                value={birthdate}
                onChange={(event) => handleBirthdateChange(event.target.value)}
                aria-invalid={birthdateError ? true : undefined}
                className={`${INPUT_CLASS} ${birthdateError ? "border-accent" : ""}`}
              />
              {birthdateError && <p className={ERROR_CLASS}>{birthdateError}</p>}
            </div>
            <div className="flex-1">
              <label id="add-kid-room-label" className={LABEL_CLASS}>
                SALA
              </label>
              <div ref={roomWrapRef} className="relative">
                <div
                  ref={roomTriggerRef}
                  role="combobox"
                  tabIndex={0}
                  aria-labelledby="add-kid-room-label"
                  aria-expanded={roomOpen}
                  aria-controls="add-kid-room-list"
                  aria-activedescendant={
                    roomOpen ? `add-kid-room-option-${roomHighlight}` : undefined
                  }
                  onClick={toggleRoomList}
                  onKeyDown={handleRoomKeyDown}
                  className={`${INPUT_CLASS} cursor-pointer truncate pr-10 font-bold`}
                >
                  {room}
                </div>
                <svg
                  className={`pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 transition-transform ${roomOpen ? "rotate-180" : ""}`}
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
                {roomOpen && (
                  <ul
                    id="add-kid-room-list"
                    role="listbox"
                    aria-labelledby="add-kid-room-label"
                    className={`absolute left-0 right-0 z-20 max-h-[176px] overflow-y-auto rounded-[14px] border-[1.5px] border-auth-line bg-white py-1 shadow-[0_16px_34px_-14px_rgba(63,54,46,0.45)] ${roomUp ? "bottom-full mb-1" : "top-full mt-1"}`}
                  >
                    {rooms.map((option, index) => (
                      <li
                        key={option}
                        id={`add-kid-room-option-${index}`}
                        role="option"
                        aria-selected={option === room}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectRoom(option)}
                        onMouseEnter={() => setRoomHighlight(index)}
                        className={`cursor-pointer px-4 py-[11px] text-[15px] font-bold ${
                          index === roomHighlight
                            ? "bg-auth-canvas text-ink"
                            : "text-ink-body"
                        }`}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="mb-[18px]">
            <label htmlFor="add-kid-allergies" className={LABEL_CLASS}>
              ALERGIAS (ETIQUETAS)
            </label>
            <input
              id="add-kid-allergies"
              type="text"
              placeholder="Ej. Maní, Lactosa"
              value={allergyDraft}
              onChange={(event) => handleAllergyChange(event.target.value)}
              onKeyDown={handleAllergyKeyDown}
              className={INPUT_CLASS}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {allergies.map((allergy, index) => (
                <span
                  key={`${allergy}-${index}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#FBD8CC] px-[9px] py-[5px] text-[11px] font-extrabold text-[#D9684A]"
                >
                  {allergy}
                  <button
                    type="button"
                    onClick={() => removeAllergy(index)}
                    aria-label={`Quitar ${allergy}`}
                    className="flex-none opacity-70 hover:opacity-100"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>

          <label htmlFor="add-kid-notes" className={LABEL_CLASS}>
            NOTAS MÉDICAS
          </label>
          <textarea
            id="add-kid-notes"
            placeholder="Indicaciones, medicación, contactos…"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className={`${INPUT_CLASS} min-h-[90px] resize-y leading-normal`}
          />
        </div>
      </form>
    </dialog>
  );
}
