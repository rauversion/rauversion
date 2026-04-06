"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import AsyncSelect from "react-select/async"
import { get } from "@rails/request.js"

import selectTheme from "@/components/ui/selectTheme"
import { getUserDisplayName } from "@/utils/userDisplayName"
import { resolvePlaylistCoverUrl } from "@/lib/playlist-theme"

interface PlaylistUser {
  username?: string
  display_name?: string
  full_name?: string
  first_name?: string
  last_name?: string
  name?: string
}

interface PlaylistRecord {
  id?: number | string
  title?: string
  cover_url?: string | { small?: string; medium?: string; large?: string; cropped_image?: string }
  tracks_count?: number
  tracks?: unknown[]
  playlist_type?: string
  user?: PlaylistUser
}

interface PlaylistOption {
  value: string
  label: string
  coverUrl: string | null
  subtitle: string | null
  playlistType: string
  tracksCount: number | null
}

interface PlaylistSelectorMultiProps {
  onChange: (value: string[]) => void
  value?: Array<string | number> | null
  endpoint?: string | null
  autoFocus?: boolean
  placeholder?: string
}

function resolveTrackCount(playlist?: PlaylistRecord | null) {
  if (typeof playlist?.tracks_count === "number") return playlist.tracks_count
  if (Array.isArray(playlist?.tracks)) return playlist.tracks.length

  return null
}

function humanizePlaylistType(type?: string) {
  switch (type) {
    case "album":
      return "Album"
    case "ep":
      return "EP"
    case "single":
      return "Single"
    case "compilation":
      return "Compilation"
    default:
      return "Playlist"
  }
}

function buildPlaylistOption(playlist?: PlaylistRecord | null): PlaylistOption | null {
  if (!playlist?.id) return null

  return {
    value: String(playlist.id),
    label: playlist.title || `Playlist #${playlist.id}`,
    coverUrl: resolvePlaylistCoverUrl(playlist.cover_url),
    subtitle: getUserDisplayName(playlist.user) || playlist.user?.username || null,
    playlistType: playlist.playlist_type || "playlist",
    tracksCount: resolveTrackCount(playlist),
  }
}

function mergeOptions(previousOptions: PlaylistOption[], nextOptions: PlaylistOption[]) {
  const mergedOptions = new Map<string, PlaylistOption>()

  previousOptions.forEach((option) => {
    mergedOptions.set(option.value, option)
  })

  nextOptions.forEach((option) => {
    mergedOptions.set(option.value, option)
  })

  return Array.from(mergedOptions.values())
}

function normalizeValues(value?: Array<string | number> | null) {
  if (!Array.isArray(value)) return []

  return value.map((item) => String(item)).filter(Boolean)
}

