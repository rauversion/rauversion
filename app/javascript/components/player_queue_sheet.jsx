import React from "react"
import { List } from "lucide-react"

import usePlayerQueueSheetStore from "@/stores/playerQueueSheetStore"
import PlayerSidebar from "@/components/player_sidebar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

function t(key, options = {}) {
  return I18n.t(`player_queue.${key}`, options)
}

export default function PlayerQueueSheet({
  triggerClassName,
  contentClassName,
}) {
  const isOpen = usePlayerQueueSheetStore((state) => state.isOpen)
  const setOpen = usePlayerQueueSheetStore((state) => state.setOpen)

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("open")}
          title={t("open")}
          className={cn("rounded-full p-2 hover:bg-accent", triggerClassName)}
        >
          <List size={20} />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className={cn(
          "w-[400px] p-0 sm:w-[540px] bg-background text-foreground border-l border-border/70",
          contentClassName
        )}
      >
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>

        <div className="h-[calc(100vh-120px)]">
          <PlayerSidebar />
        </div>
      </SheetContent>
    </Sheet>
  )
}
