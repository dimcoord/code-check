"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { GraduationCap, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { signup } from "@/lib/auth-actions"

const signupFormSchema = z.object({
  full_name: z
    .string()
    .min(2, { message: "Nama lengkap minimal 2 karakter." })
    .max(50, { message: "Nama tidak boleh melebihi 50 karakter." }),
  email: z
    .string()
    .min(1, { message: "Email universitas harus diisi." })
    .email("Format email tidak valid."),
  password: z
    .string()
    .min(6, { message: "Password minimal 6 karakter." })
    .max(40, { message: "Password maksimal 40 karakter." }),
  nim: z
    .string()
    .min(4, { message: "NIM / ID minimal 4 karakter." })
    .max(20, { message: "NIM tidak boleh melebihi 20 karakter." }),
  kelas: z.string().optional(),
  role: z.enum(["student", "ta", "lecturer"]),
})

type SignupFormValues = z.infer<typeof signupFormSchema>

export default function SignupPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      nim: "",
      kelas: "",
      role: "student",
    },
  })

  async function onSubmit(data: SignupFormValues) {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      await signup(data)
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal melakukan pendaftaran.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="mx-auto w-full max-w-md shadow-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <GraduationCap className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Registrasi Akun Koderium
          </CardTitle>
          <CardDescription className="text-xs">
            Daftarkan akun menggunakan email universitas untuk mengakses tugas pemrograman.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              {errorMessage}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Muhammad Samid" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Email Universitas</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Contoh: 2404212@student.university.ac.id"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Kata Sandi (Password)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Minimal 6 karakter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="nim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">NIM / NIP</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: 2404212" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Peran Akun</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Pilih peran" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Mahasiswa</SelectItem>
                          <SelectItem value="ta">Asisten Dosen (TA)</SelectItem>
                          <SelectItem value="lecturer">Dosen</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="kelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Kelas / Angkatan (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: TI-2024-A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2 flex flex-col space-y-3">
                <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                  <UserPlus className="h-4 w-4" />
                  {isSubmitting ? "Mendaftarkan..." : "Daftar Sekarang"}
                </Button>

                <div className="text-center text-xs text-slate-500">
                  Sudah memiliki akun?{" "}
                  <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                    Masuk di sini
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
