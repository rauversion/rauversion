import React, { useCallback, useEffect, useMemo, useState } from "react"
import { get } from "@rails/request.js"
import AsyncSelect from "react-select/async"

import selectTheme from "@/components/ui/selectTheme"
import { getUserDisplayName } from "@/utils/userDisplayName"

function resolveCoverUrl(coverUrl) {
  if (!coverUrl) return null
  if (typeof coverUrl === "string") return coverUrl

  return coverUrl.small || coverUrl.medium || coverUrl.large || coverUrl.cropped_image || null
}

function resolveTrackCount(playlist) {
  if (typeof playlist?.tracks_count === "number") return playlist.tracks_count
  if (Array.isArray(playlist?.tracks)) return playlist.tracks.length

  return null
}

function humanizePlaylistType(type) {
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

function buildPlaylistOption(playlist) {
  if (!playlist?.id) return null

  return {
    value: playlist.id,
    label: playlist.title || `Playlist #${playlist.id}`,
    coverUrl: resolveCoverUrl(playlist.cover_url),
    subtitle: getUserDisplayName(playlist.user) || playlist.user?.username || null,
    playlistType: playlist.playlist_type || "playlist",
    tracksCount: resolveTrackCount(playlist),
  }
}

function mergeOptions(previousOptions, nextOptions) {
  const mergedOptions = new Map()

  previousOptions.forEach((option) => {
    mergedOptions.set(`${option.value}`, option)
  })

  nextOptions.forEach((option) => {
    if (option) {
      mergedOptions.set(`${option.value}`, option)
    }
  })

  return Array.from(mergedOptions.values())
}

export default function PlaylistSelectorSingle({
  onChange,
  value = null,
  endpoint = null,
  autoFocus = false,
  placeholder = "Busca una playlist para insertar...",
}) {
  const currentUsername = document.querySelector('meta[name="current-user-id"]')?.content
  const resolvedEndpoint = useMemo(() => {
    if (endpoint) return endpoint
    if (currentUsername) return `/${currentUsername}/albums.json`

    return "/playlists.json"
  }, [currentUsername, endpoint])

  const searchParam = resolvedEndpoint.includes("/albums.json") ? "q" : "term"
  const [options, setOptions] = useState([])
  const [selectedOption, setSelectedOption] = useState(null)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  const hydrateSelectedPlaylist = useCallback(async (playlistId) => {
    if (!playlistId) {
      setSelectedOption(null)
      return
    }

    const cachedOption = options.find((option) => `${option.value}` === `${playlistId}`)
    if (cachedOption) {
      setSelectedOption(cachedOption)
      return
    }

    setIsBootstrapping(true)

    try {
      const response = await get(`/playlists/${playlistId}.json`, { responseKind: "json" })
      if (!response.ok) {
        setSelectedOption(null)
        return
      }

      const data = await response.json
      const nextOption = buildPlaylistOption(data?.playlist)

      if (nextOption) {
        setOptions((previousOptions) => mergeOptions(previousOptions, [nextOption]))
        setSelectedOption(nextOption)
      } else {
        setSelectedOption(null)
      }
    } catch (_error) {
      setSelectedOption(null)
    } finally {
      setIsBootstrapping(false)
    }
  }, [options])

  useEffect(() => {
    hydrateSelectedPlaylist(value)
  }, [hydrateSelectedPlaylist, value])

  const loadOptions = useCallback(async (inputValue) => {
    setIsLoadingOptions(true)

    try {
      const requestUrl = new URL(resolvedEndpoint, window.location.origin)

      if ((inputValue || "").trim()) {
        requestUrl.searchParams.set(searchParam, inputValue.trim())
      }

      const response = await get(`${requestUrl.pathname}${requestUrl.search}`, {
        responseKind: "json",
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json
      const nextOptions = (data?.collection || []).map(buildPlaylistOption).filter(Boolean)

      setOptions((previousOptions) => mergeOptions(previousOptions, nextOptions))

      return nextOptions
    } catch (_error) {
      return []
    } finally {
      setIsLoadingOptions(false)
    }
  }, [resolvedEndpoint, searchParam])

  const handleChange = useCallback((nextSelectedOption) => {
    setSelectedOption(nextSelectedOption || null)
    onChange(nextSelectedOption ? nextSelectedOption.value : null)
  }, [onChange])

  const customStyles = useMemo(() => ({
    control: (provided, state) => ({
      ...provided,
      minHeight: 48,
      borderRadius: 12,
      boxShadow: state.isFocused ? "0 0 0 1px rgb(16 185 129 / 0.4)" : provided.boxShadow,
      borderColor: state.isFocused ? "rgb(16 185 129 / 0.7)" : provided.borderColor,
    }),
    option: (provided, state) => ({
      ...provided,
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "10px 12px",
      backgroundColor: state.isFocused ? "rgb(15 23 42 / 0.08)" : provided.backgroundColor,
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    valueContainer: (provided) => ({
      ...provided,
      paddingTop: 6,
      paddingBottom: 6,
    }),
  }), [])

  const formatOptionLabel = useCallback((option, { context }) => {
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
              className="h-7 w-7 rounded-md object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{option.label}</div>
          </div>
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
        isMulti={false}
        isClearable
        autoFocus={autoFocus}
        cacheOptions
        defaultOptions
        theme={selectTheme}
        value={selectedOption}
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
        menuPortalTarget={document.body}
      />
    </div>
  )
}
