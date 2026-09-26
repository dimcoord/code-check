import Link from 'next/link'
import { ArrowRight, Check, Code2, GraduationCap, ShieldCheck, Terminal } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <nav className="container mx-auto px-4 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Koderium</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Buka Dasbor
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-blue-600 text-sm font-medium px-3 py-2"
                >
                  Masuk
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-grow">
        <section className="bg-gradient-to-b from-blue-50/70 via-indigo-50/30 to-white py-20 lg:py-28">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 mb-6">
              <Terminal className="h-3.5 w-3.5" />
              Evaluasi & Grading Tugas C++ dan Java
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              Review & Penilaian Kode Mahasiswa dengan <span className="text-blue-600">Koderium</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Platform untuk dosen dan asisten praktikum dalam mengelola akun mahasiswa, membuat tugas, menguji kode via Judge0, dan memberikan grading secara presisi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={user ? "/dashboard" : "/login"}
                className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3.5 rounded-lg text-base font-semibold hover:bg-blue-700 transition-all shadow-md gap-2 w-full sm:w-auto"
              >
                {user ? "Masuk ke Dasbor" : "Mulai Sekarang"}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-white border border-slate-200 text-slate-700 px-6 py-3.5 rounded-lg text-base font-semibold hover:bg-slate-50 transition-all w-full sm:w-auto"
              >
                Login Mahasiswa
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-slate-100 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-900 mb-12">
              Fitur Lengkap untuk Dosen, Asisten, dan Mahasiswa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Akun Email Universitas",
                  desc: "Dosen dan TA dapat membuat, memperbarui, dan menghapus akun mahasiswa secara terpusat.",
                  icon: GraduationCap,
                },
                {
                  title: "Editor CodeMirror & Unggah File",
                  desc: "Mahasiswa dapat menulis kode langsung di editor dengan syntax highlighting atau mengunggah source code .cpp/.java.",
                  icon: Code2,
                },
                {
                  title: "Evaluasi Cepat via Judge0",
                  desc: "Eksekusi kode secara aman dengan runner Judge0, laporan runtime, memori, error kompilasi, dan grading feedback.",
                  icon: ShieldCheck,
                },
              ].map((feat, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-6 bg-slate-50/50 shadow-sm space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <feat.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{feat.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 Koderium. Platform Evaluasi Kode Mahasiswa.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:underline">Login</Link>
            <Link href="/signup" className="hover:underline">Registrasi</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
