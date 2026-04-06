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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import type { ReturnRequest, InventoryLocation, PickupStatus } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RotateCcw, Search, Package, MapPin, AlertCircle, CheckCircle } from "lucide-react"

const RETURN_REASONS = [
  { value: "product_defect", label: "Product Defect" },
  { value: "wrong_product", label: "Wrong Product Delivered" },
  { value: "size_exchange", label: "Size / Color Mismatch" },
  { value: "change_of_mind", label: "Change of Mind" },
  { value: "other", label: "Other" },
]
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<PickupStatus, { label: string; className: string }> = {
  waiting: { label: "Waiting for Arrival", className: "bg-zinc-100 text-zinc-500 border-zinc-200" },
  ready: { label: "Pickup Available", className: "bg-sky-50 text-sky-600 border-sky-200" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-500 border-rose-200" },
  refunded: { label: "Refunded", className: "bg-amber-50 text-amber-600 border-amber-200" },
}

function formatDT(dateStr?: string): string {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${format(d, "yyyy-MM-dd HH:mm")} (PST)`
}

interface ReturnModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSearch: (qrCode: string) => Promise<ReturnRequest | null>
  onConfirm: (returnRequest: ReturnRequest, location: InventoryLocation) => Promise<void>
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function ReturnModal({
  open,
  onOpenChange,
  onSearch,
  onConfirm,
}: ReturnModalProps) {
  const [qrCode, setQrCode] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null)
  const [location, setLocation] = useState<InventoryLocation>("store_online")
  const [reason, setReason] = useState("")
  const [reasonDetail, setReasonDetail] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!qrCode.trim()) {
      setError("Please enter a Return QR/ID.")
      return
    }

    setIsSearching(true)
    setError(null)
    setReturnRequest(null)

    try {
      const result = await onSearch(qrCode.trim())
      if (result) {
        setReturnRequest(result)
      } else {
        setError("Return request not found.")
      }
    } catch {
      setError("An error occurred while searching.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleConfirm = async () => {
    if (!returnRequest) return

    setIsProcessing(true)
    try {
      await onConfirm(returnRequest, location)
      handleClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setQrCode("")
    setReturnRequest(null)
    setLocation("store_online")
    setReason("")
    setReasonDetail("")
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearching && !returnRequest) {
      handleSearch()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Return Processing
          </DialogTitle>
          <DialogDescription className="text-sm text-primary font-medium">
            Enter the return QR code or Return ID issued online to process the return.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-10">
          {/* QR Code Input — 조회 성공 후 숨김 */}
          {!returnRequest && (
            <div className="space-y-2">
              <Label htmlFor="qr-code">Return QR / ID</Label>
              <div className="flex gap-2">
                <Input
                  id="qr-code"
                  placeholder="Please scan the return QR code"
                  value={qrCode}
                  onChange={(e) => {
                    setQrCode(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={handleKeyDown}
                  className="font-mono text-xs placeholder:text-gray-300"
                  disabled={isSearching}
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !qrCode.trim()}
                >
                  {isSearching ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              )}
            </div>
          )}

          {/* Return Info */}
          {returnRequest && (
            <>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">Return Information</span>
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border",
                    STATUS_CONFIG[returnRequest.pickupStatus].className
                  )}>
                    {STATUS_CONFIG[returnRequest.pickupStatus].label}
                  </span>
                </div>
                <Separator />

                {/* Order & Return Info Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Order No.</p>
                    <p className="font-mono font-medium">{returnRequest.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Return ID</p>
                    <p className="font-mono font-medium">{returnRequest.returnQrCode}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Order Date</p>
                    <p>{formatDT(returnRequest.orderDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Pickup Completed Date</p>
                    <p>{formatDT(returnRequest.completedAt)}</p>
                  </div>
                </div>

                {/* Return Items Table */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Return Items</p>
                  <div className="rounded border border-border overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto] gap-4 px-3 py-2 bg-secondary/50 text-xs font-medium text-muted-foreground">
                      <span>Product (Code / Name)</span>
                      <span className="text-center">Qty</span>
                    </div>
                    {returnRequest.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[1fr_auto] gap-4 px-3 py-2 text-sm border-t border-border"
                      >
                        <span>{item.sku} / {item.productName}</span>
                        <span className="text-center">{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Return Reason */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Return Reason
                </Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="w-full bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {RETURN_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {reason === "other" && (
                  <Textarea
                    placeholder="Please enter the reason for return"
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
                    rows={3}
                  />
                )}
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
                    htmlFor="return_store_online"
                    className="flex items-center space-x-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="store_online" id="return_store_online" />
                    <div className="flex-1">
                      <p className="font-medium">Return to Online</p>
                      <p className="text-sm text-muted-foreground">
                        Inventory will be returned to <span className="font-medium text-foreground">Store Online</span> location
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="return_store_sales"
                    className="flex items-center space-x-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="store_sales" id="return_store_sales" />
                    <div className="flex-1">
                      <p className="font-medium">Add to Store Inventory</p>
                      <p className="text-sm text-muted-foreground">
                        Inventory will be added to <span className="font-medium text-foreground">Store Sales</span> location
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </>
          )}
        </div>

        {returnRequest && (
          <div className="flex justify-end pt-2">
            <Button onClick={handleConfirm} disabled={isProcessing || !reason || (reason === "other" && !reasonDetail.trim())}>
              {isProcessing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Process Return & Refund
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
