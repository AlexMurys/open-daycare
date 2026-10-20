"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import type { ParentRelation } from "@/app/_data/kids";
import { inviteParent } from "@/app/actions/parents";

const LABEL_CLASS =
  "mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-ink-faint";
const INPUT_CLASS =
  "w-full rounded-[14px] border-[1.5px] bg-white px-4 py-3.25 text-[15px] text-ink placeholder:text-[#b6a99b] focus:outline-none";
const ERROR_CLASS = "mt-1.5 block text-[13px] font-bold text-accent";

const RELATIONS: ParentRelation[] = ["Mamá", "Papá", "Tutor/a"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LinkParentDialogProps = {
  open: boolean;
  kidId: string;
  kidName: string;
  onClose: () => void;
};

interface InviteFormState {
  error: string | null;
  sentTo: string | null;
}

const INITIAL_STATE: InviteFormState = { error: null, sentTo: null };

export default function LinkParentDialog({
  open,
  kidId,
  kidName,
  onClose,
}: LinkParentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState<ParentRelation | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [relationError, setRelationError] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(
    async (): Promise<InviteFormState> => {
      const result = await inviteParent({
        childId: kidId,
        fullName: name.trim(),
        email: email.trim(),
        relation: relation as ParentRelation,
      });
      if (result.error) return { error: result.error, sentTo: null };
      return { error: null, sentTo: email.trim().toLowerCase() };
    },
    INITIAL_STATE,
  );

  const firstName = kidName.split(" ")[0];

  function resetForm() {
    setName("");
    setEmail("");
    setRelation(null);
    setNameError(null);
    setEmailError(null);
    setRelationError(null);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      nameInputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) handleClose();
  }

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        "button, input, select, textarea, a[href], [tabindex]"
      )
    ).filter(
      (el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0
    );
    if (focusables.length === 0) return;
    const active = document.activeElement as HTMLElement | null;
    const index = active ? focusables.indexOf(active) : -1;
    event.preventDefault();
    if (event.shiftKey) {
      const prev = index <= 0 ? focusables.length - 1 : index - 1;
      focusables[prev].focus();
    } else {
      const next = index === -1 || index === focusables.length - 1 ? 0 : index + 1;
      focusables[next].focus();
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const nextNameError = name.trim() ? null : "Ingresá el nombre completo.";
    const nextEmailError = !email.trim()
      ? "Ingresá el email."
      : EMAIL_RE.test(email.trim())
        ? null
        : "Ingresá un email válido.";
    const nextRelationError = relation ? null : "Elegí el parentesco.";
    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setRelationError(nextRelationError);
    if (nextNameError || nextEmailError || nextRelationError || !relation) {
      event.preventDefault();
    }
  }

  const successEmail = state.sentTo;

  return (
    <dialog
      ref={dialogRef}
      aria-label="Vincular padre"
      onClose={handleClose}
      onClick={handleBackdropClick}
      onKeyDown={handleDialogKeyDown}
      className="fixed inset-0 flex max-h-none max-w-none items-center justify-center bg-transparent p-4 h-screen w-screen backdrop:bg-[rgba(63,54,46,0.45)]"
    >
      <div className="flex max-h-full w-full max-w-120 flex-col overflow-hidden rounded-3xl border border-line bg-auth-canvas shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]">
        <div className="flex flex-none items-center justify-between border-b border-line px-6.5 py-5">
          <div className="min-w-0">
            <div className="font-display text-[18px] font-semibold text-ink">
              Vincular padre
            </div>
            <div className="text-[13px] text-ink-ghost">a {kidName}</div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="flex size-8.5 flex-none cursor-pointer items-center justify-center rounded-[10px] bg-line-soft text-ink-faint hover:opacity-80"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {successEmail ? (
          <div className="flex flex-col items-center px-6.5 py-10 text-center">
            <span className="mb-4 flex size-14 flex-none items-center justify-center rounded-full bg-achievement-bg">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3E9B6C"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <p className="font-display text-[17px] font-semibold text-ink">
              Le enviamos un código a
            </p>
            <p className="mt-1 max-w-full break-all text-[15px] font-extrabold text-ink">
              {successEmail}
            </p>
            <p className="mt-2 text-[13px] text-ink-ghost">
              El código vence en 7 días.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-7 w-full cursor-pointer rounded-[14px] bg-ink py-3.5 text-[15.5px] font-extrabold text-white hover:opacity-90"
            >
              Listo
            </button>
          </div>
        ) : (
          <form
            action={formAction}
            onSubmit={handleSubmit}
            noValidate
            className="overflow-y-auto px-6.5 py-5.5"
          >
            <div className="mb-5 flex gap-2.75 rounded-[14px] bg-[#E3ECFB] px-4 py-3.25">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4E72C8"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-px flex-none"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
                Le enviaremos un correo con un código para que active su cuenta.
                Solo verá el feed de {firstName}.
              </span>
            </div>

            <div className="mb-4.5">
              <label htmlFor="link-parent-name" className={LABEL_CLASS}>
                NOMBRE DEL PADRE/MADRE
              </label>
              <input
                id="link-parent-name"
                ref={nameInputRef}
                type="text"
                placeholder="Ej. Diego Fernández"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (nameError) setNameError(null);
                }}
                aria-invalid={nameError ? true : undefined}
                className={`${INPUT_CLASS} ${nameError ? "border-accent" : "border-auth-line"}`}
              />
              {nameError && <p className={ERROR_CLASS}>{nameError}</p>}
            </div>

            <div className="mb-4.5">
              <label htmlFor="link-parent-email" className={LABEL_CLASS}>
                EMAIL
              </label>
              <input
                id="link-parent-email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (emailError) setEmailError(null);
                }}
                aria-invalid={emailError ? true : undefined}
                className={`${INPUT_CLASS} ${emailError ? "border-accent" : "border-auth-line"}`}
              />
              {emailError && <p className={ERROR_CLASS}>{emailError}</p>}
            </div>

            <div className="mb-5">
              <span className="mb-2.5 block text-[12px] font-extrabold tracking-[0.7px] text-ink-faint">PARENTESCO</span>
              <div className="flex gap-2.25">
                {RELATIONS.map((option) => {
                  const active = relation === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setRelation(option);
                        if (relationError) setRelationError(null);
                      }}
                      className="flex-1 cursor-pointer rounded-full border-[1.5px] px-2.75 py-2.75 text-[14px] font-extrabold transition-colors"
                      style={
                        active
                          ? {
                              borderColor: "#9FB8EC",
                              background: "#CCD8F4",
                              color: "#4E72C8",
                            }
                          : {
                              borderColor: "#ECE0D0",
                              background: "#FFFDF9",
                              color: "#6E6359",
                            }
                      }
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {relationError && <p className={ERROR_CLASS}>{relationError}</p>}
            </div>

            {state.error && <p className={ERROR_CLASS}>{state.error}</p>}

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2.25 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-3.5 text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] hover:opacity-95 disabled:cursor-wait disabled:opacity-70"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4z" />
                <path d="M22 2 11 13" />
              </svg>
              {isPending ? "Enviando…" : "Enviar invitación"}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
