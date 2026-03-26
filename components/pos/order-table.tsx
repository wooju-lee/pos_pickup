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

interface OrderTableProps {
  orders: PickupOrder[]
  onViewDetail: (order: PickupOrder) => void
}

function StatusBadge({ status }: { status: PickupStatus }) {
  const config: Record<PickupStatus, { label: string; className: string }> = {
    waiting: {
      label: "Waiting for Pickup",
      className: "bg-zinc-100 text-zinc-500 border-zinc-200",
    },
    ready: {
      label: "Ready for Pickup",
      className: "bg-sky-50 text-sky-600 border-sky-200",
    },
    completed: {
      label: "Completed",
      className: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-rose-50 text-rose-500 border-rose-200",
    },
    refunded: {
      label: "Refunded",
      className: "bg-amber-50 text-amber-600 border-amber-200",
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

export function OrderTable({
  orders,
  onViewDetail,
}: OrderTableProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-b border-border">
            <TableHead className="font-semibold text-foreground text-center h-14">Order Date</TableHead>
            <TableHead className="font-semibold text-foreground text-center h-14">Pickup Date</TableHead>
            <TableHead className="font-semibold text-foreground text-center h-14">
              <div>Outbound Date</div>
              <div className="text-xs font-normal text-muted-foreground">(Registration)</div>
            </TableHead>
            <TableHead className="font-semibold text-foreground text-center h-14">Inbound Date</TableHead>
            <TableHead className="font-semibold text-foreground text-center h-14">Pickup Status</TableHead>
            <TableHead className="font-semibold text-foreground text-center h-14">Order No.</TableHead>
            <TableHead className="font-semibold text-foreground h-14">
              <div>Product Info</div>
              <div className="text-xs font-normal text-muted-foreground">(Code / Name / Barcode)</div>
            </TableHead>
            <TableHead className="font-semibold text-foreground text-center h-14">Qty</TableHead>
            <TableHead className="font-semibold text-foreground text-center h-14">Pickup Completed Date</TableHead>
            <TableHead className="font-semibold text-foreground text-center h-14">Cancel Date</TableHead>
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
                  {formatDateTime(order.outboundDate)}
                </TableCell>
                <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                  {formatDateTime(order.inboundDate)}
                </TableCell>
                <TableCell className="text-center py-4">
                  <StatusBadge status={order.pickupStatus} />
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
                        {item.sku} / {item.productName} / {item.barcode || "-"}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center py-4">
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-sm">
                        {item.quantity}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                  {formatDateTime(order.completedAt)}
                </TableCell>
                <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                  {formatDateTime(order.cancelledAt)}
                </TableCell>
              </TableRow>
          ))}
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
