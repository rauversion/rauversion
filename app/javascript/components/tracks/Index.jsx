import React, { startTransition, useEffect, useRef, useState } from "react";
import { get } from "@rails/request.js";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Disc3,
  Mic2,
  Pause,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
  Waves,
} from "lucide-react";
import FeaturedArtists from "../home/FeaturedArtists";
import LabelCard from "../labels/LabelCard";
import CuratedPlaylists from "../home/CuratedPlaylists";
import { truncate } from "../../utils/text";
import { Skeleton } from "../ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import I18n from "@/stores/locales";
import useAudioStore from "@/stores/audioStore";

const EMPTY_FACETS = {
  genres: [],
  moods: [],
  subgenres: [],
  languages: [],
  tags: [],
  tempo_bands: [],
  stats: {},
};

const EMPTY_SECTIONS = {
  genres: { title: "", items: [] },
  moods: { title: "", items: [] },
};

function t(key, options = {}) {
  return I18n.t(`tracks.discovery.${key}`, options);
}

const SORT_OPTIONS = [
  { value: "featured", labelKey: "sort_options.featured" },
  { value: "latest", labelKey: "sort_options.latest" },
  { value: "random", labelKey: "sort_options.random" },
  { value: "most_confident", labelKey: "sort_options.most_confident" },
  { value: "bpm_low", labelKey: "sort_options.bpm_low" },
  { value: "bpm_high", labelKey: "sort_options.bpm_high" },
];

const RANDOM_SORT = "random";

function buildRandomSeed() {
  return Math.random().toString(36).slice(2, 10);
}

const VOCAL_MODES = [
  { value: "", labelKey: "vocal_modes.all" },
  { value: "instrumental", labelKey: "vocal_modes.instrumental" },
  { value: "vocal", labelKey: "vocal_modes.vocal" },
];

const ACTIVE_FILTER_LABEL_KEYS = {
  genre: "filters.genre",
  mood: "filters.mood",
  subgenre: "filters.subgenre",
  tag: "filters.tag",
  language: "filters.language",
  vocal_mode: "filters.vocal_mode",
  tempo_band: "filters.tempo",
  q: "filters.search",
  min_bpm: "filters.min_bpm",
  max_bpm: "filters.max_bpm",
};

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 md:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-[320px] rounded-[32px] bg-muted/40" />
          <Skeleton className="h-[320px] rounded-[32px] bg-muted/40" />
        </div>
        <Skeleton className="mt-8 h-[220px] rounded-[32px] bg-muted/40" />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="h-[320px] rounded-[28px] bg-muted/40" />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterPill({ active, children, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all",
        active
          ? "border-[#f5c451] bg-[#f5c451] text-black"
          : "border-border bg-card text-foreground hover:border-foreground/20 hover:bg-muted/60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/25 dark:hover:bg-white/10"
      )}
    >
      <span>{children}</span>
      {count ? (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px]",
            active ? "bg-black/10 text-black/80" : "bg-muted text-muted-foreground dark:bg-white/10 dark:text-white/70"
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-[28px] border border-border bg-card/90 p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.28em] text-muted-foreground dark:text-white/45">{label}</span>
        <Icon className="h-4 w-4 text-[#f5c451]" />
      </div>
      <div className="text-3xl font-black tracking-tight text-foreground dark:text-white">{value}</div>
      <p className="mt-2 text-sm text-muted-foreground dark:text-white/55">{hint}</p>
    </div>
  );
}

function ActiveFilterBadge({ label, value, onClear }) {
  return (
    <button
      onClick={onClear}
      className="inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#f5c451]/12 px-3 py-1.5 text-sm text-[#9a6a00] dark:text-[#f8d67c]"
    >
      <span className="text-muted-foreground dark:text-white/60">{label}</span>
      <span>{value}</span>
    </button>
  );
}

function activeFilterLabel(key) {
  const translationKey = ACTIVE_FILTER_LABEL_KEYS[key];
  return translationKey ? t(translationKey) : key.replaceAll("_", " ");
}

