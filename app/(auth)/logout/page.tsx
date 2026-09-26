'use client'

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.push("/login"), 2500)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-sm text-center shadow-md">
        <CardHeader className="space-y-2">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <CardTitle className="text-xl">Berhasil Keluar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-500">
            Anda telah keluar dari akun Koderium. Mengalihkan ke halaman login...
          </p>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/login">Kembali ke Halaman Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}