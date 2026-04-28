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
import type { PickupOrder, OrderItem, OutboundLocation } from "@/lib/types"
import { Warehouse, Store, MapPin } from "lucide-react"

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

// POS store code → country → online store mapping
const STORE_COUNTRY_MAP: Record<string, string> = {
  CA: "CA",
  US: "US",
  KR: "KR",
  JP: "JP",
  CN: "CN",
  HK: "HK",
  SG: "SG",
  GB: "GB",
  FR: "FR",
  DE: "DE",
}

const ONLINE_STORE_MAP: Record<string, { code: string; name: string }> = {
  CA: { code: "CA1017", name: "GM_RX_CANADA" },
  US: { code: "US1017", name: "GM_RX_USA" },
  KR: { code: "KR1017", name: "GM_RX_KOREA" },
  JP: { code: "JP1017", name: "GM_RX_JAPAN" },
  CN: { code: "CN1017", name: "GM_RX_CHINA" },
  HK: { code: "HK1017", name: "GM_RX_HONGKONG" },
  SG: { code: "SG1017", name: "GM_RX_SINGAPORE" },
  GB: { code: "GB1017", name: "GM_RX_UK" },
  FR: { code: "FR1017", name: "GM_RX_FRANCE" },
  DE: { code: "DE1017", name: "GM_RX_GERMANY" },
}

const LOCATIONS = [
  { value: "available", label: "1110 / AVAILABLE", enabled: true },
  { value: "disposal", label: "1112 / DISPOSAL", enabled: false },
]

function getOnlineStoreFromPosCode(posStoreCode: string) {
  const countryPrefix = posStoreCode.replace(/[0-9]/g, "")
  const country = STORE_COUNTRY_MAP[countryPrefix] || countryPrefix
  return ONLINE_STORE_MAP[country] || { code: `${countryPrefix}1017`, name: `GM_RX_${countryPrefix}` }
}

export function OutboundModal({
  open,
  onOpenChange,
  items,
  onConfirm,
}: OutboundModalProps) {
  const [location, setLocation] = useState<OutboundLocation | "">("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Derive online store from POS store code
  const posStoreCode = "CA1001" // TODO: from context/props
  const onlineStore = getOnlineStoreFromPosCode(posStoreCode)

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

          {/* Store & Location Dropdowns */}
          <div className="p-5 rounded-lg bg-muted/30 border border-border">
            <div className="grid grid-cols-2 gap-6">
              {/* Store Information - fixed based on POS store */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-semibold">
                  <Store className="h-3.5 w-3.5" />
                  Store Information
                  <span className="text-red-500">*</span>
                </Label>
                <Select value={onlineStore.code} disabled>
                  <SelectTrigger className="h-9 bg-background text-xs">
                    <SelectValue>{onlineStore.code} / {onlineStore.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={onlineStore.code} className="text-xs">
                      {onlineStore.code} / {onlineStore.name}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location - dropdown with availability */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-semibold">
                  <MapPin className="h-3.5 w-3.5" />
                  Location
                  <span className="text-red-500">*</span>
                </Label>
                <Select value={location} onValueChange={(v) => setLocation(v as OutboundLocation)}>
                  <SelectTrigger className="h-9 bg-background text-xs">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => (
                      <SelectItem
                        key={loc.value}
                        value={loc.value}
                        disabled={!loc.enabled}
                        className="text-xs"
                      >
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Confirm */}
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isProcessing || !location}
              className="gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <Warehouse className="h-4 w-4" />
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
