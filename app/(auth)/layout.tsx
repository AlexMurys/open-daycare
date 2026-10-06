export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-auth-canvas leading-[normal] flex flex-col">
      {children}
    </div>
  );
}
