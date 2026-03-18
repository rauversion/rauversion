import React, { startTransition, useEffect, useState } from "react"
import { get } from "@rails/request.js"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowRight,
  CalendarDays,
  Disc3,
  Headphones,
  Heart,
  Mic2,
  Pause,
  Play,
  Radio,
  Sparkles,
} from "lucide-react"

import useAudioStore from "@/stores/audioStore"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import I18n from "stores/locales"
import { getUserDisplayName } from "@/utils/userDisplayName"

const HOME_TABS = [
  { id: "all", labelKey: "home.personalized.tabs.all", icon: Sparkles },
  { id: "music", labelKey: "home.personalized.tabs.music", icon: Disc3 },
  { id: "podcasts", labelKey: "home.personalized.tabs.podcasts", icon: Mic2 },
  { id: "events", labelKey: "home.personalized.tabs.events", icon: CalendarDays },
]

const STAT_CARDS = [
  {
    id: "recent_listens_count",
    labelKey: "home.personalized.stats.recent_listens_count",
    icon: Headphones,
    accent: "from-emerald-300/30 to-transparent",
  },
  {
    id: "liked_tracks_count",
    labelKey: "home.personalized.stats.liked_tracks_count",
    icon: Heart,
    accent: "from-rose-300/25 to-transparent",
  },
  {
    id: "followed_artists_count",
    labelKey: "home.personalized.stats.followed_artists_count",
    icon: Disc3,
    accent: "from-sky-300/25 to-transparent",
  },
  {
    id: "upcoming_events_count",
    labelKey: "home.personalized.stats.upcoming_events_count",
    icon: Radio,
    accent: "from-amber-300/25 to-transparent",
  },
]

function getGreeting() {
  const currentHour = new Date().getHours()

  if (currentHour < 12) return I18n.t("home.personalized.greetings.morning")
  if (currentHour < 19) return I18n.t("home.personalized.greetings.afternoon")
  return I18n.t("home.personalized.greetings.evening")
}

function formatCount(value) {
  const locale = I18n.locale === "es" ? "es-CL" : "en-US"
  return new Intl.NumberFormat(locale).format(value || 0)
}

function isVisibleInTab(entity, activeTab) {
  if (activeTab === "all") return true

  return Array.isArray(entity?.categories) && entity.categories.includes(activeTab)
}

function HomeLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-border bg-card/80 p-6">
        <Skeleton className="h-6 w-32 bg-muted/70" />
        <Skeleton className="mt-4 h-12 w-80 max-w-full bg-muted/70" />
        <Skeleton className="mt-3 h-5 w-[32rem] max-w-full bg-muted/70" />

        <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-[24px] bg-muted/70" />
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-28 rounded-full bg-muted/70" />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-[24px] bg-muted/70" />
        ))}
      </div>

      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-56 bg-muted/70" />
            <Skeleton className="h-5 w-24 bg-muted/70" />
          </div>

          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, cardIndex) => (
              <Skeleton
                key={cardIndex}
                className="h-[18rem] w-[12rem] shrink-0 rounded-[28px] bg-muted/70"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SectionHeader({ title, subtitle, href }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {href ? (
        <Link
          to={href}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {I18n.t("home.personalized.actions.view_all")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  )
}

function EntityArtwork({ entity, className }) {
  if (entity.image_style === "gradient" || !entity.image_url) {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-[linear-gradient(135deg,#8b5cf6_0%,#2563eb_50%,#22d3ee_100%)]",
          className
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_30%)]" />
        <div className="relative flex h-full w-full items-center justify-center">
          <Heart className="h-8 w-8 fill-current text-white" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("overflow-hidden bg-muted/20", className)}>
      <img
        src={entity.image_url}
        alt={entity.title}
        className="h-full w-full object-cover"
      />
    </div>
  )
}

function QuickAccessCard({
  entity,
  isActive,
  isPlaying,
  onOpen,
  onPlay,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(entity)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen(entity)
        }
      }}
      className={cn(
        "group relative flex min-w-0 items-center gap-3 overflow-hidden rounded-[22px] border border-border bg-card/80 p-2 text-left transition-all hover:-translate-y-0.5 hover:bg-accent/70",
        isActive && "border-emerald-400/50 bg-emerald-400/10"
      )}
    >
      <EntityArtwork entity={entity} className="h-16 w-16 shrink-0 rounded-[18px]" />

      <div className="min-w-0 flex-1">
        <div className="inline-flex rounded-full border border-border bg-background/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          {entity.badge}
        </div>
        <p className="mt-2 line-clamp-1 text-sm font-semibold text-foreground">
          {entity.title}
        </p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{entity.subtitle || entity.meta}</p>
      </div>

      {entity.playable ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={(event) => onPlay(event, entity)}
          className="h-10 w-10 shrink-0 rounded-full bg-background/85 text-foreground opacity-100 shadow-sm backdrop-blur transition-colors hover:bg-emerald-400 hover:text-black sm:opacity-0 sm:group-hover:opacity-100 dark:bg-black/35 dark:text-white"
        >
          {isActive && isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
        </Button>
      ) : null}
    </div>
  )
}

