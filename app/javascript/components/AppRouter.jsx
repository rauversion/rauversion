import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/stores/authStore'
import { useActionCable } from '../hooks/useActionCable'
import ArticlesIndex from './articles/Index'
import ArticleShow from './articles/Show'
import UserMenu from './shared/UserMenu'
import AudioPlayer from './audio_player'
import Login from './auth/Login'
import Register from './auth/Register'
import ForgotPassword from './auth/ForgotPassword'
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
import ArtistsIndex from './artists/Index'
import UserAlbums from './users/Albums'
import UserInsights from './users/Insights'
import UserAbout from './users/About'
import PodcastLayout from './podcasts/Layout'
import PodcastsIndex from './podcasts/Index'
import PodcastShow from './podcasts/Show'
import UserHome from './users/Home'
import UserProducts from './users/Products'
// import ProductShow from './users/ProductShow'
import ProductShow from "./products/ProductShow"
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
import { Toaster } from "@/components/ui/toaster"
import { useToast } from '@/hooks/use-toast'

import MySales from "./sales/MySales"
import MyPurchases from "./purchases/MyPurchases"
import MySettings from "./users/MySettings"

import ProfileForm from "./users/settings/ProfileForm"
import EmailSettings from "./users/settings/EmailSettings"
import NotificationSettings from "./users/settings/NotificationSettings"
import SocialLinksSettings from "./users/settings/SocialLinksSettings"
import PodcastSettings from "./users/settings/PodcastSettings"
import IntegrationsSettings from "./users/settings/IntegrationsSettings"
import TransbankSettings from "./users/settings/TransbankSettings"
import InvitationsSettings from "./users/settings/InvitationsSettings"
import SecuritySettings from "./users/settings/SecuritySettings"


import ReleasesList from "./releases/ReleasesList"
import ReleaseForm from "./releases/ReleaseForm"
import ReleaseEditor from "./releases/ReleaseEditor"
import ReleasePreview from "./releases/ReleasePreview"

import AlbumsIndex from "./albums/Index"
import StoreIndex from "./store/Index"
import ProductNew from "./products/New"
import GearForm from "./products/gear/Form"
import MusicForm from "./products/music/Form"
import MerchForm from "./products/merch/Form"
import AccessoryForm from "./products/accessory/Form"
import ServiceForm from "./products/service/Form"
import AlbumShow from "./albums/AlbumShow"
import NewTrack from "./tracks/NewTrack"
import CategoryView from "./store/CategoryView"

import CheckoutSuccess from "./checkout/CheckoutSuccess"
import CheckoutFailure from "./checkout/CheckoutFailure"

import { Footer, ScrollRestoration, LoadingSpinner } from '@/components/shared'

import { useLocaleStore } from "@/stores/locales"

