import Link from "next/link";

const LABEL_CLASS = "mb-2 block text-[12px] font-bold tracking-[0.7px] text-ink-faint";
const INPUT_CLASS =
  "w-full rounded-[14px] border-[1.5px] border-auth-line bg-white px-4 py-[14px] text-[15px] text-ink placeholder:text-[#b6a99b]";

export default function LoginForm() {
  return (
    <div className="w-full max-w-[392px]">
      <h2 className="mb-1.5 font-display text-[30px] font-semibold text-ink">
        Iniciar sesión
      </h2>
      <p className="mb-7 text-[15px] text-ink-faint">
        Ingresá para ver el día de hoy.
      </p>

      <label htmlFor="login-email" className={LABEL_CLASS}>
        EMAIL
      </label>
      <input
        id="login-email"
        type="email"
        placeholder="caro@opendaycare.com"
        className={`${INPUT_CLASS} mb-[18px]`}
      />

      <label htmlFor="login-password" className={LABEL_CLASS}>
        CONTRASEÑA
      </label>
      <input
        id="login-password"
        type="password"
        placeholder="••••••••"
        className={`${INPUT_CLASS} mb-2.5`}
      />

      <div className="mb-5 text-right">
        <span className="cursor-pointer text-[13.5px] font-bold text-accent-strong">
          ¿Olvidaste tu contraseña?
        </span>
      </div>

      <Link
        href="/"
        className="block w-full rounded-[15px] bg-[linear-gradient(180deg,#f4977e,#ee8164)] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
      >
        Iniciar sesión
      </Link>

      <p className="mt-6 mb-0 text-center text-[14.5px] text-ink-faint">
        ¿Te invitó la guardería?{" "}
        <Link href="/activate-account" className="font-extrabold text-accent-strong">
          Activá tu cuenta
        </Link>
      </p>
    </div>
  );
}
