import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ArticlesIndex from './articles/Index'
import ArticleShow from './articles/Show'
import UserMenu from './shared/UserMenu'
import AudioPlayer from './audio_player'
import TrackShow from './tracks/Show'
import Home from './home/Index'
import PlaylistsIndex from './playlists/Index'
import PlaylistShow from './playlists/Show'
import UserShow from './users/Show'
import UserTracks from './users/Tracks'
import UserPlaylists from './users/Playlists'
import UserArticles from './users/Articles'
import UserReposts from './users/Reposts'
import UserArtists from './users/Artists'
import UserAlbums from './users/Albums'
import UserInsights from './users/Insights'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <UserMenu 
        labelUser={window.labelUser}
        cartItemCount={window.cartItemCount}
      />
      <Routes className="pb-20">
        <Route path="/" element={<Home />} />
        <Route path="/articles" element={<ArticlesIndex />} />
        <Route path="/articles/:slug" element={<ArticleShow />} />
        <Route path="/tracks/:slug" element={<TrackShow />} />
        <Route path="/playlists" element={<PlaylistsIndex />} />
        <Route path="/playlists/:slug" element={<PlaylistShow />} />
        <Route path="/:username/*" element={<UserShow />}>
          <Route index element={<UserTracks />} />
          <Route path="tracks" element={<UserTracks />} />
          <Route path="playlists" element={<UserPlaylists />} />
          <Route path="articles" element={<UserArticles />} />
          <Route path="reposts" element={<UserReposts />} />
          <Route path="artists" element={<UserArtists />} />
          <Route path="albums" element={<UserPlaylists namespace="albums"/>} />
          <Route path="insights" element={<UserInsights />} />
        </Route>
      </Routes>
      <AudioPlayer />
    </BrowserRouter>
  )
}
