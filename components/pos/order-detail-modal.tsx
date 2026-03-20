"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Order No.</span>
                <span className="text-sm font-mono font-medium">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Sequence No.</span>
                <span className="text-sm font-medium">{order.sequenceNumber}</span>
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
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Customer</span>
                <span className="text-sm font-medium">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Phone</span>
                <span className="text-sm">{order.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm">{order.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Payment</span>
                <span className="text-sm">{order.paymentMethod}</span>
              </div>
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
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-destructive">-{formatCurrency(order.discount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total Amount</span>
              <span className="text-primary">{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paid Amount</span>
              <span>{formatCurrency(order.paidAmount)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
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
