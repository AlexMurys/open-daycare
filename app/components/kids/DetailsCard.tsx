import type { Kid } from "@/app/_data/kids";

export default function DetailsCard({ kid }: { kid: Kid }) {
  const rows: { label: string; value: string }[] = [
    { label: "Fecha de nacimiento", value: kid.birthDate },
    { label: "Sala", value: kid.room },
    { label: "Ingreso", value: kid.enrolledSince },
  ];

  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={`flex items-center justify-between px-[18px] py-[15px] ${
            index < rows.length - 1 ? "border-b border-line-soft" : ""
          }`}
        >
          <span className="text-[14.5px] text-ink-faint">{row.label}</span>
          <span className="text-[14.5px] font-extrabold text-ink">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}