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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import type { ReturnRequest, InventoryLocation } from "@/lib/types"
import { RotateCcw, Search, Package, MapPin, AlertCircle, CheckCircle } from "lucide-react"

interface ReturnModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSearch: (qrCode: string) => Promise<ReturnRequest | null>
  onConfirm: (returnRequest: ReturnRequest, location: InventoryLocation) => Promise<void>
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
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
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!qrCode.trim()) {
      setError("반품 QR/ID를 입력해주세요.")
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
        setError("해당 반품 요청을 찾을 수 없습니다.")
      }
    } catch {
      setError("조회 중 오류가 발생했습니다.")
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
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearching && !returnRequest) {
      handleSearch()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            반품 처리
          </DialogTitle>
          <DialogDescription>
            온라인에서 발급받은 반품 QR 코드 또는 반품 ID를 입력하여 반품을 처리합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR 코드 입력 */}
          <div className="space-y-2">
            <Label htmlFor="qr-code">반품 QR / ID</Label>
            <div className="flex gap-2">
              <Input
                id="qr-code"
                placeholder="RTN-2024-000000"
                value={qrCode}
                onChange={(e) => {
                  setQrCode(e.target.value)
                  setError(null)
                  if (returnRequest) setReturnRequest(null)
                }}
                onKeyDown={handleKeyDown}
                className="font-mono"
                disabled={isSearching || isProcessing}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || isProcessing || !qrCode.trim()}
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

          {/* 반품 정보 */}
          {returnRequest && (
            <>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">반품 정보 확인됨</span>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">주문번호</p>
                    <p className="font-mono">{returnRequest.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">고객명</p>
                    <p>{returnRequest.customerName}</p>
                  </div>
                </div>
                
                {/* 반품 상품 */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">반품 상품</p>
                  {returnRequest.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded bg-secondary/30 text-sm"
                    >
                      <span>{item.productName}</span>
                      <span className="text-muted-foreground">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {returnRequest.reason && (
                  <div>
                    <p className="text-sm text-muted-foreground">반품 사유</p>
                    <Badge variant="outline">{returnRequest.reason}</Badge>
                  </div>
                )}

                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-medium">환불 금액</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(returnRequest.refundAmount)}
                  </span>
                </div>
              </div>

              {/* 재고 처리 위치 */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  재고 처리 위치
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
                      <p className="font-medium">온라인으로 회송</p>
                      <p className="text-sm text-muted-foreground">
                        Store Online 로케이션으로 반송 처리
                      </p>
                    </div>
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </label>
                  <label
                    htmlFor="return_store_sales"
                    className="flex items-center space-x-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="store_sales" id="return_store_sales" />
                    <div className="flex-1">
                      <p className="font-medium">매장 재고로 귀속</p>
                      <p className="text-sm text-muted-foreground">
                        Store Sales 로케이션에 재고 추가
                      </p>
                    </div>
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </label>
                </RadioGroup>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            닫기
          </Button>
          {returnRequest && (
            <Button onClick={handleConfirm} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  처리 중...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  반품 및 환불 처리
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
