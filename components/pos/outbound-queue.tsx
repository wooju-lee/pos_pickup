"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, subMonths } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ArrowLeft, CalendarIcon, Printer, Search, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"

type OutboundStatus = "processing" | "ready" | "shipped" | "failed"

interface OutboundItem {
  orderNo: string
  productInfo: string
  barcode: string
  qty: number
}

interface OutboundRecord {
  id: string
  createDate: string
  outboundNo: string
  toStore: string
  toLocation: string
  orderCount: number
  trackingNo?: string
  status: OutboundStatus
  items: OutboundItem[]
}

const STATUS_CONFIG: Record<OutboundStatus, { label: string; className: string }> = {
  processing: { label: "Processing", className: "bg-amber-50 text-amber-600 border-amber-200" },
  ready: { label: "Ready to Print", className: "bg-sky-50 text-sky-600 border-sky-200" },
  shipped: { label: "Shipped", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  failed: { label: "Failed", className: "bg-rose-50 text-rose-500 border-rose-200" },
}

const mockOutbounds: OutboundRecord[] = [
  {
    id: "ob1",
    createDate: "2026-04-01 14:00",
    outboundNo: "TOO01025",
    toStore: "US1017 / GM_RX_USA",
    toLocation: "1110 / AVAILABLE",
    orderCount: 5,
    trackingNo: "TRN092829333",
    status: "ready",
    items: [
      { orderNo: "ON_20260326016", productInfo: "1100000 / SMART ALIO-01", barcode: "8892839098", qty: 1 },
      { orderNo: "ON_20260327017", productInfo: "3300200 / CLASSIC LEATHER BAG", barcode: "8892841002", qty: 1 },
      { orderNo: "ON_20260327017", productInfo: "3300201 / CARE KIT PREMIUM", barcode: "8892841003", qty: 1 },
      { orderNo: "ON_20260318023", productInfo: "2200100 / URBAN WALKER-X", barcode: "8892840001", qty: 2 },
      { orderNo: "ON_20260322025", productInfo: "3300200 / CLASSIC LEATHER BAG", barcode: "8892841002", qty: 1 },
    ],
  },
  {
    id: "ob2",
    createDate: "2026-04-02 10:00",
    outboundNo: "TOO01026",
    toStore: "US1017 / GM_RX_USA",
    toLocation: "1110 / AVAILABLE",
    orderCount: 3,
    trackingNo: "TRN092829334",
    status: "shipped",
    items: [
      { orderNo: "ON_20260315018", productInfo: "1100000 / SMART ALIO-01", barcode: "8892839098", qty: 1 },
      { orderNo: "ON_20260310031", productInfo: "2200100 / URBAN WALKER-X", barcode: "8892840001", qty: 1 },
      { orderNo: "ON_20260311032", productInfo: "3300200 / CLASSIC LEATHER BAG", barcode: "8892841002", qty: 1 },
    ],
  },
  {
    id: "ob3",
    createDate: "2026-04-03 09:00",
    outboundNo: "TOO01027",
    toStore: "US1017 / GM_RX_USA",
    toLocation: "1110 / DISPOSAL",
    orderCount: 2,
    status: "processing",
    items: [
      { orderNo: "ON_20260313033", productInfo: "1100000 / SMART ALIO-01", barcode: "8892839098", qty: 1 },
      { orderNo: "ON_20260318037", productInfo: "2200100 / URBAN WALKER-X", barcode: "8892840001", qty: 1 },
    ],
  },
  {
    id: "ob4",
    createDate: "2026-04-04 11:00",
    outboundNo: "TOO01028",
    toStore: "US1017 / GM_RX_USA",
    toLocation: "1110 / AVAILABLE",
    orderCount: 4,
    trackingNo: "TRN092829336",
    status: "ready",
    items: [
      { orderNo: "ON_20260311032", productInfo: "3300201 / CARE KIT PREMIUM", barcode: "8892841003", qty: 1 },
      { orderNo: "ON_20260314034", productInfo: "11403903 / PACKAGE SET(BOLD)", barcode: "-", qty: 1 },
      { orderNo: "ON_20260314034", productInfo: "2200100 / URBAN WALKER-X", barcode: "8892840001", qty: 1 },
      { orderNo: "ON_20260316035", productInfo: "3300200 / CLASSIC LEATHER BAG", barcode: "8892841002", qty: 1 },
    ],
  },
  {
    id: "ob5",
    createDate: "2026-04-05 14:00",
    outboundNo: "TOO01029",
    toStore: "US1017 / GM_RX_USA",
    toLocation: "1110 / AVAILABLE",
    orderCount: 2,
    status: "failed",
    items: [
      { orderNo: "ON_20260317036", productInfo: "1100000 / SMART ALIO-01", barcode: "8892839098", qty: 1 },
      { orderNo: "ON_20260317036", productInfo: "11403903 / PACKAGE SET(BOLD)", barcode: "-", qty: 1 },
    ],
  },
  {
    id: "ob6",
    createDate: "2026-04-06 09:30",
    outboundNo: "TOO01030",
    toStore: "US1017 / GM_RX_USA",
    toLocation: "1110 / AVAILABLE",
    orderCount: 3,
    trackingNo: "TRN092829338",
    status: "shipped",
    items: [
      { orderNo: "ON_20260320038", productInfo: "3300201 / CARE KIT PREMIUM", barcode: "8892841003", qty: 2 },
      { orderNo: "ON_20260322039", productInfo: "1100000 / SMART ALIO-01", barcode: "8892839098", qty: 1 },
      { orderNo: "ON_20260322039", productInfo: "3300200 / CLASSIC LEATHER BAG", barcode: "8892841002", qty: 1 },
    ],
  },
  {
    id: "ob7",
    createDate: "2026-04-07 15:00",
    outboundNo: "TOO01031",
    toStore: "US1017 / GM_RX_USA",
    toLocation: "1110 / DISPOSAL",
    orderCount: 1,
    trackingNo: "TRN092829339",
    status: "ready",
    items: [
      { orderNo: "ON_20260322039", productInfo: "3300201 / CARE KIT PREMIUM", barcode: "8892841003", qty: 1 },
    ],
  },
  {
    id: "ob8",
    createDate: "2026-04-08 10:00",
    outboundNo: "TOO01032",
    toStore: "US1017 / GM_RX_USA",
    toLocation: "1110 / AVAILABLE",
    orderCount: 2,
    status: "processing",
    items: [
      { orderNo: "ON_20260325026", productInfo: "3300201 / CARE KIT PREMIUM", barcode: "8892841003", qty: 3 },
      { orderNo: "ON_20260321030", productInfo: "2200100 / URBAN WALKER-X", barcode: "8892840001", qty: 1 },
    ],
  },
]

function formatDT(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return format(d, "yyyy-MM-dd HH:mm")
}

export function OutboundQueue() {
  const [selectedRecord, setSelectedRecord] = useState<OutboundRecord | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(subMonths(new Date(), 1))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())

  const filteredRecords = mockOutbounds.filter((r) => {
    if (searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase()
      if (!r.outboundNo.toLowerCase().includes(q) &&
          !r.items.some((i) => i.orderNo.toLowerCase().includes(q) || i.productInfo.toLowerCase().includes(q))) {
        return false
      }
    }
    if (startDate || endDate) {
      const d = new Date(r.createDate)
      if (startDate && d < new Date(startDate.toDateString())) return false
      if (endDate && d > new Date(new Date(endDate).setHours(23, 59, 59, 999))) return false
    }
    return true
  })

  const handlePrint = (record: OutboundRecord) => {
    if (record.status === "processing") {
      toast.error("Cannot print", { description: "Outbound is still processing." })
      return
    }
    if (record.status === "failed") {
      toast.error("Cannot print", { description: "Outbound registration failed. Please check the system." })
      return
    }
    toast.success("Print shipping labels", {
      description: `Printing labels for ${record.outboundNo} (${record.orderCount} orders)`,
    })
  }

  // Detail view
  if (selectedRecord) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSelectedRecord(null)}
          className="flex items-center gap-2 text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to List
        </button>

        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-b border-border">
                  <TableHead className="font-semibold text-foreground text-center h-14">Create Date</TableHead>
                  <TableHead className="font-semibold text-foreground text-center h-14">Outbound No.</TableHead>
                  <TableHead className="font-semibold text-foreground text-center h-14">Order No.</TableHead>
                  <TableHead className="font-semibold text-foreground h-14">
                    <div>Product Info</div>
                    <div className="text-xs font-normal text-muted-foreground">(Code / Name / Barcode)</div>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-center h-14">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedRecord.items.map((item, idx) => (
                  <TableRow key={idx} className="border-b border-border">
                    <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                      {idx === 0 ? formatDT(selectedRecord.createDate) : ""}
                    </TableCell>
                    <TableCell className="text-sm text-center font-mono py-4 font-medium">
                      {idx === 0 ? selectedRecord.outboundNo : ""}
                    </TableCell>
                    <TableCell className="text-sm text-center font-mono py-4">{item.orderNo}</TableCell>
                    <TableCell className="text-sm py-4">{item.productInfo} / {item.barcode}</TableCell>
                    <TableCell className="text-sm text-center py-4">{item.qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-4">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">
              Search Period (Create Date)
            </label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    style={{ width: 160 }}
                    className="h-10 justify-between font-normal bg-secondary border-border text-foreground hover:bg-muted px-3"
                  >
                    <span>{startDate ? format(startDate, "yyyy-MM-dd") : "Start"}</span>
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent style={{ width: 195 }} className="p-0 bg-popover border-border" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={ko} initialFocus className="[--cell-size:24px] p-2 w-full" />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">~</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    style={{ width: 160 }}
                    className="h-10 justify-between font-normal bg-secondary border-border text-foreground hover:bg-muted px-3"
                  >
                    <span>{endDate ? format(endDate, "yyyy-MM-dd") : "End"}</span>
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent style={{ width: 195 }} className="p-0 bg-popover border-border" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} locale={ko} initialFocus className="[--cell-size:24px] p-2 w-full" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex-1 max-w-md">
            <label className="text-sm font-medium text-muted-foreground block mb-2">
              Order No., Product Code, Product Name
            </label>
            <div className="relative">
              <Input
                placeholder="Please enter at least 2 characters."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <p className="text-sm text-foreground">
          Total <span className="font-bold text-primary">{filteredRecords.length}</span> Count
        </p>

        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-b border-border">
                <TableHead className="font-semibold text-foreground text-center h-14">Create Date</TableHead>
                <TableHead className="font-semibold text-foreground text-center h-14">Outbound No.</TableHead>
                <TableHead className="font-semibold text-foreground text-center h-14">To Store</TableHead>
                <TableHead className="font-semibold text-foreground text-center h-14">To Location</TableHead>
                <TableHead className="font-semibold text-foreground text-center h-14">Order Count</TableHead>
                <TableHead className="font-semibold text-foreground text-center h-14">Detail</TableHead>
                <TableHead className="font-semibold text-foreground text-center h-14">Tracking No.</TableHead>
                <TableHead className="font-semibold text-foreground text-center h-14">Print</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id} className="hover:bg-secondary/30 border-b border-border">
                  <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                    {formatDT(record.createDate)}
                  </TableCell>
                  <TableCell className="text-sm text-center font-mono py-4 font-medium">
                    {record.outboundNo}
                  </TableCell>
                  <TableCell className="text-sm text-center py-4">{record.toStore}</TableCell>
                  <TableCell className="text-sm text-center py-4">{record.toLocation}</TableCell>
                  <TableCell className="text-sm text-center py-4 font-medium">{record.orderCount}</TableCell>
                  <TableCell className="text-center py-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRecord(record)}
                      className="text-xs px-8"
                    >
                      Detail
                    </Button>
                  </TableCell>
                  <TableCell className="text-sm text-center font-mono py-4">
                    {record.trackingNo || "-"}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <Button
                      size="sm"
                      onClick={() => handlePrint(record)}
                      disabled={record.status === "processing" || record.status === "failed"}
                      className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/40 disabled:text-white/60"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print shipping labels
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No outbound records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
