import React from "react"
import YouTubePlayer from "@/components/courses/YouTubePlayer"

export interface CourseCoverData {
  title?: string
  cover_type?: "image" | "video" | "youtube"
  thumbnail?: string
  thumbnail_url?: string
  intro_video?: string
  intro_video_url?: string
  youtube_url?: string
}

export default function CourseCover({ course, className = "" }: { course: CourseCoverData; className?: string }) {
  return (
    <div className={`aspect-video rounded-lg overflow-hidden bg-black ${className}`}>
      {course.cover_type === "youtube" && course.youtube_url ? (
        <YouTubePlayer url={course.youtube_url} title={course.title} />
      ) : course.cover_type === "video" && course.intro_video_url ? (
        <video
          key={course.intro_video_url}
          src={course.intro_video_url}
          poster={course.thumbnail_url || undefined}
          aria-label={course.title}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full"
        />
      ) : (
        <img src={course.thumbnail_url || "/placeholder.svg"} alt={course.title || ""} className="object-cover w-full h-full" />
      )}
    </div>
  )
}