export default function PlaylistSelectorMulti({
  onChange,
  value = [],
  endpoint = null,
  autoFocus = false,
  placeholder = "Busca playlists para insertar...",
}: PlaylistSelectorMultiProps) {
  const currentUsername =
    typeof document === "undefined"
      ? null
      : document.querySelector('meta[name="current-user-id"]')?.getAttribute("content")

  const resolvedEndpoint = useMemo(() => {
    if (endpoint) return endpoint
    if (currentUsername) return `/${currentUsername}/albums.json`

    return "/playlists/albums.json"
  }, [currentUsername, endpoint])

  const [options, setOptions] = useState<PlaylistOption[]>([])
  const [selectedOptions, setSelectedOptions] = useState<PlaylistOption[]>([])
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  const hydrateSelectedPlaylists = useCallback(
    async (playlistIds: string[]) => {
      if (playlistIds.length === 0) {
        setSelectedOptions([])
        return
      }

      const cachedOptionsById = new Map(options.map((option) => [option.value, option]))
      const cachedSelection = playlistIds
        .map((playlistId) => cachedOptionsById.get(playlistId))
        .filter(Boolean) as PlaylistOption[]

      if (cachedSelection.length === playlistIds.length) {
        setSelectedOptions(cachedSelection)
        return
      }

      setIsBootstrapping(true)

      try {
        const requestUrl = new URL("/playlists/albums.json", window.location.origin)
        requestUrl.searchParams.set("ids", playlistIds.join(","))

        const response = await get(`${requestUrl.pathname}${requestUrl.search}`, {
          responseKind: "json",
        })

        if (!response.ok) {
          setSelectedOptions(cachedSelection)
          return
        }

        const data = await response.json
        const fetchedOptions = (data?.collection || []).map(buildPlaylistOption).filter(Boolean) as PlaylistOption[]
        const mergedOptions = mergeOptions(options, fetchedOptions)
        const mergedById = new Map(mergedOptions.map((option) => [option.value, option]))
        const nextSelectedOptions = playlistIds
          .map((playlistId) => mergedById.get(playlistId))
          .filter(Boolean) as PlaylistOption[]

        setOptions(mergedOptions)
        setSelectedOptions(nextSelectedOptions)
      } catch (_error) {
        setSelectedOptions(cachedSelection)
      } finally {
        setIsBootstrapping(false)
      }
    },
    [options]
  )

  useEffect(() => {
    hydrateSelectedPlaylists(normalizeValues(value))
  }, [hydrateSelectedPlaylists, value])

  const loadOptions = useCallback(
    async (inputValue: string) => {
      if (!resolvedEndpoint) return []

      setIsLoadingOptions(true)

      try {
        const requestUrl = new URL(resolvedEndpoint, window.location.origin)
        const query = inputValue.trim()

        if (query) {
          requestUrl.searchParams.set("q", query)
        }

        const response = await get(`${requestUrl.pathname}${requestUrl.search}`, {
          responseKind: "json",
        })

        if (!response.ok) {
          return []
        }

        const data = await response.json
        const nextOptions = (data?.collection || []).map(buildPlaylistOption).filter(Boolean) as PlaylistOption[]

        setOptions((previousOptions) => mergeOptions(previousOptions, nextOptions))

        return nextOptions
      } catch (_error) {
        return []
      } finally {
        setIsLoadingOptions(false)
      }
    },
    [resolvedEndpoint]
  )

  const handleChange = useCallback(
    (nextSelectedOptions: readonly PlaylistOption[] | null) => {
      const normalizedOptions = nextSelectedOptions ? Array.from(nextSelectedOptions) : []

      setSelectedOptions(normalizedOptions)
      onChange(normalizedOptions.map((option) => option.value))
    },
    [onChange]
  )

  const customStyles = useMemo(
    () => ({
      control: (provided: Record<string, unknown>, state: { isFocused: boolean }) => ({
        ...provided,
        minHeight: 48,
        borderRadius: 12,
        boxShadow: state.isFocused ? "0 0 0 1px rgb(16 185 129 / 0.4)" : provided.boxShadow,
        borderColor: state.isFocused ? "rgb(16 185 129 / 0.7)" : provided.borderColor,
      }),
      option: (provided: Record<string, unknown>, state: { isFocused: boolean }) => ({
        ...provided,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        backgroundColor: state.isFocused ? "rgb(15 23 42 / 0.08)" : provided.backgroundColor,
      }),
      multiValue: (provided: Record<string, unknown>) => ({
        ...provided,
        borderRadius: 10,
        backgroundColor: "rgb(15 23 42 / 0.06)",
      }),
      menuPortal: (provided: Record<string, unknown>) => ({
        ...provided,
        zIndex: 9999,
      }),
      valueContainer: (provided: Record<string, unknown>) => ({
        ...provided,
        paddingTop: 6,
        paddingBottom: 6,
      }),
    }),
    []
  )

  const formatOptionLabel = useCallback((option: PlaylistOption, { context }: { context: "menu" | "value" }) => {
    const meta = [
      humanizePlaylistType(option.playlistType),
      option.subtitle,
      option.tracksCount !== null ? `${option.tracksCount} tracks` : null,
    ].filter(Boolean).join(" · ")

    if (context === "value") {
      return (
        <div className="flex items-center gap-2">
          {option.coverUrl ? (
            <img
              src={option.coverUrl}
              alt={option.label}
              className="h-6 w-6 rounded-md object-cover"
            />
          ) : null}
          <span className="max-w-[10rem] truncate text-sm font-medium">{option.label}</span>
        </div>
      )
    }

    return (
      <div className="flex w-full items-center gap-3">
        {option.coverUrl ? (
          <img
            src={option.coverUrl}
            alt={option.label}
            className="h-10 w-10 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
            {humanizePlaylistType(option.playlistType).slice(0, 1)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{option.label}</div>
          {meta ? (
            <div className="truncate text-xs text-muted-foreground">{meta}</div>
          ) : null}
        </div>
      </div>
    )
  }, [])

  return (
    <div className="w-full">
      <AsyncSelect
        isMulti
        autoFocus={autoFocus}
        cacheOptions
        defaultOptions
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        theme={selectTheme}
        value={selectedOptions}
        onChange={handleChange}
        loadOptions={loadOptions}
        isLoading={isBootstrapping || isLoadingOptions}
        styles={customStyles}
        formatOptionLabel={formatOptionLabel}
        placeholder={placeholder}
        noOptionsMessage={({ inputValue }) => (
          inputValue ? "No encontramos playlists con ese nombre" : "No hay playlists disponibles"
        )}
        loadingMessage={() => "Cargando playlists..."}
        className="w-full"
        classNamePrefix="playlist-selector"
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      />
    </div>
  )
}
