import React from "react";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

const ServiceCategories = () => {
  const {
    items: products,
    loading,
    lastElementRef,
  } = useInfiniteScroll("/store/services.json");

  return (
    <div className="@container/store-services relative bg-default py-16">
      <div className="mx-auto">
        <div className="mb-10 flex flex-col gap-6 @4xl/store-services:mb-16 @4xl/store-services:flex-row @4xl/store-services:items-start @4xl/store-services:justify-between">
          <div>
          <span className="text-sm uppercase tracking-wider mb-4 block">
            Coaching, Clases, Feedback y servicios personalizados
          </span>
          <h2 className="mb-4 text-4xl font-extrabold leading-tight @2xl/store-services:text-5xl @4xl/store-services:text-6xl">
            RAU ADVISOR
          </h2>
          <h3 className="mb-2 text-2xl font-bold text-muted @sm/store-services:text-3xl @2xl/store-services:text-4xl @4xl/store-services:text-5xl">

            {[
              "Recibe feedback y tutorías directas de profesionales de la música electrónica en un par de clics."][Math.floor(Math.random() * 0)
            ]
            }

          </h3>
          <Link to="/store/services" className="text-blue-500 hover:underline">
            Ver más
          </Link>
        </div>
        
        <div className="flex items-center gap-2 self-start @4xl/store-services:pt-4">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-default"
            onClick={() =>
              document
                .getElementById("services-container")
                .scrollBy({ left: -400, behavior: "smooth" })
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-default"
            onClick={() =>
              document
                .getElementById("services-container")
                .scrollBy({ left: 400, behavior: "smooth" })
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        </div>

        <div
          id="services-container"
          className="flex overflow-x-auto scrollbar-hide gap-3 pb-4"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {loading && products.length === 0 && Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="w-[200px] flex-none @2xl/store-services:w-[220px] @5xl/store-services:w-[240px]">
              <ProductCardSkeleton />
            </div>
          ))}
          {products.map((service, index) => (
            <div
              key={service.id}
              ref={index === products.length - 1 ? lastElementRef : null}
              className="w-[200px] flex-none @2xl/store-services:w-[220px] @5xl/store-services:w-[240px]"
              style={{ scrollSnapAlign: "start" }}
            >
              <ProductCard product={service} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceCategories;
