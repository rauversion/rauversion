import React from "react";
import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
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

const CARD_COLORS = {
  junior: { bg: "bg-[#E4FF80]", text: "text-black" },
  youth: { bg: "bg-[#F4F1ED]", text: "text-black" },
  adult: { bg: "bg-[#F4F1ED]", text: "text-black" },
  coaching: { bg: "bg-[#E4FF80]", text: "text-black" },
  feedback: { bg: "bg-[#F4F1ED]", text: "text-black" },
  mastering: { bg: "bg-[#F4F1ED]", text: "text-black" },
};

import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

const ServiceCategories = () => {
  const {
    items: products,
    loading,
    lastElementRef,
  } = useInfiniteScroll("/store/services.json");

  return (
    <div className="py-16 bg-default relative">
      <div className="max-w-[90%]-- mx-auto--">
        <div className="mb-16">
          <span className="text-sm uppercase tracking-wider mb-4 block">
            Coaching, Clases, Feedback y servicios personalizados
          </span>
          <h2 className="text-6xl font-extrabold mb-4 leading-tight">
            RAU ADVISOR
          </h2>
          <h3 className="text-5xl font-bold mb-2 text-muted">

            {[
              "Recibe feedback y tutorías directas de profesionales de la música electrónica en un par de clics."][Math.floor(Math.random() * 0)
            ]
            }

          </h3>
          <Link to="/store/services" className="text-blue-500 hover:underline">
            Ver más
          </Link>
        </div>

        <div className="absolute right-8 top-16 flex gap-2">
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

        <div
          id="services-container"
          className="flex overflow-x-auto scrollbar-hide gap-6 pb-4"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {products.map((service, index) => (
            <motion.div
              key={index}
              variants={item}
              className="flex-none w-[400px]"
              style={{ scrollSnapAlign: "start" }}
            >
              <Link to={`/${service.user.username}/products/${service.id}`}>
                <Card
                  className={`overflow-hidden h-full group cursor-pointer relative ${CARD_COLORS[service.category]?.bg || "bg-white"
                    }`}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <span className="bg-black text-white text-sm px-3 py-1 rounded-full">
                        {service?.category}
                      </span>
                    </div>

                    <span className="text-black text-sm font-bold uppercase mb-2">
                      Por: {service.user?.username}
                    </span>

                    <h3
                      className={`text-4xl ${CARD_COLORS[service.category]?.text || "text-black"
                        } font-bold mb-4 whitespace-pre-line leading-tight`}
                    >
                      {service.title}
                    </h3>

                    <p className="text-sm mb-8">{/*service.description*/}</p>

                    <Button className="bg-black/10 backdrop-blur-sm text-black px-4 py-2 rounded-full flex items-center gap-2 hover:bg-black/20 transition-colors">
                      Leer más
                      <ArrowRight size={16} />
                    </Button>
                  </div>

                  <div className="mt-4">
                    <img
                      src={service?.cover_url?.large}
                      alt={service.title}
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceCategories;
