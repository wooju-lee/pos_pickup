"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/pos/header"
import { TabNavigation } from "@/components/pos/tab-navigation"
import { OrderFilters } from "@/components/pos/order-filters"
import { OrderTable } from "@/components/pos/order-table"
import { Pagination } from "@/components/pos/pagination"
import { OrderDetailModal } from "@/components/pos/order-detail-modal"
import { PickupCompleteModal } from "@/components/pos/pickup-complete-modal"
import { CancelModal } from "@/components/pos/cancel-modal"
import { ReturnModal } from "@/components/pos/return-modal"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { mockOrders, mockReturnRequests } from "@/lib/mock-data"
import type { PickupOrder, PickupStatus, InventoryLocation, ReturnRequest } from "@/lib/types"
import { RotateCcw, Download } from "lucide-react"

export default function POSOnlinePickupPage() {
  const [activeTab, setActiveTab] = useState("store-pickup")
  const [orders, setOrders] = useState<PickupOrder[]>(mockOrders)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [dateType, setDateType] = useState("order")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date("2026-01-06"))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date("2026-01-20"))
  const [pickupStatus, setPickupStatus] = useState<PickupStatus | "all">("all")
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(30)
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<PickupOrder | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isPickupOpen, setIsPickupOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isReturnOpen, setIsReturnOpen] = useState(false)

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search filter
      if (searchQuery.length >= 2) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          order.orderNumber.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.items.some(
            (item) =>
              item.sku.toLowerCase().includes(query) ||
              item.productName.toLowerCase().includes(query)
          )
        if (!matchesSearch) return false
      }

      // Pickup status filter
      if (pickupStatus !== "all" && order.pickupStatus !== pickupStatus) {
        return false
      }

      return true
    })
  }, [orders, searchQuery, pickupStatus])

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredOrders.slice(start, start + rowsPerPage)
  }, [filteredOrders, currentPage, rowsPerPage])

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage) || 1

  // View detail
  const handleViewDetail = (order: PickupOrder) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }

  // Pickup complete
  const handlePickupComplete = async (orderId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "completed" as const,
              pickupStatus: "completed" as const,
              processingStatus: "completed" as const,
              approvalStatus: "confirm" as const,
              completedAt: new Date().toISOString(),
            }
          : order
      )
    )
    toast.success("Pickup Complete", {
      description: "Order has been marked as picked up.",
    })
  }

  // Cancel order
  const handleCancel = async (orderId: string, location: InventoryLocation, reason?: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "cancelled" as const,
              pickupStatus: "cancelled" as const,
              processingStatus: "cancelled" as const,
              approvalStatus: "reject" as const,
              cancelledAt: new Date().toISOString(),
              inventoryLocation: location,
              notes: reason,
            }
          : order
      )
    )
    toast.success("Order Cancelled", {
      description: `Order cancelled. Inventory: ${location === "store_sales" ? "Store Sales" : "Store Online"}`,
    })
  }

  // Search return
  const handleSearchReturn = async (qrCode: string): Promise<ReturnRequest | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockReturnRequests[qrCode] || null
  }

  // Process return
  const handleProcessReturn = async (returnRequest: ReturnRequest, location: InventoryLocation) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    toast.success("Return Processed", {
      description: `Refund: ${returnRequest.refundAmount.toLocaleString()}. Inventory: ${location === "store_sales" ? "Store Sales" : "Store Online"}`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="p-6">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Store Pickup List</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage online preorder pickup orders from your store.
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          {/* Filters */}
          <OrderFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            dateType={dateType}
            onDateTypeChange={setDateType}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            pickupStatus={pickupStatus}
            onPickupStatusChange={setPickupStatus}
          />
          
          {/* Divider */}
          <div className="border-t border-border" />
          
          {/* Results count and actions */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">
              Total <span className="font-bold text-primary">{filteredOrders.length}</span> Count
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsReturnOpen(true)}
                className="gap-2 bg-secondary border-border text-foreground hover:bg-muted hover:text-primary"
              >
                <RotateCcw className="h-4 w-4" />
                Return Processing
              </Button>
              <Button
                variant="outline"
                className="gap-2 bg-secondary border-border text-foreground hover:bg-muted hover:text-primary"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
          
          {/* Table */}
          <OrderTable
            orders={paginatedOrders}
            onViewDetail={handleViewDetail}
          />
          
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows)
              setCurrentPage(1)
            }}
          />
        </div>
      </main>

      {/* Modals */}
      <OrderDetailModal
        order={selectedOrder}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onPickupComplete={(order) => {
          setIsDetailOpen(false)
          setSelectedOrder(order)
          setIsPickupOpen(true)
        }}
        onCancel={(order) => {
          setIsDetailOpen(false)
          setSelectedOrder(order)
          setIsCancelOpen(true)
        }}
        onReturn={() => {
          setIsDetailOpen(false)
          setIsReturnOpen(true)
        }}
      />

      <PickupCompleteModal
        order={selectedOrder}
        open={isPickupOpen}
        onOpenChange={setIsPickupOpen}
        onConfirm={handlePickupComplete}
      />

      <CancelModal
        order={selectedOrder}
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        onConfirm={handleCancel}
      />

      <ReturnModal
        open={isReturnOpen}
        onOpenChange={setIsReturnOpen}
        onSearch={handleSearchReturn}
        onConfirm={handleProcessReturn}
      />
    </div>
  )
}
