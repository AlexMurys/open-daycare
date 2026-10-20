import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BrandPanel from "@/app/components/auth/BrandPanel";
import LoginForm from "@/app/components/auth/LoginForm";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Iniciar sesión · OpenDayCare",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const activated = params.activated === "1";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: claims } = await supabase.auth.getClaims();

  if (claims) {
    redirect("/");
  }

  return (
    <div className="grid min-h-screen md:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-[392px]">
          <div className="mb-8 flex items-center gap-[13px] md:hidden">
            <span className="flex size-[46px] flex-none items-center justify-center rounded-[14px] bg-linear-[155deg] from-accent-mist to-accent-pale">
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
            <span className="font-display text-[21px] font-semibold tracking-[0.5px] text-ink">
              OpenDayCare
            </span>
          </div>
          {activated && (
            <p
              role="status"
              className="mb-6 rounded-[14px] bg-[#e8f6ec] px-4 py-3 text-[14px] font-semibold text-[#2f7a45]"
            >
              ¡Tu cuenta quedó activa! Iniciá sesión.
            </p>
          )}
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