function activeFilterValue(key, value, facets) {
  if (key === "vocal_mode") {
    const option = VOCAL_MODES.find((item) => item.value === value);
    return option ? t(option.labelKey) : value;
  }

  if (key === "tempo_band") {
    return facets.tempo_bands.find((band) => band.key === value)?.label || value;
  }

  return value;
}

function buildTrackSummary(track) {
  if (track.description) return truncate(track.description, 108);

  const parts = [];
  const mood = track.mood?.[0];
  const subgenre = track.subgenres?.[0];

  if (track.genre) {
    parts.push(track.genre);
  }

  if (subgenre && subgenre !== track.genre) {
    parts.push(subgenre);
  }

  if (mood) {
    parts.push(mood.toLowerCase());
  }

  if (track.bpm) {
    parts.push(`${track.bpm} BPM`);
  }

  if (parts.length > 0) {
    return truncate(parts.join(" • "), 108);
  }

  return t("summary.fallback");
}

function DiscoveryTrackCard({ track, onBeforePlay = null }) {
  const { play, pause, currentTrackId, isPlaying } = useAudioStore();
  const mood = track.mood?.[0];
  const subgenres = Array.isArray(track.subgenres) ? track.subgenres.slice(0, 2) : [];
  const isCurrentTrack = `${currentTrackId}` === `${track.id}`;
  const shouldShowPause = isCurrentTrack && isPlaying;

  const handlePlay = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (shouldShowPause) {
      pause();
    } else {
      if (typeof onBeforePlay === "function") {
        onBeforePlay();
      }
      play(track.id);
    }
  };

  return (
    <article className="group min-w-[240px] flex-1 overflow-hidden rounded-[28px] border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 dark:border-white/10 dark:bg-[#0b0b0d] dark:hover:border-white/20">
      <Link to={`/tracks/${track.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={track.cover_url.cropped_image}
            alt={track.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {track.genre ? <Badge className="bg-white text-black hover:bg-white">{track.genre}</Badge> : null}
            {track.bpm ? (
              <Badge variant="outline" className="border-white/20 bg-black/40 text-white">
                {track.bpm} BPM
              </Badge>
            ) : null}
          </div>
          <div className="absolute right-4 top-4 z-10">
            <button
              onClick={handlePlay}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/88 text-slate-900 backdrop-blur transition-all hover:scale-105 hover:border-white/70 hover:bg-white dark:border-white/15 dark:bg-black/55 dark:text-white dark:hover:border-white/30 dark:hover:bg-black/75"
              aria-label={shouldShowPause ? t("player.pause_track", { title: track.title }) : t("player.play_track", { title: track.title })}
            >
              {shouldShowPause ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="text-xl font-black tracking-tight text-white">{track.title}</h3>
            <p className="mt-1 text-sm font-mono text-white/65">@{track.user.username}</p>
          </div>
        </div>
      </Link>

      <Link to={`/tracks/${track.slug}`} className="block">
        <div className="space-y-3 p-4">
          <p className="line-clamp-2 text-sm text-muted-foreground dark:text-white/65">
            {buildTrackSummary(track)}
          </p>

          <div className="flex flex-wrap gap-2">
            {mood ? (
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-[#16181f] dark:text-[#c7d2fe]">
                {mood}
              </span>
            ) : null}
            {subgenres.map((item) => (
              <span
                key={`${track.id}-${item}`}
                className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-white/5 dark:text-white/70"
              >
                {item}
              </span>
            ))}
            {track.language ? (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-white/5 dark:text-white/70">
                {track.language}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

function DiscoveryShelf({ section, filterKey, activeValue, onSelect, onPrepareQueue }) {
  if (!section?.items?.length) return null;

  return (
    <section className="space-y-8 rounded-[32px] border border-border bg-card/90 p-6 md:p-8 dark:border-white/10 dark:bg-[#09090b]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#f5c451]">{t("shelf.eyebrow")}</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground dark:text-white">{section.title}</h2>
        </div>
        <p className="max-w-xl text-sm text-muted-foreground dark:text-white/55">
          {t("shelf.description")}
        </p>
      </div>

      <div className="space-y-8">
        {section.items.map((item) => {
          const queueTrackIds = item.tracks.map((track) => track.id);

          return (
            <div key={`${filterKey}-${item.value}`} className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground dark:text-white">{item.value}</h3>
                  <p className="text-sm text-muted-foreground dark:text-white/50">{t("shelf.item_count", { count: item.count })}</p>
                </div>
                <Button
                  variant={activeValue === item.value ? "default" : "outline"}
                  className={cn(
                    "w-fit rounded-full",
                    activeValue === item.value
                      ? "bg-[#f5c451] text-black hover:bg-[#f5c451]/90"
                      : "border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground dark:border-white/15 dark:text-white dark:hover:bg-white dark:hover:text-black"
                  )}
                  onClick={() => onSelect(filterKey, item.value)}
                >
                  {activeValue === item.value ? t("shelf.selected") : t("shelf.explore", { value: item.value })}
                </Button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2">
                {item.tracks.map((track) => (
                  <DiscoveryTrackCard
                    key={`${filterKey}-${item.value}-${track.id}`}
                    track={track}
                    onBeforePlay={() => onPrepareQueue?.(queueTrackIds)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function TracksIndex() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [highlightedPlaylist, setHighlightedPlaylist] = useState(null);
  const [artists, setArtists] = useState([]);
  const [featuredAlbums, setFeaturedAlbums] = useState([]);
  const [curatedPlaylists, setCuratedPlaylists] = useState([]);
  const [labels, setLabels] = useState([]);
  const [facets, setFacets] = useState(EMPTY_FACETS);
  const [discoverySections, setDiscoverySections] = useState(EMPTY_SECTIONS);
  const [activeFilters, setActiveFilters] = useState({});
  const [meta, setMeta] = useState({ total_count: 0, current_page: 1, total_pages: 1 });
  const [draftQuery, setDraftQuery] = useState(searchParams.get("q") || "");
  const queueContextRef = useRef(null);
  const setPlaylist = useAudioStore((state) => state.setPlaylist);
  const currentTrackId = useAudioStore((state) => state.currentTrackId);

  const requestKey = searchParams.toString();
  const currentPage = Number(searchParams.get("page") || 1);
  const resultQueueTrackIds = tracks.map((track) => track.id);
  const hasActiveFilters = Object.entries(activeFilters || {}).some(
    ([key, value]) => key !== "sort" && value !== null && value !== undefined && value !== ""
  );

  useEffect(() => {
    setDraftQuery(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    if (queueContextRef.current !== "results") return;
    if (!currentTrackId || resultQueueTrackIds.length === 0) return;
    if (!resultQueueTrackIds.some((trackId) => `${trackId}` === `${currentTrackId}`)) return;

    setPlaylist(resultQueueTrackIds);
  }, [currentTrackId, resultQueueTrackIds, setPlaylist]);

  useEffect(() => {
    let cancelled = false;
    const page = Number(searchParams.get("page") || 1);

    if (page > 1) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const fetchTracks = async () => {
      try {
        const query = searchParams.toString();
        const url = query ? `/tracks.json?${query}` : "/tracks.json";
        const response = await get(url);

        if (!response.ok || cancelled) return;

        const data = await response.json;

        if (cancelled) return;

        setTracks((previousTracks) => (page > 1 ? [...previousTracks, ...data.tracks] : data.tracks));
        setHighlightedPlaylist(data.highlighted_playlist || null);
        setArtists(data.artists || []);
        setFeaturedAlbums(data.featured_albums || []);
        setCuratedPlaylists(data.curated_playlists || []);
        setLabels(data.labels || []);
        setFacets(data.facets || EMPTY_FACETS);
        setDiscoverySections(data.discovery_sections || EMPTY_SECTIONS);
        setActiveFilters(data.active_filters || {});
        setMeta(data.meta || { total_count: 0, current_page: 1, total_pages: 1 });
      } catch (error) {
        console.error("Error loading tracks discovery:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    fetchTracks();

    return () => {
      cancelled = true;
    };
  }, [requestKey, searchParams]);

  const updateSearchParams = (updater) => {
    const next = new URLSearchParams(searchParams);
    updater(next);
    next.delete("page");

    startTransition(() => {
      setSearchParams(next);
    });
  };

  const setFilter = (key, value) => {
    updateSearchParams((next) => {
      if (value === null || value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
  };

  const setSort = (value) => {
    updateSearchParams((next) => {
      if (value === null || value === undefined || value === "") {
        next.delete("sort");
      } else {
        next.set("sort", value);
      }

      if (value === RANDOM_SORT) {
        next.set("seed", buildRandomSeed());
      } else {
        next.delete("seed");
      }
    });
  };

  const toggleFilter = (key, value) => {
    const currentValue = searchParams.get(key) || "";
    setFilter(key, currentValue === value ? "" : value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setFilter("q", draftQuery.trim());
  };

  const clearFilters = () => {
    startTransition(() => {
      setSearchParams(new URLSearchParams());
    });
  };

  const loadMore = () => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(currentPage + 1));

    startTransition(() => {
      setSearchParams(next);
    });
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border dark:border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,196,81,0.16),_transparent_35%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.10),_transparent_28%),linear-gradient(180deg,_rgba(15,23,42,0.04),_transparent_70%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,196,81,0.20),_transparent_35%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.18),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.04),_transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-8 md:py-20">
          <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] border border-border bg-background/80 p-6 backdrop-blur md:p-8 dark:border-white/10 dark:bg-black/30"
            >
              <Badge className="border-none bg-[#f5c451] px-3 py-1 text-black hover:bg-[#f5c451]">
                {t("hero.badge")}
              </Badge>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.05em] text-foreground dark:text-white md:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground dark:text-white/65 md:text-lg">
                {t("hero.description")}
              </p>

              <form onSubmit={handleSearchSubmit} className="mt-8 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-white/35" />
                    <Input
                      value={draftQuery}
                      onChange={(event) => setDraftQuery(event.target.value)}
                      placeholder={t("hero.search_placeholder")}
                      className="h-12 rounded-full border-border bg-card pl-11 text-foreground placeholder:text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35"
                    />
                  </div>

                  <select
                    value={activeFilters.sort || "featured"}
                    onChange={(event) => setSort(event.target.value)}
                    className="h-12 rounded-full border border-border bg-card px-4 text-sm text-foreground outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-white text-slate-900 dark:bg-black dark:text-white">
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>

                  <Button
                    type="submit"
                    className="h-12 rounded-full bg-[#f5c451] px-6 text-black hover:bg-[#f5c451]/90"
                  >
                    {t("hero.search_button")}
                  </Button>
                </div>
              </form>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <StatCard
                  icon={Disc3}
                  label={t("stats.results_label")}
                  value={meta.total_count || 0}
                  hint={hasActiveFilters ? t("stats.results_filtered_hint") : t("stats.results_default_hint")}
                />
                <StatCard
                  icon={Sparkles}
                  label={t("stats.analyzed_label")}
                  value={facets.stats?.analyzed_count || 0}
                  hint={t("stats.analyzed_hint")}
                />
                <StatCard
                  icon={Waves}
                  label={t("stats.tempo_label")}
                  value={
                    facets.stats?.bpm_min && facets.stats?.bpm_max
                      ? `${facets.stats.bpm_min}-${facets.stats.bpm_max}`
                      : t("stats.not_available")
                  }
                  hint={t("stats.tempo_hint")}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="overflow-hidden rounded-[32px] border border-border bg-card dark:border-white/10 dark:bg-[#0b0b0e]"
            >
              {highlightedPlaylist ? (
                <Link to={`/playlists/${highlightedPlaylist.slug}`} className="block h-full">
                  <div className="relative h-full min-h-[320px]">
                    <img
                      src={highlightedPlaylist.cover_url.medium}
                      alt={highlightedPlaylist.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <p className="text-xs uppercase tracking-[0.28em] text-[#f5c451]">{t("highlighted_playlist.eyebrow")}</p>
                      <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                        {highlightedPlaylist.title}
                      </h2>
                      <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
                        {truncate(highlightedPlaylist.description || t("highlighted_playlist.fallback_description"), 120)}
                      </p>
                      <div className="mt-6">
                        <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white">
                          {t("highlighted_playlist.open_release")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex h-full min-h-[320px] flex-col justify-between p-6 md:p-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[#f5c451]">{t("fallback_panel.eyebrow")}</p>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground dark:text-white">{t("fallback_panel.title")}</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-[28px] border border-border bg-muted/50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground dark:text-white/65">
                        <SlidersHorizontal className="h-4 w-4 text-[#f5c451]" />
                        {t("fallback_panel.genre_mood_title")}
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground dark:text-white/55">
                        {t("fallback_panel.genre_mood_description")}
                      </p>
                    </div>
                    <div className="rounded-[28px] border border-border bg-muted/50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground dark:text-white/65">
                        <Mic2 className="h-4 w-4 text-[#f5c451]" />
                        {t("fallback_panel.ranking_title")}
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground dark:text-white/55">
                        {t("fallback_panel.ranking_description")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 md:py-10">
        <div className="rounded-[32px] border border-border bg-card/90 p-6 md:p-8 dark:border-white/10 dark:bg-[#09090b]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#f5c451]">{t("filters.eyebrow")}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground dark:text-white md:text-3xl">
                {t("filters.title")}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={activeFilters.vocal_mode || ""}
                onChange={(event) => setFilter("vocal_mode", event.target.value)}
                className="h-11 rounded-full border border-border bg-card px-4 text-sm text-foreground outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                {VOCAL_MODES.map((option) => (
                  <option key={option.value || "all"} value={option.value} className="bg-white text-slate-900 dark:bg-black dark:text-white">
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>

              <select
                value={activeFilters.language || ""}
                onChange={(event) => setFilter("language", event.target.value)}
                className="h-11 rounded-full border border-border bg-card px-4 text-sm text-foreground outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <option value="" className="bg-white text-slate-900 dark:bg-black dark:text-white">
                  {t("filters.any_language")}
                </option>
                {facets.languages.map((language) => (
                  <option key={language.value} value={language.value} className="bg-white text-slate-900 dark:bg-black dark:text-white">
                    {language.value} ({language.count})
                  </option>
                ))}
              </select>

              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  className="h-11 rounded-full border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground dark:border-white/15 dark:text-white dark:hover:bg-white dark:hover:text-black"
                  onClick={clearFilters}
                >
                  {t("filters.reset_all")}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground dark:text-white/65">
                <Disc3 className="h-4 w-4 text-[#f5c451]" />
                {t("filters.genre")}
              </div>
              <div className="flex flex-wrap gap-2">
                {facets.genres.map((genre) => (
                  <FilterPill
                    key={genre.value}
                    active={activeFilters.genre === genre.value}
                    count={genre.count}
                    onClick={() => toggleFilter("genre", genre.value)}
                  >
                    {genre.value}
                  </FilterPill>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground dark:text-white/65">
                <Sparkles className="h-4 w-4 text-[#f5c451]" />
                {t("filters.mood")}
              </div>
              <div className="flex flex-wrap gap-2">
                {facets.moods.map((mood) => (
                  <FilterPill
                    key={mood.value}
                    active={activeFilters.mood === mood.value}
                    count={mood.count}
                    onClick={() => toggleFilter("mood", mood.value)}
                  >
                    {mood.value}
                  </FilterPill>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground dark:text-white/65">
                <Waves className="h-4 w-4 text-[#f5c451]" />
                {t("filters.tempo")}
              </div>
              <div className="flex flex-wrap gap-2">
                {facets.tempo_bands.map((band) => (
                  <FilterPill
                    key={band.key}
                    active={activeFilters.tempo_band === band.key}
                    count={band.count}
                    onClick={() => toggleFilter("tempo_band", band.key)}
                  >
                    {band.label}
                  </FilterPill>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground dark:text-white/65">
                <SlidersHorizontal className="h-4 w-4 text-[#f5c451]" />
                {t("filters.subgenre")}
              </div>
              <div className="flex flex-wrap gap-2">
                {facets.subgenres.map((subgenre) => (
                  <FilterPill
                    key={subgenre.value}
                    active={activeFilters.subgenre === subgenre.value}
                    count={subgenre.count}
                    onClick={() => toggleFilter("subgenre", subgenre.value)}
                  >
                    {subgenre.value}
                  </FilterPill>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {!hasActiveFilters ? (
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-2 sm:px-8">
          <DiscoveryShelf
            section={discoverySections.genres}
            filterKey="genre"
            activeValue={activeFilters.genre}
            onSelect={toggleFilter}
            onPrepareQueue={(queueTrackIds) => {
              queueContextRef.current = "shelf";
              setPlaylist(queueTrackIds);
            }}
          />
          <DiscoveryShelf
            section={discoverySections.moods}
            filterKey="mood"
            activeValue={activeFilters.mood}
            onSelect={toggleFilter}
            onPrepareQueue={(queueTrackIds) => {
              queueContextRef.current = "shelf";
              setPlaylist(queueTrackIds);
            }}
          />
        </div>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-8 md:py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#f5c451]">{t("results.eyebrow")}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground dark:text-white">
              {hasActiveFilters ? t("results.filtered_title") : t("results.default_title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground dark:text-white/55">
              {t("results.summary", { count: meta.total_count || 0 })}
            </p>
          </div>

          {hasActiveFilters ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(activeFilters)
                .filter(([key, value]) => key !== "sort" && value)
                .map(([key, value]) => (
                  <ActiveFilterBadge
                    key={key}
                    label={activeFilterLabel(key)}
                    value={activeFilterValue(key, value, facets)}
                    onClear={() => setFilter(key, "")}
                  />
                ))}
            </div>
          ) : null}
        </div>

        {tracks.length ? (
          <>
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tracks.map((track) => (
                <DiscoveryTrackCard
                  key={track.id}
                  track={track}
                  onBeforePlay={() => {
                    queueContextRef.current = "results";
                    setPlaylist(resultQueueTrackIds);
                  }}
                />
              ))}
            </div>

            {meta.current_page < meta.total_pages ? (
              <div className="mt-10 flex justify-center">
                <Button
                  variant="outline"
                  className="rounded-full border-border bg-transparent px-6 text-foreground hover:bg-muted hover:text-foreground dark:border-white/15 dark:text-white dark:hover:bg-white dark:hover:text-black"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? t("results.loading_more") : t("results.load_more")}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-8 rounded-[28px] border border-dashed border-border bg-card/70 p-10 text-center dark:border-white/15 dark:bg-white/[0.03]">
            <h3 className="text-2xl font-bold text-foreground dark:text-white">{t("empty.title")}</h3>
            <p className="mt-3 text-sm text-muted-foreground dark:text-white/55">
              {t("empty.description")}
            </p>
            <div className="mt-6">
              <Button
                variant="outline"
                className="rounded-full border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground dark:border-white/15 dark:text-white dark:hover:bg-white dark:hover:text-black"
                onClick={clearFilters}
              >
                {t("empty.reset")}
              </Button>
            </div>
          </div>
        )}
      </section>

      <FeaturedArtists artists={artists} />

      <CuratedPlaylists
        playlists={featuredAlbums}
        title={t("featured_albums.title")}
        subtitle={t("featured_albums.subtitle")}
      />

      <CuratedPlaylists
        playlists={curatedPlaylists}
        title={t("curated_playlists.title")}
        subtitle={t("curated_playlists.subtitle")}
      />

      <section className="bg-muted/40 px-4 py-16 sm:px-8 md:py-24 dark:bg-white/[0.03]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#f5c451]">{t("labels.eyebrow")}</p>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-foreground dark:text-white">{t("labels.title")}</h2>
            </div>
            <p className="max-w-xl text-sm text-muted-foreground dark:text-white/55">
              {t("labels.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
            {labels.map((label) => (
              <Link
                key={label.id}
                to={`/${label.username}`}
                className="block transition-transform hover:scale-[1.02]"
              >
                <LabelCard label={label} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
