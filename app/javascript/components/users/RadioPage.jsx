import React from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  Radio,
  Share2,
  SlidersHorizontal,
} from "lucide-react"

const STATUS_INTERVAL = 10_000
const TITLE_SEPARATORS = [" — ", " – ", " - "]

function splitStreamTitle(value, fallbackArtist) {
  const streamTitle = value?.trim()
  if (!streamTitle) return { artist: fallbackArtist, title: "Waiting for transmission" }

  const separator = TITLE_SEPARATORS.find((candidate) => streamTitle.includes(candidate))
  if (!separator) return { artist: fallbackArtist, title: streamTitle }

  const [artist, ...titleParts] = streamTitle.split(separator)
  return { artist: artist.trim(), title: titleParts.join(separator).trim() }
}

function formatClock(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}

export default function RadioPage() {
  const { username } = useParams()
  const audioRef = React.useRef(null)
  const [config, setConfig] = React.useState(null)
  const [status, setStatus] = React.useState({ online: false, listeners: 0 })
  const [pageError, setPageError] = React.useState(null)
  const [playbackState, setPlaybackState] = React.useState("idle")
  const [lastUpdated, setLastUpdated] = React.useState(null)
  const [shared, setShared] = React.useState(false)

  React.useEffect(() => {
    const controller = new AbortController()

    fetch(`/${encodeURIComponent(username)}/radio.json`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("radio_not_found")
        return response.json()
      })
      .then(setConfig)
      .catch((error) => {
        if (error.name !== "AbortError") setPageError(error.message)
      })

    return () => controller.abort()
  }, [username])

  React.useEffect(() => {
    if (!config?.configured) return undefined

    let active = true

    const refreshStatus = async () => {
      try {
        const response = await fetch(`/${encodeURIComponent(username)}/radio/status.json`, {
          headers: { Accept: "application/json" },
        })
        if (!response.ok) throw new Error("status_unavailable")
        const payload = await response.json()
        if (active) {
          setStatus(payload)
          setLastUpdated(new Date())
        }
      } catch (_error) {
        if (active) setStatus((current) => ({ ...current, online: false, error: "signal_unavailable" }))
      }
    }

    refreshStatus()
    const interval = window.setInterval(refreshStatus, STATUS_INTERVAL)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [config?.configured, username])

  const stationName = status.server_name || `${config?.user?.display_name || username} Radio`
  const nowPlaying = splitStreamTitle(status.title, stationName)
  const isPlaying = playbackState === "playing"
  const isLoading = playbackState === "loading"
  const isOnline = Boolean(status.online)

  React.useEffect(() => {
    if (!("mediaSession" in navigator) || !("MediaMetadata" in window) || !config?.user) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlaying.title,
      artist: nowPlaying.artist,
      album: stationName,
      artwork: config.user.avatar_url ? [{ src: config.user.avatar_url }] : [],
    })
  }, [config?.user, nowPlaying.artist, nowPlaying.title, stationName])

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (!audio.paused) {
      audio.pause()
      return
    }

    setPlaybackState("loading")
    try {
      audio.load()
      await audio.play()
    } catch (_error) {
      setPlaybackState("error")
    }
  }

  const shareRadio = async () => {
    const shareData = {
      title: `${stationName} — Rauversion Radio`,
      text: `${nowPlaying.artist} — ${nowPlaying.title}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) await navigator.share(shareData)
      else await navigator.clipboard.writeText(window.location.href)
      setShared(true)
      window.setTimeout(() => setShared(false), 1800)
    } catch (_error) {
      // The native share sheet may be intentionally dismissed.
    }
  }

  if (!config && !pageError) {
    return (
      <main className="radio-page radio-page--loading" aria-label="Loading radio">
        <Loader2 className="radio-loading-icon" aria-hidden="true" />
        <span>Locating signal / {username}</span>
      </main>
    )
  }

  if (pageError || !config) {
    return (
      <main className="radio-page radio-page--empty">
        <Radio aria-hidden="true" />
        <p>404 / Signal not found</p>
        <Link to="/">Return to Rauversion</Link>
      </main>
    )
  }

  if (!config.configured) {
    return (
      <main className="radio-page radio-page--empty">
        <div className="radio-empty-index">NO / SIGNAL</div>
        <Radio className="radio-empty-icon" aria-hidden="true" />
        <h1>{config.user.display_name} is off air.</h1>
        <p>This frequency has not been configured yet.</p>
        <div className="radio-empty-actions">
          <Link to={`/${username}`}><ArrowLeft aria-hidden="true" /> Artist profile</Link>
          {config.editable && (
            <Link to={`/${username}/settings/radio`}><SlidersHorizontal aria-hidden="true" /> Configure radio</Link>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className={`radio-page ${isPlaying ? "is-playing" : ""}`}>
      <audio
        ref={audioRef}
        src={config.stream_url}
        preload="none"
        onPlaying={() => setPlaybackState("playing")}
        onPause={() => setPlaybackState("paused")}
        onWaiting={() => setPlaybackState("loading")}
        onError={() => setPlaybackState("error")}
      />

      <header className="radio-masthead">
        <Link to={`/${username}`} className="radio-wordmark" aria-label={`Back to ${config.user.display_name}`}>
          RAU<span>/</span>RADIO
        </Link>
        <div className="radio-masthead-meta">
          <span>INDEPENDENT SIGNAL</span>
          <span className={`radio-status-dot ${isOnline ? "is-online" : ""}`}></span>
          <strong>{isOnline ? "ON AIR" : "STANDBY"}</strong>
        </div>
      </header>

      <section className="radio-hero">
        <div className="radio-editorial">
          <div className="radio-kicker">RAUVERSION BROADCAST NETWORK <span>RV–001</span></div>
          <h1 aria-label="Live transmission">
            <span>LIVE</span>
            <span>TRANS</span>
            <span>MISSION</span>
          </h1>

          <div className="radio-station-card">
            <img src={config.user.avatar_url} alt="" />
            <div>
              <span>Broadcasting from</span>
              <strong>{stationName}</strong>
              <small>@{config.user.username}</small>
            </div>
          </div>

          <dl className="radio-metrics">
            <div><dt>Listeners</dt><dd>{status.listeners ?? 0}</dd></div>
            <div><dt>Signal</dt><dd>{isOnline ? "LIVE" : "WAIT"}</dd></div>
            <div><dt>Refresh</dt><dd>{lastUpdated ? formatClock(lastUpdated) : "—"}</dd></div>
          </dl>
        </div>

        <div className="radio-deck-shell">
          <div className="radio-deck">
            <div className="radio-deck-header">
              <span>01 / LIVE SOURCE</span>
              <span className={isOnline ? "is-online" : ""}>{isOnline ? "SIGNAL LOCKED" : "SEARCHING"}</span>
            </div>

            <div className="radio-artwork">
              <div className="radio-artwork-grid" aria-hidden="true"></div>
              <div className="radio-disc" aria-hidden="true">
                <img src={config.user.avatar_url} alt="" />
              </div>
              <span className="radio-artwork-code">RVR<br />{String(status.listeners ?? 0).padStart(3, "0")}</span>
            </div>

            <div className="radio-track-info" aria-live="polite">
              <span>NOW TRANSMITTING</span>
              <p>{nowPlaying.artist}</p>
              <h2>{nowPlaying.title}</h2>
            </div>

            <div className="radio-equalizer" aria-hidden="true">
              {Array.from({ length: 24 }, (_, index) => (
                <i key={index} style={{ "--bar": index % 7, "--delay": `${(index % 8) * -0.08}s` }} />
              ))}
            </div>

            <div className="radio-controls">
              <button
                type="button"
                className="radio-play-button"
                onClick={togglePlayback}
                aria-label={isPlaying ? "Pause live radio" : "Play live radio"}
              >
                {isLoading ? <Loader2 className="radio-spin" /> : isPlaying ? <Pause /> : <Play />}
              </button>
              <div className="radio-play-copy">
                <span>{isPlaying ? "Receiving live audio" : "Live stream"}</span>
                <strong>{isPlaying ? "PAUSE" : isLoading ? "TUNING…" : "LISTEN NOW"}</strong>
              </div>
              <button type="button" className="radio-share-button" onClick={shareRadio}>
                <Share2 aria-hidden="true" /> {shared ? "COPIED" : "SHARE"}
              </button>
            </div>

            {playbackState === "error" && (
              <p className="radio-playback-error" role="alert">
                The live signal could not be opened. Check the stream URL or mixed-content policy.
              </p>
            )}
          </div>
        </div>
      </section>

      <footer className="radio-ticker" aria-label="Live transmission information">
        <div>
          <span>LIVE AUDIO</span><b>●</b><span>{stationName}</span><b>●</b>
          <span>{nowPlaying.artist} / {nowPlaying.title}</span><b>●</b><span>RAUVERSION RADIO</span><b>●</b>
          <span>LIVE AUDIO</span><b>●</b><span>{stationName}</span><b>●</b>
          <span>{nowPlaying.artist} / {nowPlaying.title}</span><b>●</b><span>RAUVERSION RADIO</span><b>●</b>
        </div>
        <a href={config.stream_url} target="_blank" rel="noreferrer" aria-label="Open raw Icecast stream">
          RAW STREAM <ExternalLink aria-hidden="true" />
        </a>
      </footer>
    </main>
  )
}
