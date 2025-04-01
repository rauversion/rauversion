import React from "react"
import { Skeleton } from "../ui/skeleton"

const ProfileSkeleton = () => {
  return (
    <div className="bg-default text-default min-h-screen">
      {/* Header Skeleton */}
      <div className="relative h-56">
        <Skeleton className="absolute inset-0" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-end space-x-6">
            {/* Avatar Skeleton */}
            <Skeleton className="w-32 h-32 rounded-full border-4 border-default" />
            
            <div className="space-y-4">
              {/* Name Skeleton */}
              <Skeleton className="h-8 w-48" />
              
              {/* Location Skeleton */}
              <Skeleton className="h-4 w-32" />
              
              {/* Stats Skeleton */}
              <div className="mt-4 flex items-center space-x-6">
                <div className="flex sm:flex-row flex-col sm:space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>

                {/* Follow Button Skeleton */}
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Skeleton */}
      <nav className="mb-8 border-b border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation Skeleton */}
          <div className="hidden md:flex space-x-8 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>

          {/* Mobile Navigation Skeleton */}
          <div className="md:hidden py-4">
            <Skeleton className="h-6 w-6" />
          </div>
        </div>
      </nav>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[400px]">
        <div className="flex gap-8">
          {/* Main Content Skeleton */}
          <div className="flex-grow">
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16" />
                  <div className="space-y-2 flex-grow">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="hidden lg:block w-80">
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSkeleton
