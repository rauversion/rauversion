import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import I18n from '@/stores/locales'
import useAuthStore from '@/stores/authStore'
import UserCard from '@/components/shared/userCard'

export default function UserArtists() {
  const { username } = useParams()
  const [label, setLabel] = useState(null)

  const {
    items: artists,
    loading,
    lastElementRef
  } = useInfiniteScroll(`/${username}/artists.json`, (data) => {
    if (!label && data.label) {
      setLabel(data.label)
    }
  })

  if (loading && artists.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" aria-label={I18n.t('loading')}></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {label && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative"
        >
          <Card className="relative h-[200px] overflow-hidden border-0 bg-black">
            <div className="absolute inset-0 opacity-30">
              <img
                src={label.avatar_url.medium}
                alt=""
                className="h-full w-full object-cover filter blur-sm scale-110"
              />
            </div>
            
            <div className="relative h-full flex items-center p-8">
              <div className="space-y-2">
                <h2 className="text-5xl font-black tracking-tight text-white uppercase" title={I18n.t('users.artist_page.label.name', { name: label.full_name })}>
                  {label.full_name}
                </h2>
                <p className="text-2xl font-mono text-gray-400" title={I18n.t('users.artist_page.label.username', { username: label.username })}>
                  @{label.username}
                </p>
              </div>
            </div>
          </Card>

        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist, index) => (
          <motion.div
            key={artist.id}
            ref={index === artists.length - 1 ? lastElementRef : null}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <UserCard artist={artist} username={username} />
           
          </motion.div>
        ))}
      </div>

      {loading && artists.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" aria-label={I18n.t('loading')}></div>
        </div>
      )}
    </div>
  )
}
