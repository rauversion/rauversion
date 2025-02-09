import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import I18n from 'stores/locales'

function truncate(str, length = 220) {
  if (!str) return ''
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export default function Header({ posts }) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  if (!posts || posts.length === 0) return null

  const post = posts[0]

  return (
    <motion.header 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative h-[90vh] md:h-screen overflow-hidden"
    >
      <motion.div 
        style={{ y }}
        className="absolute inset-0 bg-cover bg-center scale-110" 
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          style={{
            backgroundImage: `url(${post.cover_url.large})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            height: '100%',
            width: '100%'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
      </motion.div>

      <motion.div 
        style={{ opacity }}
        className="relative z-10 px-4 sm:px-8 pt-32 md:pt-48"
      >
        <Link to={`/articles/${post.slug}`}>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.h1 
                className="text-[10vw] md:text-[6vw] font-bold leading-none tracking-tighter mb-6 text-white"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                {post.title}
              </motion.h1>
            </motion.div>

            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 md:gap-0">
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="max-w-md text-base md:text-lg text-gray-300"
              >
                {truncate(post.excerpt, 220)}
              </motion.p>

              <motion.button 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center gap-2 text-sm font-medium text-white hover:text-primary transition-colors"
              >
                {I18n.t('home.header.explore')}
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="lucide lucide-arrow-right w-4 h-4 group-hover:translate-x-1 transition-transform"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </motion.svg>
              </motion.button>
            </div>
          </div>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-20"
      />
    </motion.header>
  )
}
