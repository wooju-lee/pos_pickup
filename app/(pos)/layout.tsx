"use client"

import { usePathname, useRouter } from "next/navigation"
import { Header } from "@/components/pos/header"
import { TabNavigation } from "@/components/pos/tab-navigation"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

const TAB_ROUTES: Record<string, string> = {
  "pos-main": "/",
  "daily-sales": "/",
  "store-pickup": "/",
  "rx-operation": "/",
  "outbound-queue": "/outbound-label",
}

function getActiveTab(pathname: string): string {
  if (pathname.startsWith("/outbound-label")) return "outbound-queue"
  if (pathname.startsWith("/cancel") || pathname.startsWith("/refund")) return "store-pickup"
  return "store-pickup"
}

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const activeTab = getActiveTab(pathname)

  const handleTabChange = (tabId: string) => {
    const route = TAB_ROUTES[tabId]
    if (route) router.push(route)
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Toaster richColors position="top-right" />
        <Header />
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        {children}
      </div>
    </TooltipProvider>
  )
}
