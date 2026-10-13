"use client";

import { useEffect, useRef, useState } from "react";
import { kids } from "@/app/_data/kids";
import type { FeedPost, PostType } from "@/app/_data/mock";
import { AVATAR_COLORS } from "@/app/components/kids/avatarColors";

const LABEL_CLASS =
  "mb-2.5 block text-[12px] font-extrabold tracking-[0.7px] text-ink-faint";
const ERROR_CLASS = "mt-1.5 block text-[13px] font-bold text-accent";

type TypeOption = {
  type: PostType;
  label: string;
  light: string;
  solid: string;
};

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: "meal",
    label: "Comida",
    light: "bg-meal-bg text-meal",
    solid: "bg-meal text-white",
  },
  {
    type: "nap",
    label: "Siesta",
    light: "bg-nap-bg text-nap",
    solid: "bg-nap text-white",
  },
  {
    type: "activity",
    label: "Actividad",
    light: "bg-activity-bg text-activity",
    solid: "bg-activity text-white",
  },
  {
    type: "achievement",
    label: "Logro",
    light: "bg-achievement-bg text-achievement",
    solid: "bg-achievement text-white",
  },
  {
    type: "mood",
    label: "Ánimo",
    light: "bg-mood-bg text-mood",
    solid: "bg-mood text-white",
  },
  {
    type: "photo",
    label: "Foto",
    light: "bg-photo-bg text-photo",
    solid: "bg-photo text-white",
  },
  {
    type: "announcement",
    label: "Anuncio",
    light: "bg-announcement-bg text-announcement",
    solid: "bg-announcement text-white",
  },
];

type ComposeDialogProps = {
  open: boolean;
  onClose: () => void;
  onPublish: (post: FeedPost) => void;
};

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function ComposeDialog({
  open,
  onClose,
  onPublish,
}: ComposeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [para, setPara] = useState<number | "room" | null>(null);
  const [type, setType] = useState<PostType | null>(null);
  const [text, setText] = useState("");
  const [paraError, setParaError] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);

  function resetForm() {
    setPara(null);
    setType(null);
    setText("");
    setParaError(null);
    setTypeError(null);
    setTextError(null);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
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

  function buildPost(): FeedPost {
    const kid = typeof para === "number" ? kids.find((k) => k.id === para) : undefined;
    const firstName = kid ? kid.name.split(" ")[0] : undefined;
    return {
      id: crypto.randomUUID(),
      type: type!,
      author: kid ? firstName! : "Anuncio general",
      initial: kid ? kid.initial : undefined,
      time: formatTime(new Date()),
      audience: kid ? `familia de ${firstName}` : "toda la sala",
      text: text.trim(),
      likes: 0,
      comments: 0,
    };
  }

  function validateAndPublish() {
    const nextParaError =
      para === null ? "Elegí para quién es la publicación." : null;
    const nextTypeError = type === null ? "Elegí el tipo de publicación." : null;
    const nextTextError = text.trim() ? null : "Escribí una descripción.";
    setParaError(nextParaError);
    setTypeError(nextTypeError);
    setTextError(nextTextError);
    if (nextParaError || nextTypeError || nextTextError) return;
    onPublish(buildPost());
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    validateAndPublish();
  }

  function handleTextKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      validateAndPublish();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Nueva publicación"
      onClose={handleClose}
      onClick={handleBackdropClick}
      className={`fixed inset-0 flex h-screen w-screen max-h-none max-w-none items-center justify-center bg-transparent p-0 [&::backdrop]:bg-[rgba(63,54,46,0.45)] ${!open ? "hidden" : ""}`}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[calc(100vh-48px)] w-[calc(100%-32px)] max-w-145 flex-col overflow-hidden rounded-3xl border border-line bg-auth-canvas shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
      >
        <div className="flex flex-none items-center justify-between border-b border-line px-6.5 py-5">
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer text-[15px] font-bold text-ink-faint"
          >
            Cancelar
          </button>
          <span className="font-display text-[18px] font-semibold text-ink">
            Nueva publicación
          </span>
          <button
            type="submit"
            className="cursor-pointer text-[15px] font-extrabold text-accent"
          >
            Publicar
          </button>
        </div>

        <div className="overflow-y-auto px-6.5 py-6">
          <div className="mb-5.5">
            <div className={LABEL_CLASS}>PARA</div>
            <div className="flex flex-wrap gap-2.25">
              {kids.map((kid) => {
                const selected = para === kid.id;
                const colors = AVATAR_COLORS[kid.avatarColor];
                return (
                  <button
                    key={kid.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setPara(kid.id);
                      if (paraError) setParaError(null);
                    }}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] py-1.5 pr-3.5 pl-1.5 text-[14px] font-bold transition-colors ${
                      selected
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-surface text-ink-muted"
                    }`}
                  >
                    <span
                      className="flex size-6.5 flex-none items-center justify-center rounded-full font-display text-[13px] font-semibold"
                      style={{ background: colors.bg, color: colors.fg }}
                    >
                      {kid.initial}
                    </span>
                    {kid.name.split(" ")[0]}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={para === "room"}
                onClick={() => {
                  setPara("room");
                  if (paraError) setParaError(null);
                }}
                className={`cursor-pointer rounded-full border-[1.5px] px-4 py-1.5 text-[14px] font-bold transition-colors ${
                  para === "room"
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-surface text-ink-muted"
                }`}
              >
                Toda la sala
              </button>
            </div>
            {paraError && <p className={ERROR_CLASS}>{paraError}</p>}
          </div>

          <div className="mb-5.5">
            <div className={LABEL_CLASS}>TIPO</div>
            <div className="flex flex-wrap gap-2.25">
              {TYPE_OPTIONS.map((option) => {
                const selected = type === option.type;
                return (
                  <button
                    key={option.type}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setType(option.type);
                      if (typeError) setTypeError(null);
                    }}
                    className={`cursor-pointer rounded-full border-none px-4 py-2 text-[13.5px] font-extrabold transition-colors ${
                      selected ? option.solid : option.light
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {typeError && <p className={ERROR_CLASS}>{typeError}</p>}
          </div>

          <div className="mb-5.5">
            <label htmlFor="compose-description" className={LABEL_CLASS}>
              DESCRIPCIÓN
            </label>
            <textarea
              id="compose-description"
              placeholder="Contá cómo le fue hoy…"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                if (textError) setTextError(null);
              }}
              onKeyDown={handleTextKeyDown}
              aria-invalid={textError ? true : undefined}
              className={`min-h-30 w-full resize-y rounded-[14px] border-[1.5px] bg-white px-4 py-3.5 text-[15px] leading-normal text-ink placeholder:text-[#b6a99b] focus:outline-none ${
                textError ? "border-accent" : "border-auth-line"
              }`}
            />
            {textError && <p className={ERROR_CLASS}>{textError}</p>}
          </div>

          <div className={LABEL_CLASS}>FOTOS</div>
          <div className="flex gap-3">
            <div className="flex size-24 flex-none items-center justify-center rounded-[14px] border border-line bg-placeholder-bg text-[#cbb89f]">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
              </svg>
            </div>
            <div className="flex size-24 flex-none cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-placeholder-line bg-placeholder-bg text-placeholder-ink">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#c5503a"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="text-[12px]">Agregar</span>
            </div>
          </div>
        </div>
      </form>
    </dialog>
  );
}
