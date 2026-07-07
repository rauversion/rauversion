import React, { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AdminPanel, type PressKitData } from "./AdminPanel"
import TrackCell from "@/components/tracks/TrackCell"
import { get, patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import useAuthStore from "@/stores/authStore"
import { useParams } from "react-router-dom"
import { useLocaleStore } from "stores/locales"
import { ArrowUpRight, BadgeDollarSign, Clock, MapPin, Radio } from "lucide-react"
import BookingProposalModal from "@/components/products/service/BookingProposalModal"

interface PerformerServicePriceRule {
  id: number
  name: string
  rule_type: string
  formatted_amount: string
  duration_minutes?: number | null
  location_scope?: string | null
}

interface PerformerService {
  id: number
  title: string
  slug: string
  path: string
  short_description?: string
  category?: string
  booking_mode?: string
  delivery_method?: string
  duration_minutes?: number
  formatted_price?: string
  performance_format?: string
  home_city?: string
  home_country?: string
  price_notes?: string
  cover_url?: string | null
  user: {
    id: number
    username: string
    name: string
  }
  service_price_rules?: PerformerServicePriceRule[]
}

export default function PressKitPage() {
  const { username } = useParams()
  const { currentUser } = useAuthStore()
  const { toast } = useToast()
  const { i18n } = useLocaleStore
  const [isDark, setIsDark] = useState(true)
  const [activeSection, setActiveSection] = useState("")
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({})
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pressKitData, setPressKitData] = useState<PressKitData>({
    artistName: "",
    tagline: "",
    location: "",
    listeners: "",
    bio: {
      intro: "",
      career: "",
      sound: ""
    },
    achievements: [],
    genres: [],
    socialLinks: [],
    contacts: [],
    tourDates: [],
    pressPhotos: [],
    externalMusicLinks: [],
  })
  const [playlists, setPlaylists] = useState<any[]>([])
  const [tracks, setTracks] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [performerServices, setPerformerServices] = useState<PerformerService[]>([])
  const [animatedSections, setAnimatedSections] = useState<string[]>([])
  const [hasPressKit, setHasPressKit] = useState<boolean | null>(null)
  const S = (v: any) => (v ?? "").toString()
  const present = (v: any) => S(v).trim().length > 0

  const isOwner = currentUser && currentUser.username === username
  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionsRef.current[id] = el
  }
  const humanize = (value?: string | null) => S(value).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  const translated = (key: string, fallback: string) => {
    const value = i18n.t(key)
    return value === key ? fallback : value
  }
  const serviceCategoryLabel = (value?: string) => translated(`products.service.categories.${value}`, humanize(value))
  const bookingModeLabel = (value?: string) => translated(`products.service.booking_modes.${value}`, humanize(value))
  const deliveryMethodLabel = (value?: string) => translated(`products.service.delivery_methods.${value}`, humanize(value))
  const priceRuleTypeLabel = (value?: string) => translated(`products.service.price_rule_types.${value}`, humanize(value))
  const formatDuration = (minutes?: number) => {
    if (!minutes) return null

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours === 0) return i18n.t("products.service.show.duration_minutes", { count: minutes })
    if (remainingMinutes === 0) return i18n.t("products.service.show.duration_hours", { count: hours })
    return i18n.t("products.service.show.duration_hours_minutes", { hours, minutes: remainingMinutes })
  }
  const bio = pressKitData.bio || { intro: "", career: "", sound: "" }
  const achievements = (pressKitData.achievements || []).filter(present)
  const genres = (pressKitData.genres || []).filter(present)
  const externalMusicLinks = (pressKitData.externalMusicLinks || []).filter((link) => present(link.url))
  const contacts = (pressKitData.contacts || []).filter((contact) => present(contact.email))
  const socialLinks = (pressKitData.socialLinks || []).filter((social) => present(social.url))
  const tourDates = (pressKitData.tourDates || []).filter((tour) => present(tour.date) || present(tour.venue) || present(tour.city))
  const visiblePhotos = photos.filter((photo) => present(photo.url))
  const hasBioText = [bio.intro, bio.career, bio.sound].some(present)
  const hasBioSection = hasBioText || achievements.some(present) || genres.some(present)
  const hasMusicSection = playlists.length > 0 || tracks.length > 0 || externalMusicLinks.length > 0
  const hasBookingSection = performerServices.length > 0
  const hasPhotosSection = visiblePhotos.length > 0
  const hasContactSection = contacts.length > 0 || socialLinks.length > 0 || tourDates.length > 0
  const bookingTargetId = hasBookingSection ? "booking" : hasContactSection ? "contact" : "intro"
  const visibleSectionIds = [
    "intro",
    ...(hasBioSection ? ["bio"] : []),
    ...(hasMusicSection ? ["music"] : []),
    ...(hasBookingSection ? ["booking"] : []),
    ...(hasPhotosSection ? ["photos"] : []),
    ...(hasContactSection ? ["contact"] : []),
  ]

  useEffect(() => {
    loadPressKit()
  }, [username])

  const loadPressKit = async () => {
    try {
      const response = await get(`/${username}/press-kit.json`)
      
      if ((response as any).ok) {
        const data = await response.json
        if (data.press_kit && data.press_kit.data) {
          setPressKitData(data.press_kit.data)
          setHasPressKit(true)
        } else {
          setHasPressKit(false)
        }
        // Load photos from the queryable association
        if (data.press_kit && data.press_kit.photos) {
          setPhotos(data.press_kit.photos)
        }
        setPerformerServices(data.press_kit?.performer_services || [])
      } else {
        setHasPressKit(false)
        setPerformerServices([])
      }
    } catch (error) {
      console.error('Error loading press kit:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveData = async (newData: PressKitData) => {
    try {
      const response = await patch(`/${username}/press-kit.json`, {
        body: JSON.stringify({
          press_kit: {
            data: newData
          }
        })
      })

      if ((response as any).ok) {
        const data = await response.json
        // Update press kit data from the response (includes cleaned up photo URLs)
        if (data.press_kit && data.press_kit.data) {
          setPressKitData(data.press_kit.data)
        }
        // Update photos from the queryable association
        if (data.press_kit && data.press_kit.photos) {
          setPhotos(data.press_kit.photos)
        }
        toast({
          title: "Success",
          description: data.message || "Press kit updated successfully"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update press kit",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving press kit:', error)
      toast({
        title: "Error",
        description: "Failed to update press kit",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  // Fetch playlists/albums by IDs stored in pressKitData.playlist_ids
  useEffect(() => {
    const ids = (pressKitData as any).playlist_ids || []
    if (!Array.isArray(ids)) return
    if (ids.length === 0) {
      setPlaylists([])
      return
    }
    const fetchByIds = async () => {
      try {
        const response = await get(`/playlists/albums.json`, { query: { ids: ids.join(",") } })
        if ((response as any).ok) {
          const json = await (response as any).json
          const collection = json.collection || json.playlists || json.albums || []
          setPlaylists(collection)
        }
      } catch (e) {
        console.error("Error fetching playlists by ids for press kit:", e)
      }
    }
    fetchByIds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressKitData && (pressKitData as any).playlist_ids])

  // Fetch tracks by IDs stored in pressKitData.track_ids
  useEffect(() => {
    const ids = (pressKitData as any).track_ids || []
    if (!Array.isArray(ids)) return
    if (ids.length === 0) {
      setTracks([])
      return
    }
    const fetchByIds = async () => {
      try {
        const response = await get(`/tracks/by_id.json`, { query: { ids: ids.join(",") } })
        if ((response as any).ok) {
          const json = await (response as any).json
          const collection = json.collection || json.tracks || []
          setTracks(collection)
        }
      } catch (e) {
        console.error("Error fetching tracks by ids for press kit:", e)
      }
    }
    fetchByIds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressKitData && (pressKitData as any).track_ids])

  useEffect(() => {
    // Defer until content loaded so refs are attached
    if (loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            try {
              const el = entry.target as HTMLElement
              console.log(`PressKit: Section ${el.id} is in view`)
              // Record animated section in state so React preserves classes
              setAnimatedSections((prev) => (prev.includes(el.id) ? prev : [...prev, el.id]))
              setActiveSection(el.id)
            } catch (e) {
              console.error("PressKit observer error:", e)
            }
          }
        })
      },
      { threshold: 0.3, rootMargin: "0px 0px -20% 0px" },
    )

    // Prefer refs, fallback to querying DOM by known ids if refs not attached
    const sections = Object.values(sectionsRef.current).filter(Boolean) as HTMLElement[]
    if (sections.length > 0) {
      sections.forEach((section) => {
        console.log("PressKit: observing section ->", section.id)
        observer.observe(section)
      })
    } else {
      visibleSectionIds.forEach((id) => {
        const el = document.getElementById(id)
        if (el) {
          console.log("PressKit: fallback observing ->", id)
          observer.observe(el)
        }
      })
    }

    return () => {
      try {
        const observed = Object.values(sectionsRef.current).filter(Boolean) as HTMLElement[]
        observed.forEach((section) => {
          observer.unobserve(section)
        })
      } catch (e) {
        // ignore
      }
      observer.disconnect()
    }
  }, [loading, visibleSectionIds.join("|")])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  const generatePDFOld = async () => {
    setIsGeneratingPDF(true)
    toast({
      title: "PDF Generation",
      description: "This feature will be implemented soon"
    })
    setIsGeneratingPDF(false)
  }

  const generatePDF = async () => {
    setIsGeneratingPDF(true)
    console.log("[v0] Starting PDF generation...")
    try {
      const [html2canvas, jsPDF] = await Promise.all([import("html2canvas"), import("jspdf")])

      const canvas = html2canvas.default
      const { jsPDF: PDF } = jsPDF

      // Create PDF in A4 format
      const pdf = new PDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20

      // Helper to add a new page
      let isFirstPage = true
      const addNewPage = () => {
        if (!isFirstPage) {
          pdf.addPage()
        }
        isFirstPage = false
      }

      // Page 1: Cover Page
      pdf.setFillColor(10, 10, 10)
      pdf.rect(0, 0, pageWidth, pageHeight, "F")

      pdf.setTextColor(136, 136, 136)
      pdf.setFontSize(8)
      pdf.text("ELECTRONIC PRESS KIT", pageWidth / 2, 60, { align: "center" })

      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(48)
      pdf.setFont(undefined, "bold")
      const artistNameParts = pressKitData.artistName.split(" ")
      pdf.text(S(artistNameParts[0]), pageWidth / 2, 100, { align: "center" })

      pdf.setTextColor(168, 85, 247)
      pdf.text(S(artistNameParts.slice(1).join(" ")), pageWidth / 2, 120, { align: "center" })

      pdf.setTextColor(136, 136, 136)
      pdf.setFontSize(14)
      pdf.setFont(undefined, "normal")
      pdf.text(S(pressKitData.tagline), pageWidth / 2, 140, { align: "center" })

      pdf.setFontSize(11)
      pdf.text(S(`${pressKitData.location} • ${pressKitData.listeners}`), pageWidth / 2, 150, { align: "center" })

      pdf.setFontSize(8)
      pdf.text(`Press Kit v2.0 • ${new Date().getFullYear()}`, pageWidth / 2, pageHeight - 20, { align: "center" })

      // Page 2: Biography
      addNewPage()
      pdf.setFillColor(10, 10, 10)
      pdf.rect(0, 0, pageWidth, pageHeight, "F")

      let yPos = margin
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(32)
      pdf.setFont(undefined, "bold")
      pdf.text("Biography", margin, yPos)

      pdf.setDrawColor(168, 85, 247)
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPos + 3, pageWidth - margin, yPos + 3)

      yPos += 15
      pdf.setTextColor(204, 204, 204)
      pdf.setFontSize(11)
      pdf.setFont(undefined, "normal")

      const splitIntro = pdf.splitTextToSize(S(pressKitData.bio.intro), pageWidth - 2 * margin)
      pdf.text(splitIntro, margin, yPos)
      yPos += splitIntro.length * 6 + 5

      const splitCareer = pdf.splitTextToSize(S(pressKitData.bio.career), pageWidth - 2 * margin)
      pdf.text(splitCareer, margin, yPos)
      yPos += splitCareer.length * 6 + 5

      pdf.setTextColor(255, 255, 255)
      const splitSound = pdf.splitTextToSize(S(pressKitData.bio.sound), pageWidth - 2 * margin)
      pdf.text(splitSound, margin, yPos)
      yPos += splitSound.length * 6 + 10

      // Achievements
      pdf.setTextColor(136, 136, 136)
      pdf.setFontSize(9)
      pdf.text("ACHIEVEMENTS", margin, yPos)
      yPos += 7

      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(10)
      pressKitData.achievements.forEach((achievement) => {
        pdf.setTextColor(168, 85, 247)
        pdf.circle(margin + 2, yPos - 1.5, 0.8, "F")
        pdf.setTextColor(255, 255, 255)
        const splitAchievement = pdf.splitTextToSize(S(achievement), pageWidth - 2 * margin - 10)
        pdf.text(splitAchievement, margin + 6, yPos)
        yPos += splitAchievement.length * 5 + 2
      })

      yPos += 5
      pdf.setTextColor(136, 136, 136)
      pdf.setFontSize(9)
      pdf.text("GENRES", margin, yPos)
      yPos += 7

      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(10)
      pdf.text(S(pressKitData.genres.join(" • ")), margin, yPos)

      // Page 3: Press Photos
      addNewPage()
      pdf.setFillColor(10, 10, 10)
      pdf.rect(0, 0, pageWidth, pageHeight, "F")

      yPos = margin
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(32)
      pdf.setFont(undefined, "bold")
      pdf.text("Press Photos", margin, yPos)

      pdf.setDrawColor(168, 85, 247)
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPos + 3, pageWidth - margin, yPos + 3)

      yPos += 10
      pdf.setTextColor(136, 136, 136)
      pdf.setFontSize(11)
      pdf.setFont(undefined, "normal")
      pdf.text("High-resolution images available for download", margin, yPos)

      yPos += 15
      const photoWidth = (pageWidth - 3 * margin) / 2
      const photoHeight = photoWidth * 0.75

      for (let i = 0; i < Math.min(4, photos.length); i++) {
        const photo = photos[i]
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = margin + col * (photoWidth + margin)
        const y = yPos + row * (photoHeight + 15)

        try {
          const img = document.createElement("img")
          img.crossOrigin = "anonymous"
          img.src = photo.url
          await new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })

          const imgCanvas = await canvas(img, {
            backgroundColor: "#1a1a1a",
            scale: 1,
          })
          const imgData = imgCanvas.toDataURL("image/jpeg", 0.8)

          pdf.setDrawColor(51, 51, 51)
          pdf.setLineWidth(0.3)
          pdf.rect(x, y, photoWidth, photoHeight)
          pdf.addImage(imgData, "JPEG", x, y, photoWidth, photoHeight)

          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(9)
          pdf.setFont(undefined, "bold")
          pdf.text((photo.description || ""), x, y + photoHeight + 5)

          pdf.setTextColor(136, 136, 136)
          pdf.setFontSize(8)
          pdf.setFont(undefined, "normal")
          pdf.text("", x, y + photoHeight + 10)
        } catch (error) {
          console.log("[v0] Error loading photo:", error)
          pdf.setFillColor(26, 26, 26)
          pdf.rect(x, y, photoWidth, photoHeight, "F")
        }
      }

      // Page 4: Contact Information
      addNewPage()
      pdf.setFillColor(10, 10, 10)
      pdf.rect(0, 0, pageWidth, pageHeight, "F")

      yPos = margin
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(32)
      pdf.setFont(undefined, "bold")
      pdf.text("Contact", margin, yPos)

      pdf.setDrawColor(168, 85, 247)
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPos + 3, pageWidth - margin, yPos + 3)

      yPos += 15

      // Contact details
      pressKitData.contacts.forEach((contact) => {
        pdf.setTextColor(136, 136, 136)
        pdf.setFontSize(9)
        pdf.text(S(contact.type).toUpperCase(), margin, yPos)
        yPos += 6

        pdf.setTextColor(168, 85, 247)
        pdf.setFontSize(12)
        pdf.text(S(contact.email), margin, yPos)
        yPos += 5

        if (contact.agent) {
          pdf.setTextColor(136, 136, 136)
          pdf.setFontSize(9)
          pdf.text(S(`Agent: ${contact.agent}`), margin, yPos)
          yPos += 5
        }
        yPos += 8
      })

      yPos += 5
      pdf.setTextColor(136, 136, 136)
      pdf.setFontSize(9)
      pdf.text("SOCIAL & STREAMING PLATFORMS", margin, yPos)
      yPos += 8

      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(10)
      pressKitData.socialLinks.forEach((social) => {
        pdf.setFont(undefined, "bold")
        pdf.text(S(social.name), margin, yPos)
        pdf.setFont(undefined, "normal")
        pdf.setTextColor(136, 136, 136)
        pdf.text(S(social.handle), margin + 40, yPos)
        pdf.setTextColor(255, 255, 255)
        yPos += 6
      })

      yPos += 10
      pdf.setTextColor(136, 136, 136)
      pdf.setFontSize(9)
      pdf.text("UPCOMING TOUR DATES", margin, yPos)
      yPos += 8

      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(10)
      pressKitData.tourDates.forEach((tour) => {
        pdf.setFont(undefined, "bold")
        pdf.text(S(tour.venue), margin, yPos)
        pdf.setFont(undefined, "normal")
        pdf.setTextColor(136, 136, 136)
        pdf.text(S(tour.city), margin, yPos + 5)
        pdf.text(S(tour.date), pageWidth - margin, yPos, { align: "right" })
        pdf.setTextColor(255, 255, 255)

        pdf.setDrawColor(51, 51, 51)
        pdf.setLineWidth(0.1)
        pdf.line(margin, yPos + 8, pageWidth - margin, yPos + 8)
        yPos += 12
      })

      console.log("[v0] PDF generated successfully")
      pdf.save(`${pressKitData.artistName.replace(/\s+/g, "_")}_Press_Kit.pdf`)
    } catch (error) {
      console.error("[v0] Error generating PDF:", error)
      alert("Error generating PDF. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">{i18n.t("press_kit.loading")}</div>
        </div>
      </div>
    )
  }

  // Empty state when there is no press kit yet
  if (hasPressKit === false) {
    return (
      <div className="min-h-screen bg-background text-foreground relative">
        <main className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-16 py-24">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-secondary/40 to-background p-10 sm:p-12">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />

            <div className="relative space-y-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary/60 mx-auto">
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 8v4l3 3" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold">{i18n.t("press_kit.empty_state.title")}</h1>
              <p className="text-muted-foreground">
                {i18n.t("press_kit.empty_state.description")}
              </p>

              {isOwner && (
                <div className="pt-2">
                  <Button
                    onClick={() => setIsAdminOpen(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {i18n.t("press_kit.empty_state.create_button")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Admin launcher for owners */}
        {isOwner && (
          <AdminPanel
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            data={pressKitData}
            photos={photos}
            onSave={handleSaveData}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {isOwner && (
        <button
          onClick={() => setIsAdminOpen(true)}
          className="fixed top-6 right-6 z-40 p-3 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all duration-300 group"
          aria-label="Open admin panel"
        >
          <svg
            className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      )}

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        data={pressKitData}
        photos={photos}
        onSave={handleSaveData}
      />

      <nav className="fixed left-8 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
        <div className="flex flex-col gap-4">
          {visibleSectionIds.map((section) => (
            <button
              key={section}
              onClick={() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth" })}
              className={`w-2 h-8 rounded-full transition-all duration-500 ${
                activeSection === section ? "bg-primary" : "bg-muted-foreground/30 hover:bg-primary/60"
              }`}
              aria-label={`Navigate to ${section}`}
            />
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-16">
        <header
          id="intro"
          ref={setSectionRef("intro")}
          className={`min-h-screen flex items-center ${animatedSections.includes("intro") ? "animate-fade-in-up opacity-100" : "opacity-0"}`}
        >
          <div className="w-full">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="text-xs sm:text-sm text-muted-foreground font-mono tracking-widest uppercase">
                  {pressKitData.tagline}
                </div>
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-balance">
                  {pressKitData.artistName.split(" ")[0]}
                  <br />
                  <span className="text-primary">{pressKitData.artistName.split(" ").slice(1).join(" ")}</span>
                </h1>
              </div>

              <div className="max-w-2xl space-y-6">
                {present(bio.intro) && (
                  <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed">
                    {bio.intro}
                  </p>
                )}

                {(hasBookingSection || present(pressKitData.location) || present(pressKitData.listeners)) && (
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {hasBookingSection && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-muted-foreground">{i18n.t("press_kit.display.available_for_bookings")}</span>
                      </div>
                    )}
                    {present(pressKitData.location) && <div className="text-muted-foreground">{pressKitData.location}</div>}
                    {present(pressKitData.listeners) && <div className="text-muted-foreground">{pressKitData.listeners}</div>}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-4">
                  {(hasBookingSection || hasContactSection) && (
                    <Button
                      onClick={() => document.getElementById(bookingTargetId)?.scrollIntoView({ behavior: "smooth" })}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {i18n.t("press_kit.buttons.book_now")}
                    </Button>
                  )}
                  {hasMusicSection && (
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("music")?.scrollIntoView({ behavior: "smooth" })}
                    >
                      {i18n.t("press_kit.buttons.listen")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {hasBioSection && (
        <section id="bio" ref={setSectionRef("bio")} className={`min-h-screen py-20 sm:py-32 ${animatedSections.includes("bio") ? "animate-fade-in-up opacity-100" : "opacity-0"}`}>
          <div className="space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-4xl sm:text-5xl font-bold">{i18n.t("press_kit.navigation.bio")}</h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {hasBioText && (
                <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
                  {present(bio.intro) && <p>{bio.intro}</p>}
                  {present(bio.career) && <p>{bio.career}</p>}
                  {present(bio.sound) && <p className="text-foreground">{bio.sound}</p>}
                </div>
              )}

              <div className="space-y-8">
                {achievements.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm text-muted-foreground font-mono tracking-wider uppercase">{i18n.t("press_kit.achievements.title")}</h3>
                    <ul className="space-y-3">
                      {achievements.map((achievement, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                          <span className="text-foreground">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {genres.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm text-muted-foreground font-mono tracking-wider uppercase">{i18n.t("press_kit.genres.title")}</h3>
                    <div className="flex flex-wrap gap-2">
                      {genres.map((genre) => (
                        <span
                          key={genre}
                          className="px-4 py-2 text-sm bg-secondary/50 border border-border rounded-full hover:border-primary/50 transition-colors duration-300"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        )}

        {hasMusicSection && (
        <section
          id="music"
          ref={setSectionRef("music")}
          className={`min-h-screen py-20 sm:py-32 ${animatedSections.includes("music") ? "animate-fade-in-up opacity-100" : "opacity-0"}`}
        >
          <div className="space-y-12">
            <h2 className="text-4xl sm:text-5xl font-bold">{i18n.t("press_kit.navigation.music")}</h2>

            {playlists.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">{i18n.t("press_kit.music.playlists_albums")}</h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {playlists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      to={`/playlists/${playlist.slug || playlist.id}`}
                      className="group relative overflow-hidden rounded-lg border border-border hover:border-primary/50 transition-all duration-500"
                    >
                      <div className="aspect-square relative overflow-hidden bg-secondary">
                        {playlist.cover_url ? (
                          <img
                            src={playlist.cover_url}
                            alt={String(playlist.title || "Playlist")}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            {i18n.t("press_kit.music.no_cover")}
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <h4 className="text-lg font-semibold group-hover:text-primary transition-colors duration-300">
                          {playlist.title}
                        </h4>
                        {playlist.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{playlist.description}</p>
                        )}
                        {playlist.playlist_type && (
                          <span className="inline-block px-2 py-1 text-xs bg-secondary rounded">
                            {playlist.playlist_type}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {tracks.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">{i18n.t("press_kit.music.tracks")}</h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {tracks.map((track) => (
                    <TrackCell key={track.id} track={track} />
                  ))}
                </div>
              </div>
            )}

            {externalMusicLinks.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">{i18n.t("press_kit.music.available_on")}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {externalMusicLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-6 border border-border rounded-lg hover:border-primary/50 transition-all duration-300"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground uppercase tracking-wider">
                            {String(link.platform || "").replace('_', ' ')}
                          </span>
                          <svg
                            className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </div>
                        <div className="text-lg font-semibold group-hover:text-primary transition-colors">
                          {link.title}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
        )}

        {hasBookingSection && (
          <section
            id="booking"
            ref={setSectionRef("booking")}
            className={`min-h-screen py-20 sm:py-32 ${animatedSections.includes("booking") ? "animate-fade-in-up opacity-100" : "opacity-0"}`}
          >
            <div className="space-y-10">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div className="space-y-4 max-w-2xl">
                  <h2 className="text-4xl sm:text-5xl font-bold">{i18n.t("press_kit.booking.title")}</h2>
                  <p className="text-lg text-muted-foreground">{i18n.t("press_kit.booking.description")}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {i18n.t("press_kit.booking.available_services", { count: performerServices.length })}
                </div>
              </div>

              <div className="grid gap-6">
                {performerServices.map((service) => {
                  const duration = formatDuration(service.duration_minutes)
                  const location = [service.home_city, service.home_country].filter(Boolean).join(", ")
                  const priceRules = service.service_price_rules || []

                  return (
                    <article
                      key={service.id}
                      className="group overflow-hidden rounded-lg border border-border bg-background hover:border-primary/60 transition-colors duration-300"
                    >
                      <div className="grid md:grid-cols-[240px_1fr]">
                        <div className="relative aspect-[4/3] md:aspect-auto min-h-56 overflow-hidden bg-secondary">
                          {service.cover_url ? (
                            <img
                              src={service.cover_url}
                              alt={service.title}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                              <Radio className="h-10 w-10" />
                            </div>
                          )}
                        </div>

                        <div className="p-6 sm:p-8 space-y-6">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                {service.category && (
                                  <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                                    {serviceCategoryLabel(service.category)}
                                  </span>
                                )}
                                {service.delivery_method && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {deliveryMethodLabel(service.delivery_method)}
                                  </span>
                                )}
                                {duration && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    {duration}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Link to={service.path} className="inline-flex items-center gap-2 text-2xl font-semibold hover:text-primary transition-colors">
                                  {service.title}
                                  <ArrowUpRight className="h-5 w-5" />
                                </Link>
                                {service.short_description && (
                                  <p className="text-muted-foreground leading-relaxed max-w-2xl">{service.short_description}</p>
                                )}
                              </div>
                            </div>

                            <div className="lg:text-right space-y-1">
                              <div className="text-2xl font-bold">{service.formatted_price}</div>
                              {service.booking_mode && (
                                <div className="text-sm text-muted-foreground">{bookingModeLabel(service.booking_mode)}</div>
                              )}
                            </div>
                          </div>

                          {(service.performance_format || location || service.price_notes) && (
                            <div className="grid gap-3 sm:grid-cols-3 text-sm">
                              {service.performance_format && (
                                <div className="rounded-md border border-border p-3">
                                  <div className="text-muted-foreground">{i18n.t("press_kit.booking.format")}</div>
                                  <div className="font-medium mt-1">{service.performance_format}</div>
                                </div>
                              )}
                              {location && (
                                <div className="rounded-md border border-border p-3">
                                  <div className="text-muted-foreground">{i18n.t("press_kit.booking.base")}</div>
                                  <div className="font-medium mt-1">{location}</div>
                                </div>
                              )}
                              {service.price_notes && (
                                <div className="rounded-md border border-border p-3">
                                  <div className="text-muted-foreground">{i18n.t("press_kit.booking.price_notes")}</div>
                                  <div className="font-medium mt-1 line-clamp-2">{service.price_notes}</div>
                                </div>
                              )}
                            </div>
                          )}

                          {priceRules.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <BadgeDollarSign className="h-4 w-4 text-primary" />
                                {i18n.t("press_kit.booking.price_rules")}
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {priceRules.slice(0, 4).map((rule) => (
                                  <div key={rule.id} className="flex items-start justify-between gap-4 rounded-md border border-border px-3 py-2 text-sm">
                                    <div>
                                      <div className="font-medium">{rule.name}</div>
                                      <div className="text-muted-foreground">
                                        {[priceRuleTypeLabel(rule.rule_type), rule.location_scope].filter(Boolean).join(" · ")}
                                      </div>
                                    </div>
                                    <div className="font-semibold whitespace-nowrap">{rule.formatted_amount}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                            <p className="text-sm text-muted-foreground">{i18n.t("press_kit.booking.cta_hint")}</p>
                            <div className="sm:w-56">
                              <BookingProposalModal product={service} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {hasPhotosSection && (
        <section
          id="photos"
          ref={setSectionRef("photos")}
          className={`min-h-screen py-20 sm:py-32 ${animatedSections.includes("photos") ? "animate-fade-in-up opacity-100" : "opacity-0"}`}
        >
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-bold">{i18n.t("press_kit.navigation.photos")}</h2>
              <p className="text-lg text-muted-foreground">{i18n.t("press_kit.press_photos.high_res_available")}</p>
            </div>

            {/* 
              Display photos from pressKitData.pressPhotos (from JSON data field).
              These photos are also stored as Photo records with Active Storage and 
              are queryable through the press_kit.photos association.
              The photos state variable contains the full Photo records for potential future use.
            */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePhotos.map((photo, index) => (
                <div
                  key={index}
                  className="group overflow-hidden rounded-lg border border-border bg-secondary/40 hover:border-primary/50 transition-all duration-500 cursor-pointer"
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted/60 p-2 sm:p-3">
                    <img
                      src={photo.url || "/placeholder.svg"}
                      alt={photo.description || "Press photo"}
                      className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="border-t border-border bg-background/80 p-4">
                    <div className="space-y-2">
                      {photo.title && <div className="text-base font-semibold">{photo.title}</div>}
                      <div className="flex items-center justify-between gap-3">
                        {photo.description && <span className="text-sm text-muted-foreground line-clamp-2">{photo.description}</span>}
                        <span className="ml-auto whitespace-nowrap text-sm text-primary">Download ↓</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {hasContactSection && (
        <section id="contact" ref={setSectionRef("contact")} className={`py-20 sm:py-32 ${animatedSections.includes("contact") ? "animate-fade-in-up opacity-100" : "opacity-0"}`}>
          <div className="grid lg:grid-cols-2 gap-12 sm:gap-16">
            <div className="space-y-8">
              <h2 className="text-4xl sm:text-5xl font-bold">{i18n.t("press_kit.navigation.contact")}</h2>

              <div className="space-y-8">
                {contacts.map((contact, index) => (
                  <div key={index} className="space-y-4">
                    <h3 className="text-sm text-muted-foreground font-mono tracking-wider uppercase">{contact.type}</h3>
                    <div className="space-y-3">
                      <a
                        href={`mailto:${contact.email}`}
                        className="group flex items-center gap-3 text-lg text-foreground hover:text-primary transition-colors duration-300"
                      >
                        <span>{contact.email}</span>
                        <svg
                          className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </a>
                      {contact.agent && <div className="text-muted-foreground">{i18n.t("press_kit.agent")}: {contact.agent}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              {socialLinks.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm text-muted-foreground font-mono tracking-wider uppercase">Social & Streaming</h3>

                  <div className="grid grid-cols-2 gap-4">
                    {socialLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-4 border border-border rounded-lg hover:border-primary/50 transition-all duration-300"
                      >
                        <div className="space-y-1">
                          <div className="text-foreground group-hover:text-primary transition-colors duration-300 font-semibold">
                            {social.name}
                          </div>
                          <div className="text-sm text-muted-foreground">{social.handle}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {tourDates.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm text-muted-foreground font-mono tracking-wider uppercase">Tour Dates</h3>
                  <div className="space-y-3">
                    {tourDates.map((show, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-3 border-b border-border hover:border-primary/50 transition-colors duration-300"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold">{show.venue}</div>
                          <div className="text-sm text-muted-foreground">{show.city}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">{show.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        )}

        <footer className="py-12 sm:py-16 border-t border-border">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sm:gap-8">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                © 2025 {pressKitData.artistName}. All rights reserved.
              </div>
              <div className="text-xs text-muted-foreground">Press Kit v2.0 — Last updated January 2025</div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="group p-3 rounded-lg border border-border hover:border-primary/50 transition-all duration-300"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <svg
                    className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              <Button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                variant="outline"
                className="border-border hover:border-primary/50 bg-transparent"
              >
                {isGeneratingPDF ? i18n.t("press_kit.generating") : i18n.t("press_kit.download_pdf")}
              </Button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
