"use client";

import { useEffect, useRef, useState } from "react";
import AddKidDialog, { type NewKidInput } from "./AddKidDialog";

type AddKidButtonProps = {
  onAddKid: (input: NewKidInput) => void;
};

export default function AddKidButton({ onAddKid }: AddKidButtonProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      buttonRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[14px] bg-linear-to-b from-accent-mid to-[#ee8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Agregar niño
      </button>
      <AddKidDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={onAddKid}
      />
    </>
  );
}
