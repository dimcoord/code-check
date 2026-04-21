"use client"

import { useEffect, useMemo, useState } from "react"

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

type ClassRecord = {
  id: string
  name: string
  description: string | null
  class_code: string
  owner_id: string
  created_at: string
}

type EnrollmentRecord = {
  id: string
  user_id: string
  class_id: string
  role: "owner" | "student" | "assistant"
  created_at: string
  classes: ClassRecord | null
}

const randomClassCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase()

export default function KelasPage() {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [userId, setUserId] = useState<string | null>(null)
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
        "Cannot load class data. Ensure tables 'classes' and 'class_enrollments' exist and RLS policies allow read access."
      )
      return
    }

    setOwnedClasses((ownedResult.data ?? []) as ClassRecord[])
    setEnrolledClasses((enrolledResult.data ?? []) as EnrollmentRecord[])
  }

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setDataError("You need to sign in to manage classes.")
        setIsLoading(false)
        return
      }

      setUserId(user.id)
      await loadData(user.id)
      setIsLoading(false)
    }

    void initialize()
  }, [supabase])

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
        title: "Kelas berhasil dibuat",
        description: `Kode kelas: ${createdClass.class_code}`,
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
        title: "Kamu sudah tergabung di kelas ini",
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
      title: "Berhasil bergabung",
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
      title: "Kelas diperbarui",
    })
    cancelEditing()
    await loadData(userId)
  }

  const handleDeleteClass = async (classId: string) => {
    if (!userId) return

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
      title: "Kelas dihapus",
    })
    await loadData(userId)
  }

  const handleLeaveClass = async (classId: string, role: string) => {
    if (!userId) return
    if (role === "owner") {
      toast({
        variant: "destructive",
        title: "Owner tidak dapat keluar dari kelas",
        description: "Hapus kelas atau transfer kepemilikan terlebih dahulu.",
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
      title: "Kamu keluar dari kelas",
    })
    await loadData(userId)
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Loading kelas...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Kelas</h2>
        <p className="text-muted-foreground">
          Buat kelas baru, kelola kelas milikmu, dan gabung ke kelas lain dengan kode kelas.
        </p>
      </div>

      {dataError ? (
        <Card>
          <CardHeader>
            <CardTitle>Konfigurasi kelas belum siap</CardTitle>
            <CardDescription>{dataError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Buat Kelas</CardTitle>
            <CardDescription>
              Setelah dibuat, bagikan kode kelas kepada mahasiswa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Nama kelas"
              value={newClassName}
              onChange={(event) => setNewClassName(event.target.value)}
            />
            <Textarea
              placeholder="Deskripsi kelas (opsional)"
              value={newClassDescription}
              onChange={(event) => setNewClassDescription(event.target.value)}
            />
            <Button onClick={handleCreateClass} disabled={isSaving || !userId}>
              Buat kelas
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gabung Kelas</CardTitle>
            <CardDescription>
              Masukkan kode kelas untuk enrollment sebagai student.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Contoh: AB12CD"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            />
            <Button onClick={handleJoinClass} disabled={isSaving || !userId}>
              Gabung kelas
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kelas yang Kamu Kelola</CardTitle>
          <CardDescription>
            Edit detail kelas, lihat kode kelas, atau hapus kelas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ownedClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada kelas yang kamu miliki.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ownedClasses.map((kelas) => (
                  <TableRow key={kelas.id}>
                    <TableCell className="font-medium">
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
                      <Badge variant="outline">{kelas.class_code}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {editingClassId === kelas.id ? (
                        <Textarea
                          value={editDescription}
                          onChange={(event) => setEditDescription(event.target.value)}
                        />
                      ) : (
                        kelas.description || "-"
                      )}
                    </TableCell>
                    <TableCell>{new Date(kelas.created_at).toLocaleDateString()}</TableCell>
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

      <Card>
        <CardHeader>
          <CardTitle>Kelas yang Diikuti</CardTitle>
          <CardDescription>
            Daftar enrollment kamu sebagai student, assistant, atau owner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrolledClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Kamu belum mengikuti kelas mana pun.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kelas</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledClasses.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">{enrollment.classes?.name ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{enrollment.classes?.class_code ?? "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={enrollment.role === "owner" ? "success" : "default"}>
                        {enrollment.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">{enrollment.classes?.description ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleLeaveClass(enrollment.class_id, enrollment.role)}
                        disabled={isSaving}
                      >
                        Keluar
                      </Button>
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

