"use client"

import React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Upload, RotateCcw, ChevronUp, ChevronDown, Repeat, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { analyzeWaveform, detectBPM } from "./audioAnalisys"
import useDjDecksStore, { DeckTrack } from "@/stores/djDecksStore"

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

interface DeckState {
  audio: HTMLAudioElement | null
  audioContext: AudioContext | null
  sourceNode: MediaElementAudioSourceNode | null
  gainNode: GainNode | null
  highShelfFilter: BiquadFilterNode | null
  midPeakFilter: BiquadFilterNode | null
  lowShelfFilter: BiquadFilterNode | null
  masterGainNode: GainNode | null
  filterNode: BiquadFilterNode | null
  isPlaying: boolean
  bpm: number
  detectedBpm: number
  pitch: number
  volume: number
  fileName: string
  trackName: string
  artist: string
  isSynced: boolean
  eq: { high: number; mid: number; low: number }
  gain: number
  filter: number
  hotCues: number[]
  currentTime: number
  duration: number
  waveformData: number[]
  isLooping: boolean
  loopStart: number
  loopEnd: number
  loopDivision: string | null
  loopSource: AudioBufferSourceNode | null
  audioBuffer: AudioBuffer | null
}

const loopSizes = [0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32] // In beats
const loopLabels = ["1/8", "1/4", "1/2", "1", "2", "4", "8", "16", "32"]

