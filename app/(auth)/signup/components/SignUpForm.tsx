import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/lib/auth-actions";

export function SignUpForm() {
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Registrasi Akun</CardTitle>
        <CardDescription>
          Registrasi akun Anda menggunakan email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action="">
          <div className="grid gap-4">
            <div className="">
              <div className="">
                <Label htmlFor="full-name">Nama Lengkap</Label>
                <Input
                  name="full-name"
                  id="full-name"
                  placeholder="Max"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                name="email"
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input name="password" id="password" type="password" />
            </div>
            <div className="">
                <Label htmlFor="nim">Nomor Induk Mahasiswa (NIM)</Label>
                <Input
                  name="nim"
                  id="nim"
                  placeholder="24000002"
                  required
                />
            </div>
            <div className="">
                <Label htmlFor="kelas">Kelas</Label>
                <Input
                  name="kelas"
                  id="kelas"
                  placeholder="1C"
                  required
                />
            </div>
            <Button formAction={signup} type="submit" className="w-full">
              Registrasi akun!
            </Button>
          </div>
        </form>
        <div className="mt-4 text-center text-sm">
          Sudah punya akun?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
