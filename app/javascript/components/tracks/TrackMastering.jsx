import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { get, post } from "@rails/request.js"
import {
  AlertTriangle,
  ArrowLeft,
  AudioLines,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useActionCable } from "@/hooks/useActionCable"
import { useToast } from "@/hooks/use-toast"

const FALLBACK_PROFILES = [
  {
    key: "streaming_clean",
    label_es: "Streaming clean",
    target_lufs: -14,
    true_peak_ceiling_db: -1.0,
    style_es: "Limpio, dinamico y seguro para plataformas.",
  },
  {
    key: "club_loud",
    label_es: "Club loud",
    target_lufs: -9,
    true_peak_ceiling_db: -0.7,
    style_es: "Fuerte y energetico, cuidando transientes y evitando clipping.",
  },
  {
    key: "demo_balanced",
    label_es: "Demo balanced",
    target_lufs: -11.5,
    true_peak_ceiling_db: -1.0,
    style_es: "Presentable y balanceado, sin limitar de mas.",
  },
  {
    key: "vinyl_premaster",
    label_es: "Vinyl premaster",
    target_lufs: -15,
    true_peak_ceiling_db: -3.0,
    style_es: "Conservador, con headroom y sin hard limiting.",
  },
]

function stateVariant(state) {
  if (state === "completed") return "success"
  if (state === "failed") return "destructive"
  if (state === "running" || state === "pending") return "info"
  return "secondary"
}

function Metric({ label, value, suffix = "" }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">
        {value === null || value === undefined || value === "" ? "n/d" : `${value}${suffix}`}
      </dd>
    </div>
  )
}

function hasMetricValues(analysis) {
  if (!analysis) return false

  return [
    analysis.integrated_lufs,
    analysis.true_peak_dbfs,
    analysis.sample_peak_dbfs,
    analysis.crest_factor_db,
    analysis.clipping_detected,
  ].some((value) => value !== null && value !== undefined && value !== "")
}

function MetricGroup({ title, analysis }) {
  const metrics = analysis || {}

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <dl className="mt-2">
        <Metric label="LUFS" value={metrics.integrated_lufs} />
        <Metric label="True peak" value={metrics.true_peak_dbfs} suffix=" dB" />
        <Metric label="Sample peak" value={metrics.sample_peak_dbfs} suffix=" dB" />
        <Metric label="Crest factor" value={metrics.crest_factor_db} suffix=" dB" />
        <Metric label="Clipping" value={metrics.clipping_detected === undefined ? null : String(metrics.clipping_detected)} />
      </dl>
    </div>
  )
}

function MetricsPanel({ title = "Panel de metricas", before, after, profile, emptyMessage }) {
  const hasBefore = hasMetricValues(before)
  const hasAfter = hasMetricValues(after)

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {profile && (
          <Badge variant="outline">{profile.label_es}</Badge>
        )}
      </div>

      {profile && (
        <dl className="mt-4 rounded-md bg-muted/60 px-3 py-2">
          <Metric label="Target LUFS" value={profile.target_lufs} />
          <Metric label="True peak ceiling" value={profile.true_peak_ceiling_db} suffix=" dB" />
        </dl>
      )}

      <div className="mt-5 space-y-5">
        {hasBefore ? (
          <MetricGroup title="Antes" analysis={before} />
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMessage || "Las metricas aparecen despues del analisis inicial."}</p>
        )}

        {hasAfter && (
          <MetricGroup title="Despues" analysis={after} />
        )}
      </div>
    </section>
  )
}

