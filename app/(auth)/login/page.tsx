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
import { login } from "@/lib/auth-actions";

const profileFormSchema = z.object({
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
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function SignupPage() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  })

  function onSubmit(data: ProfileFormValues) {
    login(data)
  }
  
  return (
    <div>
    <Card className="mx-auto my-6 max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Masuk</CardTitle>
        <CardDescription>
          Masuk menggunakan akun Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
          <Button type="submit">Daftar Sekarang!</Button>
        </form>
      </Form>
      </CardContent></Card></div>
  )
}
