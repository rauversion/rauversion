import React from "react"
import { get, patch, post } from "@rails/request.js"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  BarChart3,
  Camera,
  CameraOff,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Loader2,
  QrCode,
  RefreshCcw,
  ScanLine,
  Settings2,
  ShieldX,
  Ticket,
  UserRound,
} from "lucide-react"

import I18n from "@/stores/locales"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"

const AUTO_SCAN_RESUME_DELAY_MS = 1400
const AUTO_MODE_STORAGE_KEY = "event-admission-auto-mode"

function currentLocale() {
  return I18n.locale?.startsWith("es") ? "es-CL" : "en-US"
}

function formatDateTime(value) {
  if (!value) return null

  return new Intl.DateTimeFormat(currentLocale(), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatMoney(amount, currency) {
  if (amount == null || !currency) return null

  try {
    return new Intl.NumberFormat(currentLocale(), {
      style: "currency",
      currency: currency.toUpperCase(),
      currencyDisplay: "code",
      minimumFractionDigits: Number.isInteger(Number(amount)) ? 0 : 2,
      maximumFractionDigits: Number.isInteger(Number(amount)) ? 0 : 2,
    }).format(Number(amount))
  } catch {
    return `${currency.toUpperCase()} ${amount}`
  }
}

function vibrate(pattern) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern)
  }
}

function createAudioContext() {
  if (typeof window === "undefined") return null

  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  return AudioContextClass ? new AudioContextClass() : null
}

const STATUS_CONFIG = {
  valid: {
    label: I18n.t("events.admission.status.valid", { defaultValue: "Listo para ingresar" }),
    badgeVariant: "success",
    surfaceClassName: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
    accentClassName: "text-emerald-300",
    buttonLabel: I18n.t("events.admission.actions.check_in", { defaultValue: "Registrar ingreso" }),
  },
  already_checked_in: {
    label: I18n.t("events.admission.status.already_checked_in", { defaultValue: "Ingreso ya registrado" }),
    badgeVariant: "secondary",
    surfaceClassName: "border-amber-500/30 bg-amber-500/10 text-amber-50",
    accentClassName: "text-amber-300",
    buttonLabel: I18n.t("events.admission.actions.undo_check_in", { defaultValue: "Quitar registro" }),
  },
  pending_payment: {
    label: I18n.t("events.admission.status.pending_payment", { defaultValue: "Pago pendiente" }),
    badgeVariant: "secondary",
    surfaceClassName: "border-sky-500/30 bg-sky-500/10 text-sky-50",
    accentClassName: "text-sky-300",
    buttonLabel: null,
  },
  refunded: {
    label: I18n.t("events.admission.status.refunded", { defaultValue: "Ticket reembolsado" }),
    badgeVariant: "destructive",
    surfaceClassName: "border-destructive/40 bg-destructive/15 text-destructive-foreground",
    accentClassName: "text-destructive-foreground",
    buttonLabel: null,
  },
}

function SummaryStat({ label, value, tone = "default" }) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        tone === "success" && "border-emerald-500/20 bg-emerald-500/10",
        tone === "warning" && "border-amber-500/20 bg-amber-500/10",
        tone === "default" && "border-white/10 bg-white/5"
      )}
    >
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-white">{value ?? 0}</div>
    </div>
  )
}

