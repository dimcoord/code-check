"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/lib/auth-actions";

const profileFormSchema = z.object({
  full_name: z
    .string()
    .min(2, {
      message: "Nama harus lebih dari dua karakter.",
    })
    .max(40, {
      message: "Nama tidak boleh melebihi 40 karakter.",
    }),
  email: z
    .string()
    .min(1, { message: "Email harus diisi!." })
    .email("Email tidak valid!."),
  password: z
    .string()
    .min(2, {
      message: "Password harus lebih dari 6 karakter.",
    })
    .max(40, {
      message: "Password tidak boleh melebihi 40 karakter.",
    }),
  nim: z
    .string()
    .min(7, {
      message: "NIM tidak boleh kurang dari 7 karakter.",
    })
    .max(16, {
      message: "NIM tidak boleh melebihi 16 karakter.",
    }),
  kelas: z
    .string()
    .min(7, {
      message: "Tidak boleh kurang dari 7 karakter.",
    })
    .max(16, {
      message: "Tidak boleh melebihi 16 karakter.",
    }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function SignupPage() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  })

  function onSubmit(data: ProfileFormValues) {
    signup(data)
  }
  
  return (
    <div>
    <Card className="mx-auto my-6 max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Registrasi Akun</CardTitle>
        <CardDescription>
          Registrasi akun Anda menggunakan email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Lengkap</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: M. Samid Setiawan" {...field} />
                </FormControl>
                <FormDescription>
                  Nama lengkap Anda yang akan ditampilkan.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Contoh: setiawan@contoh.com" {...field} />
                </FormControl>
                <FormDescription>
                  Email yang Anda gunakan.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="" {...field} />
                </FormControl>
                <FormDescription>
                  Minimal 8 karakter.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          <FormField
            control={form.control}
            name="nim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Induk Mahasiswa</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Contoh: 2404212" {...field} />
                </FormControl>
                <FormDescription>
                  Nomor Induk Mahasiswa (dapat diubah nanti)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          <FormField
            control={form.control}
            name="kelas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kelas</FormLabel>
                <FormControl>
                <Input placeholder="Contoh: Tekkom-1C" {...field} />
                </FormControl>
                <FormDescription>
                  Kelas yang Anda ambil.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          <div className="flex flex-col space-y-4">
            <Button type="submit">Daftar Sekarang!</Button>
            <span className="text-center">Sudah punya akun? 
              <a href="/login" className="underline"> Masuk</a></span>
          </div>
        </form>
      </Form>
      </CardContent></Card></div>
  )
}
