import React from 'react'
import { Link } from 'react-router-dom'

export default function ProductItem({ product, elementRef }) {
  const coverImage = product.product_images[0]?.image_url

  return (
    <div ref={elementRef} className="group relative">
      <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80">
        <img
          src={coverImage}
          alt={product.title}
          className="h-full w-full object-cover object-center lg:h-full lg:w-full"
        />
      </div>
      <div className="mt-4 flex justify-between">
        <div>
          <h3 className="text-sm text-default">
            <Link to={`/${product.user.username}/products/${product.slug}`}>
              <span aria-hidden="true" className="absolute inset-0" />
              {product.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-muted">{product.category}</p>
        </div>
        <p className="text-sm font-medium text-default">${product.price}</p>
      </div>
    </div>
  )
}
