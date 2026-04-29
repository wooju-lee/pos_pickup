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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { PickupOrder, PickupStatus, InventoryLocation, ReturnGrading, ItemDisposition } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CheckCircle, XCircle, MapPin, Star, Package, Store, Warehouse } from "lucide-react"
import type { TableVariant } from "./order-table"

const CANCEL_REASONS = [
  { value: "change_of_mind", label: "Change of Mind" },
  { value: "fit_comfort", label: "Fit & Comfort Issue" },
  { value: "appearance", label: "Appearance Issue" },
  { value: "functional_defect", label: "Functional Defect" },
  { value: "order_mistake", label: "Order Mistake" },
  { value: "order_status", label: "Order Status Issue" },
  { value: "prescription_mismatch", label: "Prescription Mismatch" },
  { value: "etc", label: "ETC." },
]

interface OrderDetailModalProps {
  order: PickupOrder | null
  open: boolean
  onClose: () => void
  onPickupComplete: (order: PickupOrder) => void
  onCancelOrder?: (orderId: string, reason?: string) => Promise<void>
  onReturn: (order: PickupOrder) => void
  onUpdateInventory?: (orderId: string, location: InventoryLocation) => Promise<void>
  onUpdateRefund?: (orderId: string, grading: ReturnGrading, location: InventoryLocation) => Promise<void>
  onItemDisposition?: (orderId: string, itemId: string, disposition: ItemDisposition) => void
  onItemGrading?: (orderId: string, itemId: string, grading: ReturnGrading) => void
  tabContext?: TableVariant
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

function formatCurrency(amount: number): string {
  return `${new Intl.NumberFormat("en-US").format(amount)} USD`
}

const RETURN_GRADING_OPTIONS: { value: ReturnGrading; label: string; color: string }[] = [
  { value: "sellable", label: "Sellable", color: "bg-emerald-600" },
  { value: "resellable", label: "Resellable", color: "bg-sky-600" },
  { value: "dispose", label: "Dispose", color: "bg-rose-600" },
]

export function OrderDetailModal({
  order,
  open,
  onClose,
  onPickupComplete,
  onCancelOrder,
  onReturn,
  onUpdateInventory,
  onUpdateRefund,
  onItemDisposition,
  onItemGrading,
  tabContext = "pickup",
}: OrderDetailModalProps) {
  const [inventoryLocation, setInventoryLocation] = useState<InventoryLocation>("store")
  const [returnGrading, setReturnGrading] = useState<ReturnGrading | "">("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  if (!order) return null

  const canProcess = order.status === "pending" || order.status === "ready"
  const canPickup = canProcess && !!order.inboundDate
  const totalAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0)


  const handleSaveInventory = async () => {
    if (!onUpdateInventory) return
    setIsProcessing(true)
    try {
      await onUpdateInventory(order.id, inventoryLocation)
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveRefund = async () => {
    if (!onUpdateRefund || !returnGrading) return
    setIsProcessing(true)
    try {
      await onUpdateRefund(order.id, returnGrading as ReturnGrading, inventoryLocation)
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmCancel = async () => {
    if (!onCancelOrder) return
    setIsProcessing(true)
    try {
      const reasonText = CANCEL_REASONS.find(r => r.value === cancelReason)?.label
      await onCancelOrder(order.id, reasonText)
      setIsCancelling(false)
      setCancelReason("")
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setInventoryLocation("store")
      setReturnGrading("")
      setIsProcessing(false)
      setIsCancelling(false)
      setCancelReason("")
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg font-semibold">
              {tabContext === "cancel" ? "Cancelled Order Detail" : tabContext === "refund" ? "Refunded Order Detail" : "Order Detail"}
            </DialogTitle>
            {tabContext === "cancel" ? (
              <span className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap bg-rose-50 text-rose-500 border-rose-200">
                Cancelled
              </span>
            ) : tabContext === "refund" ? (
              <span className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap bg-amber-50 text-amber-600 border-amber-200">
                Refunded
              </span>
            ) : (
              <StatusBadge status={order.pickupStatus} />
            )}
          </div>
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
              <span className="text-sm">{order.pickupDate ? order.pickupDate.split(" ")[0] : "-"}</span>
            </div>
            {tabContext === "cancel" && order.cancelledAt && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cancel Date</span>
                <span className="text-sm text-rose-500">{new Date(order.cancelledAt).toLocaleString()}</span>
              </div>
            )}
            {tabContext === "cancel" && (order.cancelReason || order.notes) && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cancel Reason</span>
                <span className="text-sm">{order.cancelReason || order.notes}</span>
              </div>
            )}
            {tabContext === "refund" && order.returnedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Return Date</span>
                <span className="text-sm text-amber-600">{new Date(order.returnedAt).toLocaleString()}</span>
              </div>
            )}
            {tabContext === "refund" && order.returnReason && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Return Reason</span>
                <span className="text-sm">{order.returnReason}</span>
              </div>
            )}
          </div>

          {/* Product List */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Product List</h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Product Code | Product Name</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
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
                      <TableCell className="text-center">{item.quantity}</TableCell>
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
            <p className="text-xs text-blue-500 mt-2">Total amount includes product price and VAT.</p>
          </div>

          {/* === PICKUP TAB: Action Buttons === */}
          {tabContext === "pickup" && canProcess && !isCancelling && (
            <div className="space-y-2 pt-4">
              <div className="flex justify-end gap-4">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsCancelling(true)}
                  disabled={isProcessing}
                  className="gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    if (isProcessing) return
                    setIsProcessing(true)
                    try {
                      await onPickupComplete(order)
                    } finally {
                      setIsProcessing(false)
                    }
                  }}
                  disabled={!canPickup || isProcessing}
                  className="gap-1.5"
                >
                  {isProcessing ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Pickup
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* === PICKUP TAB: Inline Cancel Flow === */}
          {tabContext === "pickup" && isCancelling && (
            <div className="space-y-4 pt-2">
              <Separator />
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-semibold text-destructive">
                  <XCircle className="h-4 w-4" />
                  Cancel Reason
                </Label>
                <Select value={cancelReason} onValueChange={setCancelReason}>
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
              </div>
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleConfirmCancel}
                  disabled={isProcessing || !cancelReason}
                  className="gap-2 h-12 px-8 text-base"
                >
                  {isProcessing ? (
                    <>
                      <Spinner className="h-5 w-5" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" />
                      Cancel
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* === CANCEL TAB: Item-level Stock Disposition === */}
          {tabContext === "cancel" && (
            <div className="space-y-4 pt-2">
              <Separator />
              <Label className="flex items-center gap-2 text-base font-semibold">
                <MapPin className="h-4 w-4" />
                Stock Disposition
              </Label>
              <p className="text-sm text-muted-foreground">
                Assign each item to Store or Warehouse (W.H).
              </p>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-center">Disposition</TableHead>
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
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant={item.disposition === "store" ? "default" : "outline"}
                              onClick={() => onItemDisposition?.(order.id, item.id, "store")}
                              className={cn("gap-1 h-8 px-3 text-xs", item.disposition === "store" && "bg-blue-600 hover:bg-blue-700")}
                            >
                              <Store className="h-3 w-3" />
                              Store
                            </Button>
                            <Button
                              size="sm"
                              variant={item.disposition === "warehouse" ? "default" : "outline"}
                              onClick={() => onItemDisposition?.(order.id, item.id, "warehouse")}
                              className={cn("gap-1 h-8 px-3 text-xs", item.disposition === "warehouse" && "bg-violet-600 hover:bg-violet-700")}
                            >
                              <Warehouse className="h-3 w-3" />
                              W.H
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* === REFUND TAB: Grading Summary (read-only) === */}
          {tabContext === "refund" && (
            <div className="space-y-4 pt-2">
              <Separator />
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Star className="h-4 w-4" />
                Return Grading
              </Label>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-center">Grading</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => {
                      const gradeOption = RETURN_GRADING_OPTIONS.find((g) => g.value === item.grading)
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm">
                            <span className="font-mono">{item.sku}</span>
                            <span className="text-muted-foreground mx-1.5">|</span>
                            {item.productName}
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-center">
                            {gradeOption ? (
                              <span className={cn(
                                "inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold text-white",
                                gradeOption.color
                              )}>
                                {gradeOption.label}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
