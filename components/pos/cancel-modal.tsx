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
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { PickupOrder, InventoryLocation } from "@/lib/types"
import { XCircle, AlertTriangle, Package, MapPin } from "lucide-react"

interface CancelModalProps {
  order: PickupOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (orderId: string, location: InventoryLocation, reason?: string) => Promise<void>
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount)
}

export function CancelModal({
  order,
  open,
  onOpenChange,
  onConfirm,
}: CancelModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [location, setLocation] = useState<InventoryLocation>("store_sales")
  const [reason, setReason] = useState("")

  if (!order) return null

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm(order.id, location, reason || undefined)
      onOpenChange(false)
      setLocation("store_sales")
      setReason("")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            주문 취소 / 환불 처리
          </DialogTitle>
          <DialogDescription>
            주문을 취소하고 환불을 진행합니다. 재고 처리 위치를 선택해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 경고 */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">취소 시 주의사항</p>
              <p className="text-muted-foreground mt-1">
                주문 취소 시 결제 금액이 환불되며, 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
          </div>

          {/* 주문 정보 */}
          <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">주문번호</span>
              <span className="font-mono text-primary">{order.orderNumber}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">고객명</span>
              <span>{order.customerName}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-medium">환불 금액</span>
              <span className="text-lg font-bold text-destructive">
                {formatCurrency(order.paidAmount)}
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
                htmlFor="store_sales"
                className="flex items-center space-x-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem value="store_sales" id="store_sales" />
                <div className="flex-1">
                  <p className="font-medium">매장 재고로 귀속</p>
                  <p className="text-sm text-muted-foreground">
                    Store Sales 로케이션에 재고 추가
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
                  <p className="font-medium">온라인으로 회송</p>
                  <p className="text-sm text-muted-foreground">
                    Store Online 로케이션으로 반송 처리
                  </p>
                </div>
                <Package className="h-5 w-5 text-muted-foreground" />
              </label>
            </RadioGroup>
          </div>

          {/* 취소 사유 */}
          <div className="space-y-2">
            <Label htmlFor="reason">취소 사유 (선택)</Label>
            <Textarea
              id="reason"
              placeholder="취소 사유를 입력해주세요..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            닫기
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                처리 중...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                취소 및 환불
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