function MediaCard({
  entity,
  isActive,
  isPlaying,
  onOpen,
  onPlay,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(entity)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen(entity)
        }
      }}
      className={cn(
        "group w-[11.75rem] shrink-0 rounded-[28px] border border-border bg-card/80 p-3 text-left transition-all hover:-translate-y-1 hover:bg-accent/60 sm:w-[12.75rem]",
        isActive && "border-emerald-400/50 bg-emerald-400/10"
      )}
    >
      <div className="relative overflow-hidden rounded-[22px]">
        <EntityArtwork entity={entity} className="aspect-square rounded-[22px]" />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className="rounded-full border border-white/30 bg-white/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-800 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/35 dark:text-white/80">
            {entity.badge}
          </span>
          {entity.reason ? (
            <span className="max-w-[7rem] truncate rounded-full bg-emerald-300/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
              {entity.reason}
            </span>
          ) : null}
        </div>

        {entity.playable ? (
          <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={(event) => onPlay(event, entity)}
          className="absolute bottom-3 right-3 h-11 w-11 rounded-full bg-emerald-400 text-black opacity-100 shadow-[0_18px_40px_rgba(16,185,129,0.35)] transition-transform hover:scale-105 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
        >
            {isActive && isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </Button>
        ) : null}
      </div>

      <div className="mt-3 space-y-1">
        <p className="line-clamp-2 text-[15px] font-semibold leading-5 text-foreground">
          {entity.title}
        </p>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {entity.subtitle || entity.description || entity.meta}
        </p>
        <p className="line-clamp-1 text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
          {entity.meta}
        </p>
      </div>
    </div>
  )
}

function EventCard({ entity, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(entity)}
      className="group w-[17.5rem] shrink-0 overflow-hidden rounded-[30px] border border-border bg-card/80 text-left transition-all hover:-translate-y-1 hover:bg-accent/50 sm:w-[19rem]"
    >
      <div className="relative">
        <EntityArtwork entity={entity} className="aspect-[4/3] w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="absolute left-4 top-4 inline-flex rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/80 backdrop-blur">
          {entity.badge}
        </div>

        <div className="absolute inset-x-4 bottom-4">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">{entity.reason}</p>
          <h3 className="mt-2 line-clamp-2 text-2xl font-semibold leading-tight text-white">
            {entity.title}
          </h3>
        </div>
      </div>

      <div className="space-y-2 p-4">
        <p className="text-sm text-foreground">{entity.subtitle}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
          <span>{entity.meta}</span>
          {entity.secondary_meta ? <span>{entity.secondary_meta}</span> : null}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{entity.description}</p>
      </div>
    </button>
  )
}

