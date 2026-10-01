"use client"

import React from "react"
import { Sparkles } from "lucide-react"
import type { RauVizBlock as RauVizBlockType } from "@/lib/blocks/types"
import { loadRauViz, rauVizUrl, type RauVizViewer } from "@/lib/rauviz-embed"
import { bindRauVizAudio, type RauVizAudioStatus } from "@/lib/rauviz-audio"
import { resumePlayerAudio } from "@/lib/player-audio"
import useAudioStore from "@/stores/audioStore"

export function RauVizBlock({ block, isEditing }: { block: RauVizBlockType; isEditing?: boolean }) {
  const { src, controls, sensitivity } = block.props
  const patchUrl = rauVizUrl(src)
  const targetRef = React.useRef<HTMLDivElement>(null)
  const sensitivityRef = React.useRef(sensitivity)
  sensitivityRef.current = sensitivity
  const audio = useAudioStore((state) => state.audioElement)
  const [viewer, setViewer] = React.useState<RauVizViewer | null>(null)
  const [status, setStatus] = React.useState<"loading" | "loaded" | "error">("loading")
  const [audioStatus, setAudioStatus] = React.useState<RauVizAudioStatus>("idle")
  const [attempt, setAttempt] = React.useState(0)

  React.useEffect(() => {
    setViewer(null)
    if (!patchUrl || !targetRef.current) return
    const target = targetRef.current
    let disposed = false
    let instance: RauVizViewer | null = null
    setStatus("loading")
    const fail = () => {
      if (disposed) return
      disposed = true
      window.clearTimeout(timeout)
      instance?.destroy()
      setViewer(null)
      setStatus("error")
    }
    const timeout = window.setTimeout(fail, 30000)

    loadRauViz().then((sdk) => {
      if (disposed) return
      instance = sdk.embed({ target, src: patchUrl, controls, sensitivity: sensitivityRef.current })
      instance.on("loaded", () => {
        if (disposed) return
        window.clearTimeout(timeout)
        setStatus("loaded")
      })
      instance.on("error", fail)
      setViewer(instance)
    }).catch(fail)

    return () => {
      disposed = true
      window.clearTimeout(timeout)
      instance?.destroy()
    }
  }, [patchUrl, controls, attempt])

  React.useEffect(() => {
    if (Number.isFinite(sensitivity)) viewer?.setSensitivity(sensitivity)
  }, [viewer, sensitivity])

  React.useEffect(() => {
    setAudioStatus("idle")
    if (viewer && audio) return bindRauVizAudio(viewer, audio, setAudioStatus)
  }, [viewer, audio])

  if (!patchUrl) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted p-4 text-center text-muted-foreground">
        <Sparkles className="h-8 w-8" />
        <span className="text-sm">{isEditing ? "Configura la URL del patch RauViz (HTTP o HTTPS)." : "Visualización RauViz no disponible."}</span>
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <div ref={targetRef} className="absolute inset-0" />
      {status !== "loaded" && (
        <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 p-4 text-center text-sm text-zinc-50">
          <span>{status === "error" ? "No se pudo cargar RauViz. Comprueba la URL del patch y tu conexión." : "Cargando RauViz…"}</span>
          {status === "error" && (
            <button type="button" className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2" onClick={() => setAttempt((value) => value + 1)}>Reintentar</button>
          )}
        </div>
      )}
      {status === "loaded" && (audioStatus === "connecting" || audioStatus === "error") && (
        <button type="button" className="absolute bottom-3 left-3 rounded-md bg-black/80 px-3 py-2 text-xs text-white" onClick={() => resumePlayerAudio(audio)}>
          {audioStatus === "error" ? "Reintentar audio reactivo" : "Activar audio reactivo"}
        </button>
      )}
      {isEditing && <div className="absolute inset-0 cursor-pointer" aria-hidden="true" />}
    </div>
  )
}
