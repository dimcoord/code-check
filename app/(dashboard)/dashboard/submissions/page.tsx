import Link from "next/link"
import { CheckCircle2, Clock, Code2, Eye, FileCheck, FileCode, FileUp, Filter } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/utils/supabase/server"
import { getCurrentUserAndProfile } from "@/lib/auth-helpers"
import { updateStatus } from "@/app/actions/update-status"

function getLanguageBadge(language: string) {
  if (language === "76" || language === "54" || language === "cpp") {
    return <Badge variant="outline" className="font-mono text-[11px] bg-blue-50 text-blue-700 border-blue-200">C++</Badge>
  }
  if (language === "62" || language === "91" || language === "java") {
    return <Badge variant="outline" className="font-mono text-[11px] bg-orange-50 text-orange-700 border-orange-200">Java</Badge>
  }
  return <Badge variant="outline" className="font-mono text-[11px]">{language}</Badge>
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Accepted":
      return <Badge variant="success">{status}</Badge>
    case "In Queue":
    case "Processing":
    case "Pending":
      return <Badge variant="default">{status}</Badge>
    default:
      return <Badge variant="destructive">{status}</Badge>
  }
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string; class?: string }>
}) {
  const params = await searchParams
  const supabase = createClient()
  const { user, profile, isStaff } = await getCurrentUserAndProfile()

  try {
    await updateStatus()
  } catch (error) {
    console.error("Failed to refresh submission statuses", error)
  }

  let query = supabase
    .from("submissions")
    .select("*, profiles(*), assignments(id, title, class_id, max_score, classes(id, name))")
    .order("created_at", { ascending: false })

  // If user is a student, only show their own submissions
  if (!isStaff && user) {
    query = query.eq("user_id", user.id)
  }

  // Optional filter by assignment id
  if (params.assignment) {
    query = query.eq("assignment_id", params.assignment)
  }

  const { data: submissions, error } = await query

  if (error) {
    console.error("Error loading submissions:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {isStaff ? "Review & Penilaian Submisi Mahasiswa" : "Riwayat Submisi Saya"}
          </h2>
          <p className="text-sm text-slate-500">
            {isStaff
              ? "Periksa source code C++ dan Java mahasiswa, uji ulang via Judge0, dan berikan nilai serta catatan feedback."
              : "Lihat hasil kompilasi, status evaluasi Judge0, dan penilaian dari dosen atau asisten."}
          </p>
        </div>

        {!isStaff && (
          <Button asChild className="gap-2 shadow-sm">
            <Link href="/dashboard/submit">
              <Code2 className="h-4 w-4" />
              Kirim Submisi Baru
            </Link>
          </Button>
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {isStaff ? "Daftar Pengumpulan Mahasiswa" : "Submisi Program"}
              </CardTitle>
              <CardDescription>
                Total: {submissions?.length || 0} submisi tercatat
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!submissions || submissions.length === 0 ? (
            <div className="py-12 text-center">
              <FileCode className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-900">Belum ada submisi</p>
              <p className="text-xs text-slate-500 mt-1">
                {isStaff
                  ? "Mahasiswa belum mengumpulkan kode tugas."
                  : "Anda belum mengumpulkan kode program untuk tugas apa pun."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isStaff && <TableHead>Mahasiswa</TableHead>}
                    <TableHead>Tugas / Masalah</TableHead>
                    <TableHead>Bahasa</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Status Judge0</TableHead>
                    <TableHead>Nilai Dosen/TA</TableHead>
                    <TableHead>Waktu Kirim</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission: any) => (
                    <TableRow key={submission.id}>
                      {isStaff && (
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 text-xs">
                              {submission.profiles?.full_name || "Mahasiswa"}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              NIM: {submission.profiles?.nim || "-"}
                            </span>
                          </div>
                        </TableCell>
                      )}

                      <TableCell className="font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span>{submission.problem}</span>
                          {submission.assignments?.classes?.name && (
                            <span className="text-[11px] text-slate-500">
                              {submission.assignments.classes.name}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>{getLanguageBadge(submission.language)}</TableCell>

                      <TableCell>
                        {submission.file_name ? (
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                            <FileUp className="h-3.5 w-3.5 text-blue-600" />
                            <span className="truncate max-w-[120px]" title={submission.file_name}>
                              {submission.file_name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Code2 className="h-3.5 w-3.5" />
                            <span>Editor</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell>{getStatusBadge(submission.status)}</TableCell>

                      <TableCell>
                        {submission.score !== null && submission.score !== undefined ? (
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-sm text-emerald-700">
                              {submission.score}
                            </span>
                            <span className="text-xs text-slate-400">/ 100</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-slate-500 font-normal">
                            Belum Dinilai
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-slate-500">
                        {new Date(submission.created_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                          <Link href={`/dashboard/submissions/${submission.id}`}>
                            {isStaff ? (
                              <>
                                <FileCheck className="h-3.5 w-3.5 text-blue-600" />
                                Review & Nilai
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5" />
                                Lihat Detail
                              </>
                            )}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
