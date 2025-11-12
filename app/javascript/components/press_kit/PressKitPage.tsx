import React, { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AdminPanel, type PressKitData } from "./AdminPanel"
import { get, patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import useAuthStore from "@/stores/authStore"
import { useParams } from "react-router-dom"

export default function PressKitPage() {
  const { username } = useParams()
  const { currentUser } = useAuthStore()
  const { toast } = useToast()
  const [isDark, setIsDark] = useState(true)
  const [activeSection, setActiveSection] = useState("")
  const sectionsRef = useRef<(HTMLElement | null)[]>([])
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
  const [photos, setPhotos] = useState<any[]>([])
  const [animatedSections, setAnimatedSections] = useState<string[]>([])

  const isOwner = currentUser && currentUser.username === username

  useEffect(() => {
    loadPressKit()
  }, [username])

  const loadPressKit = async () => {
    try {
      const response = await get(`/${username}/press-kit.json`)
      
      if (response.ok) {
        const data = await response.json
        if (data.press_kit && data.press_kit.data) {
          setPressKitData(data.press_kit.data)
        }
        if (data.press_kit && data.press_kit.playlists) {
          setPlaylists(data.press_kit.playlists)
        }
        // Load photos from the queryable association
        if (data.press_kit && data.press_kit.photos) {
          setPhotos(data.press_kit.photos)
        }
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
        setPressKitData(newData)
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
    const sections = sectionsRef.current.filter(Boolean) as HTMLElement[]
    if (sections.length > 0) {
      sections.forEach((section) => {
        console.log("PressKit: observing section ->", section.id)
        observer.observe(section)
      })
    } else {
      const ids = ["intro", "bio", "music", "photos", "press", "contact"]
      ids.forEach((id) => {
        const el = document.getElementById(id)
        if (el) {
          console.log("PressKit: fallback observing ->", id)
          observer.observe(el)
        }
      })
    }

    return () => {
      try {
        const observed = sectionsRef.current.filter(Boolean) as HTMLElement[]
        observed.forEach((section) => {
          observer.unobserve(section)
        })
      } catch (e) {
        // ignore
      }
      observer.disconnect()
    }
  }, [loading])

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
      pdf.text(artistNameParts[0], pageWidth / 2, 100, { align: "center" })

      pdf.setTextColor(168, 85, 247)
      pdf.text(artistNameParts.slice(1).join(" "), pageWidth / 2, 120, { align: "center" })

      pdf.setTextColor(136, 136, 136)
      pdf.setFontSize(14)
      pdf.setFont(undefined, "normal")
      pdf.text(pressKitData.tagline, pageWidth / 2, 140, { align: "center" })

      pdf.setFontSize(11)
      pdf.text(`${pressKitData.location} • ${pressKitData.listeners}`, pageWidth / 2, 150, { align: "center" })

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

      const splitIntro = pdf.splitTextToSize(pressKitData.bio.intro, pageWidth - 2 * margin)
      pdf.text(splitIntro, margin, yPos)
      yPos += splitIntro.length * 6 + 5

      const splitCareer = pdf.splitTextToSize(pressKitData.bio.career, pageWidth - 2 * margin)
      pdf.text(splitCareer, margin, yPos)
      yPos += splitCareer.length * 6 + 5

      pdf.setTextColor(255, 255, 255)
      const splitSound = pdf.splitTextToSize(pressKitData.bio.sound, pageWidth - 2 * margin)
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
        const splitAchievement = pdf.splitTextToSize(achievement, pageWidth - 2 * margin - 10)
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
      pdf.text(pressKitData.genres.join(" • "), margin, yPos)

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

      for (let i = 0; i < Math.min(4, pressKitData.pressPhotos.length); i++) {
        const photo = pressKitData.pressPhotos[i]
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = margin + col * (photoWidth + margin)
        const y = yPos + row * (photoHeight + 15)

        try {
          const img = document.createElement("img")
          img.crossOrigin = "anonymous"
          img.src = photo.image
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
          pdf.text(photo.title, x, y + photoHeight + 5)

          pdf.setTextColor(136, 136, 136)
          pdf.setFontSize(8)
          pdf.setFont(undefined, "normal")
          pdf.text(photo.resolution, x, y + photoHeight + 10)
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
        pdf.text(contact.type.toUpperCase(), margin, yPos)
        yPos += 6

        pdf.setTextColor(168, 85, 247)
        pdf.setFontSize(12)
        pdf.text(contact.email, margin, yPos)
        yPos += 5

        if (contact.agent) {
          pdf.setTextColor(136, 136, 136)
          pdf.setFontSize(9)
          pdf.text(`Agent: ${contact.agent}`, margin, yPos)
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
        pdf.text(social.name, margin, yPos)
        pdf.setFont(undefined, "normal")
        pdf.setTextColor(136, 136, 136)
        pdf.text(social.handle, margin + 40, yPos)
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
        pdf.text(tour.venue, margin, yPos)
        pdf.setFont(undefined, "normal")
        pdf.setTextColor(136, 136, 136)
        pdf.text(tour.city, margin, yPos + 5)
        pdf.text(tour.date, pageWidth - margin, yPos, { align: "right" })
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
          <div className="text-lg">Loading press kit...</div>
        </div>
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
        onSave={handleSaveData}
      />

      <nav className="fixed left-8 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
        <div className="flex flex-col gap-4">
          {["intro", "bio", "music", "photos", "press", "contact"].map((section) => (
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
          ref={(el) => (sectionsRef.current[0] = el)}
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
                <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed">
                  {pressKitData.bio.intro}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-muted-foreground">Available for Bookings</span>
                  </div>
                  <div className="text-muted-foreground">{pressKitData.location}</div>
                  <div className="text-muted-foreground">{pressKitData.listeners}</div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <Button
                    onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Book Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("music")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Listen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section id="bio" ref={(el) => (sectionsRef.current[1] = el)} className={`min-h-screen py-20 sm:py-32 ${animatedSections.includes("bio") ? "animate-fade-in-up opacity-100" : "opacity-0"}`}>
          <div className="space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-4xl sm:text-5xl font-bold">Biography</h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
                <p>{pressKitData.bio.intro}</p>
                <p>{pressKitData.bio.career}</p>
                <p className="text-foreground">{pressKitData.bio.sound}</p>
              </div>

              <div className="space-y-8">
                {pressKitData.achievements.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm text-muted-foreground font-mono tracking-wider uppercase">Achievements</h3>
                    <ul className="space-y-3">
                      {pressKitData.achievements.map((achievement, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                          <span className="text-foreground">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {pressKitData.genres.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm text-muted-foreground font-mono tracking-wider uppercase">Genre</h3>
                    <div className="flex flex-wrap gap-2">
                      {pressKitData.genres.map((genre) => (
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

        <section
          id="music"
          ref={(el) => (sectionsRef.current[2] = el)}
          className={`min-h-screen py-20 sm:py-32 ${animatedSections.includes("music") ? "animate-fade-in-up opacity-100" : "opacity-0"}`}
        >
          <div className="space-y-12">
            <h2 className="text-4xl sm:text-5xl font-bold">Music</h2>

            {playlists.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">Playlists & Albums</h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {playlists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      to={`/playlists/${playlist.slug}`}
                      className="group relative overflow-hidden rounded-lg border border-border hover:border-primary/50 transition-all duration-500"
                    >
                      <div className="aspect-square relative overflow-hidden bg-secondary">
                        {playlist.cover_url ? (
                          <img
                            src={playlist.cover_url}
                            alt={playlist.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No Cover
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

            {(pressKitData.externalMusicLinks || []).length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">Available On</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(pressKitData.externalMusicLinks || []).map((link, index) => (
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
                            {link.platform.replace('_', ' ')}
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

            {playlists.length === 0 && (pressKitData.externalMusicLinks || []).length === 0 && (
              <p className="text-muted-foreground">No music releases added yet</p>
            )}
          </div>
        </section>

        <section
          id="photos"
          ref={(el) => (sectionsRef.current[3] = el)}
          className={`min-h-screen py-20 sm:py-32 ${animatedSections.includes("photos") ? "animate-fade-in-up opacity-100" : "opacity-0"}`}
        >
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-bold">Press Photos</h2>
              <p className="text-lg text-muted-foreground">High-resolution images available for download</p>
            </div>

            {/* 
              Display photos from pressKitData.pressPhotos (from JSON data field).
              These photos are also stored as Photo records with Active Storage and 
              are queryable through the press_kit.photos association.
              The photos state variable contains the full Photo records for potential future use.
            */}
            {pressKitData.pressPhotos.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pressKitData.pressPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-lg border border-border hover:border-primary/50 transition-all duration-500 cursor-pointer"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden bg-secondary">
                      <img
                        src={photo.image || "/placeholder.svg"}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                        <div className="space-y-2 w-full">
                          <div className="text-lg font-semibold">{photo.title}</div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{photo.resolution}</span>
                            <span className="text-sm text-primary">Download ↓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          id="press"
          ref={(el) => (sectionsRef.current[4] = el)}
          className={`min-h-screen py-20 sm:py-32 ${animatedSections.includes("press") ? "animate-fade-in-up opacity-100" : "opacity-0"}`}
        >
          <div className="space-y-12">
            <h2 className="text-4xl sm:text-5xl font-bold">Press & Reviews</h2>
            <p className="text-muted-foreground">Press reviews and features will be displayed here</p>
          </div>
        </section>

        <section id="contact" ref={(el) => (sectionsRef.current[5] = el)} className={`py-20 sm:py-32 ${animatedSections.includes("contact") ? "animate-fade-in-up opacity-100" : "opacity-0"}`}>
          <div className="grid lg:grid-cols-2 gap-12 sm:gap-16">
            <div className="space-y-8">
              <h2 className="text-4xl sm:text-5xl font-bold">Get in Touch</h2>

              <div className="space-y-8">
                {pressKitData.contacts.map((contact, index) => (
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
                      {contact.agent && <div className="text-muted-foreground">Agent: {contact.agent}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              {pressKitData.socialLinks.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm text-muted-foreground font-mono tracking-wider uppercase">Social & Streaming</h3>

                  <div className="grid grid-cols-2 gap-4">
                    {pressKitData.socialLinks.map((social) => (
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

              {pressKitData.tourDates.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm text-muted-foreground font-mono tracking-wider uppercase">Tour Dates</h3>
                  <div className="space-y-3">
                    {pressKitData.tourDates.map((show, index) => (
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
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
              </Button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
