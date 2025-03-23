import React, { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "../ui/button"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll"


const GearSection = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 12
  const [activeImage, setActiveImage] = useState(0)

  const { 
    items: products, 
    loading, 
    lastElementRef 
  } = useInfiniteScroll("/store/gear.json")

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % totalPages)
  }

  const prevImage = () => {
    setActiveImage((prev) => (prev - 1 + totalPages) % totalPages)
  }

  return (
    <div className="bg-default py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-16">
          <h2 className="text-4xl font-medium mb-4">
            Instrumentos musicales Nuevos y usados
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl">
            Encuentra los mejores instrumentos musicales para tu banda o proyecto musical
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-default aspect-square relative group cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-default flex items-center justify-center">
                <img
                  src={product.cover_url?.large}
                  alt={product.title}
                  className="w-4/5- h-4/5- object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 p-6 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium mb-0.5">{product.name}</h3>
                    <p className="text-sm opacity-70 mb-1">{product.description}</p>
                    <p className="text-base">{product.price}</p>
                  </div>
                  {product.variants && (
                    <div className="bg-default/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-sm">
                      +{product.variants}
                    </div>
                  )}
                </div>

                <div className="mt-auto flex justify-between items-center">
                  <div className="text-sm font-light tracking-wider">
                    {activeImage + 1}/{totalPages}
                  </div>
                  <div className="flex gap-0.5">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        prevImage()
                      }}
                      className="w-6 h-6 rounded-full bg-default/90 backdrop-blur-sm flex items-center justify-center hover:bg-default transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        nextImage()
                      }}
                      className="w-6 h-6 rounded-full bg-default/90 backdrop-blur-sm flex items-center justify-center hover:bg-default transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GearSection
