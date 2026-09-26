"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import CodeMirror from "@uiw/react-codemirror"
import { cpp } from "@codemirror/lang-cpp"
import { vscodeDark } from "@uiw/codemirror-theme-vscode"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Code2,
  FileCode,
  FileUp,
  Play,
  Send,
  Terminal,
  X,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import { submitCodeAction, testRunCodeAction } from "@/app/actions/submission-actions"
import type { Assignment, Judge0ExecutionResult } from "@/types/database"

const LANGUAGE_OPTIONS = [
  { value: "76", label: "C++ (Clang 7.0.1)", key: "cpp" },
  { value: "54", label: "C++ (GCC 9.2.0)", key: "cpp" },
  { value: "62", label: "Java (OpenJDK 13.0.1)", key: "java" },
]

function SubmitPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  const preselectedAssignmentId = searchParams.get("assignment_id")

  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)

  // Language & Code
  const [languageId, setLanguageId] = useState("76")
  const [code, setCode] = useState(
    `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Tulis kodemu di sini\n    return 0;\n}\n`
  )
  const [problemTitle, setProblemTitle] = useState("Coding Task")

  // File upload state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null)

  // Test Run & Stdin
  const [customStdin, setCustomStdin] = useState("")
  const [isRunningTest, setIsRunningTest] = useState(false)
  const [testResult, setTestResult] = useState<Judge0ExecutionResult | null>(null)

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load assignments
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const { data: assignmentList } = await supabase
          .from("assignments")
          .select("*, classes(name)")
          .order("created_at", { ascending: false })

        if (assignmentList && assignmentList.length > 0) {
          setAssignments(assignmentList as Assignment[])

          // Check if preselected from query param
          const match = preselectedAssignmentId
            ? assignmentList.find((a) => a.id === preselectedAssignmentId)
            : assignmentList[0]

          if (match) {
            handleSelectAssignment(match as Assignment)
          }
        }
      } catch (err: any) {
        console.error("Failed to load assignments:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [preselectedAssignmentId, supabase])

  const handleSelectAssignment = (assign: Assignment) => {
    setSelectedAssignment(assign)
    setProblemTitle(assign.title)

    if (assign.sample_input) {
      setCustomStdin(assign.sample_input)
    }

    // Set allowed language
    if (assign.language === "java") {
      setLanguageId("62")
      if (assign.starter_code) {
        setCode(assign.starter_code)
      } else {
        setCode(
          `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Tulis kodemu di sini\n    }\n}\n`
        )
      }
    } else {
      setLanguageId("76")
      if (assign.starter_code) {
        setCode(assign.starter_code)
      } else {
        setCode(
          `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Tulis kodemu di sini\n    return 0;\n}\n`
        )
      }
    }
  }

  // Handle File Upload (.cpp, .java, etc.)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split(".").pop()?.toLowerCase()
    if (!["cpp", "cc", "cxx", "c", "java", "txt"].includes(ext || "")) {
      toast({
        variant: "destructive",
        title: "Format file tidak didukung",
        description: "Hanya file .cpp, .cc, .java, atau .txt yang diperbolehkan.",
      })
      return
    }

    // Auto switch language based on extension
    if (ext === "java") {
      setLanguageId("62")
    } else if (ext === "cpp" || ext === "cc" || ext === "cxx" || ext === "c") {
      setLanguageId("76")
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content !== undefined) {
        setCode(content)
        setUploadedFileName(file.name)
        setUploadedFileSize(`${(file.size / 1024).toFixed(1)} KB`)
        toast({
          title: "File berhasil dimuat ke editor",
          description: `${file.name} telah diimpor. Anda dapat mengedit kode sebelum mengirim.`,
        })
      }
    }
    reader.readAsText(file)
  }

  const handleClearUploadedFile = () => {
    setUploadedFileName(null)
    setUploadedFileSize(null)
  }

  // Test code with Judge0 without creating submission
  const handleTestRun = async () => {
    if (!code.trim()) {
      toast({
        variant: "destructive",
        title: "Kode kosong",
        description: "Tuliskan kode program atau unggah file sebelum menguji.",
      })
      return
    }

    try {
      setIsRunningTest(true)
      setTestResult(null)
      const res = await testRunCodeAction({
        code,
        language: languageId,
        stdin: customStdin,
        expected_output: selectedAssignment?.expected_output || undefined,
      })
      setTestResult(res)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal menjalankan test run",
        description: err.message || "Pastikan service Judge0 aktif.",
      })
    } finally {
      setIsRunningTest(false)
    }
  }

  // Final Submit for Review
  const handleSubmit = async () => {
    if (!code.trim()) {
      toast({
        variant: "destructive",
        title: "Kode kosong",
        description: "Silakan ketik atau unggah kode program sebelum mengirim.",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const res = await submitCodeAction({
        assignment_id: selectedAssignment?.id,
        problem: problemTitle || "Coding Task",
        code,
        language: languageId,
        file_name: uploadedFileName || undefined,
        stdin: customStdin || selectedAssignment?.sample_input || undefined,
        expected_output: selectedAssignment?.expected_output || undefined,
      })

      toast({
        title: "Submisi Berhasil Dikirim!",
        description: `Status Judge0: ${res.submission.status}. Dosen dan asisten akan meninjau dan menilai kode Anda.`,
      })

      router.push(`/dashboard/submissions/${res.submission.id}`)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal mengirim submisi",
        description: err.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableLanguages = LANGUAGE_OPTIONS.filter((l) => {
    if (!selectedAssignment || selectedAssignment.language === "all") return true
    return l.key === selectedAssignment.language
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Submit Kode Tugas Mahasiswa
          </h2>
          <p className="text-sm text-slate-500">
            Kumpulkan kode melalui editor CodeMirror atau unggah file program (.cpp, .java).
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: CodeMirror Editor & File Upload */}
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-blue-600" />
                    Editor Kode Program
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Gunakan editor interaktif CodeMirror atau unggah file langsung.
                  </CardDescription>
                </div>

                {/* Language selector */}
                <div className="w-48">
                  <Select value={languageId} onValueChange={setLanguageId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Pilih bahasa" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value} className="text-xs">
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* File Upload Option */}
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <FileUp className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>
                      Unggah file source code (<strong>.cpp</strong>, <strong>.java</strong>)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      id="code-file"
                      type="file"
                      accept=".cpp,.cc,.cxx,.java,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => document.getElementById("code-file")?.click()}
                    >
                      Pilih File dari Komputer
                    </Button>
                  </div>
                </div>

                {uploadedFileName && (
                  <div className="mt-2.5 flex items-center justify-between rounded bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs text-blue-800">
                    <span className="font-mono truncate">
                      📎 {uploadedFileName} ({uploadedFileSize})
                    </span>
                    <button
                      type="button"
                      onClick={handleClearUploadedFile}
                      className="text-blue-600 hover:text-blue-900 ml-2"
                      title="Hapus lampiran nama file"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* CodeMirror interactive Editor */}
              <div className="rounded-lg border border-slate-800 overflow-hidden shadow-sm">
                <CodeMirror
                  value={code}
                  height="420px"
                  theme={vscodeDark}
                  extensions={[cpp()]}
                  onChange={(val) => setCode(val)}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    crosshairCursor: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    closeBracketsKeymap: true,
                    searchKeymap: true,
                    foldKeymap: true,
                    completionKeymap: true,
                    lintKeymap: true,
                  }}
                />
              </div>

              {/* Actions: Run Test & Submit */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestRun}
                  disabled={isRunningTest || isSubmitting}
                  className="gap-2 text-xs"
                >
                  <Play className="h-3.5 w-3.5 text-emerald-600" />
                  {isRunningTest ? "Menjalankan Test..." : "Uji Kode (Test Run)"}
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isRunningTest}
                  className="gap-2 text-xs shadow-sm bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmitting ? "Mengirim Submisi..." : "Kirim Submisi untuk Dinilai"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Run Output Console */}
          {testResult && (
            <Card className="shadow-sm border-slate-300">
              <CardHeader className="py-3 px-4 bg-slate-900 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-mono flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    Hasil Eksekusi Judge0
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        testResult.status?.description === "Accepted"
                          ? "success"
                          : "destructive"
                      }
                      className="text-[10px] py-0 px-2"
                    >
                      {testResult.status?.description || "Unknown"}
                    </Badge>
                    {testResult.time && (
                      <span className="text-[10px] text-slate-300">
                        {testResult.time}s
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 bg-slate-950 text-slate-100 font-mono text-xs space-y-3">
                {testResult.compile_output && (
                  <div>
                    <span className="text-amber-400 block font-semibold mb-1">
                      Kompilasi / Build Warning:
                    </span>
                    <pre className="bg-slate-900 p-2 rounded text-amber-300 whitespace-pre-wrap overflow-x-auto text-[11px]">
                      {testResult.compile_output}
                    </pre>
                  </div>
                )}

                {testResult.stderr && (
                  <div>
                    <span className="text-red-400 block font-semibold mb-1">
                      Error Output (stderr):
                    </span>
                    <pre className="bg-slate-900 p-2 rounded text-red-300 whitespace-pre-wrap overflow-x-auto text-[11px]">
                      {testResult.stderr}
                    </pre>
                  </div>
                )}

                {testResult.stdout !== null && (
                  <div>
                    <span className="text-emerald-400 block font-semibold mb-1">
                      Standard Output (stdout):
                    </span>
                    <pre className="bg-slate-900 p-2 rounded text-slate-100 whitespace-pre-wrap overflow-x-auto text-[11px]">
                      {testResult.stdout || "(Output kosong / tidak ada teks yang dicetak)"}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Assignment Details & Custom Stdin */}
        <div className="space-y-4">
          {/* Assignment Selector & Info Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="space-y-1.5">
                <Label htmlFor="assignment-picker" className="text-xs text-slate-500">
                  Pilih Tugas yang Ingin Dikumpulkan:
                </Label>
                <Select
                  value={selectedAssignment?.id || ""}
                  onValueChange={(id) => {
                    const found = assignments.find((a) => a.id === id)
                    if (found) handleSelectAssignment(found)
                  }}
                >
                  <SelectTrigger id="assignment-picker" className="text-sm">
                    <SelectValue placeholder="Pilih tugas praktikum" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignments.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.title} ({a.classes?.name || "Kelas"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              {selectedAssignment ? (
                <>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 text-sm">
                        {selectedAssignment.title}
                      </span>
                      <Badge variant="outline">
                        Maks. {selectedAssignment.max_score} poin
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Deadline:{" "}
                        {selectedAssignment.due_date
                          ? new Date(selectedAssignment.due_date).toLocaleString("id-ID")
                          : "Tidak ada tenggat"}
                      </span>
                    </div>

                    {selectedAssignment.description && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="font-medium text-slate-700 block mb-1">
                          Instruksi Tugas:
                        </span>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {selectedAssignment.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sample Test Case */}
                  {(selectedAssignment.sample_input || selectedAssignment.expected_output) && (
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <span className="font-semibold text-slate-800 block">
                        Contoh Test Case Acuan:
                      </span>
                      {selectedAssignment.sample_input && (
                        <div>
                          <span className="text-slate-500 block mb-1">Sample Input (stdin):</span>
                          <pre className="bg-slate-100 p-2 rounded text-[11px] font-mono text-slate-800 overflow-x-auto">
                            {selectedAssignment.sample_input}
                          </pre>
                        </div>
                      )}
                      {selectedAssignment.expected_output && (
                        <div>
                          <span className="text-slate-500 block mb-1">Expected Output (stdout):</span>
                          <pre className="bg-slate-100 p-2 rounded text-[11px] font-mono text-slate-800 overflow-x-auto">
                            {selectedAssignment.expected_output}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-slate-500 text-center py-4">
                  Pilih tugas di atas untuk melihat instruksi dan test case.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Stdin for Test Run */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-700">
                Input Uji Coba (Standard Input / stdin)
              </CardTitle>
              <CardDescription className="text-[11px]">
                Input ini akan dikirim ke program saat Anda menekan tombol &ldquo;Uji Kode&rdquo;.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customStdin}
                onChange={(e) => setCustomStdin(e.target.value)}
                placeholder="Masukkan input untuk program Anda di sini..."
                rows={4}
                className="font-mono text-xs"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-slate-500">Memuat halaman submit...</div>}>
      <SubmitPageContent />
    </Suspense>
  )
}
