import React from 'react'
import { Link } from 'react-router-dom'
import { Play, Pause } from 'lucide-react'
import TrackPlayer from '../tracks/TrackPlayer'
import TrackItemMenu from './TrackItemMenu'
import MusicPurchase from '@/components/shared/MusicPurchase'

export default function TrackItem({
  track,
  currentTrackId,
  isPlaying,
  onPlay,
  elementRef,
  embed,
  host
}) {
  const isCurrentTrack = currentTrackId === track.id
  const isCurrentlyPlaying = isCurrentTrack && isPlaying

  return (
    <div
      ref={elementRef}
      className="rounded-lg p-4 space-y-4 w-full"
    >
      <div className="flex items-center gap-4">
        <div className="hidden sm:block relative w-20 h-20 flex-shrink-0">
          <img
            src={track.cover_url.cropped_image}
            alt={track.title}
            className="w-full h-full object-cover rounded"
          />
          <button
            onClick={() => onPlay(track.id)}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 transition-opacity hover:bg-opacity-50"
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-8 h-8 text-default" />
            ) : (
              <Play className="w-8 h-8 text-default" />
            )}
          </button>
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center">

                <button
                  onClick={() => onPlay(track.id)}
                  className="flex sm:hidden mr-2 p-3 items-center justify-center bg-black bg-opacity-40 transition-opacity hover:bg-opacity-50"
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="w-4 h-4 text-default" />
                  ) : (
                    <Play className="w-4 h-4 text-default" />
                  )}
                </button>

                <Link
                  to={`${host || ""}/tracks/${track.slug}`}
                  target={embed ? "_blank" : "_self"}
                  className="text-lg max-w-[130px] md:max-w-none font-semibold text-default hover:text-brand-500 truncate block"
                >
                  {track.title}
                </Link>
              </div>

              <div class="space-x-2">
                <Link
                  to={`${host || ""}/${track.user.username}`}
                  target={embed ? "_blank" : "_self"}
                  className="text-sm text-muted-foreground hover:text-default"
                >
                  {track.user.full_name}
                </Link>

                {track.artists && track.artists.length > 0 && (
                  <>
                    {track.artists.map((artist) =>
                      <Link to={`/${artist.username}`}
                        className="text-sm text-muted-foreground hover:text-default">
                        {artist.full_name || artist.username}
                      </Link>
                    )}
                  </>
                )}
              </div>

            </div>

            {!embed && <TrackItemMenu track={track} />}
          </div>

          <div className="mt-4 hidden- sm:block">
            <TrackPlayer
              url={track.audio_url}
              peaks={track.peaks}
              id={track.id}
              disablePlayButton={true}
              urlLink={`/${track.user.username}/${track.slug}`}
            />
          </div>

          {track.tag_list && track.tag_list.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {track.tag_list.map((tag, index) => (
                <Link
                  key={index}
                  to={`${host || ""}/tracks/tags/${tag}`}
                  target={embed ? "_blank" : "_self"}
                  className="inline-flex items-center rounded-full bg-muted dark:bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground dark:text-muted hover:bg-secondary dark:hover:bg-secondary transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {!embed && <MusicPurchase resource={track} type="Track" variant="mini" />}
          {embed && <p className="text-sm text-muted-foreground mt-2">
            Powered by <a
              href={`${host}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:underline"
            >Rauversion.com</a>
          </p>}
        </div>
      </div>
    </div>
  )
}
