import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Share2, Twitter, Instagram, Facebook, Link, Copy } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function ShareDialog({ url, title, description, children }) {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: "Link copied",
        description: "The link has been copied to your clipboard",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`${title}\n${description || ""}\n`)
    const shareUrl = encodeURIComponent(url)
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`,
      "_blank"
    )
  }

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    )
  }

  const defaultTrigger = (
    <Button variant="ghost" size="icon">
      <Share2 className="h-4 w-4" />
    </Button>
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription>
            Share this content on your favorite social network
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={shareOnTwitter}
            >
              <Twitter className="mr-2 h-4 w-4" />
              Twitter
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={shareOnFacebook}
            >
              <Facebook className="mr-2 h-4 w-4" />
              Facebook
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-sm text-muted-foreground truncate">
                  {url}
                </span>
              </div>
            </div>
            <Button
              type="submit"
              size="icon"
              variant="outline"
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
