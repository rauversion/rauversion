import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import I18n from "stores/locales";

const PlaylistCard = ({ playlist, namespace }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="dark group relative flex-shrink-0 w-[300px] md:w-[400px]"
    >
      <Link to={`${namespace ? namespace : "/playlists"}/${playlist.slug}`}>
        <div className="relative overflow-hidden rounded-2xl bg-background aspect-[4/3]">
          {/* Playlist Cover */}
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${playlist.cover_url.medium})` }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

          {/* Content */}
          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            {/* Top Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-start"
            >
              <Badge
                variant="outline"
                className="bg-background/50 text-foreground border-border"
              >
                {playlist.tracks_count}{" "}
                {I18n.t("home.curated_playlists.tracks")}
              </Badge>
            </motion.div>

            {/* Bottom Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4">
                {/*
                  
                <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="hidden bg-background rounded-full p-3 shadow-lg group"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="black"
                  className="w-5 h-5 group-hover:fill-primary transition-colors"
                >
                  <polygon points="6 3 20 12 6 21 6 3"></polygon>
                </svg>
              </motion.button>
              */}

                <div>
                  <h3 className="text-2xl font-black tracking-tight text-foreground">
                    {playlist.title}
                  </h3>
                  <p className="text-default font-medium">
                    {I18n.t("home.curated_playlists.by")}{" "}
                    {playlist.user.username}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const CarouselButton = ({ direction, onClick, disabled }) => (
  <Button
    variant="outline"
    size="icon"
    className="absolute top-1/2 -translate-y-1/2 z-10 bg-background/80 border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
    style={{ [direction === "left" ? "left" : "right"]: "1rem" }}
    onClick={onClick}
    disabled={disabled}
  >
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
      style={{ transform: direction === "left" ? "rotate(180deg)" : "none" }}
    >
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </motion.svg>
  </Button>
);

export default function CuratedPlaylists({
  namespace,
  playlists,
  title,
  subtitle,
}) {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = direction === "left" ? -400 : 400;
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (!playlists || playlists.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="px-4 sm:px-8 flex justify-between items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">
              {title || I18n.t("home.curated_playlists.title")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {subtitle || I18n.t("home.curated_playlists.subtitle")}
            </p>
          </motion.div>

          <Link to={`${namespace ? namespace : "/playlists"}`}>
            <Button variant="outline" size="lg">
              <span className="text-foreground">
                {I18n.t("home.curated_playlists.view_all")}
              </span>

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
                className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </motion.svg>
            </Button>
          </Link>
        </div>

        <div className="relative group">
          <CarouselButton direction="left" onClick={() => scroll("left")} />

          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide px-4 sm:px-8"
          >
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ staggerChildren: 0.1 }}
              className="flex space-x-6"
            >
              {playlists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  namespace={namespace}
                />
              ))}
            </motion.div>
          </div>

          <CarouselButton direction="right" onClick={() => scroll("right")} />
        </div>
      </div>
    </section>
  );
}
