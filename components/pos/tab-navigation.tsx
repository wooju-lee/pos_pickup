"use client"

import { ShoppingCart, BarChart3, Package, Info, Printer } from "lucide-react"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  icon: React.ReactNode
}

const tabs: Tab[] = [
  { id: "pos-main", label: "POS Main", icon: <ShoppingCart className="h-4 w-4" /> },
  { id: "daily-sales", label: "Daily Sales Summary", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "store-pickup", label: "Store Pickup List", icon: <Package className="h-4 w-4" /> },
  { id: "rx-operation", label: "RX Operation List", icon: <Info className="h-4 w-4" /> },
  { id: "outbound-queue", label: "Outbound Label Print", icon: <Printer className="h-4 w-4" /> },
]

interface TabNavigationProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="flex items-center gap-2 px-6 py-3 bg-card border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            activeTab === tab.id
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
