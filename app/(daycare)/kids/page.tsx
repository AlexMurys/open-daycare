import { kids } from "@/app/_data/kids";
import KidsList from "@/app/components/kids/KidsList";

export default function KidsPage() {
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
        <button
          type="button"
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
      </header>

      <KidsList kids={kids}>
        <div className="mb-[14px] flex items-center gap-3">
          <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
            SALA SOLES
          </span>
          <span className="text-[13px] text-ink-ghost">8 niños</span>
          <span className="h-px flex-1 bg-line-strong" />
        </div>
      </KidsList>
    </div>
  );
}