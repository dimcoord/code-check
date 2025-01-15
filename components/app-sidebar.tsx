"use client"

import { Calendar, ChevronUp, Code2, FileText, Home, Inbox, Search, Settings, User, User2 } from "lucide-react"
 
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "./ui/button"
import { useEffect } from "react"

interface ChildComponentProps {
    props: {
      full_name: string;
    };
}
  

export function AppSidebar({props}: ChildComponentProps) {
    const {
        setOpenMobile,
      } = useSidebar()

    const pathname = usePathname()
    useEffect(() => {
        setOpenMobile(false)
    }, [pathname, setOpenMobile])

    const items = [
            {
            title: "Dasbor",
            href: "/dashboard",
            icon: Home,
            },
            {
                title: "Kelas",
                href: "/dashboard/profile",
                icon: User,
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
            
        ]

    return (
        <Sidebar>
        <SidebarHeader>
            <h1 className="text-center text-xl text-black">CodeCheck</h1>
            <p className="text-center text-black">v0.1</p>
        </SidebarHeader>
        <SidebarContent>
            <SidebarGroup>
            <SidebarMenu>
                {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                    <Button asChild
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start">
                    <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                    </Link>
                    </Button>
                </SidebarMenuItem>
                ))}
            </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup />
        </SidebarContent>

        <SidebarFooter>
            <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuButton>
                    {props ? (<div> {props.full_name}</div>) : (<p>Loading...</p>)}
                    <ChevronUp className="ml-auto" />
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    side="top"
                    className="w-[--radix-popper-anchor-width]"
                >
                    <DropdownMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="w-full justify-start"
                        >
                            <Link href="/dashboard/profile">Pengaturan</Link>
                        </SidebarMenuButton>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="w-full justify-start"
                        >
                            <Link href="/logout">Keluar</Link>
                        </SidebarMenuButton>
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
        </Sidebar>
    )
}
