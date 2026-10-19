import type { Metadata } from "next";
import { cookies } from "next/headers";
import ActivateAccountForm from "@/app/components/auth/ActivateAccountForm";
import InviteCard from "@/app/components/auth/InviteCard";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Activar cuenta · OpenDayCare",
};

const LABEL_CLASS =
  "mb-2 block text-[12px] font-bold tracking-[0.7px] text-ink-faint";

interface InvitationInfo {
  childName: string;
  roomName: string;
  parentName: string;
  email: string;
  expiresAt: string;
  daycareId: string;
}

export default async function ActivateAccountPage({
  searchParams,
}: PageProps<"/activate-account">) {
  const params = await searchParams;
  const rawCode = params.code;
  const code = (typeof rawCode === "string" ? rawCode : "").trim();

  let info: InvitationInfo | null = null;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data } = await supabase.rpc("get_invitation_info", {
      p_code: code,
    });
    info = data as InvitationInfo | null;
  }

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

        {info && <InviteCard childName={info.childName} roomName={info.roomName} />}

        {code && !info && (
          <p
            role="alert"
            className={`${LABEL_CLASS} mb-[22px] rounded-[14px] bg-[#fdecea] px-4 py-3 text-[14px] text-[#c0453b]`}
          >
            El código no es válido o venció.
          </p>
        )}

        <ActivateAccountForm code={info ? code : ""} email={info?.email ?? ""} />
      </div>
    </div>
  );
}
