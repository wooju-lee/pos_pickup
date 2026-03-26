"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { PickupOrder } from "@/lib/types"
import { format } from "date-fns"
import { toast } from "sonner"
import { CheckCircle, Package, Printer } from "lucide-react"

interface PickupCompleteModalProps {
  order: PickupOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (orderId: string) => Promise<void>
}

function formatCurrency(amount: number): string {
  return `${new Intl.NumberFormat("en-US").format(amount)} USD`
}

export function PickupCompleteModal({
  order,
  open,
  onOpenChange,
  onConfirm,
}: PickupCompleteModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  if (!order) return null

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm(order.id)
      setIsCompleted(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSerialPrint = () => {
    toast.success("Serial Print", {
      description: `Serial card printed for order ${order.orderNumber}.`,
    })
    setIsCompleted(false)
    onOpenChange(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) setIsCompleted(false)
    onOpenChange(open)
  }

  const totalAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-3xl outline-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Pickup Complete
          </DialogTitle>
          <DialogDescription>
            Confirm the product handover and complete the pickup process.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Info */}
          <div className="p-4 rounded-lg bg-secondary/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order No.</span>
              <span className="font-mono font-bold text-lg text-primary">{order.orderNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order Date</span>
              <span className="text-sm">{order.orderDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pickup Date</span>
              <span className="text-sm">{format(new Date(order.pickupDate), "yyyy-MM-dd")}</span>
            </div>
          </div>

          {/* Product List */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product List
            </h4>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Product Code | Product Name</TableHead>
                    <TableHead className="text-xs text-center">Qty</TableHead>
                    <TableHead className="text-xs text-right">Unit Price</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">
                        <span className="font-mono">{item.sku}</span>
                        <span className="text-muted-foreground mx-1.5">|</span>
                        {item.productName}
                      </TableCell>
                      <TableCell className="text-sm text-center">{item.quantity}</TableCell>
                      <TableCell className="text-sm text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-sm text-right">{formatCurrency(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Total Amount */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Amount</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          {isCompleted ? (
            <Button onClick={handleSerialPrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Serial Print
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Pickup Complete
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
