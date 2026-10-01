"use client"

import React, { useEffect, useMemo, useState } from "react"
import { ExternalLink, ShoppingBag } from "lucide-react"

import type { ProductItemBlock as ProductItemBlockType } from "@/lib/blocks/types"
import { Button } from "@/components/ui/button"
import useCartStore from "@/stores/cartStore"
import { cn } from "@/lib/utils"
import { getUserDisplayName } from "@/utils/userDisplayName"
import { get } from "@rails/request.js"

interface ProductImage {
  id?: number | string
  image_url?: string
  url?: string
}

interface ProductUser {
  username?: string
  display_name?: string
  full_name?: string
  first_name?: string
  last_name?: string
  name?: string
}

interface ProductRecord {
  id?: number | string
  slug?: string
  title?: string
  description?: string
  price?: string | number
  formatted_price?: string
  category?: string
  stock_quantity?: number | null
  status?: string
  user?: ProductUser
  product_images?: ProductImage[]
  photos?: ProductImage[]
}

interface ProductItemBlockProps {
  block: ProductItemBlockType
  isEditing?: boolean
}

function normalizeProductIdentifier(value?: string | null) {
  const trimmedValue = value?.trim()
  if (!trimmedValue) return null

  const cleanValue = trimmedValue.split("?")[0].replace(/\/+$/, "")
  const productIndex = cleanValue.lastIndexOf("/products/")

  if (productIndex >= 0) {
    const segments = cleanValue.slice(productIndex).split("/").filter(Boolean)
    return segments[1] || null
  }

  const segments = cleanValue.split("/").filter(Boolean)
  return segments[segments.length - 1] || null
}

function resolveProductImage(image?: ProductImage | null) {
  return image?.image_url || image?.url || null
}

function resolveProductImages(product?: ProductRecord | null) {
  if (Array.isArray(product?.product_images) && product.product_images.length > 0) {
    return product.product_images
  }

  if (Array.isArray(product?.photos) && product.photos.length > 0) {
    return product.photos
  }

  return []
}

function resolveProductHref(product?: ProductRecord | null) {
  if (!product) return null

  if (product.user?.username && product.slug) {
    return `/${product.user.username}/products/${product.slug}`
  }

  if (product.slug) {
    return `/products/${product.slug}`
  }

  if (product.id) {
    return `/products/${product.id}`
  }

  return null
}

function isProductSoldOut(product?: ProductRecord | null) {
  if (!product) return false
  if (product.status && product.status !== "active") return true
  if (typeof product.stock_quantity === "number") return product.stock_quantity <= 0

  return false
}

const shadowClasses = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
} as const

const hoverClasses = {
  none: "",
  lift: "hover:-translate-y-1",
  grow: "hover:scale-[1.02]",
  shadow: "hover:shadow-xl",
} as const

const roundedClasses = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-2xl",
} as const

const aspectRatioClasses = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[21/9]",
} as const

const variantClasses = {
  minimal: {
    wrapper: "flex flex-col",
    imageWrapper: "",
    contentWrapper: "p-5",
    title: "text-lg font-semibold",
    price: "text-xl font-semibold",
    footer: "flex flex-col gap-3 pt-5",
    meta: "text-sm",
  },
  horizontal: {
    wrapper: "flex flex-col @md/product-item:grid @md/product-item:grid-cols-[10rem_minmax(0,1fr)] @md/product-item:items-start",
    imageWrapper: "min-w-0 w-full self-start",
    contentWrapper: "min-w-0 p-4 flex flex-col justify-between",
    title: "line-clamp-2 break-words text-lg font-semibold leading-snug",
    price: "min-w-0 break-words text-xl font-semibold",
    footer: "flex flex-wrap items-center justify-between gap-3 pt-4",
    meta: "truncate text-xs",
  },
  compact: {
    wrapper: "flex flex-col",
    imageWrapper: "",
    contentWrapper: "p-4",
    title: "text-base font-semibold",
    price: "text-lg font-semibold",
    footer: "flex flex-col gap-2 pt-4",
    meta: "text-xs",
  },
  elegant: {
    wrapper: "flex flex-col",
    imageWrapper: "",
    contentWrapper: "p-7 text-center",
    title: "text-3xl font-light tracking-tight",
    price: "text-2xl font-light",
    footer: "flex flex-col items-center gap-3 pt-6",
    meta: "text-sm uppercase tracking-[0.24em]",
  },
} as const

