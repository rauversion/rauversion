import { useEffect, useRef } from "react"

function ensureGoogleTagScript(measurementId) {
  const existingScript = document.querySelector(
    'script[src^="https://www.googletagmanager.com/gtag/js"]'
  )

  if (existingScript) return

  const script = document.createElement("script")
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  script.dataset.eventTracking = "google-analytics"
  document.head.appendChild(script)
}

function trackGoogleAnalytics(measurementId, event) {
  window.dataLayer = window.dataLayer || []
  const isNewGoogleTag = typeof window.gtag !== "function"

  if (isNewGoogleTag) {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }
    window.gtag("js", new Date())
  }

  ensureGoogleTagScript(measurementId)
  window.gtag("config", measurementId, {
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: event.title,
  })
}

function ensureMetaPixelScript() {
  if (typeof window.fbq === "function") return

  const fbq = function fbq() {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, arguments)
    } else {
      fbq.queue.push(arguments)
    }
  }

  fbq.push = fbq
  fbq.loaded = true
  fbq.version = "2.0"
  fbq.queue = []
  window.fbq = fbq
  window._fbq = fbq

  const script = document.createElement("script")
  script.async = true
  script.src = "https://connect.facebook.net/en_US/fbevents.js"
  script.dataset.eventTracking = "meta-pixel"
  document.head.appendChild(script)
}

function trackMetaPixel(pixelId) {
  ensureMetaPixelScript()

  window.__rauversionMetaPixelIds = window.__rauversionMetaPixelIds || new Set()

  if (!window.__rauversionMetaPixelIds.has(pixelId)) {
    window.fbq("init", pixelId)
    window.__rauversionMetaPixelIds.add(pixelId)
  }

  window.fbq("trackSingle", pixelId, "PageView")
}

function trackGoogleTagManager(containerId, event) {
  window.dataLayer = window.dataLayer || []

  const selector = `script[data-event-tracking-container="${containerId}"]`
  const existingScript = document.querySelector(selector)

  if (!existingScript) {
    window.dataLayer.push({
      "gtm.start": Date.now(),
      event: "gtm.js",
    })

    const script = document.createElement("script")
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`
    script.dataset.eventTrackingContainer = containerId
    document.head.appendChild(script)
  }

  window.dataLayer.push({
    event: "rauversion_event_page_view",
    event_id: event.id,
    event_slug: event.slug,
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: event.title,
  })
}

export function useEventTracking(event) {
  const trackedSignature = useRef(null)

  useEffect(() => {
    if (!event) return

    const signature = [
      event.id,
      event.slug,
      event.googleAnalyticsId,
      event.metaPixelId,
      event.googleTagManagerId,
    ].join(":")

    if (trackedSignature.current === signature) return
    trackedSignature.current = signature

    if (event.googleAnalyticsId) {
      trackGoogleAnalytics(event.googleAnalyticsId, event)
    }

    if (event.metaPixelId) {
      trackMetaPixel(event.metaPixelId)
    }

    if (event.googleTagManagerId) {
      trackGoogleTagManager(event.googleTagManagerId, event)
    }
  }, [event])
}
