import type { Kid } from "@/app/_data/kids";
import { AVATAR_COLORS } from "./avatarColors";

export default function ProfileHeader({ kid }: { kid: Kid }) {
  const avatar = AVATAR_COLORS[kid.avatarColor];

  return (
    <div className="flex items-center gap-[18px]">
      <span
        className="flex size-[84px] flex-none items-center justify-center rounded-full font-display text-[34px] font-semibold"
        style={{ backgroundColor: avatar.bg, color: avatar.fg }}
      >
        {kid.initial}
      </span>
      <span className="min-w-0 flex-1">
        <h1 className="m-0 font-display text-[28px] font-semibold text-ink">
          {kid.name}
        </h1>
        <p className="mt-[3px] mb-0 text-[15px] text-ink-faint">
          {kid.age} años · Sala {kid.room}
        </p>
      </span>
      <button
        type="button"
        className="flex-none rounded-[12px] border-[1.5px] border-line bg-surface px-4 py-[9px] text-[14px] font-bold text-ink-muted"
      >
        Editar
      </button>
    </div>
  );
}