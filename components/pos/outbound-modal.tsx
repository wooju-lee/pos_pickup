"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PickupOrder, OrderItem, OutboundLocation } from "@/lib/types"
import { Warehouse, MapPin } from "lucide-react"

interface OutboundItem {
  order: PickupOrder
  item: OrderItem
}

interface OutboundModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: OutboundItem[]
  onConfirm: (items: { orderId: string; itemId: string }[], location: OutboundLocation) => Promise<void>
}

export function OutboundModal({
  open,
  onOpenChange,
  items,
  onConfirm,
}: OutboundModalProps) {
  const [location, setLocation] = useState<OutboundLocation | "">("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    if (!location || isProcessing) return
    setIsProcessing(true)
    try {
      await onConfirm(
        items.map((i) => ({ orderId: i.order.id, itemId: i.item.id })),
        location as OutboundLocation
      )
      handleClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setLocation("")
  }

  const totalQty = items.reduce((sum, i) => sum + i.item.quantity, 0)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-violet-600" />
            Outbound Registration
          </DialogTitle>
          <DialogDescription>
            Register outbound for the selected items to the online warehouse.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Fixed Store Info */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">From Store</span>
              <span className="text-sm font-medium"><span className="text-primary font-bold">CA1001</span> / GM_TORONTO_MALL_YORKDALE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">To Store</span>
              <span className="text-sm font-medium">CA Online W.H</span>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Outbound Items ({items.length} items, {totalQty} qty)</h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Order No.</TableHead>
                    <TableHead>Product Info</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((i) => (
                    <TableRow key={`${i.order.id}-${i.item.id}`}>
                      <TableCell className="text-sm font-mono">{i.order.orderNumber}</TableCell>
                      <TableCell className="text-sm">{i.item.sku} / {i.item.productName} / {i.item.barcode || "-"}</TableCell>
                      <TableCell className="text-sm text-center">{i.item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          {/* Online Location Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="h-4 w-4" />
              Online Location
            </Label>
            <p className="text-sm text-muted-foreground">
              Select the online warehouse location for this outbound.
            </p>
            <RadioGroup
              value={location}
              onValueChange={(v) => setLocation(v as OutboundLocation)}
              className="space-y-2"
            >
              <label
                htmlFor="ob_available"
                className="flex items-center space-x-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem value="available" id="ob_available" />
                <div className="flex-1">
                  <p className="font-medium">Available</p>
                  <p className="text-sm text-muted-foreground">Sellable inventory — available for online sales</p>
                </div>
              </label>
              <label
                htmlFor="ob_disposal"
                className="flex items-center space-x-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem value="disposal" id="ob_disposal" />
                <div className="flex-1">
                  <p className="font-medium">Disposal</p>
                  <p className="text-sm text-muted-foreground">Non-sellable inventory — for disposal processing</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Confirm */}
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleConfirm}
              disabled={isProcessing || !location}
              className="h-12 px-8 text-base gap-2"
            >
              {isProcessing ? (
                <>
                  <Spinner className="h-5 w-5" />
                  Processing...
                </>
              ) : (
                <>
                  <Warehouse className="h-5 w-5" />
                  Register Outbound
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
