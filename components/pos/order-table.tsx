"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import type { PickupOrder, PickupStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Info, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"

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

function InventoryBadge({ order }: { order: PickupOrder }) {
  if (!order.inventoryLocation) {
    return (
      <span className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap bg-amber-50 text-amber-600 border-amber-200">
        Pending
      </span>
    )
  }
  if (order.inventoryLocation === "store") {
    return (
      <span className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap bg-blue-50 text-blue-600 border-blue-200">
        Store
      </span>
    )
  }
  return (
    <span className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap bg-violet-50 text-violet-600 border-violet-200">
      Omni
    </span>
  )
}

function GradingBadge({ order }: { order: PickupOrder }) {
  if (!order.returnGrading) {
    return (
      <span className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap bg-amber-50 text-amber-600 border-amber-200">
        Pending
      </span>
    )
  }
  const gradeColors: Record<string, string> = {
    A: "bg-emerald-50 text-emerald-600 border-emerald-200",
    B: "bg-sky-50 text-sky-600 border-sky-200",
    C: "bg-amber-50 text-amber-600 border-amber-200",
    D: "bg-rose-50 text-rose-500 border-rose-200",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap",
        gradeColors[order.returnGrading]
      )}
    >
      Grade {order.returnGrading}
    </span>
  )
}

export function OrderTable({
  orders,
  onViewDetail,
  variant = "pickup",
  sortKey,
  sortDirection,
  onSort,
}: OrderTableProps) {
  if (variant === "cancel") {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-b border-border">
              <SortableHead columnKey="orderDate" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Order Date</SortableHead>
              <SortableHead columnKey="pickupDate" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Pickup Date</SortableHead>
              <SortableHead columnKey="cancelledAt" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Cancel Date</SortableHead>
              <SortableHead columnKey="orderNumber" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Order No.</SortableHead>
              <TableHead className="font-semibold text-foreground h-14">
                <div>Product Info</div>
                <div className="text-xs font-normal text-muted-foreground">(Code / Name / Qty)</div>
              </TableHead>
              <SortableHead columnKey="cancelReason" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Cancel Reason</SortableHead>
              <SortableHead columnKey="inventoryLocation" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Stock Disposition</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                className="hover:bg-secondary/30 border-b border-border cursor-pointer"
                onClick={() => onViewDetail(order)}
              >
                <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                  {formatDateTime(order.orderDate)}
                </TableCell>
                <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                  {formatDateOnly(order.pickupDate)}
                </TableCell>
                <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                  {formatDateTime(order.cancelledAt)}
                </TableCell>
                <TableCell className="text-sm text-center font-mono py-4">
                  <span className="text-blue-600 underline underline-offset-2 hover:text-blue-800">
                    {order.orderNumber}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-sm">
                        {item.sku} / {item.productName} / <span className="font-medium">{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-center py-4">
                  {order.cancelReason || order.notes || "-"}
                </TableCell>
                <TableCell className="text-center py-4">
                  <InventoryBadge order={order} />
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No cancelled orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (variant === "refund") {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-b border-border">
              <SortableHead columnKey="orderDate" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Order Date</SortableHead>
              <SortableHead columnKey="orderNumber" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Order No.</SortableHead>
              <TableHead className="font-semibold text-foreground text-center h-14">Customer</TableHead>
              <TableHead className="font-semibold text-foreground h-14">
                <div>Product Info</div>
                <div className="text-xs font-normal text-muted-foreground">(Code / Name)</div>
              </TableHead>
              <TableHead className="font-semibold text-foreground text-center h-14">Qty</TableHead>
              <SortableHead columnKey="returnedAt" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Return Date</SortableHead>
              <SortableHead columnKey="returnReason" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Return Reason</SortableHead>
              <SortableHead columnKey="returnGrading" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Grading</SortableHead>
              <SortableHead columnKey="inventoryLocation" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Stock Disposition</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                className="hover:bg-secondary/30 border-b border-border cursor-pointer"
                onClick={() => onViewDetail(order)}
              >
                <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                  {formatDateTime(order.orderDate)}
                </TableCell>
                <TableCell className="text-sm text-center font-mono py-4">
                  <span className="text-blue-600 underline underline-offset-2 hover:text-blue-800">
                    {order.orderNumber}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-center py-4">{order.customerName}</TableCell>
                <TableCell className="py-4">
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-sm">
                        {item.sku} / {item.productName}
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
                  {formatDateTime(order.returnedAt)}
                </TableCell>
                <TableCell className="text-sm text-center py-4">
                  {order.returnReason || "-"}
                </TableCell>
                <TableCell className="text-center py-4">
                  <GradingBadge order={order} />
                </TableCell>
                <TableCell className="text-center py-4">
                  <InventoryBadge order={order} />
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
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
            <SortableHead columnKey="outboundDate" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>
              <span className="flex flex-col items-center leading-tight">
                <span>Outbound Date</span>
                <span className="text-xs font-normal text-muted-foreground">(Registration)</span>
              </span>
            </SortableHead>
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
            <SortableHead columnKey="orderNumber" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Order No.</SortableHead>
            <TableHead className="font-semibold text-foreground text-center h-14">Pickup Status</TableHead>
            <TableHead className="font-semibold text-foreground h-14">
              <div>Product Info</div>
              <div className="text-xs font-normal text-muted-foreground">(Code / Name / Barcode / Qty)</div>
            </TableHead>
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
                        {item.sku} / {item.productName} / {item.barcode || "-"} / <span className="font-medium">{item.quantity}</span>
                      </div>
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
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
