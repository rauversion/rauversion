import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ArticlesIndex from './articles/Index'
import ArticleShow from './articles/Show'
import EventsIndex from './events/Index'
import EventShow from './events/Show'
import AudioPlayer from './audio_player'
import UserMenu from './shared/UserMenu'
import TracksIndex from './tracks/Index'
import TrackShow from './tracks/Show'
import Home from './home/Index'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <UserMenu
        currentUser={window.currentUser}
        labelUser={window.labelUser}
        cartItemCount={window.cartItemCount}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/articles" element={<ArticlesIndex />} />
        <Route path="/articles/:slug" element={<ArticleShow />} />
        <Route path="/events" element={<EventsIndex />} />
        <Route path="/events/:slug" element={<EventShow />} />
        <Route path="/tracks" element={<TracksIndex />} />
        <Route path="/tracks/:slug" element={<TrackShow />} />
      </Routes>
      <AudioPlayer />
    </BrowserRouter>
  )
}
