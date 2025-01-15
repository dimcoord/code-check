import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: {user} } = await supabase.auth.getUser()

  return (
    <>
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            CodeCheck
          </Link>
          <div className="space-x-4">
          {user ? (
            <><Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Dasbor
                </Link></>
          ) : (
            <><Link href="/login" className="text-gray-600 hover:text-blue-600">
                  Masuk
                </Link><Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Daftar
                  </Link></>
          )}
          </div>
        </nav>
      </header>

      <main className="flex-grow">
        <section className="bg-gradient-to-b from-blue-50 to-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Pemrograman Mudah dengan <span className="text-blue-600">CodeCheck</span>
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Kelola kelas pemrograman Anda dengan cepat dan tepat.
            </p>
            <Link 
              href="/dashboard"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-blue-700"
            >
              Coba Sekarang!
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Kenapa pilih CodeCheck?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                "100% Serverless",
                "Tampilan Minimalis",
                "Setup Mudah",
                "Analisis Detil",
                "Kelola Kelas",
                "Verifikasi Email"
              ].map((feature, index) => (
                <div key={index} className="flex items-start">
                  <Check className="text-green-500 mr-2 h-6 w-6 flex-shrink-0" />
                  <p className="text-lg">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 mb-4 md:mb-0">
              © 2025 CodeCheck.
            </p>
            <div className="space-x-4">
              <Link href="https://github.com/dimcoord/code-check" className="text-gray-600 hover:text-blue-600">
                Kontribusi
              </Link>
              <Link href="https://www.instagram.com/dimcord/" className="text-gray-600 hover:text-blue-600">
                Kontak
              </Link>
              <Link href="/privacy" className="text-gray-600 hover:text-blue-600">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

