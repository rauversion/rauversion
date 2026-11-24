import React from "react"
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocaleStore } from "stores/locales"

interface SortablePhoto {
  id: number | string
  url: string
  description?: string
}

interface PressPhotoSorterProps {
  photos: SortablePhoto[]
  onChange: (ids: (number | string)[]) => void
}

function PhotoRow({ photo, index, count, onMove }: { photo: SortablePhoto; index: number; count: number; onMove: (from: number, to: number) => void }) {
  const { i18n } = useLocaleStore
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: String(photo.id) })
  const name = photo.description || i18n.t("press_kit.slideshow.photo", { number: index + 1 })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex items-center gap-2 rounded-xl border border-border bg-background p-2 sm:gap-4 sm:p-3 ${isDragging ? "z-10 opacity-70 shadow-xl" : ""}`}>
      <button ref={setActivatorNodeRef} type="button" {...attributes} {...listeners}
        aria-label={i18n.t("press_kit.photo_order.drag", { number: index + 1 })}
        className="grid h-11 w-8 shrink-0 touch-none cursor-grab place-items-center rounded-md text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing">
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-secondary sm:h-20 sm:w-24">
        {photo.url && <img src={photo.url} alt={name} className="h-full w-full rounded-lg object-contain" loading="lazy" draggable={false} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs tabular-nums text-primary">{index + 1} / {count}</p>
        <p className="line-clamp-2 text-sm">{name}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
        <Button type="button" variant="outline" size="icon" className="h-10 w-10" disabled={index === 0}
          aria-label={i18n.t("press_kit.photo_order.move_up", { number: index + 1 })} onClick={() => onMove(index, index - 1)}><ArrowUp className="h-4 w-4" /></Button>
        <Button type="button" variant="outline" size="icon" className="h-10 w-10" disabled={index === count - 1}
          aria-label={i18n.t("press_kit.photo_order.move_down", { number: index + 1 })} onClick={() => onMove(index, index + 1)}><ArrowDown className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}

export default function PressPhotoSorter({ photos, onChange }: PressPhotoSorterProps) {
  const { i18n } = useLocaleStore
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const move = (from: number, to: number) => {
    if (from < 0 || to < 0 || from >= photos.length || to >= photos.length || from === to) return
    onChange(arrayMove(photos, from, to).map((photo) => photo.id))
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{i18n.t("press_kit.photo_order.hint")}</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter}
        accessibility={{ screenReaderInstructions: { draggable: i18n.t("press_kit.photo_order.keyboard") } }}
        onDragEnd={({ active, over }) => {
          if (!over) return
          move(photos.findIndex((photo) => String(photo.id) === String(active.id)), photos.findIndex((photo) => String(photo.id) === String(over.id)))
        }}>
        <SortableContext items={photos.map((photo) => String(photo.id))} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {photos.map((photo, index) => <PhotoRow key={photo.id} photo={photo} index={index} count={photos.length} onMove={move} />)}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
