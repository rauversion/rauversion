import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom'
import SalesProductShow from './sales/ProductShow'
import PagesTable from './pages/PagesTable'
import PagesEditor from './pages/PagesEditor'
import PagesShow from './pages/PagesShow'
import useAuthStore from '@/stores/authStore'
import { useActionCable } from '../hooks/useActionCable'
import ArticlesIndex from './articles/Index'
import ArticleShow from './articles/Show'
import UserMenu from './shared/UserMenu'
import AudioPlayer from './audio_player'
import Login from './auth/Login'
import Register from './auth/Register'
import ForgotPassword from './auth/ForgotPassword'
import AcceptInvitation from './users/AcceptInvitation'
import TrackShow from './tracks/Show'
import TracksIndex from './tracks/Index'
import Home from './home/Index'
import PlaylistsIndex from './playlists/Index'
import PlaylistShow from './playlists/Show'
import UserShow from './users/Show'
import UserTracks from './users/Tracks'
import EventShow from './events/Show'
import EventsIndex from './events/Index'
import EventTicketShow from './event_tickets/EventTicketShow'
import UserPlaylists from './users/Playlists'
import UserArticles from './users/Articles'
import UserReposts from './users/Reposts'
import UserArtists from './users/Artists'
import ArtistsIndex from './artists/Index'
import AccountConnectionForm from './artists/AccountConnectionForm'
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
import PressKitPage from './press_kit/PressKitPage'
import EventEdit from "./events/EventEdit"
import Overview from "./events/sections/Overview"
import Schedule from "./events/sections/Schedule"
import Teams from "./events/sections/Teams"
import Tickets from "./events/sections/Tickets"
import EventLists from "./events/sections/EventLists"
import Streaming from "./events/sections/Streaming"
import Attendees from "./events/sections/Attendees"
import Recordings from "./events/sections/Recordings"
import Reports from "./events/sections/Reports"
import Settings from "./events/sections/Settings"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from '@/hooks/use-toast'

import MySales from "./sales/MySales"
import MyPurchases from "./purchases/MyPurchases"
import MySettings from "./users/MySettings"
import SearchView from "./search/SearchView"

import ProfileForm from "./users/settings/ProfileForm"
import EmailSettings from "./users/settings/EmailSettings"
import NotificationSettings from "./users/settings/NotificationSettings"
import SocialLinksSettings from "./users/settings/SocialLinksSettings"
import PodcastSettings from "./users/settings/PodcastSettings"
import IntegrationsSettings from "./users/settings/IntegrationsSettings"
import StripeSettings from "./users/settings/StripeSettings"
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
import ProductEdit from "./products/Edit"
import GearForm from "./products/gear/Form"
import MusicForm from "./products/music/Form"
import MerchForm from "./products/merch/Form"
import AccessoryForm from "./products/accessory/Form"
import ServiceForm from "./products/service/Form"
import AlbumShow from "./albums/AlbumShow"
import { ServiceBookings } from "./ServiceBookings"
import { ServiceBookingDetail } from "./ServiceBookings/ServiceBookingDetail"
import NewTrack from "./tracks/NewTrack"
import CategoryView from "./store/CategoryView"
import { InterestAlertDemo } from "./shared/alerts"

import CheckoutSuccess from "./checkout/CheckoutSuccess"
import CheckoutFailure from "./checkout/CheckoutFailure"
import EventCheckoutSuccess from "./checkout/EventCheckoutSuccess"
import ConversationsIndex from "./messaging/ConversationsIndex"
import NewConversation from "./messaging/NewConversation"

import CoursesAdminPage from "./courses/CoursesAdminPage"
import CoursesIndex from "./courses/index"
import CourseShow from "./courses/show"
import CourseForm from "./courses/form"
import LessonShow from "./courses/lessonShow"

import SpinningVideo from "./spinning-video"


import { Footer, ScrollRestoration, LoadingSpinner } from '@/components/shared'

import { useLocaleStore } from "@/stores/locales"

function RequireAuth({ children }) {
  const { currentUser, loading: currentUserLoading } = useAuthStore()
  const location = useLocation()

  if (currentUserLoading) {
    return <LoadingSpinner />
  }

  if (!currentUser && !currentUserLoading) {
    return <Navigate to="/users/sign_in" state={{ from: location }} replace />
  }

  return children
}

