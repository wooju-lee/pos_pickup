"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { subMonths } from "date-fns"
import { OrderFilters } from "@/components/pos/order-filters"
import { OrderTable } from "@/components/pos/order-table"
import { Pagination } from "@/components/pos/pagination"
import { OrderDetailModal } from "@/components/pos/order-detail-modal"
import { ReturnModal } from "@/components/pos/return-modal"
import { OutboundModal } from "@/components/pos/outbound-modal"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { mockOrders, mockReturnRequests } from "@/lib/mock-data"
import type { PickupOrder, PickupStatus, InventoryLocation, ReturnGrading, ReturnRequest, ItemDisposition, OutboundLocation } from "@/lib/types"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { RotateCcw, Download, QrCode, Search, Package, Ban, CornerDownLeft, Store, Warehouse } from "lucide-react"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type PickupSubTab = "pickup" | "cancel" | "refund"

interface StorePickupPageProps {
  initialSubTab?: PickupSubTab
}

export function StorePickupPage({ initialSubTab = "pickup" }: StorePickupPageProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<PickupOrder[]>(mockOrders)

  const pickupSubTab = initialSubTab

  // Filter states (draft = UI inputs, applied = actually used for filtering)
  const defaultDateType = initialSubTab === "cancel" ? "cancelled" : initialSubTab === "refund" ? "returned" : "order"
  const [searchQuery, setSearchQuery] = useState("")
  const [dateType, setDateType] = useState(defaultDateType)
  const [startDate, setStartDate] = useState<Date | undefined>(subMonths(new Date(), 1))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [pickupStatuses, setPickupStatuses] = useState<PickupStatus[]>(["waiting", "ready", "completed"])
  const [dispositionFilter, setDispositionFilter] = useState("all")

  // Applied filter states (committed on Search click)
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("")
  const [appliedDateType, setAppliedDateType] = useState(defaultDateType)
  const [appliedStartDate, setAppliedStartDate] = useState<Date | undefined>(subMonths(new Date(), 1))
  const [appliedEndDate, setAppliedEndDate] = useState<Date | undefined>(new Date())
  const [appliedPickupStatuses, setAppliedPickupStatuses] = useState<PickupStatus[]>(["waiting", "ready", "completed"])
  const [appliedDispositionFilter, setAppliedDispositionFilter] = useState("all")

  // Sort states
  const [sortKey, setSortKey] = useState<string>("orderDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(30)

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<PickupOrder | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isReturnOpen, setIsReturnOpen] = useState(false)
  const [qrScanValue, setQrScanValue] = useState("")
  const [qrScanError, setQrScanError] = useState<string | null>(null)
  const [selectedListItems, setSelectedListItems] = useState<Set<string>>(new Set())
  const [isChangeStockOpen, setIsChangeStockOpen] = useState(false)
  const [isOutboundOpen, setIsOutboundOpen] = useState(false)

  // Check if selected cancel items have pending (no disposition) items
  const hasSelectedPending = useMemo(() => {
    if (selectedListItems.size === 0) return false
    const targetOrders = orders.filter((o) => o.status === "cancelled" || o.status === "returned")
    for (const key of selectedListItems) {
      const dashIndex = key.indexOf("-")
      const orderId = key.substring(0, dashIndex)
      const itemId = key.substring(dashIndex + 1)
      const order = targetOrders.find((o) => o.id === orderId)
      const item = order?.items.find((i) => i.id === itemId)
      if (item && !item.disposition) return true
    }
    return false
  }, [selectedListItems, orders])

  const hasSelectedWithDisposition = useMemo(() => {
    if (selectedListItems.size === 0) return false
    const targetOrders = orders.filter((o) => o.status === "cancelled" || o.status === "returned")
    for (const key of selectedListItems) {
      const dashIndex = key.indexOf("-")
      const orderId = key.substring(0, dashIndex)
      const itemId = key.substring(dashIndex + 1)
      const order = targetOrders.find((o) => o.id === orderId)
      const item = order?.items.find((i) => i.id === itemId)
      if (item && item.disposition) return true
    }
    return false
  }, [selectedListItems, orders])

  // Check if any selected item has Store Sales disposition (not eligible for outbound)
  const hasSelectedStoreSales = useMemo(() => {
    if (selectedListItems.size === 0) return false
    const targetOrders = orders.filter((o) => o.status === "cancelled" || o.status === "returned")
    for (const key of selectedListItems) {
      const dashIndex = key.indexOf("-")
      const orderId = key.substring(0, dashIndex)
      const itemId = key.substring(dashIndex + 1)
      const order = targetOrders.find((o) => o.id === orderId)
      const item = order?.items.find((i) => i.id === itemId)
      if (item && item.disposition === "store") return true
    }
    return false
  }, [selectedListItems, orders])

  // Orders filtered by sub-tab
  const tabFilteredOrders = useMemo(() => {
    switch (pickupSubTab) {
      case "cancel":
        return orders.filter((o) => o.status === "cancelled")
      case "refund":
        return orders.filter((o) => o.status === "returned")
      default:
        return orders.filter((o) => o.status !== "cancelled" && o.status !== "returned")
    }
  }, [orders, pickupSubTab])

  // Apply filters (committed on Search click)
  const handleSearch = () => {
    setAppliedSearchQuery(searchQuery)
    setAppliedDateType(dateType)
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
    setAppliedPickupStatuses(pickupStatuses)
    setAppliedDispositionFilter(dispositionFilter)
    setCurrentPage(1)
  }

  // Filtered orders (uses applied states only)
  const filteredOrders = useMemo(() => {
    return tabFilteredOrders.filter((order) => {
      // Search filter
      if (appliedSearchQuery.length >= 2) {
        const query = appliedSearchQuery.toLowerCase()
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

      // Pickup status filter (only for pickup tab)
      if (pickupSubTab === "pickup" && appliedPickupStatuses.length > 0 && appliedPickupStatuses.length < 3 && !appliedPickupStatuses.includes(order.pickupStatus)) {
        return false
      }

      // Stock Disposition filter (cancel/refund tabs)
      if (appliedDispositionFilter !== "all" && (pickupSubTab === "cancel" || pickupSubTab === "refund")) {
        const hasMatchingItem = order.items.some((item) => {
          if (appliedDispositionFilter === "none") return !item.disposition
          return item.disposition === appliedDispositionFilter
        })
        if (!hasMatchingItem) return false
      }

      // Date range filter
      if (appliedStartDate || appliedEndDate) {
        let dateValue: string | undefined
        switch (appliedDateType) {
          case "order": dateValue = order.orderDate; break
          case "pickup": dateValue = order.pickupDate; break
          case "outbound": dateValue = order.outboundDate; break
          case "inbound": dateValue = order.inboundDate; break
          case "completed": dateValue = order.completedAt; break
          case "cancelled": dateValue = order.cancelledAt; break
          case "returned": dateValue = order.returnedAt; break
        }
        if (dateValue) {
          const d = new Date(dateValue)
          if (appliedStartDate && d < new Date(appliedStartDate.toDateString())) return false
          if (appliedEndDate && d > new Date(new Date(appliedEndDate).setHours(23, 59, 59, 999))) return false
        } else if (appliedStartDate || appliedEndDate) {
          return false
        }
      }

      return true
    })
  }, [tabFilteredOrders, appliedSearchQuery, appliedPickupStatuses, pickupSubTab, appliedDateType, appliedStartDate, appliedEndDate])

  // Sorted orders
  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders]
    sorted.sort((a, b) => {
      let aVal: string | number = ""
      let bVal: string | number = ""

      switch (sortKey) {
        case "orderDate": aVal = a.orderDate || ""; bVal = b.orderDate || ""; break
        case "pickupDate": aVal = a.pickupDate || ""; bVal = b.pickupDate || ""; break
        case "outboundDate": aVal = a.outboundDate || ""; bVal = b.outboundDate || ""; break
        case "outboundIvNo": aVal = a.outboundIvNo || ""; bVal = b.outboundIvNo || ""; break
        case "inboundDate": aVal = a.inboundDate || ""; bVal = b.inboundDate || ""; break
        case "orderNumber": aVal = a.orderNumber; bVal = b.orderNumber; break
        case "completedAt": aVal = a.completedAt || ""; bVal = b.completedAt || ""; break
        case "cancelledAt": aVal = a.cancelledAt || ""; bVal = b.cancelledAt || ""; break
        case "cancelReason": aVal = a.cancelReason || a.notes || ""; bVal = b.cancelReason || b.notes || ""; break
        case "returnedAt": aVal = a.returnedAt || ""; bVal = b.returnedAt || ""; break
        case "returnReason": aVal = a.returnReason || ""; bVal = b.returnReason || ""; break
        case "returnGrading": aVal = a.returnGrading || ""; bVal = b.returnGrading || ""; break
        case "inventoryLocation": aVal = a.inventoryLocation || ""; bVal = b.inventoryLocation || ""; break
        default: return 0
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredOrders, sortKey, sortDirection])

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return sortedOrders.slice(start, start + rowsPerPage)
  }, [sortedOrders, currentPage, rowsPerPage])

  const totalPages = Math.ceil(sortedOrders.length / rowsPerPage) || 1

  // Sort handler
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDirection("desc")
    }
    setCurrentPage(1)
  }

  // Reset pagination when sub-tab changes
  const handleSubTabChange = (tab: PickupSubTab) => {
    const routes: Record<PickupSubTab, string> = {
      pickup: "/",
      cancel: "/cancel",
      refund: "/refund",
    }
    router.push(routes[tab])
  }

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
      description: "Pickup has been completed. AC card (serial card) is now printing.",
    })
  }

  // Cancel order (without inventory assignment - that's done later in cancel tab)
  const handleCancel = async (orderId: string, reason?: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "cancelled" as const,
              processingStatus: "cancelled" as const,
              approvalStatus: "reject" as const,
              cancelledAt: new Date().toISOString(),
              cancelReason: reason,
            }
          : order
      )
    )
    toast.success("Order Cancelled", {
      description: "Order cancelled. Assign inventory from the Cancel tab.",
    })
  }

  // Update inventory for cancelled order
  // Resolve selected cancel item keys to orderId/itemId pairs
  const resolveSelectedCancelItems = () => {
    const result: { orderId: string; itemId: string }[] = []
    for (const key of selectedListItems) {
      const [orderId, itemId] = key.split("-")
      if (orderId && itemId) {
        // Find the actual itemId (key format is "orderId-itemId")
        const dashIndex = key.indexOf("-")
        result.push({ orderId: key.substring(0, dashIndex), itemId: key.substring(dashIndex + 1) })
      }
    }
    return result
  }

  const handleChangeStock = (disposition: ItemDisposition) => {
    const items = resolveSelectedCancelItems()
    if (items.length === 0) return
    handleBulkDisposition(items, disposition)
    setSelectedListItems(new Set())
  }

  // Get selected cancel items as OutboundItem[]
  const getSelectedOutboundItems = () => {
    const targetOrders = orders.filter((o) => o.status === "cancelled" || o.status === "returned")
    const result: { order: PickupOrder; item: PickupOrder["items"][0] }[] = []
    for (const key of selectedListItems) {
      const dashIndex = key.indexOf("-")
      const orderId = key.substring(0, dashIndex)
      const itemId = key.substring(dashIndex + 1)
      const order = targetOrders.find((o) => o.id === orderId)
      const item = order?.items.find((i) => i.id === itemId)
      if (order && item) result.push({ order, item })
    }
    return result
  }

  // Handle outbound registration
  const handleOutboundConfirm = async (items: { orderId: string; itemId: string }[], location: OutboundLocation) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const outboundNo = `TOO${String(Date.now()).slice(-5)}`
    setOrders((prev) =>
      prev.map((order) => {
        const matchingItems = items.filter((i) => i.orderId === order.id)
        if (matchingItems.length === 0) return order
        return {
          ...order,
          items: order.items.map((item) =>
            matchingItems.some((i) => i.itemId === item.id)
              ? { ...item, disposition: "warehouse" as const, outboundNo }
              : item
          ),
        }
      })
    )
    setSelectedListItems(new Set())
    toast.success("Outbound Registered", {
      description: `${items.length} item${items.length > 1 ? "s" : ""} registered — ${outboundNo} (${location === "available" ? "Available" : "Disposal"})`,
    })
  }

  // Bulk update item dispositions
  const handleBulkDisposition = (items: { orderId: string; itemId: string }[], disposition: ItemDisposition) => {
    setOrders((prev) =>
      prev.map((order) => {
        const matchingItems = items.filter((i) => i.orderId === order.id)
        if (matchingItems.length === 0) return order
        return {
          ...order,
          items: order.items.map((item) =>
            matchingItems.some((i) => i.itemId === item.id)
              ? { ...item, disposition }
              : item
          ),
        }
      })
    )
    toast.success("Stock Disposition Updated", {
      description: `${items.length} item${items.length > 1 ? "s" : ""} assigned to ${disposition === "store" ? "Store" : "Warehouse"}.`,
    })
  }

  // Update single item grading (from refund modal)
  const handleItemGrading = (orderId: string, itemId: string, grading: ReturnGrading) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              items: order.items.map((item) =>
                item.id === itemId ? { ...item, grading } : item
              ),
            }
          : order
      )
    )
    setSelectedOrder((prev) =>
      prev && prev.id === orderId
        ? {
            ...prev,
            items: prev.items.map((item) =>
              item.id === itemId ? { ...item, grading } : item
            ),
          }
        : prev
    )
  }

  // Update single item disposition (from modal)
  const handleItemDisposition = (orderId: string, itemId: string, disposition: ItemDisposition) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              items: order.items.map((item) =>
                item.id === itemId ? { ...item, disposition } : item
              ),
            }
          : order
      )
    )
    // Update selectedOrder for immediate UI feedback
    setSelectedOrder((prev) =>
      prev && prev.id === orderId
        ? {
            ...prev,
            items: prev.items.map((item) =>
              item.id === itemId ? { ...item, disposition } : item
            ),
          }
        : prev
    )
    toast.success("Stock Disposition Updated", {
      description: `Item assigned to ${disposition === "store" ? "Store" : "Warehouse"}.`,
    })
  }

  const handleUpdateInventory = async (orderId: string, location: InventoryLocation) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, inventoryLocation: location }
          : order
      )
    )
    // Update selected order for immediate UI feedback
    setSelectedOrder((prev) => prev && prev.id === orderId ? { ...prev, inventoryLocation: location } : prev)
    toast.success("Inventory Assigned", {
      description: `Inventory assigned to ${location === "store" ? "Store" : "Omni Warehouse"}.`,
    })
  }

  // Update refund grading + inventory
  const handleUpdateRefund = async (orderId: string, grading: ReturnGrading, location: InventoryLocation) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, returnGrading: grading, inventoryLocation: location }
          : order
      )
    )
    setSelectedOrder((prev) => prev && prev.id === orderId ? { ...prev, returnGrading: grading, inventoryLocation: location } : prev)
    toast.success("Return Processed", {
      description: `Grading: ${grading}, Inventory: ${location === "store" ? "Store" : "Omni Warehouse"}.`,
    })
  }

  // Search return
  const handleSearchReturn = async (qrCode: string): Promise<ReturnRequest | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockReturnRequests[qrCode] || null
  }

  // Process return (without inventory/grading - that's done in refund tab)
  const handleProcessReturn = async (returnRequest: ReturnRequest, itemGradings: Record<string, ReturnGrading>) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    setOrders((prev) =>
      prev.map((order) =>
        order.id === returnRequest.orderId
          ? {
              ...order,
              status: "returned" as const,
              returnedAt: new Date().toISOString(),
              items: order.items.map((item) =>
                itemGradings[item.id]
                  ? { ...item, grading: itemGradings[item.id] }
                  : item
              ),
            }
          : order
      )
    )
    toast.success("Return Processed", {
      description: "Return processed with grading applied.",
    })
  }

  // Download Excel
  const handleDownload = () => {
    const statusLabels: Record<PickupStatus, string> = {
      waiting: "Waiting for Arrival",
      ready: "Pickup Available",
      completed: "Completed",
    }

    const dispositionLabels: Record<string, string> = {
      store: "Store Sales",
      warehouse: "Return W.H",
    }

    const gradingLabels: Record<string, string> = {
      sellable: "Sellable",
      resellable: "Resellable",
      dispose: "Dispose",
    }

    const formatDT = (dateStr: string | undefined) => {
      if (!dateStr) return "-"
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return `${format(d, "yyyy-MM-dd HH:mm")} (PST)`
    }

    const formatD = (dateStr: string | undefined) => {
      if (!dateStr) return "-"
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return format(d, "yyyy-MM-dd")
    }

    let rows: Record<string, unknown>[] = []
    let sheetName = "Store Pickup List"
    let fileName = "Store_Pickup_List"

    if (pickupSubTab === "pickup") {
      rows = filteredOrders.flatMap((order) =>
        order.items.map((item) => ({
          "Order Date": formatDT(order.orderDate),
          "Pickup Date": formatD(order.pickupDate),
          "Outbound Date": formatDT(order.outboundDate),
          "Inbound Date": formatDT(order.inboundDate),
          "Order No.": order.orderNumber,
          "Pickup Status": statusLabels[order.pickupStatus],
          "Product Code": item.sku,
          "Product Name": item.productName,
          "Barcode": item.barcode || "-",
          "Qty": item.quantity,
          "Completed Date": formatDT(order.completedAt),
        }))
      )
      sheetName = "Pickup List"
      fileName = "Pickup_List"
    } else if (pickupSubTab === "cancel") {
      rows = filteredOrders.flatMap((order) =>
        order.items.map((item) => ({
          "Order Date": formatDT(order.orderDate),
          "Cancel Date": formatDT(order.cancelledAt),
          "Stock Disposition": item.disposition ? dispositionLabels[item.disposition] || "-" : "-",
          "Order No.": order.orderNumber,
          "Product Code": item.sku,
          "Product Name": item.productName,
          "Barcode": item.barcode || "-",
          "Qty": item.quantity,
          "Cancel Reason": order.cancelReason || order.notes || "-",
        }))
      )
      sheetName = "Cancel List"
      fileName = "Cancel_List"
    } else if (pickupSubTab === "refund") {
      rows = filteredOrders.flatMap((order) =>
        order.items.map((item) => ({
          "Order Date": formatDT(order.orderDate),
          "Refund Date": formatDT(order.returnedAt),
          "Stock Disposition": item.disposition ? dispositionLabels[item.disposition] || "-" : "-",
          "Order No.": order.orderNumber,
          "Product Code": item.sku,
          "Product Name": item.productName,
          "Barcode": item.barcode || "-",
          "Qty": item.quantity,
          "Grading": item.grading ? gradingLabels[item.grading] || "-" : "-",
          "I/V No.(TO)": item.outboundNo || "-",
        }))
      )
      sheetName = "Refund List"
      fileName = "Refund_List"
    }

    if (rows.length === 0) return

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String((r as Record<string, unknown>)[key] ?? "").length)) + 2,
    }))
    ws["!cols"] = colWidths

    XLSX.writeFile(wb, `${fileName}_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`)
  }

  return (
    <>
      <main className="p-6">
            {/* Page Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Store Pickup List</h2>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage online preorder pickup orders from your store.
              </p>
            </div>

            {/* Search Card */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-6">
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
                hidePickupStatus={pickupSubTab !== "pickup"}
                onSearch={handleSearch}
                dispositionFilter={dispositionFilter}
                onDispositionFilterChange={setDispositionFilter}
                showDispositionFilter={pickupSubTab === "cancel" || pickupSubTab === "refund"}
                dateTypeOptions={
                  pickupSubTab === "cancel"
                    ? [
                        { value: "cancelled", label: "Cancel Date" },
                        { value: "order", label: "Order Date" },
                        { value: "inbound", label: "Inbound Date" },
                      ]
                    : pickupSubTab === "refund"
                      ? [
                          { value: "returned", label: "Refund Date" },
                          { value: "order", label: "Order Date" },
                        ]
                      : undefined
                }
              />

              {/* QR Scan - only for pickup tab */}
              {pickupSubTab === "pickup" && (
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
              )}
            </div>

            {/* Sub-Tab Navigation */}
            <div className="flex gap-1 border-b border-border mt-6">
              <button
                type="button"
                onClick={() => handleSubTabChange("pickup")}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                  pickupSubTab === "pickup"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Package className="h-4 w-4" />
                Pickup
              </button>
              <button
                type="button"
                onClick={() => handleSubTabChange("cancel")}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                  pickupSubTab === "cancel"
                    ? "border-rose-500 text-rose-500"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Ban className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubTabChange("refund")}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                  pickupSubTab === "refund"
                    ? "border-rose-500 text-rose-500"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <CornerDownLeft className="h-4 w-4" />
                Refund
              </button>
            </div>

            {/* List Card */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-6">
              {/* Results count and actions */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground">
                  Total <span className="font-bold text-primary">{filteredOrders.length}</span> Count
                </p>
                <div className="flex items-center gap-2">
                  {pickupSubTab === "pickup" && (
                    <Button
                      variant="outline"
                      onClick={() => setIsReturnOpen(true)}
                      className="gap-2 bg-rose-500 hover:bg-rose-600 text-white border-rose-500"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Return Processing
                    </Button>
                  )}
                  {pickupSubTab === "cancel" && (
                    <>
                      <Button
                        variant="outline"
                        disabled={selectedListItems.size === 0 || !hasSelectedPending}
                        onClick={() => setIsChangeStockOpen(true)}
                        className="gap-2 bg-secondary border-border text-foreground hover:bg-muted hover:text-primary"
                      >
                        <Package className="h-4 w-4" />
                        Change Stock
                      </Button>
                      <Button
                        variant="outline"
                        disabled={selectedListItems.size === 0 || hasSelectedPending || hasSelectedStoreSales}
                        onClick={() => setIsOutboundOpen(true)}
                        className="gap-2 bg-secondary border-border text-foreground hover:bg-muted hover:text-primary"
                      >
                        <Warehouse className="h-4 w-4" />
                        Outbound Registration
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleDownload}
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
                variant={pickupSubTab}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
                onBulkDisposition={handleBulkDisposition}
                selectedItems={selectedListItems}
                onSelectedItemsChange={setSelectedListItems}
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

      {/* Store Pickup Modals */}
      <OrderDetailModal
        order={selectedOrder}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        tabContext={pickupSubTab}
        onPickupComplete={async (order) => {
          await handlePickupComplete(order.id)
          setIsDetailOpen(false)
        }}
        onCancelOrder={handleCancel}
        onReturn={() => {
          setIsDetailOpen(false)
          setIsReturnOpen(true)
        }}
        onUpdateInventory={handleUpdateInventory}
        onUpdateRefund={handleUpdateRefund}
        onItemDisposition={handleItemDisposition}
        onItemGrading={handleItemGrading}
      />

      <ReturnModal
        open={isReturnOpen}
        onOpenChange={setIsReturnOpen}
        onSearch={handleSearchReturn}
        onConfirm={handleProcessReturn}
      />

      <OutboundModal
        open={isOutboundOpen}
        onOpenChange={setIsOutboundOpen}
        items={getSelectedOutboundItems()}
        onConfirm={handleOutboundConfirm}
      />

      {/* Change Stock Modal */}
      <Dialog open={isChangeStockOpen} onOpenChange={setIsChangeStockOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Stock</DialogTitle>
            <DialogDescription>
              Select where to assign the {selectedListItems.size} selected item{selectedListItems.size > 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 h-12 text-base gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                handleChangeStock("store")
                setIsChangeStockOpen(false)
              }}
            >
              <Store className="h-5 w-5" />
              Store Sales
            </Button>
            <Button
              className="flex-1 h-12 text-base gap-2 bg-violet-600 hover:bg-violet-700"
              onClick={() => {
                handleChangeStock("warehouse")
                setIsChangeStockOpen(false)
              }}
            >
              <Warehouse className="h-5 w-5" />
              Return W.H
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
