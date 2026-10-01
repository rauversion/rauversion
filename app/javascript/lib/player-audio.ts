// The player owns the audible connection for the lifetime of the page. Removing
// a visualizer must only disconnect its analyser, never the speakers.
let context: AudioContext | null = null
const sources = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>()

export const PLAYER_PLAY_REQUESTED = "rauversion:play-requested"

export function resumePlayerAudio(audio: HTMLMediaElement | null) {
  if (context && context.state !== "running") {
    void context.resume().catch(() => {})
  }
  // Run subscribers during the Play gesture, before fetching the next track.
  audio?.dispatchEvent(new Event(PLAYER_PLAY_REQUESTED))
}

export async function getPlayerAudioSource(audio: HTMLMediaElement): Promise<MediaElementAudioSourceNode> {
  if (!context) {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) throw new Error("Web Audio no está disponible.")
    context = new AudioContextClass()
  }
  if (context.state !== "running") await context.resume()

  // Wait until the context can play before rerouting the element. A browser
  // waiting for user activation must not silence music that is already playing.
  let source = sources.get(audio)
  if (!source) {
    source = context.createMediaElementSource(audio)
    source.connect(context.destination)
    sources.set(audio, source)
  }
  return source
}
