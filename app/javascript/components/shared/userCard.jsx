import React from 'react'
import I18n from '@/stores/locales'
import useAuthStore from '@/stores/authStore'
import { Card } from "@/components/ui/card"
import { Link } from 'react-router-dom'
import { Disc3, MapPin, Sparkles, Users } from 'lucide-react'

function artistDisplayName(artist) {
  return artist.full_name?.trim() || artist.username
}

function artistLocation(artist) {
  return [artist.city, artist.country].filter(Boolean).join(', ')
}

function memberSinceYear(artist) {
  if (!artist.created_at) return null

  const date = new Date(artist.created_at)
  return Number.isNaN(date.getTime()) ? null : date.getFullYear()
}


export default function UserCard({ artist, username, variant = 'default' }) {
  if (variant === 'rounded') {
    const currentUsername = useAuthStore.getState().currentUser?.username
    const canImpersonate = username && currentUsername === username
    const displayName = artistDisplayName(artist)
    const location = artistLocation(artist)
    const joinedYear = memberSinceYear(artist)

    return (
      <Card className="group relative h-full overflow-hidden rounded-[28px] border border-border/60 bg-card/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.16)]">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_58%),linear-gradient(135deg,rgba(15,23,42,0.06),transparent)]" />

        <div className="relative flex h-full flex-col p-5">
          <div className="flex items-start gap-4">
            <Link
              to={`/${artist.username}`}
              className="h-20 w-20 shrink-0 overflow-hidden rounded-[24px] ring-1 ring-border/70"
            >
              {artist.avatar_url ? (
                <img
                  src={artist.avatar_url.medium}
                  alt={displayName}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-gray-800 to-gray-900" />
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                {artist.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">
                    <Sparkles className="h-3 w-3" />
                    {I18n.t('artists.featured_badge')}
                  </span>
                )}

                {artist.label && (
                  <span className="inline-flex rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {I18n.t('artists.label_badge')}
                  </span>
                )}
              </div>

              <h3 className="mt-3 truncate text-lg font-black tracking-tight text-foreground">
                <Link
                  to={`/${artist.username}`}
                  className="transition-colors hover:text-brand-500"
                >
                  {displayName}
                </Link>
              </h3>
              <p className="truncate text-sm text-muted-foreground">
                <Link
                  to={`/${artist.username}`}
                  className="transition-colors hover:text-foreground"
                >
                  @{artist.username}
                </Link>
              </p>

              {location && (
                <div className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full bg-black/5 px-2.5 py-1 text-xs text-muted-foreground dark:bg-white/5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              )}
            </div>
          </div>

          {artist.bio && (
            <p className="mt-5 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
              {artist.bio}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-black/5 px-3 py-2 text-sm dark:bg-white/5">
              <Disc3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-black text-foreground">{artist.tracks_count || 0}</span>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {I18n.t('profile.tracks')}
              </span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-black/5 px-3 py-2 text-sm dark:bg-white/5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-black text-foreground">{artist.followers_count || 0}</span>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {I18n.t('profile.followers')}
              </span>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {joinedYear ? I18n.t('artists.member_since', { year: joinedYear }) : ''}
            </p>

            {canImpersonate && (
              <a
                href={`/account_connections/impersonate?username=${artist.username}`}
                className="inline-flex h-9 items-center justify-center rounded-full border border-border/70 px-4 text-sm font-semibold text-foreground transition hover:border-brand-400 hover:text-brand-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                {I18n.t('users.artist_page.impersonate')}
              </a>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group relative h-[400px] overflow-hidden border-0 bg-black">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-40 transition-opacity group-hover:opacity-30">
        {artist.avatar_url ? (
          <img
            src={artist.avatar_url.medium}
            alt=""
            className="h-full w-full object-cover filter blur-sm scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
      </div>

      {/* Content Overlay */}
      <div className="relative h-full flex flex-col justify-between p-6">
        <div className="space-y-4">
          <h3 className="text-4xl font-black tracking-tight text-white uppercase" title={I18n.t('users.artist_page.name', { name: artist.full_name })}>
            {artist.full_name}
          </h3>
          <p className="text-xl font-mono text-muted-foreground" title={I18n.t('users.artist_page.username', { username: artist.username })}>@{artist.username}</p>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4 text-lg">
            {artist.tracks_count && <div className="border border-white/20 px-4 py-2">
              <span className="font-bold text-white" title={I18n.t('users.artist_page.tracks_count', { count: artist.tracks_count })}>
                {artist.tracks_count}
              </span>
              <span className="text-muted-foreground uppercase text-sm ml-2">{I18n.t('users.artist_page.tracks')}</span>
            </div>}
            {artist.albums_count && <div className="border border-white/20 px-4 py-2">
              <span className="font-bold text-white" title={I18n.t('users.artist_page.albums_count', { count: artist.albums_count })}>
                {artist.albums_count}
              </span>
              <span className="text-muted-foreground uppercase text-sm ml-2">{I18n.t('users.artist_page.albums')}</span>
            </div>}
          </div>

          {artist.bio && (
            <p className="text-base text-muted-foreground line-clamp-2 font-mono" title={I18n.t('users.artist_page.bio')}>
              {artist.bio}
            </p>
          )}

          <div className="space-y-2">
            <Link
              to={`/${artist.username}`}
              className="block w-full bg-white text-black py-4 text-center text-lg font-bold uppercase hover:bg-secondary transition-colors"
            >
              {I18n.t('users.artist_page.view_profile')}
            </Link>

            {username && useAuthStore.getState().currentUser?.username === username && (
              <a
                href={`/account_connections/impersonate?username=${artist.username}`}
                target="_blank"
                className="block w-full bg-primary text-white py-4 text-center text-lg font-bold uppercase hover:bg-primary/90 transition-colors"
              >
                {I18n.t('users.artist_page.impersonate')}
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