function AppContent() {
  const { currentUser } = useAuthStore()
  const { subscribe, unsubscribe, subscription } = useActionCable()
  const { toast } = useToast()
  const { currentLocale } = useLocaleStore()
  const location = useLocation()

  useEffect(() => {
    const flashElement = document.getElementById('flash-messages')
    if (flashElement) {
      try {
        const flashMessages = JSON.parse(flashElement.textContent || '{}')
        Object.entries(flashMessages).forEach(([type, message]) => {
          toast({
            description: message,
            variant: type === 'error' ? 'destructive' : undefined
          })
        })
      } catch (e) {
        console.error('Error parsing flash messages:', e)
      }
    }
  }, [toast])

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

  console.info("LOCATION: ", location)

  return (
    <>
      <UserMenu />
      <div className="pb-24">
        <Routes>
          <Route path="/pages" element={<RequireAuth> <PagesTable /></RequireAuth>} />
          <Route path="/pages/:id/edit" element={<RequireAuth> <PagesEditor /></RequireAuth>} />
          <Route path="/pages/:slug" element={<PagesShow />} />

          <Route path="/users/sign_in" element={<Login />} />
          <Route path="/users/sign_up" element={<Register />} />
          <Route path="/users/invitation/accept" element={<AcceptInvitation />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />


          <Route path="/" element={<Home />} />
          <Route path="/albums/:slug" element={<AlbumShow />} />

          <Route path="/courses" element={<CoursesIndex />} />

          <Route path="/courses/new" element={<RequireAuth> <CourseForm /> </RequireAuth>} />
          <Route path="/courses/:id/edit" element={<RequireAuth> <CourseForm /> </RequireAuth>} />
          <Route path="/courses/mine" element={<RequireAuth> <CoursesAdminPage /> </RequireAuth>} />
          <Route path="/courses/:id" element={<CourseShow />} />
          <Route path="/courses/:id/lessons/:lesson_id" element={<LessonShow />} />

          <Route path="/sales" element={<RequireAuth><MySales /></RequireAuth>} />
          <Route path="/sales/:id/product_show" element={<RequireAuth><SalesProductShow /></RequireAuth>} />
          <Route path="/purchases" element={<RequireAuth><MyPurchases /></RequireAuth>} />
          <Route path="/purchases/:tab" element={<RequireAuth><MyPurchases /></RequireAuth>} />
          <Route path="/articles" element={<ArticlesIndex />} />
          <Route path="/articles/c/:categorySlug" element={<ArticlesIndex />} />

          <Route path="/articles/mine" element={<RequireAuth><MyArticles /></RequireAuth>} />
          <Route path="/articles/:id/edit" element={<RequireAuth><EditArticle /></RequireAuth>} />
          <Route path="/articles/:slug/preview" element={<ArticleShow preview={true} />} />
          <Route path="/articles/:slug" element={<ArticleShow />} />

          <Route path="/events" element={<EventsIndex />} />
          <Route path="/events/mine" element={<RequireAuth><MyEvents /></RequireAuth>} />
          <Route path="/events/:slug" element={<EventShow />} />
          <Route path="/events/:slug/edit" element={<RequireAuth><EventEdit /></RequireAuth>}>
            <Route index element={<Overview />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="teams" element={<Teams />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="email-lists" element={<EventLists />} />
            <Route path="streaming" element={<Streaming />} />
            <Route path="attendees" element={<Attendees />} />
            <Route path="recordings" element={<Recordings />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="/events/:slug/event_purchases/:purchase_id/failure" element={<CheckoutFailure />} />
          <Route path="/events/:slug/event_purchases/:purchase_id/success" element={<EventCheckoutSuccess />} />
          <Route path="/events/:slug/event_tickets/:id" element={<EventTicketShow />} />

          <Route path="/turn" element={<SpinningVideo />} />
          <Route path="/tracks" element={<TracksIndex />} />
          <Route path="/tracks/new" element={<NewTrack />} />
          <Route path="/tracks/:slug" element={<TrackShow />} />
          <Route path="/playlists" element={<PlaylistsIndex />} />
          <Route path="/playlists/:slug" element={<PlaylistShow />} />
          <Route path="/releases" element={<ReleasesList />} />
          <Route path="/releases/new" element={<ReleaseForm />} />
          <Route path="/releases/:id/edit" element={<ReleaseForm />} />
          <Route path="/releases/:id/editor" key="release-editor" element={<ReleaseEditor key={"release-editor"} />} />

          <Route path="/releases/:id/preview" element={<ReleasePreview />} />
          <Route path="/releases/:id" element={<ReleasePreview />} />
          <Route path="/albums" element={<AlbumsIndex />} />
          <Route path="/artists" element={<ArtistsIndex />} />
          <Route path="/store" element={<StoreIndex />} />
          <Route path="/store/:type" element={<CategoryView />} />
          <Route path="/demo/alerts" element={<InterestAlertDemo />} />
          <Route path="/:username/products/new" element={<RequireAuth><ProductNew /></RequireAuth>} />
          <Route path="/:username/products/gear/new" element={<RequireAuth><GearForm /></RequireAuth>} />
          <Route path="/:username/products/music/new" element={<RequireAuth><MusicForm /></RequireAuth>} />
          <Route path="/:username/products/merch/new" element={<RequireAuth><MerchForm /></RequireAuth>} />
          <Route path="/:username/products/accessory/new" element={<RequireAuth><AccessoryForm /></RequireAuth>} />
          <Route path="/:username/products/service/new" element={<RequireAuth><ServiceForm /></RequireAuth>} />
          <Route path="/:username/products/:slug/edit" element={<RequireAuth><ProductEdit /></RequireAuth>} />
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
            <Route path="stripe" element={<StripeSettings />} />
            <Route path="transbank" element={<TransbankSettings />} />
            <Route path="invitations" element={<InvitationsSettings />} />
            <Route path="security" element={<SecuritySettings />} />
          </Route>

          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/failure" element={<CheckoutFailure />} />

          <Route path="/conversations" element={<RequireAuth><ConversationsIndex /></RequireAuth>} />
          <Route path="/conversations/new" element={<RequireAuth><NewConversation /></RequireAuth>} />
          <Route path="/conversations/:conversationId" element={<RequireAuth><ConversationsIndex /></RequireAuth>} />

          <Route path="/search" element={<SearchView />} />
          <Route path="/service_bookings" element={<RequireAuth><ServiceBookings /></RequireAuth>} />
          <Route path="/service_bookings/:id" element={<RequireAuth><ServiceBookingDetail /></RequireAuth>} />
          <Route path="/account_connections/new" element={<RequireAuth><AccountConnectionForm /></RequireAuth>} />

          <Route path="/:username/press-kit" element={<PressKitPage />} />

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

      {
        !location.pathname.includes('edit') &&
        !location.pathname.includes('new') &&
        !location.pathname.includes('editor') &&
        !location.pathname.includes('preview') &&
        !location.pathname.includes('albums') &&
        !location.pathname.includes('page-builder') &&
        !location.pathname.includes('conversations') &&
        !location.pathname.includes('press-kit') &&
        (
          <Footer />
        )
      }
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