function SummaryStatsGrid({ summary, className, compact = false }) {
  return (
    <div
      className={cn(
        "grid gap-3",
        compact ? "grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      <SummaryStat
        label={I18n.t("events.admission.summary.checked_in", { defaultValue: "Registrados" })}
        value={summary?.checked_in_count}
        tone="success"
      />
      <SummaryStat
        label={I18n.t("events.admission.summary.remaining", { defaultValue: "Por ingresar" })}
        value={summary?.remaining_count}
        tone="warning"
      />
      <SummaryStat
        label={I18n.t("events.admission.summary.total_paid", { defaultValue: "Pagados" })}
        value={summary?.total_paid_count}
      />
      <SummaryStat
        label={I18n.t("events.admission.summary.refunded", { defaultValue: "Reembolsados" })}
        value={summary?.refunded_count}
      />
    </div>
  )
}

function SettingsPanelContent({
  autoMode,
  cameraError,
  cameraState,
  isLookupPending,
  manualCode,
  onAutoModeChange,
  onManualCodeChange,
  onManualSubmit,
  onNextScan,
  onToggleCamera,
  showCameraControl = false,
}) {
  return (
    <div className="space-y-4">
      {showCameraControl && (
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
          onClick={onToggleCamera}
        >
          {cameraState === "active" ? (
            <>
              <CameraOff className="mr-2 h-4 w-4" />
              {I18n.t("events.admission.actions.pause_camera", { defaultValue: "Pausar camara" })}
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              {I18n.t("events.admission.actions.resume_camera", { defaultValue: "Activar camara" })}
            </>
          )}
        </Button>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium text-white">
            {I18n.t("events.admission.auto_mode.title", { defaultValue: "Modo automático" })}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            {I18n.t("events.admission.auto_mode.description", { defaultValue: "Si el QR es válido, registra el ingreso, hace sonar un pling y vuelve solo a escanear." })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-300">
            {autoMode
              ? I18n.t("events.admission.auto_mode.on", { defaultValue: "Activado" })
              : I18n.t("events.admission.auto_mode.off", { defaultValue: "Manual" })}
          </span>
          <Switch checked={autoMode} onCheckedChange={onAutoModeChange} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <form onSubmit={onManualSubmit} className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={manualCode}
            onChange={onManualCodeChange}
            placeholder={I18n.t("events.admission.manual.placeholder", { defaultValue: "Pega el enlace del ticket o el codigo firmado" })}
            className="h-12 border-white/10 bg-white/5 text-white placeholder:text-zinc-500"
          />
          <Button type="submit" disabled={isLookupPending} className="h-12 whitespace-nowrap">
            {isLookupPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {I18n.t("events.admission.manual.submit", { defaultValue: "Validar codigo" })}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          className="h-12 border-emerald-400/30 bg-emerald-400/10 text-emerald-50 hover:bg-emerald-400/15"
          onClick={onNextScan}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          {I18n.t("events.admission.actions.scan_next", { defaultValue: "Escanear siguiente" })}
        </Button>
      </div>

      {cameraError && (
        <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-50">
          <CircleAlert className="h-4 w-4 text-amber-300" />
          <AlertTitle>{I18n.t("events.admission.errors.camera_title", { defaultValue: "Camara no disponible" })}</AlertTitle>
          <AlertDescription>{cameraError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function ValidationPanelContent({
  lookupError,
  ticketResult,
  statusConfig,
  isUpdating,
  onNextScan,
  onToggleCheckIn,
  nextButtonClassName,
}) {
  return (
    <div className="space-y-4">
      {lookupError && !ticketResult && (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/15 text-destructive-foreground">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>{I18n.t("events.admission.errors.invalid_title", { defaultValue: "No valido" })}</AlertTitle>
          <AlertDescription>{lookupError}</AlertDescription>
        </Alert>
      )}

      {!ticketResult && !lookupError && (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
          <div className="flex items-center gap-3 text-zinc-200">
            <QrCode className="h-5 w-5 text-emerald-300" />
            <span className="font-medium">
              {I18n.t("events.admission.empty.title", { defaultValue: "Listo para recibir tickets" })}
            </span>
          </div>
          <p className="mt-3 leading-6">
            {I18n.t("events.admission.empty.description", { defaultValue: "Escanea el QR desde el movil del asistente. Tambien puedes pegar manualmente el enlace del ticket si la camara falla." })}
          </p>
        </div>
      )}

      {ticketResult && statusConfig && (
        <div className="space-y-4">
          <div className={cn("rounded-3xl border p-5 shadow-lg", statusConfig.surfaceClassName)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <Badge variant={statusConfig.badgeVariant} className="shadow-none">
                  {statusConfig.label}
                </Badge>
                <div className="text-2xl font-semibold tracking-tight">
                  {ticketResult.attendee_name || ticketResult.attendee_email}
                </div>
                <div className="text-sm opacity-90">{ticketResult.attendee_email}</div>
              </div>

              <div className={cn("text-right text-sm font-medium", statusConfig.accentClassName)}>
                <div>{ticketResult.ticket_title}</div>
                {ticketResult.ticket_price != null && (
                  <div className="mt-1 opacity-90">
                    {formatMoney(ticketResult.ticket_price, ticketResult.ticket_currency)}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm">
              <div className="font-medium">
                {ticketResult.admission_message}
              </div>
              {ticketResult.checked_in_at && (
                <div className="mt-2 flex items-center gap-2 opacity-90">
                  <Clock3 className="h-4 w-4" />
                  <span>
                    {I18n.t("events.admission.checked_in_at", { defaultValue: "Registrado" })}: {formatDateTime(ticketResult.checked_in_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                <UserRound className="h-4 w-4" />
                {I18n.t("events.admission.details.attendee", { defaultValue: "Asistente" })}
              </div>
              <div className="mt-3 text-sm text-zinc-200">{ticketResult.attendee_email}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                <Ticket className="h-4 w-4" />
                {I18n.t("events.admission.details.purchase_state", { defaultValue: "Estado" })}
              </div>
              <div className="mt-3 text-sm capitalize text-zinc-200">{ticketResult.purchase_state}</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              className="h-12 flex-1"
              disabled={!ticketResult.can_toggle_check_in || isUpdating}
              onClick={onToggleCheckIn}
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : ticketResult.checked_in ? (
                <RefreshCcw className="mr-2 h-4 w-4" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {statusConfig.buttonLabel || I18n.t("events.admission.actions.disabled", { defaultValue: "No disponible" })}
            </Button>

            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-12 border-emerald-400/30 bg-emerald-400/10 text-emerald-50 hover:bg-emerald-400/15",
                nextButtonClassName
              )}
              onClick={onNextScan}
            >
              <ScanLine className="mr-2 h-4 w-4" />
              {I18n.t("events.admission.actions.scan_next", { defaultValue: "Escanear siguiente" })}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function RecentActivityPanel({ recentActivity, className }) {
  return (
    <div className={cn("rounded-3xl border border-white/10 bg-white/[0.03] p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            {I18n.t("events.admission.recent.label", { defaultValue: "Actividad" })}
          </div>
          <h3 className="mt-1 text-lg font-semibold">
            {I18n.t("events.admission.recent.title", { defaultValue: "Ultimos ingresos" })}
          </h3>
        </div>
        <Badge variant="secondary" className="border-white/10 bg-white/10 text-white">
          {recentActivity.length}
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        {recentActivity.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-zinc-500">
            {I18n.t("events.admission.recent.empty", { defaultValue: "Todavia no hay ingresos registrados en esta sesion." })}
          </div>
        )}

        {recentActivity.map((activity) => (
          <div
            key={`${activity.id}-${activity.checked_in_at}`}
            className="flex items-start justify-between gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-zinc-100">
                {activity.attendee_name || activity.attendee_email}
              </div>
              <div className="truncate text-sm text-zinc-400">{activity.ticket_title}</div>
            </div>
            <div className="shrink-0 text-right text-xs text-zinc-500">
              {formatDateTime(activity.checked_in_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EventAdmission() {
  const { slug } = useParams()
  const { toast } = useToast()
  const scannerElementId = `event-admission-scanner-${slug || "event"}`

  const scannerRef = React.useRef(null)
  const scannerStartedRef = React.useRef(false)
  const scannerPausedRef = React.useRef(false)
  const lookupPendingRef = React.useRef(false)
  const lastDecodedRef = React.useRef({ value: "", at: 0 })
  const lookupTicketRef = React.useRef(null)
  const nextScanTimeoutRef = React.useRef(null)
  const audioContextRef = React.useRef(null)

  const [eventInfo, setEventInfo] = React.useState(null)
  const [summary, setSummary] = React.useState(null)
  const [recentActivity, setRecentActivity] = React.useState([])
  const [ticketResult, setTicketResult] = React.useState(null)
  const [cameraState, setCameraState] = React.useState("idle")
  const [cameraError, setCameraError] = React.useState("")
  const [lookupError, setLookupError] = React.useState("")
  const [manualCode, setManualCode] = React.useState("")
  const [loadingPage, setLoadingPage] = React.useState(true)
  const [isLookupPending, setIsLookupPending] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [isUnauthorized, setIsUnauthorized] = React.useState(false)
  const [mobileStatsOpen, setMobileStatsOpen] = React.useState(false)
  const [mobileSettingsOpen, setMobileSettingsOpen] = React.useState(false)
  const [mobileResultOpen, setMobileResultOpen] = React.useState(false)
  const [autoMode, setAutoMode] = React.useState(() => {
    if (typeof window === "undefined") return true

    const storedValue = window.localStorage.getItem(AUTO_MODE_STORAGE_KEY)
    return storedValue === null ? true : storedValue === "true"
  })

  const applyPayload = React.useCallback((payload) => {
    if (payload?.event) setEventInfo(payload.event)
    if (payload?.summary) setSummary(payload.summary)
    if (Array.isArray(payload?.recent_activity)) setRecentActivity(payload.recent_activity)
    if (payload && Object.prototype.hasOwnProperty.call(payload, "ticket")) {
      setTicketResult(payload.ticket)
    }
  }, [])

  const clearNextScanTimeout = React.useCallback(() => {
    if (nextScanTimeoutRef.current) {
      window.clearTimeout(nextScanTimeoutRef.current)
      nextScanTimeoutRef.current = null
    }
  }, [])

  const primeAudioContext = React.useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = createAudioContext()
      }

      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume()
      }
    } catch (error) {
      console.error("Error priming admission audio:", error)
    }
  }, [])

  const playSuccessTone = React.useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = createAudioContext()
      }

      const context = audioContextRef.current
      if (!context) return

      if (context.state === "suspended") {
        await context.resume()
      }

      const now = context.currentTime
      const masterGain = context.createGain()
      masterGain.gain.setValueAtTime(0.0001, now)
      masterGain.gain.exponentialRampToValueAtTime(0.16, now + 0.015)
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42)
      masterGain.connect(context.destination)

      const primaryOscillator = context.createOscillator()
      primaryOscillator.type = "triangle"
      primaryOscillator.frequency.setValueAtTime(1318.5, now)
      primaryOscillator.frequency.exponentialRampToValueAtTime(1760, now + 0.16)
      primaryOscillator.connect(masterGain)
      primaryOscillator.start(now)
      primaryOscillator.stop(now + 0.26)

      const sparkleGain = context.createGain()
      sparkleGain.gain.setValueAtTime(0.0001, now + 0.025)
      sparkleGain.gain.exponentialRampToValueAtTime(0.09, now + 0.05)
      sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24)
      sparkleGain.connect(context.destination)

      const sparkleOscillator = context.createOscillator()
      sparkleOscillator.type = "sine"
      sparkleOscillator.frequency.setValueAtTime(2093, now + 0.025)
      sparkleOscillator.frequency.exponentialRampToValueAtTime(2637, now + 0.18)
      sparkleOscillator.connect(sparkleGain)
      sparkleOscillator.start(now + 0.025)
      sparkleOscillator.stop(now + 0.24)
    } catch (error) {
      console.error("Error playing admission success tone:", error)
    }
  }, [])

  const stopScanner = React.useCallback(async (shouldClear = false) => {
    const scanner = scannerRef.current
    if (!scanner) return

    if (scannerStartedRef.current) {
      try {
        await scanner.stop()
      } catch {
        // Ignore stop errors from already-stopped sessions.
      }
    }

    scannerStartedRef.current = false
    scannerPausedRef.current = false

    if (shouldClear && typeof scanner.clear === "function") {
      try {
        await scanner.clear()
      } catch {
        // Ignore clear errors during teardown.
      }
    }
  }, [])

  const pauseScanner = React.useCallback(async () => {
    const scanner = scannerRef.current
    if (!scanner || !scannerStartedRef.current) return

    if (typeof scanner.pause === "function") {
      scanner.pause(true)
      scannerPausedRef.current = true
      setCameraState("paused")
      return
    }

    await stopScanner()
    scannerPausedRef.current = true
    setCameraState("paused")
  }, [stopScanner])

  const startScanner = React.useCallback(async () => {
    if (scannerStartedRef.current && !scannerPausedRef.current) return

    setCameraError("")
    setCameraState("loading")

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode")

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerElementId, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          useBarCodeDetectorIfSupported: true,
        })
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1,
        },
        (decodedText) => {
          const now = Date.now()
          if (lookupPendingRef.current) return
          if (
            lastDecodedRef.current.value === decodedText &&
            now - lastDecodedRef.current.at < 1800
          ) {
            return
          }

          lastDecodedRef.current = { value: decodedText, at: now }
          void lookupTicketRef.current?.(decodedText, "scanner")
        },
        () => {}
      )

      scannerStartedRef.current = true
      scannerPausedRef.current = false
      setCameraState("active")
    } catch (error) {
      console.error("Error starting QR scanner:", error)
      scannerStartedRef.current = false
      scannerPausedRef.current = false
      setCameraState("error")
      setCameraError(I18n.t("events.admission.errors.camera", { defaultValue: "No pudimos acceder a la camara. Puedes validar pegando el enlace del ticket manualmente." }))
    }
  }, [scannerElementId])

  const resumeScanner = React.useCallback(async () => {
    const scanner = scannerRef.current

    if (scanner && scannerPausedRef.current && typeof scanner.resume === "function") {
      scanner.resume()
      scannerPausedRef.current = false
      scannerStartedRef.current = true
      setCameraState("active")
      setCameraError("")
      return
    }

    await startScanner()
  }, [startScanner])

  const queueNextScan = React.useCallback((delay = AUTO_SCAN_RESUME_DELAY_MS) => {
    clearNextScanTimeout()
    nextScanTimeoutRef.current = window.setTimeout(() => {
      nextScanTimeoutRef.current = null
      setTicketResult(null)
      setLookupError("")
      void resumeScanner()
    }, delay)
  }, [clearNextScanTimeout, resumeScanner])

  const handleToggleCheckIn = React.useCallback(async (ticket = ticketResult, options = {}) => {
    if (!ticket) return false

    const { autoAdvance = false } = options

    clearNextScanTimeout()
    setIsUpdating(true)

    try {
      const response = await patch(`/events/${slug}/admission.json`, {
        body: JSON.stringify({
          signed_ticket_id: ticket.signed_ticket_id,
          checked_in: !ticket.checked_in,
        }),
        contentType: "application/json",
      })
      const payload = await response.json

      applyPayload(payload)

      if (response.ok) {
        const nextCheckedIn = payload.ticket?.checked_in

        if (nextCheckedIn) {
          await playSuccessTone()
        }

        toast({
          title: nextCheckedIn
            ? I18n.t("events.admission.toast.checked_in", { defaultValue: "Ingreso registrado" })
            : I18n.t("events.admission.toast.unchecked", { defaultValue: "Registro revertido" }),
          description: payload.ticket?.attendee_email,
          variant: nextCheckedIn ? "success" : undefined,
        })

        vibrate(nextCheckedIn ? [90] : [40, 50, 40])

        if (autoAdvance && nextCheckedIn) {
          queueNextScan()
        }

        return true
      }

      toast({
        title: I18n.t("events.admission.toast.error_title", { defaultValue: "No se pudo actualizar" }),
        description: payload.errors?.join(", ") || payload.error || I18n.t("events.admission.toast.error_description", { defaultValue: "Intenta nuevamente" }),
        variant: "destructive",
      })
      return false
    } catch (error) {
      console.error("Error updating admission:", error)
      toast({
        title: I18n.t("events.admission.toast.error_title", { defaultValue: "No se pudo actualizar" }),
        description: I18n.t("events.admission.toast.network_error", { defaultValue: "La conexion fallo mientras cambiabamos el estado del ticket" }),
        variant: "destructive",
      })
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [applyPayload, clearNextScanTimeout, playSuccessTone, queueNextScan, slug, ticketResult, toast])

  const lookupTicket = React.useCallback(async (code, source = "scanner") => {
    if (!code?.trim()) return

    clearNextScanTimeout()
    lookupPendingRef.current = true
    setIsLookupPending(true)
    setLookupError("")

    if (source === "scanner") {
      await pauseScanner()
    }

    try {
      const response = await post(`/events/${slug}/admission/scan.json`, {
        body: JSON.stringify({ code }),
        contentType: "application/json",
      })
      const payload = await response.json

      applyPayload(payload)

      if (response.ok) {
        const scannedTicket = payload.ticket

        if (
          autoMode &&
          scannedTicket?.admission_status === "valid" &&
          scannedTicket?.can_toggle_check_in &&
          !scannedTicket?.checked_in
        ) {
          await handleToggleCheckIn(scannedTicket, {
            autoAdvance: true,
          })
          return
        }

        if (scannedTicket?.admission_status === "valid") {
          await playSuccessTone()
          toast({
            title: I18n.t("events.admission.toast.validated", { defaultValue: "Ticket válido" }),
            description: scannedTicket.attendee_email,
            variant: "success",
          })
          vibrate([80])
        } else {
          vibrate([40, 40, 40])
        }
        return
      }

      setTicketResult(null)
      setLookupError(payload.error || payload.errors?.join(", ") || I18n.t("events.admission.errors.lookup", { defaultValue: "No pudimos validar este codigo" }))
      vibrate([60, 40, 60])
    } catch (error) {
      console.error("Error validating admission QR:", error)
      setTicketResult(null)
      setLookupError(I18n.t("events.admission.errors.network", { defaultValue: "No pudimos validar el QR. Revisa tu conexion e intenta otra vez." }))
    } finally {
      setIsLookupPending(false)
      lookupPendingRef.current = false
    }
  }, [applyPayload, autoMode, clearNextScanTimeout, handleToggleCheckIn, pauseScanner, slug])

  React.useEffect(() => {
    lookupTicketRef.current = lookupTicket
  }, [lookupTicket])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(AUTO_MODE_STORAGE_KEY, autoMode ? "true" : "false")
  }, [autoMode])

  React.useEffect(() => {
    const hasFeedback = Boolean(ticketResult || lookupError)

    if (hasFeedback) {
      setMobileSettingsOpen(false)
      setMobileResultOpen(true)
      return
    }

    setMobileResultOpen(false)
  }, [lookupError, ticketResult])

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined

    const activateAudio = () => {
      void primeAudioContext()
    }

    window.addEventListener("pointerdown", activateAudio)
    window.addEventListener("keydown", activateAudio)

    return () => {
      window.removeEventListener("pointerdown", activateAudio)
      window.removeEventListener("keydown", activateAudio)
    }
  }, [primeAudioContext])

  React.useEffect(() => {
    let cancelled = false

    const loadAdmissionPage = async () => {
      setLoadingPage(true)
      setIsUnauthorized(false)

      try {
        const response = await get(`/events/${slug}/admission.json`)
        const payload = await response.json

        if (cancelled) return

        if (response.ok) {
          applyPayload(payload)
          return
        }

        if (response.status === 401) {
          setIsUnauthorized(true)
          setCameraError(payload.error || "Unauthorized")
          return
        }

        setLookupError(payload.error || I18n.t("events.admission.errors.initial", { defaultValue: "No pudimos cargar la vista de admision" }))
      } catch (error) {
        if (cancelled) return
        console.error("Error loading admission page:", error)
        setLookupError(I18n.t("events.admission.errors.initial", { defaultValue: "No pudimos cargar la vista de admision" }))
      } finally {
        if (!cancelled) {
          setLoadingPage(false)
        }
      }
    }

    loadAdmissionPage()

    return () => {
      cancelled = true
    }
  }, [applyPayload, slug])

  React.useEffect(() => {
    return () => {
      clearNextScanTimeout()

      if (audioContextRef.current && typeof audioContextRef.current.close === "function") {
        void audioContextRef.current.close()
      }
    }
  }, [clearNextScanTimeout])

  React.useEffect(() => {
    if (loadingPage || isUnauthorized) return undefined

    void startScanner()

    return () => {
      void stopScanner(true)
    }
  }, [isUnauthorized, loadingPage, startScanner, stopScanner])

  const handleManualSubmit = React.useCallback(async (event) => {
    event.preventDefault()
    await lookupTicket(manualCode, "manual")
  }, [lookupTicket, manualCode])

  const handleNextScan = React.useCallback(async () => {
    clearNextScanTimeout()
    setTicketResult(null)
    setLookupError("")
    await resumeScanner()
  }, [clearNextScanTimeout, resumeScanner])

  const handleCameraToggle = React.useCallback(() => {
    if (cameraState === "active") {
      void pauseScanner()
      return
    }

    void resumeScanner()
  }, [cameraState, pauseScanner, resumeScanner])

  const handleMobileResultOpenChange = React.useCallback((open) => {
    setMobileResultOpen(open)

    if (!open && (ticketResult || lookupError)) {
      void handleNextScan()
    }
  }, [handleNextScan, lookupError, ticketResult])

  if (loadingPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{I18n.t("events.admission.loading", { defaultValue: "Cargando admision..." })}</span>
        </div>
      </div>
    )
  }

  if (isUnauthorized) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
        <div className="mx-auto max-w-3xl">
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/15 text-destructive-foreground">
            <ShieldX className="h-4 w-4" />
            <AlertTitle>{I18n.t("events.admission.unauthorized.title", { defaultValue: "Acceso restringido" })}</AlertTitle>
            <AlertDescription>
              {I18n.t("events.admission.unauthorized.description", { defaultValue: "Solo managers del evento pueden usar esta vista de admision." })}
            </AlertDescription>
          </Alert>
          <Button asChild className="mt-6">
            <Link to={`/events/${slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {I18n.t("events.admission.back_to_event", { defaultValue: "Volver al evento" })}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = ticketResult ? STATUS_CONFIG[ticketResult.admission_status] : null

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_35%),linear-gradient(180deg,_#111827_0%,_#09090b_100%)] px-4 py-4 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-zinc-400">
                <ScanLine className="h-4 w-4" />
                {I18n.t("events.admission.label", { defaultValue: "Modo admision" })}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{eventInfo?.title}</h1>
              <div className="text-sm text-zinc-400">
                {[eventInfo?.event_dates, eventInfo?.location].filter(Boolean).join(" • ")}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 lg:hidden">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setMobileStatsOpen(true)}
                aria-label={I18n.t("events.admission.summary.title", { defaultValue: "Ver estadísticas" })}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setMobileSettingsOpen(true)}
                aria-label={I18n.t("events.admission.settings.title", { defaultValue: "Abrir ajustes" })}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button asChild variant="secondary" className="w-full bg-white/10 text-white hover:bg-white/15 sm:w-auto">
              <Link to={`/events/${slug}/edit/attendees`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {I18n.t("events.admission.back_to_attendees", { defaultValue: "Volver a asistentes" })}
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="hidden border-white/15 bg-transparent text-white hover:bg-white/10 lg:inline-flex"
              onClick={handleCameraToggle}
            >
              {cameraState === "active" ? (
                <>
                  <CameraOff className="mr-2 h-4 w-4" />
                  {I18n.t("events.admission.actions.pause_camera", { defaultValue: "Pausar camara" })}
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  {I18n.t("events.admission.actions.resume_camera", { defaultValue: "Activar camara" })}
                </>
              )}
            </Button>
          </div>
        </div>

        <SummaryStatsGrid summary={summary} className="hidden lg:grid" />

        <Card className="overflow-hidden border-white/10 bg-zinc-950/75 text-zinc-100 shadow-2xl">
          <CardContent className="p-0 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <div className="p-4 sm:p-6 lg:border-r lg:border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {I18n.t("events.admission.scanner.label", { defaultValue: "Scanner" })}
                  </div>
                  <h2 className="mt-1 text-xl font-semibold">
                    {I18n.t("events.admission.scanner.title", { defaultValue: "Apunta al QR del ticket" })}
                  </h2>
                </div>
                <Badge
                  variant={cameraState === "active" ? "success" : "secondary"}
                  className={cn(cameraState === "active" ? "" : "border-white/10 bg-white/10 text-white")}
                >
                  {cameraState === "active"
                    ? I18n.t("events.admission.scanner.active", { defaultValue: "Camara activa" })
                    : cameraState === "loading"
                      ? I18n.t("events.admission.scanner.loading", { defaultValue: "Iniciando..." })
                      : I18n.t("events.admission.scanner.paused", { defaultValue: "En pausa" })}
                </Badge>
              </div>

              <div className="mt-4 overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
                <div className="relative aspect-[3/4] min-h-[300px] bg-zinc-950 sm:aspect-[4/5] sm:min-h-[360px]">
                  <div
                    id={scannerElementId}
                    className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
                  />

                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(9,9,11,0.18),rgba(9,9,11,0.28))]" />
                  <div className="pointer-events-none absolute inset-4 rounded-[24px] border border-white/8 sm:inset-6">
                    <div className="absolute left-0 top-0 h-12 w-12 rounded-tl-[24px] border-l-4 border-t-4 border-emerald-400 sm:h-14 sm:w-14" />
                    <div className="absolute right-0 top-0 h-12 w-12 rounded-tr-[24px] border-r-4 border-t-4 border-emerald-400 sm:h-14 sm:w-14" />
                    <div className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-[24px] border-b-4 border-l-4 border-emerald-400 sm:h-14 sm:w-14" />
                    <div className="absolute bottom-0 right-0 h-12 w-12 rounded-br-[24px] border-b-4 border-r-4 border-emerald-400 sm:h-14 sm:w-14" />
                    <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-emerald-400/70 shadow-[0_0_18px_rgba(52,211,153,0.55)] sm:left-6 sm:right-6" />
                  </div>
                </div>
              </div>

              {cameraError && (
                <Alert className="mt-4 border-amber-500/30 bg-amber-500/10 text-amber-50 lg:hidden">
                  <CircleAlert className="h-4 w-4 text-amber-300" />
                  <AlertTitle>{I18n.t("events.admission.errors.camera_title", { defaultValue: "Camara no disponible" })}</AlertTitle>
                  <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
              )}

              <div className="mt-4 lg:hidden">
                <Button
                  type="button"
                  className="h-14 w-full rounded-2xl bg-emerald-400 text-base font-semibold text-zinc-950 shadow-[0_18px_45px_rgba(52,211,153,0.22)] hover:bg-emerald-300"
                  onClick={() => void handleNextScan()}
                >
                  <ScanLine className="mr-2 h-5 w-5" />
                  {I18n.t("events.admission.actions.scan_next", { defaultValue: "Escanear siguiente" })}
                </Button>
              </div>

              <div className="mt-4 hidden lg:block">
                <SettingsPanelContent
                  autoMode={autoMode}
                  cameraError={cameraError}
                  cameraState={cameraState}
                  isLookupPending={isLookupPending}
                  manualCode={manualCode}
                  onAutoModeChange={(checked) => {
                    void primeAudioContext()
                    setAutoMode(checked)
                  }}
                  onManualCodeChange={(event) => setManualCode(event.target.value)}
                  onManualSubmit={handleManualSubmit}
                  onNextScan={() => void handleNextScan()}
                  onToggleCamera={handleCameraToggle}
                />
              </div>
            </div>

            <div className="hidden flex-col gap-4 bg-zinc-900/60 p-4 sm:p-6 lg:flex">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {I18n.t("events.admission.validation.label", { defaultValue: "Validacion" })}
                </div>
                <h2 className="mt-1 text-xl font-semibold">
                  {I18n.t("events.admission.validation.title", { defaultValue: "Resultado del ultimo QR" })}
                </h2>
              </div>

              <ValidationPanelContent
                lookupError={lookupError}
                ticketResult={ticketResult}
                statusConfig={statusConfig}
                isUpdating={isUpdating}
                onNextScan={() => void handleNextScan()}
                onToggleCheckIn={() => void handleToggleCheckIn()}
              />

              <RecentActivityPanel recentActivity={recentActivity} />
            </div>
          </CardContent>
        </Card>

        <Drawer open={mobileStatsOpen} onOpenChange={setMobileStatsOpen}>
          <DrawerContent className="max-h-[85vh] overflow-hidden rounded-t-[28px] border-white/10 bg-zinc-950 text-zinc-100">
            <DrawerHeader className="text-left">
              <DrawerTitle>{I18n.t("events.admission.summary.title", { defaultValue: "Estadísticas" })}</DrawerTitle>
              <DrawerDescription className="text-zinc-400">
                {I18n.t("events.admission.summary.description", { defaultValue: "Resumen de admisión y actividad sin tapar el visor." })}
              </DrawerDescription>
            </DrawerHeader>
            <div className="space-y-4 overflow-y-auto px-4 pb-6">
              <SummaryStatsGrid summary={summary} compact />
              <RecentActivityPanel recentActivity={recentActivity} />
            </div>
          </DrawerContent>
        </Drawer>

        <Drawer open={mobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
          <DrawerContent className="max-h-[85vh] overflow-hidden rounded-t-[28px] border-white/10 bg-zinc-950 text-zinc-100">
            <DrawerHeader className="text-left">
              <DrawerTitle>{I18n.t("events.admission.settings.title", { defaultValue: "Ajustes de admisión" })}</DrawerTitle>
              <DrawerDescription className="text-zinc-400">
                {I18n.t("events.admission.settings.description", { defaultValue: "Controla la cámara, el modo automático y la validación manual." })}
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-6">
              <SettingsPanelContent
                autoMode={autoMode}
                cameraError={cameraError}
                cameraState={cameraState}
                isLookupPending={isLookupPending}
                manualCode={manualCode}
                onAutoModeChange={(checked) => {
                  void primeAudioContext()
                  setAutoMode(checked)
                }}
                onManualCodeChange={(event) => setManualCode(event.target.value)}
                onManualSubmit={handleManualSubmit}
                onNextScan={() => void handleNextScan()}
                onToggleCamera={handleCameraToggle}
                showCameraControl
              />
            </div>
          </DrawerContent>
        </Drawer>

        <Drawer open={mobileResultOpen} onOpenChange={handleMobileResultOpenChange}>
          <DrawerContent className="max-h-[85vh] overflow-hidden rounded-t-[28px] border-white/10 bg-zinc-950 text-zinc-100">
            <DrawerHeader className="text-left">
              <DrawerTitle>{I18n.t("events.admission.validation.title", { defaultValue: "Resultado del ultimo QR" })}</DrawerTitle>
              <DrawerDescription className="text-zinc-400">
                {ticketResult
                  ? ticketResult.ticket_title
                  : I18n.t("events.admission.validation.description", { defaultValue: "Revisa el estado y cierra la hoja para seguir escaneando." })}
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-6">
              <ValidationPanelContent
                lookupError={lookupError}
                ticketResult={ticketResult}
                statusConfig={statusConfig}
                isUpdating={isUpdating}
                onNextScan={() => void handleNextScan()}
                onToggleCheckIn={() => void handleToggleCheckIn()}
                nextButtonClassName="border-transparent bg-emerald-400 text-zinc-950 shadow-[0_16px_36px_rgba(52,211,153,0.22)] hover:bg-emerald-300"
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
