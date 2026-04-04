'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CreditCard,
  LayoutDashboard,
  Receipt,
  Calendar,
  Lightbulb,
  Settings,
  Tags,
  LogOut,
  Wallet,
  Mail,
} from 'lucide-react'
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
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const mainNavItems = [
  {
    title: 'Tổng quan',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Thẻ tín dụng',
    url: '/cards',
    icon: CreditCard,
  },
  {
    title: 'Giao dịch',
    url: '/transactions',
    icon: Receipt,
  },
  {
    title: 'Trả góp',
    url: '/installments',
    icon: Wallet,
  },
]

const toolsNavItems = [
  {
    title: 'Lịch thanh toán',
    url: '/calendar',
    icon: Calendar,
  },
  {
    title: 'Gợi ý chi tiêu',
    url: '/smart-spend',
    icon: Lightbulb,
  },
  {
    title: 'Gmail Sync',
    url: '/gmail-sync',
    icon: Mail,
  },
]

const settingsNavItems = [
  {
    title: 'Danh mục',
    url: '/categories',
    icon: Tags,
  },
  {
    title: 'Cài đặt',
    url: '/settings',
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CreditCard className="size-5" />
          </div>
          <span className="text-lg font-semibold">CardWise</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu chính</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Công cụ</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Cài đặt</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          <span>Đăng xuất</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
