import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ArticlesIndex from './articles/Index'
import ArticleShow from './articles/Show'
import EventsIndex from './events/Index'
import EventShow from './events/Show'
import AudioPlayer from './audio_player'
import UserMenu from './shared/UserMenu'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <UserMenu
        currentUser={window.currentUser}
        labelUser={window.labelUser}
        cartItemCount={window.cartItemCount}
      />
      <Routes>
        <Route path="/articles" element={<ArticlesIndex />} />
        <Route path="/articles/:slug" element={<ArticleShow />} />
        <Route path="/events" element={<EventsIndex />} />
        <Route path="/events/:slug" element={<EventShow />} />
      </Routes>
      <AudioPlayer />
    </BrowserRouter>
  )
}
