import React from "react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import I18n from "@/stores/locales"

interface TicketAvailabilityProps {
  remaining: number
  total?: number
  title: string
  className?: string
  color?: string
  trackColor?: string
  textColor?: string
}

export function TicketAvailability({ remaining, total, title, className, color, trackColor, textColor }: TicketAvailabilityProps) {
  if (!Number.isFinite(remaining)) return null

  const available = Math.max(0, remaining)
  const hasTotal = typeof total === "number" && Number.isFinite(total) && total >= 0
  const capacity = hasTotal ? Math.max(available, total) : available
  const percentage = capacity > 0 ? available / capacity * 100 : 0
  const label = hasTotal
    ? I18n.t("events.purchase_form.availability.remaining", { available, total: capacity })
    : I18n.t("events.purchase_form.available_tickets", { count: available })

  return (
    <div className={cn("w-32 max-w-full space-y-2 text-xs text-muted-foreground sm:w-44", className)} style={{ color: textColor }}>
      <div className="tabular-nums">{label}</div>
      {hasTotal && (
        <Progress
          value={percentage}
          className="h-1.5"
          aria-label={I18n.t("events.purchase_form.availability.label", { title })}
          aria-valuetext={label}
          style={{ backgroundColor: trackColor }}
          indicatorStyle={{ backgroundColor: color }}
        />
      )}
    </div>
  )
}
