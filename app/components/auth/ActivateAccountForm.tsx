"use client";

import { useActionState } from "react";
import Link from "next/link";
import { activateAccount } from "@/app/actions/auth";
import ConsentCheckbox from "./ConsentCheckbox";

const LABEL_CLASS =
  "mb-2 block text-[12px] font-bold tracking-[0.7px] text-ink-faint";
const INPUT_CLASS =
  "mb-[18px] w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] text-ink placeholder:text-[#b6a99b]";

export default function ActivateAccountForm({
  code,
  email,
}: {
  code: string;
  email: string;
}) {
  const [state, formAction, isPending] = useActionState(activateAccount, {
    error: null,
  });

  return (
    <form action={formAction}>
      <label htmlFor="invite-code" className={LABEL_CLASS}>
        CÓDIGO DE INVITACIÓN
      </label>
      <input
        id="invite-code"
        name="code"
        defaultValue={code}
        placeholder="Ej. 7K4P9"
        className={`${INPUT_CLASS} border-auth-line font-display text-[18px] font-bold tracking-[3px]`}
      />

      <label htmlFor="invite-email" className={LABEL_CLASS}>
        EMAIL
      </label>
      <input
        id="invite-email"
        name="email"
        type="email"
        defaultValue={email}
        placeholder="correo@ejemplo.com"
        className={`${INPUT_CLASS} border-auth-line`}
      />

      <label htmlFor="invite-password" className={LABEL_CLASS}>
        CREAR CONTRASEÑA
      </label>
      <input
        id="invite-password"
        name="password"
        type="password"
        placeholder="••••••••"
        className={`${INPUT_CLASS} border-[#f2a78e]`}
      />

      <ConsentCheckbox />

      <button
        type="submit"
        disabled={isPending}
        className="block w-full rounded-[15px] bg-[linear-gradient(180deg,#f4977e,#ee8164)] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:opacity-70"
      >
        {isPending ? "Activando…" : "Activar mi cuenta"}
      </button>

      {state.error && (
        <p
          role="alert"
          className="mt-[14px] text-center text-[14px] font-semibold text-[#c0453b]"
        >
          {state.error}
        </p>
      )}

      <p className="mt-[22px] mb-0 text-center text-[14.5px] text-ink-faint">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-extrabold text-accent-strong">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
