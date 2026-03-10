import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"

export default function PlaylistSkeleton() {
  return (
    <div className="@container/playlist-page min-h-screen bg-background text-foreground">
      {/* Header Section */}
      <div className="relative bg-gradient-to-b from-secondary to-background p-8">
        <div className="mx-auto max-w-7xl @container/playlist-hero">
          <div className="flex items-start gap-4 @sm/playlist-hero:gap-5 @3xl/playlist-hero:gap-6 @4xl/playlist-hero:gap-8">
            {/* Cover Art Skeleton */}
            <div className="w-[112px] flex-shrink-0 @sm/playlist-hero:w-[128px] @md/playlist-hero:w-[144px] @lg/playlist-hero:w-[168px] @2xl/playlist-hero:w-[180px] @3xl/playlist-hero:w-[220px] @4xl/playlist-hero:w-[280px] @5xl/playlist-hero:w-[340px]">
              <Skeleton className="w-full aspect-square" />
            </div>

            {/* Playlist Info Skeleton */}
            <div className="min-w-0 flex-grow">
              <div className="mb-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-3/4 mb-2" />
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 @sm/playlist-hero:gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <Skeleton className="w-24 h-10 rounded-lg" />
                  <Skeleton className="w-32 h-10 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section Skeleton */}
      <div className="mx-auto max-w-7xl px-6 pb-4 @sm/playlist-page:px-8">
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Tracks Section Skeleton */}
      <div className="mx-auto max-w-7xl p-6 pt-4 @sm/playlist-page:p-8 @sm/playlist-page:pt-4">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 @md/playlist-page:flex-row @md/playlist-page:items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>

        <div className="space-y-2">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="w-6 h-4" />
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="w-16 h-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section Skeleton */}
      <div className="mx-auto max-w-7xl border-t border-border p-6 @sm/playlist-page:p-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
