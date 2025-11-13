import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUploader } from "@/components/ui/image-uploader"
import { useToast } from "@/hooks/use-toast"
import MusicSelector from "./MusicSelector"
import { useParams } from "react-router-dom"
import { get } from "@rails/request.js"
import { useLocaleStore } from "stores/locales"

interface AdminPanelProps {
  isOpen: boolean
  onClose: () => void
  data: PressKitData
  photos?: { id: number | string; url: string; description?: string; tags?: any }[]
  // onSave receives the full press kit data (including published flag inside)
  onSave: (data: PressKitData) => Promise<any>
}

export interface PressKitData {
  artistName: string
  tagline: string
  location: string
  listeners: string
  bio: {
    intro: string
    career: string
    sound: string
  }
  achievements: string[]
  genres: string[]
  socialLinks: {
    name: string
    handle: string
    url: string
  }[]
  contacts: {
    type: string
    email: string
    agent?: string
  }[]
  tourDates: {
    date: string
    venue: string
    city: string
  }[]
  pressPhotos: {
    title: string
    resolution: string
    image: string
    signed_id?: string
    cropData?: any
    imageCropped?: string
  }[]
  selectedTracks?: { id: number | string; title: string; cover_url?: any }[]
  selectedPlaylists?: { id: number | string; title: string; slug?: string; cover_url?: any }[]
  playlist_ids?: (number | string)[]
  track_ids?: (number | string)[]
  externalMusicLinks?: {
    platform: string
    url: string
    title: string
  }[]
}

