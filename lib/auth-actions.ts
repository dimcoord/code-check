"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

interface ValidateLogin {
  email: string
  password: string
}

interface ValidateSignup {
  full_name: string
  email: string
  password: string
  nim: string
  kelas?: string
  role?: "student" | "ta" | "lecturer"
}

function checkSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url.includes("placeholder") || !key || key.includes("placeholder")) {
    throw new Error(
      "Koneksi Supabase belum dikonfigurasi. Buat file .env.local di folder proyek dan masukkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY dari dashboard Supabase Anda."
    )
  }
}

export async function login(formData: ValidateLogin) {
  checkSupabaseConfig()
  const supabase = createClient()

  let error = null
  try {
    const res = await supabase.auth.signInWithPassword({
      email: formData.email.trim(),
      password: formData.password,
    })
    error = res.error
  } catch (err: any) {
    if (err?.message?.includes("fetch failed") || err?.cause?.code === "ENOTFOUND") {
      throw new Error(
        "Gagal menghubungi server Supabase. Pastikan NEXT_PUBLIC_SUPABASE_URL di .env.local sudah benar dan internet aktif."
      )
    }
    throw err
  }

  if (error) {
    throw new Error(error.message || "Email atau kata sandi salah.")
  }

  revalidatePath("/dashboard", "layout")
  redirect("/dashboard")
}

export async function signup(formData: ValidateSignup) {
  checkSupabaseConfig()
  const supabase = createClient()

  const userRole = formData.role || "student"
  let authData: any = null
  let error: any = null

  try {
    const res = await supabase.auth.signUp({
      email: formData.email.trim(),
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          nim: formData.nim.trim(),
          kelas: formData.kelas?.trim() || "",
          university_email: formData.email.trim(),
          role: userRole,
        },
      },
    })
    authData = res.data
    error = res.error
  } catch (err: any) {
    if (err?.message?.includes("fetch failed") || err?.cause?.code === "ENOTFOUND") {
      throw new Error(
        "Gagal menghubungi server Supabase (fetch failed). Pastikan NEXT_PUBLIC_SUPABASE_URL di .env.local sudah benar dan internet aktif."
      )
    }
    throw err
  }

  if (error) {
    throw new Error(error.message || "Gagal melakukan pendaftaran.")
  }

  // Ensure profile is recorded
  if (authData?.user) {
    try {
      await supabase.from("profiles").upsert({
        id: authData.user.id,
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        role: userRole,
        nim: formData.nim.trim(),
        university_email: formData.email.trim(),
        kelas: formData.kelas?.trim() || null,
        updated_at: new Date().toISOString(),
      })
    } catch (profileErr) {
      console.warn("Could not upsert profile directly, trigger will handle it:", profileErr)
    }
  }

  revalidatePath("/dashboard", "layout")
  redirect("/dashboard")
}

export async function signout() {
  const supabase = createClient()
  try {
    await supabase.auth.signOut()
  } catch (err) {
    console.warn("Signout error:", err)
  }
  redirect("/logout")
}