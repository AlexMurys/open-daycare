import type { Metadata } from "next";
import BrandPanel from "@/app/components/auth/BrandPanel";
import LoginForm from "@/app/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión · OpenDayCare",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen md:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <div className="flex items-center justify-center p-10">
        <LoginForm />
      </div>
    </div>
  );
}
