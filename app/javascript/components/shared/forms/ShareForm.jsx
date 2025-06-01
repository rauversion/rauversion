import React, { useState } from "react"
import { Check, Copy, Facebook, Twitter, Link2, Code2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import I18n from 'stores/locales'

export default function ShareForm({ item }) {
  const [copiedStates, setCopiedStates] = useState({
    link: false,
    embed: false
  })

  const handleCopy = (type, text) => {
    navigator.clipboard.writeText(text)
    setCopiedStates(prev => ({
      ...prev,
      [type]: true
    }))
    setTimeout(() => {
      setCopiedStates(prev => ({
        ...prev,
        [type]: false
      }))
    }, 2000)
  }

  const handleSocialShare = (platform) => {
    const url = `${window.location.origin}/${item.user?.username}/${item.slug}`
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    }
    window.open(shareUrls[platform], '_blank')
  }

  const getEmbedCode = () => {
    return `<iframe width="100%" height="120" 
      src="${window.location.origin}/${item.type}s/${item.slug}/embed" 
      frameBorder="0" 
      allowfullscreen></iframe>`
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Share Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {I18n.t('shared.forms.share.link.title')}
          </CardTitle>
          <CardDescription>
            {I18n.t('shared.forms.share.link.description', { type: item.type })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              readOnly
              value={`${window.location.origin}/${item.user?.username}/${item.slug}`}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.preventDefault()
                handleCopy('link', `${window.location.origin}/${item.user?.username}/${item.slug}`)
              }}
              className="shrink-0"
            >
              {copiedStates.link ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Social Share Card */}
      <Card>
        <CardHeader>
          <CardTitle>{I18n.t('shared.forms.share.social.title')}</CardTitle>
          <CardDescription>
            {I18n.t('shared.forms.share.social.description', { type: item.type })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.preventDefault()
                handleSocialShare('twitter')
              }}
            >
              <Twitter className="mr-2 h-4 w-4" />
              {I18n.t('shared.forms.share.social.twitter')}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.preventDefault()
                handleSocialShare('facebook')
              }}
            >
              <Facebook className="mr-2 h-4 w-4" />
              {I18n.t('shared.forms.share.social.facebook')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Embed Code Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            {I18n.t('shared.forms.share.embed.title')}
          </CardTitle>
          <CardDescription>
            {I18n.t('shared.forms.share.embed.description', { type: item.type })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                readOnly
                value={getEmbedCode()}
                className="min-h-[100px] font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.preventDefault()
                  handleCopy('embed', getEmbedCode())
                }}
                className="absolute top-2 right-2"
              >
                {copiedStates.embed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="rounded-lg border bg-muted p-4">
              <div className="text-sm text-muted-foreground">
                {I18n.t('shared.forms.share.embed.preview')}
              </div>
              <div className="mt-2" dangerouslySetInnerHTML={{ __html: getEmbedCode() }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
