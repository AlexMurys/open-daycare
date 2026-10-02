import MobileMenu from "@/app/components/shared/MobileMenu";
import Sidebar from "@/app/components/shared/Sidebar";

export default function DaycareLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen bg-canvas md:h-screen">
      <div className="hidden h-full md:block">
        <Sidebar />
      </div>
      <MobileMenu />
      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">{children}</main>
    </div>
  );
}
