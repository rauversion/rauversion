import { getPlayerAudioSource, PLAYER_PLAY_REQUESTED } from "./player-audio"
import type { RauVizViewer } from "./rauviz-embed"

export type RauVizAudioStatus = "idle" | "connecting" | "connected" | "error"

export function bindRauVizAudio(
  viewer: RauVizViewer,
  audio: HTMLMediaElement,
  onStatus: (status: RauVizAudioStatus) => void,
) {
  let disposed = false
  let connecting = false
  let connected = false
  let requested = false

  const connect = async () => {
    requested = true
    if (disposed || connected || connecting) return
    connecting = true
    onStatus("connecting")
    try {
      const source = await getPlayerAudioSource(audio)
      if (disposed || !requested) return
      await viewer.connectAudio(source, { monitor: false })
      // connectAudio is asynchronous; pause or unmount may happen while the
      // SDK resumes its context. Clean up the late connection as well.
      if (disposed || !requested) {
        viewer.disconnectAudio()
        return
      }
      connected = true
      onStatus("connected")
    } catch {
      if (!disposed && requested) onStatus("error")
    } finally {
      connecting = false
    }
  }

  const stop = () => {
    requested = connected = false
    viewer.disconnectAudio()
    viewer.setAudioSignals({ low: 0, mid: 0, high: 0, level: 0, peak: 0 })
    onStatus("idle")
  }

  audio.addEventListener(PLAYER_PLAY_REQUESTED, connect)
  audio.addEventListener("play", connect)
  for (const event of ["pause", "ended", "emptied", "error"]) audio.addEventListener(event, stop)
  if (!audio.paused && !audio.ended) void connect()

  return () => {
    disposed = true
    requested = false
    audio.removeEventListener(PLAYER_PLAY_REQUESTED, connect)
    audio.removeEventListener("play", connect)
    for (const event of ["pause", "ended", "emptied", "error"]) audio.removeEventListener(event, stop)
    viewer.disconnectAudio()
  }
}
