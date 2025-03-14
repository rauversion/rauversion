import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"

export default function TrackSkeleton() {
  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none xl:order-last">
      <div className="bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-row gap-8 items-center">
            <div className="flex-1 w-2/3">
              {/* Header with user info */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0">
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-48" />
                </div>
              </div>

              {/* Waveform player skeleton */}
              <div className="bg-card rounded-lg p-6">
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-md" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cover art skeleton */}
            <div className="w-1/3">
              <Skeleton className="w-full aspect-square rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-end space-x-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-md" />
          ))}
        </div>

        {/* Track info */}
        <div className="mt-6">
          <div className="space-y-4">
            {/* Tags skeleton */}
            <div className="flex flex-wrap gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full" />
              ))}
            </div>

            {/* Description skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="mt-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
