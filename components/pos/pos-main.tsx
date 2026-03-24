"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Separator } from "@/components/ui/separator"
import { DollarSign, Info, QrCode, Search, ShoppingCart, Printer } from "lucide-react"

export function POSMain() {
  const [invoiceNo, setInvoiceNo] = useState("")
  const [productBarcode, setProductBarcode] = useState("")
  const [country, setCountry] = useState("canada")
  const [memberSearch, setMemberSearch] = useState("")
  const [customerQr, setCustomerQr] = useState("")
  const [serialCode, setSerialCode] = useState("")
  const [saveCashier, setSaveCashier] = useState(false)
  const [skipAcCard, setSkipAcCard] = useState(false)
  const [nationality, setNationality] = useState("")
  const [customerType, setCustomerType] = useState("")

  return (
    <main className="p-6">
      <div className="flex gap-6">
        {/* Left - Sales Area */}
        <div className="flex-1 space-y-4">
          {/* SALES / INVENTORY Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">SALES</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">INVENTORY</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Invoice & Barcode Row */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-foreground whitespace-nowrap">Invoice No.</label>
                <Input
                  placeholder="Please enter or it will auto-generate."
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-[280px] h-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex items-center gap-3 flex-1">
                <label className="text-sm font-medium text-foreground whitespace-nowrap">Product Barcode</label>
                <Select>
                  <SelectTrigger className="flex-1 h-10 bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Please scan or enter the product name, code, and barcode." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="placeholder">Search product...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Product Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-b border-border">
                  <TableHead className="font-semibold text-foreground text-center h-12 w-12">#</TableHead>
                  <TableHead className="font-semibold text-foreground h-12">
                    <div>Product Information</div>
                    <div className="text-xs font-normal text-muted-foreground">(Name)</div>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-center h-12">Qty</TableHead>
                  <TableHead className="font-semibold text-foreground text-center h-12">Currency</TableHead>
                  <TableHead className="font-semibold text-foreground text-center h-12">Customer Price</TableHead>
                  <TableHead className="font-semibold text-foreground text-center h-12">Discount Price</TableHead>
                  <TableHead className="font-semibold text-foreground text-center h-12">Total Price</TableHead>
                  <TableHead className="font-semibold text-foreground text-center h-12">
                    <div>Stock</div>
                    <div className="text-xs font-normal text-muted-foreground">(SALES)</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                    No rows
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Price Summary */}
          <div className="flex items-center justify-end gap-6 px-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Customer Price:</span>
              <span className="font-bold text-primary">0</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Discount Price:</span>
              <span className="font-bold text-primary">0</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Total Price:</span>
              <span className="font-bold text-primary">0</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-10 px-6 bg-secondary border-border text-foreground hover:bg-muted"
              >
                All Clear
              </Button>
              <Button
                variant="outline"
                className="h-10 px-6 bg-secondary border-border text-foreground hover:bg-muted"
              >
                Confirm RX
              </Button>
            </div>
            <Button
              variant="outline"
              className="h-10 px-6 bg-secondary border-border text-foreground hover:bg-muted"
            >
              Manual Refund
            </Button>
          </div>
        </div>

        {/* Right - Sidebar */}
        <div className="w-[320px] space-y-6">
          {/* Customer Member Search */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-foreground" />
              <span className="font-semibold text-foreground">Customer Member Search</span>
            </div>

            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-10 bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="canada">Canada</SelectItem>
                <SelectItem value="usa">United States</SelectItem>
                <SelectItem value="korea">South Korea</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Email OR Phone"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-9 h-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="text-right">
              <button className="text-sm text-primary underline underline-offset-2 hover:text-primary/80">
                Non-Member
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">OR</span>
              <Separator className="flex-1" />
            </div>

            <div className="relative">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Scan Customer QR"
                value={customerQr}
                onChange={(e) => setCustomerQr(e.target.value)}
                className="pl-9 h-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Sales & Print */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-foreground" />
              <span className="font-semibold text-foreground">Sales & Print</span>
            </div>

            <Button
              className="w-full h-10 bg-muted text-muted-foreground hover:bg-muted/80"
              disabled
            >
              Confirm Sales
            </Button>

            <div className="flex items-center gap-2">
              <Checkbox
                id="save-cashier"
                checked={saveCashier}
                onCheckedChange={(checked) => setSaveCashier(checked as boolean)}
              />
              <label htmlFor="save-cashier" className="text-sm text-foreground cursor-pointer">
                Save cashier information
              </label>
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">OR</span>
              <Separator className="flex-1" />
            </div>

            <Button
              className="w-full h-10 bg-muted text-muted-foreground hover:bg-muted/80"
              disabled
            >
              AC Card Print
            </Button>

            <div className="flex items-center gap-2">
              <Checkbox
                id="skip-ac-card"
                checked={skipAcCard}
                onCheckedChange={(checked) => setSkipAcCard(checked as boolean)}
              />
              <label htmlFor="skip-ac-card" className="text-sm text-foreground cursor-pointer">
                Skip AC Card Print.
              </label>
            </div>

            <Button
              className="w-full h-10 bg-muted text-muted-foreground hover:bg-muted/80"
              disabled
            >
              AC Card RE Print
            </Button>
          </div>

          {/* Gift Pay */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <span className="font-semibold text-foreground">Gift Pay</span>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Please enter serial code."
                value={serialCode}
                onChange={(e) => setSerialCode(e.target.value)}
                className="flex-1 h-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              <Button
                variant="outline"
                className="h-10 px-4 bg-secondary border-border text-foreground hover:bg-muted whitespace-nowrap"
              >
                FOC Check
              </Button>
            </div>
          </div>

          {/* Country / Nationality / Customer Type */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Country</label>
              <Select>
                <SelectTrigger className="h-10 bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Please Select." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="canada">Canada</SelectItem>
                  <SelectItem value="usa">United States</SelectItem>
                  <SelectItem value="korea">South Korea</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Nationality</label>
              <Select>
                <SelectTrigger className="h-10 bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Please Select." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="canadian">Canadian</SelectItem>
                  <SelectItem value="american">American</SelectItem>
                  <SelectItem value="korean">Korean</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Customer Type</label>
              <Select>
                <SelectTrigger className="h-10 bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Please Select." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
