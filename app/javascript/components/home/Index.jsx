import React, { useEffect, useState } from "react";
import { get } from "@rails/request.js";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import I18n from "stores/locales";
import { Skeleton } from "../ui/skeleton";
import Header from "./Header";
import HomeEvents from "./HomeEvents";
import MainArticles from "./MainArticles";
import AlbumReleases from "./AlbumReleases";
import FeaturedArtists from "./FeaturedArtists";
import CuratedPlaylists from "./CuratedPlaylists";
import LatestReleases from "./LatestReleases";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function LoadingSkeleton() {
  return (
    <div className="space-y-12 px-4 sm:px-8 py-12">
      <Skeleton className="h-[60vh] w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState({
    currentUser: null,
    artists: [],
    posts: [],
    events: [],
    albums: [],
    playlists: [],
    latestReleases: [],
    releases: [],
    podcasts: [],
    appName: window.ENV.APP_NAME,
    displayHero: window.ENV.DISPLAY_HERO,
  });

  const [loading, setLoading] = useState({
    artists: true,
    posts: true,
    events: true,
    albums: true,
    playlists: true,
    latestReleases: true,
    posdcasts: true,
    releases: true,
  });

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0,
    initialInView: true,
  });

  const fetchSectionData = async (section) => {
    try {
      const response = await get(`/home/${section}.json`);
      const jsonData = await response.json;

      console.log(`Fetched ${section} data:`, jsonData.collection);
      setData((prev) => ({
        ...prev,
        [section]: jsonData.collection || [],
      }));
    } catch (error) {
      console.error(`Error fetching ${section} data:`, error);
    } finally {
      setLoading((prev) => ({
        ...prev,
        [section]: false,
      }));
    }
  };

  useEffect(() => {
    // Fetch initial app data
    const fetchInitialData = async () => {
      try {
        const response = await get("/home.json");
        const jsonData = await response.json;
        setData((prev) => ({
          ...prev,
          // currentUser: jsonData.currentUser,
          appName: jsonData.appName,
          displayHero: jsonData.displayHero,
        }));
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    // fetchInitialData()

    // Fetch section data
    fetchSectionData("artists");
    fetchSectionData("posts");
    fetchSectionData("events");
    fetchSectionData("releases");
    fetchSectionData("albums");
    fetchSectionData("playlists");
    fetchSectionData("podcasts");
    fetchSectionData("latest_releases");
  }, []);

  const isFullyLoaded = !Object.values(loading).some(Boolean);
  if (loading.posts) return <LoadingSkeleton />;

  const {
    currentUser,
    //artists,
    //posts,
    //albums,
    //releases,
    //playlists,
    //latestReleases: latest_releases,
    appName,
    displayHero,
  } = data;

  // Map snake_case to camelCase for component props
  //const latestReleases = latest_releases

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="dark:bg-black min-h-screen"
    >
      {/* Hero Section */}
      {!currentUser && displayHero === "true" && (
        <motion.div variants={fadeInUp} className="relative">
          <div
            aria-hidden="true"
            className="hidden absolute w-1/2 h-full bg-gradient-to-r from-gray-100 to-transparent dark:from-gray-900 lg:block"
          ></div>
          <div className="relative bg-black lg:bg-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-2">
              <div className="max-w-2xl mx-auto py-24 lg:py-64 lg:max-w-none">
                <div className="lg:pr-16">
                  <motion.a
                    href="/"
                    whileHover={{ scale: 1.05 }}
                    className="text-white text-sm xl:text-xl font-extrabold"
                  >
                    {appName}
                  </motion.a>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="tracking-tight text-foreground dark:text-muted text-4xl xl:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-brand-600 mt-4"
                  >
                    {I18n.t("home.hero.title")}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 text-xl text-muted"
                  >
                    {I18n.t("home.hero.subtitle")}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8"
                  >
                    <motion.a
                      href="/users/sign_up"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-block bg-brand-600 border border-transparent py-4 px-8 rounded-md text-lg font-medium text-white hover:bg-brand-700 transition-colors"
                    >
                      {I18n.t("home.hero.start_now")}
                    </motion.a>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <>
        <motion.div variants={fadeInUp}>
          <Header posts={data.posts} />
        </motion.div>

        <motion.div variants={fadeInUp}>
          <HomeEvents events={data.events} />
        </motion.div>

        <div ref={ref}>
          <motion.div
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.2,
                },
              },
            }}
          >
            <motion.div variants={fadeInUp}>
              <MainArticles posts={data.posts} />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <AlbumReleases
                albums={[
                  /*{
                    type: 'cta',
                    title: I18n.t('home.album_releases.join_title'),
                    description: I18n.t('home.album_releases.join_description'),
                    buttonText: I18n.t('home.album_releases.join_button'),
                  },*/
                  ...data.releases.map((release, index) => ({
                    type: "album",
                    ...release,
                    variant:
                      index == 0
                        ? "tall" //index === 0 ? 'featured' :
                        : index === 3
                          ? "wide"
                          : index === 4
                            ? "tall"
                            : index === data.releases.length - 1
                              ? "large"
                              : "default",
                  })),
                  /*{
                    type: 'image',
                    image: '/images/architecture.jpg',
                    title: 'Architecture',
                    variant: 'wide'
                  },
                  {
                    type: 'image',
                    image: '/images/art.jpg',
                    title: 'Art Installation',
                    variant: 'tall'
                  }*/
                ]}
              />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <LatestReleases
                url={"/home/podcasts.json"}
                title={I18n.t("home.podcasts.title")}
                subtitle={I18n.t("home.podcasts.subtitle")}
                skipAddToPlaylist={true}
              />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <CuratedPlaylists
                // namespace={"/albums"}
                playlists={data.albums}
                title={"Lanzamientos recientes"}
                subtitle={"Escucha los últimos lanzamientos en Rauversion"}
              />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <LatestReleases
                url={"/home/latest_releases.json"}
                title={I18n.t("home.latest_tracks.title")}
                subtitle={I18n.t("home.latest_tracks.subtitle")}
              />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <FeaturedArtists artists={data.artists} />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <CuratedPlaylists
                title={I18n.t("home.curated_playlists.title")}
                subtitle={I18n.t("home.curated_playlists.subtitle")}
                playlists={data.playlists}
              />
            </motion.div>
          </motion.div>
        </div>
      </>
    </motion.main>
  );
}
