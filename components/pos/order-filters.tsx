"use client"

import { Search, CalendarIcon, ChevronDown, Check } from "lucide-react"
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
import { cn } from "@/lib/utils"

const PICKUP_STATUS_OPTIONS: { value: PickupStatus; label: string }[] = [
  { value: "waiting", label: "Waiting for Arrival" },
  { value: "ready", label: "Pickup Available" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

interface OrderFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  dateType: string
  onDateTypeChange: (value: string) => void
  startDate: Date | undefined
  endDate: Date | undefined
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  pickupStatuses: PickupStatus[]
  onPickupStatusesChange: (value: PickupStatus[]) => void
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
  pickupStatuses,
  onPickupStatusesChange,
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
        {/* Search Period */}
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">
            Search Period
          </label>
          <div className="flex items-center gap-2">
            <Select value={dateType} onValueChange={onDateTypeChange}>
              <SelectTrigger style={{ height: 40 }} className="w-[130px] bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="order">Order Date</SelectItem>
                <SelectItem value="pickup">Pickup Date</SelectItem>
                <SelectItem value="outbound">Outbound Date</SelectItem>
                <SelectItem value="inbound">Inbound Date</SelectItem>
                <SelectItem value="completed">Pickup Completed Date</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  style={{ width: 195 }}
                  className="h-10 justify-center font-normal bg-secondary border-border text-foreground hover:bg-muted"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {startDate ? format(startDate, "yyyy-MM-dd") : "Start"}
                </Button>
              </PopoverTrigger>
              <PopoverContent style={{ width: 195 }} className="p-0 bg-popover border-border" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={onStartDateChange}
                  locale={ko}
                  initialFocus
                  className="[--cell-size:24px] p-2 w-full"
                />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground">~</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  style={{ width: 195 }}
                  className="h-10 justify-center font-normal bg-secondary border-border text-foreground hover:bg-muted"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {endDate ? format(endDate, "yyyy-MM-dd") : "End"}
                </Button>
              </PopoverTrigger>
              <PopoverContent style={{ width: 195 }} className="p-0 bg-popover border-border" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={onEndDateChange}
                  locale={ko}
                  initialFocus
                  className="[--cell-size:24px] p-2 w-full"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Quick Date Buttons */}
        <div className="flex items-end gap-1">
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
        
        {/* Pickup Status - Multi Select */}
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">
            Pickup Status
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[220px] h-10 justify-between font-normal bg-secondary border-border text-foreground hover:bg-muted"
              >
                <span className="truncate">
                  {pickupStatuses.length === 0 || pickupStatuses.length === PICKUP_STATUS_OPTIONS.length
                    ? "All"
                    : pickupStatuses.length === 1
                      ? PICKUP_STATUS_OPTIONS.find(o => o.value === pickupStatuses[0])?.label
                      : `${pickupStatuses.length} selected`}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-1 bg-popover border-border" align="start">
              {/* All toggle */}
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer",
                  (pickupStatuses.length === 0 || pickupStatuses.length === PICKUP_STATUS_OPTIONS.length) && "font-medium"
                )}
                onClick={() => {
                  if (pickupStatuses.length === PICKUP_STATUS_OPTIONS.length) {
                    onPickupStatusesChange([])
                  } else {
                    onPickupStatusesChange(PICKUP_STATUS_OPTIONS.map(o => o.value))
                  }
                }}
              >
                <div className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  (pickupStatuses.length === 0 || pickupStatuses.length === PICKUP_STATUS_OPTIONS.length)
                    ? "bg-primary text-primary-foreground"
                    : "opacity-50"
                )}>
                  {(pickupStatuses.length === 0 || pickupStatuses.length === PICKUP_STATUS_OPTIONS.length) && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
                All
              </button>
              {PICKUP_STATUS_OPTIONS.map((option) => {
                const isSelected = pickupStatuses.includes(option.value)
                return (
                  <button
                    type="button"
                    key={option.value}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                    onClick={() => {
                      if (isSelected) {
                        onPickupStatusesChange(pickupStatuses.filter(s => s !== option.value))
                      } else {
                        onPickupStatusesChange([...pickupStatuses, option.value])
                      }
                    }}
                  >
                    <div className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    {option.label}
                  </button>
                )
              })}
            </PopoverContent>
          </Popover>
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
