import { useCallback, useState } from "react"
import { post } from "@rails/request.js"

import useAuthStore from "@/stores/authStore"
import { useToast } from "@/hooks/use-toast"

function t(key, options = {}) {
  return I18n.t(key, options)
}

export default function useTrackLikeAction() {
  const { currentUser } = useAuthStore()
  const { toast } = useToast()
  const [isPending, setIsPending] = useState(false)

  const toggleLike = useCallback(async ({ track, onPatch }) => {
    if (!track?.id || !track?.slug || isPending) return null

    if (!currentUser) {
      toast({
        title: t("audio_player.auth_required_title"),
        description: t("audio_player.auth_required_description"),
        variant: "destructive",
      })
      return null
    }

    setIsPending(true)

    try {
      const response = await post(`/tracks/${track.slug}/likes`, {
        responseKind: "json",
      })

      if (!response.ok) {
        let errorData = null

        try {
          errorData = await response.json
        } catch (error) {
          errorData = null
        }

        throw new Error(errorData?.message || t("audio_player.like_error"))
      }

      const { liked, resource } = await response.json
      const patch = {
        like_id: liked,
        liked_by_current_user: liked,
        likes_count: resource?.likes_count || 0,
      }

      onPatch?.(patch, { liked, resource })

      toast({
        title: t("audio_player.like_success_title"),
        description: liked
          ? t("audio_player.like_success_description")
          : t("audio_player.unlike_success_description"),
      })

      return { liked, resource, patch }
    } catch (error) {
      toast({
        title: t("audio_player.like_error_title"),
        description: error.message || t("audio_player.like_error"),
        variant: "destructive",
      })

      return null
    } finally {
      setIsPending(false)
    }
  }, [currentUser, isPending, toast])

  return {
    isPending,
    toggleLike,
  }
}
