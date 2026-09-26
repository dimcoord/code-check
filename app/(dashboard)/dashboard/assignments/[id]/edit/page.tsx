"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import CodeMirror from "@uiw/react-codemirror"
import { cpp } from "@codemirror/lang-cpp"
import { vscodeDark } from "@uiw/codemirror-theme-vscode"
import { ArrowLeft, Save } from "lucide-react"

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
import {
  getAssignmentByIdAction,
  updateAssignmentAction,
} from "@/app/actions/assignment-actions"
import type { ClassRecord, SupportedLanguage } from "@/types/database"

export default function EditAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const assignmentId = params.id as string

  const [loading, setLoading] = useState(true)
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
  const [starterCode, setStarterCode] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        const [assignmentData, { data: classList }] = await Promise.all([
          getAssignmentByIdAction(assignmentId),
          supabase.from("classes").select("*").order("name", { ascending: true }),
        ])

        if (classList) {
          setClasses(classList as ClassRecord[])
        }

        if (assignmentData) {
          setClassId(assignmentData.class_id)
          setTitle(assignmentData.title)
          setDescription(assignmentData.description || "")
          setLanguage((assignmentData.language as SupportedLanguage) || "all")
          setMaxScore(assignmentData.max_score || 100)
          setStarterCode(assignmentData.starter_code || "")
          setSampleInput(assignmentData.sample_input || "")
          setExpectedOutput(assignmentData.expected_output || "")

          if (assignmentData.due_date) {
            const d = new Date(assignmentData.due_date)
            // format to YYYY-MM-DDTHH:MM for datetime-local
            const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)
            setDueDate(localIso)
          }
        }
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

    if (assignmentId) {
      loadData()
    }
  }, [assignmentId, supabase])

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
      await updateAssignmentAction(assignmentId, {
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
        title: "Tugas berhasil diperbarui!",
      })

      router.push("/dashboard/assignments")
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal memperbarui tugas",
        description: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-slate-500">Memuat data tugas...</div>
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Edit Tugas Coding</h2>
          <p className="text-sm text-slate-500">Perbarui spesifikasi, deadline, atau test case tugas.</p>
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
                  onValueChange={(val: SupportedLanguage) => setLanguage(val)}
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi & Petunjuk Pengerjaan</Label>
              <Textarea
                id="description"
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
            <CardTitle className="text-lg">Template / Starter Code (CodeMirror)</CardTitle>
            <CardDescription>
              Kode awal yang terpasang di editor saat mahasiswa membuka halaman pengerjaan.
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
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  )
}
