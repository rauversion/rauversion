import React from "react"
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLocaleStore } from "stores/locales"

export interface TourDate {
  id?: string
  date: string
  venue: string
  city: string
}

export function withTourDateIds(dates: TourDate[]): TourDate[] {
  const seen = new Set<string>()
  return dates.map((date) => {
    const id = date.id && !seen.has(date.id) ? date.id : crypto.randomUUID()
    seen.add(id)
    return { ...date, id }
  })
}

interface TourDatesEditorProps {
  dates: TourDate[]
  onChange: (dates: TourDate[]) => void
}

function TourRow({ tour, index, count, onUpdate, onMove, onRemove }: {
  tour: TourDate; index: number; count: number; onUpdate: (changes: Partial<TourDate>) => void; onMove: (from: number, to: number) => void; onRemove: () => void
}) {
  const { i18n } = useLocaleStore
  const id = tour.id || String(index)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`relative space-y-4 rounded-xl border border-border bg-background p-4 ${isDragging ? "z-10 opacity-70 shadow-xl" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button ref={setActivatorNodeRef} type="button" {...attributes} {...listeners} aria-label={i18n.t("press_kit.tour_order.drag", { number: index + 1 })}
            className="grid h-10 w-8 shrink-0 touch-none cursor-grab place-items-center rounded-md text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"><GripVertical className="h-5 w-5" /></button>
          <span className="text-sm tabular-nums text-muted-foreground">{index + 1} / {count}</span>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="icon" variant="outline" disabled={index === 0} aria-label={i18n.t("press_kit.tour_order.move_up", { number: index + 1 })} onClick={() => onMove(index, index - 1)}><ArrowUp className="h-4 w-4" /></Button>
          <Button type="button" size="icon" variant="outline" disabled={index === count - 1} aria-label={i18n.t("press_kit.tour_order.move_down", { number: index + 1 })} onClick={() => onMove(index, index + 1)}><ArrowDown className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {(["date", "venue", "city"] as const).map((field) => (
          <div key={field} className="space-y-2">
            <Label htmlFor={`tour-${id}-${field}`}>{i18n.t(`press_kit.tour_dates.${field}`)}</Label>
            <Input id={`tour-${id}-${field}`} value={tour[field]} onChange={(event) => onUpdate({ [field]: event.target.value })} placeholder={i18n.t(`press_kit.tour_dates.${field}_placeholder`)} />
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="destructive" onClick={onRemove}>{i18n.t("press_kit.tour_dates.remove")}</Button>
    </div>
  )
}

export default function TourDatesEditor({ dates, onChange }: TourDatesEditorProps) {
  const { i18n } = useLocaleStore
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const move = (from: number, to: number) => {
    if (from < 0 || to < 0 || from >= dates.length || to >= dates.length || from === to) return
    onChange(arrayMove(dates, from, to))
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">{i18n.t("press_kit.tour_dates.title")}</h3>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...dates, { id: crypto.randomUUID(), date: "", venue: "", city: "" }])}>{i18n.t("press_kit.tour_dates.add")}</Button>
      </div>
      {dates.length > 0 && <p className="text-sm text-muted-foreground">{i18n.t("press_kit.tour_order.hint")}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} accessibility={{ screenReaderInstructions: { draggable: i18n.t("press_kit.tour_order.keyboard") } }}
        onDragEnd={({ active, over }) => {
          if (!over) return
          move(dates.findIndex((date, index) => (date.id || String(index)) === active.id), dates.findIndex((date, index) => (date.id || String(index)) === over.id))
        }}>
        <SortableContext items={dates.map((tour, index) => tour.id || String(index))} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {dates.map((tour, index) => <TourRow key={tour.id || index} tour={tour} index={index} count={dates.length} onMove={move}
              onUpdate={(changes) => onChange(dates.map((item, i) => i === index ? { ...item, ...changes } : item))}
              onRemove={() => onChange(dates.filter((_, i) => i !== index))} />)}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