export function ProductItemBlock({ block, isEditing = false }: ProductItemBlockProps) {
  const {
    productId,
    variant,
    backgroundColor,
    borderColor,
    titleColor,
    priceColor,
    textColor,
    buttonText,
    buttonStyle,
    shadow,
    hoverEffect,
    roundedCorners,
    aspectRatio,
    showGallery,
  } = block.props

  const [product, setProduct] = useState<ProductRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const { addToCart } = useCartStore()

  const resolvedIdentifier = useMemo(() => normalizeProductIdentifier(productId), [productId])

  useEffect(() => {
    const fetchProduct = async () => {
      if (!resolvedIdentifier) {
        setProduct(null)
        setError(null)
        setLoading(false)
        setSelectedImageIndex(0)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await get(`/products/${encodeURIComponent(resolvedIdentifier)}.json`, { responseKind: "json" })

        if (!response.ok) {
          throw new Error("No pudimos cargar el producto")
        }

        const data = await response.json
        const nextProduct = data?.product || data

        setProduct(nextProduct)
        setSelectedImageIndex(0)
      } catch (nextError) {
        setProduct(null)
        setError(nextError instanceof Error ? nextError.message : "No pudimos cargar el producto")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [resolvedIdentifier])

  const images = resolveProductImages(product)
  const selectedImage = images[selectedImageIndex] || images[0] || null
  const selectedImageUrl = resolveProductImage(selectedImage)
  const selectedVariant = variantClasses[variant] || variantClasses.minimal
  const productHref = resolveProductHref(product)
  const soldOut = isProductSoldOut(product)
  const buttonLabel = soldOut ? "Agotado" : buttonText || "Agregar al carrito"
  const hasGallery = showGallery && images.length > 1

  const handleAddToCart = async () => {
    if (!product?.id || adding || soldOut || isEditing) return

    setAdding(true)

    try {
      await addToCart(product.id)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return <div className="h-80 animate-pulse rounded-xl border bg-muted/40" />
  }

  if (!resolvedIdentifier || !product) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center">
        <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="font-medium text-foreground">
          {error || "Selecciona un producto para mostrarlo en la página"}
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "overflow-hidden border transition-all duration-300",
        variant === "horizontal" && "@container/product-item",
        shadowClasses[shadow],
        hoverClasses[hoverEffect],
        roundedClasses[roundedCorners]
      )}
      style={{
        backgroundColor,
        borderColor,
      }}
    >
      <div className={selectedVariant.wrapper}>
        <div className={cn("relative overflow-hidden bg-muted/40", aspectRatioClasses[aspectRatio], selectedVariant.imageWrapper)}>
          {selectedImageUrl ? (
            <img
              src={selectedImageUrl}
              alt={product.title || "Producto"}
              className={cn(
                "h-full w-full object-cover transition-transform duration-500 hover:scale-105",
                variant === "horizontal" && "absolute inset-0"
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}

          {product.category ? (
            <div className={cn(
              "absolute left-4 top-4 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm",
              variant === "horizontal" && "left-2 top-2 max-w-[calc(100%-1rem)] truncate px-2"
            )}>
              {product.category}
            </div>
          ) : null}

          {soldOut ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-white">
                Agotado
              </span>
            </div>
          ) : null}
        </div>

        <div className={selectedVariant.contentWrapper}>
          <div>
            <div className={cn("mb-3", variant === "horizontal" && "mb-1", selectedVariant.meta)} style={{ color: textColor }}>
              {getUserDisplayName(product.user)}
            </div>

            <div className={cn("mb-3 flex items-start justify-between gap-3", variant === "horizontal" && "mb-2 gap-2")}>
              <div className="min-w-0">
                {productHref ? (
                  <a
                    href={productHref}
                    className={cn("block transition-opacity hover:opacity-80", selectedVariant.title)}
                    style={{ color: titleColor }}
                    title={variant === "horizontal" ? product.title : undefined}
                  >
                    {product.title}
                  </a>
                ) : (
                  <h3 className={selectedVariant.title} style={{ color: titleColor }} title={variant === "horizontal" ? product.title : undefined}>
                    {product.title}
                  </h3>
                )}
              </div>

              {productHref ? (
                <a
                  href={productHref}
                  className={cn(
                    "inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground",
                    variant === "horizontal" && "h-7 w-7"
                  )}
                  aria-label="Ver producto"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>

            {product.description ? (
              <div
                className={cn(
                  "prose prose-sm max-w-none text-foreground/80",
                  (variant === "compact" || variant === "horizontal") && "line-clamp-3",
                  variant === "horizontal" && "break-words leading-5 [&>*]:my-0"
                )}
                style={{ color: textColor }}
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : null}
          </div>

          <div className={selectedVariant.footer}>
            <div className={selectedVariant.price} style={{ color: priceColor }}>
              {product.formatted_price || product.price}
            </div>

            <div className={cn("flex flex-col gap-3", variant === "horizontal" && "min-w-0 max-w-full")}>
              <Button
                variant={buttonStyle === "outline" ? "outline" : "default"}
                onClick={handleAddToCart}
                disabled={adding || soldOut || isEditing}
                className={cn(
                  "w-full",
                  (variant === "compact" || variant === "horizontal") && "h-9 text-sm",
                  variant === "horizontal" && "min-w-0 max-w-full",
                  variant === "elegant" ? "rounded-full px-8 uppercase tracking-[0.2em]" : ""
                )}
              >
                <span className={variant === "horizontal" ? "truncate" : undefined}>{adding ? "Agregando..." : buttonLabel}</span>
              </Button>

              {hasGallery ? (
                <div className={cn("flex flex-wrap gap-2", variant === "horizontal" && "flex-nowrap overflow-x-auto p-1")}>
                  {images.map((image, index) => (
                    <button
                      key={`${image.id || index}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={cn(
                        "h-12 w-12 overflow-hidden border transition-all",
                        variant === "horizontal" && "h-10 w-10 shrink-0",
                        roundedClasses[roundedCorners],
                        index === selectedImageIndex ? "border-primary ring-2 ring-primary/20" : "border-border"
                      )}
                    >
                      {resolveProductImage(image) ? (
                        <img
                          src={resolveProductImage(image) || ""}
                          alt={`${product.title || "Producto"} ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
