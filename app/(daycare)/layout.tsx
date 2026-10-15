import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ComposeProvider from "@/app/components/compose/ComposeProvider";
import MobileMenu from "@/app/components/shared/MobileMenu";
import Sidebar from "@/app/components/shared/Sidebar";
import { createClient } from "@/utils/supabase/server";

export default async function DaycareLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims) {
    redirect("/login");
  }

  return (
    <ComposeProvider>
      <div className="flex min-h-screen bg-canvas md:h-screen">
        <div className="hidden h-full md:block">
          <Sidebar />
        </div>
        <MobileMenu />
        <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">{children}</main>
      </div>
    </ComposeProvider>
  );
}
