import React, { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowUpRight, ImageIcon } from "lucide-react"
import { Skeleton } from "../ui/skeleton"

export default function ProductCard({ product }) {
  const [failedImage, setFailedImage] = useState(null)
  const image = product.cover_url?.store || product.cover_url?.large || product.cover_url?.medium
  const isService = product.type === "Products::ServiceProduct"

  return (
    <Link
      to={product.path}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="relative aspect-square overflow-hidden bg-muted/40">
        {image && failedImage !== image ? (
          <img
            src={image}
            alt={product.title}
            loading="lazy"
            decoding="async"
            onError={() => setFailedImage(image)}
            className={`h-full w-full transition-transform duration-500 motion-safe:group-hover:scale-105 ${isService ? "object-cover" : "object-contain p-3"}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/40">
            <ImageIcon className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 transition-colors group-hover:text-primary">
          {product.title}
        </h3>
        <p className="truncate text-xs text-muted-foreground">{product.user?.username}</p>
        <p className="mt-auto text-base font-bold tracking-tight">
          {product.formatted_price || product.price}
        </p>
      </div>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    </div>
  )
}
