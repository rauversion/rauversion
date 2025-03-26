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
import { Heart, ArrowRight } from "lucide-react";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { Link } from "react-router-dom";
const EcoFriendlySection = () => {
  const {
    items: products,
    loading,
    lastElementRef,
  } = useInfiniteScroll("/store/music.json");

  return (
    <div className="bg-default py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-16">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-6xl font-medium leading-tight">
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

            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"
                  />
                ))}
              </div>

              <div>
                <div className="font-medium">500+</div>
                <div className="text-sm text-gray-500">Happy Customers</div>
              </div>
            </div>
          </div>

          <Button variant="outline" className="rounded-full">
            Contact Us
          </Button>
        </div>

        <Carousel className="w-full">
          <div className="flex justify-end gap-2 mb-4">
            <CarouselPrevious
              onClickss={() => {
                /* handle previous */
              }}
            />
            <CarouselNext
              onClickss={() => {
                /* handle next */
              }}
            />
          </div>
          <CarouselContent>
            {products.map((product) => (
              <CarouselItem
                key={product.id}
                className="basis-full md:basis-1/2 lg:basis-1/4"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`aspect-[4/5] relative group cursor-pointer overflow-hidden ${product.color}`}
                >
                  <Link to={`/${product.user.username}/products/${product.id}`}>
                    <div className="absolute inset-0 after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-1/3 after:bg-gradient-to-t after:from-black/30 after:to-transparent">
                      <img
                        src={product.cover_url?.large}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    <div className="absolute inset-0 p-6 flex flex-col">
                      <div className="flex justify-between items-start">
                        <button className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                          <Heart className="w-4 h-4" />
                        </button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white"
                        >
                          Buy Now
                        </Button>
                      </div>

                      <div className="mt-auto">
                        <h3 className="text-2xl font-medium max-w-[200px] leading-tight text-white">
                          {product.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};

export default EcoFriendlySection;
