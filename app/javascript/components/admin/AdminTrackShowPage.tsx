import React from "react"
import { Link, useParams } from "react-router-dom"
import { adminGetJson, adminPatchJson, adminPostJson } from "./api"
import type { AdminRecordResponse, AdminResourceDefinition, AdminRecord } from "./types"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ExternalLink, RefreshCw, Save } from "lucide-react"

type TrackActionResponse = AdminRecordResponse & {
  result?: Record<string, any>
}

type TrackFormState = {
  title: string
  description: string
  private: boolean
  podcast: boolean
  genre: string
  bpm: string
  bpmRangeMin: string
  bpmRangeMax: string
  musicalKey: string
  subgenres: string
  mood: string
  primaryInstruments: string
  referenceArtists: string
  productionTraits: string
  language: string
  energy: string
  danceability: string
  instrumental: boolean
  vocalPresence: string
  analysisAccuracy: string
  analysisNotes: string
  tags: string
}

type AnalysisOptions = {
  startSeconds: string
  durationSeconds: string
  persist: boolean
}

const EMPTY_FORM: TrackFormState = {
  title: "",
  description: "",
  private: false,
  podcast: false,
  genre: "",
  bpm: "",
  bpmRangeMin: "",
  bpmRangeMax: "",
  musicalKey: "",
  subgenres: "",
  mood: "",
  primaryInstruments: "",
  referenceArtists: "",
  productionTraits: "",
  language: "",
  energy: "",
  danceability: "",
  instrumental: false,
  vocalPresence: "",
  analysisAccuracy: "",
  analysisNotes: "",
  tags: "",
}

const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptions = {
  startSeconds: "0",
  durationSeconds: "60",
  persist: false,
}

function joinList(value: any) {
  return Array.isArray(value) ? value.join(", ") : ""
}

