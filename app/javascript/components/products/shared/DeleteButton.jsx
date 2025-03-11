import React from "react"
import { Button } from "@/components/ui/button"
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

  const handleDelete = async () => {
    try {
      const response = await destroy(`/${currentUser.username}/products/${product.slug}.json`)
      if (response.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
        navigate(`/${currentUser.username}/products`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
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
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {I18n.t("products.form.delete_confirm")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            {I18n.t("products.form.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
