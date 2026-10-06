export default function BrandPanel() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-linear-[155deg] from-[#f6a98e] from-0% via-[#f2937a] via-45% to-[#ec7e62] px-[60px] py-14 text-white">
      <div className="absolute top-[-140px] right-[-120px] size-[420px] rounded-full bg-white/12" />
      <div className="absolute bottom-[-110px] left-[-80px] size-[300px] rounded-full bg-white/10" />

      <div className="relative flex items-center gap-[13px]">
        <span className="flex size-[46px] flex-none items-center justify-center rounded-[14px] bg-white/22">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </span>
        <span className="font-display text-[21px] font-semibold tracking-[0.5px]">
          OpenDayCare
        </span>
      </div>

      <div className="relative">
        <h1 className="mb-[18px] font-display text-[42px] leading-[1.12] font-semibold">
          El día de cada niño,
          <br />
          compartido con su familia.
        </h1>
        <p className="m-0 max-w-[430px] text-[17px] leading-[1.6] text-white/92">
          Publicá momentos, gestioná las salas y mantené a las familias cerca,
          desde un solo lugar.
        </p>
      </div>

      <div className="relative text-[14px] text-white/90">
        🌿 Guardería Sala Soles
      </div>
    </div>
  );
}
