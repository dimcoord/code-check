import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  const sidebarProps = { full_name: data.user.user_metadata["full_name"]! }
  
  return (
    <SidebarProvider>
      <AppSidebar props={sidebarProps} />
      <main>
        <SidebarTrigger />
        <div className="m-8 w-[73vw]">{children}</div>
      </main>
    </SidebarProvider>
  )
}