function RequireAuth({ children }) {
  const { currentUser, loading: currentUserLoading } = useAuthStore()
  const location = useLocation()

  
  if(currentUserLoading) {
    return <LoadingSpinner />
  }

  if (!currentUser && !currentUserLoading) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function AppContent() {
  const { currentUser } = useAuthStore()
  const { subscribe, unsubscribe, subscription } = useActionCable()
  const { toast } = useToast()
  const { currentLocale } = useLocaleStore()


  const handleNotification = (data) => {
    const { type, message, title, ...rest } = data

    console.log('Received notification:', data)
    switch (type) {
      case 'success':
      case 'error':
      case 'warning':
      case 'info':
        toast({
          title: title || type.charAt(0).toUpperCase() + type.slice(1),
          description: message,
          variant: type === 'error' ? 'destructive' : undefined,
          ...rest
        })
        break
        
      default:
        console.log('Unhandled notification:', data)
    }
  }

  useEffect(() => {
    if (currentUser) {
      // Subscribe to user-specific notifications
      const userChannel = subscribe(`NotificationsChannel`, 
        { user_id: currentUser.id },
        {
          received: handleNotification
        }
      )

      // Subscribe to global events
      const globalChannel = subscribe('GlobalChannel', {}, {
        received: handleNotification
      })

      return () => {
        unsubscribe('NotificationsChannel')
        unsubscribe('GlobalChannel')
      }
    }
  }, [currentUser, subscription])

  return (
    <>
      <UserMenu />
      <div className="pb-24">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/" element={<Home />} />
          <Route path="/albums/:slug" element={<AlbumShow />} />

          <Route path="/sales" element={<RequireAuth><MySales /></RequireAuth>} />
          <Route path="/purchases" element={<RequireAuth><MyPurchases /></RequireAuth>} />
          <Route path="/articles" element={<ArticlesIndex />} />
          <Route path="/articles/mine" element={<RequireAuth><MyArticles /></RequireAuth>} />
          <Route path="/articles/:id/edit" element={<RequireAuth><EditArticle /></RequireAuth>} />
          <Route path="/articles/:slug" element={<ArticleShow />} />
          <Route path="/events" element={<EventsIndex />} />
          <Route path="/events/mine" element={<RequireAuth><MyEvents /></RequireAuth>} />
          <Route path="/events/:slug" element={<EventShow />} />
          <Route path="/events/:slug/edit" element={<RequireAuth><EventEdit /></RequireAuth>}>
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
          <Route path="/tracks/new" element={<NewTrack />} />
          <Route path="/tracks/:slug" element={<TrackShow />} />
          <Route path="/playlists" element={<PlaylistsIndex />} />
          <Route path="/playlists/:slug" element={<PlaylistShow />} />
          <Route path="/releases" element={<ReleasesList />} />
          <Route path="/releases/new" element={<ReleaseForm />} />
          <Route path="/releases/:id/edit" element={<ReleaseForm />} />
          <Route path="/releases/:id/editor" element={<ReleaseEditor />} />
          <Route path="/releases/:id/preview" element={<ReleasePreview />} />
          <Route path="/releases/:id" element={<ReleasePreview />} />
          <Route path="/albums" element={<AlbumsIndex />} />
          <Route path="/artists" element={<ArtistsIndex />} />
          <Route path="/store" element={<StoreIndex />} />
          <Route path="/store/:type" element={<CategoryView />} />
          <Route path="/:username/products/new" element={<RequireAuth><ProductNew /></RequireAuth>} />
          <Route path="/:username/products/gear/new" element={<RequireAuth><GearForm /></RequireAuth>} />
          <Route path="/:username/products/music/new" element={<RequireAuth><MusicForm /></RequireAuth>} />
          <Route path="/:username/products/merch/new" element={<RequireAuth><MerchForm /></RequireAuth>} />
          <Route path="/:username/products/accessory/new" element={<RequireAuth><AccessoryForm /></RequireAuth>} />
          <Route path="/:username/products/service/new" element={<RequireAuth><ServiceForm /></RequireAuth>} />
          <Route path="/:username/podcasts" element={<PodcastLayout />}>
            <Route index element={<PodcastsIndex />} />
            <Route path=":id" element={<PodcastShow />} />
          </Route>
          <Route path="/:username/about" element={<UserAbout />} />
          <Route path="/:username/links" element={<UserLinks />} />
          <Route path="/:username/settings" element={<MySettings />}>
            <Route index element={<ProfileForm />} />
            <Route path="profile" element={<ProfileForm />} />
            <Route path="email" element={<EmailSettings />} />
            <Route path="notifications" element={<NotificationSettings />} />
            <Route path="social_links" element={<SocialLinksSettings />} />
            <Route path="podcast" element={<PodcastSettings />} />
            <Route path="integrations" element={<IntegrationsSettings />} />
            <Route path="transbank" element={<TransbankSettings />} />
            <Route path="invitations" element={<InvitationsSettings />} />
            <Route path="security" element={<SecuritySettings />} />
          </Route>

          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/failure" element={<CheckoutFailure />} />

          <Route path="/:username/*" element={<UserShow />}>
            <Route index element={<UserHome />} />
            <Route path="tracks" element={<UserTracks />} />
            <Route path="playlists" element={<UserPlaylists namespace="playlists" />} />
            <Route path="articles" element={<UserArticles />} />
            <Route path="reposts" element={<UserReposts />} />
            <Route path="artists" element={<UserArtists />} />
            <Route path="albums" element={<UserPlaylists namespace="albums" />} />
            <Route path="insights" element={<RequireAuth><UserInsights /></RequireAuth>} />
            <Route path="products" element={<UserProducts />} />
            <Route path="products/:slug" element={<ProductShow />} />
          </Route>
        </Routes>
      </div>

        <Toaster />
        <AudioPlayer />

        <Footer/>
    </>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollRestoration />
      <AppContent />
    </BrowserRouter>
  )
}
