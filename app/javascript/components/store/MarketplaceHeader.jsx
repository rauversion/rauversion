import React from "react"
import { motion } from "framer-motion"
import { Button } from "../ui/button"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { 
    opacity: 0,
    y: 20,
    rotate: -10,
  },
  show: { 
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

const cards = [
  { color: "bg-[#FF4D4D]", username: "@coplin", image: "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png" },
  { color: "bg-[#FFD700]", image: "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png" },
  { color: "bg-[#FF69B4]", image: "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png" },
  { color: "bg-[#4169E1]", image: "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png" },
  { color: "bg-[#32CD32]", username: "@andrea", image: "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png" },
  { color: "bg-[#9370DB]", image: "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png" },
]

const MarketplaceHeader = () => {
  return (
    <div className="py-24 bg-[#F4F1ED] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="text-center"
        >
          <motion.h1 
            className="text-6xl md:text-7xl font-bold mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            A place to display your<br />
            masterpiece.
          </motion.h1>

          <div className="relative h-[320px] mb-16">
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
              {cards.map((card, index) => (
                <motion.div
                  key={index}
                  className="relative"
                  variants={cardVariants}
                  style={{
                    zIndex: cards.length - index,
                    marginLeft: index === 0 ? 0 : '-180px',
                    transformOrigin: 'center',
                    transform: `rotate(${(index - 2.5) * 3}deg) translateY(${Math.abs(index - 2.5) * 5}px)`
                  }}
                >
                  <div 
                    className={`w-[240px] h-[300px] rounded-3xl shadow-lg ${card.color} overflow-hidden bg-blend-multiply`}
                  >
                    <img 
                      src={card.image} 
                      alt="Artwork"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {card.username && (
                    <div className="absolute -top-6 left-4">
                      <div className="bg-white text-sm px-4 py-1.5 rounded-full shadow-md">
                        {card.username}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <motion.p 
            className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Artists can display their masterpieces, and buyers can discover and
            purchase works that resonate with them.
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button className="bg-black text-white hover:bg-black/90">
              Join for $9.99/m
            </Button>
            <Button variant="link" className="text-black hover:text-black/70">
              Read more
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default MarketplaceHeader