function formatEventTime(timestamp) {
  if (!timestamp) return ""

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ""

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function MasteringProgressPanel({ events, progress }) {
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0))
  const lastEvent = events[events.length - 1]
  const visibleEvents = events.slice(-8).reverse()

  return (
    <div className="mt-5 space-y-4">
      <div>
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
          <span>{lastEvent?.step || "pipeline"}</span>
          <span>{safeProgress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${safeProgress}%` }} />
        </div>
      </div>

      <div className="rounded-md border border-border bg-background/70">
        {visibleEvents.length > 0 ? (
          <ol className="divide-y divide-border">
            {visibleEvents.map((event) => (
              <li key={event.key} className="grid gap-1 px-3 py-2 text-sm sm:grid-cols-[72px,1fr]">
                <span className="text-xs text-muted-foreground">{formatEventTime(event.timestamp)}</span>
                <span className="text-foreground">{event.message}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="px-3 py-3 text-sm text-muted-foreground">Esperando eventos del pipeline.</p>
        )}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </main>
  )
}

function ErrorState({ message, to }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-destructive">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg font-semibold">No se pudo cargar el master</h1>
            <p className="mt-2 text-sm">{message}</p>
            {to && (
              <Button asChild variant="outline" className="mt-4">
                <Link to={to}>Volver</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function TrackMastering() {
  const { slug, masterId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { subscribe, unsubscribe } = useActionCable()
  const isResultView = Boolean(masterId)
  const hydratedMaster = location.state?.trackMaster && String(location.state.trackMaster.id) === String(masterId)
    ? location.state.trackMaster
    : null
  const hydratedProfiles = Array.isArray(location.state?.targetProfiles) && location.state.targetProfiles.length > 0
    ? location.state.targetProfiles
    : FALLBACK_PROFILES
  const [track, setTrack] = useState(location.state?.track || null)
  const [trackMaster, setTrackMaster] = useState(hydratedMaster)
  const [recentMasters, setRecentMasters] = useState(Array.isArray(location.state?.recentMasters) ? location.state.recentMasters : [])
  const [targetProfiles, setTargetProfiles] = useState(hydratedProfiles)
  const [targetProfile, setTargetProfile] = useState(hydratedMaster?.target_profile || "demo_balanced")
  const [feedback, setFeedback] = useState(hydratedMaster?.feedback || "")
  const [referenceNotes, setReferenceNotes] = useState(hydratedMaster?.reference_notes || "")
  const [loading, setLoading] = useState(!location.state?.track || (isResultView && !hydratedMaster))
  const [submitting, setSubmitting] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [retryPrompt, setRetryPrompt] = useState(hydratedMaster?.feedback || "")
  const [error, setError] = useState(null)
  const [masteringEvents, setMasteringEvents] = useState([])

  const loadData = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    setError(null)

    try {
      const path = isResultView
        ? `/tracks/${slug}/masterings/${masterId}.json`
        : `/tracks/${slug}/masterings/new.json`

      const response = await get(path, { responseKind: "json" })
      const data = await response.json

      if (!response.ok) {
        throw new Error(data?.errors?.join(", ") || "Respuesta invalida del servidor.")
      }

      setTrack(data.track)
      setTrackMaster(data.track_master)
      setRecentMasters(Array.isArray(data.recent_masters) ? data.recent_masters : [])
      setTargetProfiles(Array.isArray(data.target_profiles) && data.target_profiles.length > 0 ? data.target_profiles : FALLBACK_PROFILES)
      setTargetProfile(data.track_master?.target_profile || "demo_balanced")
      setFeedback(data.track_master?.feedback || "")
      setReferenceNotes(data.track_master?.reference_notes || "")
      setRetryPrompt(data.track_master?.feedback || "")
    } catch (loadError) {
      if (quiet) {
        console.warn("No se pudo refrescar el detalle de mastering.", loadError)
      } else {
        setError(loadError.message || "No se pudo cargar la informacion.")
      }
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [isResultView, masterId, slug])

  useEffect(() => {
    const hasCurrentMaster = !isResultView || (trackMaster && String(trackMaster.id) === String(masterId))
    loadData({ quiet: Boolean(track) && hasCurrentMaster })
  }, [loadData])

  useEffect(() => {
    if (location.state?.track) setTrack(location.state.track)

    if (Array.isArray(location.state?.recentMasters)) {
      setRecentMasters(location.state.recentMasters)
    }

    if (Array.isArray(location.state?.targetProfiles) && location.state.targetProfiles.length > 0) {
      setTargetProfiles(location.state.targetProfiles)
    }

    if (location.state?.trackMaster && String(location.state.trackMaster.id) === String(masterId)) {
      setTrackMaster(location.state.trackMaster)
      setTargetProfile(location.state.trackMaster.target_profile || "demo_balanced")
      setFeedback(location.state.trackMaster.feedback || "")
      setReferenceNotes(location.state.trackMaster.reference_notes || "")
      setRetryPrompt(location.state.trackMaster.feedback || "")
    }
  }, [location.state, masterId])

  useEffect(() => {
    setMasteringEvents([])
  }, [masterId])

  const masteringActive = isResultView && Boolean(trackMaster?.id) && ["pending", "running"].includes(trackMaster?.state)

  const handleMasteringEvent = useCallback((data) => {
    if (data?.type !== "mastering_progress") return

    if (data.message) {
      setMasteringEvents((currentEvents) => {
        const eventKey = `${data.timestamp || Date.now()}-${data.event || "event"}-${data.step || "step"}`
        if (currentEvents.some((event) => event.key === eventKey)) return currentEvents

        return [
          ...currentEvents,
          {
            key: eventKey,
            event: data.event,
            step: data.step,
            level: data.level,
            message: data.message,
            progress: data.progress,
            timestamp: data.timestamp,
          },
        ].slice(-20)
      })
    }

    if (data.track_master) {
      setTrackMaster((currentMaster) => ({ ...(currentMaster || {}), ...data.track_master }))
    }

    if (["completed", "failed"].includes(data.event)) {
      loadData({ quiet: true })
    }
  }, [loadData])

  useEffect(() => {
    if (!masteringActive) return undefined

    subscribe("MasteringChannel", { track_master_id: trackMaster.id }, { received: handleMasteringEvent })

    return () => unsubscribe("MasteringChannel")
  }, [handleMasteringEvent, masteringActive, subscribe, trackMaster?.id, unsubscribe])

  const selectedProfile = useMemo(() => (
    targetProfiles.find((profile) => profile.key === targetProfile) || targetProfiles[0]
  ), [targetProfile, targetProfiles])

  const recipe = trackMaster?.recipe || {}
  const diagnosis = recipe.diagnosis || {}
  const target = recipe.target || {}
  const feedbackInterpretation = recipe.feedback_interpretation || {}
  const processingChain = Array.isArray(recipe.processing_chain) ? recipe.processing_chain : []
  const warnings = Array.isArray(recipe.warnings_es) ? recipe.warnings_es : []
  const latestMeasuredMaster = useMemo(() => (
    recentMasters.find((master) => hasMetricValues(master.analysis_before) || hasMetricValues(master.analysis_after))
  ), [recentMasters])
  const masteringProgress = useMemo(() => {
    if (trackMaster?.state === "completed") return 100
    if (trackMaster?.state === "failed") return masteringEvents[masteringEvents.length - 1]?.progress || 0

    return masteringEvents[masteringEvents.length - 1]?.progress || (trackMaster?.state === "running" ? 5 : 0)
  }, [masteringEvents, trackMaster?.state])

  const submitMaster = async (event) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const response = await post(`/tracks/${slug}/masterings.json`, {
        responseKind: "json",
        body: JSON.stringify({
          track_master: {
            target_profile: targetProfile,
            feedback: feedback.trim(),
            reference_notes: referenceNotes.trim(),
          },
        }),
      })
      const data = await response.json

      if (!response.ok) {
        throw new Error(data?.errors?.join(", ") || "No se pudo crear el master.")
      }

      toast({ description: "Master en proceso." })
      navigate(`/tracks/${slug}/masterings/${data.track_master.id}`, {
        state: {
          track,
          trackMaster: data.track_master,
          recentMasters,
          targetProfiles,
        },
      })
    } catch (submitError) {
      toast({
        title: "Error",
        description: submitError.message || "No se pudo crear el master.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const retryMaster = async (event) => {
    event.preventDefault()
    if (!trackMaster?.id || retrying) return

    setRetrying(true)

    try {
      const response = await post(`/tracks/${slug}/masterings/${trackMaster.id}/retry.json`, {
        responseKind: "json",
        body: JSON.stringify({
          track_master: {
            feedback: retryPrompt.trim(),
            reference_notes: referenceNotes.trim(),
          },
        }),
      })
      const data = await response.json

      if (!response.ok) {
        throw new Error(data?.errors?.join(", ") || "No se pudo regenerar el master.")
      }

      setMasteringEvents([])
      setTrackMaster((currentMaster) => ({ ...(currentMaster || {}), ...data.track_master }))
      toast({ description: "Master en regeneracion." })
    } catch (retryError) {
      toast({
        title: "Error",
        description: retryError.message || "No se pudo regenerar el master.",
        variant: "destructive",
      })
    } finally {
      setRetrying(false)
    }
  }

  const hasCurrentMaster = !isResultView || (trackMaster && String(trackMaster.id) === String(masterId))

  if (error) return <ErrorState message={error} to={track ? `/tracks/${track.slug}` : "/tracks"} />
  if ((loading || isResultView) && (!track || !hasCurrentMaster)) return <LoadingState />
  if (!track) return <ErrorState message="Track no encontrado." to="/tracks" />

  if (isResultView) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Button asChild variant="ghost" className="-ml-3 mb-2">
              <Link to={`/tracks/${track.slug}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Track
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Master: {track.title}</h1>
              <Badge variant={stateVariant(trackMaster?.state)}>{trackMaster?.state}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {targetProfiles.find((profile) => profile.key === trackMaster?.target_profile)?.label_es || trackMaster?.target_profile}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={`/tracks/${track.slug}/masterings/new`}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Nuevo setup
              </Link>
            </Button>
            {trackMaster?.ready && trackMaster?.download_url && (
              <Button asChild>
                <a href={trackMaster.download_url}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar WAV
                </a>
              </Button>
            )}
          </div>
        </div>

        {["pending", "running"].includes(trackMaster?.state) && (
          <section className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-primary" />
              <div>
                <h2 className="font-semibold text-foreground">Procesando audio</h2>
                <p className="mt-1 text-sm text-muted-foreground">Analisis, receta y render WAV estan en cola o ejecutandose.</p>
              </div>
            </div>
            <MasteringProgressPanel events={masteringEvents} progress={masteringProgress} />
          </section>
        )}

        {trackMaster?.state === "failed" && (
          <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-6">
            <div className="flex items-start gap-3 text-destructive">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">No se pudo generar el master</h2>
                <p className="mt-1 text-sm">{trackMaster.error_message}</p>
                {masteringEvents.length > 0 && (
                  <MasteringProgressPanel events={masteringEvents} progress={masteringProgress} />
                )}
                <form onSubmit={retryMaster} className="mt-5 space-y-3">
                  <Textarea
                    value={retryPrompt}
                    onChange={(event) => setRetryPrompt(event.target.value)}
                    rows={4}
                    placeholder="Ajusta el prompt antes de reintentar."
                    className="bg-background text-foreground"
                  />
                  <Button type="submit" variant="outline" disabled={retrying}>
                    {retrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Reintentar master
                  </Button>
                </form>
              </div>
            </div>
          </section>
        )}

        {trackMaster?.state === "completed" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-foreground">Archivo listo</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{recipe.artist_message_es}</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="rounded-md border border-border bg-background/70 p-4">
                        <p className="text-sm font-semibold text-foreground">Original</p>
                        {track.playback_url ? (
                          <audio controls className="mt-3 w-full" src={track.playback_url} />
                        ) : (
                          <p className="mt-3 text-sm text-muted-foreground">Original no disponible para comparar.</p>
                        )}
                      </div>
                      <div className="rounded-md border border-border bg-background/70 p-4">
                        <p className="text-sm font-semibold text-foreground">Master</p>
                        {trackMaster.audio_url ? (
                          <audio controls className="mt-3 w-full" src={trackMaster.audio_url} />
                        ) : (
                          <p className="mt-3 text-sm text-muted-foreground">Master no disponible.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground">Diagnostico</h2>
                <p className="mt-2 text-sm text-muted-foreground">{diagnosis.summary_es}</p>
                {feedbackInterpretation.summary_es && feedbackInterpretation.source !== "none" && (
                  <div className="mt-4 rounded-md bg-muted p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Feedback interpretado</p>
                    <p className="mt-1 text-sm text-foreground">{feedbackInterpretation.summary_es}</p>
                  </div>
                )}
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Riesgo</p>
                    <p className="mt-1 text-sm font-semibold">{diagnosis.risk_level || "n/d"}</p>
                  </div>
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Target LUFS</p>
                    <p className="mt-1 text-sm font-semibold">{target.target_lufs ?? "n/d"}</p>
                  </div>
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">True peak</p>
                    <p className="mt-1 text-sm font-semibold">{target.true_peak_ceiling_db ?? "n/d"} dB</p>
                  </div>
                </div>

                {Array.isArray(diagnosis.main_issues) && diagnosis.main_issues.length > 0 && (
                  <ul className="mt-5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {diagnosis.main_issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground">Cadena aplicada</h2>
                <div className="mt-4 space-y-3">
                  {processingChain.map((stage) => (
                    <div key={stage.type} className="rounded-md border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-foreground">{stage.type}</h3>
                        <Badge variant={stage.enabled ? "success" : "secondary"}>{stage.enabled ? "activo" : "omitido"}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{stage.reason_es}</p>
                    </div>
                  ))}
                </div>
              </div>

              <details className="rounded-lg border border-border bg-card p-6">
                <summary className="cursor-pointer text-lg font-semibold text-foreground">Receta JSON</summary>
                <pre className="mt-4 max-h-96 overflow-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-100">
                  {JSON.stringify(recipe, null, 2)}
                </pre>
              </details>
            </section>

            <aside className="space-y-6">
              <section className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Regenerar</h2>
                </div>
                <form onSubmit={retryMaster} className="mt-4 space-y-3">
                  <Textarea
                    value={retryPrompt}
                    onChange={(event) => setRetryPrompt(event.target.value)}
                    rows={4}
                    placeholder="Ej: menos bombeo, conservar mas pegada, dejarlo cerca de -10 LUFS..."
                  />
                  <Button type="submit" variant="outline" className="w-full" disabled={retrying || ["pending", "running"].includes(trackMaster?.state)}>
                    {retrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Regenerar con prompt
                  </Button>
                </form>
              </section>

              <MetricsPanel
                before={trackMaster.analysis_before}
                after={trackMaster.analysis_after}
                profile={targetProfiles.find((profile) => profile.key === trackMaster.target_profile)}
              />

              {warnings.length > 0 && (
                <section className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-5 text-sm text-yellow-800 dark:text-yellow-200">
                  <h2 className="font-semibold">Advertencias</h2>
                  <ul className="mt-3 list-disc space-y-1 pl-5">
                    {warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-2">
            <Link to={`/tracks/${track.slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Track
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Master de {track.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Feedback, setup tecnico y render WAV reproducible.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={submitMaster} className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col gap-5 sm:flex-row">
              <img
                src={track.cover_url?.cropped_image || track.cover_url?.medium}
                alt={track.title}
                className="h-28 w-28 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-foreground">{track.title}</h2>
                <p className="text-sm text-muted-foreground">@{track.user?.username}</p>
                {track.playback_url ? (
                  <audio controls className="mt-4 w-full" src={track.playback_url} />
                ) : (
                  <p className="mt-4 text-sm text-yellow-700 dark:text-yellow-300">Este track aun no tiene audio reproducible.</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">1</div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-foreground">Feedback del track</h2>
                <div className="mt-5 space-y-5">
                  <label className="block">
                    <span className="text-sm font-medium text-foreground">Que deberia mejorar?</span>
                    <Textarea
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                      rows={5}
                      placeholder="Ej: mantener pegada del kick, limpiar subgrave, suavizar hats asperos..."
                      className="mt-2"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-foreground">Notas de referencia</span>
                    <Textarea
                      value={referenceNotes}
                      onChange={(event) => setReferenceNotes(event.target.value)}
                      rows={3}
                      placeholder="Opcional: referencia de sonido, club, streaming, vinilo o demo."
                      className="mt-2"
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">2</div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-foreground">Setup de salida</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {targetProfiles.map((profile) => (
                    <button
                      type="button"
                      key={profile.key}
                      onClick={() => setTargetProfile(profile.key)}
                      className={`rounded-lg border p-4 text-left transition ${
                        targetProfile === profile.key
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-primary/50"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-foreground">{profile.label_es}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{profile.style_es}</span>
                      <span className="mt-3 block text-xs font-medium text-foreground">
                        {profile.target_lufs} LUFS · TP {profile.true_peak_ceiling_db} dB
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">3</div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-foreground">Generar archivo</h2>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AudioLines className="mr-2 h-4 w-4" />}
                    Generar master
                  </Button>
                  {selectedProfile && (
                    <span className="text-sm text-muted-foreground">
                      {selectedProfile.label_es}: {selectedProfile.target_lufs} LUFS / TP {selectedProfile.true_peak_ceiling_db} dB
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </form>

        <aside className="space-y-6">
          <MetricsPanel
            before={latestMeasuredMaster?.analysis_before}
            after={latestMeasuredMaster?.analysis_after}
            profile={selectedProfile}
            emptyMessage="Todavia no hay mediciones para este track. Al generar el master se guardaran LUFS, true peak, crest factor y clipping antes/despues."
          />

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Ultimos masters</h2>
            <div className="mt-4 space-y-3">
              {recentMasters.length > 0 ? (
                recentMasters.map((master) => (
                  <div key={master.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {targetProfiles.find((profile) => profile.key === master.target_profile)?.label_es || master.target_profile}
                      </span>
                      <Badge variant={stateVariant(master.state)}>{master.state}</Badge>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          to={`/tracks/${track.slug}/masterings/${master.id}`}
                          state={{
                            track,
                            trackMaster: master,
                            recentMasters,
                            targetProfiles,
                          }}
                        >
                          Ver
                        </Link>
                      </Button>
                      {master.ready && master.download_url && (
                        <Button asChild variant="outline" size="sm">
                          <a href={master.download_url}>
                            <Download className="mr-2 h-3.5 w-3.5" />
                            WAV
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Todavia no hay masters para este track.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Salida</h2>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>WAV 24-bit.</li>
              <li>Receta JSON guardada.</li>
              <li>Analisis antes y despues.</li>
              <li>Descarga desde el resultado.</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  )
}