export function AdminPanel({ isOpen, onClose, data, photos = [], onSave }: AdminPanelProps) {
  const [formData, setFormData] = useState<PressKitData>(data)
  const [published, setPublished] = useState<boolean>(!!(data && (data as any).published))
  const [saving, setSaving] = useState(false)
  const [prefillTick, setPrefillTick] = useState(0)
  const { toast } = useToast()
  const { username } = useParams()
  const { i18n } = useLocaleStore

  // Sync local state when opening panel or when data prop changes
  React.useEffect(() => {
    setFormData((prev) => {
      // Merge incoming data but preserve already resolved selections unless backend explicitly provides them
      const next: any = { ...prev, ...data }
      if (!Array.isArray((data as any).selectedPlaylists) && prev.selectedPlaylists) {
        next.selectedPlaylists = prev.selectedPlaylists
      }
      if (!Array.isArray((data as any).selectedTracks) && prev.selectedTracks) {
        next.selectedTracks = prev.selectedTracks
      }
      return next
    })
    setPublished(!!(data && (data as any).published))
  }, [isOpen, data])

  // Prefill selector UI from stored playlist_ids (only for UI; persisted as IDs)
  React.useEffect(() => {
    // If backend already includes selectedPlaylists objects, seed UI directly
    /*const pre = (data as any).selectedPlaylists
    if (Array.isArray(pre) && pre.length > 0 && (formData.selectedPlaylists || []).length === 0) {
      setFormData((prev) => ({ ...prev, selectedPlaylists: pre }))
      return
    }*/

    const fillPlaylistsFromIds = async () => {
      try {
        const ids = ((formData.playlist_ids as any) || (data as any).playlist_ids || []) as (number | string)[]
        if (!ids.length) return
        // Avoid refetch if already populated
        if ((formData.selectedPlaylists || []).length > 0) return

        const response = await get(`/playlists/albums.json`, { query: { ids: ids.join(",") } })
        if ((response as any).ok) {
          const json = await (response as any).json
          const collection = json.collection || json.playlists || json.albums || []
          const mapped = collection.map((pl: any) => ({
            id: pl.id,
            title: pl.title,
            slug: pl.slug,
            cover_url: pl.cover_url,
          }))
          setFormData((prev) => ({ ...prev, selectedPlaylists: mapped }))
          setPrefillTick((x) => x + 1)
        }
      } catch (err) {
        console.error("AdminPanel: prefill selectedPlaylists by ids failed", err)
      }
    }
    fillPlaylistsFromIds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, formData.playlist_ids, (data as any).playlist_ids, (data as any).selectedPlaylists])

  // Prefill selector UI from stored track_ids (only for UI; persisted as IDs)
  React.useEffect(() => {
    // If backend already includes selectedTracks objects, seed UI directly
    /*const pre = (data as any).selectedTracks
    if (Array.isArray(pre) && pre.length > 0 && (formData.selectedTracks || []).length === 0) {
      setFormData((prev) => ({ ...prev, selectedTracks: pre }))
      return
    }*/

    const fillTracksFromIds = async () => {
      try {
      
        const ids = ((formData.track_ids as any) || (data as any).track_ids || []) as (number | string)[]
        if (!ids.length) return
        // Avoid refetch if already populated
        if ((formData.selectedTracks || []).length > 0) return

        const response = await get(`/tracks/by_id.json`, { query: { ids: ids.join(",") } })
        if ((response as any).ok) {
          const json = await (response as any).json
          const collection = json.collection || json.tracks || []
          const mapped = collection.map((t: any) => ({
            id: t.id,
            title: t.title,
            cover_url: t.cover_url,
          }))
          setFormData((prev) => ({ ...prev, selectedTracks: mapped }))
          setPrefillTick((x) => x + 1)
        }
      } catch (err) {
        console.error("AdminPanel: prefill selectedTracks by ids failed", err)
      }
    }
    fillTracksFromIds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, formData.track_ids, (data as any).track_ids, (data as any).selectedTracks])

  if (!isOpen) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      // Transform selections to IDs before saving
      const playlist_ids = (formData.selectedPlaylists || []).map((p) => p.id)
      const track_ids = (formData.selectedTracks || []).map((t) => t.id)

      // Keep UI selections locally but persist only IDs in data
      const dataWithPublished = { ...formData, playlist_ids, track_ids, published }
      const { selectedPlaylists, selectedTracks, ...payload } = dataWithPublished as any

      // Await onSave so we can show toast on completion
      await onSave(payload as PressKitData)
      toast({
        title: i18n.t("press_kit.saved"),
        description: i18n.t("press_kit.updated_successfully")
      })
      // Do NOT close the dialog — keep it open for further edits
    } catch (e: any) {
      console.error("Error saving press kit from AdminPanel:", e)
      toast({
        title: i18n.t("press_kit.error"),
        description: e?.message || i18n.t("press_kit.failed_to_save"),
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const addItem = (field: keyof PressKitData) => {
    if (field === "achievements" || field === "genres") {
      setFormData({
        ...formData,
        [field]: [...(formData[field] as string[]), ""],
      })
    } else if (field === "socialLinks") {
      setFormData({
        ...formData,
        socialLinks: [...formData.socialLinks, { name: "", handle: "", url: "" }],
      })
    } else if (field === "contacts") {
      setFormData({
        ...formData,
        contacts: [...formData.contacts, { type: "", email: "", agent: "" }],
      })
    } else if (field === "tourDates") {
      setFormData({
        ...formData,
        tourDates: [...formData.tourDates, { date: "", venue: "", city: "" }],
      })
    } else if (field === "pressPhotos") {
      setFormData({
        ...formData,
        pressPhotos: [...formData.pressPhotos, { title: "", resolution: "", image: "" }],
      })
    } else if (field === "externalMusicLinks") {
      setFormData({
        ...formData,
        externalMusicLinks: [...(formData.externalMusicLinks || []), { platform: "spotify", url: "", title: "" }],
      })
    }
  }

  const removeItem = (field: keyof PressKitData, index: number) => {
    if (field === "achievements" || field === "genres") {
      setFormData({
        ...formData,
        [field]: (formData[field] as string[]).filter((_, i) => i !== index),
      })
    } else if (field === "socialLinks") {
      setFormData({
        ...formData,
        socialLinks: formData.socialLinks.filter((_, i) => i !== index),
      })
    } else if (field === "contacts") {
      setFormData({
        ...formData,
        contacts: formData.contacts.filter((_, i) => i !== index),
      })
    } else if (field === "tourDates") {
      setFormData({
        ...formData,
        tourDates: formData.tourDates.filter((_, i) => i !== index),
      })
    } else if (field === "pressPhotos") {
      setFormData({
        ...formData,
        pressPhotos: formData.pressPhotos.filter((_, i) => i !== index),
      })
    } else if (field === "externalMusicLinks") {
      setFormData({
        ...formData,
        externalMusicLinks: (formData.externalMusicLinks || []).filter((_, i) => i !== index),
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">{i18n.t("press_kit.admin_panel")}</h2>

          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 mr-4">
                <Label className="text-sm">{i18n.t("press_kit.published")}</Label>
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4"
                  aria-label={i18n.t("press_kit.published")}
                />
              </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90" disabled={saving}>
                {saving ? i18n.t("press_kit.saving") : i18n.t("press_kit.save_changes")}
              </Button>
              <Button onClick={onClose} variant="outline">
                {i18n.t("press_kit.cancel")}
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <Tabs defaultValue="bio" className="w-full h-[calc(100vh-355px)]">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="bio"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                {i18n.t("press_kit.sections.bio_info")}
              </TabsTrigger>
              <TabsTrigger
                value="music"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                {i18n.t("press_kit.sections.music")}
              </TabsTrigger>
              <TabsTrigger
                value="social"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                {i18n.t("press_kit.sections.social")}
              </TabsTrigger>
              <TabsTrigger
                value="photos"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                {i18n.t("press_kit.sections.photos")}
              </TabsTrigger>
              <TabsTrigger
                value="contacts"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                {i18n.t("press_kit.sections.contacts")}
              </TabsTrigger>
              <TabsTrigger
                value="tours"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                {i18n.t("press_kit.sections.tours")}
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="bio" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{i18n.t("press_kit.artist_info.title")}</h3>

                  <div className="space-y-2">
                    <Label>{i18n.t("press_kit.artist_info.artist_name")}</Label>
                    <Input
                      value={formData.artistName}
                      onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                      placeholder="NEON PULSE"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{i18n.t("press_kit.artist_info.tagline")}</Label>
                    <Input
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      placeholder="Electronic Music Producer / DJ"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{i18n.t("press_kit.artist_info.location")}</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Based in Berlin"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{i18n.t("press_kit.artist_info.listeners")}</Label>
                      <Input
                        value={formData.listeners}
                        onChange={(e) => setFormData({ ...formData, listeners: e.target.value })}
                        placeholder="100K+ Monthly Listeners"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{i18n.t("press_kit.biography.title")}</h3>

                  <div className="space-y-2">
                    <Label>{i18n.t("press_kit.biography.intro")}</Label>
                    <Textarea
                      value={formData.bio.intro}
                      onChange={(e) => setFormData({ ...formData, bio: { ...formData.bio, intro: e.target.value } })}
                      rows={3}
                      placeholder={i18n.t("press_kit.biography.intro_placeholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{i18n.t("press_kit.biography.career")}</Label>
                    <Textarea
                      value={formData.bio.career}
                      onChange={(e) => setFormData({ ...formData, bio: { ...formData.bio, career: e.target.value } })}
                      rows={3}
                      placeholder={i18n.t("press_kit.biography.career_placeholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{i18n.t("press_kit.biography.sound")}</Label>
                    <Textarea
                      value={formData.bio.sound}
                      onChange={(e) => setFormData({ ...formData, bio: { ...formData.bio, sound: e.target.value } })}
                      rows={3}
                      placeholder={i18n.t("press_kit.biography.sound_placeholder")}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{i18n.t("press_kit.achievements.title")}</h3>
                    <Button onClick={() => addItem("achievements")} size="sm" variant="outline">
                      {i18n.t("press_kit.achievements.add")}
                    </Button>
                  </div>

                  {formData.achievements.map((achievement, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={achievement}
                        onChange={(e) => {
                          const newAchievements = [...formData.achievements]
                          newAchievements[index] = e.target.value
                          setFormData({ ...formData, achievements: newAchievements })
                        }}
                        placeholder={i18n.t("press_kit.achievements.placeholder")}
                      />
                      <Button onClick={() => removeItem("achievements", index)} size="sm" variant="destructive">
                        {i18n.t("press_kit.common.remove")}
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{i18n.t("press_kit.genres.title")}</h3>
                    <Button onClick={() => addItem("genres")} size="sm" variant="outline">
                      {i18n.t("press_kit.genres.add")}
                    </Button>
                  </div>

                  {formData.genres.map((genre, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={genre}
                        onChange={(e) => {
                          const newGenres = [...formData.genres]
                          newGenres[index] = e.target.value
                          setFormData({ ...formData, genres: newGenres })
                        }}
                        placeholder={i18n.t("press_kit.genres.placeholder")}
                      />
                      <Button onClick={() => removeItem("genres", index)} size="sm" variant="destructive">
                        {i18n.t("press_kit.common.remove")}
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="music" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="mb-4">
                    <MusicSelector
                      key={`music-selector-${prefillTick}`}
                      username={username || ""}
                      selectedTracks={formData.selectedTracks || []}
                      setSelectedTracks={(t) => setFormData((prev) => ({ ...prev, selectedTracks: t }))}
                      selectedPlaylists={formData.selectedPlaylists || []}
                      setSelectedPlaylists={(p) => setFormData((prev) => ({ ...prev, selectedPlaylists: p }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{i18n.t("press_kit.music.external_links_title")}</h3>
                    <Button onClick={() => addItem("externalMusicLinks")} size="sm" variant="outline">
                      {i18n.t("press_kit.music.add_link")}
                    </Button>
                  </div>

                  <div className="p-4 bg-secondary/50 rounded-lg mb-4">
                    <p className="text-sm text-muted-foreground">
                      {i18n.t("press_kit.music.description")} {i18n.t("press_kit.music.rauversion_note")}
                    </p>
                  </div>

                  {(formData.externalMusicLinks || []).map((link, index) => (
                    <div key={index} className="space-y-3 p-4 border border-border rounded-lg">
                      <div className="space-y-2">
                        <Label>{i18n.t("press_kit.music.platform")}</Label>
                        <select
                          value={link.platform}
                          onChange={(e) => {
                            const newLinks = [...(formData.externalMusicLinks || [])]
                            newLinks[index].platform = e.target.value
                            setFormData({ ...formData, externalMusicLinks: newLinks })
                          }}
                          className="w-full"
                        >
                          <option value="spotify">{i18n.t("press_kit.music.platforms.spotify")}</option>
                          <option value="bandcamp">{i18n.t("press_kit.music.platforms.bandcamp")}</option>
                          <option value="soundcloud">{i18n.t("press_kit.music.platforms.soundcloud")}</option>
                          <option value="apple_music">{i18n.t("press_kit.music.platforms.apple_music")}</option>
                          <option value="youtube">{i18n.t("press_kit.music.platforms.youtube")}</option>
                          <option value="other">{i18n.t("press_kit.music.platforms.other")}</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>{i18n.t("press_kit.music.album_title")}</Label>
                        <Input
                          value={link.title}
                          onChange={(e) => {
                            const newLinks = [...(formData.externalMusicLinks || [])]
                            newLinks[index].title = e.target.value
                            setFormData({ ...formData, externalMusicLinks: newLinks })
                          }}
                          placeholder={i18n.t("press_kit.music.album_placeholder")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{i18n.t("press_kit.music.url")}</Label>
                        <Input
                          value={link.url}
                          onChange={(e) => {
                            const newLinks = [...(formData.externalMusicLinks || [])]
                            newLinks[index].url = e.target.value
                            setFormData({ ...formData, externalMusicLinks: newLinks })
                          }}
                          placeholder={i18n.t("press_kit.music.url_placeholder")}
                        />
                      </div>

                      <Button
                        onClick={() => removeItem("externalMusicLinks", index)}
                        size="sm"
                        variant="destructive"
                        className="w-full"
                      >
                        {i18n.t("press_kit.music.remove_link")}
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{i18n.t("press_kit.social_links.title")}</h3>
                    <Button onClick={() => addItem("socialLinks")} size="sm" variant="outline">
                      {i18n.t("press_kit.social_links.add")}
                    </Button>
                  </div>

                  {formData.socialLinks.map((link, index) => (
                    <div key={index} className="space-y-3 p-4 border border-border rounded-lg">
                      <div className="space-y-2">
                        <Label>{i18n.t("press_kit.social_links.platform_name")}</Label>
                        <Input
                          value={link.name}
                          onChange={(e) => {
                            const newLinks = [...formData.socialLinks]
                            newLinks[index].name = e.target.value
                            setFormData({ ...formData, socialLinks: newLinks })
                          }}
                          placeholder={i18n.t("press_kit.social_links.platform_placeholder")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{i18n.t("press_kit.social_links.handle")}</Label>
                        <Input
                          value={link.handle}
                          onChange={(e) => {
                            const newLinks = [...formData.socialLinks]
                            newLinks[index].handle = e.target.value
                            setFormData({ ...formData, socialLinks: newLinks })
                          }}
                          placeholder={i18n.t("press_kit.social_links.handle_placeholder")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{i18n.t("press_kit.social_links.url")}</Label>
                        <Input
                          value={link.url}
                          onChange={(e) => {
                            const newLinks = [...formData.socialLinks]
                            newLinks[index].url = e.target.value
                            setFormData({ ...formData, socialLinks: newLinks })
                          }}
                          placeholder={i18n.t("press_kit.social_links.url_placeholder")}
                        />
                      </div>

                      <Button
                        onClick={() => removeItem("socialLinks", index)}
                        size="sm"
                        variant="destructive"
                        className="w-full"
                      >
                        {i18n.t("press_kit.social_links.remove")}
                      </Button>
                    </div>
                  ))}

                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {i18n.t("press_kit.social_links.suggested_platforms")}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="photos" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{i18n.t("press_kit.press_photos.title")}</h3>
                  </div>

                  {/* Existing photos from server (ActiveStorage) */}
                  {photos.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">{i18n.t("press_kit.press_photos.current_photos")}</Label>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {photos.map((p) => (
                          <div key={p.id} className="relative border border-border rounded-lg overflow-hidden">
                            <div className="aspect-[4/3] bg-secondary">
                              <img
                                src={p.url}
                                alt={p.description || i18n.t("press_kit.press_photos.press_photo_alt")}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {p.description && (
                              <div className="p-2 text-xs text-muted-foreground border-t border-border">
                                {p.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm">{i18n.t("press_kit.press_photos.upload_new")}</Label>
                    <ImageUploader
                      preview={true}
                      enableCropper={true}
                      imageUrl={null}
                      onUploadComplete={async (signed_id: any, cropData: any) => {
                        try {
                          await onSave({ ...formData, pressPhotos: [{ signed_id, cropData }] } as any)
                          toast({ title: i18n.t("press_kit.press_photos.photo_added"), description: i18n.t("press_kit.press_photos.image_uploaded") })
                        } catch (e: any) {
                          console.error("Photo upload save error:", e)
                          toast({ title: i18n.t("press_kit.error"), description: e?.message || i18n.t("press_kit.press_photos.failed_to_attach"), variant: "destructive" })
                        }
                      }}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contacts" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{i18n.t("press_kit.contacts.title")}</h3>
                    <Button onClick={() => addItem("contacts")} size="sm" variant="outline">
                      {i18n.t("press_kit.contacts.add")}
                    </Button>
                  </div>

                  {formData.contacts.map((contact, index) => (
                    <div key={index} className="space-y-3 p-4 border border-border rounded-lg">
                      <div className="space-y-2">
                        <Label>{i18n.t("press_kit.contacts.contact_type")}</Label>
                        <Input
                          value={contact.type}
                          onChange={(e) => {
                            const newContacts = [...formData.contacts]
                            newContacts[index].type = e.target.value
                            setFormData({ ...formData, contacts: newContacts })
                          }}
                          placeholder={i18n.t("press_kit.contacts.type_placeholder")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{i18n.t("press_kit.contacts.email")}</Label>
                        <Input
                          value={contact.email}
                          onChange={(e) => {
                            const newContacts = [...formData.contacts]
                            newContacts[index].email = e.target.value
                            setFormData({ ...formData, contacts: newContacts })
                          }}
                          placeholder={i18n.t("press_kit.contacts.email_placeholder")}
                          type="email"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{i18n.t("press_kit.contacts.agent")}</Label>
                        <Input
                          value={contact.agent || ""}
                          onChange={(e) => {
                            const newContacts = [...formData.contacts]
                            newContacts[index].agent = e.target.value
                            setFormData({ ...formData, contacts: newContacts })
                          }}
                          placeholder={i18n.t("press_kit.contacts.agent_placeholder")}
                        />
                      </div>

                      <Button
                        onClick={() => removeItem("contacts", index)}
                        size="sm"
                        variant="destructive"
                        className="w-full"
                      >
                        {i18n.t("press_kit.contacts.remove")}
                      </Button>
                    </div>
                  ))}

                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {i18n.t("press_kit.contacts.suggested_types")}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tours" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{i18n.t("press_kit.tour_dates.title")}</h3>
                    <Button onClick={() => addItem("tourDates")} size="sm" variant="outline">
                      {i18n.t("press_kit.tour_dates.add")}
                    </Button>
                  </div>

                  {formData.tourDates.map((tour, index) => (
                    <div key={index} className="space-y-3 p-4 border border-border rounded-lg">
                      <div className="space-y-2">
                        <Label>{i18n.t("press_kit.tour_dates.date")}</Label>
                        <Input
                          value={tour.date}
                          onChange={(e) => {
                            const newTours = [...formData.tourDates]
                            newTours[index].date = e.target.value
                            setFormData({ ...formData, tourDates: newTours })
                          }}
                          placeholder={i18n.t("press_kit.tour_dates.date_placeholder")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{i18n.t("press_kit.tour_dates.venue")}</Label>
                        <Input
                          value={tour.venue}
                          onChange={(e) => {
                            const newTours = [...formData.tourDates]
                            newTours[index].venue = e.target.value
                            setFormData({ ...formData, tourDates: newTours })
                          }}
                          placeholder={i18n.t("press_kit.tour_dates.venue_placeholder")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{i18n.t("press_kit.tour_dates.city")}</Label>
                        <Input
                          value={tour.city}
                          onChange={(e) => {
                            const newTours = [...formData.tourDates]
                            newTours[index].city = e.target.value
                            setFormData({ ...formData, tourDates: newTours })
                          }}
                          placeholder={i18n.t("press_kit.tour_dates.city_placeholder")}
                        />
                      </div>

                      <Button
                        onClick={() => removeItem("tourDates", index)}
                        size="sm"
                        variant="destructive"
                        className="w-full"
                      >
                        {i18n.t("press_kit.tour_dates.remove")}
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
