import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ArticlesIndex from './articles/Index'
import ArticleShow from './articles/Show'
import UserMenu from './shared/UserMenu'
import AudioPlayer from './audio_player'
import TrackShow from './tracks/Show'
import TracksIndex from './tracks/Index'
import Home from './home/Index'
import PlaylistsIndex from './playlists/Index'
import PlaylistShow from './playlists/Show'
import UserShow from './users/Show'
import UserTracks from './users/Tracks'
import EventShow from './events/Show'
import EventsIndex from './events/Index'
import UserPlaylists from './users/Playlists'
import UserArticles from './users/Articles'
import UserReposts from './users/Reposts'
import UserArtists from './users/Artists'
import UserAlbums from './users/Albums'
import UserInsights from './users/Insights'
import UserAbout from './users/About'
import PodcastLayout from './podcasts/Layout'
import PodcastsIndex from './podcasts/Index'
import PodcastShow from './podcasts/Show'
import UserHome from './users/Home'
import UserProducts from './users/Products'
import ProductShow from './users/ProductShow'
import UserLinks from './users/Links'
import MyArticles from './articles/MyArticles'
import MyEvents from './events/MyEvents'
import EditArticle from './articles/EditArticle'
import EventEdit from "./events/EventEdit"
import Overview from "./events/sections/Overview"
import Schedule from "./events/sections/Schedule"
import Teams from "./events/sections/Teams"
import Tickets from "./events/sections/Tickets"
import Streaming from "./events/sections/Streaming"
import Attendees from "./events/sections/Attendees"
import Recordings from "./events/sections/Recordings"
import Settings from "./events/sections/Settings"
import { Toaster } from "./ui/toaster"
import MySales from "./sales/MySales"
import MyPurchases from "./purchases/MyPurchases"

export default function AppRouter() {
  return (
    <BrowserRouter>
      <UserMenu />

      <div className="pb-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sales" element={<MySales />} />
          <Route path="/purchases" element={<MyPurchases />} />
          <Route path="/articles" element={<ArticlesIndex />} />
          <Route path="/articles/mine" element={<MyArticles />} />
          <Route path="/articles/:id/edit" element={<EditArticle />} />
          <Route path="/articles/:slug" element={<ArticleShow />} />
          <Route path="/events" element={<EventsIndex />} />
          <Route path="/events/mine" element={<MyEvents />} />
          <Route path="/events/:slug" element={<EventShow />} />
          <Route path="/events/:slug/edit" element={<EventEdit />}>
            <Route index element={<Overview />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="teams" element={<Teams />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="streaming" element={<Streaming />} />
            <Route path="attendees" element={<Attendees />} />
            <Route path="recordings" element={<Recordings />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/tracks" element={<TracksIndex />} />
          <Route path="/tracks/:slug" element={<TrackShow />} />
          <Route path="/playlists" element={<PlaylistsIndex />} />
          <Route path="/playlists/:slug" element={<PlaylistShow />} />
          <Route path="/:username/podcasts" element={<PodcastLayout />}>
            <Route index element={<PodcastsIndex />} />
            <Route path=":id" element={<PodcastShow />} />
          </Route>
          <Route path="/:username/about" element={<UserAbout />} />
          <Route path="/:username/links" element={<UserLinks />} />
          <Route path="/:username/*" element={<UserShow />}>
            <Route index element={<UserHome />} />
            <Route path="tracks" element={<UserTracks />} />
            <Route path="playlists" element={<UserPlaylists namespace="playlists" />} />
            <Route path="articles" element={<UserArticles />} />
            <Route path="reposts" element={<UserReposts />} />
            <Route path="artists" element={<UserArtists />} />
            <Route path="albums" element={<UserPlaylists namespace="albums" />} />
            <Route path="insights" element={<UserInsights />} />
            <Route path="products" element={<UserProducts />} />
            <Route path="products/:slug" element={<ProductShow />} />
          </Route>
        </Routes>
      </div>

      <Toaster />
      <AudioPlayer />
    </BrowserRouter>
  )
}
