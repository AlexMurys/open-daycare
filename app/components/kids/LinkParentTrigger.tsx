"use client";

import { useState } from "react";
import LinkParentDialog from "./LinkParentDialog";

export default function LinkParentTrigger({
  kidId,
  kidName,
}: {
  kidId: string;
  kidName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 pt-2 text-left"
      >
        <span className="flex size-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-placeholder-ink">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className="text-[14.5px] font-extrabold text-accent-strong">
          Vincular otro padre
        </span>
      </button>

      {open && (
        <LinkParentDialog
          open={open}
          kidId={kidId}
          kidName={kidName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
