import type { ParentStatus } from "@/app/_data/kids";
import type { Kid } from "@/app/_data/kids";
import { AVATAR_COLORS } from "./avatarColors";

const STATUS_LABEL: Record<ParentStatus, string> = {
  active: "activa",
  pending: "invitación enviada",
};

const STATUS_CHIP: Record<ParentStatus, { label: string; className: string }> =
  {
    active: { label: "ACTIVA", className: "bg-[#CFEBD8] text-[#3E9B6C]" },
    pending: { label: "PENDIENTE", className: "bg-[#F7E7A6] text-[#9A7B1E]" },
  };

export default function ParentsCard({ kid }: { kid: Kid }) {
  return (
    <div className="rounded-[16px] border border-line bg-surface px-[18px] py-4">
      <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[0.8px] text-ink-subtle">
        PADRES VINCULADOS
      </div>

      <div className="flex flex-col gap-[14px]">
        {kid.parents.map((parent) => {
          const avatar = AVATAR_COLORS[parent.avatarColor];
          const chip = STATUS_CHIP[parent.status];

          return (
            <div key={parent.name} className="flex items-center gap-3">
              <span
                className="flex size-10 flex-none items-center justify-center rounded-full font-display text-[16px] font-semibold"
                style={{ backgroundColor: avatar.bg, color: avatar.fg }}
              >
                {parent.initial}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-extrabold text-ink">
                  {parent.name}
                </span>
                <span className="block text-[12.5px] text-ink-ghost">
                  {parent.relation} · {STATUS_LABEL[parent.status]}
                </span>
              </span>
              <span
                className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${chip.className}`}
              >
                {chip.label}
              </span>
            </div>
          );
        })}

        <button
          type="button"
          className="flex items-center gap-3 pt-2 text-left"
        >
          <span className="flex size-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
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
      </div>
    </div>
  );
}