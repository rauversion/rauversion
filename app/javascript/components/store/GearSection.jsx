import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "components/ui/carousel";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";

const GearSection = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 12;
  const [activeImage, setActiveImage] = useState(0);

  const {
    items: products,
    loading,
    lastElementRef,
  } = useInfiniteScroll("/store/gear.json");

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % totalPages);
  };

  const prevImage = () => {
    setActiveImage((prev) => (prev - 1 + totalPages) % totalPages);
  };

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
                className="basis-[82%] @sm/store-gear:basis-[68%] @2xl/store-gear:basis-1/2 @4xl/store-gear:basis-1/3 @6xl/store-gear:basis-1/4"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group cursor-pointer"
                >
                  <Link to={`/${product.user.username}/products/${product.id}`}>
                    <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <div className="relative aspect-square">
                        <div className="absolute inset-0 bg-default flex items-center justify-center overflow-hidden">
                          <img
                            src={product.cover_url?.large}
                            alt={product.title}
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        {product.variants && (
                          <Badge
                            variant="secondary"
                            className="absolute top-4 right-4 backdrop-blur-sm"
                          >
                            +{product.variants} variantes
                          </Badge>
                        )}

                        <div className="absolute bottom-4 right-4 flex gap-2">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              prevImage();
                            }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              nextImage();
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <CardHeader className="space-y-1 p-4">
                        <CardTitle className="text-lg @2xl/store-gear:text-xl">
                          {product.title}
                        </CardTitle>
                        {/*<CardDescription className="text-sm line-clamp-2">
                          {product.description}
                        </CardDescription>*/}
                      </CardHeader>

                      <CardFooter className="p-4 pt-0 flex justify-between items-center">
                        <span className="text-lg font-semibold">
                          {product.formatted_price}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {activeImage + 1}/{totalPages}
                        </span>
                      </CardFooter>
                    </Card>
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

export default GearSection;
