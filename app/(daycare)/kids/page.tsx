import { kids } from "@/app/_data/kids";
import AddKidButton from "@/app/components/kids/AddKidButton";
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
        <AddKidButton />
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