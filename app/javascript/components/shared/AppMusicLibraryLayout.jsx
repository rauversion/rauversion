import React, {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Link, useNavigate } from "react-router-dom"
import { get, post } from "@rails/request.js"
import {
  Album,
  AlignJustify,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Disc3,
  ExternalLink,
  Grid2x2,
  Heart,
  LayoutGrid,
  LibraryBig,
  List,
  Loader2,
  PanelLeft,
  Pause,
  Play,
  Plus,
  SlidersHorizontal,
  UserRound,
} from "lucide-react"

import useAuthStore from "@/stores/authStore"
import useAudioStore from "@/stores/audioStore"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

const FILTERS = [
  { id: "all", label: "Todo", icon: LibraryBig },
  { id: "playlists", label: "Playlists", icon: Disc3 },
  { id: "albums", label: "Álbumes", icon: Album },
  { id: "artists", label: "Artistas", icon: UserRound },
  { id: "likes", label: "Me gusta", icon: Heart },
]

const PLAYLIST_TYPES = [
  { value: "playlist", label: "Playlist" },
  { value: "album", label: "Álbum" },
  { value: "ep", label: "EP" },
  { value: "single", label: "Single" },
  { value: "compilation", label: "Compilación" },
]

const SORT_OPTIONS = [
  { id: "recent", label: "Recientes" },
  { id: "recently_added", label: "Agregados recientemente" },
  { id: "alphabetical", label: "Alfabéticamente" },
  { id: "creator", label: "Creador" },
]

const VIEW_MODES = [
  { id: "list", label: "Lista", icon: List },
  { id: "compact-list", label: "Compacta", icon: AlignJustify },
  { id: "grid", label: "Grilla", icon: Grid2x2 },
  { id: "compact-grid", label: "Mosaico", icon: LayoutGrid },
]

function buildPageWindow(currentPage, totalPages) {
  if (!totalPages || totalPages <= 1) return [1]

  let start = Math.max(1, currentPage - 1)
  let end = Math.min(totalPages, start + 2)

  if (end - start < 2) {
    start = Math.max(1, end - 2)
  }

  const pages = []
  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  return pages
}

function formatItemMeta(item) {
  switch (item.entity_type) {
    case "playlist":
      return `Playlist · ${item.track_count || 0} tracks`
    case "album":
      return `${(item.playlist_type || "album").toUpperCase()} · ${item.track_count || 0} tracks`
    case "artist":
      return `Artista · ${item.playlist_count || 0} playlists`
    case "likes":
      return `${item.track_count || 0} tracks guardados`
    default:
      return item.subtitle || ""
  }
}

function getSortLabel(sortMode) {
  return SORT_OPTIONS.find((option) => option.id === sortMode)?.label || "Recientes"
}

function getFilterLabel(filter) {
  return FILTERS.find((option) => option.id === filter)?.label || "Todo"
}

function itemIsActive(item, currentTrackId) {
  return Array.isArray(item.track_ids) && item.track_ids.some((trackId) => `${trackId}` === `${currentTrackId}`)
}

function SidebarArtwork({ item, className, iconClassName }) {
  if (item.entity_type === "likes") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-cyan-400 shadow-lg shadow-fuchsia-500/20",
          className
        )}
      >
        <Heart className={cn("h-6 w-6 fill-current text-white", iconClassName)} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "overflow-hidden bg-white/10 ring-1 ring-white/10",
        item.artwork_style === "circle" ? "rounded-full" : "rounded-2xl",
        className
      )}
    >
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-white/5">
          {item.entity_type === "artist" ? (
            <UserRound className={cn("h-5 w-5 text-white/80", iconClassName)} />
          ) : (
            <Disc3 className={cn("h-5 w-5 text-white/80", iconClassName)} />
          )}
        </div>
      )}
    </div>
  )
}

