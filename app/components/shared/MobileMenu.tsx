"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label="Abrir menú"
        className="fixed left-4 top-4 z-40 flex size-11 items-center justify-center rounded-2xl border border-line bg-surface text-ink shadow-[0_6px_16px_-10px_rgba(120,90,60,0.6)] md:hidden"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-ink/40"
          />
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="relative h-full w-[248px]"
          >
            <Sidebar onNavigate={close} />
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar menú"
              className="absolute -right-[52px] top-3 flex size-10 items-center justify-center rounded-full bg-surface text-ink shadow-[0_6px_16px_-10px_rgba(120,90,60,0.6)]"
            >
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
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
