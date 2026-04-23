"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import type { PickupOrder, PickupStatus, ItemDisposition } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Info, ArrowUp, ArrowDown, ArrowUpDown, Store, Warehouse, Package } from "lucide-react"

function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${format(d, "yyyy-MM-dd HH:mm")} (PST)`
}

function formatDateOnly(dateStr: string | undefined): string {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return format(d, "yyyy-MM-dd")
}

export type TableVariant = "pickup" | "cancel" | "refund"

interface OrderTableProps {
  orders: PickupOrder[]
  onViewDetail: (order: PickupOrder) => void
  variant?: TableVariant
  sortKey?: string
  sortDirection?: "asc" | "desc"
  onSort?: (key: string) => void
  onBulkDisposition?: (items: { orderId: string; itemId: string }[], disposition: ItemDisposition) => void
  selectedItems?: Set<string>
  onSelectedItemsChange?: (items: Set<string>) => void
}

function SortIcon({ columnKey, sortKey, sortDirection }: { columnKey: string; sortKey?: string; sortDirection?: "asc" | "desc" }) {
  if (sortKey !== columnKey) {
    return <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
  }
  return sortDirection === "asc"
    ? <ArrowUp className="h-3 w-3 text-primary" />
    : <ArrowDown className="h-3 w-3 text-primary" />
}

function SortableHead({
  children,
  columnKey,
  sortKey,
  sortDirection,
  onSort,
  className,
}: {
  children: React.ReactNode
  columnKey: string
  sortKey?: string
  sortDirection?: "asc" | "desc"
  onSort?: (key: string) => void
  className?: string
}) {
  return (
    <TableHead
      className={cn("font-semibold text-foreground text-center h-14 cursor-pointer select-none hover:bg-secondary/80 transition-colors", className)}
      onClick={() => onSort?.(columnKey)}
    >
      <div className="flex items-center justify-center gap-1">
        {children}
        <SortIcon columnKey={columnKey} sortKey={sortKey} sortDirection={sortDirection} />
      </div>
    </TableHead>
  )
}

function StatusBadge({ status }: { status: PickupStatus }) {
  const config: Record<PickupStatus, { label: string; className: string }> = {
    waiting: {
      label: "Waiting for Arrival",
      className: "bg-zinc-100 text-zinc-500 border-zinc-200",
    },
    ready: {
      label: "Pickup Available",
      className: "bg-sky-50 text-sky-600 border-sky-200",
    },
    completed: {
      label: "Completed",
      className: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
  }

  const { label, className } = config[status]

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap",
        className
      )}
    >
      {label}
    </span>
  )
}

function DispositionBadge({ disposition, variant }: { disposition?: ItemDisposition; variant?: TableVariant }) {
  if (!disposition) {
    return <span className="text-sm text-muted-foreground">-</span>
  }
  if (disposition === "store") {
    return (
      <span className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap bg-blue-50 text-blue-600 border-blue-200">
        Store Sales
      </span>
    )
  }
  return (
    <span className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap bg-violet-50 text-violet-600 border-violet-200">
      {variant === "refund" ? "Return W.H Disposal" : "Return W.H"}
    </span>
  )
}

const GRADING_CONFIG: Record<string, { label: string; className: string }> = {
  sellable: { label: "Sellable", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  resellable: { label: "Resellable", className: "bg-sky-50 text-sky-600 border-sky-200" },
  dispose: { label: "Dispose", className: "bg-rose-50 text-rose-500 border-rose-200" },
}

function GradingBadge({ order }: { order: PickupOrder }) {
  // Show item-level gradings
  const gradings = order.items.map((item) => item.grading).filter(Boolean)
  if (gradings.length === 0) {
    return <span className="text-sm text-muted-foreground">-</span>
  }
  const unique = [...new Set(gradings)]
  if (unique.length === 1) {
    const config = GRADING_CONFIG[unique[0]!]
    if (!config) return <span className="text-sm text-muted-foreground">-</span>
    return (
      <span className={cn("inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap", config.className)}>
        {config.label}
      </span>
    )
  }
  // Multiple different gradings
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {unique.map((g) => {
        const config = GRADING_CONFIG[g!]
        if (!config) return null
        return (
          <span key={g} className={cn("inline-flex items-center justify-center px-2 py-1 text-[10px] font-medium rounded-md border whitespace-nowrap", config.className)}>
            {config.label}
          </span>
        )
      })}
    </div>
  )
}

export function OrderTable({
  orders,
  onViewDetail,
  variant = "pickup",
  sortKey,
  sortDirection,
  onSort,
  onBulkDisposition,
  selectedItems: externalSelectedItems,
  onSelectedItemsChange,
}: OrderTableProps) {
  const [internalSelectedItems, setInternalSelectedItems] = useState<Set<string>>(new Set())
  const selectedItems = externalSelectedItems ?? internalSelectedItems
  const setSelectedItems = onSelectedItemsChange ?? setInternalSelectedItems

  // Flatten cancelled orders into item rows
  const cancelItemRows = variant === "cancel" ? orders.flatMap((order) =>
    order.items.map((item) => ({
      order,
      item,
      key: `${order.id}-${item.id}`,
    }))
  ) : []

  // Determine the disposition type of the current selection (null = no disposition, "store", "warehouse")
  const selectedDispositionType: ItemDisposition | "mixed" | undefined = (() => {
    if (selectedItems.size === 0) return undefined
    let type: ItemDisposition | undefined
    for (const row of cancelItemRows) {
      if (!selectedItems.has(row.key)) continue
      const d = row.item.disposition ?? null
      if (type === undefined) { type = d; continue }
      if (type !== d) return "mixed"
    }
    return type
  })()

  // Items are selectable only if they match the first selected item's disposition type
  // Store Sales items and items with outboundNo are never selectable
  const isItemSelectable = (row: typeof cancelItemRows[0]) => {
    if (row.item.disposition === "store") return false
    if (row.item.outboundNo) return false
    if (selectedItems.size === 0) return true
    if (selectedDispositionType === "mixed") return false
    const d = row.item.disposition ?? null
    return d === selectedDispositionType
  }

  const selectableRows = cancelItemRows.filter(isItemSelectable)
  const allSelectableSelected = selectableRows.length > 0 && selectableRows.every((r) => selectedItems.has(r.key))

  const toggleItem = (key: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleAll = () => {
    if (allSelectableSelected) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(selectableRows.map((r) => r.key)))
    }
  }

  const handleBulk = (disposition: ItemDisposition) => {
    if (!onBulkDisposition || selectedItems.size === 0) return
    const items = cancelItemRows
      .filter((r) => selectedItems.has(r.key))
      .map((r) => ({ orderId: r.order.id, itemId: r.item.id }))
    onBulkDisposition(items, disposition)
    setSelectedItems(new Set())
  }

  if (variant === "cancel") {
    return (
      <div className="space-y-3">
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-b border-border">
                <TableHead className="w-10 text-center h-14">
                  <Checkbox
                    checked={allSelectableSelected && selectableRows.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <SortableHead columnKey="orderDate" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Order Date</SortableHead>
                <SortableHead columnKey="cancelledAt" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Cancel Date</SortableHead>
                <SortableHead columnKey="inboundDate" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Inbound Date</SortableHead>
                <TableHead className="font-semibold text-foreground text-center h-14">Stock Disposition</TableHead>
                <TableHead className="font-semibold text-foreground text-center h-14">Outbound I/V No.</TableHead>
                <SortableHead columnKey="orderNumber" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Order No.</SortableHead>
                <TableHead className="font-semibold text-foreground h-14">Product Info</TableHead>
                <TableHead className="font-semibold text-foreground text-center h-14">Qty</TableHead>
                <SortableHead columnKey="cancelReason" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Cancel Reason</SortableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cancelItemRows.map(({ order, item, key }) => {
                return (
                  <TableRow
                    key={key}
                    className="hover:bg-secondary/30 border-b border-border"
                  >
                    <TableCell className="text-center py-4">
                      <Checkbox
                        checked={selectedItems.has(key)}
                        onCheckedChange={() => toggleItem(key)}
                        disabled={!isItemSelectable({ order, item, key })}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                      {formatDateTime(order.orderDate)}
                    </TableCell>
                    <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                      {formatDateTime(order.cancelledAt)}
                    </TableCell>
                    <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                      {formatDateTime(order.inboundDate)}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <DispositionBadge disposition={item.disposition} />
                    </TableCell>
                    <TableCell className="text-sm text-center font-mono py-4">
                      {item.outboundNo || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-center font-mono py-4">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell className="text-sm py-4">
                      {item.sku} / {item.productName} / {item.barcode || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-center py-4">{item.quantity}</TableCell>
                    <TableCell className="text-sm text-center py-4">
                      {order.cancelReason || order.notes || "-"}
                    </TableCell>
                  </TableRow>
                )
              })}
              {cancelItemRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    No cancelled orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Flatten refund orders into item rows
  const refundItemRows = variant === "refund" ? orders.flatMap((order) =>
    order.items.map((item) => ({
      order,
      item,
      key: `${order.id}-${item.id}`,
    }))
  ) : []

  // Refund tab selection logic (same pattern as cancel)
  const refundPendingItems = refundItemRows.filter((r) => !r.item.disposition)
  const refundSelectedDispositionType: ItemDisposition | "mixed" | undefined = (() => {
    if (selectedItems.size === 0 || variant !== "refund") return undefined
    let type: ItemDisposition | undefined
    for (const row of refundItemRows) {
      if (!selectedItems.has(row.key)) continue
      const d = row.item.disposition ?? null
      if (type === undefined) { type = d; continue }
      if (type !== d) return "mixed"
    }
    return type
  })()

  const isRefundItemSelectable = (row: typeof refundItemRows[0]) => {
    if (row.item.disposition === "store") return false
    if (row.item.outboundNo) return false
    if (selectedItems.size === 0 || variant !== "refund") return true
    if (refundSelectedDispositionType === "mixed") return false
    const d = row.item.disposition ?? null
    return d === refundSelectedDispositionType
  }

  const refundSelectableRows = refundItemRows.filter(isRefundItemSelectable)
  const allRefundSelectableSelected = refundSelectableRows.length > 0 && refundSelectableRows.every((r) => selectedItems.has(r.key))

  const toggleAllRefund = () => {
    if (allRefundSelectableSelected) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(refundSelectableRows.map((r) => r.key)))
    }
  }

  if (variant === "refund") {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-b border-border">
              <SortableHead columnKey="orderDate" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Order Date</SortableHead>
              <SortableHead columnKey="returnedAt" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Refund Date</SortableHead>
              <TableHead className="font-semibold text-foreground text-center h-14">Stock Disposition</TableHead>
              <SortableHead columnKey="orderNumber" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Order No.</SortableHead>
              <TableHead className="font-semibold text-foreground h-14">Product Info</TableHead>
              <TableHead className="font-semibold text-foreground text-center h-14">Qty</TableHead>
              <TableHead className="font-semibold text-foreground text-center h-14 min-w-[100px]">Grading</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {refundItemRows.map(({ order, item, key }) => {
              const gradeConfig = item.grading ? GRADING_CONFIG[item.grading] : null
              return (
                <TableRow
                  key={key}
                  className="hover:bg-secondary/30 border-b border-border"
                >
                  <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                    {formatDateTime(order.orderDate)}
                  </TableCell>
                  <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                    {formatDateTime(order.returnedAt)}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <DispositionBadge disposition={item.disposition} variant="refund" />
                  </TableCell>
                  <TableCell className="text-sm text-center font-mono py-4">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell className="text-sm py-4">
                    {item.sku} / {item.productName} / {item.barcode || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-center py-4">{item.quantity}</TableCell>
                  <TableCell className="text-center py-4">
                    {gradeConfig ? (
                      <span className={cn("inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap", gradeConfig.className)}>
                        {gradeConfig.label}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {refundItemRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No refunded orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Default: pickup variant
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-b border-border">
            <SortableHead columnKey="orderDate" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Order Date</SortableHead>
            <TableHead
              className="font-semibold text-foreground text-center h-14 cursor-pointer select-none hover:bg-secondary/80 transition-colors"
              onClick={() => onSort?.("pickupDate")}
            >
              <div className="flex items-center justify-center gap-1">
                Pickup Date
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-left">
                    Available for pickup within +14 days from the Pickup Date after inbound is completed. Auto-cancelled on day +15.
                  </TooltipContent>
                </Tooltip>
                <SortIcon columnKey="pickupDate" sortKey={sortKey} sortDirection={sortDirection} />
              </div>
            </TableHead>
            <SortableHead columnKey="outboundDate" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Outbound Date</SortableHead>
            <TableHead
              className="font-semibold text-foreground text-center h-14 cursor-pointer select-none hover:bg-secondary/80 transition-colors"
              onClick={() => onSort?.("inboundDate")}
            >
              <div className="flex items-center justify-center gap-1">
                Inbound Date
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-left">
                    If Pickup Date is exceeded, available for pickup within +14 days from the Inbound Date. Auto-cancelled on day +15.
                  </TooltipContent>
                </Tooltip>
                <SortIcon columnKey="inboundDate" sortKey={sortKey} sortDirection={sortDirection} />
              </div>
            </TableHead>
            <SortableHead columnKey="outboundIvNo" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Inbound I/V No.</SortableHead>
            <SortableHead columnKey="orderNumber" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Order No.</SortableHead>
            <TableHead className="font-semibold text-foreground text-center h-14">Pickup Status</TableHead>
            <TableHead className="font-semibold text-foreground h-14">Product Info</TableHead>
            <TableHead className="font-semibold text-foreground text-center h-14">Qty</TableHead>
            <SortableHead columnKey="completedAt" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Completed Date</SortableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const pickupWarning = !order.inboundDate && order.pickupStatus === "waiting"
            const inboundWarning = order.inboundDate && order.pickupDate &&
              new Date(order.inboundDate) > new Date(order.pickupDate)

            return (
              <TableRow
                key={order.id}
                className="hover:bg-secondary/30 border-b border-border cursor-pointer"
                onClick={() => onViewDetail(order)}
              >
                <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                  {formatDateTime(order.orderDate)}
                </TableCell>
                <TableCell className={cn(
                  "text-sm text-center py-4 whitespace-nowrap",
                  pickupWarning && "bg-amber-50"
                )}>
                  <span className={cn(pickupWarning && "text-amber-600 font-semibold")}>
                    {formatDateOnly(order.pickupDate)}
                  </span>
                  {pickupWarning && (
                    <div className="text-[10px] text-amber-500 mt-0.5">No Inbound</div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                  {formatDateTime(order.outboundDate)}
                </TableCell>
                <TableCell className={cn(
                  "text-sm text-center py-4 whitespace-nowrap",
                  inboundWarning && "bg-rose-50"
                )}>
                  <span className={cn(inboundWarning && "text-rose-600 font-semibold")}>
                    {formatDateTime(order.inboundDate)}
                  </span>
                  {inboundWarning && (
                    <div className="text-[10px] text-rose-500 mt-0.5">After Pickup Date</div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-center font-mono py-4">
                  {order.outboundIvNo || "-"}
                </TableCell>
                <TableCell className="text-sm text-center font-mono py-4">
                  <span className="text-blue-600 underline underline-offset-2 hover:text-blue-800">
                    {order.orderNumber}
                  </span>
                </TableCell>
                <TableCell className="text-center py-4">
                  <StatusBadge status={order.pickupStatus} />
                </TableCell>
                <TableCell className="py-4">
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-sm">
                        {item.sku} / {item.productName} / {item.barcode || "-"}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center py-4">
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-sm">{item.quantity}</div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                  {formatDateTime(order.completedAt)}
                </TableCell>
              </TableRow>
            )
          })}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
