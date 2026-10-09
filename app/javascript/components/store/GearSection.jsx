import ProductCard, { ProductCardSkeleton } from "./ProductCard";
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "components/ui/carousel";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { Link } from "react-router-dom";
const GearSection = () => {
  const {
    items: products,
    loading,
    lastElementRef,
  } = useInfiniteScroll("/store/gear.json");

  return (
    <div className="@container/store-gear bg-default py-16">
      <div className="mx-auto max-w-7xl px-4 @sm/store-gear:px-6">
        <div className="mb-16">
          <h2 className="mb-4 text-3xl font-medium @md/store-gear:text-4xl @4xl/store-gear:text-5xl">
            Instrumentos musicales Nuevos y usados
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground @md/store-gear:text-lg">
            Encuentra los mejores instrumentos musicales para tu banda o
            proyecto musical
          </p>
          <Link to="/store/gear" className="text-blue-500 hover:underline">
            Explore More Gear
          </Link>
        </div>

        <Carousel className="w-full">
          <div className="flex justify-end gap-2 mb-4">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
          <CarouselContent>
            {loading && products.length === 0 && Array.from({ length: 5 }, (_, index) => (
              <CarouselItem key={index} className="basis-[60%] @sm/store-gear:basis-1/2 @2xl/store-gear:basis-1/3 @4xl/store-gear:basis-1/4 @6xl/store-gear:basis-1/5">
                <ProductCardSkeleton />
              </CarouselItem>
            ))}
            {products.map((product, index) => (
              <CarouselItem
                key={product.id}
                ref={index === products.length - 1 ? lastElementRef : null}
                className="basis-[60%] @sm/store-gear:basis-1/2 @2xl/store-gear:basis-1/3 @4xl/store-gear:basis-1/4 @6xl/store-gear:basis-1/5"
              >
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};

export default GearSection;
