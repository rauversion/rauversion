import ProductCard, { ProductCardSkeleton } from "./ProductCard";
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "components/ui/carousel";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { Link } from "react-router-dom";
const MusicSection = () => {
  const {
    items: products,
    loading,
    lastElementRef,
  } = useInfiniteScroll("/store/music.json");

  return (
    <div className="@container/store-music bg-default py-20 @4xl/store-music:py-24">
      <div className="mx-auto max-w-7xl px-4 @sm/store-music:px-6">
        <div className="mb-16">
          <div className="mb-12 flex flex-col gap-6 @4xl/store-music:flex-row @4xl/store-music:items-end @4xl/store-music:justify-between">
            <div>
              <h2 className="text-2xl font-medium leading-tight @md/store-music:text-3xl @2xl/store-music:text-4xl @4xl/store-music:text-5xl @6xl/store-music:text-6xl">
                CD, cassettes y Vinilos.
                <br />
                Ediciones limitadas para coleccionistas{" "}
                <motion.span
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <ArrowRight className="inline-block w-12 h-12" />
                </motion.span>
              </h2>
              <Link to="/store/music" className="text-blue-500 hover:underline">
                Explore More Music
              </Link>
            </div>

            <div className="hidden items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-secondary border-2 border-white"
                  />
                ))}
              </div>

              <div>
                <div className="font-medium">500+</div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
            </div>
          </div>

          <Button variant="outline" className="rounded-full">
            Contact Us
          </Button>
        </div>

        <Carousel className="w-full">
          <div className="flex justify-end gap-2 mb-4">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
          <CarouselContent>
            {loading && products.length === 0 && Array.from({ length: 5 }, (_, index) => (
              <CarouselItem key={index} className="basis-[60%] @sm/store-music:basis-1/2 @2xl/store-music:basis-1/3 @4xl/store-music:basis-1/4 @6xl/store-music:basis-1/5">
                <ProductCardSkeleton />
              </CarouselItem>
            ))}
            {products.map((product, index) => (
              <CarouselItem
                key={product.id}
                ref={index === products.length - 1 ? lastElementRef : null}
                className="basis-[60%] @sm/store-music:basis-1/2 @2xl/store-music:basis-1/3 @4xl/store-music:basis-1/4 @6xl/store-music:basis-1/5"
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

export default MusicSection;
