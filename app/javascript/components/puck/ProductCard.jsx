import React, { useState, useEffect } from 'react';
import { get, post } from '@rails/request.js';
import ColorPicker from './ColorPicker';

const ProductCard = ({ 
  productId,
  backgroundColor,
  borderColor,
  titleColor,
  priceColor,
  textColor,
  buttonText,
  buttonStyle,
  imageHeight
}) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await get(`/products/${productId}.json`);
        if (response.ok) {
          const data = await response.json;
          setProduct(data);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product || adding) return;
    
    setAdding(true);
    try {
      const response = await post(`/product_cart/add/${product.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content,
        }
      });
      
      if (response.ok) {
        // You might want to show a success message or update cart state
        console.log('Product added to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded-lg h-96"></div>;
  }

  if (!product) {
    return null;
  }

  const buttonClasses = buttonStyle === 'outline' 
    ? 'button-large-outline' 
    : 'button-large';

  return (
    <div className="mt-4">
      <div 
        className="rounded-lg border shadow-sm w-full max-w-3xl"
        style={{ 
          backgroundColor,
          borderColor,
        }}
      >
        {
          product &&
          <div className="p-0">
            <div className="flex flex-col sm:flex-row">
              <div className={`w-full sm:w-1/3 p-4 ${imageHeight}`}>
                {product.cover_url && (
                  <img 
                    className="w-full h-full object-cover" 
                    src={product.cover_url}
                    alt={product.title}
                  />
                )}
              </div>
              <div className="w-full sm:w-2/3 p-6 flex flex-col justify-between">
                <div>
                  <p className="text-sm" style={{ color: textColor }}>
                    {product.category && (
                      <a 
                        className="bg-muted text-sm inline-flex hover:cursor-pointer items-center rounded-full hover:bg-emphasis px-3 py-1 font-medium" 
                        href={`/products?category=${product.category}`}
                      >
                        {product.category}
                      </a>
                    )}
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    <a 
                      className="hover:underline"
                      href={`/products/${product.slug}`}
                      style={{ color: titleColor }}
                    >
                      {product.title}
                    </a>
                  </h3>
                  <p 
                    className="text-sm mt-2"
                    style={{ color: textColor }}
                  >
                    {product.description}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span 
                    className="text-2xl font-bold"
                    style={{ color: priceColor }}
                  >
                    ${product.price}
                  </span>
                  <button
                    className={buttonClasses}
                    onClick={handleAddToCart}
                    disabled={adding}
                  >
                    {adding ? 'Adding...' : buttonText || 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  );
};

export const config = {
  fields: {
    productId: {
      type: "external",
      fetchList: async () => {
        // Query an API for a list of items
        const items = await fetch(`/api/items`).then((res) => res.json());
        // [
        //   { title: "Hello, world", description: "Lorem ipsum 1" },
        //   { title: "Goodbye, world", description: "Lorem ipsum 2" },
        // ];

        return items;
      }, 
    },
    backgroundColor: {
      type: "custom",
      label: "Background Color",
      render: ColorPicker,
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
    imageHeight: {
      type: "select",
      label: "Image Height",
      options: [
        { label: "Small", value: "h-48" },
        { label: "Medium", value: "h-64" },
        { label: "Large", value: "h-80" },
        { label: "Extra Large", value: "h-96" },
      ],
    },
  },
  defaultProps: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    titleColor: "#111827",
    priceColor: "#111827",
    textColor: "#6B7280",
    buttonText: "Add to Cart",
    buttonStyle: "outline",
    imageHeight: "h-64",
  }
};

export default ProductCard;
