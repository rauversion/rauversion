"use client"
import React, { useState, useEffect } from "react"
import { ShoppingCart } from "lucide-react"
import type { BlockDefinition, BlockRendererProps, PropertyEditorProps } from "./types"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { get } from "@rails/request.js"
import AsyncSelect from "react-select/async"

const VARIANTS = [
  { label: "Minimal", value: "minimal" },
  { label: "Horizontal", value: "horizontal" },
  { label: "Compact", value: "compact" },
  { label: "Elegant", value: "elegant" }
]

const SHADOWS = [
  { label: "None", value: "none" },
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" }
]

const HOVERS = [
  { label: "None", value: "none" },
  { label: "Lift", value: "lift" },
  { label: "Grow", value: "grow" },
  { label: "Shadow", value: "shadow" }
]

const ROUNDED = [
  { label: "None", value: "none" },
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
  { label: "Extra Large", value: "full" }
]

const ASPECTS = [
  { label: "Square (1:1)", value: "square" },
  { label: "Video (16:9)", value: "video" },
  { label: "Portrait (3:4)", value: "portrait" },
  { label: "Wide (16:9)", value: "wide" }
]

// Product selector for property editor.
function ProductSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // react-select expects value as { value, label }
  const [selected, setSelected] = useState<{ value: string; label: string } | null>(null);

  // Fetch the label for the selected value on mount or when value changes
  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    const fetchLabel = async () => {
      const userId = document.querySelector('meta[name="current-user-id"]')?.getAttribute("content");
      if (!userId) return;
      const response = await get(`/${userId}/products.json`);
      if (response.success) {
        const data = await response.json;
        const found = data.collection.find((p: any) => p.slug === value);
        if (found) setSelected({ value: found.slug, label: found.title });
      }
    };
    fetchLabel();
  }, [value]);

  const loadOptions = async (inputValue: string) => {
    const userId = document.querySelector('meta[name="current-user-id"]')?.getAttribute("content");
    if (!userId) return [];
    const response = await get(`/${userId}/products.json?search=${encodeURIComponent(inputValue)}`);

    if (response.ok) {
      const data = await response.json;

      return data.collection.map((product: any) => ({
        value: product.slug,
        label: product.title
      }));
    } else {
      return [];
    }
  };

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions
      value={selected}
      loadOptions={loadOptions}
      onChange={(option: any) => {
        setSelected(option);
        onChange(option ? option.value : "");
      }}
      isClearable
      placeholder="Select a product..."
      styles={{
        container: (base) => ({ ...base, minWidth: 0 }),
        menu: (base) => ({ ...base, zIndex: 100 }),
      }}
    />
  );
}

