import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"

export default function PlaylistSkeleton() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header Section */}
      <div className="relative bg-gradient-to-b from-muted to-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover Art Skeleton */}
            <div className="w-full md:w-[340px] flex-shrink-0">
              <Skeleton className="w-full aspect-square" />
            </div>

            {/* Playlist Info Skeleton */}
            <div className="flex-grow">
              <div className="mb-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-3/4 mb-2" />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
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
      <div className="max-w-7xl mx-auto px-8 pb-4">
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Tracks Section Skeleton */}
      <div className="max-w-7xl mx-auto p-8 pt-4">
        <div className="mb-6 flex justify-between items-center">
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
      <div className="max-w-7xl mx-auto p-8 border-t border-border">
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
