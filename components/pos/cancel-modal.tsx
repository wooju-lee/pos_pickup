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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import type { PickupOrder, InventoryLocation } from "@/lib/types"
import { XCircle, Package, MapPin } from "lucide-react"

interface CancelModalProps {
  order: PickupOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (orderId: string, location: InventoryLocation, reason?: string) => Promise<void>
}

export function CancelModal({
  order,
  open,
  onOpenChange,
  onConfirm,
}: CancelModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [location, setLocation] = useState<InventoryLocation>("store_sales")

  if (!order) return null

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm(order.id, location)
      onOpenChange(false)
      setLocation("store_sales")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-left">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Cancel Order
          </DialogTitle>
          <DialogDescription>
            Cancel the order and process a refund. Please select the inventory location.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Info */}
          <div className="p-4 rounded-lg bg-secondary/30 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order No.</span>
              <span className="font-mono text-primary">{order.orderNumber}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Cancel Items</p>
              <div className="rounded border border-border overflow-hidden">
                <div className="grid grid-cols-[1fr_auto] gap-4 px-3 py-1.5 bg-secondary/50 text-xs font-medium text-muted-foreground">
                  <span>Product (Code / Name)</span>
                  <span className="text-center">Qty</span>
                </div>
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_auto] gap-4 px-3 py-1.5 text-sm border-t border-border"
                  >
                    <span>{item.sku} / {item.productName}</span>
                    <span className="text-center">{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory Location */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Inventory Location
            </Label>
            <RadioGroup
              value={location}
              onValueChange={(value) => setLocation(value as InventoryLocation)}
              className="space-y-2"
            >
              <label
                htmlFor="store_sales"
                className="flex items-center space-x-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem value="store_sales" id="store_sales" />
                <div className="flex-1">
                  <p className="font-medium">Add to Store Inventory</p>
                  <p className="text-sm text-muted-foreground">
                    Add inventory to Store Sales location
                  </p>
                </div>
                <Package className="h-5 w-5 text-muted-foreground" />
              </label>
              <label
                htmlFor="store_online"
                className="flex items-center space-x-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem value="store_online" id="store_online" />
                <div className="flex-1">
                  <p className="font-medium">Return to Online</p>
                  <p className="text-sm text-muted-foreground">
                    Process return to Store Online location
                  </p>
                </div>
                <Package className="h-5 w-5 text-muted-foreground" />
              </label>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
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
