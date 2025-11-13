import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'
import useAuthStore from '@/stores/authStore'
import { Music, Package, ShoppingBag, Piano, Headphones } from 'lucide-react'

const ICONS = {
  music: Music,
  gear: Piano,
  merch: ShoppingBag,
  accessory: Headphones,
  service: Package
}

const gradientColors = {
  purple: 'indigo',
  blue: 'cyan',
  pink: 'rose',
  amber: 'orange',
  emerald: 'green'
}

export default function TypeCard({ title, description, iconClass, color, path }) {
  const Icon = ICONS[iconClass]
  const gradientColor = gradientColors[color] || color

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link to={path} className="group">
        <div className="relative bg-white dark:bg-secondary rounded-lg shadow-lg overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
          <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/20 to-${gradientColor}-500/20 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
          <div className="p-8">
            <div className={`w-12 h-12 bg-${color}-100 rounded-full flex items-center justify-center mb-6`}>
              <Icon className={`h-6 w-6 text-${color}-500`} />
            </div>
            <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">{title}</h3>
            <p className="text-muted-foreground dark:text-muted-foreground">{description}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
