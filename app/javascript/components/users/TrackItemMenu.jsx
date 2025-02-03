import React, { useState } from 'react'
import { Share2, Heart, MoreHorizontal, Lock, Pencil, Trash2 } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import { post, destroy } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import TrackEdit from '../tracks/TrackEdit'
import { Link } from "react-router-dom"

export default function TrackItemMenu({ track }) {
  const { isAuthenticated, currentUser } = useAuthStore()
  const [likes, setLikes] = useState(track.likes_count || 0)
  const [isLiked, setIsLiked] = useState(track.like_id != null)
  const { toast } = useToast()
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like tracks",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await post(`/tracks/${track.slug}/likes`, {
        responseKind: "json"
      })
      
      if (response.ok) {
        const { liked, resource } = await response.json
        setLikes(resource.likes_count)
        setIsLiked(liked)
        toast({
          title: "Success",
          description: !liked ? "Unliked track!" : "Track liked!"
        })
      } else {
        const error = await response.json
        toast({
          title: "Error",
          description: error.message || "Error liking track",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.log(error)
      toast({
        title: "Error",
        description: "Error liking track",
        variant: "destructive"
      })
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: track.title,
        text: `Check out ${track.title} by ${track.user.username}`,
        url: window.location.href
      })
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Link copied to clipboard!"
      })
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this track?')) {
      try {
        const response = await destroy(`/tracks/${track.id}`, {
          responseKind: "json"
        })
        
        if (response.ok) {
          toast({
            title: "Success",
            description: "Track deleted successfully"
          })
          // You might want to trigger a refresh or navigation here
        } else {
          const error = await response.json
          toast({
            title: "Error",
            description: error.message || "Error deleting track",
            variant: "destructive"
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Error deleting track",
          variant: "destructive"
        })
      }
    }
  }

  const isOwner = currentUser && currentUser.id === track.user.id

  console.log("isOwner", isOwner)
  return (
    <>
      <div className="flex items-center gap-3">
        <button 
          onClick={handleLike}
          className={`p-2 hover:text-white flex items-center gap-1 ${
            isLiked ? 'text-brand-500' : 'text-gray-400'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm">{likes}</span>
        </button>

        <button 
          onClick={handleShare}
          className="p-2 text-gray-400 hover:text-white"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {track.private && (
          <div className="bg-brand-500 text-white text-xs p-1 rounded-md inline-flex space-x-1 items-center">
            <Lock className="w-4 h-4" />
            <span>Private</span>
          </div>
        )}

        {isAuthenticated && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-gray-400 hover:text-white">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner && (
                <>
                  <DropdownMenuItem onClick={() => setEditDialogOpen(true)} className="flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    <span>Edit this track</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="flex items-center gap-2 text-destructive">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete this track</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={handleShare} className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <TrackEdit 
        track={track} 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
      />
    </>
  )
}
