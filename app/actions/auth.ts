"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export interface LoginState {
  error: string | null;
}

export async function login(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  await supabase.auth.signOut();
  redirect("/login");
}

export interface ActivateState {
  error: string | null;
}

interface InvitationInfo {
  childName: string;
  roomName: string;
  parentName: string;
  email: string;
  expiresAt: string;
  daycareId: string;
}

export async function activateAccount(
  prevState: ActivateState,
  formData: FormData,
): Promise<ActivateState> {
  const code = String(formData.get("code") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const consent = formData.get("consent");

  if (!code) return { error: "Ingresá el código de invitación." };
  if (!email) return { error: "Ingresá tu email." };
  if (password.length < 6)
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  if (!consent) return { error: "Tenés que aceptar los términos para continuar." };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data } = await supabase.rpc("get_invitation_info", { p_code: code });
  const invitation = data as InvitationInfo | null;

  if (!invitation) return { error: "El código no es válido o venció." };
  if (invitation.email.toLowerCase() !== email)
    return { error: "El email no coincide con la invitación." };

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        daycare_id: invitation.daycareId,
        full_name: invitation.parentName,
      },
    },
  });

  if (signUpError) {
    if (
      signUpError.status === 422 ||
      signUpError.message?.toLowerCase().includes("already registered")
    ) {
      return { error: "Ya existe una cuenta con este email. Iniciá sesión." };
    }
    return { error: "No se pudo crear la cuenta. Intentá de nuevo." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError && !signUpData.session) {
    return { error: "No se pudo iniciar la sesión para completar la activación." };
  }

  const { data: accepted } = await supabase.rpc("accept_invitation", {
    p_code: code,
  });

  if (!accepted) {
    await supabase.auth.signOut();
    return {
      error: "No se pudo completar la activación. Verificá el código y el email.",
    };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?activated=1");
}
