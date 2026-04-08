"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import AsyncSelect from "react-select/async"
import { get } from "@rails/request.js"

import selectTheme from "@/components/ui/selectTheme"

interface EventImageUrls {
  small?: string
  medium?: string
  large?: string
}

interface EventRecord {
  id?: number | string
  slug?: string
  title?: string
  state?: string
  venue?: string
  location?: string
  event_start?: string
  cover_url?: EventImageUrls
}

interface EventOption {
  value: string
  label: string
  coverUrl: string | null
  subtitle: string | null
  state: string | null
}

interface EventSelectorSingleProps {
  onChange: (value: string | null) => void
  value?: string | null
  endpoint?: string | null
  autoFocus?: boolean
  placeholder?: string
}

function resolveCoverUrl(coverUrl?: EventImageUrls | null) {
  if (!coverUrl) return null

  return coverUrl.small || coverUrl.medium || coverUrl.large || null
}

function normalizeEventIdentifier(value?: string | null) {
  const trimmedValue = value?.trim()
  if (!trimmedValue) return null

  const cleanValue = trimmedValue.split("?")[0].replace(/\/+$/, "")
  const eventIndex = cleanValue.lastIndexOf("/events/")

  if (eventIndex >= 0) {
    const segments = cleanValue.slice(eventIndex).split("/").filter(Boolean)
    return segments[1] || null
  }

  const segments = cleanValue.split("/").filter(Boolean)
  return segments[segments.length - 1] || null
}

function formatEventDate(value?: string) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
  }).format(date)
}

function buildEventOption(event?: EventRecord | null): EventOption | null {
  const identifier = event?.slug || event?.id
  if (!identifier) return null

  const meta = [
    formatEventDate(event?.event_start),
    [event?.venue, event?.location].filter(Boolean).join(" · "),
  ].filter(Boolean).join(" · ")

  return {
    value: String(identifier),
    label: event?.title || `Evento #${identifier}`,
    coverUrl: resolveCoverUrl(event?.cover_url),
    subtitle: meta || null,
    state: event?.state || null,
  }
}

function mergeOptions(previousOptions: EventOption[], nextOptions: EventOption[]) {
  const mergedOptions = new Map<string, EventOption>()

  previousOptions.forEach((option) => {
    mergedOptions.set(option.value, option)
  })

  nextOptions.forEach((option) => {
    mergedOptions.set(option.value, option)
  })

  return Array.from(mergedOptions.values())
}

export default function EventSelectorSingle({
  onChange,
  value = null,
  endpoint = null,
  autoFocus = false,
  placeholder = "Busca un evento de tu cuenta...",
}: EventSelectorSingleProps) {
  const resolvedEndpoint = useMemo(() => {
    if (endpoint) return endpoint

    return "/events/mine.json?tab=owned&per=50"
  }, [endpoint])

  const [options, setOptions] = useState<EventOption[]>([])
  const [selectedOption, setSelectedOption] = useState<EventOption | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  const hydrateSelectedEvent = useCallback(
    async (eventIdentifier: string | null) => {
      if (!eventIdentifier) {
        setSelectedOption(null)
        return
      }

      const cachedOption = options.find((option) => option.value === eventIdentifier)
      if (cachedOption) {
        setSelectedOption(cachedOption)
        return
      }

      setIsBootstrapping(true)

      try {
        const response = await get(`/events/${encodeURIComponent(eventIdentifier)}/edit.json`, {
          responseKind: "json",
        })

        if (!response.ok) {
          setSelectedOption(null)
          return
        }

        const data = await response.json
        const nextOption = buildEventOption(data)

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
    },
    [options]
  )

  useEffect(() => {
    hydrateSelectedEvent(normalizeEventIdentifier(value))
  }, [hydrateSelectedEvent, value])

  const loadOptions = useCallback(
    async (inputValue: string) => {
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
        const nextOptions = (data?.collection || []).map(buildEventOption).filter(Boolean) as EventOption[]

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
    (nextSelectedOption: EventOption | null) => {
      setSelectedOption(nextSelectedOption)
      onChange(nextSelectedOption ? nextSelectedOption.value : null)
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

  const formatOptionLabel = useCallback((option: EventOption, { context }: { context: string }) => {
    if (context === "value") {
      return (
        <div className="flex min-w-0 items-center gap-2">
          {option.coverUrl ? (
            <img src={option.coverUrl} alt={option.label} className="h-7 w-7 rounded-md object-cover" />
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
          <img src={option.coverUrl} alt={option.label} className="h-12 w-12 rounded-lg object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
            EV
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{option.label}</div>
          {option.subtitle ? (
            <div className="truncate text-xs text-muted-foreground">{option.subtitle}</div>
          ) : null}
        </div>
        {option.state ? (
          <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {option.state}
          </span>
        ) : null}
      </div>
    )
  }, [])

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions
      isClearable
      value={selectedOption}
      loadOptions={loadOptions}
      onChange={(nextSelectedOption) => handleChange(nextSelectedOption as EventOption | null)}
      placeholder={placeholder}
      noOptionsMessage={() => "No se encontraron eventos"}
      loadingMessage={() => "Buscando eventos..."}
      isLoading={isLoadingOptions || isBootstrapping}
      styles={customStyles}
      theme={selectTheme}
      menuPortalTarget={typeof document === "undefined" ? undefined : document.body}
      autoFocus={autoFocus}
      formatOptionLabel={formatOptionLabel}
    />
  )
}
