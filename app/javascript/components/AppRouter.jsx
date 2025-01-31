import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ArticlesIndex from './articles/Index'
import ArticleShow from './articles/Show'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/articles" element={<ArticlesIndex />} />
        <Route path="/articles/:slug" element={<ArticleShow />} />
      </Routes>
    </BrowserRouter>
  )
}