function parseList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function blankToNull(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function toIntegerOrNull(value: string) {
  const normalized = value.trim()
  if (!normalized) return null

  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function toFloatOrNull(value: string) {
  const normalized = value.trim()
  if (!normalized) return null

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function buildTrackFormState(source: Record<string, any> = {}): TrackFormState {
  const bpmRange = source.bpm_range || {}

  return {
    title: source.title ?? "",
    description: source.description ?? "",
    private: source.private === true,
    podcast: source.podcast === true,
    genre: source.genre ?? "",
    bpm: source.bpm !== null && source.bpm !== undefined ? String(source.bpm) : "",
    bpmRangeMin: bpmRange.min !== null && bpmRange.min !== undefined ? String(bpmRange.min) : "",
    bpmRangeMax: bpmRange.max !== null && bpmRange.max !== undefined ? String(bpmRange.max) : "",
    musicalKey: source.musical_key ?? "",
    subgenres: joinList(source.subgenres),
    mood: joinList(source.mood),
    primaryInstruments: joinList(source.primary_instruments),
    referenceArtists: joinList(source.reference_artists),
    productionTraits: joinList(source.production_traits),
    language: source.language ?? "",
    energy: source.energy !== null && source.energy !== undefined ? String(source.energy) : "",
    danceability: source.danceability !== null && source.danceability !== undefined ? String(source.danceability) : "",
    instrumental: source.instrumental === true,
    vocalPresence: source.vocal_presence !== null && source.vocal_presence !== undefined ? String(source.vocal_presence) : "",
    analysisAccuracy: source.analysis_accuracy !== null && source.analysis_accuracy !== undefined ? String(source.analysis_accuracy) : "",
    analysisNotes: source.analysis_notes ?? "",
    tags: joinList(source.tags),
  }
}

function buildTrackPayload(form: TrackFormState) {
  const bpmRangeMin = toIntegerOrNull(form.bpmRangeMin)
  const bpmRangeMax = toIntegerOrNull(form.bpmRangeMax)

  return {
    title: form.title.trim(),
    description: blankToNull(form.description),
    private: form.private,
    podcast: form.podcast,
    genre: blankToNull(form.genre),
    bpm: toIntegerOrNull(form.bpm),
    bpm_range: bpmRangeMin !== null || bpmRangeMax !== null ? {
      ...(bpmRangeMin !== null ? { min: bpmRangeMin } : {}),
      ...(bpmRangeMax !== null ? { max: bpmRangeMax } : {}),
    } : {},
    musical_key: blankToNull(form.musicalKey),
    subgenres: parseList(form.subgenres),
    mood: parseList(form.mood),
    primary_instruments: parseList(form.primaryInstruments),
    reference_artists: parseList(form.referenceArtists),
    production_traits: parseList(form.productionTraits),
    language: blankToNull(form.language),
    energy: toFloatOrNull(form.energy),
    danceability: toFloatOrNull(form.danceability),
    instrumental: form.instrumental,
    vocal_presence: toFloatOrNull(form.vocalPresence),
    analysis_accuracy: toFloatOrNull(form.analysisAccuracy),
    analysis_notes: blankToNull(form.analysisNotes),
    tags: parseList(form.tags),
  }
}

function mergeAnalysisResultIntoForm(current: TrackFormState, result: Record<string, any>) {
  return {
    ...current,
    genre: result.genre ?? current.genre,
    bpm: result.bpm !== null && result.bpm !== undefined ? String(result.bpm) : current.bpm,
    bpmRangeMin: result.bpm_range?.min !== null && result.bpm_range?.min !== undefined ? String(result.bpm_range.min) : current.bpmRangeMin,
    bpmRangeMax: result.bpm_range?.max !== null && result.bpm_range?.max !== undefined ? String(result.bpm_range.max) : current.bpmRangeMax,
    musicalKey: result.key ?? current.musicalKey,
    subgenres: Array.isArray(result.subgenres) ? result.subgenres.join(", ") : current.subgenres,
    mood: Array.isArray(result.mood) ? result.mood.join(", ") : current.mood,
    primaryInstruments: Array.isArray(result.primary_instruments) ? result.primary_instruments.join(", ") : current.primaryInstruments,
    referenceArtists: Array.isArray(result.reference_artists) ? result.reference_artists.join(", ") : current.referenceArtists,
    productionTraits: Array.isArray(result.production_traits) ? result.production_traits.join(", ") : current.productionTraits,
    language: result.language ?? current.language,
    energy: result.energy !== null && result.energy !== undefined ? String(result.energy) : current.energy,
    danceability: result.danceability !== null && result.danceability !== undefined ? String(result.danceability) : current.danceability,
    instrumental: typeof result.instrumental === "boolean" ? result.instrumental : current.instrumental,
    vocalPresence: result.vocal_presence !== null && result.vocal_presence !== undefined ? String(result.vocal_presence) : current.vocalPresence,
    analysisAccuracy: result.accuracy !== null && result.accuracy !== undefined ? String(result.accuracy) : current.analysisAccuracy,
    analysisNotes: result.analysis_notes ?? current.analysisNotes,
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "—"

  try {
    return new Date(value).toLocaleString()
  } catch (_error) {
    return value
  }
}

function renderJsonBlock(value: any) {
  if (!value || (typeof value === "object" && Object.keys(value).length === 0)) {
    return <span className="text-muted-foreground">No data</span>
  }

  return (
    <pre className="overflow-x-auto rounded-2xl border border-border bg-muted/40 p-4 text-xs text-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

function renderAssetLink(value?: string | null, label = "Open link") {
  if (!value) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
    >
      {label}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="min-w-[140px] text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm text-foreground">{value}</dd>
    </div>
  )
}

export default function AdminTrackShowPage() {
  const { id = "" } = useParams()
  const { toast } = useToast()
  const [resource, setResource] = React.useState<AdminResourceDefinition | null>(null)
  const [record, setRecord] = React.useState<AdminRecord | null>(null)
  const [formData, setFormData] = React.useState<TrackFormState>(EMPTY_FORM)
  const [analysisOptions, setAnalysisOptions] = React.useState<AnalysisOptions>(DEFAULT_ANALYSIS_OPTIONS)
  const [analysisResult, setAnalysisResult] = React.useState<Record<string, any> | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [analyzing, setAnalyzing] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string[]>>({})

  const loadTrack = React.useCallback(async () => {
    try {
      setLoading(true)
      const payload = await adminGetJson<AdminRecordResponse>(`/api/admin/tracks/${id}`)
      setResource(payload.resource)
      setRecord(payload.record)
      setFormData(buildTrackFormState(payload.record.form_values || {}))
      setErrors({})
    } catch (error: any) {
      toast({
        title: "Track load failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  React.useEffect(() => {
    loadTrack()
  }, [loadTrack])

  const submit = async (event?: React.FormEvent | React.MouseEvent) => {
    event?.preventDefault?.()
    setSaving(true)
    setErrors({})

    try {
      const payload = await adminPatchJson<AdminRecordResponse>(`/api/admin/tracks/${id}`, {
        record: buildTrackPayload(formData),
      })

      setRecord(payload.record)
      setFormData(buildTrackFormState(payload.record.form_values || {}))
      toast({ title: "Track updated" })
    } catch (error: any) {
      setErrors(error?.details || {})
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const runAnalysis = async () => {
    setAnalyzing(true)

    try {
      const payload = await adminPostJson<TrackActionResponse>(`/api/admin/tracks/${id}/actions/analyze`, {
        payload: {
          start_seconds: toIntegerOrNull(analysisOptions.startSeconds) ?? 0,
          duration_seconds: toIntegerOrNull(analysisOptions.durationSeconds) ?? 60,
          persist: analysisOptions.persist,
        },
      })

      setAnalysisResult(payload.result || null)
      setRecord(payload.record)

      if (analysisOptions.persist) {
        setFormData(buildTrackFormState(payload.record.form_values || {}))
      } else if (payload.result) {
        setFormData((current) => mergeAnalysisResultIntoForm(current, payload.result || {}))
      }

      toast({
        title: analysisOptions.persist ? "Analysis saved to track" : "Analysis ready",
        description: analysisOptions.persist ? "Track metadata was updated." : "Review the generated metadata before saving.",
      })
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const values = record?.form_values || {}
  const activeAnalysis = analysisResult || {}
  const publicUrl = values.public_url
  const playbackUrl = values.playback_url
  const coverUrl = values.cover_url

  if (loading) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-card-foreground shadow-sm">Loading track...</div>
  }

  if (!resource || !record) {
    return <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-8 text-destructive">Track unavailable.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-2 -ml-3">
            <Link to="/admin/tracks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to tracks
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold text-foreground">{values.title || `Track #${record.id}`}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{resource.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {publicUrl && (
            <Button variant="outline" asChild>
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open public page
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={loadTrack}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Track identity, publication state, and media availability.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
              <div className="overflow-hidden rounded-[1.5rem] border border-border bg-muted/40">
                {coverUrl ? (
                  <img src={coverUrl} alt={values.title || "Track cover"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
                    No cover
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">#{record.id}</Badge>
                  <Badge variant={values.private ? "secondary" : "default"}>
                    {values.private ? "Private" : "Public"}
                  </Badge>
                  <Badge variant="secondary">{values.state || "Unknown state"}</Badge>
                  {values.podcast && <Badge variant="secondary">Podcast</Badge>}
                </div>

                <dl className="divide-y divide-border">
                  <InfoRow label="Artist" value={values.artist_name || "—"} />
                  <InfoRow label="Username" value={values.artist_username || "—"} />
                  <InfoRow label="Email" value={values.artist_email || "—"} />
                  <InfoRow label="Slug" value={values.slug || "—"} />
                  <InfoRow label="Duration" value={values.duration || "—"} />
                  <InfoRow label="Created" value={formatDateTime(values.created_at || record.metadata?.created_at)} />
                  <InfoRow label="Updated" value={formatDateTime(values.updated_at || record.metadata?.updated_at)} />
                </dl>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border bg-muted/30 p-4">
                <h3 className="text-sm font-medium text-foreground">Playback</h3>
                {playbackUrl ? (
                  <div className="mt-3 space-y-3">
                    <audio controls className="w-full" src={playbackUrl} preload="none" />
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {values.audio_url && <p>Audio asset: {renderAssetLink(values.audio_url, "Open audio")}</p>}
                      {values.mp3_url && <p>MP3 asset: {renderAssetLink(values.mp3_url, "Open mp3")}</p>}
                      {values.video_url && <p>Video asset: {renderAssetLink(values.video_url, "Open video")}</p>}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No playable media available.</p>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-border bg-muted/30 p-4">
                <h3 className="text-sm font-medium text-foreground">Current summary</h3>
                <dl className="mt-3 divide-y divide-border">
                  <InfoRow label="Genre" value={values.genre || "—"} />
                  <InfoRow label="BPM" value={values.bpm || "—"} />
                  <InfoRow label="Key" value={values.musical_key || "—"} />
                  <InfoRow label="Accuracy" value={values.analysis_accuracy || "—"} />
                  <InfoRow label="Analyzed at" value={formatDateTime(values.analyzed_at)} />
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Analyze</CardTitle>
            <CardDescription>Run the audio classifier against the track media and optionally persist the result.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Start second</label>
                <Input
                  type="number"
                  min="0"
                  value={analysisOptions.startSeconds}
                  onChange={(event) =>
                    setAnalysisOptions((current) => ({ ...current, startSeconds: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Duration</label>
                <Input
                  type="number"
                  min="5"
                  max="90"
                  value={analysisOptions.durationSeconds}
                  onChange={(event) =>
                    setAnalysisOptions((current) => ({ ...current, durationSeconds: event.target.value }))
                  }
                />
              </div>
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-border bg-background/60 px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-foreground">Persist on analyze</span>
                <span className="text-sm text-muted-foreground">Save the generated metadata directly into the track.</span>
              </span>
              <Switch
                checked={analysisOptions.persist}
                onCheckedChange={(checked) => setAnalysisOptions((current) => ({ ...current, persist: checked }))}
              />
            </label>

            <Button className="w-full" onClick={runAnalysis} disabled={analyzing}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {analyzing ? "Analyzing..." : "Analyze track"}
            </Button>

            <div className="rounded-[1.5rem] border border-border bg-muted/30 p-4">
              <h3 className="text-sm font-medium text-foreground">Latest analysis result</h3>
              <dl className="mt-3 divide-y divide-border">
                <InfoRow label="Genre" value={activeAnalysis.genre || values.genre || "—"} />
                <InfoRow label="BPM" value={activeAnalysis.bpm || values.bpm || "—"} />
                <InfoRow label="Key" value={activeAnalysis.key || values.musical_key || "—"} />
                <InfoRow
                  label="Artists"
                  value={Array.isArray(activeAnalysis.reference_artists) ? activeAnalysis.reference_artists.join(", ") : joinList(values.reference_artists) || "—"}
                />
              </dl>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="edit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="edit">Edit metadata</TabsTrigger>
          <TabsTrigger value="analysis">Analysis data</TabsTrigger>
          <TabsTrigger value="technical">Technical info</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Edit track metadata</CardTitle>
              <CardDescription>Adjust the AI result or fix the track metadata manually before saving.</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(errors).length > 0 && (
                <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                  {Object.entries(errors).map(([field, messages]) => (
                    <p key={field}>
                      <strong>{field}</strong>: {messages.join(", ")}
                    </p>
                  ))}
                </div>
              )}

              <form className="space-y-6" onSubmit={submit}>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Title</label>
                    <Input value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Genre</label>
                    <Input value={formData.genre} onChange={(event) => setFormData((current) => ({ ...current, genre: event.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Description</label>
                  <Textarea
                    rows={5}
                    value={formData.description}
                    onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">BPM</label>
                    <Input type="number" value={formData.bpm} onChange={(event) => setFormData((current) => ({ ...current, bpm: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">BPM min</label>
                    <Input type="number" value={formData.bpmRangeMin} onChange={(event) => setFormData((current) => ({ ...current, bpmRangeMin: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">BPM max</label>
                    <Input type="number" value={formData.bpmRangeMax} onChange={(event) => setFormData((current) => ({ ...current, bpmRangeMax: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Key</label>
                    <Input value={formData.musicalKey} onChange={(event) => setFormData((current) => ({ ...current, musicalKey: event.target.value }))} />
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Subgenres</label>
                    <Textarea rows={3} value={formData.subgenres} onChange={(event) => setFormData((current) => ({ ...current, subgenres: event.target.value }))} />
                    <p className="text-xs text-muted-foreground">Comma-separated.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Mood</label>
                    <Textarea rows={3} value={formData.mood} onChange={(event) => setFormData((current) => ({ ...current, mood: event.target.value }))} />
                    <p className="text-xs text-muted-foreground">Comma-separated.</p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Primary instruments</label>
                    <Textarea rows={4} value={formData.primaryInstruments} onChange={(event) => setFormData((current) => ({ ...current, primaryInstruments: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Reference artists</label>
                    <Textarea rows={4} value={formData.referenceArtists} onChange={(event) => setFormData((current) => ({ ...current, referenceArtists: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Production traits</label>
                    <Textarea rows={4} value={formData.productionTraits} onChange={(event) => setFormData((current) => ({ ...current, productionTraits: event.target.value }))} />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Language</label>
                    <Input value={formData.language} onChange={(event) => setFormData((current) => ({ ...current, language: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Energy</label>
                    <Input type="number" step="0.01" min="0" max="1" value={formData.energy} onChange={(event) => setFormData((current) => ({ ...current, energy: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Danceability</label>
                    <Input type="number" step="0.01" min="0" max="1" value={formData.danceability} onChange={(event) => setFormData((current) => ({ ...current, danceability: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Vocal presence</label>
                    <Input type="number" step="0.01" min="0" max="1" value={formData.vocalPresence} onChange={(event) => setFormData((current) => ({ ...current, vocalPresence: event.target.value }))} />
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <label className="flex items-center justify-between rounded-2xl border border-border bg-background/60 px-4 py-3">
                    <span>
                      <span className="block text-sm font-medium text-foreground">Private</span>
                      <span className="text-sm text-muted-foreground">Hide the track from the public site.</span>
                    </span>
                    <Switch checked={formData.private} onCheckedChange={(checked) => setFormData((current) => ({ ...current, private: checked }))} />
                  </label>
                  <label className="flex items-center justify-between rounded-2xl border border-border bg-background/60 px-4 py-3">
                    <span>
                      <span className="block text-sm font-medium text-foreground">Podcast</span>
                      <span className="text-sm text-muted-foreground">Mark the track as podcast content.</span>
                    </span>
                    <Switch checked={formData.podcast} onCheckedChange={(checked) => setFormData((current) => ({ ...current, podcast: checked }))} />
                  </label>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <label className="flex items-center justify-between rounded-2xl border border-border bg-background/60 px-4 py-3">
                    <span>
                      <span className="block text-sm font-medium text-foreground">Instrumental</span>
                      <span className="text-sm text-muted-foreground">Mark the track as mostly instrumental.</span>
                    </span>
                    <Switch checked={formData.instrumental} onCheckedChange={(checked) => setFormData((current) => ({ ...current, instrumental: checked }))} />
                  </label>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Tags</label>
                    <Textarea rows={3} value={formData.tags} onChange={(event) => setFormData((current) => ({ ...current, tags: event.target.value }))} />
                    <p className="text-xs text-muted-foreground">Comma-separated.</p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Analysis accuracy</label>
                    <Input type="number" step="0.01" min="0" max="1" value={formData.analysisAccuracy} onChange={(event) => setFormData((current) => ({ ...current, analysisAccuracy: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Analysis notes</label>
                    <Textarea rows={4} value={formData.analysisNotes} onChange={(event) => setFormData((current) => ({ ...current, analysisNotes: event.target.value }))} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Confidence breakdown</CardTitle>
                <CardDescription>Current or last generated confidence by signal.</CardDescription>
              </CardHeader>
              <CardContent>
                {renderJsonBlock(activeAnalysis.confidence_breakdown || values.confidence_breakdown)}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Analysis source metadata</CardTitle>
                <CardDescription>Technical metadata captured from the analyzed audio source.</CardDescription>
              </CardHeader>
              <CardContent>
                {renderJsonBlock(activeAnalysis.source_metadata || values.analysis_source_metadata)}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Track JSON fields</CardTitle>
                <CardDescription>Current persisted analysis-related track metadata.</CardDescription>
              </CardHeader>
              <CardContent>
                {renderJsonBlock({
                  genre: values.genre,
                  bpm: values.bpm,
                  bpm_range: values.bpm_range,
                  musical_key: values.musical_key,
                  subgenres: values.subgenres,
                  mood: values.mood,
                  primary_instruments: values.primary_instruments,
                  reference_artists: values.reference_artists,
                  production_traits: values.production_traits,
                  language: values.language,
                  energy: values.energy,
                  danceability: values.danceability,
                  instrumental: values.instrumental,
                  vocal_presence: values.vocal_presence,
                  analysis_accuracy: values.analysis_accuracy,
                  analysis_notes: values.analysis_notes,
                  analysis_model: values.analysis_model,
                  analyzed_at: values.analyzed_at,
                  tags: values.tags,
                })}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Asset endpoints</CardTitle>
                <CardDescription>Direct paths currently available for this track in the app.</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border">
                  <InfoRow label="Cover" value={renderAssetLink(values.cover_url, "Open cover")} />
                  <InfoRow label="Playback" value={renderAssetLink(values.playback_url, "Open playback")} />
                  <InfoRow label="Audio" value={renderAssetLink(values.audio_url, "Open audio")} />
                  <InfoRow label="MP3" value={renderAssetLink(values.mp3_url, "Open mp3")} />
                  <InfoRow label="Video" value={renderAssetLink(values.video_url, "Open video")} />
                  <InfoRow label="Public page" value={renderAssetLink(values.public_url, "Open page")} />
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
