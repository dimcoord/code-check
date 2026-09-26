import { redirect } from 'next/navigation'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { getCurrentUserAndProfile } from '@/lib/auth-helpers'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentUserAndProfile()

  if (!user || !profile) {
    redirect('/login')
  }

  const sidebarUser = {
    id: user.id,
    email: profile.email || user.email || '',
    full_name: profile.full_name || user.user_metadata?.full_name || user.email || 'Pengguna',
    role: profile.role || 'student',
    nim: profile.nim || user.user_metadata?.nim,
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50/50">
        <AppSidebar user={sidebarUser} />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm px-4 flex items-center gap-3 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-sm font-medium text-slate-600">
              Koderium &bull; Evaluasi Kode Mahasiswa (C++ & Java)
            </span>
          </header>
          <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
