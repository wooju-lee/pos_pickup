"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { mockOutbounds } from "@/components/pos/outbound-queue"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft } from "lucide-react"
import { format } from "date-fns"

function formatDT(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return format(d, "yyyy-MM-dd HH:mm")
}

export default function OutboundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const record = mockOutbounds.find((r) => r.id === id)

  if (!record) {
    return (
      <main className="p-6">
        <button
          type="button"
          onClick={() => router.push("/outbound-label")}
          className="flex items-center gap-2 text-base font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to List
        </button>
        <p className="text-muted-foreground">Outbound record not found.</p>
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Outbound Label Print</h2>
        <p className="text-sm text-muted-foreground mt-1">
          View outbound registrations and print shipping labels.
        </p>
      </div>

      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.push("/outbound-label")}
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
                {record.items.map((item, idx) => (
                  <TableRow key={idx} className="border-b border-border">
                    <TableCell className="text-sm text-center py-4 whitespace-nowrap">
                      {idx === 0 ? formatDT(record.createDate) : ""}
                    </TableCell>
                    <TableCell className="text-sm text-center font-mono py-4 font-medium">
                      {idx === 0 ? record.outboundNo : ""}
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
    </main>
  )
}
