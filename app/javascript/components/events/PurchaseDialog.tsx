import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import PurchaseForm from "./PurchaseForm"

interface PurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
}

export default function PurchaseDialog({ open, onOpenChange, eventId }: PurchaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <PurchaseForm eventId={eventId} />
      </DialogContent>
    </Dialog>
  )
}
