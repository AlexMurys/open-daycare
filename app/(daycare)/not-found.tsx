import Link from "next/link";

export default function DaycareNotFound() {
  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pt-20 pb-20 md:px-10 md:pt-[34px]">
      <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-accent">
        ERROR 404
      </div>
      <h1 className="m-0 font-display text-[30px] font-semibold text-ink">
        No encontramos esta página
      </h1>
      <p className="mt-[5px] mb-0 max-w-[46ch] text-[14.5px] text-ink-faint">
        El enlace que seguiste no existe o cambió de lugar. Volvé al feed para
        seguir con la sala.
      </p>

      <Link
        href="/"
        className="mt-[22px] inline-flex items-center gap-2 rounded-[14px] bg-linear-to-b from-accent-mid to-[#ee8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
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
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Volver al Feed
      </Link>
    </div>
  );
}