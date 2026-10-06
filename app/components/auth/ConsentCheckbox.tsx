"use client";

import { useState } from "react";

export default function ConsentCheckbox() {
  const [checked, setChecked] = useState(true);

  return (
    <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#fbf1d6] px-4 py-[14px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`mt-px flex size-6 flex-none items-center justify-center rounded-[8px] peer-focus-visible:ring-2 peer-focus-visible:ring-[#5fb97e] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#fbf1d6] ${
          checked ? "bg-[#5fb97e]" : "border-2 border-[#5fb97e]"
        }`}
      >
        {checked && (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span className="text-[14px] leading-[1.45] text-[#8a7234]">
        Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la
        app.
      </span>
    </label>
  );
}
