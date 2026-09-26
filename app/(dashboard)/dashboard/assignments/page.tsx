"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  Edit2,
  FileCode,
  FileText,
  Plus,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import {
  deleteAssignmentAction,
  getAssignmentsAction,
} from "@/app/actions/assignment-actions"

export default function AssignmentsPage() {
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [isStaff, setIsStaff] = useState(false)
  const [assignments, setAssignments] = useState<any[]>([])

  const loadAssignments = async () => {
    try {
      setLoading(true)
      const data = await getAssignmentsAction()
      setAssignments(data)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat tugas",
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()

        setIsStaff(profile?.role === "lecturer" || profile?.role === "ta")
      }

      await loadAssignments()
    }

    init()
  }, [supabase])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus tugas "${title}" beserta seluruh submisi mahasiswa?`)) {
      return
    }

    try {
      await deleteAssignmentAction(id)
      toast({
        title: "Tugas berhasil dihapus",
      })
      await loadAssignments()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus tugas",
        description: err.message,
      })
    }
  }

  const getLanguageBadge = (lang: string) => {
    switch (lang) {
      case "cpp":
        return <Badge variant="secondary">C++</Badge>
      case "java":
        return <Badge variant="secondary">Java</Badge>
      default:
        return <Badge variant="outline">C++ & Java</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {isStaff ? "Manajemen Tugas Coding" : "Daftar Tugas Praktikum"}
          </h2>
          <p className="text-sm text-slate-500">
            {isStaff
              ? "Buat tugas pemrograman C++ dan Java, atur test case Judge0, dan evaluasi hasil submisi mahasiswa."
              : "Kerjakan dan kumpulkan tugas pemrograman sebelum tenggat waktu berakhir."}
          </p>
        </div>

        {isStaff && (
          <Button asChild className="gap-2 shadow-sm">
            <Link href="/dashboard/assignments/new">
              <Plus className="h-4 w-4" />
              Buat Tugas Baru
            </Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Memuat daftar tugas...
        </div>
      ) : assignments.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <FileCode className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-900">Belum ada tugas</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {isStaff
                ? "Mulai dengan membuat tugas coding pertama untuk mahasiswa di kelas Anda."
                : "Saat ini belum ada tugas baru yang ditugaskan oleh dosen atau asisten kelas Anda."}
            </p>
            {isStaff && (
              <Button asChild className="mt-4 gap-2">
                <Link href="/dashboard/assignments/new">
                  <Plus className="h-4 w-4" />
                  Buat Tugas Sekarang
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => {
            const isDuePassed =
              assignment.due_date && new Date(assignment.due_date) < new Date()
            const hasSubmitted = !!assignment.my_submission

            return (
              <Card
                key={assignment.id}
                className="flex flex-col justify-between shadow-sm hover:border-slate-300 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {assignment.classes?.name || "Kelas"}
                    </span>
                    {getLanguageBadge(assignment.language)}
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 mt-2 line-clamp-1">
                    {assignment.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">
                    {assignment.description || "Tidak ada deskripsi."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pb-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Tenggat:{" "}
                      {assignment.due_date
                        ? new Date(assignment.due_date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Tidak ditentukan"}
                    </span>
                    {isDuePassed && (
                      <Badge variant="destructive" className="text-[10px] py-0 px-1">
                        Selesai
                      </Badge>
                    )}
                  </div>

                  {isStaff ? (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-slate-500">
                      <span>Total Submisi:</span>
                      <span className="font-semibold text-slate-800">
                        {assignment.submissions_count} pengumpulan
                      </span>
                    </div>
                  ) : (
                    <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                      <span>Status Saya:</span>
                      {hasSubmitted ? (
                        <Badge variant="success" className="gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          {assignment.my_submission.score !== null
                            ? `Nilai: ${assignment.my_submission.score}`
                            : "Sudah Dikumpulkan"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                          Belum Mengumpulkan
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isStaff ? (
                    <>
                      <div className="flex gap-1">
                        <Button asChild variant="outline" size="sm" className="h-8 px-2.5">
                          <Link href={`/dashboard/assignments/${assignment.id}/edit`}>
                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(assignment.id, assignment.title)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <Button asChild size="sm" className="h-8 text-xs">
                        <Link href={`/dashboard/submissions?assignment=${assignment.id}`}>
                          Lihat Submisi
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button asChild className="w-full h-8 text-xs gap-1.5">
                      <Link href={`/dashboard/submit?assignment_id=${assignment.id}`}>
                        <Code2 className="h-3.5 w-3.5" />
                        {hasSubmitted ? "Kirim Ulang / Edit Submisi" : "Submit Kode Tugas"}
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
