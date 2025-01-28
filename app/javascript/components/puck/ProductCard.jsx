import React, { useState, useEffect } from 'react';
import { get, post } from '@rails/request.js';
import ColorPicker from './ColorPicker';
import CheckboxField from './CheckboxField';

const ProductCard = ({ 
  backgroundColor,
  borderColor,
  titleColor,
  priceColor,
  textColor,
  buttonText,
  buttonStyle,
  imageHeight,
  showGallery
}) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [userId, setUserId] = useState(null);
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const u = document.querySelector('meta[name="current-user-id"]')?.content;
        setUserId(u);
        if (!u) {
          console.error('No user ID found');
          setLoading(false);
          return;
        }

        const response = await get(`/${userId}/products/${productId}.json`);
        if (response.ok) {
          const data = await response.json;
          setProduct(data);
          // Set initial image
          if (data.product_images && data.product_images.length > 0) {
            setSelectedImage(data.product_images[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProduct();
    }
  }, [userId]);

  const handleAddToCart = async () => {
    if (!product || adding) return;
    
    setAdding(true);
    try {
      const response = await post(`/${userId}/product_cart/add/${product.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content,
        }
      });
      
      if (response.ok) {
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
        {product &&
          <div className="p-0">
            <div className="flex flex-col sm:flex-row">
              <div className={`w-full sm:w-1/3 p-4 ${imageHeight}`}>
                <img 
                  className="w-full h-full object-cover" 
                  src={selectedImage?.image_url || product.cover_url}
                  alt={product.title}
                />
                {showGallery && product.product_images?.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {product.product_images.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImage(image)}
                        className={`relative flex h-16 cursor-pointer items-center justify-center rounded-md bg-white text-sm font-medium uppercase text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring focus:ring-opacity-50 focus:ring-offset-4 ${
                          selectedImage?.id === image.id ? 'ring-2 ring-indigo-500' : ''
                        }`}
                      >
                        <img 
                          src={image.image_url} 
                          alt={`${product.title} - Image ${image.id}`}
                          className="h-full w-full object-cover object-center rounded-md"
                        />
                      </button>
                    ))}
                  </div>
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
    userId: {
      type: "text",
      label: "User ID (username)",
      required: true,
    },
    productId: {
      type: "external",
      label: "Select Product",
      fetchList: async (_, { userId }) => {
        if (!userId) return [];
        
        try {
          const response = await get(`/${userId}/products.json`);
          if (response.ok) {
            const products = await response.json;
            return products.map(product => ({
              id: product.id,
              title: product.title,
              description: product.description,
              price: product.price,
              category: product.category
            }));
          }
          return [];
        } catch (error) {
          console.error('Error loading products:', error);
          return [];
        }
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
    imageHeight: "h-64",
    showGallery: true,
    userId: "",
  }
};

export default ProductCard;
