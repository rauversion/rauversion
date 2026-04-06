"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import AsyncSelect from "react-select/async"
import { get } from "@rails/request.js"

import selectTheme from "@/components/ui/selectTheme"
import { getUserDisplayName } from "@/utils/userDisplayName"

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
  price?: string
  formatted_price?: string
  category?: string
  user?: ProductUser
  product_images?: ProductImage[]
  photos?: ProductImage[]
}

interface ProductOption {
  value: string
  label: string
  imageUrl: string | null
  subtitle: string | null
  category: string | null
  price: string | null
}

interface ProductSelectorSingleProps {
  onChange: (value: string | null) => void
  value?: string | null
  endpoint?: string | null
  autoFocus?: boolean
  placeholder?: string
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

function resolveProductImage(product?: ProductRecord | null) {
  const firstImage = Array.isArray(product?.product_images) && product.product_images.length > 0
    ? product.product_images[0]
    : Array.isArray(product?.photos) && product.photos.length > 0
      ? product.photos[0]
      : null
  return firstImage?.image_url || firstImage?.url || null
}

function buildProductOption(product?: ProductRecord | null): ProductOption | null {
  const identifier = product?.slug || product?.id

  if (!identifier) return null

  return {
    value: String(identifier),
    label: product?.title || `Producto #${identifier}`,
    imageUrl: resolveProductImage(product),
    subtitle: getUserDisplayName(product?.user) || product?.user?.username || null,
    category: product?.category || null,
    price: product?.formatted_price || product?.price || null,
  }
}

function mergeOptions(previousOptions: ProductOption[], nextOptions: ProductOption[]) {
  const mergedOptions = new Map<string, ProductOption>()

  previousOptions.forEach((option) => {
    mergedOptions.set(option.value, option)
  })

  nextOptions.forEach((option) => {
    mergedOptions.set(option.value, option)
  })

  return Array.from(mergedOptions.values())
}

export default function ProductSelectorSingle({
  onChange,
  value = null,
  endpoint = null,
  autoFocus = false,
  placeholder = "Busca un producto para insertar...",
}: ProductSelectorSingleProps) {
  const currentUsername =
    typeof document === "undefined"
      ? null
      : document.querySelector('meta[name="current-user-id"]')?.getAttribute("content")

  const resolvedEndpoint = useMemo(() => {
    if (endpoint) return endpoint
    if (currentUsername) return `/${currentUsername}/products.json`

    return null
  }, [currentUsername, endpoint])

  const [options, setOptions] = useState<ProductOption[]>([])
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  const hydrateSelectedProduct = useCallback(
    async (productIdentifier: string | null) => {
      if (!productIdentifier) {
        setSelectedOption(null)
        return
      }

      const cachedOption = options.find((option) => option.value === productIdentifier)
      if (cachedOption) {
        setSelectedOption(cachedOption)
        return
      }

      setIsBootstrapping(true)

      try {
        const response = await get(`/products/${encodeURIComponent(productIdentifier)}.json`, {
          responseKind: "json",
        })

        if (!response.ok) {
          setSelectedOption(null)
          return
        }

        const data = await response.json
        const nextOption = buildProductOption(data?.product || data)

        if (nextOption) {
          setOptions((previousOptions) => mergeOptions(previousOptions, [nextOption]))
          setSelectedOption(nextOption)
        } else {
          setSelectedOption(null)
        }
      } catch (_error) {
        setSelectedOption(null)
      } finally {
        setIsBootstrapping(false)
      }
    },
    [options]
  )

  useEffect(() => {
    hydrateSelectedProduct(normalizeProductIdentifier(value))
  }, [hydrateSelectedProduct, value])

  const loadOptions = useCallback(
    async (inputValue: string) => {
      if (!resolvedEndpoint) return []

      setIsLoadingOptions(true)

      try {
        const requestUrl = new URL(resolvedEndpoint, window.location.origin)
        const query = inputValue.trim()

        if (query) {
          requestUrl.searchParams.set("q[title_or_description_cont]", query)
        }

        const response = await get(`${requestUrl.pathname}${requestUrl.search}`, {
          responseKind: "json",
        })

        if (!response.ok) {
          return []
        }

        const data = await response.json
        const nextOptions = (data?.collection || []).map(buildProductOption).filter(Boolean) as ProductOption[]

        setOptions((previousOptions) => mergeOptions(previousOptions, nextOptions))

        return nextOptions
      } catch (_error) {
        return []
      } finally {
        setIsLoadingOptions(false)
      }
    },
    [resolvedEndpoint]
  )

  const handleChange = useCallback(
    (nextSelectedOption: ProductOption | null) => {
      setSelectedOption(nextSelectedOption)
      onChange(nextSelectedOption ? nextSelectedOption.value : null)
    },
    [onChange]
  )

  const customStyles = useMemo(
    () => ({
      control: (provided: Record<string, unknown>, state: { isFocused: boolean }) => ({
        ...provided,
        minHeight: 48,
        borderRadius: 12,
        boxShadow: state.isFocused ? "0 0 0 1px rgb(16 185 129 / 0.4)" : provided.boxShadow,
        borderColor: state.isFocused ? "rgb(16 185 129 / 0.7)" : provided.borderColor,
      }),
      option: (provided: Record<string, unknown>, state: { isFocused: boolean }) => ({
        ...provided,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        backgroundColor: state.isFocused ? "rgb(15 23 42 / 0.08)" : provided.backgroundColor,
      }),
      menuPortal: (provided: Record<string, unknown>) => ({
        ...provided,
        zIndex: 9999,
      }),
      valueContainer: (provided: Record<string, unknown>) => ({
        ...provided,
        paddingTop: 6,
        paddingBottom: 6,
      }),
    }),
    []
  )

  const formatOptionLabel = useCallback((option: ProductOption, { context }: { context: "menu" | "value" }) => {
    const meta = [option.category, option.subtitle, option.price].filter(Boolean).join(" · ")

    if (context === "value") {
      return (
        <div className="flex items-center gap-2">
          {option.imageUrl ? (
            <img src={option.imageUrl} alt={option.label} className="h-7 w-7 rounded-md object-cover" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
              PR
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{option.label}</div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex w-full items-center gap-3">
        {option.imageUrl ? (
          <img src={option.imageUrl} alt={option.label} className="h-10 w-10 rounded-md object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
            PR
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{option.label}</div>
          {meta ? <div className="truncate text-xs text-muted-foreground">{meta}</div> : null}
        </div>
      </div>
    )
  }, [])

  return (
    <div className="w-full">
      <AsyncSelect
        isMulti={false}
        isClearable
        autoFocus={autoFocus}
        cacheOptions
        defaultOptions
        theme={selectTheme}
        value={selectedOption}
        onChange={handleChange}
        loadOptions={loadOptions}
        isLoading={isBootstrapping || isLoadingOptions}
        styles={customStyles}
        formatOptionLabel={formatOptionLabel}
        placeholder={placeholder}
        noOptionsMessage={({ inputValue }: { inputValue: string }) => {
          if (!resolvedEndpoint) return "Necesitas una cuenta activa para elegir productos"
          if (inputValue) return "No encontramos productos con ese nombre"
          return "No hay productos disponibles"
        }}
        loadingMessage={() => "Cargando productos..."}
        className="w-full"
        classNamePrefix="product-selector"
        openMenuOnFocus
        isDisabled={!resolvedEndpoint}
      />
    </div>
  )
}
