"use client"

import { useState, useMemo } from "react"
import { subMonths } from "date-fns"
import { Header } from "@/components/pos/header"
import { TabNavigation } from "@/components/pos/tab-navigation"
import { OrderFilters } from "@/components/pos/order-filters"
import { OrderTable } from "@/components/pos/order-table"
import { Pagination } from "@/components/pos/pagination"
import { OrderDetailModal } from "@/components/pos/order-detail-modal"
import { PickupCompleteModal } from "@/components/pos/pickup-complete-modal"
import { CancelModal } from "@/components/pos/cancel-modal"
import { ReturnModal } from "@/components/pos/return-modal"
import { POSMain } from "@/components/pos/pos-main"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { mockOrders, mockReturnRequests } from "@/lib/mock-data"
import type { PickupOrder, PickupStatus, InventoryLocation, ReturnRequest } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { RotateCcw, Download, QrCode, Search } from "lucide-react"

export default function POSOnlinePickupPage() {
  const [activeTab, setActiveTab] = useState("store-pickup")
  const [orders, setOrders] = useState<PickupOrder[]>(mockOrders)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [dateType, setDateType] = useState("order")
  const [startDate, setStartDate] = useState<Date | undefined>(subMonths(new Date(), 1))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [pickupStatuses, setPickupStatuses] = useState<PickupStatus[]>(["waiting", "ready", "completed", "cancelled", "refunded"])
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(30)
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<PickupOrder | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isPickupOpen, setIsPickupOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isReturnOpen, setIsReturnOpen] = useState(false)
  const [qrScanValue, setQrScanValue] = useState("")
  const [qrScanError, setQrScanError] = useState<string | null>(null)

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

      // Pickup status filter (multi-select)
      if (pickupStatuses.length > 0 && pickupStatuses.length < 5 && !pickupStatuses.includes(order.pickupStatus)) {
        return false
      }

      // Date range filter
      if (startDate || endDate) {
        let dateValue: string | undefined
        switch (dateType) {
          case "order": dateValue = order.orderDate; break
          case "pickup": dateValue = order.pickupDate; break
          case "outbound": dateValue = order.outboundDate; break
          case "inbound": dateValue = order.inboundDate; break
          case "completed": dateValue = order.completedAt; break
        }
        if (dateValue) {
          const d = new Date(dateValue)
          if (startDate && d < new Date(startDate.toDateString())) return false
          if (endDate && d > new Date(new Date(endDate).setHours(23, 59, 59, 999))) return false
        } else if (startDate || endDate) {
          return false
        }
      }

      return true
    })
  }, [orders, searchQuery, pickupStatuses, dateType, startDate, endDate])

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredOrders.slice(start, start + rowsPerPage)
  }, [filteredOrders, currentPage, rowsPerPage])

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage) || 1

  // QR scan lookup
  const handleQrScan = () => {
    if (!qrScanValue.trim()) return
    const query = qrScanValue.trim()
    const found = orders.find(
      (o) => o.orderNumber === query || o.pickupQrCode === query
    )
    if (found) {
      setSelectedOrder(found)
      setIsDetailOpen(true)
      setQrScanValue("")
      setQrScanError(null)
    } else {
      setQrScanError("No matching order found.")
    }
  }

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
    setOrders((prev) =>
      prev.map((order) =>
        order.id === returnRequest.orderId
          ? {
              ...order,
              status: "returned" as const,
              pickupStatus: "refunded" as const,
              returnedAt: new Date().toISOString(),
              inventoryLocation: location,
            }
          : order
      )
    )
    toast.success("Return Completed", {
      description: "The return has been processed and the order status has been updated to Refunded.",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "pos-main" && <POSMain />}

      {activeTab === "store-pickup" && (
        <>
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
                pickupStatuses={pickupStatuses}
                onPickupStatusesChange={setPickupStatuses}
              />

              {/* Divider */}
              <div className="border-t border-border" />

              {/* QR Scan */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <QrCode className="h-4 w-4" />
                  <span>Pickup QR Scan</span>
                </div>
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Input
                    placeholder="Scan or enter Order No. / Pickup QR Code"
                    value={qrScanValue}
                    onChange={(e) => {
                      setQrScanValue(e.target.value)
                      setQrScanError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        e.stopPropagation()
                        handleQrScan()
                      }
                    }}
                    className="font-mono text-xs placeholder:text-gray-300"
                  />
                  <Button
                    variant="outline"
                    onClick={handleQrScan}
                    disabled={!qrScanValue.trim()}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                {qrScanError && (
                  <p className="text-sm text-destructive">{qrScanError}</p>
                )}
              </div>

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
        </>
      )}

      {/* Store Pickup Modals */}
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
