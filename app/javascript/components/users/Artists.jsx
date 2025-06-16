import React, { useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from "@/components/ui/card"
import I18n from '@/stores/locales'
import useAuthStore from '@/stores/authStore'
import useArtistStore from '@/stores/artistStore'
import UserCard from '@/components/shared/userCard'
import { PlusIcon } from 'lucide-react'
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"

export default function UserArtists() {
  const { username } = useParams()
  const { currentUser } = useAuthStore()
  const {
    artist,
  } = useArtistStore()

  const {
    items: childArtists,
    loading,
    lastElementRef,
  } = useInfiniteScroll(`/${username}/artists.json`)

  const isAdmin = currentUser?.id === artist?.id

  if (loading && childArtists.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" aria-label={I18n.t('loading')}></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">


      {isAdmin && (
        <div className="flex justify-end">
          <Link
            to="/account_connections/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {I18n.t('artists.new_connection')}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {childArtists.map((artist, index) => (
          <motion.div
            key={artist.id}
            ref={index === childArtists.length - 1 ? lastElementRef : null}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <UserCard
              artist={artist}
              username={username}
              variant={"rounded"}
              actions={isAdmin ? [
                {
                  label: I18n.t('artists.impersonate'),
                  href: `/account_connections/impersonate?username=${artist.username}`
                },
                {
                  label: I18n.t('artists.disconnect'),
                  onClick: () => {
                    if (window.confirm(I18n.t('artists.disconnect_confirm'))) {
                      fetch(`/account_connections/${artist.id}`, {
                        method: 'DELETE',
                        headers: {
                          'Content-Type': 'application/json',
                          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
                        }
                      }).then(() => {
                        window.location.reload()
                      })
                    }
                  }
                }
              ] : []}
            />
          </motion.div>
        ))}
      </div>

      {loading && childArtists.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" aria-label={I18n.t('loading')}></div>
        </div>
      )}
    </div>
  )
}
