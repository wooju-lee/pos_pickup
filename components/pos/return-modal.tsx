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
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { ReturnRequest, PickupStatus, ReturnGrading } from "@/lib/types"
import { RotateCcw, Search, AlertCircle, Star } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<PickupStatus, { label: string; className: string }> = {
  waiting: { label: "Waiting for Arrival", className: "bg-zinc-100 text-zinc-500 border-zinc-200" },
  ready: { label: "Pickup Available", className: "bg-sky-50 text-sky-600 border-sky-200" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
}

const GRADING_OPTIONS: { value: ReturnGrading; label: string; description: string; color: string; activeColor: string }[] = [
  { value: "sellable", label: "Sellable", description: "Unopened / Can be resold as-is", color: "text-emerald-600 border-emerald-300 hover:bg-emerald-50", activeColor: "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" },
  { value: "resellable", label: "Resellable", description: "Opened / Product OK / Can be resold", color: "text-sky-600 border-sky-300 hover:bg-sky-50", activeColor: "bg-sky-600 hover:bg-sky-700 text-white border-sky-600" },
  { value: "dispose", label: "Dispose", description: "Product defect / Cannot be resold", color: "text-rose-600 border-rose-300 hover:bg-rose-50", activeColor: "bg-rose-600 hover:bg-rose-700 text-white border-rose-600" },
]

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
  onConfirm: (returnRequest: ReturnRequest, itemGradings: Record<string, ReturnGrading>) => Promise<void>
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
  const [error, setError] = useState<string | null>(null)
  const [itemGradings, setItemGradings] = useState<Record<string, ReturnGrading>>({})

  const handleSearch = async () => {
    if (!qrCode.trim()) {
      setError("Please enter a Return QR/ID.")
      return
    }

    setIsSearching(true)
    setError(null)
    setReturnRequest(null)
    setItemGradings({})

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

  const allGraded = returnRequest
    ? returnRequest.items.every((item) => itemGradings[item.id])
    : false

  const handleConfirm = async () => {
    if (!returnRequest || isProcessing || !allGraded) return

    setIsProcessing(true)
    try {
      await onConfirm(returnRequest, itemGradings)
      handleClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setQrCode("")
    setReturnRequest(null)
    setItemGradings({})
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearching && !returnRequest) {
      handleSearch()
    }
  }

  const setGrading = (itemId: string, grading: ReturnGrading) => {
    setItemGradings((prev) => ({ ...prev, [itemId]: grading }))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl outline-none focus:outline-none ring-0 focus:ring-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Return Processing
          </DialogTitle>
          <DialogDescription className="text-sm text-primary font-medium">
            Scan the return QR code or enter the Return ID to process the return.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Input */}
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
              {/* Status badge */}
              <div className="flex justify-end">
                <span className={cn(
                  "inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border",
                  STATUS_CONFIG[returnRequest.pickupStatus].className
                )}>
                  {STATUS_CONFIG[returnRequest.pickupStatus].label}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Order No.</p>
                    <p className="font-mono font-bold text-primary">{returnRequest.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Return ID</p>
                    <p className="font-mono font-bold text-primary">{returnRequest.returnQrCode}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Order Date</p>
                    <p>{formatDT(returnRequest.orderDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Completed Date</p>
                    <p>{formatDT(returnRequest.completedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Item-level grading */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Return Items & Grading
                </Label>
                <div className="rounded-lg border border-border overflow-hidden bg-white">
                  <div className="grid grid-cols-[1fr_50px_240px] px-4 py-2.5 bg-secondary/50 text-xs font-medium text-muted-foreground">
                    <span>Product</span>
                    <span className="text-center">Qty</span>
                    <span className="text-center">Grading</span>
                  </div>
                  {returnRequest.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_50px_240px] px-4 py-3 text-sm border-t border-border bg-white items-center"
                    >
                      <span>{item.sku} / {item.productName}</span>
                      <span className="text-center">{item.quantity}</span>
                      <div className="flex gap-1.5">
                        {GRADING_OPTIONS.map((g) => {
                          const isActive = itemGradings[item.id] === g.value
                          return (
                            <button
                              key={g.value}
                              type="button"
                              onClick={() => setGrading(item.id, g.value)}
                              className={cn(
                                "rounded-md border px-3 py-2 text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer",
                                isActive ? g.activeColor : g.color
                              )}
                            >
                              {g.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  {!allGraded && (
                    <div className="grid grid-cols-[1fr_50px_240px] px-4 py-2 border-t border-border bg-white">
                      <span />
                      <span />
                      <p className="text-xs text-muted-foreground text-center">
                        Please assign a grading to all items.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {returnRequest && (
          <div className="flex justify-end pt-2">
            <Button
              size="lg"
              onClick={handleConfirm}
              disabled={isProcessing || !allGraded}
              className="h-12 px-8 text-base"
            >
              {isProcessing ? (
                <>
                  <Spinner className="mr-2 h-5 w-5" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Confirm Return
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
