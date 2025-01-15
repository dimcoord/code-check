"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

interface ValidateLogin {
    email: string;
    password: string;
}

interface ValidateSignup {
    full_name: string;
    email: string;
    password: string;
    nim: string;
    kelas: string;
}

export async function login(formData: ValidateLogin) {
  const supabase = createClient();

  const data = {
    email: formData.email,
    password: formData.password,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function signup(formData: ValidateSignup) {
  const supabase = createClient();

  const data = {
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.full_name,
        email: formData.email,
        nim: formData.nim,
        kelas: formData.kelas,
      },
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/cek-email", "layout");
  redirect("/cek-email");
}

export async function signout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.log(error);
    redirect("/error");
  }

  redirect("/logout");
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      redirectTo: `${origin}/auth/callback`
    },
  });

  if (error) {
    console.log(error);
    redirect("/error");
  }

  redirect(data.url);
}