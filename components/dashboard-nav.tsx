"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Code2, FileText, Home, User } from 'lucide-react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Submit Code",
    href: "/dashboard/submit",
    icon: Code2,
  },
  {
    title: "Submissions",
    href: "/dashboard/submissions",
    icon: FileText,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
]

export function DashboardNav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={cn("p-4", className)}>
      <div className="space-y-1">
        {items.map((item) => (
          <Button
            key={item.href}
            asChild
            variant={pathname === item.href ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  )
}

