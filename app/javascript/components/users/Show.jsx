import React, { useEffect, useState } from "react";
import { useParams, Link, Outlet, useLocation } from "react-router-dom";
import { get, post } from "@rails/request.js";
import { format } from "date-fns";
import { Play, Pause, Share2, ThumbsUp, Menu, UserX2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProfileSkeleton from "./ProfileSkeleton";
import { motion } from "framer-motion";

import useAudioStore from "../../stores/audioStore";
import useAuthStore from "../../stores/authStore";
import useArtistStore from "../../stores/artistStore";
import { ModernTrackCell } from "../tracks/TrackCell";
import clsx from "clsx";
import Sidebar from "./Sidebar";
import I18n from "@/stores/locales";
import { InterestAlert } from "../shared/alerts";

export default function UserShow() {
  const { username } = useParams();
  const location = useLocation();
  // const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [userErrorMessage, setUserErrorMessage] = useState(null);
  const { currentTrackId, isPlaying, play, pause } = useAudioStore();
  const { currentUser } = useAuthStore();
  const {
    reset: resetArtists,
    setArtist: setUser,
    artist: user,
  } = useArtistStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await get(`/${username}.json`);
        if (response.ok) {
          const data = await response.json;
          setUser(data.user);
          setMenuItems(data.user.menu_items);
        } else {
          const data = await response.json;
          if (data.error) {
            setUser(null);
            setUserErrorMessage(data.error);
          }
        }
      } catch (error) {
        console.error(I18n.t("users.show.error_fetching"), error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    return () => {
      resetArtists();
    };
  }, [username, resetArtists]);

  const handlePlay = (trackId) => {
    if (currentTrackId === trackId && isPlaying) {
      pause();
    } else {
      play(trackId);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (
    !user &&
    !loading &&
    userErrorMessage &&
    ((currentUser && currentUser.username !== username) || !currentUser)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-default">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-[350px] text-center">
            <CardContent className="pt-6">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-center mb-4"
              >
                <UserX2 className="h-16 w-16 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">404</h2>
              <p className="text-muted-foreground mb-4">
                {I18n.t("users.show.not_found")}
                <br />
                {userErrorMessage && <span>: {userErrorMessage}</span>}
              </p>
              <Button variant="default" onClick={() => window.history.back()}>
                {I18n.t("common.go_back")}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (
    !user &&
    !loading &&
    userErrorMessage &&
    currentUser &&
    currentUser.username == username
  ) {
    return (
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <InterestAlert type="artist" onSubmit={() => { }} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-default text-default min-h-screen">
      {/* Profile Header */}
      <div className="relative h-56">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${user.profile_header_url.large})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-end space-x-6">
            <img
              src={user.avatar_url.medium}
              alt={user.username}
              className="w-32 h-32 rounded-full border-4 border-default"
            />

            <div>
              <h1 className="sm:text-4xl text-2xl font-bold text-white">
                {user.hide_username_from_profile
                  ? `${user.first_name} ${user.last_name}`
                  : user.username}
              </h1>

              {!user.hide_username_from_profile && (
                <p className="text-lg text-muted-foreground">
                  {user.first_name} {user.last_name}
                </p>
              )}

              {(user.city || user.country) && (
                <p className="text-muted-foreground">
                  {[user.city, user.country]
                    .filter(Boolean)
                    .join(I18n.t("users.show.location.separator"))}
                </p>
              )}

              <div className="mt-4 flex items-center space-x-6">
                <div className="flex sm:flex-row flex-col sm:space-x-4 text-sm">
                  <div>
                    <span className="font-medium text-white">
                      {user.stats.tracks_count}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {I18n.t("profile.tracks").toLowerCase()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-white">
                      {user.stats.followers_count}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {I18n.t("profile.followings").toLowerCase()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-white">
                      {user.stats.following_count}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {I18n.t("profile.followers").toLowerCase()}
                    </span>
                  </div>
                </div>

                {currentUser && currentUser.id !== user.id && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await post(
                          `/${username}/follows.json`
                        );
                        if (response.ok) {
                          const data = await response.json;
                          console.log(user);
                          const newUser = {
                            ...user,
                            stats: { ...user.stats, ...data },
                            is_following: data.is_following,
                          };
                          setUser(newUser);
                        }
                      } catch (error) {
                        console.error("Error following user:", error);
                      }
                    }}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${user.is_following
                      ? "bg-default/10 text-default hover:bg-default/20"
                      : "bg-default text-default hover:bg-default/90"
                      }`}
                  >
                    {user.is_following
                      ? I18n.t("profile.following")
                      : I18n.t("profile.follow")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mb-8 border-b border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <ul className="hidden md:flex space-x-8">
            {menuItems.map(
              (item) =>
                !item.hidden && (
                  <li key={item.name}>
                    <Link
                      to={item.to}
                      className={clsx(
                        "inline-flex items-center py-4 px-1 border-b-2 text-sm font-medium",
                        location.pathname === item.to
                          ? "border-primary-500 text-primary-500"
                          : "border-transparent text-muted-foreground hover:text-muted-foreground hover:border-gray-300"
                      )}
                    >
                      {item.name}
                    </Link>
                  </li>
                )
            )}
          </ul>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 text-muted-foreground hover:text-muted-foreground">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[50vh]">
                <nav className="mt-6">
                  <ul className="space-y-4">
                    {menuItems.map(
                      (item) =>
                        !item.hidden && (
                          <li key={item.name}>
                            <Link
                              to={item.to}
                              className={clsx(
                                "block py-2 px-4 text-base font-medium rounded-lg",
                                location.pathname === item.to
                                  ? "bg-primary-500 text-white"
                                  : "text-muted-foreground hover:bg-secondary hover:text-muted-foreground"
                              )}
                            >
                              {item.name}
                            </Link>
                          </li>
                        )
                    )}
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl- mx-auto- px-4- sm:px-6- lg:px-8- py-8- min-h-[400px]">
        <div className="flex">
          <div className="lg:w-2/3 bg-default text-default">
            <Outlet context={{ user, handlePlay, currentTrackId, isPlaying }} />
          </div>

          <Sidebar user={user} />
        </div>
      </div>
    </div>
  );
}
