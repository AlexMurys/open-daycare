import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ComposeProvider from "@/app/components/compose/ComposeProvider";
import MobileMenu from "@/app/components/shared/MobileMenu";
import Sidebar from "@/app/components/shared/Sidebar";
import { createClient } from "@/utils/supabase/server";
import type { SidebarUser } from "@/app/_data/mock";
import { staff as fallbackStaff } from "@/app/_data/mock";

const ROLE_LABEL: Record<string, string> = {
  staff: "Staff",
  parent: "Familia",
  admin: "Admin",
};

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

function shortDaycareName(name: string): string {
  // "Guardería Sala Soles" → "Soles"
  return name.replace(/^Guardería\s+(Sala\s+)?/i, "").trim();
}

async function getAuthUser(): Promise<SidebarUser> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: session } = await supabase.auth.getClaims();

  const userId = session?.claims?.sub;
  if (!userId) {
    redirect("/login");
  }

  // Read real user data from public.users
  const { data: user } = await supabase
    .from("users")
    .select("full_name, role, daycare_id")
    .eq("id", userId)
    .single();

  if (user?.full_name) {
    // Resolve daycare name
    let daycareShortName = "";
    if (user.daycare_id) {
      const { data: daycare } = await supabase
        .from("daycares")
        .select("name")
        .eq("id", user.daycare_id)
        .single();
      if (daycare?.name) {
        daycareShortName = shortDaycareName(daycare.name);
      }
    }

    return {
      name: user.full_name,
      role: `${ROLE_LABEL[user.role] ?? user.role}${daycareShortName ? ` · ${daycareShortName}` : ""}`,
      initial: getInitial(user.full_name),
    };
  }

  // Fallback to mock data
  return fallbackStaff;
}

export default async function DaycareLayout({ children }: LayoutProps<"/">) {
  const user = await getAuthUser();

  return (
    <ComposeProvider>
      <div className="flex min-h-screen bg-canvas md:h-screen">
        <div className="hidden h-full md:block">
          <Sidebar user={user} />
        </div>
        <MobileMenu user={user} />
        <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">{children}</main>
      </div>
    </ComposeProvider>
  );
}