function ArticleCard({ entity, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(entity)}
      className="group w-[18.5rem] shrink-0 overflow-hidden rounded-[30px] border border-border bg-card/85 text-left transition-all hover:-translate-y-1 hover:bg-accent/50 sm:w-[20rem]"
    >
      <div className="relative">
        <EntityArtwork entity={entity} className="aspect-[16/9] w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full border border-white/20 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-900 shadow-sm dark:border-white/10 dark:bg-black/35 dark:text-white/80">
            {entity.badge}
          </span>
          {entity.secondary_meta ? (
            <span className="rounded-full border border-white/20 bg-emerald-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-950 shadow-sm">
              {entity.secondary_meta}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
            {entity.meta}
          </p>
          <h3 className="line-clamp-2 text-xl font-semibold leading-tight text-foreground">
            {entity.title}
          </h3>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {entity.description}
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-border/70 pt-3">
          {entity.author_avatar_url ? (
            <img
              src={entity.author_avatar_url}
              alt={entity.subtitle}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-muted/70" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{entity.subtitle}</p>
            {entity.secondary_meta ? (
              <p className="truncate text-xs text-muted-foreground">{entity.secondary_meta}</p>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  )
}

export default function PersonalizedHome({ currentUser }) {
  const navigate = useNavigate()
  const { currentTrackId, isPlaying, play, pause } = useAudioStore()
  const [activeTab, setActiveTab] = useState("all")
  const [data, setData] = useState({ stats: {}, quick_access: [], sections: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    const loadHome = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await get("/home/personalized.json", { responseKind: "json" })

        if (!response.ok) {
          throw new Error(I18n.t("home.personalized.state.load_error_message"))
        }

        const nextData = await response.json

        if (!cancelled) {
          setData(nextData)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || I18n.t("home.personalized.state.load_error_message"))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadHome()

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const handleTabChange = (nextTab) => {
    startTransition(() => {
      setActiveTab(nextTab)
    })
  }

  const handleOpen = (entity) => {
    if (!entity?.href) return

    navigate(entity.href)
  }

  const handlePlay = (event, entity) => {
    event.stopPropagation()

    if (!entity?.playable || !entity.primary_track_id) return

    const nextQueue = Array.isArray(entity.track_ids)
      ? entity.track_ids.map((trackId) => `${trackId}`)
      : []

    if (nextQueue.length > 0) {
      useAudioStore.setState({ playlist: nextQueue })
    }

    const isPrimaryTrackActive = `${currentTrackId}` === `${entity.primary_track_id}`

    if (isPrimaryTrackActive && isPlaying) {
      pause()
      return
    }

    play(`${entity.primary_track_id}`)
  }

  const visibleQuickAccess = data.quick_access.filter((entity) =>
    isVisibleInTab(entity, activeTab)
  )

  const visibleSections = data.sections.filter((section) => (
    activeTab === "all" ||
    section.category === "all" ||
    section.category === activeTab
  ))

  if (loading) {
    return <HomeLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-[32px] border border-rose-300/20 bg-card p-8 text-foreground">
        <p className="text-xs uppercase tracking-[0.28em] text-rose-500/80 dark:text-rose-300/80">
          {I18n.t("home.personalized.state.label")}
        </p>
        <h1 className="mt-4 text-3xl font-semibold">
          {I18n.t("home.personalized.state.load_error_title")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{error}</p>
        <Button
          type="button"
          onClick={() => setReloadToken((currentValue) => currentValue + 1)}
          className="mt-6 rounded-full"
        >
          {I18n.t("home.personalized.actions.retry")}
        </Button>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-border bg-background text-foreground shadow-[0_28px_80px_rgba(15,23,42,0.12)] dark:shadow-[0_36px_120px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_22%),radial-gradient(circle_at_top_right,rgba(251,146,60,0.12),transparent_24%),linear-gradient(180deg,rgba(236,253,245,0.92),rgba(255,255,255,0)_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_22%),radial-gradient(circle_at_top_right,rgba(251,146,60,0.16),transparent_24%),linear-gradient(180deg,rgba(11,94,88,0.42),rgba(5,8,22,0)_28%)]" />

      <div className="relative space-y-8 p-4 sm:p-6 xl:p-8">
        <header className="relative overflow-hidden rounded-[32px] border border-border bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(236,254,255,0.96)_52%,rgba(255,241,242,0.92))] p-6 sm:p-8 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(10,87,84,0.92),rgba(9,17,32,0.96)_52%,rgba(63,18,34,0.86))]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.75),transparent_26%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_26%)]" />

          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-950/10 bg-background/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-foreground/75 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/20 dark:text-white/75">
                <span>{I18n.t("home.personalized.header.badge")}</span>
                <span className="h-1 w-1 rounded-full bg-emerald-300" />
                <span>{I18n.t("home.personalized.header.activity_badge")}</span>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <img
                  src={currentUser?.avatar_url?.medium}
                  alt={getUserDisplayName(currentUser)}
                  className="h-14 w-14 rounded-2xl border border-background/70 object-cover shadow-lg shadow-black/10 dark:border-white/10 dark:shadow-black/30"
                />

                <div className="min-w-0">
                  <p className="text-sm uppercase tracking-[0.22em] text-foreground/58 dark:text-white/58">{getGreeting()}</p>
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl xl:text-5xl dark:text-white">
                    {getUserDisplayName(currentUser)}
                  </h1>
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/74 dark:text-white/74">
                {I18n.t("home.personalized.header.description")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {STAT_CARDS.map((card) => {
                const Icon = card.icon

                return (
                  <div
                    key={card.id}
                    className="relative overflow-hidden rounded-[24px] border border-foreground/8 bg-background/70 px-4 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/20"
                  >
                    <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", card.accent)} />
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.2em] text-foreground/52 dark:text-white/52">
                          {I18n.t(card.labelKey)}
                        </p>
                        <Icon className="h-4 w-4 text-foreground/65 dark:text-white/65" />
                      </div>
                      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground dark:text-white">
                        {formatCount(data.stats?.[card.id])}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {HOME_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.id === activeTab

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-emerald-300/50 bg-emerald-300 text-black"
                    : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{I18n.t(tab.labelKey)}</span>
              </button>
            )
          })}
        </div>

        {visibleQuickAccess.length > 0 ? (
          <section className="space-y-4">
            <SectionHeader
              title={I18n.t("home.personalized.quick_access.title")}
              subtitle={I18n.t("home.personalized.quick_access.subtitle")}
            />

            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {visibleQuickAccess.map((entity) => {
                const isActive = `${currentTrackId}` === `${entity.primary_track_id}`

                return (
                  <QuickAccessCard
                    key={entity.id}
                    entity={entity}
                    isActive={isActive}
                    isPlaying={isPlaying}
                    onOpen={handleOpen}
                    onPlay={handlePlay}
                  />
                )
              })}
            </div>
          </section>
        ) : null}

        <div className="space-y-10 pb-2">
          {visibleSections.map((section) => (
            <section key={section.id} className="space-y-4">
              <SectionHeader
                title={section.title}
                subtitle={section.subtitle}
                href={section.href}
              />

              <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 pb-2">
                <div className="flex gap-4">
                  {section.items.map((entity) => {
                    if (section.layout === "article") {
                      return (
                        <ArticleCard
                          key={entity.id}
                          entity={entity}
                          onOpen={handleOpen}
                        />
                      )
                    }

                    if (section.layout === "event") {
                      return (
                        <EventCard
                          key={entity.id}
                          entity={entity}
                          onOpen={handleOpen}
                        />
                      )
                    }

                    const isActive = `${currentTrackId}` === `${entity.primary_track_id}`

                    return (
                      <MediaCard
                        key={entity.id}
                        entity={entity}
                        isActive={isActive}
                        isPlaying={isPlaying}
                        onOpen={handleOpen}
                        onPlay={handlePlay}
                      />
                    )
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
