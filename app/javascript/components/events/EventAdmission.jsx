import React from "react"
import { get, patch, post } from "@rails/request.js"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Loader2,
  QrCode,
  RefreshCcw,
  ScanLine,
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

export default function EventAdmission() {
  const { slug } = useParams()
  const { toast } = useToast()
  const scannerElementId = `event-admission-scanner-${slug || "event"}`

  const scannerRef = React.useRef(null)
  const scannerStartedRef = React.useRef(false)
  const scannerPausedRef = React.useRef(false)
  const lookupPendingRef = React.useRef(false)
  const lastDecodedRef = React.useRef({ value: "", at: 0 })

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

  const applyPayload = React.useCallback((payload) => {
    if (payload?.event) setEventInfo(payload.event)
    if (payload?.summary) setSummary(payload.summary)
    if (Array.isArray(payload?.recent_activity)) setRecentActivity(payload.recent_activity)
    if (payload && Object.prototype.hasOwnProperty.call(payload, "ticket")) {
      setTicketResult(payload.ticket)
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

  const lookupTicket = React.useCallback(async (code, source = "scanner") => {
    if (!code?.trim()) return

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
        if (payload.ticket?.admission_status === "valid") {
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
  }, [applyPayload, pauseScanner, slug])

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
          void lookupTicket(decodedText, "scanner")
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
  }, [lookupTicket, scannerElementId])

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
    if (loadingPage || isUnauthorized) return undefined

    void startScanner()

    return () => {
      void stopScanner(true)
    }
  }, [isUnauthorized, loadingPage, startScanner, stopScanner])

  const handleManualSubmit = async (event) => {
    event.preventDefault()
    await lookupTicket(manualCode, "manual")
  }

  const handleToggleCheckIn = async () => {
    if (!ticketResult) return

    setIsUpdating(true)

    try {
      const response = await patch(`/events/${slug}/admission.json`, {
        body: JSON.stringify({
          signed_ticket_id: ticketResult.signed_ticket_id,
          checked_in: !ticketResult.checked_in,
        }),
        contentType: "application/json",
      })
      const payload = await response.json

      applyPayload(payload)

      if (response.ok) {
        const nextCheckedIn = payload.ticket?.checked_in
        toast({
          title: nextCheckedIn
            ? I18n.t("events.admission.toast.checked_in", { defaultValue: "Ingreso registrado" })
            : I18n.t("events.admission.toast.unchecked", { defaultValue: "Registro revertido" }),
          description: payload.ticket?.attendee_email,
        })
        vibrate(nextCheckedIn ? [90] : [40, 50, 40])
        return
      }

      toast({
        title: I18n.t("events.admission.toast.error_title", { defaultValue: "No se pudo actualizar" }),
        description: payload.errors?.join(", ") || payload.error || I18n.t("events.admission.toast.error_description", { defaultValue: "Intenta nuevamente" }),
        variant: "destructive",
      })
    } catch (error) {
      console.error("Error updating admission:", error)
      toast({
        title: I18n.t("events.admission.toast.error_title", { defaultValue: "No se pudo actualizar" }),
        description: I18n.t("events.admission.toast.network_error", { defaultValue: "La conexion fallo mientras cambiabamos el estado del ticket" }),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleNextScan = async () => {
    setTicketResult(null)
    setLookupError("")
    await resumeScanner()
  }

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
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-zinc-400">
              <ScanLine className="h-4 w-4" />
              {I18n.t("events.admission.label", { defaultValue: "Modo admision" })}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{eventInfo?.title}</h1>
            <div className="text-sm text-zinc-400">
              {[eventInfo?.event_dates, eventInfo?.location].filter(Boolean).join(" • ")}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" className="bg-white/10 text-white hover:bg-white/15">
              <Link to={`/events/${slug}/edit/attendees`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {I18n.t("events.admission.back_to_attendees", { defaultValue: "Volver a asistentes" })}
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-transparent text-white hover:bg-white/10"
              onClick={() => {
                if (cameraState === "active") {
                  void pauseScanner()
                } else {
                  void resumeScanner()
                }
              }}
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

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

        <Card className="overflow-hidden border-white/10 bg-zinc-950/75 text-zinc-100 shadow-2xl">
          <CardContent className="grid gap-0 p-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <div className="border-b border-white/10 p-4 sm:p-6 lg:border-b-0 lg:border-r">
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
                <div className="relative aspect-[4/5] min-h-[360px] bg-zinc-950">
                  <div
                    id={scannerElementId}
                    className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
                  />

                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(9,9,11,0.18),rgba(9,9,11,0.28))]" />
                  <div className="pointer-events-none absolute inset-6 rounded-[24px] border border-white/8">
                    <div className="absolute left-0 top-0 h-14 w-14 rounded-tl-[24px] border-l-4 border-t-4 border-emerald-400" />
                    <div className="absolute right-0 top-0 h-14 w-14 rounded-tr-[24px] border-r-4 border-t-4 border-emerald-400" />
                    <div className="absolute bottom-0 left-0 h-14 w-14 rounded-bl-[24px] border-b-4 border-l-4 border-emerald-400" />
                    <div className="absolute bottom-0 right-0 h-14 w-14 rounded-br-[24px] border-b-4 border-r-4 border-emerald-400" />
                    <div className="absolute left-6 right-6 top-1/2 h-px -translate-y-1/2 bg-emerald-400/70 shadow-[0_0_18px_rgba(52,211,153,0.55)]" />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={manualCode}
                    onChange={(event) => setManualCode(event.target.value)}
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
                  className="h-12 border-white/10 bg-transparent text-white hover:bg-white/10"
                  onClick={() => {
                    setLookupError("")
                    setTicketResult(null)
                    void resumeScanner()
                  }}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {I18n.t("events.admission.actions.scan_next", { defaultValue: "Escanear siguiente" })}
                </Button>
              </div>

              {cameraError && (
                <Alert className="mt-4 border-amber-500/30 bg-amber-500/10 text-amber-50">
                  <CircleAlert className="h-4 w-4 text-amber-300" />
                  <AlertTitle>{I18n.t("events.admission.errors.camera_title", { defaultValue: "Camara no disponible" })}</AlertTitle>
                  <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex flex-col gap-4 bg-zinc-900/60 p-4 sm:p-6">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {I18n.t("events.admission.validation.label", { defaultValue: "Validacion" })}
                </div>
                <h2 className="mt-1 text-xl font-semibold">
                  {I18n.t("events.admission.validation.title", { defaultValue: "Resultado del ultimo QR" })}
                </h2>
              </div>

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
                      onClick={handleToggleCheckIn}
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
                      className="h-12 border-white/10 bg-transparent text-white hover:bg-white/10"
                      onClick={handleNextScan}
                    >
                      <ScanLine className="mr-2 h-4 w-4" />
                      {I18n.t("events.admission.actions.scan_next", { defaultValue: "Escanear siguiente" })}
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
