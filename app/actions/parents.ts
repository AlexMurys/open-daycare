"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { randomInt } from "node:crypto";
import { Resend } from "resend";
import { createClient } from "@/utils/supabase/server";
import { renderInvitationEmail } from "@/utils/emails/invitation";
import type { ParentRelation } from "@/app/_data/kids";

export interface InviteParentInput {
  childId: string;
  fullName: string;
  email: string;
  relation: ParentRelation;
}

export interface InviteParentResult {
  error: string | null;
}

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;
const CODE_ATTEMPTS = 3;
const INVITATION_TTL_DAYS = 7;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RELATIONSHIP_BY_LABEL: Record<
  ParentRelation,
  "mother" | "father" | "guardian"
> = {
  "Mamá": "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
};

function generateCode(): string {
  let code = "";
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

export async function inviteParent(
  input: InviteParentInput,
): Promise<InviteParentResult> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const relationship = RELATIONSHIP_BY_LABEL[input.relation];

  if (!fullName) return { error: "Ingresá el nombre completo." };
  if (!email) return { error: "Ingresá el email." };
  if (!EMAIL_RE.test(email)) return { error: "Ingresá un email válido." };
  if (!relationship) return { error: "Elegí el parentesco." };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return { error: "Iniciá sesión para invitar padres." };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "staff") {
    return { error: "No tenés permiso para invitar padres." };
  }

  if (!UUID_RE.test(input.childId)) {
    return { error: "No se encontró al niño." };
  }
  const { data: child } = await supabase
    .from("children")
    .select("full_name, rooms ( name )")
    .eq("id", input.childId)
    .maybeSingle();
  if (!child) return { error: "No se encontró al niño." };

  const { data: accepted } = await supabase
    .from("invitations")
    .select("id")
    .eq("child_id", input.childId)
    .eq("email", email)
    .eq("status", "accepted")
    .maybeSingle();
  if (accepted) {
    return { error: "Ese email ya está vinculado a este niño." };
  }

  const { data: pending } = await supabase
    .from("invitations")
    .select("id")
    .eq("child_id", input.childId)
    .eq("email", email)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let code = "";
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    const candidate = generateCode();
    const { data: existing } = await supabase
      .from("invitations")
      .select("id")
      .eq("code", candidate)
      .maybeSingle();
    if (!existing) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    return { error: "No se pudo generar un código de invitación." };
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";
  const activateUrl = `${origin}/activate-account?code=${code}`;

  const childRow = child as {
    full_name: string;
    rooms: { name: string }[] | null;
  };
  const roomName = childRow.rooms?.[0]?.name ?? "";
  const { subject, html } = renderInvitationEmail({
    parentName: fullName,
    childName: childRow.full_name,
    roomName,
    code,
    activateUrl,
  });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendError } = await resend.emails.send({
      from: "OpenDayCare <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });
    if (sendError) {
      return { error: "No se pudo enviar el correo de invitación." };
    }
  } catch {
    return { error: "No se pudo enviar el correo de invitación." };
  }

  const expiresAt = new Date(
    Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  if (pending) {
    const { error: updateError } = await supabase
      .from("invitations")
      .update({
        code,
        expires_at: expiresAt,
        full_name: fullName,
        relationship,
        invited_by: user.id,
      })
      .eq("id", pending.id);
    if (updateError) {
      return { error: "No se pudo guardar la invitación." };
    }
  } else {
    const { error: insertError } = await supabase.from("invitations").insert({
      child_id: input.childId,
      invited_by: user.id,
      full_name: fullName,
      email,
      relationship,
      code,
      expires_at: expiresAt,
    });
    if (insertError) {
      return { error: "No se pudo guardar la invitación." };
    }
  }

  revalidatePath("/kids/[id]");
  return { error: null };
}
