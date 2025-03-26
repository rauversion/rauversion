import React, { useEffect, useState } from "react";
import { get } from "@rails/request.js";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import I18n from "stores/locales";
import useAudioStore from "@/stores/audioStore";
import { MinimalTrackCell } from "../tracks/TrackCell";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function LatestReleases({
  url,
  title,
  subtitle,
  skipAddToPlaylist,
}) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addMultipleToPlaylist } = useAudioStore();
  useEffect(() => {
    const loadTracks = async () => {
      try {
        const response = await get(url);
        if (response.ok) {
          const data = await response.json;
          setTracks(data.tracks.slice(0, 10));

          if (!skipAddToPlaylist) addMultipleToPlaylist(data.tracks);
        } else {
          console.error("Failed to fetch tracks:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching tracks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTracks();
  }, []);

  if (loading) {
    return (
      <section className="px-4 sm:px-8 py-12 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
              <div className="h-12 w-64 bg-muted/50 rounded-lg animate-pulse" />
              <div className="h-6 w-48 bg-muted/50 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-muted/50 rounded-2xl p-4 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 w-3/4 bg-muted rounded-lg" />
                    <div className="h-4 w-1/2 bg-muted rounded-lg" />
                  </div>
                </div>
                <div className="mt-4 h-16 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!tracks || tracks.length === 0) return null;

  return (
    <section className="px-4 sm:px-8 py-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          </motion.div>

          <Link to="/tracks">
            <Button
              variant="outline"
              size="lg"
              className="group border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-300"
            >
              {I18n.t("home.latest_tracks.browse_all")}
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="relative w-full"
        >
          <CarouselContent className="-ml-4">
            {tracks.map((track) => (
              <CarouselItem
                key={track.id}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5"
              >
                <MinimalTrackCell track={track} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-300">
            <ChevronLeft className="h-4 w-4" />
          </CarouselPrevious>
          <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-300">
            <ChevronRight className="h-4 w-4" />
          </CarouselNext>
        </Carousel>
      </div>
    </section>
  );
}
