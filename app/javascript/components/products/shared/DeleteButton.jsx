import React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { destroy } from "@rails/request.js"
import I18n from '@/stores/locales'
import useAuthStore from '@/stores/authStore'

export default function DeleteButton({ product }) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const [deletionReason, setDeletionReason] = React.useState("")

  const handleDelete = async () => {
    try {
      const response = await destroy(`/${currentUser.username}/products/${product.slug}.json`, {
        responseKind: "json",
        body: { deletion_reason: deletionReason },
      })

      if (response.ok) {
        toast({
          title: I18n.t("products.form.delete_success_title"),
          description: I18n.t("products.form.delete_success_description"),
        })
        navigate(`/${currentUser.username}/products`)
      }
    } catch (error) {
      toast({
        title: I18n.t("products.form.delete_error_title"),
        description: I18n.t("products.form.delete_error_description"),
        variant: "destructive",
      })
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full md:w-auto"
        >
          {I18n.t("products.form.delete")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{I18n.t("products.form.delete_title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {I18n.t("products.form.delete_confirm")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="deletion_reason">
            {I18n.t("products.form.delete_reason")}
          </label>
          <Textarea
            id="deletion_reason"
            value={deletionReason}
            onChange={(event) => setDeletionReason(event.target.value)}
            placeholder={I18n.t("products.form.delete_reason_placeholder")}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{I18n.t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            {I18n.t("products.form.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
