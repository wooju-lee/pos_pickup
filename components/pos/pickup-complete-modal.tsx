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
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { PickupOrder } from "@/lib/types"
import { CheckCircle, Package, User } from "lucide-react"

interface PickupCompleteModalProps {
  order: PickupOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (orderId: string) => Promise<void>
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount)
}

export function PickupCompleteModal({
  order,
  open,
  onOpenChange,
  onConfirm,
}: PickupCompleteModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!order) return null

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm(order.id)
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            픽업 완료 처리
          </DialogTitle>
          <DialogDescription>
            고객에게 상품을 전달하고 픽업 완료 처리합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 주문 요약 */}
          <div className="p-4 rounded-lg bg-secondary/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">주문번호</span>
              <span className="font-mono text-primary">{order.orderNumber}</span>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
              </div>
            </div>
          </div>

          {/* 상품 목록 */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              인도 상품
            </h4>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 text-sm"
                >
                  <span>{item.productName}</span>
                  <span className="text-muted-foreground">x{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 결제 금액 */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="font-medium">결제 완료 금액</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(order.paidAmount)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                처리 중...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                픽업 완료
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
