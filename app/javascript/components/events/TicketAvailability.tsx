import React from "react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import I18n from "@/stores/locales"

interface TicketAvailabilityProps {
  remaining: number
  total?: number
  title: string
  className?: string
}

export function TicketAvailability({ remaining, total, title, className }: TicketAvailabilityProps) {
  if (!Number.isFinite(remaining) || typeof total !== "number" || !Number.isFinite(total) || total < 0) return null

  const available = Math.max(0, remaining)
  const capacity = Math.max(available, total)
  const percentage = capacity > 0 ? available / capacity * 100 : 0
  const status = percentage > 70 ? "high" : percentage > 25 ? "medium" : available > 0 ? "low" : "sold_out"
  const color = status === "high" ? "#7ac238" : status === "medium" ? "#ffcc00" : "#ef4444"

  return (
    <Progress
      value={percentage}
      className={cn("h-1.5 bg-gray-600", className)}
      aria-label={I18n.t("events.purchase_form.availability.label", { title })}
      aria-valuetext={I18n.t(`events.purchase_form.availability.${status}`)}
      indicatorStyle={{ backgroundColor: color, borderRadius: "9999px" }}
    />
  )
}
