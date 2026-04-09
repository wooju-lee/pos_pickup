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
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { PickupOrder } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { XCircle } from "lucide-react"

const CANCEL_REASONS = [
  { value: "customer_request", label: "Customer Request" },
  { value: "not_picked_up", label: "Not Picked Up (Expired)" },
  { value: "product_issue", label: "Product Issue / Defect" },
  { value: "wrong_order", label: "Wrong Order" },
  { value: "other", label: "Other" },
]

interface CancelModalProps {
  order: PickupOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (orderId: string, reason?: string) => Promise<void>
}

export function CancelModal({
  order,
  open,
  onOpenChange,
  onConfirm,
}: CancelModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [reason, setReason] = useState("")
  const [reasonDetail, setReasonDetail] = useState("")

  if (!order) return null

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      const reasonText = reason === "other" ? reasonDetail : CANCEL_REASONS.find(r => r.value === reason)?.label
      await onConfirm(order.id, reasonText)
      onOpenChange(false)
      setReason("")
      setReasonDetail("")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl text-left">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Cancel Order
          </DialogTitle>
          <DialogDescription>
            Cancel the order and process a refund. Inventory assignment can be done later from the Cancel tab.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-10">
          {/* Order Info */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary">Cancel Information</span>
            </div>
            <Separator />
            <div className="text-sm">
              <p className="text-muted-foreground text-xs">Order No.</p>
              <p className="font-mono font-medium">{order.orderNumber}</p>
            </div>
            {/* Cancel Items */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Cancel Items</p>
              <div className="rounded border border-border overflow-hidden">
                <div className="grid grid-cols-[1fr_60px] px-3 py-2 bg-secondary/50 text-xs font-medium text-muted-foreground">
                  <span>Product (Code / Name)</span>
                  <span className="text-center">Qty</span>
                </div>
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_60px] px-3 py-2 text-sm border-t border-border"
                  >
                    <span>{item.sku} / {item.productName}</span>
                    <span className="text-center">{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cancel Reason */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Cancel Reason
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full bg-secondary border-border text-foreground">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {CANCEL_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reason === "other" && (
              <Textarea
                placeholder="Please enter the reason for cancellation"
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
                rows={3}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !reason || (reason === "other" && !reasonDetail.trim())}
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel & Refund
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
