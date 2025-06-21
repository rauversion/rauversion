import React from 'react'
import { Play, Pause } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"
import { Link } from "react-router"

export function formatDuration(seconds) {
  if (!seconds) return ""
  if (seconds == "xx;xx") return ""
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export default function PlaylistListItem({ track, index, currentTrackId, isPlaying, onPlay }) {
  const isCurrentTrack = currentTrackId === track.id

  return (
    <motion.div
      key={track.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "flex items-center justify-between p-3 rounded-lg relative",
        "transition-all duration-300 ease-in-out",
        "hover:bg-white/10 group cursor-default",
        "hover:scale-[1.02]",
        "border border-transparent hover:border-white/5",
        isCurrentTrack ? "bg-white/20 shadow-lg" : "",
        isCurrentTrack && isPlaying ? "border-l-4 border-l-brand-500" : ""
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <span className={cn(
          "w-6 font-medium transition-colors duration-300",
          isCurrentTrack ? "text-brand-500" : "text-zinc-400 group-hover:text-zinc-300"
        )}>
          {index + 1}
        </span>

        <motion.button
          onClick={onPlay}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative flex items-center justify-center",
            "w-10 h-10 rounded-full",
            "bg-brand-500 text-white",
            "transition-all duration-300",
            "hover:bg-brand-400 hover:shadow-lg hover:shadow-brand-500/25",
            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-background"
          )}
        >
          {isCurrentTrack && isPlaying ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Pause size={18} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Play size={18} className="ml-1" />
            </motion.div>
          )}
        </motion.button>

        <div className="flex-1 min-w-0">
          <motion.p
            className={cn(
              "font-medium truncate",
              isCurrentTrack ? "text-brand-500" : "text-default group-hover:text-white"
            )}
            animate={{
              color: isCurrentTrack ? "rgb(var(--brand-500))" : undefined
            }}
            transition={{ duration: 0.3 }}
          >
            {track.title}
          </motion.p>
          <p className="text-zinc-400 text-sm truncate-- group-hover:text-zinc-300 space-x-2">
            <Link to={`/${track.user.username}`} className="hover:underline">
              {track.user.full_name}
            </Link>
            {track.artists && track.artists.length > 0 && (
              <>
                {track.artists.map((artist) =>
                  <Link to={`/${artist.username}`} className="hover:underline">
                    {artist.full_name || artist.username}
                  </Link>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 pl-4">
        {track.duration && (
          <motion.span
            className="text-zinc-400 group-hover:text-zinc-300 tabular-nums font-medium"
            animate={{
              color: isCurrentTrack ? "rgb(var(--brand-500))" : undefined
            }}
            transition={{ duration: 0.3 }}
          >
            {formatDuration(track.duration)}
          </motion.span>
        )}
      </div>

      {isCurrentTrack && isPlaying && (
        <>
          <motion.div
            className="absolute left-0 bottom-0 h-[2px] bg-brand-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 0.3,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute right-3 top-1/2 -translate-y-1/2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex gap-[3px]">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] h-[15px] bg-brand-500 rounded-full"
                  animate={{
                    height: ["15px", "5px", "15px"],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
