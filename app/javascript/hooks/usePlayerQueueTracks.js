import { useEffect, useMemo, useState } from "react"
import { get } from "@rails/request.js"

import useAudioStore from "@/stores/audioStore"

export default function usePlayerQueueTracks() {
  const playlist = useAudioStore((state) => state.playlist)
  const currentTrackId = useAudioStore((state) => state.currentTrackId)
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const playlistKey = Array.isArray(playlist) ? playlist.join(",") : ""

  useEffect(() => {
    if (!playlist?.length) {
      setTracks([])
      setLoading(false)
      return undefined
    }

    let cancelled = false

    const loadTracks = async () => {
      setTracks([])
      setLoading(true)

      try {
        const queryParams = new URLSearchParams()
        playlist.forEach((id) => queryParams.append("ids[]", `${id}`))

        const response = await get(`/player/tracklist.json?${queryParams.toString()}`, {
          responseKind: "json",
        })

        if (!response.ok) {
          throw new Error("Unable to load queue")
        }

        const data = await response.json
        if (!cancelled) {
          setTracks(Array.isArray(data?.tracks) ? data.tracks : [])
        }
      } catch (error) {
        if (!cancelled) {
          setTracks([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadTracks()

    return () => {
      cancelled = true
    }
  }, [playlistKey])

  const currentIndex = useMemo(() => (
    tracks.findIndex((track) => `${track.id}` === `${currentTrackId}`)
  ), [currentTrackId, tracks])

  const nextTrack = useMemo(() => {
    if (currentIndex < 0 || currentIndex >= tracks.length - 1) return null

    return tracks[currentIndex + 1]
  }, [currentIndex, tracks])

  return {
    tracks,
    loading,
    currentIndex,
    nextTrack,
  }
}
