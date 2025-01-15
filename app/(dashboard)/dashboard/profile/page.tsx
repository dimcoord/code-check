"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
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
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client";
import React, { useEffect, useState } from "react";

const profileFormSchema = z.object({
  full_name: z
    .string()
    .min(2, {
      message: "Nama harus lebih dari dua karakter.",
    })
    .max(40, {
      message: "Nama tidak boleh melebihi 40 karakter.",
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
  urls: z
    .array(
      z.object({
        value: z.string().url({ message: "Please enter a valid URL." }),
      })
    )
    .optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const supabase = createClient();
  const { toast } = useToast()

  useEffect(() => {
        const fetchUser = async () => {
          const { data: { user } } = await supabase.auth.getUser()
          setUser(user)
    
          if (user) {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', user.email)
              .single()
    
            if (error) {
              console.error('Error fetching user data:', error)
            } else {
              setUserData(data)
            }
          }
        }
    
        fetchUser()
      }, [])

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  })

  function onSubmit(data: ProfileFormValues) {
    toast({
      title: "Profile updated",
    })
  }

  return (
    <div>
          <h1>User Profile</h1>
          {userData ? (
            <><div>
          <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div><Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder={userData.full_name} {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your public display name.
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
                      <Input type="number" placeholder={userData.nim} {...field} />
                    </FormControl>
                    <FormDescription>
                      Your email address is used for notifications.
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
                    <Input placeholder={userData.kelas} {...field} />
                    </FormControl>
                    <FormDescription>
                      You can @mention other users and organizations.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              <Button type="submit">Update profile</Button>
            </form>
          </Form></>
          ) : (
            <p>Loading user data...</p>
          )}
        </div>
)}

