import React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export default function PublicPhotosSection({ product }) {
  return (
    <>
      {product.photos.length > 0 && (
      <Carousel
        opts={{
          slidesToScroll: 'auto',
          slidesPerView: 2,
          breakpoints: {
           '(min-width: 768px)': {
              slidesPerView: 2
            }
          }
        }}
        className="mb-8"
      >
        <CarouselContent>
          {product.photos.map((photo) => (
            <CarouselItem key={photo.id}>
              <div className="lg:px-2">
                <img
                  src={photo.url}
                  alt={product.title}
                  className="w-full h-[400px] object-cover rounded-lg"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      )}
    </>
  )
}
