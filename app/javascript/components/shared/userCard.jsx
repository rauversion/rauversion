import React from 'react'
import I18n from '@/stores/locales'
import useAuthStore from '@/stores/authStore'
import { Card } from "@/components/ui/card"
import { Link } from 'react-router-dom'


export default function UserCard({artist, username}) {

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
          <p className="text-xl font-mono text-gray-400" title={I18n.t('users.artist_page.username', { username: artist.username })}>@{artist.username}</p>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4 text-lg">
            { artist.tracks_count && <div className="border border-white/20 px-4 py-2">
              <span className="font-bold text-white" title={I18n.t('users.artist_page.tracks_count', { count: artist.tracks_count })}>
                {artist.tracks_count}
              </span>
              <span className="text-gray-400 uppercase text-sm ml-2">{I18n.t('users.artist_page.tracks')}</span>
            </div>}
            { artist.albums_count && <div className="border border-white/20 px-4 py-2">
              <span className="font-bold text-white" title={I18n.t('users.artist_page.albums_count', { count: artist.albums_count })}>
                {artist.albums_count}
              </span>
              <span className="text-gray-400 uppercase text-sm ml-2">{I18n.t('users.artist_page.albums')}</span>
            </div>}
          </div>

          {artist.bio && (
            <p className="text-base text-gray-400 line-clamp-2 font-mono" title={I18n.t('users.artist_page.bio')}>
              {artist.bio}
            </p>
          )}

          <div className="space-y-2">
            <Link
              to={`/${artist.username}`}
              className="block w-full bg-white text-black py-4 text-center text-lg font-bold uppercase hover:bg-gray-200 transition-colors"
            >
              {I18n.t('users.artist_page.view_profile')}
            </Link>

            { username && useAuthStore.getState().currentUser?.username === username && (
              <a
                href={`/account_connections/impersonate?username=${artist.username}`}
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