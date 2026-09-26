"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, GraduationCap, Mail, Shield, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
import type { Profile } from "@/types/database"

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()

        if (data) {
          setProfile(data as Profile)
        } else {
          setProfile({
            id: user.id,
            email: user.email ?? "",
            full_name: user.user_metadata?.full_name || user.email || "Pengguna",
            role: user.user_metadata?.role || "student",
            nim: user.user_metadata?.nim,
            university_email: user.user_metadata?.university_email || user.email,
            kelas: user.user_metadata?.kelas,
            created_at: new Date().toISOString(),
          })
        }
      }
      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  if (loading) {
    return <p className="text-sm text-slate-500">Memuat profil pengguna...</p>
  }

  const roleLabel = {
    lecturer: "Dosen Pengampu",
    ta: "Asisten Dosen (TA)",
    student: "Mahasiswa",
  }[profile?.role || "student"]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Profil Akun</h2>
        <p className="text-sm text-slate-500">
          Informasi identitas akun dan universitas Anda di platform Koderium.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <CardTitle className="text-xl">{profile?.full_name}</CardTitle>
                <CardDescription>{profile?.email}</CardDescription>
              </div>
            </div>
            <Badge variant="default" className="text-sm py-1 px-3">
              {roleLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                Nomor Induk Mahasiswa (NIM)
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {profile?.nim || "-"}
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-blue-600" />
                Email Universitas
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {profile?.university_email || profile?.email || "-"}
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-blue-600" />
                Peran Akun
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 capitalize">
                {roleLabel}
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-blue-600" />
                Kelas Utama
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {profile?.kelas || "-"}
              </p>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard/classes">
                <BookOpen className="mr-2 h-4 w-4" />
                Buka Pengaturan Kelas
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
