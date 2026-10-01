import type { RauVizBlock } from "./blocks/types"

export interface RauVizViewer {
  connectAudio(source: AudioNode, options: { monitor: boolean }): Promise<unknown>
  disconnectAudio(): void
  setAudioSignals(signals: { low: number; mid: number; high: number; level: number; peak: number }): void
  setSensitivity(value: number): void
  on(event: string, callback: () => void): void
  destroy(): void
}

interface RauVizSdk {
  embed(options: RauVizBlock["props"] & { target: HTMLElement }): RauVizViewer
}

let sdkPromise: Promise<RauVizSdk> | null = null

export function rauVizUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    return ["https:", "http:"].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

// Keep one SDK for the page lifetime. React remounts and multiple blocks must
// share it; the SDK itself creates the cross-origin visualization iframe.
export function loadRauViz(): Promise<RauVizSdk> {
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise<RauVizSdk>((resolve, reject) => {
    const script = document.createElement("script")
    const timeout = window.setTimeout(() => fail(), 15000)
    const fail = () => {
      window.clearTimeout(timeout)
      script.onload = script.onerror = null
      script.remove()
      reject(new Error("No se pudo cargar RauViz."))
    }
    script.src = "https://viz.rauversion.com/embed.js"
    script.async = true
    script.onerror = fail
    script.onload = () => {
      const sdk = (window as Window & { RauViz?: RauVizSdk }).RauViz
      if (!sdk?.embed) return fail()
      window.clearTimeout(timeout)
      script.onload = script.onerror = null
      resolve(sdk)
    }
    document.head.appendChild(script)
  }).catch((error) => {
    sdkPromise = null
    throw error
  })

  return sdkPromise
}
