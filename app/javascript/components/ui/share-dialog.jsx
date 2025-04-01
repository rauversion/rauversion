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
import { Share2, Twitter, Facebook, Link, Copy, Mail, Linkedin, MessageCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const SHARE_BUTTONS = [
  {
    name: 'Twitter',
    icon: Twitter,
    shareUrl: (url, title, description) => {
      const text = encodeURIComponent(`${title}\n${description || ""}\n`)
      const shareUrl = encodeURIComponent(url)
      return `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`
    }
  },
  {
    name: 'Facebook',
    icon: Facebook,
    shareUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  {
    name: 'WhatsApp',
    icon: (props) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
        <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    ),
    shareUrl: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`
  },
  {
    name: 'LinkedIn',
    icon: Linkedin,
    shareUrl: (url, title) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
  },
  {
    name: 'Messenger',
    icon: MessageCircle,
    shareUrl: (url) => `fb-messenger://share/?link=${encodeURIComponent(url)}`
  },
  {
    name: 'Email',
    icon: Mail,
    shareUrl: (url, title, description) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`
  }
]

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

  const handleShare = async (shareButton) => {
    const shareUrl = shareButton.shareUrl(url, title, description)
    window.open(shareUrl, '_blank')
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        })
        toast({
          title: "Shared successfully",
          description: "Content was shared using your device's share feature",
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast({
            title: "Error",
            description: "Failed to share content",
            variant: "destructive",
          })
        }
      }
    }
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
      <DialogContent className="sm:max-w-md bg-black/90 text-white border-neutral-800">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Share this content on your favorite platform
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-6 w-full overflow-auto">
          <div className="flex justify-between px-2 overflow-auto">
            {SHARE_BUTTONS.slice(0, 6).map((button) => (
              <Button
                key={button.name}
                variant="ghost"
                className="flex flex-col items-center justify-center gap-2 h-20 w-16 hover:bg-white/5"
                onClick={() => handleShare(button)}
              >
                <button.icon className="h-5 w-5" />
                <span className="text-xs text-neutral-400">{button.name}</span>
              </Button>
            ))}
            {navigator.share && (
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center gap-2 h-20 w-16 hover:bg-white/5"
                onClick={handleNativeShare}
              >
                <Share2 className="h-5 w-5" />
                <span className="text-xs text-neutral-400">More</span>
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2 bg-neutral-900 rounded-lg p-2">
            <div className="grid flex-1">
              <div className="flex- items-center w-20- overflow-hidden">
                <span className="text-sm text-neutral-400 truncate">
                  {url}
                </span>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCopyLink}
              className="hover:bg-white/5"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
