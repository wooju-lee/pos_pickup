"use client"

import { Search, CalendarIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { format, subDays, subMonths } from "date-fns"
import { ko } from "date-fns/locale"
import type { PickupStatus } from "@/lib/types"

interface OrderFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  dateType: string
  onDateTypeChange: (value: string) => void
  startDate: Date | undefined
  endDate: Date | undefined
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  pickupStatus: PickupStatus | "all"
  onPickupStatusChange: (value: PickupStatus | "all") => void
}

export function OrderFilters({
  searchQuery,
  onSearchChange,
  dateType,
  onDateTypeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  pickupStatus,
  onPickupStatusChange,
}: OrderFiltersProps) {
  const today = new Date()

  const handleQuickDate = (type: "today" | "1week" | "1month" | "3months") => {
    const end = today
    let start: Date
    
    switch (type) {
      case "today":
        start = today
        break
      case "1week":
        start = subDays(today, 7)
        break
      case "1month":
        start = subMonths(today, 1)
        break
      case "3months":
        start = subMonths(today, 3)
        break
    }
    
    onStartDateChange(start)
    onEndDateChange(end)
  }

  return (
    <div className="space-y-6">
      {/* First Row - Date and Status filters */}
      <div className="flex flex-wrap items-end gap-8">
        {/* Search Period (Create Date) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Search Period (Create Date)
          </label>
          <div className="flex items-center gap-2">
            <Select value={dateType} onValueChange={onDateTypeChange}>
              <SelectTrigger className="w-[130px] h-10 bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="order">Order Date</SelectItem>
                <SelectItem value="pickup">Pickup Date</SelectItem>
                <SelectItem value="outbound">Outbound Date</SelectItem>
                <SelectItem value="inbound">Inbound Date</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-[130px] h-10 justify-start text-left font-normal bg-secondary border-border text-foreground hover:bg-muted"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {startDate ? format(startDate, "yyyy-MM-dd") : "Start"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={onStartDateChange}
                  locale={ko}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <span className="text-muted-foreground">~</span>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-[130px] h-10 justify-start text-left font-normal bg-secondary border-border text-foreground hover:bg-muted"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {endDate ? format(endDate, "yyyy-MM-dd") : "End"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={onEndDateChange}
                  locale={ko}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Quick Date Buttons */}
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleQuickDate("today")}
            className="h-10 px-4 bg-secondary border-border text-foreground hover:bg-muted hover:text-primary"
          >
            Today
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleQuickDate("1week")}
            className="h-10 px-4 bg-secondary border-border text-foreground hover:bg-muted hover:text-primary"
          >
            1 Week
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleQuickDate("1month")}
            className="h-10 px-4 bg-secondary border-border text-foreground hover:bg-muted hover:text-primary"
          >
            1 Month
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleQuickDate("3months")}
            className="h-10 px-4 bg-secondary border-border text-foreground hover:bg-muted hover:text-primary"
          >
            3 Months
          </Button>
        </div>
        
        {/* Pickup Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Pickup Status
          </label>
          <Select 
            value={pickupStatus} 
            onValueChange={(value) => onPickupStatusChange(value as PickupStatus | "all")}
          >
            <SelectTrigger className="w-[180px] h-10 bg-secondary border-border text-foreground">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="waiting">Waiting for Pickup</SelectItem>
              <SelectItem value="ready">Ready for Pickup</SelectItem>
              <SelectItem value="completed">Pickup Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Second Row - Search and Button */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2 flex-1 max-w-md">
          <label className="text-sm font-medium text-muted-foreground">
            Order No., Product Code, Product Name
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Please Enter at least 2 characters."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-10 h-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        <Button className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>
    </div>
  )
}
