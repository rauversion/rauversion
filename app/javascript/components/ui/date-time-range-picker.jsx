import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format, isValid } from "date-fns"
// import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

const formatTimeSafely = (dateString) => {
  if (!dateString) return "00:00"
  try {
    const date = new Date(dateString)
    return isValid(date) ? format(date, "HH:mm") : "00:00"
  } catch (error) {
    console.error('Error formatting time:', error)
    return "00:00"
  }
}

const formatDateSafely = (dateString) => {
  if (!dateString) return null
  try {
    const date = new Date(dateString)
    return isValid(date) ? date : null
  } catch (error) {
    console.error('Error formatting date:', error)
    return null
  }
}

export function DateTimeRangePicker({
  className,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) {
  const [date, setDate] = React.useState({
    from: formatDateSafely(startDate) || new Date(),
    to: formatDateSafely(endDate) || addDays(new Date(), 1),
  })

  const [startTime, setStartTime] = React.useState(formatTimeSafely(startDate))
  const [endTime, setEndTime] = React.useState(formatTimeSafely(endDate))

  React.useEffect(() => {
    setDate({
      from: formatDateSafely(startDate) || date.from,
      to: formatDateSafely(endDate) || date.to,
    })
    setStartTime(formatTimeSafely(startDate))
    setEndTime(formatTimeSafely(endDate))
  }, [startDate, endDate])

  const handleDateSelect = (range) => {
    if (!range) return
    setDate(range)
    
    // Combine date and time for start
    if (range.from) {
      const [hours, minutes] = startTime.split(':')
      const newStartDate = new Date(range.from)
      newStartDate.setHours(parseInt(hours), parseInt(minutes))
      onStartDateChange(newStartDate.toISOString())
    }
    
    // Combine date and time for end
    if (range.to) {
      const [hours, minutes] = endTime.split(':')
      const newEndDate = new Date(range.to)
      newEndDate.setHours(parseInt(hours), parseInt(minutes))
      onEndDateChange(newEndDate.toISOString())
    }
  }

  const handleStartTimeChange = (e) => {
    const newTime = e.target.value
    setStartTime(newTime)
    if (date.from) {
      const [hours, minutes] = newTime.split(':')
      const newDate = new Date(date.from)
      newDate.setHours(parseInt(hours), parseInt(minutes))
      onStartDateChange(newDate.toISOString())
    }
  }

  const handleEndTimeChange = (e) => {
    const newTime = e.target.value
    setEndTime(newTime)
    if (date.to) {
      const [hours, minutes] = newTime.split(':')
      const newDate = new Date(date.to)
      newDate.setHours(parseInt(hours), parseInt(minutes))
      onEndDateChange(newDate.toISOString())
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Start Time</label>
          <Input
            type="time"
            value={startTime}
            onChange={handleStartTimeChange}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">End Time</label>
          <Input
            type="time"
            value={endTime}
            onChange={handleEndTimeChange}
          />
        </div>
      </div>
    </div>
  )
}
