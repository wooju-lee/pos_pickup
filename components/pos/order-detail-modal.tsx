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
import type { PickupOrder, PickupStatus, InventoryLocation, ReturnGrading } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CheckCircle, XCircle, MapPin, Star, Package } from "lucide-react"
import type { TableVariant } from "./order-table"

const CANCEL_REASONS = [
  { value: "change_of_mind", label: "Change of Mind" },
  { value: "change_payment", label: "Change Payment Method" },
  { value: "change_product", label: "Purchase Different Product" },
  { value: "other", label: "Other" },
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

const RETURN_GRADING_OPTIONS: { value: ReturnGrading; label: string; description: string }[] = [
  { value: "A", label: "Grade A", description: "Like new — can be resold as-is" },
  { value: "B", label: "Grade B", description: "Minor signs of use — resellable at discount" },
  { value: "C", label: "Grade C", description: "Visible wear/damage — needs repair" },
  { value: "D", label: "Grade D", description: "Severely damaged — cannot be resold" },
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
          </div>

          {/* === PICKUP TAB: Action Buttons === */}
          {tabContext === "pickup" && canProcess && !isCancelling && (
            <div className="space-y-2 pt-4">
              <div className="flex justify-end gap-4">
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => setIsCancelling(true)}
                  disabled={isProcessing}
                  className="gap-2 h-12 px-8 text-base"
                >
                  <XCircle className="h-5 w-5" />
                  Cancel
                </Button>
                <Button
                  size="lg"
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
                  className="gap-2 h-12 px-8 text-base"
                >
                  {isProcessing ? (
                    <>
                      <Spinner className="h-5 w-5" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Pickup
                    </>
                  )}
                </Button>
              </div>
              {!canPickup && (
                <p className="text-xs text-muted-foreground text-right">
                  Pickup completion is unavailable because inbound has not been completed.
                </p>
              )}
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

          {/* === CANCEL TAB: Inventory Assignment === */}
          {tabContext === "cancel" && (
            <div className="space-y-4 pt-2">
              <Separator />
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <MapPin className="h-4 w-4" />
                  Inventory Assignment
                </Label>
                {order.inventoryLocation ? (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium">
                        Already assigned to{" "}
                        <span className="text-primary font-semibold">
                          {order.inventoryLocation === "store" ? "Store" : "Omni Warehouse"}
                        </span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Select where the cancelled inventory should be assigned.
                    </p>
                    <RadioGroup
                      value={inventoryLocation}
                      onValueChange={(value) => setInventoryLocation(value as InventoryLocation)}
                      className="space-y-2"
                    >
                      <label
                        htmlFor="cancel_store"
                        className="flex items-center space-x-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <RadioGroupItem value="store" id="cancel_store" />
                        <div className="flex-1">
                          <p className="font-medium">Store</p>
                          <p className="text-sm text-muted-foreground">
                            Add to store inventory for in-store sales
                          </p>
                        </div>
                      </label>
                      <label
                        htmlFor="cancel_omni"
                        className="flex items-center space-x-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <RadioGroupItem value="omni" id="cancel_omni" />
                        <div className="flex-1">
                          <p className="font-medium">Omni Warehouse</p>
                          <p className="text-sm text-muted-foreground">
                            Return to omni warehouse for online redistribution
                          </p>
                        </div>
                      </label>
                    </RadioGroup>
                    <div className="flex justify-end pt-2">
                      <Button size="lg" onClick={handleSaveInventory} disabled={isProcessing} className="h-12 px-8 text-base">
                        {isProcessing ? (
                          <>
                            <Spinner className="mr-2 h-5 w-5" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Package className="mr-2 h-5 w-5" />
                            Assign Inventory
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* === REFUND TAB: Grading + Inventory Assignment === */}
          {tabContext === "refund" && (
            <div className="space-y-4 pt-2">
              <Separator />

              {order.returnGrading && order.inventoryLocation ? (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <Star className="h-4 w-4" />
                    Return Processing Status
                  </Label>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm">
                        Grading:{" "}
                        <span className="font-semibold text-primary">Grade {order.returnGrading}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm">
                        Inventory:{" "}
                        <span className="font-semibold text-primary">
                          {order.inventoryLocation === "store" ? "Store" : "Omni Warehouse"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Grading Selection */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <Star className="h-4 w-4" />
                      Return Grading
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Assess the condition of the returned item.
                    </p>
                    <Select value={returnGrading} onValueChange={(v) => setReturnGrading(v as ReturnGrading)}>
                      <SelectTrigger className="w-full bg-secondary border-border text-foreground">
                        <SelectValue placeholder="Select grading" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {RETURN_GRADING_OPTIONS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{g.label}</span>
                              <span className="text-muted-foreground">— {g.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Inventory Assignment */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <MapPin className="h-4 w-4" />
                      Inventory Assignment
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Select where the returned inventory should be assigned.
                    </p>
                    <RadioGroup
                      value={inventoryLocation}
                      onValueChange={(value) => setInventoryLocation(value as InventoryLocation)}
                      className="space-y-2"
                    >
                      <label
                        htmlFor="refund_store"
                        className="flex items-center space-x-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <RadioGroupItem value="store" id="refund_store" />
                        <div className="flex-1">
                          <p className="font-medium">Store</p>
                          <p className="text-sm text-muted-foreground">
                            Add to store inventory for in-store sales
                          </p>
                        </div>
                      </label>
                      <label
                        htmlFor="refund_omni"
                        className="flex items-center space-x-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <RadioGroupItem value="omni" id="refund_omni" />
                        <div className="flex-1">
                          <p className="font-medium">Omni Warehouse</p>
                          <p className="text-sm text-muted-foreground">
                            Keep in omni warehouse for future return shipping
                          </p>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button size="lg" onClick={handleSaveRefund} disabled={isProcessing || !returnGrading} className="h-12 px-8 text-base">
                      {isProcessing ? (
                        <>
                          <Spinner className="mr-2 h-5 w-5" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Package className="mr-2 h-5 w-5" />
                          Save Grading & Assign Inventory
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
