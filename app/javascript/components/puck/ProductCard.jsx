import React, { useState, useEffect } from 'react';
import { get, post } from '@rails/request.js';
import ColorPicker from './ColorPicker';
import CheckboxField from './CheckboxField';
import Select from 'react-select';
import useCartStore from '@/stores/cartStore'
import I18n from '@/stores/locales'
import { mergeVariantClasses } from "./ClassField";

const ProductSelector = ({ value, onChange }) => {
  const [products, setProducts] = useState([]);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const userId = document.querySelector('meta[name="current-user-id"]')?.content;
        if (!userId) return;

        const response = await get(`/${userId}/products.json`);
        if (response.ok) {
          const data = await response.json;
          setProducts(data.collection.map(product => ({
            value: product.slug,
            label: product.title,
            ...product
          })));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <Select
      value={products.find(p => p.value === value)}
      onChange={(option) => onChange(option?.value)}
      options={products}
      isSearchable
      isClearable
      className="basic-single"
      classNamePrefix="select"
      placeholder="Select a product..."
      noOptionsMessage={() => "No products found"}
    />
  );
};

const ProductCard = ({
  backgroundColor,
  borderColor,
  titleColor,
  priceColor,
  textColor,
  buttonText,
  buttonStyle,
  imageHeight,
  showGallery,
  productId,
  className,
  variant,
  shadow,
  hoverEffect,
  roundedCorners,
  aspectRatio
}) => {
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [userId, setUserId] = useState(null);
  const [product, setProduct] = useState(null);
  const { addToCart } = useCartStore()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // const u = document.querySelector('meta[name="current-user-id"]')?.content;
        // setUserId(u);
        if (!productId) {
          setLoading(false);
          return;
        }

        const response = await get(`/products/${productId}.json`);
        if (response.ok) {
          const data = await response.json;
          setProduct(data.product);
          if (data.photos?.length > 0) {
            setSelectedImage(data.photos[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product || adding) return;

    setAdding(true);
    try {
      addToCart(product.id)
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-muted rounded-lg h-96"></div>;
  }

  if (!product) {
    return <div className="text-center text-muted">Please select a product</div>;
  }

  const buttonClasses = buttonStyle === 'outline'
    ? 'button-large-outline transition-colors duration-200'
    : 'button-large transition-colors duration-200';

  // mergeVariantClasses is now imported from VariantField
  const getShadowClass = () =>
    mergeVariantClasses(shadow, (val) => {
      switch (val) {
        case "none": return "";
        case "sm": return "shadow-sm";
        case "md": return "shadow-md";
        case "lg": return "shadow-lg";
        default: return "shadow";
      }
    });

  const getHoverClass = () =>
    mergeVariantClasses(hoverEffect, (val) => {
      switch (val) {
        case "none": return "";
        case "lift": return "hover:-translate-y-1";
        case "grow": return "hover:scale-105";
        case "shadow": return "hover:shadow-lg";
        default: return "";
      }
    });

  const getRoundedClass = () =>
    mergeVariantClasses(roundedCorners, (val) => {
      switch (val) {
        case "none": return "";
        case "sm": return "rounded-sm";
        case "md": return "rounded-md";
        case "lg": return "rounded-lg";
        case "full": return "rounded-xl";
        default: return "rounded";
      }
    });

  const getAspectRatioClass = () =>
    mergeVariantClasses(aspectRatio, (val) => {
      switch (val) {
        case "square": return "aspect-square";
        case "video": return "aspect-video";
        case "portrait": return "aspect-[3/4]";
        case "wide": return "aspect-[16/9]";
        default: return "";
      }
    });

  const variants = {
    minimal: {
      wrapper: 'flex flex-col',
      imageWrapper: 'relative overflow-hidden',
      contentWrapper: 'p-4',
      title: 'text-lg font-semibold mb-2',
      price: 'text-lg font-bold',
      button: 'mt-4 w-full',
    },
    horizontal: {
      wrapper: 'flex flex-row',
      imageWrapper: 'w-1/3 relative overflow-hidden',
      contentWrapper: 'w-2/3 p-6 flex flex-col justify-between',
      title: 'text-xl font-bold mb-2',
      price: 'text-xl font-bold',
      button: 'mt-4',
    },
    compact: {
      wrapper: 'flex flex-col',
      imageWrapper: 'relative overflow-hidden',
      contentWrapper: 'p-3',
      title: 'text-base font-medium mb-1',
      price: 'text-base font-semibold',
      button: 'mt-2 text-sm py-1',
    },
    elegant: {
      wrapper: 'flex flex-col',
      imageWrapper: 'relative overflow-hidden group',
      contentWrapper: 'p-6 text-center',
      title: 'text-2xl font-light mb-3',
      price: 'text-2xl font-light',
      button: 'mt-4 uppercase tracking-wide text-sm',
    }
  };

  const selectedVariant = variants[variant] || variants.minimal;

  console.log('valuande', variants, variant)
  return (
    <div className={`${className || ''}`}>
      <div
        className={`
          ${selectedVariant.wrapper}
          ${getShadowClass()}
          ${getHoverClass()}
          ${getRoundedClass()}
          overflow-hidden
          transition-all duration-300
          border
        `}
        style={{
          backgroundColor,
          borderColor,
        }}
      >
        <div className={`${selectedVariant.imageWrapper} ${getAspectRatioClass()}`}>
          <img
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={selectedImage?.url || product.photos[0]?.url}
            alt={product.title}
          />
          {showGallery && product.photos?.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 flex gap-2 overflow-x-auto">
              {product.photos.map((image) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-colors ${selectedImage?.id === image.id ? 'border-white' : 'border-transparent'
                    }`}
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
            <a
              className="hover:underline"
              href={`/${product?.user?.username}/products/${product.slug}`}
              style={{ color: titleColor }}
            >
              {product.title}
            </a>
          </h3>

          <div
            className="text-sm mt-2"
            style={{ color: textColor }}
          >
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>

          <div className={`flex ${variant === 'horizontal' ? 'items-center justify-between' : 'flex-col items-center'} mt-4`}>
            <span
              className={selectedVariant.price}
              style={{ color: priceColor }}
            >
              ${product.price}
            </span>
            <button
              className={`${buttonClasses} ${selectedVariant.button}`}
              onClick={handleAddToCart}
              disabled={adding}
            >
              {adding ? 'Adding...' : buttonText || I18n.t("products.add_to_cart")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const config = {
  fields: {
    productId: {
      type: "custom",
      label: "Select Product",
      render: ProductSelector
    },
    variant: {
      type: "select",
      label: "Layout Variant",
      options: [
        { label: "Minimal", value: "minimal" },
        { label: "Horizontal", value: "horizontal" },
        { label: "Compact", value: "compact" },
        { label: "Elegant", value: "elegant" }
      ],
      defaultValue: "minimal",
    },
    shadow: {
      type: "custom",
      label: "Shadow",
      render: (props) => (
        require("./ClassField").default({
          ...props,
          type: "select",
          label: "Shadow",
          options: [
            { label: "None", value: "none" },
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" }
          ]
        })
      ),
      defaultValue: { mobile: "sm", tablet: "", desktop: "" },
    },
    hoverEffect: {
      type: "custom",
      label: "Hover Effect",
      render: (props) => (
        require("./ClassField").default({
          ...props,
          type: "select",
          label: "Hover Effect",
          options: [
            { label: "None", value: "none" },
            { label: "Lift", value: "lift" },
            { label: "Grow", value: "grow" },
            { label: "Shadow", value: "shadow" }
          ]
        })
      ),
      defaultValue: { mobile: "lift", tablet: "", desktop: "" },
    },
    roundedCorners: {
      type: "custom",
      label: "Rounded Corners",
      render: (props) => (
        require("./ClassField").default({
          ...props,
          type: "select",
          label: "Rounded Corners",
          options: [
            { label: "None", value: "none" },
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
            { label: "Extra Large", value: "full" }
          ]
        })
      ),
      defaultValue: { mobile: "lg", tablet: "", desktop: "" },
    },
    aspectRatio: {
      type: "custom",
      label: "Image Aspect Ratio",
      render: (props) => (
        require("./ClassField").default({
          ...props,
          type: "select",
          label: "Image Aspect Ratio",
          options: [
            { label: "Square (1:1)", value: "square" },
            { label: "Video (16:9)", value: "video" },
            { label: "Portrait (3:4)", value: "portrait" },
            { label: "Wide (16:9)", value: "wide" }
          ]
        })
      ),
      defaultValue: { mobile: "square", tablet: "", desktop: "" },
    },
    className: {
      type: "text",
      label: "Root Classes",
      defaultValue: "",
      description: "Add custom classes to the root element"
    },
    backgroundColor: {
      type: "custom",
      label: "Background Color",
      render: (props) => (
        require("./ClassField").default({
          ...props,
          type: "color",
          render: ColorPicker,
          label: "Background Color"
        })
      ),
      defaultValue: { mobile: "#FFFFFF", tablet: "", desktop: "" },
    },
    borderColor: {
      type: "custom",
      label: "Border Color",
      render: ColorPicker,
    },
    titleColor: {
      type: "custom",
      label: "Title Color",
      render: ColorPicker,
    },
    priceColor: {
      type: "custom",
      label: "Price Color",
      render: ColorPicker,
    },
    textColor: {
      type: "custom",
      label: "Text Color",
      render: ColorPicker,
    },
    buttonText: {
      type: "text",
      label: "Button Text",
    },
    buttonStyle: {
      type: "select",
      label: "Button Style",
      options: [
        { label: "Solid", value: "solid" },
        { label: "Outline", value: "outline" },
      ],
    },
    showGallery: {
      label: "Show Image Gallery",
      type: "custom",
      render: CheckboxField
    }
  },
  defaultProps: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    titleColor: "#111827",
    priceColor: "#111827",
    textColor: "#6B7280",
    buttonText: "Add to Cart",
    buttonStyle: "outline",
    variant: "minimal",
    shadow: "sm",
    hoverEffect: "lift",
    roundedCorners: "lg",
    aspectRatio: "square",
    showGallery: true,
    className: ""
  }
};

export default ProductCard;
