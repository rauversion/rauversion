import React, { useState, useEffect } from "react"
import { get, post } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import useAuthStore from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Comments({ resourceType, resourceId }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const { toast } = useToast()
  const { isAuthenticated, currentUser } = useAuthStore()

  const fetchComments = async () => {
    setLoading(true)
    try {
      const response = await get(`/${resourceType}s/${resourceId}/comments.json?page=${page}`)
      if (response.ok) {
        const data = await response.json
        if (page === 1) {
          setComments(data.comments)
        } else {
          setComments(prev => [...prev, ...data.comments])
        }
        setMeta(data.meta)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const response = await post(`/${resourceType}s/${resourceId}/comments`, {
        body: JSON.stringify({
          comment: { body: newComment }
        }),
        responseKind: "json"
      })

      if (response.ok) {
        const data = await response.json
        setComments(prev => [data.comment, ...prev])
        setNewComment("")
        toast({
          title: "Success",
          description: "Comment posted successfully",
        })
      } else {
        throw new Error("Failed to post comment")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      })
    }
  }

  const loadMore = () => {
    if (meta && page < meta.total_pages) {
      setPage(prev => prev + 1)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [resourceType, resourceId, page])

  return (
    <div className="space-y-6">
      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[100px] bg-neutral-900 border-neutral-800"
          />
          <Button type="submit" disabled={!newComment.trim()}>
            Post Comment
          </Button>
        </form>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={comment.user.avatar_url} alt={comment.user.username} />
              <AvatarFallback>{comment.user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{comment.user.username}</span>
                <span className="text-sm text-neutral-400">
                  {format(new Date(comment.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <p className="text-neutral-200">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>

      {meta && page < meta.total_pages && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Loading..." : "Load More Comments"}
          </Button>
        </div>
      )}
    </div>
  )
}
