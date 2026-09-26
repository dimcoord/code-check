"use client"

import { useEffect, useState } from "react"
import {
  AlertCircle,
  Copy,
  Edit2,
  Key,
  Mail,
  Plus,
  Search,
  Trash2,
  UserCheck,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import {
  createStudentAction,
  deleteStudentAction,
  getStudentsAction,
  updateStudentAction,
} from "@/app/actions/student-actions"
import type { ClassRecord } from "@/types/database"

export default function StudentsManagementPage() {
  const { toast } = useToast()
  const supabase = createClient()

  const [isStaff, setIsStaff] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [newName, setNewName] = useState("")
  const [newNim, setNewNim] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newClassId, setNewClassId] = useState("")

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [editName, setEditName] = useState("")
  const [editNim, setEditNim] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editClassId, setEditClassId] = useState("")
  const [editPassword, setEditPassword] = useState("")

  // Success Created Account Dialog (to show credentials to TA/Lecturer)
  const [createdInfo, setCreatedInfo] = useState<{
    email: string
    password: string
  } | null>(null)

  const loadData = async (classFilter = "all") => {
    try {
      setLoading(true)
      const studentList = await getStudentsAction(classFilter)
      setStudents(studentList)

      const { data: classList } = await supabase
        .from("classes")
        .select("*")
        .order("name", { ascending: true })

      setClasses((classList ?? []) as ClassRecord[])
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data",
        description: err.message || "Terjadi kesalahan saat memuat data mahasiswa.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function checkRoleAndInit() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsStaff(false)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      const staffRole = profile?.role === "lecturer" || profile?.role === "ta"
      setIsStaff(staffRole)

      if (staffRole) {
        await loadData(selectedClassFilter)
      } else {
        setLoading(false)
      }
    }

    checkRoleAndInit()
  }, [supabase])

  const handleFilterChange = async (val: string) => {
    setSelectedClassFilter(val)
    await loadData(val)
  }

  const handleGeneratePassword = () => {
    const defaultPwd = newNim.trim()
      ? `Mhs#${newNim.trim()}`
      : `Mhs#${Math.floor(100000 + Math.random() * 900000)}`
    setNewPassword(defaultPwd)
  }

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || !newName || !newNim) {
      toast({
        variant: "destructive",
        title: "Data belum lengkap",
        description: "Email universitas, nama lengkap, dan NIM wajib diisi.",
      })
      return
    }

    try {
      setSaving(true)
      const res = await createStudentAction({
        email: newEmail,
        full_name: newName,
        nim: newNim,
        password: newPassword || undefined,
        class_id: newClassId || undefined,
      })

      toast({
        title: "Akun Mahasiswa Berhasil Dibuat",
        description: `Akun untuk ${res.email} telah aktif dan dapat langsung login.`,
      })

      setCreatedInfo({
        email: res.email,
        password: res.password,
      })

      setIsCreateOpen(false)
      setNewEmail("")
      setNewName("")
      setNewNim("")
      setNewPassword("")
      setNewClassId("")

      await loadData(selectedClassFilter)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal membuat akun",
        description: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (student: any) => {
    setEditingStudent(student)
    setEditName(student.full_name || "")
    setEditNim(student.nim || "")
    setEditEmail(student.university_email || student.email || "")
    setEditClassId(student.class_enrollment?.class_id || "")
    setEditPassword("")
    setIsEditOpen(true)
  }

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return

    try {
      setSaving(true)
      await updateStudentAction({
        id: editingStudent.id,
        full_name: editName,
        nim: editNim,
        email: editEmail,
        class_id: editClassId || undefined,
        new_password: editPassword || undefined,
      })

      toast({
        title: "Data Mahasiswa Diperbarui",
      })

      setIsEditOpen(false)
      await loadData(selectedClassFilter)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal memperbarui data",
        description: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Hapus akun mahasiswa ${studentName}? Mahasiswa tidak akan dapat login lagi.`)) {
      return
    }

    try {
      setSaving(true)
      await deleteStudentAction({ id: studentId })
      toast({
        title: "Mahasiswa Dihapus",
      })
      await loadData(selectedClassFilter)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus",
        description: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const copyCreds = () => {
    if (!createdInfo) return
    const text = `Akun Koderium Mahasiswa:\nEmail: ${createdInfo.email}\nPassword: ${createdInfo.password}\nLogin di: ${window.location.origin}/login`
    navigator.clipboard.writeText(text)
    toast({
      title: "Kredensial disalin ke clipboard",
      description: "Anda dapat membagikannya langsung kepada mahasiswa bersangkutan.",
    })
  }

  if (isStaff === false) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Akses Terbatas
          </CardTitle>
          <CardDescription className="text-amber-700">
            Halaman manajemen akun mahasiswa ini hanya dapat diakses oleh Dosen Pengampu dan Asisten Laboratorium (TA).
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const filteredStudents = students.filter((s) => {
    const query = searchQuery.toLowerCase()
    const nameMatch = s.full_name?.toLowerCase().includes(query)
    const emailMatch = (s.university_email || s.email)?.toLowerCase().includes(query)
    const nimMatch = s.nim?.toLowerCase().includes(query)
    return nameMatch || emailMatch || nimMatch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Akun Mahasiswa
          </h2>
          <p className="text-sm text-slate-500">
            Dosen dan TA dapat membuat, memperbarui, dan menghapus akun mahasiswa menggunakan email universitas.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-sm">
          <UserPlus className="h-4 w-4" />
          Tambah Mahasiswa
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari berdasarkan nama, NIM, atau email universitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="class-filter" className="text-xs text-slate-500 whitespace-nowrap">
              Filter Kelas:
            </Label>
            <Select value={selectedClassFilter} onValueChange={handleFilterChange}>
              <SelectTrigger id="class-filter" className="w-[180px]">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Daftar Mahasiswa Terdaftar</CardTitle>
              <CardDescription>
                Total: {filteredStudents.length} mahasiswa aktif
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Memuat data mahasiswa...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-900">Belum ada akun mahasiswa</p>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan tombol &ldquo;Tambah Mahasiswa&rdquo; untuk membuat akun baru menggunakan email universitas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIM</TableHead>
                    <TableHead>Nama Mahasiswa</TableHead>
                    <TableHead>Email Universitas</TableHead>
                    <TableHead>Kelas Terdaftar</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-800">
                        {student.nim || "-"}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {student.full_name}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{student.university_email || student.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.class_enrollment ? (
                          <Badge variant="outline" className="font-normal text-xs">
                            {student.class_enrollment.class_name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">Belum masuk kelas</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(student)}
                          className="h-8 w-8 p-0"
                          title="Edit data mahasiswa"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStudent(student.id, student.full_name)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Hapus akun mahasiswa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* CREATE STUDENT DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateStudent}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Tambah Akun Mahasiswa
              </DialogTitle>
              <DialogDescription>
                Buat akun baru untuk mahasiswa menggunakan email universitas resmi. Mahasiswa dapat langsung login.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="create-nim">NIM (Nomor Induk Mahasiswa) *</Label>
                <Input
                  id="create-nim"
                  placeholder="Contoh: 2404212"
                  value={newNim}
                  onChange={(e) => {
                    setNewNim(e.target.value)
                    if (!newPassword) {
                      setNewPassword(`Mhs#${e.target.value}`)
                    }
                  }}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-name">Nama Lengkap *</Label>
                <Input
                  id="create-name"
                  placeholder="Contoh: Muhammad Samid"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-email">Email Universitas *</Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="Contoh: 2404212@student.university.ac.id"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="create-pwd">Password Login</Label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={handleGeneratePassword}
                  >
                    Generate Password
                  </Button>
                </div>
                <Input
                  id="create-pwd"
                  placeholder="Default: Mhs#<NIM>"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Password awal yang dapat digunakan mahasiswa untuk login.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-class">Pilih Kelas</Label>
                <Select value={newClassId} onValueChange={setNewClassId}>
                  <SelectTrigger id="create-class">
                    <SelectValue placeholder="Pilih kelas (opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Membuat Akun..." : "Buat Akun"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT STUDENT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdateStudent}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" />
                Perbarui Data Mahasiswa
              </DialogTitle>
              <DialogDescription>
                Ubah informasi profil, email, kelas, atau atur ulang kata sandi mahasiswa.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-nim">NIM</Label>
                <Input
                  id="edit-nim"
                  value={editNim}
                  onChange={(e) => setEditNim(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Nama Lengkap</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Email Universitas</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-pwd">Atur Password Baru (opsional)</Label>
                <Input
                  id="edit-pwd"
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-class">Kelas</Label>
                <Select value={editClassId} onValueChange={setEditClassId}>
                  <SelectTrigger id="edit-class">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATED ACCOUNT CREDENTIALS POPUP */}
      <Dialog open={!!createdInfo} onOpenChange={() => setCreatedInfo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <UserCheck className="h-5 w-5" />
              Akun Mahasiswa Siap Digunakan!
            </DialogTitle>
            <DialogDescription>
              Salin dan bagikan kredensial berikut kepada mahasiswa yang bersangkutan.
            </DialogDescription>
          </DialogHeader>

          {createdInfo && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm font-mono">
                <div>
                  <span className="text-slate-500 block text-xs">Email Login:</span>
                  <span className="font-semibold text-slate-800">{createdInfo.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Password:</span>
                  <span className="font-semibold text-slate-800">{createdInfo.password}</span>
                </div>
              </div>

              <Button onClick={copyCreds} variant="outline" className="w-full gap-2">
                <Copy className="h-4 w-4" />
                Salin Info Kredensial
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setCreatedInfo(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
