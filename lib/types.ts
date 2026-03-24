export type ApprovalStatus = 
  | "unready"      // 미승인
  | "request"      // 요청
  | "confirm"      // 승인
  | "reject"       // 거절

export type ProcessingStatus = 
  | "pending"           // 대기
  | "inbound_inspection" // 입고검수
  | "in_progress"       // 진행중
  | "completed"         // 완료
  | "cancelled"         // 취소

export type PickupStatus =
  | "waiting"      // Waiting for Pickup (픽업 주문 대기)
  | "ready"        // Ready for Pickup (고객 픽업 대기)
  | "completed"    // Completed (픽업 완료)
  | "cancelled"    // Cancelled (취소)
  | "refunded"     // Refunded (반품)

export type OrderStatus = 
  | "pending"      // 픽업 대기
  | "ready"        // 픽업 준비완료
  | "completed"    // 픽업 완료
  | "cancelled"    // 취소됨
  | "returned"     // 반품완료

export type InventoryLocation = 
  | "store_sales"   // 매장 재고로 귀속
  | "store_online"  // 온라인으로 회송

export interface OrderItem {
  id: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
  imageUrl?: string
  barcode?: string
}

export interface PickupOrder {
  id: string
  orderNumber: string
  sequenceNumber: number
  customerName: string
  customerPhone: string
  customerEmail: string
  orderDate: string
  pickupDate: string
  outboundDate: string      // 출고등록일
  inboundDate?: string      // 입고일
  items: OrderItem[]
  subtotal: number
  discount: number
  totalAmount: number
  paidAmount: number
  paymentMethod: string
  status: OrderStatus
  pickupStatus: PickupStatus
  approvalStatus: ApprovalStatus
  processingStatus: ProcessingStatus
  returnQrCode?: string
  cancelledAt?: string
  completedAt?: string
  returnedAt?: string
  savedAt?: string
  inventoryLocation?: InventoryLocation
  notes?: string
}

export interface ReturnRequest {
  returnQrCode: string
  orderId: string
  orderNumber: string
  customerName: string
  items: OrderItem[]
  refundAmount: number
  reason?: string
  pickupStatus: PickupStatus
  orderDate: string
  completedAt?: string
}