export const productCardBlock: BlockDefinition = {
  type: "productCard",
  label: "Product Card",
  icon: <ShoppingCart size={16} />,
  defaultProperties: {
    productId: "",
    variant: "minimal",
    shadow: "sm",
    hoverEffect: "lift",
    roundedCorners: "lg",
    aspectRatio: "square",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    titleColor: "#111827",
    priceColor: "#111827",
    textColor: "#6B7280",
    buttonText: "Add to Cart",
    buttonStyle: "outline",
    showGallery: true,
    className: ""
  },
  render: ({ block }: BlockRendererProps) => {
    const {
      productId,
      variant,
      shadow,
      hoverEffect,
      roundedCorners,
      aspectRatio,
      backgroundColor,
      borderColor,
      titleColor,
      priceColor,
      textColor,
      buttonText,
      buttonStyle,
      showGallery,
      className
    } = block.properties

    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState<any>(null)
    const [adding, setAdding] = useState(false)

    useEffect(() => {
      const fetchProduct = async () => {
        setLoading(true)
        try {
          if (!productId) {
            setProduct(null)
            setLoading(false)
            return
          }
          const response = await get(`/products/${productId}.json`)
          if (response.ok) {
            const data = await response.json
            setProduct(data.product)
            if (data.product.photos?.length > 0) {
              setSelectedImage(data.product.photos[0])
            }
          }
        } catch (e) {
          setProduct(null)
        } finally {
          setLoading(false)
        }
      }
      fetchProduct()
    }, [productId])

    const buttonClasses =
      buttonStyle === "outline"
        ? "border border-primary text-primary bg-white hover:bg-primary/10"
        : "bg-primary text-white hover:bg-primary/90"

    const getShadowClass = () => {
      switch (shadow) {
        case "none":
          return ""
        case "sm":
          return "shadow-sm"
        case "md":
          return "shadow-md"
        case "lg":
          return "shadow-lg"
        default:
          return "shadow"
      }
    }

    const getHoverClass = () => {
      switch (hoverEffect) {
        case "none":
          return ""
        case "lift":
          return "hover:-translate-y-1"
        case "grow":
          return "hover:scale-105"
        case "shadow":
          return "hover:shadow-lg"
        default:
          return ""
      }
    }

    const getRoundedClass = () => {
      switch (roundedCorners) {
        case "none":
          return ""
        case "sm":
          return "rounded-sm"
        case "md":
          return "rounded-md"
        case "lg":
          return "rounded-lg"
        case "full":
          return "rounded-xl"
        default:
          return "rounded"
      }
    }

    const getAspectRatioClass = () => {
      switch (aspectRatio) {
        case "square":
          return "aspect-square"
        case "video":
          return "aspect-video"
        case "portrait":
          return "aspect-[3/4]"
        case "wide":
          return "aspect-[16/9]"
        default:
          return ""
      }
    }

    const variants: any = {
      minimal: {
        wrapper: "flex flex-col",
        imageWrapper: "relative overflow-hidden",
        contentWrapper: "p-4",
        title: "text-lg font-semibold mb-2",
        price: "text-lg font-bold",
        button: "mt-4 w-full"
      },
      horizontal: {
        wrapper: "flex flex-row",
        imageWrapper: "w-1/3 relative overflow-hidden",
        contentWrapper: "w-2/3 p-6 flex flex-col justify-between",
        title: "text-xl font-bold mb-2",
        price: "text-xl font-bold",
        button: "mt-4"
      },
      compact: {
        wrapper: "flex flex-col",
        imageWrapper: "relative overflow-hidden",
        contentWrapper: "p-3",
        title: "text-base font-medium mb-1",
        price: "text-base font-semibold",
        button: "mt-2 text-sm py-1"
      },
      elegant: {
        wrapper: "flex flex-col",
        imageWrapper: "relative overflow-hidden group",
        contentWrapper: "p-6 text-center",
        title: "text-2xl font-light mb-3",
        price: "text-2xl font-light",
        button: "mt-4 uppercase tracking-wide text-sm"
      }
    }

    const selectedVariant = variants[variant] || variants.minimal

    if (loading) {
      return <div className="animate-pulse bg-muted rounded-lg h-96"></div>
    }

    if (!product) {
      return <div className="text-center text-muted">Please select a product</div>
    }

    return (
      <div className={className || ""}>
        <div
          className={cn(
            selectedVariant.wrapper,
            getShadowClass(),
            getHoverClass(),
            getRoundedClass(),
            "overflow-hidden transition-all duration-300 border"
          )}
          style={{
            backgroundColor,
            borderColor
          }}
        >
          <div className={cn(selectedVariant.imageWrapper, getAspectRatioClass())}>
            <img
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              src={selectedImage?.url || product.photos?.[0]?.url}
              alt={product.title}
            />
            {showGallery && product.photos?.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 flex gap-2 overflow-x-auto">
                {product.photos.map((image: any) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(image)}
                    className={cn(
                      "flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-colors",
                      selectedImage?.id === image.id ? "border-white" : "border-transparent"
                    )}
                  >
                    <img
                      src={image.url}
                      alt={`${product.title} - Image ${image.id}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={selectedVariant.contentWrapper}>
            {product.category && (
              <div className="mb-2">
                <span
                  className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-gray-100"
                  style={{ color: textColor }}
                >
                  {product.category}
                </span>
              </div>
            )}
            <h3 className={selectedVariant.title}>
              <a className="hover:underline" href={`/products/${product.slug}`} style={{ color: titleColor }}>
                {product.title}
              </a>
            </h3>
            <div className="text-sm mt-2" style={{ color: textColor }}>
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
            <div
              className={cn(
                "flex mt-4",
                variant === "horizontal" ? "items-center justify-between" : "flex-col items-center"
              )}
            >
              <span className={selectedVariant.price} style={{ color: priceColor }}>
                ${product.price}
              </span>
              <Button
                className={cn(buttonClasses, selectedVariant.button)}
                disabled={adding}
                onClick={() => setAdding(true)}
              >
                {adding ? "Adding..." : buttonText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  },
  propertyEditor: ({ properties, onChange }: PropertyEditorProps) => {
    return (
      <div className="space-y-4">
        <div>
          <Label>Select Product</Label>
          <ProductSelector value={properties.productId} onChange={(v) => onChange("productId", v)} />
        </div>
        <div>
          <Label>Variant</Label>
          <Select value={properties.variant} onValueChange={(v) => onChange("variant", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select variant" />
            </SelectTrigger>
            <SelectContent>
              {VARIANTS.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Shadow</Label>
          <Select value={properties.shadow} onValueChange={(v) => onChange("shadow", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select shadow" />
            </SelectTrigger>
            <SelectContent>
              {SHADOWS.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Hover Effect</Label>
          <Select value={properties.hoverEffect} onValueChange={(v) => onChange("hoverEffect", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select hover effect" />
            </SelectTrigger>
            <SelectContent>
              {HOVERS.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Rounded Corners</Label>
          <Select value={properties.roundedCorners} onValueChange={(v) => onChange("roundedCorners", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select rounded" />
            </SelectTrigger>
            <SelectContent>
              {ROUNDED.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Aspect Ratio</Label>
          <Select value={properties.aspectRatio} onValueChange={(v) => onChange("aspectRatio", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select aspect ratio" />
            </SelectTrigger>
            <SelectContent>
              {ASPECTS.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Background Color</Label>
          <Input
            value={properties.backgroundColor}
            onChange={(e) => onChange("backgroundColor", e.target.value)}
            placeholder="#FFFFFF"
            type="text"
          />
        </div>
        <div>
          <Label>Border Color</Label>
          <Input
            value={properties.borderColor}
            onChange={(e) => onChange("borderColor", e.target.value)}
            placeholder="#E5E7EB"
            type="text"
          />
        </div>
        <div>
          <Label>Title Color</Label>
          <Input
            value={properties.titleColor}
            onChange={(e) => onChange("titleColor", e.target.value)}
            placeholder="#111827"
            type="text"
          />
        </div>
        <div>
          <Label>Price Color</Label>
          <Input
            value={properties.priceColor}
            onChange={(e) => onChange("priceColor", e.target.value)}
            placeholder="#111827"
            type="text"
          />
        </div>
        <div>
          <Label>Text Color</Label>
          <Input
            value={properties.textColor}
            onChange={(e) => onChange("textColor", e.target.value)}
            placeholder="#6B7280"
            type="text"
          />
        </div>
        <div>
          <Label>Button Text</Label>
          <Input
            value={properties.buttonText}
            onChange={(e) => onChange("buttonText", e.target.value)}
            placeholder="Add to Cart"
            type="text"
          />
        </div>
        <div>
          <Label>Button Style</Label>
          <Select value={properties.buttonStyle} onValueChange={(v) => onChange("buttonStyle", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select button style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Solid</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="showGallery"
            checked={!!properties.showGallery}
            onCheckedChange={(v) => onChange("showGallery", v)}
          />
          <Label htmlFor="showGallery">Show Image Gallery</Label>
        </div>
        <div>
          <Label>Root Classes</Label>
          <Input
            value={properties.className}
            onChange={(e) => onChange("className", e.target.value)}
            placeholder="Custom classes"
            type="text"
          />
        </div>
      </div>
    )
  }
}
