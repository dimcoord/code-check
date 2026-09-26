"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import CodeMirror from "@uiw/react-codemirror"
import { cpp } from "@codemirror/lang-cpp"
import { vscodeDark } from "@uiw/codemirror-theme-vscode"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Download,
  FileCheck,
  FileUp,
  GraduationCap,
  Mail,
  Play,
  Save,
  Terminal,
  User,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import {
  gradeSubmissionAction,
  testRunCodeAction,
} from "@/app/actions/submission-actions"
import type { Judge0ExecutionResult, Submission } from "@/types/database"

function getLanguageBadge(language: string) {
  if (language === "76" || language === "54" || language === "cpp") {
    return <Badge variant="outline" className="font-mono text-xs bg-blue-50 text-blue-700 border-blue-200">C++</Badge>
  }
  if (language === "62" || language === "91" || language === "java") {
    return <Badge variant="outline" className="font-mono text-xs bg-orange-50 text-orange-700 border-orange-200">Java</Badge>
  }
  return <Badge variant="outline" className="font-mono text-xs">{language}</Badge>
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

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const submissionId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submission, setSubmission] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isStaff, setIsStaff] = useState(false)

  // Grading form states
  const [score, setScore] = useState<number | string>("")
  const [gradingStatus, setGradingStatus] = useState<"Accepted" | "Needs Revision" | "Rejected">("Accepted")
  const [feedback, setFeedback] = useState("")
  const [isSavingGrade, setIsSavingGrade] = useState(false)

  // Judge0 Re-runner states
  const [customStdin, setCustomStdin] = useState("")
  const [isRunningJudge, setIsRunningJudge] = useState(false)
  const [judgeResult, setJudgeResult] = useState<Judge0ExecutionResult | null>(null)

  const loadSubmission = async () => {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setCurrentUser(user)

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      const staff = profile?.role === "lecturer" || profile?.role === "ta"
      setIsStaff(staff)

      const { data: subData, error } = await supabase
        .from("submissions")
        .select("*, profiles(*), assignments(*)")
        .eq("id", submissionId)
        .single()

      if (error || !subData) {
        toast({
          variant: "destructive",
          title: "Submisi tidak ditemukan",
        })
        router.push("/dashboard/submissions")
        return
      }

      // Check permission: student can only view their own submission
      if (!staff && subData.user_id !== user.id) {
        toast({
          variant: "destructive",
          title: "Akses Ditolak",
          description: "Anda hanya diperkenankan melihat submisi milik Anda sendiri.",
        })
        router.push("/dashboard/submissions")
        return
      }

      setSubmission(subData)
      setScore(subData.score ?? "")
      setGradingStatus(subData.grading_status || "Accepted")
      setFeedback(subData.feedback ?? "")

      if (subData.assignments?.sample_input) {
        setCustomStdin(subData.assignments.sample_input)
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat submisi",
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (submissionId) {
      loadSubmission()
    }
  }, [submissionId])

  // Save Grade & Feedback (Staff)
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault()

    if (score === "" || isNaN(Number(score))) {
      toast({
        variant: "destructive",
        title: "Nilai harus diisi",
        description: "Masukkan nilai angka (0 - 100).",
      })
      return
    }

    try {
      setIsSavingGrade(true)
      await gradeSubmissionAction({
        submission_id: submissionId,
        score: Number(score),
        feedback,
        grading_status: gradingStatus,
      })

      toast({
        title: "Nilai & Feedback Berhasil Disimpan",
        description: `Mahasiswa sekarang dapat melihat nilai ${score} dan catatan feedback.`,
      })

      await loadSubmission()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan nilai",
        description: err.message,
      })
    } finally {
      setIsSavingGrade(false)
    }
  }

  // Live Test with Judge0
  const handleRunJudgeTest = async () => {
    if (!submission?.code) return

    try {
      setIsRunningJudge(true)
      setJudgeResult(null)

      const res = await testRunCodeAction({
        code: submission.code,
        language: submission.language,
        stdin: customStdin,
        expected_output: submission.assignments?.expected_output || undefined,
      })

      setJudgeResult(res)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal menjalankan Judge0",
        description: err.message,
      })
    } finally {
      setIsRunningJudge(false)
    }
  }

  const copyCode = () => {
    if (!submission?.code) return
    navigator.clipboard.writeText(submission.code)
    toast({
      title: "Kode disalin ke clipboard",
    })
  }

  const downloadCode = () => {
    if (!submission?.code) return
    const isJava = submission.language === "62" || submission.language === "91"
    const filename = submission.file_name || (isJava ? "Main.java" : "solution.cpp")
    const blob = new Blob([submission.code], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Memuat detail submisi...</div>
  }

  if (!submission) return null

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-9 w-9 p-0">
            <Link href="/dashboard/submissions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {submission.problem}
              </h2>
              {getLanguageBadge(submission.language)}
              {getStatusBadge(submission.status)}
            </div>
            <p className="text-xs text-slate-500">
              Dikumpulkan pada: {new Date(submission.created_at).toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyCode} className="gap-1.5 text-xs">
            <Copy className="h-3.5 w-3.5" />
            Salin Kode
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCode} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Unduh File
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Column: CodeMirror Code Viewer & Live Judge0 Runner */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-blue-600" />
                  Source Code Mahasiswa
                </CardTitle>
                <CardDescription className="text-xs">
                  {submission.file_name ? (
                    <span className="text-blue-600 font-mono flex items-center gap-1 mt-0.5">
                      <FileUp className="h-3.5 w-3.5" />
                      Diunggah dari file: {submission.file_name}
                    </span>
                  ) : (
                    <span>Disubmit langsung melalui CodeMirror editor</span>
                  )}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-b-lg border-t border-slate-800">
                <CodeMirror
                  value={submission.code}
                  height="450px"
                  theme={vscodeDark}
                  extensions={[cpp()]}
                  editable={false}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: false,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Initial Judge0 Execution Details */}
          <Card className="shadow-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Terminal className="h-4 w-4 text-slate-700" />
                Laporan Eksekusi Awal Judge0
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">Waktu Kompilasi / Run:</span>
                  <span className="font-semibold text-slate-800">{submission.runtime || "0s"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Penggunaan Memori:</span>
                  <span className="font-semibold text-slate-800">{submission.memory || "-"}</span>
                </div>
              </div>

              {submission.compile_output && (
                <div>
                  <span className="text-amber-700 block font-sans font-medium mb-1">
                    Compile Output / Warnings:
                  </span>
                  <pre className="bg-slate-100 p-2.5 rounded text-amber-800 text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {submission.compile_output}
                  </pre>
                </div>
              )}

              {submission.stderr && (
                <div>
                  <span className="text-red-700 block font-sans font-medium mb-1">
                    Standard Error (stderr):
                  </span>
                  <pre className="bg-slate-100 p-2.5 rounded text-red-800 text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {submission.stderr}
                  </pre>
                </div>
              )}

              {submission.stdout && (
                <div>
                  <span className="text-slate-700 block font-sans font-medium mb-1">
                    Standard Output (stdout):
                  </span>
                  <pre className="bg-slate-100 p-2.5 rounded text-slate-800 text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {submission.stdout}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interactive Judge0 Re-runner for Staff */}
          {isStaff && (
            <Card className="shadow-sm border-blue-200">
              <CardHeader className="py-3 bg-blue-50/50">
                <CardTitle className="text-sm text-blue-950 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-blue-600" />
                    Uji Ulang Kode dengan Test Case Baru (Judge0)
                  </span>
                  <Button
                    size="sm"
                    onClick={handleRunJudgeTest}
                    disabled={isRunningJudge}
                    className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {isRunningJudge ? "Menjalankan..." : "Jalankan Test"}
                  </Button>
                </CardTitle>
                <CardDescription className="text-xs text-blue-800">
                  Ketikkan test case khusus / custom input di bawah untuk mengecek edge case atau kasus uji rahasia.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="custom-test-stdin" className="text-xs">
                    Custom Standard Input (stdin):
                  </Label>
                  <Textarea
                    id="custom-test-stdin"
                    placeholder="Masukkan custom input untuk pengujian..."
                    value={customStdin}
                    onChange={(e) => setCustomStdin(e.target.value)}
                    rows={3}
                    className="font-mono text-xs"
                  />
                </div>

                {judgeResult && (
                  <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-100 space-y-2 mt-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Status Evaluasi:</span>
                      <Badge
                        variant={
                          judgeResult.status?.description === "Accepted"
                            ? "success"
                            : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {judgeResult.status?.description}
                      </Badge>
                    </div>

                    {judgeResult.compile_output && (
                      <div>
                        <span className="text-amber-400 block mb-1">Compile Output:</span>
                        <pre className="bg-slate-900 p-2 rounded text-amber-300 whitespace-pre-wrap text-[11px]">
                          {judgeResult.compile_output}
                        </pre>
                      </div>
                    )}

                    {judgeResult.stderr && (
                      <div>
                        <span className="text-red-400 block mb-1">Error (stderr):</span>
                        <pre className="bg-slate-900 p-2 rounded text-red-300 whitespace-pre-wrap text-[11px]">
                          {judgeResult.stderr}
                        </pre>
                      </div>
                    )}

                    {judgeResult.stdout !== null && (
                      <div>
                        <span className="text-emerald-400 block mb-1">Output (stdout):</span>
                        <pre className="bg-slate-900 p-2 rounded text-slate-100 whitespace-pre-wrap text-[11px]">
                          {judgeResult.stdout || "(Output kosong)"}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Student Info, Assignment Info, and Grading Form */}
        <div className="space-y-6">
          {/* Student Profile Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Identitas Mahasiswa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Nama Lengkap:</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {submission.profiles?.full_name || "Mahasiswa"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">NIM:</span>
                <span className="font-mono font-medium text-slate-800">
                  {submission.profiles?.nim || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Email Universitas:</span>
                <span className="text-slate-800">
                  {submission.profiles?.university_email || submission.profiles?.email || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Kelas:</span>
                <span className="text-slate-800">
                  {submission.assignments?.classes?.name || submission.profiles?.kelas || "-"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* GRADING & FEEDBACK SECTION */}
          {isStaff ? (
            /* Staff Grading Form */
            <Card className="shadow-sm border-emerald-200">
              <form onSubmit={handleSaveGrade}>
                <CardHeader className="py-3 bg-emerald-50/50">
                  <CardTitle className="text-sm text-emerald-950 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-emerald-600" />
                    Formulir Penilaian & Review (Dosen / TA)
                  </CardTitle>
                  <CardDescription className="text-xs text-emerald-800">
                    Masukkan nilai numerik dan feedback konstruktif untuk mahasiswa.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="grade-score" className="text-xs font-semibold">
                        Nilai / Skor Akhir (0 - 100) *
                      </Label>
                      {submission.assignments?.max_score && (
                        <span className="text-[11px] text-slate-500">
                          Maks: {submission.assignments.max_score}
                        </span>
                      )}
                    </div>
                    <Input
                      id="grade-score"
                      type="number"
                      min={0}
                      max={submission.assignments?.max_score || 100}
                      step="1"
                      placeholder="Contoh: 95"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      className="text-lg font-bold text-emerald-700"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="grade-verdict" className="text-xs font-semibold">
                      Status Kelulusan Tugas
                    </Label>
                    <Select
                      value={gradingStatus}
                      onValueChange={(val: any) => setGradingStatus(val)}
                    >
                      <SelectTrigger id="grade-verdict" className="text-xs">
                        <SelectValue placeholder="Pilih status penilaian" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Accepted">Accepted / Memenuhi Syarat</SelectItem>
                        <SelectItem value="Needs Revision">Needs Revision / Perlu Perbaikan</SelectItem>
                        <SelectItem value="Rejected">Rejected / Ditolak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="grade-feedback" className="text-xs font-semibold">
                      Catatan & Feedback untuk Mahasiswa
                    </Label>
                    <Textarea
                      id="grade-feedback"
                      placeholder="Beri komentar terkait kebersihan kode, efisiensi algoritma, atau logika yang masih keliru..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={5}
                      className="text-xs leading-relaxed"
                    />
                  </div>

                  {submission.graded_at && (
                    <div className="rounded bg-slate-50 p-2.5 text-[11px] text-slate-500">
                      Terakhir dinilai pada:{" "}
                      {new Date(submission.graded_at).toLocaleString("id-ID")}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2 border-t border-slate-100 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSavingGrade}
                    className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {isSavingGrade ? "Menyimpan Nilai..." : "Simpan Nilai & Feedback"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          ) : (
            /* Student View of Grade & Feedback */
            <Card className="shadow-sm">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  Hasil Penilaian Dosen / TA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.score !== null && submission.score !== undefined ? (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
                    <span className="text-xs text-emerald-700 block font-medium">
                      Nilai yang Diperoleh:
                    </span>
                    <span className="text-3xl font-extrabold text-emerald-800">
                      {submission.score}
                    </span>
                    <span className="text-xs text-emerald-600 block mt-1">
                      Status: {submission.grading_status || "Accepted"}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-center">
                    <Clock className="mx-auto h-6 w-6 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-600 font-medium block">
                      Submisi Belum Dinilai
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Dosen atau asisten laboratorium sedang meninjau kode Anda.
                    </span>
                  </div>
                )}

                {submission.feedback ? (
                  <div className="space-y-1 border-t border-slate-100 pt-3">
                    <span className="text-xs font-semibold text-slate-800 block">
                      Catatan & Feedback:
                    </span>
                    <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {submission.feedback}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}