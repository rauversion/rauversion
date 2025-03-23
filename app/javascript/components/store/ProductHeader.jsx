import React from "react"
import { motion } from "framer-motion"
import { Button } from "../ui/button"
import { ChevronRight } from "lucide-react"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

const images = [
  "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png",
  "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png",
  "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png"
]

const features = [
  "Clases",
  "Coaching",
  "CDs, Vinilos y Cassetes",
  "Sintes y maquinitas"
]


const ProductHeader = () => {
  return (
    <div className="bg-default py-16">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          {/* Left Content */}
          <motion.div variants={item} className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-black/5 px-4 py-1.5 rounded-full">
              <span className="text-sm">New products</span>
              <ChevronRight className="w-4 h-4" />
            </div>

            <div>
              <h1 className="text-5xl font-bold mb-2">
                sonido redefinido, conecta
                
                {" "}
                <span className="text-gray-400">
                con nuestro marketplace musical
                </span>
              </h1>
              <p className="text-xl text-gray-400">
                El punto de encuentro para músicos, coleccionistas y amantes de la música
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-black/5 px-4 py-1.5 rounded-full text-sm"
                >
                  {feature}
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Button className="bg-black text-white hover:bg-black/90">
                Explore Collection
              </Button>
            </div>
          </motion.div>

          {/* Right Content */}
          <motion.div variants={item} className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100">
              <div className="absolute inset-0 flex items-center">
                <div className="relative w-full">
                  {images.map((image, index) => (
                    <div 
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-500 ${
                        index === 0 ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <img
                        src={image}
                        alt="Product"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Dots */}
              <div className="absolute bottom-6 right-6 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === 0 ? "bg-black" : "bg-black/20"
                    }`}
                  />
                ))}
              </div>

              {/* Collection Tag */}
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full">
                <span className="text-sm">Collections</span>
              </div>

              {/* Navigation Arrow */}
              <button className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProductHeader
