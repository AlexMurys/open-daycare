import Link from "next/link";
import { staff } from "@/app/_data/mock";

export default function ShareBox() {
  return (
    <Link
      href="#"
      className="mb-6 flex w-full items-center gap-[14px] rounded-[18px] border border-line bg-surface px-[18px] py-[14px] shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)]"
    >
      <span className="flex size-10 flex-none items-center justify-center rounded-full bg-accent-pale font-display text-[16px] font-semibold text-white">
        {staff.initial}
      </span>
      <span className="flex-1 text-[15px] text-ink-ghost">Compartí un momento…</span>
      <span className="flex size-[38px] flex-none items-center justify-center rounded-xl bg-accent-wash text-accent-soft">
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </span>
    </Link>
  );
}
