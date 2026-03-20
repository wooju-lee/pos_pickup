"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import type { PickupOrder, PickupStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

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
      label: "Pickup Completed",
      className: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-rose-50 text-rose-500 border-rose-200",
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
            <TableHead className="font-semibold text-foreground text-center h-14">Status</TableHead>
            <TableHead className="font-semibold text-foreground text-center h-14">Order No.</TableHead>
            <TableHead className="font-semibold text-foreground h-14">
              <div>Product Info</div>
              <div className="text-xs font-normal text-muted-foreground">(Code / Name / Barcode)</div>
            </TableHead>
            <TableHead className="font-semibold text-foreground text-center h-14">Qty</TableHead>
            <TableHead className="font-semibold text-foreground text-center h-14">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
              <TableRow
                key={order.id}
                className="hover:bg-secondary/30 border-b border-border"
              >
                <TableCell className="text-sm text-center py-4">
                  {order.orderDate}
                </TableCell>
                <TableCell className="text-sm text-center py-4">
                  {order.pickupDate}
                </TableCell>
                <TableCell className="text-sm text-center py-4">
                  {order.outboundDate}
                </TableCell>
                <TableCell className="text-sm text-center py-4">
                  {order.inboundDate || "-"}
                </TableCell>
                <TableCell className="text-center py-4">
                  <StatusBadge status={order.pickupStatus} />
                </TableCell>
                <TableCell className="text-sm text-center font-mono py-4">
                  {order.orderNumber}
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
                <TableCell className="text-center py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetail(order)}
                    className="gap-1.5 bg-secondary border-border text-foreground hover:bg-muted hover:text-primary"
                  >
                    <FileText className="h-4 w-4" />
                    Detail
                  </Button>
                </TableCell>
              </TableRow>
          ))}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
