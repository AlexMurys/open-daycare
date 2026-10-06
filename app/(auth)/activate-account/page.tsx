import type { Metadata } from "next";
import Link from "next/link";
import { invitation } from "@/app/_data/invite";
import ConsentCheckbox from "@/app/components/auth/ConsentCheckbox";
import InviteCard from "@/app/components/auth/InviteCard";

export const metadata: Metadata = {
  title: "Activar cuenta · OpenDayCare",
};

const LABEL_CLASS =
  "mb-2 block text-[12px] font-bold tracking-[0.7px] text-ink-faint";
const INPUT_CLASS =
  "mb-[18px] w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] text-ink placeholder:text-[#b6a99b]";

export default function ActivateAccountPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px] flex size-[58px] items-center justify-center rounded-[18px] bg-linear-[155deg] from-accent-mist to-accent-pale shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
          <svg
            width="30"
            height="30"
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
        </div>

        <h1 className="mb-2 font-display text-[32px] leading-[1.15] font-semibold text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-ink-faint">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
          activar la cuenta.
        </p>

        <InviteCard />

        <label htmlFor="invite-code" className={LABEL_CLASS}>
          CÓDIGO DE INVITACIÓN
        </label>
        <input
          id="invite-code"
          defaultValue={invitation.code}
          className={`${INPUT_CLASS} border-auth-line font-display text-[18px] font-bold tracking-[3px]`}
        />

        <label htmlFor="invite-email" className={LABEL_CLASS}>
          EMAIL
        </label>
        <input
          id="invite-email"
          type="email"
          defaultValue={invitation.email}
          className={`${INPUT_CLASS} border-auth-line`}
        />

        <label htmlFor="invite-password" className={LABEL_CLASS}>
          CREAR CONTRASEÑA
        </label>
        <input
          id="invite-password"
          type="password"
          defaultValue="contraseña"
          className={`${INPUT_CLASS} border-[#f2a78e]`}
        />

        <ConsentCheckbox />

        <button
          type="button"
          className="block w-full rounded-[15px] bg-linear-to-b from-accent-mid to-[#ee8164] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
        >
          Activar mi cuenta
        </button>

        <p className="mt-[22px] mb-0 text-center text-[14.5px] text-ink-faint">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-extrabold text-accent-strong">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
