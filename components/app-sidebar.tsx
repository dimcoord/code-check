"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  CheckSquare,
  ChevronUp,
  Code2,
  FileCode,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  Settings,
  Users,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { UserRole } from "@/types/database"

interface AppSidebarProps {
  user: {
    id: string
    email: string
    full_name: string
    role: UserRole
    nim?: string | null
  }
}

export function AppSidebar({ user }: AppSidebarProps) {
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()

  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  const isStaff = user.role === "lecturer" || user.role === "ta"

  const staffItems = [
    {
      title: "Dasbor",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Kelas",
      href: "/dashboard/classes",
      icon: BookOpen,
    },
    {
      title: "Mahasiswa",
      href: "/dashboard/students",
      icon: Users,
    },
    {
      title: "Tugas Coding",
      href: "/dashboard/assignments",
      icon: FileCode,
    },
    {
      title: "Review & Nilai",
      href: "/dashboard/submissions",
      icon: CheckSquare,
    },
  ]

  const studentItems = [
    {
      title: "Dasbor",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Kelas",
      href: "/dashboard/classes",
      icon: BookOpen,
    },
    {
      title: "Tugas Kuliah",
      href: "/dashboard/assignments",
      icon: FileCode,
    },
    {
      title: "Submit Kode",
      href: "/dashboard/submit",
      icon: Code2,
    },
    {
      title: "Submisi Saya",
      href: "/dashboard/submissions",
      icon: FileText,
    },
  ]

  const navItems = isStaff ? staffItems : studentItems

  const roleLabel = {
    lecturer: "Dosen Pengampu",
    ta: "Asisten Dosen (TA)",
    student: "Mahasiswa",
  }[user.role] || "Mahasiswa"

  return (
    <Sidebar className="border-r border-slate-200 bg-white">
      <SidebarHeader className="border-b border-slate-100 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Koderium</h1>
            <p className="text-xs text-slate-500">Platform Evaluasi Kode</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 py-2">
            {isStaff ? "Panel Dosen / Asisten" : "Panel Mahasiswa"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))

                return (
                  <SidebarMenuItem key={item.title}>
                    <Button
                      asChild
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start gap-3 h-10 px-3 font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <Link href={item.href}>
                        <item.icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                        <span>{item.title}</span>
                      </Link>
                    </Button>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-start min-w-0 text-left">
                    <span className="text-sm font-semibold text-slate-800 truncate w-40">
                      {user.full_name || user.email}
                    </span>
                    <span className="text-xs text-slate-500 truncate w-40">
                      {user.email}
                    </span>
                    <Badge
                      variant={isStaff ? "default" : "outline"}
                      className="mt-1 text-[10px] px-1.5 py-0 font-medium"
                    >
                      {roleLabel}
                    </Badge>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4 text-slate-400" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56 p-1">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/classes" className="flex items-center gap-2 cursor-pointer">
                    <BookOpen className="h-4 w-4 text-slate-500" />
                    <span>Kelola Kelas</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/logout" className="flex items-center gap-2 text-red-600 cursor-pointer">
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>Keluar (Logout)</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
