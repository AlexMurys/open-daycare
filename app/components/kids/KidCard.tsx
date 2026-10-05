import Link from "next/link";
import type { Kid } from "@/app/_data/kids";
import { AVATAR_COLORS } from "./avatarColors";

const ALLERGY_CHIP = "bg-[#FBD8CC] text-[#D9684A]";
const LINK_CHIP = "bg-[#F9D2DE] text-[#C56486]";

function parentsLabel(count: number): string {
  if (count === 0) return "sin padres vinculados";
  if (count === 1) return "1 padre vinculado";
  return `${count} padres vinculados`;
}

export default function KidCard({ kid }: { kid: Kid }) {
  const avatar = AVATAR_COLORS[kid.avatarColor];

  return (
    <Link
      href={`/kids/${kid.id}`}
      className="flex min-w-0 items-center gap-[14px] rounded-[18px] border border-line bg-surface p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition duration-150 hover:-translate-y-0.5 hover:border-[#F2A78E]"
    >
      <span
        className="flex size-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
        style={{ backgroundColor: avatar.bg, color: avatar.fg }}
      >
        {kid.initial}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[16px] font-semibold text-ink">
          {kid.name}
        </span>
        <span className="block text-[13px] text-ink-ghost">
          {kid.age} años · {parentsLabel(kid.parents.length)}
        </span>
      </span>

      {kid.allergyLabel ? (
        <span
          className={`flex-none rounded-full px-[9px] py-[5px] text-[11px] font-extrabold ${ALLERGY_CHIP}`}
        >
          {kid.allergyLabel}
        </span>
      ) : kid.parents.length === 0 ? (
        <span
          className={`flex-none rounded-full px-[9px] py-[5px] text-[11px] font-extrabold ${LINK_CHIP}`}
        >
          VINCULAR
        </span>
      ) : (
        <svg
          className="flex-none"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#CBB89F"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </Link>
  );
}