function CreatePlaylistDialog({ open, onOpenChange, onCreated }) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [playlistType, setPlaylistType] = useState("playlist")

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setPlaylistType("playlist")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)

    try {
      const response = await post("/playlists.json", {
        responseKind: "json",
        body: JSON.stringify({
          playlist: {
            title: title.trim(),
            description: description.trim(),
            playlist_type: playlistType,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("No se pudo crear la playlist")
      }

      toast({
        title: "Playlist creada",
        description: "La biblioteca se actualizó con tu nueva playlist.",
      })

      const nextFilter = playlistType === "playlist" ? "playlists" : "albums"
      resetForm()
      onOpenChange(false)
      onCreated(nextFilter)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la playlist.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-50 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear playlist</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Crea una playlist nueva sin salir del layout principal.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="playlist-title">Nombre</Label>
            <Input
              id="playlist-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej. Biblioteca nocturna"
              className="border-zinc-800 bg-zinc-900 text-zinc-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="playlist-type">Tipo</Label>
            <Select value={playlistType} onValueChange={setPlaylistType}>
              <SelectTrigger id="playlist-type" className="border-zinc-800 bg-zinc-900 text-zinc-50">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-50">
                {PLAYLIST_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="playlist-description">Descripción</Label>
            <Textarea
              id="playlist-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Opcional"
              className="min-h-28 border-zinc-800 bg-zinc-900 text-zinc-50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FilterPills({ counts, filter, onFilterChange }) {
  const scrollRef = useRef(null)
  const contentRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const maxScrollLeft = element.scrollWidth - element.clientWidth
    setCanScrollLeft(element.scrollLeft > 6)
    setCanScrollRight(maxScrollLeft > 6 && element.scrollLeft < maxScrollLeft - 6)
  }, [])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    updateScrollState()
    element.addEventListener("scroll", updateScrollState)

    const observer = new ResizeObserver(updateScrollState)
    observer.observe(element)
    if (contentRef.current) {
      observer.observe(contentRef.current)
    }

    return () => {
      element.removeEventListener("scroll", updateScrollState)
      observer.disconnect()
    }
  }, [counts, updateScrollState])

  const handleScroll = (direction) => {
    const element = scrollRef.current
    if (!element) return

    element.scrollBy({
      left: direction * 180,
      behavior: "smooth",
    })
  }

  return (
    <div className="relative">
      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center bg-gradient-to-r from-[#111827] via-[#111827] to-transparent pl-1 pr-5">
          <button
            type="button"
            onClick={() => handleScroll(-1)}
            className="pointer-events-auto rounded-full border border-white/10 bg-black/40 p-1.5 text-zinc-100 transition-colors hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center bg-gradient-to-l from-[#111827] via-[#111827] to-transparent pl-5 pr-1">
          <button
            type="button"
            onClick={() => handleScroll(1)}
            className="pointer-events-auto rounded-full border border-white/10 bg-black/40 p-1.5 text-zinc-100 transition-colors hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="scrollbar-hide overflow-x-auto scroll-smooth px-2"
      >
        <div ref={contentRef} className="flex min-w-max gap-2 pb-1">
          {FILTERS.map((option) => {
            const Icon = option.icon
            const isActive = filter === option.id

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onFilterChange(option.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "border-emerald-300/70 bg-emerald-300/15 text-white"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs text-zinc-200">
                  {counts[option.id] || 0}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LibrarySortMenu({ sortMode, viewMode, onSortChange, onViewModeChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="rounded-full border border-white/10 bg-white/5 px-3 text-zinc-100 hover:bg-white/10 hover:text-white"
        >
          <span className="truncate">{getSortLabel(sortMode)}</span>
          <SlidersHorizontal className="ml-2 h-4 w-4" />
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-zinc-400" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-72 rounded-[24px] border border-white/10 bg-zinc-900/95 p-3 text-zinc-50 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      >
        <div className="px-2 pb-2 text-sm font-semibold text-zinc-300">
          Clasificar por
        </div>

        <div className="space-y-1">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSortChange(option.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl px-2 py-2.5 text-left text-[15px] transition-colors",
                sortMode === option.id
                  ? "bg-emerald-400/10 text-emerald-400"
                  : "text-zinc-100 hover:bg-white/5"
              )}
            >
              <span>{option.label}</span>
              {sortMode === option.id && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>

        <div className="my-3 h-px bg-white/10" />

        <div className="px-2 pb-2 text-sm font-semibold text-zinc-300">
          Ver como
        </div>

        <div className="grid grid-cols-4 gap-2 rounded-2xl bg-black/20 p-1">
          {VIEW_MODES.map((mode) => {
            const Icon = mode.icon

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onViewModeChange(mode.id)}
                aria-label={mode.label}
                className={cn(
                  "flex h-10 items-center justify-center rounded-xl border text-zinc-200 transition-colors",
                  viewMode === mode.id
                    ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-400"
                    : "border-transparent bg-white/5 hover:bg-white/10"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MusicLibraryListItem({
  item,
  isActive,
  isPlaying,
  compact,
  onOpen,
  onPlay,
}) {
  const hasLink = Boolean(item.href)
  const BodyTag = hasLink ? "button" : "div"

  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10",
        compact ? "p-2" : "p-3",
        isActive && "border-emerald-300/50 bg-emerald-400/10"
      )}
    >
      <div className="flex items-center gap-3">
        <SidebarArtwork
          item={item}
          className={compact ? "h-11 w-11" : "h-14 w-14"}
          iconClassName={compact ? "h-4 w-4" : "h-6 w-6"}
        />

        <BodyTag
          {...(hasLink
            ? {
                type: "button",
                onClick: () => onOpen(item),
              }
            : {})}
          className={cn("min-w-0 flex-1 text-left", hasLink && "cursor-pointer")}
        >
          <p className={cn("truncate font-medium text-white", compact ? "text-sm" : "text-base")}>
            {item.title}
          </p>
          <p className={cn("truncate text-zinc-400", compact ? "text-xs" : "text-sm")}>
            {formatItemMeta(item)}
          </p>
          {item.owner_name && !compact && (
            <p className="truncate text-xs uppercase tracking-[0.2em] text-zinc-500">
              {item.owner_name}
            </p>
          )}
        </BodyTag>

        <div className="flex items-center gap-1">
          {item.playable && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onPlay(item)}
              className="rounded-full text-zinc-100 hover:bg-white/10 hover:text-white"
            >
              {isActive && isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          )}

          {hasLink && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onOpen(item)}
              className="rounded-full text-zinc-100 hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {!compact && item.description && (
        <p className="mt-3 line-clamp-2 text-sm text-zinc-400">
          {item.description}
        </p>
      )}
    </div>
  )
}

function MusicLibraryGridItem({
  item,
  isActive,
  isPlaying,
  compact,
  onOpen,
  onPlay,
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10",
        compact ? "p-1.5" : "p-2.5",
        isActive && "border-emerald-300/50 bg-emerald-400/10"
      )}
    >
      <SidebarArtwork
        item={item}
        className={cn(
          "aspect-square w-full",
          compact ? "rounded-[18px]" : "rounded-[20px]"
        )}
        iconClassName={compact ? "h-5 w-5" : "h-6 w-6"}
      />

      <div className={cn("mt-2", compact ? "space-y-1" : "space-y-1.5")}>
        {item.href ? (
          <button
            type="button"
            onClick={() => onOpen(item)}
            className="block w-full text-left"
          >
            <p className={cn("line-clamp-2 font-medium text-white", compact ? "text-xs" : "text-sm")}>
              {item.title}
            </p>
          </button>
        ) : (
          <p className={cn("line-clamp-2 font-medium text-white", compact ? "text-xs" : "text-sm")}>
            {item.title}
          </p>
        )}

        <p className={cn("line-clamp-2 text-zinc-400", compact ? "text-[11px]" : "text-xs")}>
          {formatItemMeta(item)}
        </p>
      </div>

      <div className={cn("mt-2 flex items-center gap-1", compact && "mt-1.5")}>
        {item.playable && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onPlay(item)}
            className={cn(
              "rounded-full text-zinc-100 hover:bg-white/10 hover:text-white",
              compact ? "h-7 w-7" : "h-8 w-8"
            )}
          >
            {isActive && isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </Button>
        )}

        {item.href && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onOpen(item)}
            className={cn(
              "rounded-full text-zinc-100 hover:bg-white/10 hover:text-white",
              compact ? "h-7 w-7" : "h-8 w-8"
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

function MusicLibraryItem({ item, viewMode, isActive, isPlaying, onOpen, onPlay }) {
  if (viewMode === "grid" || viewMode === "compact-grid") {
    return (
      <MusicLibraryGridItem
        item={item}
        isActive={isActive}
        isPlaying={isPlaying}
        compact={viewMode === "compact-grid"}
        onOpen={onOpen}
        onPlay={onPlay}
      />
    )
  }

  return (
    <MusicLibraryListItem
      item={item}
      isActive={isActive}
      isPlaying={isPlaying}
      compact={viewMode === "compact-list"}
      onOpen={onOpen}
      onPlay={onPlay}
    />
  )
}

function MusicLibrarySidebar({ onNavigate }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { currentUser } = useAuthStore()
  const { currentTrackId, isPlaying, play, pause } = useAudioStore()

  const [filter, setFilter] = useState("all")
  const [sortMode, setSortMode] = useState("recent")
  const [viewMode, setViewMode] = useState("list")
  const [page, setPage] = useState(1)
  const [library, setLibrary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!currentUser) return

    let cancelled = false

    const fetchLibrary = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await get(`/api/v1/me/music_library?filter=${filter}&sort=${sortMode}&page=${page}`, {
          responseKind: "json",
        })

        if (!response.ok) {
          throw new Error("No se pudo cargar la biblioteca.")
        }

        const data = await response.json
        if (!cancelled) {
          setLibrary(data)
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message)
          toast({
            title: "Error",
            description: fetchError.message,
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchLibrary()

    return () => {
      cancelled = true
    }
  }, [currentUser, filter, page, reloadToken, sortMode, toast])

  const handleFilterChange = (nextFilter) => {
    startTransition(() => {
      setFilter(nextFilter)
      setPage(1)
    })
  }

  const handleSortChange = (nextSort) => {
    startTransition(() => {
      setSortMode(nextSort)
      setPage(1)
    })
  }

  const handlePlay = (item) => {
    if (!item.playable || !item.primary_track_id) return

    const active = itemIsActive(item, currentTrackId)

    if (active && isPlaying) {
      pause()
      return
    }

    useAudioStore.setState({ playlist: item.track_ids || [] })
    play(item.primary_track_id)
  }

  const handleOpen = (item) => {
    if (!item.href) return

    navigate(item.href)
    onNavigate?.()
  }

  const handleCreated = (nextFilter) => {
    startTransition(() => {
      setFilter(nextFilter)
      setSortMode("recent")
      setPage(1)
    })
    setReloadToken((token) => token + 1)
  }

  const items = library?.collection || []
  const counts = library?.counts || {}
  const metadata = library?.metadata || {}
  const visiblePages = useMemo(
    () => buildPageWindow(metadata.current_page || 1, metadata.total_pages || 1),
    [metadata.current_page, metadata.total_pages]
  )

  const collectionLayoutClassName = cn(
    "p-3 sm:p-4",
    viewMode === "list" && "space-y-3",
    viewMode === "compact-list" && "space-y-1.5",
    viewMode === "grid" && "grid grid-cols-2 gap-3",
    viewMode === "compact-grid" && "grid grid-cols-3 gap-2"
  )

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_28%),linear-gradient(180deg,#09090b_0%,#111827_100%)] text-zinc-50 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/80">
              Biblioteca
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Tu música
            </h2>
          </div>

          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-full bg-white text-zinc-950 hover:bg-emerald-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear
          </Button>
        </div>

        <p className="mt-3 max-w-sm text-sm text-zinc-400">
          Playlists, álbumes, artistas y tus me gusta del usuario autenticado, todo paginado.
        </p>
      </div>

      <div className="border-b border-white/10 px-2 py-3">
        <FilterPills
          counts={counts}
          filter={filter}
          onFilterChange={handleFilterChange}
        />
      </div>

      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {getFilterLabel(filter)}
          </p>
          <p className="truncate text-xs uppercase tracking-[0.18em] text-zinc-500">
            {metadata.total_count || 0} resultados
          </p>
        </div>

        <LibrarySortMenu
          sortMode={sortMode}
          viewMode={viewMode}
          onSortChange={handleSortChange}
          onViewModeChange={setViewMode}
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className={collectionLayoutClassName}>
          {loading && (
            <div className="col-span-full flex min-h-56 items-center justify-center text-sm text-zinc-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando biblioteca...
            </div>
          )}

          {!loading && error && (
            <div className="col-span-full rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-zinc-300">
              No hay resultados para este filtro todavía.
            </div>
          )}

          {!loading && !error && items.map((item) => (
            <MusicLibraryItem
              key={item.id}
              item={item}
              viewMode={viewMode}
              isActive={itemIsActive(item, currentTrackId)}
              isPlaying={isPlaying}
              onOpen={handleOpen}
              onPlay={handlePlay}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-white/10 px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
          <span>{getSortLabel(sortMode)}</span>
          <span>
            Página {metadata.current_page || 1} de {metadata.total_pages || 1}
          </span>
        </div>

        <Pagination className="justify-start">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  if (metadata.prev_page) {
                    setPage(metadata.prev_page)
                  }
                }}
                className={cn(
                  metadata.prev_page ? "" : "pointer-events-none opacity-40"
                )}
              />
            </PaginationItem>

            {visiblePages.map((visiblePage) => (
              <PaginationItem key={visiblePage}>
                <PaginationLink
                  href="#"
                  isActive={visiblePage === (metadata.current_page || 1)}
                  onClick={(event) => {
                    event.preventDefault()
                    setPage(visiblePage)
                  }}
                >
                  {visiblePage}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  if (metadata.next_page) {
                    setPage(metadata.next_page)
                  }
                }}
                className={cn(
                  metadata.next_page ? "" : "pointer-events-none opacity-40"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <CreatePlaylistDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  )
}

function MobileMusicLibrary() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" className="rounded-full">
            <PanelLeft className="mr-2 h-4 w-4" />
            Abrir biblioteca
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-[92vw] border-zinc-900 bg-transparent p-3 shadow-none sm:max-w-xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Biblioteca musical</SheetTitle>
          </SheetHeader>

          <div className="h-full pb-4 pt-8">
            <MusicLibrarySidebar onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default function AppMusicLibraryLayout({ children }) {
  const { currentUser } = useAuthStore()
  const isMobile = useIsMobile()

  if (!currentUser) {
    return children
  }

  if (isMobile) {
    return (
      <div>
        <MobileMusicLibrary />
        <div>{children}</div>
      </div>
    )
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      autoSaveId="app-music-library-layout"
      className="min-h-[calc(100vh-11rem)] w-full items-start"
    >
      <ResizablePanel defaultSize={24} minSize={18} maxSize={34}>
        <div className="sticky top-4 h-[calc(100vh-8rem)] pr-4">
          <MusicLibrarySidebar />
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle className="mx-1 bg-transparent" />

      <ResizablePanel minSize={60}>
        <div className="min-w-0">{children}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