export default function DJMixer() {
  const [deckA, setDeckA] = useState<DeckState>({
    audio: null,
    audioContext: null,
    sourceNode: null,
    gainNode: null,
    highShelfFilter: null,
    midPeakFilter: null,
    lowShelfFilter: null,
    masterGainNode: null,
    filterNode: null,
    isPlaying: false,
    bpm: 130,
    detectedBpm: 130,
    pitch: 0,
    volume: 80,
    fileName: "",
    trackName: "Load Track A",
    artist: "Click upload to load a track",
    isSynced: false,
    eq: { high: 50, mid: 50, low: 50 },
    gain: 50,
    filter: 50,
    hotCues: [],
    currentTime: 0,
    duration: 0,
    waveformData: [],
    isLooping: false,
    loopStart: 0,
    loopEnd: 0,
    loopDivision: null,
    loopSource: null,
    audioBuffer: null,
  })

  const [deckB, setDeckB] = useState<DeckState>({
    audio: null,
    audioContext: null,
    sourceNode: null,
    gainNode: null,
    highShelfFilter: null,
    midPeakFilter: null,
    lowShelfFilter: null,
    masterGainNode: null,
    filterNode: null,
    isPlaying: false,
    bpm: 130,
    detectedBpm: 130,
    pitch: 0,
    volume: 80,
    fileName: "",
    trackName: "Load Track B",
    artist: "Click upload to load a track",
    isSynced: false,
    eq: { high: 50, mid: 50, low: 50 },
    gain: 50,
    filter: 50,
    hotCues: [],
    currentTime: 0,
    duration: 0,
    waveformData: [],
    isLooping: false,
    loopStart: 0,
    loopEnd: 0,
    loopDivision: null,
    loopSource: null,
    audioBuffer: null,
  })

  const [crossfader, setCrossfader] = useState(50)
  const [waveformDragging, setWaveformDragging] = useState<"A" | "B" | null>(null)
  const fileInputARef = useRef<HTMLInputElement>(null)
  const fileInputBRef = useRef<HTMLInputElement>(null)

  const [loopLengthA, setLoopLengthA] = useState(4) // Default 4 beats
  const [loopLengthB, setLoopLengthB] = useState(4)

  const [zoomLevelA, setZoomLevelA] = useState(1) // 1 = full view, 2 = 2x zoom, etc.
  const [zoomLevelB, setZoomLevelB] = useState(1)

  // DJ Decks store for loading tracks from other pages
  const { pendingDeckA, pendingDeckB, clearPendingDeckA, clearPendingDeckB } = useDjDecksStore()

  // Handle loading a track from URL (for tracks from other pages)
  const handleTrackLoad = useCallback(async (track: DeckTrack, deck: "A" | "B") => {
    const currentDeck = deck === "A" ? deckA : deckB
    const setDeck = deck === "A" ? setDeckA : setDeckB

    console.log("[v0] Loading track from URL:", track.title, "for deck", deck)

    try {
      const audio = new Audio(track.streamUrl)
      audio.crossOrigin = "anonymous"
      console.log("[v0] Audio element created from URL")

      const audioContext = new AudioContext()
      console.log("[v0] AudioContext created")

      // Wait for audio metadata to load first
      console.log("[v0] Waiting for audio metadata...")
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Audio metadata load timeout"))
        }, 30000)

        if (audio.readyState >= 1) {
          clearTimeout(timeoutId)
          console.log("[v0] Audio metadata already loaded")
          resolve()
        } else {
          audio.addEventListener("loadedmetadata", () => {
            clearTimeout(timeoutId)
            console.log("[v0] Audio metadata loaded, duration:", audio.duration)
            resolve()
          })
          audio.addEventListener("error", (e) => {
            clearTimeout(timeoutId)
            reject(new Error("Failed to load audio: " + (audio.error?.message || "Unknown error")))
          })
          audio.load()
        }
      })

      // Fetch the audio for buffer analysis (may not work with CORS restrictions)
      let audioBuffer: AudioBuffer | null = null
      let waveformData: number[] = []
      let detectedBPM = track.bpm || 130

      try {
        const response = await fetch(track.streamUrl)
        if (response.ok) {
          console.log("[v0] Fetched audio file for analysis")
          const arrayBuffer = await response.arrayBuffer()
          console.log("[v0] Got array buffer")
          audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
          console.log("[v0] Audio buffer decoded")

          // Analyze waveform
          console.log("[v0] Starting waveform analysis")
          waveformData = await analyzeWaveform(audioBuffer)
          console.log("[v0] Waveform analyzed:", waveformData.length, "points")

          // Auto-detect BPM if not provided
          if (!track.bpm) {
            console.log("[v0] Starting BPM detection")
            detectedBPM = await detectBPM(audioBuffer)
            console.log("[v0] BPM detected:", detectedBPM)
          }
        }
      } catch (fetchError) {
        console.warn("[v0] Could not fetch audio for analysis (CORS?):", fetchError)
        // Generate placeholder waveform data
        waveformData = Array.from({ length: 200 }, () => Math.random() * 80 + 20)
      }

      const sourceNode = audioContext.createMediaElementSource(audio)
      const highShelfFilter = audioContext.createBiquadFilter()
      highShelfFilter.type = "highshelf"
      highShelfFilter.frequency.value = 3000
      highShelfFilter.gain.value = 0

      const midPeakFilter = audioContext.createBiquadFilter()
      midPeakFilter.type = "peaking"
      midPeakFilter.frequency.value = 1000
      midPeakFilter.Q.value = 1
      midPeakFilter.gain.value = 0

      const lowShelfFilter = audioContext.createBiquadFilter()
      lowShelfFilter.type = "lowshelf"
      lowShelfFilter.frequency.value = 250
      lowShelfFilter.gain.value = 0

      const gainNode = audioContext.createGain()
      gainNode.gain.value = currentDeck.volume / 100

      const masterGainNode = audioContext.createGain()
      masterGainNode.gain.value = 0.8

      const filterNode = audioContext.createBiquadFilter()
      filterNode.type = "lowpass"
      filterNode.frequency.value = 20000

      // Connect the chain
      sourceNode.connect(highShelfFilter)
      highShelfFilter.connect(midPeakFilter)
      midPeakFilter.connect(lowShelfFilter)
      lowShelfFilter.connect(gainNode)
      gainNode.connect(filterNode)
      filterNode.connect(masterGainNode)
      masterGainNode.connect(audioContext.destination)

      console.log("[v0] Audio context and nodes connected")

      console.log("[v0] Updating deck state with new audio from URL")
      setDeck({
        ...currentDeck,
        audio,
        audioContext,
        audioBuffer,
        sourceNode,
        highShelfFilter,
        midPeakFilter,
        lowShelfFilter,
        gainNode,
        masterGainNode,
        filterNode,
        fileName: track.title,
        duration: track.duration || audio.duration,
        bpm: detectedBPM,
        detectedBpm: detectedBPM,
        waveformData,
        trackName: track.title,
        artist: track.artist || "Unknown Artist",
        currentTime: 0,
      })
      console.log("[v0] Deck state updated successfully - Play button should be active now")
    } catch (error) {
      console.error("[v0] Error loading track from URL:", error)
    }
  }, [deckA, deckB])

  // Watch for pending tracks from the store (added from other pages)
  useEffect(() => {
    if (pendingDeckA) {
      handleTrackLoad(pendingDeckA, "A")
      clearPendingDeckA()
    }
  }, [pendingDeckA, handleTrackLoad, clearPendingDeckA])

  useEffect(() => {
    if (pendingDeckB) {
      handleTrackLoad(pendingDeckB, "B")
      clearPendingDeckB()
    }
  }, [pendingDeckB, handleTrackLoad, clearPendingDeckB])

  // Central Sync button: syncs Deck B to Deck A (A is master, B is slave)
  const syncDecks = () => {
    syncDeckToOther("A", "B")
  }

  const adjustLoopLength = (direction: "up" | "down") => {
    const currentDeck = deckA // Assuming activeDeck is managed elsewhere or implicitly deckA for this function
    const setDeck = setDeckA // Assuming activeDeck is managed elsewhere or implicitly deckA for this function
    const loopLength = loopLengthA // Assuming activeDeck is managed elsewhere or implicitly deckA for this function
    const setLoopLength = setLoopLengthA // Assuming activeDeck is managed elsewhere or implicitly deckA for this function

    const currentIndex = loopSizes.indexOf(loopLength)
    let newIndex = currentIndex

    if (direction === "up" && currentIndex < loopSizes.length - 1) {
      newIndex = currentIndex + 1
    } else if (direction === "down" && currentIndex > 0) {
      newIndex = currentIndex - 1
    }

    const newLoopLength = loopSizes[newIndex]
    setLoopLength(newLoopLength)
    console.log(`[v0] Adjusted loop length to ${loopLabels[newIndex]} beats`)
  }

  const adjustZoom = (deck: "A" | "B", direction: "in" | "out") => {
    const currentZoom = deck === "A" ? zoomLevelA : zoomLevelB
    const setZoom = deck === "A" ? setZoomLevelA : setZoomLevelB

    let newZoom = currentZoom
    if (direction === "in") {
      newZoom = Math.min(currentZoom * 2, 32) // Max 32x zoom
    } else {
      newZoom = Math.max(currentZoom / 2, 1) // Min 1x (full view)
    }

    setZoom(newZoom)
    console.log(`[v0] Deck ${deck} zoom set to ${newZoom}x`)
  }

  const toggleLoop = () => {
    const currentDeck = deckA
    const loopLength = loopLengthA

    if (currentDeck.isLooping) {
      exitBeatDivide("A")
    } else {
      // Find the label for the current loop length
      const loopIndex = loopSizes.indexOf(loopLength)
      const loopLabel = loopLabels[loopIndex]
      activateBeatDivide(loopLabel, "A")
    }
  }

  const exitBeatDivide = (deck: "A" | "B") => {
    const currentDeck = deck === "A" ? deckA : deckB
    const setDeck = deck === "A" ? setDeckA : setDeckB

    if (!currentDeck.loopSource) return

    console.log("[v0] Exiting loop on deck", deck)

    // Stop the loop source
    currentDeck.loopSource.stop()
    currentDeck.loopSource.disconnect()

    // Resume normal playback
    if (currentDeck.audio) {
      currentDeck.audio.currentTime = currentDeck.loopStart || currentDeck.currentTime
      if (currentDeck.isPlaying) {
        currentDeck.audio.play()
      }
    }

    setDeck({
      ...currentDeck,
      isLooping: false,
      loopSource: null,
      loopStart: null,
      loopEnd: null,
      loopDivision: null,
    })
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setDeckA((prev) => {
        if (prev.audio && prev.isPlaying) {
          return { ...prev, currentTime: prev.audio.currentTime }
        }
        return prev
      })
      setDeckB((prev) => {
        if (prev.audio && prev.isPlaying) {
          return { ...prev, currentTime: prev.audio.currentTime }
        }
        return prev
      })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const updatePlaybackRate = (deck: DeckState) => {
    if (deck.audio) {
      const bpmRatio = deck.bpm / deck.detectedBpm
      const pitchRatio = Math.pow(2, deck.pitch / 12)
      deck.audio.playbackRate = bpmRatio * pitchRatio
    }
  }

  const createAudioNodes = (audio: HTMLAudioElement): Partial<DeckState> => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const sourceNode = audioContext.createMediaElementSource(audio)

    // Create EQ filters
    const highShelfFilter = audioContext.createBiquadFilter()
    highShelfFilter.type = "highshelf"
    highShelfFilter.frequency.value = 10000
    highShelfFilter.gain.value = 0

    const midPeakFilter = audioContext.createBiquadFilter()
    midPeakFilter.type = "peaking"
    midPeakFilter.frequency.value = 1000
    midPeakFilter.Q.value = 1
    midPeakFilter.gain.value = 0

    const lowShelfFilter = audioContext.createBiquadFilter()
    lowShelfFilter.type = "lowshelf"
    lowShelfFilter.frequency.value = 200
    lowShelfFilter.gain.value = 0

    // Create gain nodes
    const gainNode = audioContext.createGain()
    gainNode.gain.value = 1

    const masterGainNode = audioContext.createGain()
    masterGainNode.gain.value = 0.8

    // Create filter node for sweep filter
    const filterNode = audioContext.createBiquadFilter()
    filterNode.type = "lowpass"
    filterNode.frequency.value = 22050
    filterNode.Q.value = 1

    // Connect the audio graph
    sourceNode
      .connect(highShelfFilter)
      .connect(midPeakFilter)
      .connect(lowShelfFilter)
      .connect(filterNode)
      .connect(gainNode)
      .connect(masterGainNode)
      .connect(audioContext.destination)

    return {
      audioContext,
      sourceNode,
      gainNode,
      highShelfFilter,
      midPeakFilter,
      lowShelfFilter,
      masterGainNode,
      filterNode,
    }
  }

  const handleFileUpload = async (file: File, deck: "A" | "B") => {
    const currentDeck = deck === "A" ? deckA : deckB
    const setDeck = deck === "A" ? setDeckA : setDeckB

    console.log("[v0] Loading file:", file.name, "for deck", deck)

    try {
      const url = URL.createObjectURL(file)
      const audio = new Audio(url)
      console.log("[v0] Audio element created")

      const audioContext = new AudioContext()
      console.log("[v0] AudioContext created")

      // Load the audio buffer for analysis and looping
      const response = await fetch(url)
      console.log("[v0] Fetched audio file")
      const arrayBuffer = await response.arrayBuffer()
      console.log("[v0] Got array buffer")
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      console.log("[v0] Audio buffer decoded")

      // Analyze waveform
      console.log("[v0] Starting waveform analysis")
      const waveformData = await analyzeWaveform(audioBuffer)
      console.log("[v0] Waveform analyzed:", waveformData.length, "points")

      console.log("[v0] Waiting for audio metadata...")
      await new Promise<void>((resolve) => {
        if (audio.readyState >= 1) {
          console.log("[v0] Audio metadata already loaded")
          resolve()
        } else {
          audio.addEventListener("loadedmetadata", () => {
            console.log("[v0] Audio metadata loaded, duration:", audio.duration)
            resolve()
          })
          // Force load
          audio.load()
        }
      })

      // Auto-detect BPM
      console.log("[v0] Starting BPM detection")
      const detectedBPM = await detectBPM(audioBuffer)
      console.log("[v0] BPM detected:", detectedBPM)

      const sourceNode = audioContext.createMediaElementSource(audio)
      const highShelfFilter = audioContext.createBiquadFilter()
      highShelfFilter.type = "highshelf"
      highShelfFilter.frequency.value = 3000
      highShelfFilter.gain.value = 0

      const midPeakFilter = audioContext.createBiquadFilter()
      midPeakFilter.type = "peaking"
      midPeakFilter.frequency.value = 1000
      midPeakFilter.Q.value = 1
      midPeakFilter.gain.value = 0

      const lowShelfFilter = audioContext.createBiquadFilter()
      lowShelfFilter.type = "lowshelf"
      lowShelfFilter.frequency.value = 250
      lowShelfFilter.gain.value = 0

      const gainNode = audioContext.createGain()
      gainNode.gain.value = currentDeck.volume / 100

      const masterGainNode = audioContext.createGain()
      masterGainNode.gain.value = 0.8

      const filterNode = audioContext.createBiquadFilter()
      filterNode.type = "lowpass"
      filterNode.frequency.value = 20000

      // Connect the chain
      sourceNode.connect(highShelfFilter)
      highShelfFilter.connect(midPeakFilter)
      midPeakFilter.connect(lowShelfFilter)
      lowShelfFilter.connect(gainNode)
      gainNode.connect(filterNode)
      filterNode.connect(masterGainNode)
      masterGainNode.connect(audioContext.destination)

      console.log("[v0] Audio context and nodes connected")

      console.log("[v0] Updating deck state with new audio")
      setDeck({
        ...currentDeck,
        audio,
        audioContext,
        audioBuffer,
        sourceNode,
        highShelfFilter,
        midPeakFilter,
        lowShelfFilter,
        gainNode,
        masterGainNode,
        filterNode,
        fileName: file.name,
        duration: audio.duration,
        bpm: detectedBPM,
        detectedBpm: detectedBPM,
        waveformData,
        trackName: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Local File",
        currentTime: 0,
      })
      console.log("[v0] Deck state updated successfully - Play button should be active now")
    } catch (error) {
      console.error("[v0] Error loading file:", error)
    }
  }

  const togglePlay = (deck: "A" | "B") => {
    const currentDeck = deck === "A" ? deckA : deckB
    const setDeck = deck === "A" ? setDeckA : setDeckB

    if (!currentDeck.audio) return

    if (currentDeck.isPlaying) {
      currentDeck.audio.pause()
      setDeck({ ...currentDeck, isPlaying: false })
    } else {
      currentDeck.audio.play()
      setDeck({ ...currentDeck, isPlaying: true })
    }
  }

  const handleWaveformScrub = (e: React.MouseEvent, deck: "A" | "B") => {
    const currentDeck = deck === "A" ? deckA : deckB

    if (!currentDeck.audio || currentDeck.duration === 0) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const newTime = percentage * currentDeck.duration

    console.log("[v0] Waveform scrub - Time:", newTime.toFixed(2))

    if (currentDeck.audio) {
      currentDeck.audio.currentTime = newTime
    }
  }

  const handleWaveformDragStart = (e: React.MouseEvent, deck: "A" | "B") => {
    e.preventDefault()
    setWaveformDragging(deck)
    handleWaveformScrub(e, deck)
    console.log("[v0] Waveform drag started on deck", deck)
  }

  const handleWaveformDragMove = (e: React.MouseEvent) => {
    if (!waveformDragging) return
    handleWaveformScrub(e, waveformDragging)
  }

  const handleWaveformDragEnd = () => {
    if (waveformDragging) {
      console.log("[v0] Waveform drag ended on deck", waveformDragging)
      setWaveformDragging(null)
    }
  }

  const handleJogwheelScrub = (e: React.MouseEvent, deck: "A" | "B") => {
    const currentDeck = deck === "A" ? deckA : deckB
    const setDeck = deck === "A" ? setDeckA : setDeckB

    if (!currentDeck.audio || currentDeck.duration === 0) return

    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX)

    let lastAngle = startAngle
    let lastTime = Date.now()
    let totalRotation = 0
    let lastVelocity = 0

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const now = Date.now()
      const deltaTime = (now - lastTime) / 1000

      if (deltaTime === 0) return

      const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX)
      let deltaAngle = currentAngle - lastAngle

      // Normalizar el ángulo para manejar el wrap-around
      if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI
      if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI

      totalRotation += deltaAngle

      // Calcular velocidad angular
      const angularVelocity = deltaAngle / deltaTime
      lastVelocity = angularVelocity

      // Sensibilidad: 1 vuelta completa (2π) = 4 segundos de audio
      const sensitivity = 4
      const timeChange = (deltaAngle / (2 * Math.PI)) * sensitivity

      if (currentDeck.audio) {
        const newTime = Math.max(0, Math.min(currentDeck.duration, currentDeck.audio.currentTime + timeChange))
        currentDeck.audio.currentTime = newTime

        console.log(
          "[v0] Jogwheel - Delta:",
          deltaAngle.toFixed(3),
          "Total:",
          totalRotation.toFixed(3),
          "Velocity:",
          angularVelocity.toFixed(2),
          "Time change:",
          timeChange.toFixed(3),
          "New time:",
          newTime.toFixed(2),
        )
      }

      lastAngle = currentAngle
      lastTime = now
    }

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)

      console.log(
        "[v0] Jogwheel ended - Total rotation:",
        totalRotation.toFixed(3),
        "radians, Final velocity:",
        lastVelocity.toFixed(2),
      )

      // Aplicar inercia si hay velocidad suficiente
      if (Math.abs(lastVelocity) > 1 && currentDeck.audio) {
        const inertiaDecay = 0.95 // Factor de decaimiento
        let velocity = lastVelocity

        const applyInertia = () => {
          if (Math.abs(velocity) < 0.1 || !currentDeck.audio) return

          const sensitivity = 4
          const timeChange = ((velocity * 0.016) / (2 * Math.PI)) * sensitivity // 60fps aprox

          const newTime = Math.max(0, Math.min(currentDeck.duration, currentDeck.audio.currentTime + timeChange))
          currentDeck.audio.currentTime = newTime

          velocity *= inertiaDecay
          requestAnimationFrame(applyInertia)
        }

        applyInertia()
      }
    }

    console.log("[v0] Jogwheel started on deck", deck)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  // Sync BPM + phase: when deck "A" sync is pressed, A is slave and B is master; vice versa
  const syncBPM = (deck: "A" | "B") => {
    if (deck === "A") {
      // Deck A is the slave, Deck B is the master
      syncDeckToOther("B", "A")
    } else {
      // Deck B is the slave, Deck A is the master
      syncDeckToOther("A", "B")
    }
  }

  const updateEQ = (deck: DeckState, eq: { high: number; mid: number; low: number }) => {
    if (deck.highShelfFilter && deck.midPeakFilter && deck.lowShelfFilter) {
      // Convert 0-100 range to -12 to +12 dB
      deck.highShelfFilter.gain.value = (eq.high - 50) * 0.24
      deck.midPeakFilter.gain.value = (eq.mid - 50) * 0.24
      deck.lowShelfFilter.gain.value = (eq.low - 50) * 0.24
    }
  }

  const updateGain = (deck: DeckState, gain: number) => {
    if (deck.gainNode) {
      // Convert 0-100 range to 0-2x gain
      deck.gainNode.gain.value = gain / 50
    }
  }

  const updateFilter = (deck: DeckState, filter: number) => {
    if (deck.filterNode) {
      // Convert 0-100 to frequency sweep from 200Hz to 22050Hz
      const minFreq = 200
      const maxFreq = 22050
      const freq = minFreq + (maxFreq - minFreq) * (filter / 100)
      deck.filterNode.frequency.value = freq
    }
  }

  const handleEqChange = (deck: "A" | "B", band: "low" | "mid" | "high", value: number) => {
    const setDeck = deck === "A" ? setDeckA : setDeckB
    const currentDeck = deck === "A" ? deckA : deckB

    setDeck({
      ...currentDeck,
      eq: {
        ...currentDeck.eq,
        [band]: value,
      },
    })
  }

  useEffect(() => {
    updatePlaybackRate(deckA)
    updateEQ(deckA, deckA.eq)
    updateGain(deckA, deckA.gain)
    updateFilter(deckA, deckA.filter)
  }, [deckA])

  useEffect(() => {
    updatePlaybackRate(deckB)
    updateEQ(deckB, deckB.eq)
    updateGain(deckB, deckB.gain)
    updateFilter(deckB, deckB.filter)
  }, [deckB])

  const getPitchNote = (pitch: number): string => {
    const noteIndex = ((Math.round(pitch) % 12) + 12) % 12
    return NOTES[noteIndex]
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const calculateLoopDuration = (subdivision: string, bpm: number): number => {
    const secondsPerBeat = 60 / bpm

    switch (subdivision) {
      case "1/32":
        return secondsPerBeat * 0.125
      case "1/16":
        return secondsPerBeat * 0.25
      case "1/8":
        return secondsPerBeat * 0.5
      case "1/4":
        return secondsPerBeat
      case "1/2":
        return secondsPerBeat * 2
      case "1":
        return secondsPerBeat * 4 // 1 bar = 4 beats
      case "2":
        return secondsPerBeat * 8 // 2 bars
      case "4":
        return secondsPerBeat * 16 // 4 bars
      case "8":
        return secondsPerBeat * 32 // 8 bars
      case "16":
        return secondsPerBeat * 64 // 16 bars
      default:
        return secondsPerBeat * 4
    }
  }

  const quantizeToGrid = (currentTime: number, bpm: number): number => {
    const secondsPerBeat = 60 / bpm
    return Math.floor(currentTime / secondsPerBeat) * secondsPerBeat
  }

  // Helper: Calculate seconds per beat from BPM
  const getSecondsPerBeat = (bpm: number): number => {
    return 60 / bpm
  }

  // Helper: Get the beat index (which beat number we're on) from currentTime and BPM
  // Using Math.floor for consistent beat alignment
  const getBeatIndex = (currentTime: number, bpm: number): number => {
    const secondsPerBeat = getSecondsPerBeat(bpm)
    return Math.floor(currentTime / secondsPerBeat)
  }

  // Core beat sync function: syncs slave deck to master deck (tempo + phase alignment)
  const syncDeckToOther = (master: "A" | "B", slave: "A" | "B") => {
    // Validate that master and slave are different decks
    if (master === slave) {
      console.warn(`[v0] Cannot sync: master and slave decks are the same (${master})`)
      return
    }

    const masterDeck = master === "A" ? deckA : deckB
    const slaveDeck = slave === "A" ? deckA : deckB
    const setSlaveFunc = slave === "A" ? setDeckA : setDeckB

    // Validate master deck has valid audio and BPM
    if (!masterDeck.audio || masterDeck.duration === 0 || !masterDeck.bpm || masterDeck.bpm <= 0) {
      console.warn(`[v0] Cannot sync: missing bpm or audio on deck ${master} (master)`)
      return
    }

    // Validate slave deck has valid audio and BPM
    if (!slaveDeck.audio || slaveDeck.duration === 0 || !slaveDeck.bpm || slaveDeck.bpm <= 0) {
      console.warn(`[v0] Cannot sync: missing bpm or audio on deck ${slave} (slave)`)
      return
    }

    // Step 1: Tempo Sync - copy master BPM to slave
    const newSlaveBpm = masterDeck.bpm
    console.log(`[v0] Syncing tempo: Deck ${slave} BPM ${slaveDeck.bpm} -> ${newSlaveBpm}`)

    // Step 2: Phase/Beat Sync - align slave to the same beat index as master
    const masterQuantizedTime = quantizeToGrid(masterDeck.audio.currentTime, masterDeck.bpm)
    const beatsMaster = getBeatIndex(masterQuantizedTime, masterDeck.bpm)

    // Calculate new position for slave: same beat index, using slave's new BPM (which equals master BPM now)
    const secondsPerBeatSlave = getSecondsPerBeat(newSlaveBpm)
    const newSlaveTime = beatsMaster * secondsPerBeatSlave

    // Clamp to valid range within the slave track
    const clampedSlaveTime = Math.max(0, Math.min(slaveDeck.duration, newSlaveTime))

    console.log(
      `[v0] Phase sync: Master beat index ${beatsMaster}, Slave currentTime ${slaveDeck.audio.currentTime.toFixed(2)} -> ${clampedSlaveTime.toFixed(2)}`
    )

    // Apply the new currentTime to the slave audio element
    slaveDeck.audio.currentTime = clampedSlaveTime

    // Update slave deck state with new BPM and sync flag
    const newSlaveDeck: DeckState = {
      ...slaveDeck,
      bpm: newSlaveBpm,
      isSynced: true,
      currentTime: clampedSlaveTime,
    }

    setSlaveFunc(newSlaveDeck)

    // Update playback rate for the slave deck
    updatePlaybackRate(newSlaveDeck)

    console.log(`[v0] Beat sync complete: Deck ${slave} synced to Deck ${master}`)
  }

  const activateBeatDivide = async (subdivision: string, deck: "A" | "B") => {
    const currentDeck = deck === "A" ? deckA : deckB
    const setDeck = deck === "A" ? setDeckA : setDeckB

    if (!currentDeck.audio || !currentDeck.audioContext || !currentDeck.audioBuffer) {
      console.log("[v0] Cannot activate loop: missing audio or context")
      return
    }

    console.log("[v0] Activating beat loop:", subdivision, "on deck", deck)

    const loopDuration = calculateLoopDuration(subdivision, currentDeck.bpm)
    const quantizedStart = quantizeToGrid(currentDeck.currentTime, currentDeck.bpm)
    const loopEnd = quantizedStart + loopDuration

    console.log("[v0] Loop - Start:", quantizedStart, "End:", loopEnd, "Duration:", loopDuration)

    // Stop current loop if exists
    if (currentDeck.loopSource) {
      currentDeck.loopSource.stop()
      currentDeck.loopSource.disconnect()
    }

    // Pause the main audio
    if (currentDeck.audio) {
      currentDeck.audio.pause()
    }

    // Create a new buffer source for looping
    const loopSource = currentDeck.audioContext.createBufferSource()
    loopSource.buffer = currentDeck.audioBuffer
    loopSource.loop = true
    loopSource.loopStart = quantizedStart
    loopSource.loopEnd = loopEnd

    // Connect to the existing audio chain (after the source node)
    if (currentDeck.highShelfFilter) {
      loopSource.connect(currentDeck.highShelfFilter)
    }

    // Start playback from the loop start
    loopSource.start(0, quantizedStart)

    setDeck({
      ...currentDeck,
      isLooping: true,
      loopStart: quantizedStart,
      loopEnd: loopEnd,
      loopDivision: subdivision,
      loopSource: loopSource,
      isPlaying: true,
    })
  }

  const deactivateBeatDivide = (deck: "A" | "B") => {
    const currentDeck = deck === "A" ? deckA : deckB
    const setDeck = deck === "A" ? setDeckA : setDeckB

    console.log("[v0] Deactivating beat loop on deck", deck)

    if (currentDeck.loopSource) {
      currentDeck.loopSource.stop()
      currentDeck.loopSource.disconnect()
    }

    // Resume main audio at the loop end position
    if (currentDeck.audio) {
      currentDeck.audio.currentTime = currentDeck.loopEnd || currentDeck.currentTime
      currentDeck.audio.play()
    }

    setDeck({
      ...currentDeck,
      isLooping: false,
      loopStart: 0,
      loopEnd: 0,
      loopDivision: null,
      loopSource: null,
    })
  }

  const handleHotCue = (deckId: "A" | "B", cueNumber: number) => {
    const currentDeck = deckId === "A" ? deckA : deckB
    const setDeck = deckId === "A" ? setDeckA : setDeckB

    if (!currentDeck.audio) return

    const currentTime = currentDeck.audio.currentTime
    const cueIndex = cueNumber - 1

    // If cue point doesn't exist, set it
    if (!currentDeck.hotCues[cueIndex] && currentDeck.hotCues[cueIndex] !== 0) {
      const newCues = [...currentDeck.hotCues]
      newCues[cueIndex] = currentTime
      setDeck({ ...currentDeck, hotCues: newCues })
      console.log(`[v0] Hot Cue ${cueNumber} set at ${currentTime.toFixed(2)}s on deck ${deckId}`)
    } else {
      // If cue point exists, jump to it
      currentDeck.audio.currentTime = currentDeck.hotCues[cueIndex]
      console.log(
        `[v0] Jumped to Hot Cue ${cueNumber} at ${currentDeck.hotCues[cueIndex].toFixed(2)}s on deck ${deckId}`,
      )
    }
  }

  // Clear a hot cue point (shift + click)
  const clearHotCue = (deckId: "A" | "B", cueNumber: number) => {
    const currentDeck = deckId === "A" ? deckA : deckB
    const setDeck = deckId === "A" ? setDeckA : setDeckB

    const cueIndex = cueNumber - 1
    const newCues = [...currentDeck.hotCues]
    newCues[cueIndex] = undefined as any
    setDeck({ ...currentDeck, hotCues: newCues })
    console.log(`[v0] Hot Cue ${cueNumber} cleared on deck ${deckId}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex gap-4">
          {/* Deck A */}
          <DeckPanel
            deck={deckA}
            deckLabel="A"
            onFileUpload={(file: File) => handleFileUpload(file, "A")}
            onTogglePlay={() => togglePlay("A")}
            onBpmChange={(bpm: number) => setDeckA({ ...deckA, bpm })}
            onPitchChange={(pitch: number) => setDeckA({ ...deckA, pitch })}
            onSync={() => syncBPM("A")}
            onEqChange={(band: "low" | "mid" | "high", value: number) => handleEqChange("A", band, value)}
            onGainChange={(value: number) => setDeckA({ ...deckA, gain: value })}
            onFilterChange={(value: number) => setDeckA({ ...deckA, filter: value })}
            onWaveformScrub={(e: React.MouseEvent) => handleWaveformScrub(e, "A")}
            onJogwheelScrub={(e: React.MouseEvent) => handleJogwheelScrub(e, "A")}
            fileInputRef={fileInputARef}
            getPitchNote={getPitchNote}
            formatTime={formatTime}
            loopLength={loopLengthA}
            adjustLoopLength={(direction: "up" | "down") => adjustLoopLength(direction)}
            toggleLoop={() => toggleLoop()}
            handleHotCue={handleHotCue}
            clearHotCue={clearHotCue}
          />

          {/* Center Waveform Display */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Top Controls */}
            <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-4 flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">Crossfader</span>
                <div className="w-64 h-2 bg-zinc-800 rounded-full relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={crossfader}
                    onChange={(e) => setCrossfader(Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-500 rounded-full"
                    style={{ left: `calc(${crossfader}% - 8px)` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500/20 rounded-full"
                    style={{ width: `${crossfader}%` }}
                  />
                </div>
              </div>
              {/* Add Sync button here */}
              <Button variant="outline" onClick={syncDecks}>
                Sync Decks
              </Button>
            </div>

            {/* Waveform Display */}
            <div className="flex-1 bg-zinc-950 rounded-lg border border-zinc-800 relative overflow-hidden min-h-[300px]">
              <div
                className="absolute inset-0"
                onMouseDown={(e) => {
                  // Determine which deck based on click position
                  const rect = e.currentTarget.getBoundingClientRect()
                  const y = e.clientY - rect.top
                  const isTopHalf = y < rect.height / 2
                  handleWaveformDragStart(e, isTopHalf ? "A" : "B")
                }}
                onMouseMove={handleWaveformDragMove}
                onMouseUp={handleWaveformDragEnd}
                onMouseLeave={handleWaveformDragEnd}
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute inset-x-0 h-px bg-zinc-700 top-1/2" />
                  <div className="absolute inset-y-0 w-px bg-white top-0 left-1/2" />
                </div>
                <WaveformDisplay deck={deckA} color="emerald" position="top" zoomLevel={zoomLevelA} />
                <WaveformDisplay deck={deckB} color="blue" position="bottom" zoomLevel={zoomLevelB} />
              </div>

              <div className="absolute top-2 left-2 flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={() => adjustZoom("A", "out")}
                  className="w-6 h-6 bg-zinc-800 hover:bg-zinc-700 rounded flex items-center justify-center text-emerald-400"
                  title="Zoom out deck A"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-emerald-400 font-mono w-8 text-center">{zoomLevelA}x</span>
                <button
                  onClick={() => adjustZoom("A", "in")}
                  className="w-6 h-6 bg-zinc-800 hover:bg-zinc-700 rounded flex items-center justify-center text-emerald-400"
                  title="Zoom in deck A"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute bottom-2 left-2 flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={() => adjustZoom("B", "out")}
                  className="w-6 h-6 bg-zinc-800 hover:bg-zinc-700 rounded flex items-center justify-center text-blue-400"
                  title="Zoom out deck B"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-blue-400 font-mono w-8 text-center">{zoomLevelB}x</span>
                <button
                  onClick={() => adjustZoom("B", "in")}
                  className="w-6 h-6 bg-zinc-800 hover:bg-zinc-700 rounded flex items-center justify-center text-blue-400"
                  title="Zoom in deck B"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Deck B */}
          <DeckPanel
            deck={deckB}
            deckLabel="B"
            onFileUpload={(file: File) => handleFileUpload(file, "B")}
            onTogglePlay={() => togglePlay("B")}
            onBpmChange={(bpm: number) => setDeckB({ ...deckB, bpm })}
            onPitchChange={(pitch: number) => setDeckB({ ...deckB, pitch })}
            onSync={() => syncBPM("B")}
            onEqChange={(band: "low" | "mid" | "high", value: number) => handleEqChange("B", band, value)}
            onGainChange={(value: number) => setDeckB({ ...deckB, gain: value })}
            onFilterChange={(value: number) => setDeckB({ ...deckB, filter: value })}
            onWaveformScrub={(e: React.MouseEvent) => handleWaveformScrub(e, "B")}
            onJogwheelScrub={(e: React.MouseEvent) => handleJogwheelScrub(e, "B")}
            fileInputRef={fileInputBRef}
            getPitchNote={getPitchNote}
            formatTime={formatTime}
            isRight
            loopLength={loopLengthB}
            adjustLoopLength={(direction: "up" | "down") => adjustLoopLength(direction)}
            toggleLoop={() => toggleLoop()}
            handleHotCue={handleHotCue}
            clearHotCue={clearHotCue}
          />
        </div>
      </div>
    </div>
  )
}

function DeckPanel({
  deck,
  deckLabel,
  onFileUpload,
  onTogglePlay,
  onBpmChange,
  onPitchChange,
  onSync,
  onEqChange,
  onGainChange,
  onFilterChange,
  onWaveformScrub,
  onJogwheelScrub,
  fileInputRef,
  getPitchNote,
  formatTime,
  isRight,
  loopLength,
  adjustLoopLength,
  toggleLoop,
  handleHotCue,
  clearHotCue,
}: {
  deck: DeckState
  deckLabel: string
  onFileUpload: (file: File) => void
  onTogglePlay: () => void
  onBpmChange: (bpm: number) => void
  onPitchChange: (pitch: number) => void
  onSync: () => void
  onEqChange: (band: "low" | "mid" | "high", value: number) => void
  onGainChange: (value: number) => void
  onFilterChange: (value: number) => void
  onWaveformScrub: (e: React.MouseEvent) => void
  onJogwheelScrub: (e: React.MouseEvent) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  getPitchNote: (pitch: number) => string
  formatTime: (seconds: number) => string
  isRight?: boolean
  loopLength: number
  adjustLoopLength: (direction: "up" | "down") => void
  toggleLoop: () => void
  handleHotCue: (deckId: "A" | "B", cueNumber: number) => void
  clearHotCue: (deckId: "A" | "B", cueNumber: number) => void
}) {
  return (
    <div className="w-80 flex flex-col gap-2">
      {/* Track Info Header */}
      <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{deck.trackName}</h3>
            <p className="text-xs text-zinc-400 truncate">{deck.artist}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs font-mono text-emerald-400">{Math.round(deck.bpm)} BPM</span>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3 w-3" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onFileUpload(file)
              }}
              className="hidden"
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            {formatTime(deck.currentTime)} / {formatTime(deck.duration)}
          </span>
          <div className="flex items-center gap-2">
            <button
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                deck.isSynced ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
              )}
              onClick={onSync}
            >
              Sync
            </button>
            <span className="text-zinc-400">BPM</span>
          </div>
        </div>
        <div
          className="mt-2 h-12 bg-zinc-900 rounded relative overflow-hidden cursor-pointer"
          onMouseDown={(e) => onWaveformScrub(e)}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {deck.waveformData.length > 0
              ? deck.waveformData.slice(0, 80).map((height: number, i: number) => {
                  return <div key={i} className="w-0.5 mx-px bg-emerald-400/60" style={{ height: `${height}%` }} />
                })
              : [...Array(80)].map((_, i) => (
                  <div key={i} className="w-0.5 mx-px bg-zinc-700" style={{ height: `${Math.random() * 80 + 20}%` }} />
                ))}
          </div>
          {/* Playhead for mini waveform */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
            style={{
              left: `${(deck.duration > 0 ? deck.currentTime / deck.duration : 0) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Main Control Section */}
      <div className="flex-1 bg-zinc-900 rounded-lg border border-zinc-800 p-4 flex flex-col">
        <div className="flex gap-3">
          {/* Left Side - Hot Cues and Loop Control */}
          <div className="flex flex-col items-center gap-1 w-12">
            {/* Hot Cues 1-4 */}
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={(e) => {
                  if (e.shiftKey) {
                    clearHotCue(deckLabel as "A" | "B", num)
                  } else {
                    handleHotCue(deckLabel as "A" | "B", num)
                  }
                }}
                className={`w-8 h-8 text-xs rounded font-bold transition-colors ${
                  deck.hotCues[num - 1] !== undefined
                    ? deckLabel === "A"
                      ? "bg-emerald-500 text-black"
                      : "bg-blue-500 text-black"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-500"
                }`}
              >
                {num}
              </button>
            ))}

            {/* Loop Control */}
            <div
              className={cn(
                "w-12 h-16 rounded flex flex-col items-center justify-center border-2 transition-colors mt-1 mb-1",
                deck.isLooping
                  ? deckLabel === "A"
                    ? "bg-emerald-500 border-emerald-400"
                    : "bg-blue-500 border-blue-400"
                  : "bg-zinc-900 border-zinc-700",
              )}
            >
              <button onClick={() => adjustLoopLength("up")} className="text-zinc-400 hover:text-white text-xs h-4">
                <ChevronUp className="h-3 w-3" />
              </button>
              <button onClick={() => toggleLoop()} className="flex items-center justify-center gap-1 flex-1">
                <Repeat className="h-3 w-3" />
                <span className="text-xs font-bold">{loopLabels[loopSizes.indexOf(loopLength)]}</span>
              </button>
              <button onClick={() => adjustLoopLength("down")} className="text-zinc-400 hover:text-white text-xs h-4">
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            {/* Hot Cues 5-8 */}
            {[5, 6, 7, 8].map((num) => (
              <button
                key={num}
                onClick={(e) => {
                  if (e.shiftKey) {
                    clearHotCue(deckLabel as "A" | "B", num)
                  } else {
                    handleHotCue(deckLabel as "A" | "B", num)
                  }
                }}
                className={`w-8 h-8 text-xs rounded font-bold transition-colors ${
                  deck.hotCues[num - 1] !== undefined
                    ? deckLabel === "A"
                      ? "bg-emerald-500 text-black"
                      : "bg-blue-500 text-black"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-500"
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Center - Jogwheel and Controls */}
          <div className="flex-1 flex flex-col items-center gap-2">
            {/* Pitch/Tempo Controls Above Jogwheel */}
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-zinc-500">%</span>
                <span className="text-zinc-400 font-mono w-10 text-center">
                  {(((deck.bpm - 120) / 120) * 100).toFixed(1)}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex gap-1 mb-0.5">
                  <button className="text-zinc-400 hover:text-white px-1">-</button>
                  <button className="text-zinc-400 hover:text-white px-1">+</button>
                </div>
                <div className="flex gap-1">
                  <button className="text-zinc-400 hover:text-white px-1">{"<"}</button>
                  <button className="text-zinc-400 hover:text-white px-1">{">"}</button>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="text-zinc-400 hover:text-white px-1">{"<"}</button>
                <span className="text-zinc-400 font-mono w-6 text-center">32</span>
                <button className="text-zinc-400 hover:text-white px-1">{">"}</button>
              </div>
            </div>

            {/* Jogwheel */}
            <div className="relative w-40 h-40 cursor-grab active:cursor-grabbing" onMouseDown={onJogwheelScrub}>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 border-4 border-zinc-700 shadow-2xl">
                <div className="absolute inset-4 rounded-full overflow-hidden">
                  <img
                    src="/images/vinyl-texture.jpg"
                    alt=""
                    className={cn("w-full h-full object-cover opacity-30", deck.isPlaying && "animate-spin")}
                    style={{ animationDuration: "3s" }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-zinc-900 border-2 border-red-500 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-zinc-800" />
                  </div>
                </div>
              </div>
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="80"
                  cy="80"
                  r="76"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-emerald-500"
                  strokeDasharray={`${deck.duration > 0 ? (deck.currentTime / deck.duration) * 477 : 0} 477`}
                />
              </svg>
            </div>

            {/* FX Button */}
            <button className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded px-3 py-1 text-xs transition-colors">
              FX
            </button>

            {/* Cue and Play Buttons */}
            <div className="flex gap-2 w-full">
              <button className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-xs transition-colors flex items-center justify-center gap-1">
                <RotateCcw className="h-3 w-3" />
                Cue
              </button>
              <button
                onClick={onTogglePlay}
                disabled={!deck.audio}
                className={cn(
                  "flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center justify-center gap-1",
                  !deck.audio && "opacity-50 cursor-not-allowed",
                  deck.isPlaying
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white",
                )}
              >
                {deck.isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </button>
            </div>

            {/* Tempo/Tune Sliders Below */}
            <div className="flex gap-3 w-full text-xs mt-1">
              <div className="flex-1 flex flex-col items-center gap-0.5">
                <label className="text-zinc-500 text-[10px]">Tempo</label>
                <input
                  type="range"
                  min="60"
                  max="180"
                  value={deck.bpm}
                  onChange={(e) => onBpmChange(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-[10px] font-mono text-zinc-400">{Math.round(deck.bpm)}</span>
              </div>

              <div className="flex-1 flex flex-col items-center gap-0.5">
                <label className="text-zinc-500 text-[10px]">Tune</label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.1"
                  value={deck.pitch}
                  onChange={(e) => onPitchChange(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-[10px] font-mono text-zinc-400">{getPitchNote(deck.pitch)}</span>
              </div>
            </div>
          </div>

          {/* Right Side - EQ Knobs */}
          <div className="flex flex-col items-center gap-2 w-16">
            <EQKnob label="High" value={deck.eq.high} onChange={(v) => onEqChange("high", v)} />
            <EQKnob label="Gain" value={deck.gain} onChange={onGainChange} />
            <EQKnob label="Mid" value={deck.eq.mid} onChange={(v) => onEqChange("mid", v)} />
            <EQKnob label="Low" value={deck.eq.low} onChange={(v) => onEqChange("low", v)} />
            <EQKnob label="Filter" value={deck.filter} onChange={onFilterChange} />
          </div>
        </div>
      </div>
    </div>
  )
}

function EQKnob({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const startYRef = useRef(0)
  const startValueRef = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    startYRef.current = e.clientY
    startValueRef.current = value
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startYRef.current - e.clientY
      const newValue = Math.max(0, Math.min(100, startValueRef.current + delta * 0.5))
      onChange(newValue)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, onChange])

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-10 h-10 cursor-pointer" onMouseDown={handleMouseDown}>
        {/* Knob */}
        <div className="absolute inset-0 rounded-full bg-zinc-800 border-2 border-zinc-700">
          <div
            className="absolute top-1 left-1/2 w-0.5 h-3 bg-white -translate-x-1/2 origin-bottom transition-transform"
            style={{ transform: `translateX(-50%) rotate(${(value - 50) * 2.7}deg)` }}
          />
        </div>
        {/* Value Arc */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-emerald-500"
            strokeDasharray={`${value * 1.13} 113`}
          />
        </svg>
      </div>
      <div className="text-[10px] text-zinc-400">{label}</div>
      <div className="text-[9px] text-zinc-600">{value.toFixed(0)}</div>
    </div>
  )
}

function WaveformDisplay({
  deck,
  color,
  position,
  onScrub,
  zoomLevel = 1,
}: {
  deck: DeckState
  color: string
  position: "top" | "bottom"
  onScrub?: (e: React.MouseEvent) => void
  zoomLevel?: number
}) {
  const waveformColor = color === "emerald" ? "bg-emerald-400" : "bg-blue-400"
  const isTop = position === "top"
  const progress = deck.duration > 0 ? deck.currentTime / deck.duration : 0

  const visibleRange = 1 / zoomLevel // 1 = full view, 0.5 = half view, etc.
  const centerProgress = progress // Center the view around current playhead
  const startProgress = Math.max(0, centerProgress - visibleRange / 2)
  const endProgress = Math.min(1, centerProgress + visibleRange / 2)

  // Adjust if we hit the boundaries
  let finalStart = startProgress
  let finalEnd = endProgress
  if (endProgress >= 1) {
    finalEnd = 1
    finalStart = Math.max(0, 1 - visibleRange)
  }
  if (startProgress <= 0) {
    finalStart = 0
    finalEnd = Math.min(1, visibleRange)
  }

  const startIndex = Math.floor(finalStart * deck.waveformData.length)
  const endIndex = Math.ceil(finalEnd * deck.waveformData.length)
  const visibleWaveform = deck.waveformData.slice(startIndex, endIndex)

  // Calculate playhead position relative to visible range
  const relativeProgress = (progress - finalStart) / (finalEnd - finalStart)

  return (
    <div className={cn("absolute left-0 right-0 h-1/2 flex items-end px-4", isTop ? "top-0" : "bottom-0")}>
      <div className="w-full h-20 flex items-center gap-px relative cursor-pointer" onMouseDown={onScrub}>
        {visibleWaveform.length > 0
          ? visibleWaveform.map((height, i) => {
              return (
                <div
                  key={i}
                  className={cn("flex-1 transition-opacity", waveformColor)}
                  style={{
                    height: `${height}%`,
                    transform: isTop ? "scaleY(1)" : "scaleY(-1)",
                    opacity: 0.8,
                  }}
                />
              )
            })
          : [...Array(200)].map((_, i) => (
              <div
                key={i}
                className={cn("flex-1", waveformColor)}
                style={{
                  height: `${Math.random() * 80 + 20}%`,
                  transform: isTop ? "scaleY(1)" : "scaleY(-1)",
                  opacity: 0.3,
                }}
              />
            ))}
        {/* Playhead indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
          style={{
            left: `${relativeProgress * 100}%`,
          }}
        />
      </div>
    </div>
  )
}
