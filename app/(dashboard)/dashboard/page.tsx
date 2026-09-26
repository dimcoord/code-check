"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  FileCheck,
  FileCode,
  GraduationCap,
  Plus,
  Send,
  UserPlus,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/utils/supabase/client"
import type { Profile } from "@/types/database"

export default function DashboardPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState({
    classesCount: 0,
    studentsCount: 0,
    assignmentsCount: 0,
    submissionsCount: 0,
    pendingGradingCount: 0,
  })
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
  const [activeAssignments, setActiveAssignments] = useState<any[]>([])

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // 1. Load Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()

        const currentProfile: Profile = profileData || {
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || "Pengguna",
          role: user.user_metadata?.role || "student",
          nim: user.user_metadata?.nim,
          university_email: user.user_metadata?.university_email || user.email,
        }

        setProfile(currentProfile)
        const isStaff =
          currentProfile.role === "lecturer" || currentProfile.role === "ta"

        if (isStaff) {
          // Staff queries
          const [classesRes, studentsRes, assignmentsRes, submissionsRes] =
            await Promise.all([
              supabase.from("classes").select("id", { count: "exact" }),
              supabase
                .from("profiles")
                .select("id", { count: "exact" })
                .eq("role", "student"),
              supabase.from("assignments").select("id", { count: "exact" }),
              supabase
                .from("submissions")
                .select("*, profiles(*), assignments(title)")
                .order("created_at", { ascending: false })
                .limit(5),
            ])

          const subs = submissionsRes.data || []
          const pendingCount = subs.filter((s: any) => s.score === null).length

          setStats({
            classesCount: classesRes.count || 0,
            studentsCount: studentsRes.count || 0,
            assignmentsCount: assignmentsRes.count || 0,
            submissionsCount: subs.length,
            pendingGradingCount: pendingCount,
          })
          setRecentSubmissions(subs)
        } else {
          // Student queries
          const [enrollmentsRes, assignmentsRes, mySubmissionsRes] =
            await Promise.all([
              supabase
                .from("class_enrollments")
                .select("id", { count: "exact" })
                .eq("user_id", user.id),
              supabase
                .from("assignments")
                .select("*, classes(name)")
                .order("created_at", { ascending: false })
                .limit(4),
              supabase
                .from("submissions")
                .select("*, assignments(title)")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(5),
            ])

          setStats({
            classesCount: enrollmentsRes.count || 0,
            studentsCount: 0,
            assignmentsCount: assignmentsRes.data?.length || 0,
            submissionsCount: mySubmissionsRes.data?.length || 0,
            pendingGradingCount: 0,
          })
          setActiveAssignments(assignmentsRes.data || [])
          setRecentSubmissions(mySubmissionsRes.data || [])
        }
      } catch (err) {
        console.error("Dashboard error:", err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [supabase])

  const isStaff = profile?.role === "lecturer" || profile?.role === "ta"

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">
                {isStaff ? "Dashboard Dosen & Asisten (TA)" : "Dashboard Mahasiswa"}
              </span>
              {profile?.nim && (
                <span className="text-xs text-blue-100 font-mono">
                  NIM: {profile.nim}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold mt-2 tracking-tight">
              Selamat Datang, {profile?.full_name || "Pengguna"}!
            </h2>
            <p className="text-sm text-blue-100 mt-1 max-w-xl">
              {isStaff
                ? "Kelola akun mahasiswa menggunakan email universitas, buat tugas pemrograman C++ dan Java, serta tinjau dan nilai hasil submisi kode."
                : "Kerjakan tugas coding menggunakan editor interaktif CodeMirror atau unggah file kode langsung untuk dievaluasi secara otomatis."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isStaff ? (
              <>
                <Button asChild variant="secondary" size="sm" className="gap-1.5 shadow-sm">
                  <Link href="/dashboard/assignments/new">
                    <Plus className="h-4 w-4" />
                    Buat Tugas
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border-white/30 text-white gap-1.5"
                >
                  <Link href="/dashboard/students">
                    <UserPlus className="h-4 w-4" />
                    Kelola Mahasiswa
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="secondary" size="sm" className="gap-1.5 shadow-sm">
                  <Link href="/dashboard/submit">
                    <Code2 className="h-4 w-4" />
                    Submit Kode Tugas
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border-white/30 text-white gap-1.5"
                >
                  <Link href="/dashboard/classes">
                    <BookOpen className="h-4 w-4" />
                    Gabung Kelas
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isStaff ? "Kelas Aktif" : "Kelas Diikuti"}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.classesCount}</div>
            <p className="text-xs text-slate-500 mt-1">
              <Link href="/dashboard/classes" className="text-blue-600 hover:underline">
                Buka daftar kelas &rarr;
              </Link>
            </p>
          </CardContent>
        </Card>

        {isStaff ? (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mahasiswa Terdaftar
              </CardTitle>
              <Users className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.studentsCount}</div>
              <p className="text-xs text-slate-500 mt-1">
                <Link href="/dashboard/students" className="text-blue-600 hover:underline">
                  Kelola akun mahasiswa &rarr;
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tugas Praktikum
              </CardTitle>
              <FileCode className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.assignmentsCount}</div>
              <p className="text-xs text-slate-500 mt-1">
                <Link href="/dashboard/assignments" className="text-blue-600 hover:underline">
                  Lihat semua tugas &rarr;
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isStaff ? "Tugas Dibuat" : "Submisi Saya"}
            </CardTitle>
            <FileCode className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isStaff ? stats.assignmentsCount : stats.submissionsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <Link href="/dashboard/assignments" className="text-blue-600 hover:underline">
                Kelola penugasan &rarr;
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isStaff ? "Perlu Dinilai" : "Tinjauan Terakhir"}
            </CardTitle>
            <FileCheck className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isStaff ? stats.pendingGradingCount : stats.submissionsCount > 0 ? "Tersedia" : "Belum ada"}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <Link href="/dashboard/submissions" className="text-blue-600 hover:underline">
                Buka review & nilai &rarr;
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Section: Staff vs Student */}
      {isStaff ? (
        /* STAFF RECENT SUBMISSIONS TABLE */
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Submisi Mahasiswa Terbaru</CardTitle>
              <CardDescription>
                Submisi kode pemrograman terbaru yang dikumpulkan mahasiswa.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/submissions">Lihat Semua Submisi</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                Belum ada kode mahasiswa yang dikumpulkan.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mahasiswa</TableHead>
                    <TableHead>Tugas</TableHead>
                    <TableHead>Bahasa</TableHead>
                    <TableHead>Status Judge0</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSubmissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900">
                          {sub.profiles?.full_name || "Mahasiswa"}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {sub.profiles?.nim || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{sub.problem}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {sub.language === "76" || sub.language === "54" ? "C++" : "Java"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={sub.status === "Accepted" ? "success" : "destructive"}
                          className="text-[10px]"
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.score !== null ? (
                          <span className="font-bold text-sm text-emerald-700">{sub.score} / 100</span>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-slate-500">
                            Belum Dinilai
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                          <Link href={`/dashboard/submissions/${sub.id}`}>Review & Nilai</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* STUDENT RECENT SUBMISSIONS & ASSIGNMENTS */
        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Assignments */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Tugas yang Tersedia</CardTitle>
                <CardDescription className="text-xs">
                  Tugas praktikum dari kelas yang Anda ikuti
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/dashboard/assignments">Semua Tugas</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeAssignments.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Belum ada tugas aktif untuk kelas Anda.
                </p>
              ) : (
                activeAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        {a.title}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {a.classes?.name || "Kelas"}
                      </span>
                    </div>
                    <Button asChild size="sm" className="h-7 text-xs">
                      <Link href={`/dashboard/submit?assignment_id=${a.id}`}>Kerjakan</Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Student Submissions */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Submisi Terakhir Saya</CardTitle>
                <CardDescription className="text-xs">
                  Riwayat kompilasi dan penilaian kode Anda
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/dashboard/submissions">Semua Submisi</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSubmissions.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Anda belum mengumpulkan tugas apa pun.
                </p>
              ) : (
                recentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        {sub.problem}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={sub.status === "Accepted" ? "success" : "destructive"}
                          className="text-[10px] py-0"
                        >
                          {sub.status}
                        </Badge>
                        {sub.score !== null ? (
                          <span className="text-[11px] font-bold text-emerald-700">
                            Nilai: {sub.score}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Menunggu penilaian</span>
                        )}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                      <Link href={`/dashboard/submissions/${sub.id}`}>Detail</Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}