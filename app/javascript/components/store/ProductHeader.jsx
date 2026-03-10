import React, { useCallback, useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { ChevronRight } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const images = [
  {
    title: "Coaching Musical",
    image: "/images/store/5cac3029-1a9b-41a9-bbf0-4bbfa37df4ca.png",
  },
  {
    title: "Merch!",
    image: "/images/store/8ec2d648-97c7-497c-8790-ec7964932ae5.png",
  },
  {
    title: "Sintes y Maquinitas",
    image: "/images/store/35d0e2f0-4add-44ad-b6b4-936b6175b1ed.png",
  },
  {
    title: "Clases",
    image: "/images/store/394bbc46-ea3c-4ea3-ac19-c6c1c5038c8a.png",
  },
  {
    title: "Vinilos, Cassetes y CDs",
    image: "/images/store/6330dcff-d58f-4d58-956e-e55626a5ded2.png",
  },
  {
    title: "Producción Musical",
    image: "/images/store/34874ebb-cd65-4cd6-91f6-351fe78cd991.png",
  },
  /*{
    title: "",
    image: "/images/store/653203c9-ee6f-4ee6-a18e-4618c976b6b0.png",
  },
  {
    title: "",
    image: "/images/store/eb8edf58-5704-4570-b0bc-7b0b34b32447.png",
  },*/
];

const features = [
  "Coaching Musical",
  "Sintes y maquinitas",
  "Clases",
  "CDs, Vinilos y Cassetes",
];

const ProductHeader = () => {
  return (
    <div className="@container/store-hero bg-default py-12 @4xl/store-hero:py-16">
      <div className="mx-auto max-w-7xl px-4 @sm/store-hero:px-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 items-center gap-8 @4xl/store-hero:grid-cols-2 @4xl/store-hero:gap-12 @6xl/store-hero:gap-16"
        >
          {/* Left Content */}
          <motion.div variants={item} className="space-y-8">
            {/*<div className="inline-flex items-center gap-2 bg-black/5 px-4 py-1.5 rounded-full">
              <span className="text-sm">New products</span>
              <ChevronRight className="w-4 h-4" />
            </div>*/}

            <div>
              <h1 className="mb-2 text-3xl font-bold @md/store-hero:text-4xl @3xl/store-hero:text-5xl @6xl/store-hero:text-6xl">
                Mercado Rauversion, conecta{" "}
                <span className="text-muted-foreground">
                  con nuestro marketplace musical
                </span>
              </h1>
              <p className="text-base text-muted-foreground @md/store-hero:text-lg @3xl/store-hero:text-xl">
                El punto de encuentro para músicos, coleccionistas y amantes de
                la música
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {/*features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-black/5 px-4 py-1.5 rounded-full text-sm"
                >
                  {feature}
                </div>
              ))*/}
            </div>

            {/*<div className="pt-4">
              <Button className="bg-black text-white hover:bg-black/90">
                Explore Collection
              </Button>
            </div>*/}
          </motion.div>

          {/* Right Content */}
          <motion.div variants={item} className="relative">
            <Carousel className="relative">
              <CarouselContent>
                {images.map((item, index) => (
                  <CarouselItem key={index}>
                    <div className="relative overflow-hidden rounded-3xl">
                      <img
                        src={item.image}
                        alt={`Slide ${index}`}
                        className="aspect-[4/3] w-full object-cover @4xl/store-hero:aspect-[5/4]"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50">
                        <h2 className="text-2xl font-extrabold @md/store-hero:text-3xl @3xl/store-hero:text-4xl">
                          {item.title}
                        </h2>
                        <p className="mt-2 text-sm @md/store-hero:text-base @3xl/store-hero:text-lg">
                          {item.title}
                        </p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductHeader;
