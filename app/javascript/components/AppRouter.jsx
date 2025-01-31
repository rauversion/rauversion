import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ArticlesIndex from './articles/Index'
import ArticleShow from './articles/Show'
import EventsIndex from './events/Index'
import EventShow from './events/Show'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/articles" element={<ArticlesIndex />} />
        <Route path="/articles/:slug" element={<ArticleShow />} />
        <Route path="/events" element={<EventsIndex />} />
        <Route path="/events/:slug" element={<EventShow />} />
      </Routes>
    </BrowserRouter>
  )
}
