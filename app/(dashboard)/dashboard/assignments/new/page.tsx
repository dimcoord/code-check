"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import CodeMirror from "@uiw/react-codemirror"
import { cpp } from "@codemirror/lang-cpp"
import { vscodeDark } from "@uiw/codemirror-theme-vscode"
import { ArrowLeft, FileCode, Save } from "lucide-react"

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
import { createAssignmentAction } from "@/app/actions/assignment-actions"
import type { ClassRecord, SupportedLanguage } from "@/types/database"

export default function NewAssignmentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [classes, setClasses] = useState<ClassRecord[]>([])

  const [classId, setClassId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [language, setLanguage] = useState<SupportedLanguage>("all")
  const [maxScore, setMaxScore] = useState(100)
  const [dueDate, setDueDate] = useState("")
  const [sampleInput, setSampleInput] = useState("")
  const [expectedOutput, setExpectedOutput] = useState("")
  const [starterCode, setStarterCode] = useState(
    `// Template / Starter code\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Tulis kodemu di sini\n    return 0;\n}\n`
  )

  useEffect(() => {
    async function loadClasses() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from("classes")
        .select("*")
        .order("name", { ascending: true })

      if (data && data.length > 0) {
        setClasses(data as ClassRecord[])
        setClassId(data[0].id)
      }
    }

    loadClasses()
  }, [supabase])

  const handleLanguageChange = (val: SupportedLanguage) => {
    setLanguage(val)
    if (val === "java") {
      setStarterCode(
        `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Tulis kodemu di sini\n    }\n}\n`
      )
    } else {
      setStarterCode(
        `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Tulis kodemu di sini\n    return 0;\n}\n`
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !classId) {
      toast({
        variant: "destructive",
        title: "Data belum lengkap",
        description: "Judul tugas dan kelas wajib diisi.",
      })
      return
    }

    try {
      setSaving(true)
      await createAssignmentAction({
        class_id: classId,
        title: title.trim(),
        description: description.trim(),
        language,
        max_score: Number(maxScore) || 100,
        due_date: dueDate || undefined,
        sample_input: sampleInput.trim() || undefined,
        expected_output: expectedOutput.trim() || undefined,
        starter_code: starterCode || undefined,
      })

      toast({
        title: "Tugas berhasil dibuat!",
        description: "Mahasiswa di kelas sekarang dapat melihat dan mengumpulkan tugas ini.",
      })

      router.push("/dashboard/assignments")
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal membuat tugas",
        description: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm" className="h-9 w-9 p-0">
          <Link href="/dashboard/assignments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Buat Tugas Coding Baru
          </h2>
          <p className="text-sm text-slate-500">
            Atur parameter tugas, bahasa pemrograman yang diizinkan, dan test case Judge0.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Informasi Tugas</CardTitle>
            <CardDescription>
              Detail judul, kelas tujuan, dan deskripsi instruksi soal untuk mahasiswa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="class-select">Pilih Kelas *</Label>
                <Select value={classId} onValueChange={setClassId} required>
                  <SelectTrigger id="class-select">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.class_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="language-select">Bahasa Pemrograman *</Label>
                <Select
                  value={language}
                  onValueChange={(val: SupportedLanguage) => handleLanguageChange(val)}
                >
                  <SelectTrigger id="language-select">
                    <SelectValue placeholder="Pilih bahasa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">C++ & Java (Bebas)</SelectItem>
                    <SelectItem value="cpp">Hanya C++</SelectItem>
                    <SelectItem value="java">Hanya Java</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Judul Tugas *</Label>
              <Input
                id="title"
                placeholder="Contoh: Implementasi Linked List Sederhana"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi & Petunjuk Pengerjaan</Label>
              <Textarea
                id="description"
                placeholder="Jelaskan spesifikasi masalah, batasan input/output, dan ketentuan penilaian..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="due-date">Tenggat Waktu Pengumpulan (Deadline)</Label>
                <Input
                  id="due-date"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max-score">Skor Maksimum</Label>
                <Input
                  id="max-score"
                  type="number"
                  min={10}
                  max={100}
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Cases for Judge0 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Test Case Evaluasi Otomatis (Judge0)</CardTitle>
            <CardDescription>
              Input dan output acuan untuk menguji kode yang disubmit mahasiswa secara otomatis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sample-input">Sample Input (Standard Input / stdin)</Label>
                <Textarea
                  id="sample-input"
                  placeholder="Contoh: 5&#10;10 20 30 40 50"
                  value={sampleInput}
                  onChange={(e) => setSampleInput(e.target.value)}
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expected-output">Expected Output (Standard Output / stdout)</Label>
                <Textarea
                  id="expected-output"
                  placeholder="Contoh: 150"
                  value={expectedOutput}
                  onChange={(e) => setExpectedOutput(e.target.value)}
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Starter Code Editor with CodeMirror */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCode className="h-5 w-5 text-blue-600" />
              Template / Starter Code (CodeMirror)
            </CardTitle>
            <CardDescription>
              Kode awal yang akan langsung terpasang di editor mahasiswa saat membuka halaman submit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-700 overflow-hidden">
              <CodeMirror
                value={starterCode}
                height="240px"
                theme={vscodeDark}
                extensions={[cpp()]}
                onChange={(value) => setStarterCode(value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button asChild type="button" variant="outline" disabled={saving}>
            <Link href="/dashboard/assignments">Batal</Link>
          </Button>
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Menyimpan Tugas..." : "Simpan Tugas"}
          </Button>
        </div>
      </form>
    </div>
  )
}
