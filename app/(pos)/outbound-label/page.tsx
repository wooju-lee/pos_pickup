import { OutboundQueue } from "@/components/pos/outbound-queue"

export default function OutboundLabelPage() {
  return (
    <main className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Outbound Label Print</h2>
        <p className="text-sm text-muted-foreground mt-1">
          View outbound registrations and print shipping labels.
        </p>
      </div>
      <OutboundQueue />
    </main>
  )
}
