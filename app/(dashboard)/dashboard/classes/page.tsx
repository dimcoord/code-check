"use client"

import { useEffect, useMemo, useState } from "react"
import { BookOpen, Copy, Plus, School, Users } from "lucide-react"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import type { ClassRecord, EnrollmentRecord } from "@/types/database"

const randomClassCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase()

export default function ClassesPage() {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>("student")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  const [ownedClasses, setOwnedClasses] = useState<ClassRecord[]>([])
  const [enrolledClasses, setEnrolledClasses] = useState<EnrollmentRecord[]>([])

  const [newClassName, setNewClassName] = useState("")
  const [newClassDescription, setNewClassDescription] = useState("")
  const [joinCode, setJoinCode] = useState("")

  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")

  const loadData = async (currentUserId: string) => {
    setDataError(null)

    const [ownedResult, enrolledResult] = await Promise.all([
      supabase
        .from("classes")
        .select("*")
        .eq("owner_id", currentUserId)
        .order("created_at", { ascending: false }),
      supabase
        .from("class_enrollments")
        .select("id, user_id, class_id, role, created_at, classes(*)")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false }),
    ])

    if (ownedResult.error || enrolledResult.error) {
      setDataError(
        "Tidak dapat memuat data kelas. Pastikan tabel 'classes' dan 'class_enrollments' sudah dibuat di Supabase."
      )
      return
    }

    setOwnedClasses((ownedResult.data ?? []) as ClassRecord[])

    const normalizedEnrollments: EnrollmentRecord[] = (enrolledResult.data ?? []).map((e: any) => ({
      id: e.id,
      user_id: e.user_id,
      class_id: e.class_id,
      role: e.role,
      created_at: e.created_at,
      classes: Array.isArray(e.classes) ? (e.classes[0] ?? null) : (e.classes ?? null),
    }))

    setEnrolledClasses(normalizedEnrollments)
  }

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setDataError("Silakan masuk untuk mengelola kelas.")
        setIsLoading(false)
        return
      }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      if (profile?.role) {
        setUserRole(profile.role)
      }

      await loadData(user.id)
      setIsLoading(false)
    }

    void initialize()
  }, [supabase])

  const isStaff = userRole === "lecturer" || userRole === "ta"

  const handleCreateClass = async () => {
    if (!userId) return

    if (!newClassName.trim()) {
      toast({
        variant: "destructive",
        title: "Nama kelas wajib diisi",
      })
      return
    }

    setIsSaving(true)
    const code = randomClassCode()
    const classPayload = {
      name: newClassName.trim(),
      description: newClassDescription.trim() || null,
      class_code: code,
      owner_id: userId,
    }

    const { data: createdClass, error: classError } = await supabase
      .from("classes")
      .insert(classPayload)
      .select("*")
      .single()

    if (classError || !createdClass) {
      setIsSaving(false)
      toast({
        variant: "destructive",
        title: "Gagal membuat kelas",
        description: classError?.message,
      })
      return
    }

    const { error: enrollmentError } = await supabase
      .from("class_enrollments")
      .insert({
        user_id: userId,
        class_id: createdClass.id,
        role: "owner",
      })

    setIsSaving(false)

    if (enrollmentError) {
      toast({
        variant: "destructive",
        title: "Kelas dibuat, tapi gagal menambahkan ke enrollment",
        description: enrollmentError.message,
      })
    } else {
      toast({
        title: "Kelas berhasil dibuat!",
        description: `Kode kelas untuk mahasiswa: ${createdClass.class_code}`,
      })
    }

    setNewClassName("")
    setNewClassDescription("")
    await loadData(userId)
  }

  const handleJoinClass = async () => {
    if (!userId) return
    const normalizedCode = joinCode.trim().toUpperCase()

    if (!normalizedCode) {
      toast({
        variant: "destructive",
        title: "Masukkan kode kelas",
      })
      return
    }

    setIsSaving(true)
    const { data: foundClass, error: classLookupError } = await supabase
      .from("classes")
      .select("*")
      .eq("class_code", normalizedCode)
      .single()

    if (classLookupError || !foundClass) {
      setIsSaving(false)
      toast({
        variant: "destructive",
        title: "Kelas tidak ditemukan",
        description: "Periksa kembali kode kelas yang kamu masukkan.",
      })
      return
    }

    const { data: existingMembership } = await supabase
      .from("class_enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("class_id", foundClass.id)
      .maybeSingle()

    if (existingMembership) {
      setIsSaving(false)
      toast({
        title: "Kamu sudah terdaftar di kelas ini",
      })
      return
    }

    const { error: enrollError } = await supabase
      .from("class_enrollments")
      .insert({
        user_id: userId,
        class_id: foundClass.id,
        role: "student",
      })

    setIsSaving(false)

    if (enrollError) {
      toast({
        variant: "destructive",
        title: "Gagal bergabung ke kelas",
        description: enrollError.message,
      })
      return
    }

    toast({
      title: "Berhasil bergabung!",
      description: `Kamu sekarang terdaftar di ${foundClass.name}.`,
    })
    setJoinCode("")
    await loadData(userId)
  }

  const startEditing = (kelas: ClassRecord) => {
    setEditingClassId(kelas.id)
    setEditName(kelas.name)
    setEditDescription(kelas.description ?? "")
  }

  const cancelEditing = () => {
    setEditingClassId(null)
    setEditName("")
    setEditDescription("")
  }

  const handleSaveEdit = async () => {
    if (!userId || !editingClassId) return
    if (!editName.trim()) {
      toast({
        variant: "destructive",
        title: "Nama kelas wajib diisi",
      })
      return
    }

    setIsSaving(true)
    const { error } = await supabase
      .from("classes")
      .update({
        name: editName.trim(),
        description: editDescription.trim() || null,
      })
      .eq("id", editingClassId)
      .eq("owner_id", userId)

    setIsSaving(false)

    if (error) {
      toast({
        variant: "destructive",
        title: "Gagal memperbarui kelas",
        description: error.message,
      })
      return
    }

    toast({
      title: "Kelas berhasil diperbarui",
    })
    cancelEditing()
    await loadData(userId)
  }

  const handleDeleteClass = async (classId: string) => {
    if (!userId) return

    if (!confirm("Apakah Anda yakin ingin menghapus kelas ini beserta tugas dan submisi di dalamnya?")) {
      return
    }

    setIsSaving(true)
    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("id", classId)
      .eq("owner_id", userId)

    setIsSaving(false)

    if (error) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus kelas",
        description: error.message,
      })
      return
    }

    toast({
      title: "Kelas berhasil dihapus",
    })
    await loadData(userId)
  }

  const handleLeaveClass = async (classId: string, role: string) => {
    if (!userId) return
    if (role === "owner") {
      toast({
        variant: "destructive",
        title: "Owner tidak dapat keluar dari kelas",
        description: "Hapus kelas jika ingin menghapus kelas ini.",
      })
      return
    }

    setIsSaving(true)
    const { error } = await supabase
      .from("class_enrollments")
      .delete()
      .eq("class_id", classId)
      .eq("user_id", userId)

    setIsSaving(false)

    if (error) {
      toast({
        variant: "destructive",
        title: "Gagal keluar dari kelas",
        description: error.message,
      })
      return
    }

    toast({
      title: "Kamu telah keluar dari kelas",
    })
    await loadData(userId)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Kode disalin ke clipboard",
      description: text,
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-slate-500">Memuat data kelas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Kelas</h2>
        <p className="text-sm text-slate-500">
          Kelola kelas praktikum, bagikan kode enrollment kepada mahasiswa, dan atur anggota kelas.
        </p>
      </div>

      {dataError ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 text-base">Perhatian Konfigurasi</CardTitle>
            <CardDescription className="text-amber-700">{dataError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create class card (Staff) */}
        {isStaff && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <School className="h-5 w-5 text-blue-600" />
                Buat Kelas Baru
              </CardTitle>
              <CardDescription>
                Dosen dan asisten dapat membuat ruang kelas baru untuk tugas C++ dan Java.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Nama kelas (Contoh: Pemrograman Berorientasi Objek - Kelas A)"
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
              />
              <Textarea
                placeholder="Deskripsi kelas atau pengumuman awal (opsional)"
                value={newClassDescription}
                onChange={(event) => setNewClassDescription(event.target.value)}
                rows={3}
              />
              <Button onClick={handleCreateClass} disabled={isSaving || !userId} className="w-full sm:w-auto">
                <Plus className="mr-1.5 h-4 w-4" />
                Buat Kelas
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Join class card (Students & staff) */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              Gabung Kelas dengan Kode
            </CardTitle>
            <CardDescription>
              Masukkan kode kelas 6 karakter yang diberikan oleh dosen atau asisten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Contoh: AB12CD"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                className="font-mono uppercase tracking-widest text-center"
                maxLength={8}
              />
              <Button onClick={handleJoinClass} disabled={isSaving || !userId}>
                Gabung
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Setelah bergabung, tugas praktikum pada kelas tersebut akan otomatis muncul di menu Tugas Kuliah.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Owned classes table (Staff) */}
      {isStaff && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Kelas yang Anda Kelola</CardTitle>
            <CardDescription>
              Daftar kelas di mana Anda sebagai pemilik (dosen/asisten).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ownedClasses.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                Belum ada kelas yang Anda kelola. Buat kelas pertama menggunakan formulir di atas.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kelas</TableHead>
                    <TableHead>Kode Gabung</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ownedClasses.map((kelas) => (
                    <TableRow key={kelas.id}>
                      <TableCell className="font-semibold text-slate-900">
                        {editingClassId === kelas.id ? (
                          <Input
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                          />
                        ) : (
                          kelas.name
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="font-mono text-xs font-bold tracking-wider">
                            {kelas.class_code}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => copyToClipboard(kelas.class_code)}
                            title="Salin kode kelas"
                          >
                            <Copy className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs text-slate-600 text-sm">
                        {editingClassId === kelas.id ? (
                          <Textarea
                            value={editDescription}
                            onChange={(event) => setEditDescription(event.target.value)}
                          />
                        ) : (
                          kelas.description || "-"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(kelas.created_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {editingClassId === kelas.id ? (
                          <>
                            <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                              Simpan
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEditing}>
                              Batal
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => startEditing(kelas)}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteClass(kelas.id)}
                              disabled={isSaving}
                            >
                              Hapus
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enrolled classes table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Kelas yang Diikuti</CardTitle>
          <CardDescription>
            Daftar kelas tempat Anda terdaftar sebagai mahasiswa atau asisten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrolledClasses.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              Anda belum tergabung di kelas mana pun. Gunakan tombol Gabung Kelas di atas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kelas</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Status Role</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledClasses.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {enrollment.classes?.name ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {enrollment.classes?.class_code ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={enrollment.role === "owner" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {enrollment.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-slate-600">
                      {enrollment.classes?.description ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {enrollment.role !== "owner" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleLeaveClass(enrollment.class_id, enrollment.role)}
                          disabled={isSaving}
                          className="text-red-600 hover:text-red-700"
                        >
                          Keluar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
