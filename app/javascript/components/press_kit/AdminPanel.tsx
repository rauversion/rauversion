import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AdminPanelProps {
  isOpen: boolean
  onClose: () => void
  data: PressKitData
  onSave: (data: PressKitData) => void
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
  }[]
}

export function AdminPanel({ isOpen, onClose, data, onSave }: AdminPanelProps) {
  const [formData, setFormData] = useState<PressKitData>(data)

  if (!isOpen) return null

  const handleSave = () => {
    onSave(formData)
    onClose()
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
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <div className="flex gap-3">
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <Tabs defaultValue="bio" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="bio"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Bio & Info
              </TabsTrigger>
              <TabsTrigger
                value="social"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Social Links
              </TabsTrigger>
              <TabsTrigger
                value="photos"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Press Photos
              </TabsTrigger>
              <TabsTrigger
                value="contacts"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Contact Info
              </TabsTrigger>
              <TabsTrigger
                value="tours"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Tour Dates
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="bio" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Artist Information</h3>

                  <div className="space-y-2">
                    <Label>Artist Name</Label>
                    <Input
                      value={formData.artistName}
                      onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                      placeholder="NEON PULSE"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tagline</Label>
                    <Input
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      placeholder="Electronic Music Producer / DJ"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Based in Berlin"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Monthly Listeners</Label>
                      <Input
                        value={formData.listeners}
                        onChange={(e) => setFormData({ ...formData, listeners: e.target.value })}
                        placeholder="100K+ Monthly Listeners"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Biography</h3>

                  <div className="space-y-2">
                    <Label>Intro Paragraph</Label>
                    <Textarea
                      value={formData.bio.intro}
                      onChange={(e) => setFormData({ ...formData, bio: { ...formData.bio, intro: e.target.value } })}
                      rows={3}
                      placeholder="First paragraph of your bio..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Career Highlights</Label>
                    <Textarea
                      value={formData.bio.career}
                      onChange={(e) => setFormData({ ...formData, bio: { ...formData.bio, career: e.target.value } })}
                      rows={3}
                      placeholder="Career achievements and milestones..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sound Description</Label>
                    <Textarea
                      value={formData.bio.sound}
                      onChange={(e) => setFormData({ ...formData, bio: { ...formData.bio, sound: e.target.value } })}
                      rows={3}
                      placeholder="Describe your sound and artistic vision..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Achievements</h3>
                    <Button onClick={() => addItem("achievements")} size="sm" variant="outline">
                      Add Achievement
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
                        placeholder="Achievement..."
                      />
                      <Button onClick={() => removeItem("achievements", index)} size="sm" variant="destructive">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Genres</h3>
                    <Button onClick={() => addItem("genres")} size="sm" variant="outline">
                      Add Genre
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
                        placeholder="Genre..."
                      />
                      <Button onClick={() => removeItem("genres", index)} size="sm" variant="destructive">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Social & Streaming Platforms</h3>
                    <Button onClick={() => addItem("socialLinks")} size="sm" variant="outline">
                      Add Platform
                    </Button>
                  </div>

                  {formData.socialLinks.map((link, index) => (
                    <div key={index} className="space-y-3 p-4 border border-border rounded-lg">
                      <div className="space-y-2">
                        <Label>Platform Name</Label>
                        <Input
                          value={link.name}
                          onChange={(e) => {
                            const newLinks = [...formData.socialLinks]
                            newLinks[index].name = e.target.value
                            setFormData({ ...formData, socialLinks: newLinks })
                          }}
                          placeholder="Instagram, Spotify, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Handle/Username</Label>
                        <Input
                          value={link.handle}
                          onChange={(e) => {
                            const newLinks = [...formData.socialLinks]
                            newLinks[index].handle = e.target.value
                            setFormData({ ...formData, socialLinks: newLinks })
                          }}
                          placeholder="@username or artist name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          value={link.url}
                          onChange={(e) => {
                            const newLinks = [...formData.socialLinks]
                            newLinks[index].url = e.target.value
                            setFormData({ ...formData, socialLinks: newLinks })
                          }}
                          placeholder="https://..."
                        />
                      </div>

                      <Button
                        onClick={() => removeItem("socialLinks", index)}
                        size="sm"
                        variant="destructive"
                        className="w-full"
                      >
                        Remove Platform
                      </Button>
                    </div>
                  ))}

                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Suggested platforms:</strong> Instagram, SoundCloud, Spotify, Apple Music, Beatport,
                      YouTube, Resident Advisor, Facebook, Twitter/X, TikTok, Mixcloud, Bandcamp
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="photos" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Press Photos</h3>
                    <Button onClick={() => addItem("pressPhotos")} size="sm" variant="outline">
                      Add Photo
                    </Button>
                  </div>

                  {formData.pressPhotos.map((photo, index) => (
                    <div key={index} className="space-y-3 p-4 border border-border rounded-lg">
                      <div className="space-y-2">
                        <Label>Photo Title</Label>
                        <Input
                          value={photo.title}
                          onChange={(e) => {
                            const newPhotos = [...formData.pressPhotos]
                            newPhotos[index].title = e.target.value
                            setFormData({ ...formData, pressPhotos: newPhotos })
                          }}
                          placeholder="Live at Berghain, Studio Session, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Resolution</Label>
                        <Input
                          value={photo.resolution}
                          onChange={(e) => {
                            const newPhotos = [...formData.pressPhotos]
                            newPhotos[index].resolution = e.target.value
                            setFormData({ ...formData, pressPhotos: newPhotos })
                          }}
                          placeholder="4000x6000, 6000x4000, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input
                          value={photo.image}
                          onChange={(e) => {
                            const newPhotos = [...formData.pressPhotos]
                            newPhotos[index].image = e.target.value
                            setFormData({ ...formData, pressPhotos: newPhotos })
                          }}
                          placeholder="/path/to/image.jpg or https://..."
                        />
                      </div>

                      <Button
                        onClick={() => removeItem("pressPhotos", index)}
                        size="sm"
                        variant="destructive"
                        className="w-full"
                      >
                        Remove Photo
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="contacts" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                    <Button onClick={() => addItem("contacts")} size="sm" variant="outline">
                      Add Contact
                    </Button>
                  </div>

                  {formData.contacts.map((contact, index) => (
                    <div key={index} className="space-y-3 p-4 border border-border rounded-lg">
                      <div className="space-y-2">
                        <Label>Contact Type</Label>
                        <Input
                          value={contact.type}
                          onChange={(e) => {
                            const newContacts = [...formData.contacts]
                            newContacts[index].type = e.target.value
                            setFormData({ ...formData, contacts: newContacts })
                          }}
                          placeholder="Bookings, Press Inquiries, Management, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          value={contact.email}
                          onChange={(e) => {
                            const newContacts = [...formData.contacts]
                            newContacts[index].email = e.target.value
                            setFormData({ ...formData, contacts: newContacts })
                          }}
                          placeholder="contact@example.com"
                          type="email"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Agent Name (Optional)</Label>
                        <Input
                          value={contact.agent || ""}
                          onChange={(e) => {
                            const newContacts = [...formData.contacts]
                            newContacts[index].agent = e.target.value
                            setFormData({ ...formData, contacts: newContacts })
                          }}
                          placeholder="Agent or manager name"
                        />
                      </div>

                      <Button
                        onClick={() => removeItem("contacts", index)}
                        size="sm"
                        variant="destructive"
                        className="w-full"
                      >
                        Remove Contact
                      </Button>
                    </div>
                  ))}

                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Suggested contact types:</strong> Bookings, Press Inquiries, Management & General, Label
                      Contact, Collaborations, Technical Rider
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tours" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Tour Dates</h3>
                    <Button onClick={() => addItem("tourDates")} size="sm" variant="outline">
                      Add Date
                    </Button>
                  </div>

                  {formData.tourDates.map((tour, index) => (
                    <div key={index} className="space-y-3 p-4 border border-border rounded-lg">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          value={tour.date}
                          onChange={(e) => {
                            const newTours = [...formData.tourDates]
                            newTours[index].date = e.target.value
                            setFormData({ ...formData, tourDates: newTours })
                          }}
                          placeholder="Feb 15, 2025"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Venue</Label>
                        <Input
                          value={tour.venue}
                          onChange={(e) => {
                            const newTours = [...formData.tourDates]
                            newTours[index].venue = e.target.value
                            setFormData({ ...formData, tourDates: newTours })
                          }}
                          placeholder="Berghain, Fabric, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={tour.city}
                          onChange={(e) => {
                            const newTours = [...formData.tourDates]
                            newTours[index].city = e.target.value
                            setFormData({ ...formData, tourDates: newTours })
                          }}
                          placeholder="Berlin, London, etc."
                        />
                      </div>

                      <Button
                        onClick={() => removeItem("tourDates", index)}
                        size="sm"
                        variant="destructive"
                        className="w-full"
                      >
                        Remove Date
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
