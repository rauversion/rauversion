import React from "react"
import { motion } from "framer-motion"
import { Card } from "../ui/card"
import { useNavigate } from "react-router-dom"
import { Music, Piano, Package, Sticker, HandHeart } from "lucide-react"

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

const CATEGORY_ICONS = [
  {
    id: 'music',
    name: 'Music',
    icon: Music,
    path: '/store/music',
    color: 'bg-blue-500'
  },
  {
    id: 'gear',
    name: 'Gear',
    icon: Piano,
    path: '/store/gear',
    color: 'bg-purple-500'
  },
  {
    id: 'service',
    name: 'Services',
    icon: HandHeart,
    path: '/store/services',
    color: 'bg-green-500'
  },
  {
    id: 'accessory',
    name: 'Accessories',
    icon: Package,
    path: '/store/accessories',
    color: 'bg-orange-500'
  },
  {
    id: 'merch',
    name: 'Merch',
    icon: Sticker,
    path: '/store/merch',
    color: 'bg-purple-500'
  },

]

const CategoryGrid = () => {
  const navigate = useNavigate()

  return (
    <div className="@container/store-category-grid mb-16">
      <div className="flex flex-col items-center mb-12">
        <h1 className="mb-4 text-3xl font-bold @md/store-category-grid:text-4xl @4xl/store-category-grid:text-5xl">Rau Store.</h1>
        <p className="text-lg text-muted-foreground @md/store-category-grid:text-xl @4xl/store-category-grid:text-2xl">
          The best way to buy the products you love.
        </p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-6 @3xl/store-category-grid:grid-cols-3 @5xl/store-category-grid:grid-cols-5"
      >
        {CATEGORY_ICONS.map((category) => {
          const Icon = category.icon
          return (
            <motion.div
              key={category.id}
              variants={item}
              onClick={() => navigate(category.path)}
              className="cursor-pointer"
            >
              <Card className="p-6 h-full hover:bg-muted transition-colors">
                <div className={`w-16 h-16 rounded-full ${category.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8 text-default" />
                </div>
                <h3 className="text-xl font-semibold">{category.name}</h3>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

    </div>
  )
}

export default CategoryGrid
