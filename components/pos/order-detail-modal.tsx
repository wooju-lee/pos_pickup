"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PickupOrder } from "@/lib/types"
import { CheckCircle, XCircle, RotateCcw } from "lucide-react"

interface OrderDetailModalProps {
  order: PickupOrder | null
  open: boolean
  onClose: () => void
  onPickupComplete: (order: PickupOrder) => void
  onCancel: (order: PickupOrder) => void
  onReturn: (order: PickupOrder) => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount)
}

export function OrderDetailModal({
  order,
  open,
  onClose,
  onPickupComplete,
  onCancel,
  onReturn,
}: OrderDetailModalProps) {
  if (!order) return null

  const canProcess = order.status === "pending" || order.status === "ready"
  const canReturn = order.status === "completed"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">Order Detail</DialogTitle>
          <DialogDescription className="sr-only">
            주문 상세 정보 및 픽업/취소/반품 처리
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Order No.</span>
              <span className="text-sm font-mono font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Order Date</span>
              <span className="text-sm">{order.orderDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pickup Date</span>
              <span className="text-sm">{order.pickupDate}</span>
            </div>
          </div>

          {/* Product List */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Product List</h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Product Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            {canProcess && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => onCancel(order)}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Order
                </Button>
                <Button
                  onClick={() => onPickupComplete(order)}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Pickup Complete
                </Button>
              </>
            )}
            {canReturn && (
              <Button
                variant="outline"
                onClick={() => onReturn(order)}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Process Return
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
