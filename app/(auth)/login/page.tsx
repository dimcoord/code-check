"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { GraduationCap, LogIn } from "lucide-react"

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
import { createClient } from "@/utils/supabase/client"
import { login } from "@/lib/auth-actions"

const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email harus diisi." })
    .email("Format email tidak valid."),
  password: z
    .string()
    .min(6, {
      message: "Password minimal 6 karakter.",
    })
    .max(40, {
      message: "Password tidak boleh melebihi 40 karakter.",
    }),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function checkExistingSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.push("/dashboard")
      }
    }

    checkExistingSession()
  }, [router, supabase])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      await login(data)
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal masuk. Periksa email dan kata sandi Anda.")
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
            Masuk ke Koderium
          </CardTitle>
          <CardDescription className="text-xs">
            Gunakan email universitas dan kata sandi yang telah didaftarkan oleh dosen atau asisten.
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
                      <Input
                        type="password"
                        placeholder="Masukkan password Anda"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2 flex flex-col space-y-3">
                <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                  <LogIn className="h-4 w-4" />
                  {isSubmitting ? "Sedang Masuk..." : "Masuk"}
                </Button>

                <div className="text-center text-xs text-slate-500">
                  Belum punya akun?{" "}
                  <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
                    Daftar Mandiri
                  </Link>{" "}
                  atau hubungi Dosen/TA kelas Anda.
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
