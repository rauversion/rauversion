import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useActionCable } from "@/hooks/useActionCable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useThemeStore } from "../../stores/theme";
import useAuthStore from "../../stores/authStore";
import { CartIndicator } from "@/components/cart/CartIndicator";
import { NotificationBadge } from "@/components/shared/NotificationBadge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import I18n, { useLocaleStore } from "@/stores/locales";
import {
  User,
  Settings,
  Music,
  ShoppingCart,
  Package,
  FileText,
  Calendar,
  LogOut,
  Sun,
  Moon,
  Bell,
  Store,
  Search,
  CreditCard,
  Languages,
  CalendarClock,
  MessageSquare,
  CalendarDays,
  Laptop,
  Newspaper,
  Users,
  Headphones,
  Menu,
  ChevronDown,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";


// ListItem for NavigationMenu
const ListItem = React.forwardRef(
  ({ className, title, children, to, icon: Icon, ...props }, ref) => (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          to={to}
          className={[
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          <div className="text-sm font-medium leading-none flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground flex items-center gap-2">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
);
ListItem.displayName = "ListItem";

// MobileNavigation and NavSection components
export function MobileNavigation({ currentUser, storeNavItems, eventsNavItems, magazineNavItems, musicNavItems }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left">Rauversion</SheetTitle>
        </SheetHeader>
        <div className="py-4 overflow-y-auto">
          <NavSection title={I18n.t("menu.magazine")} items={magazineNavItems} />
          <NavSection title={I18n.t("menu.music")} items={musicNavItems} />
          <NavSection title={I18n.t("menu.events")} items={eventsNavItems} />
          <NavSection title={I18n.t("menu.store")} items={storeNavItems} />
          {!currentUser && (
            <div className="flex flex-col gap-2 px-4 py-4">
              <a
                href="/users/sign_in"
                className="w-full rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted border border-default text-center"
              >
                {I18n.t("menu.log_in")}
              </a>
              <a
                href="/users/sign_up"
                className="w-full inline-flex items-center justify-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 text-center"
              >
                {I18n.t("menu.register")}
              </a>
            </div>
          )}
          <MobileLanguageSelector />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NavSection({ title, items }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b last:border-b-0">
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between p-4 text-left">
          <span className="text-sm font-medium">{title}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 p-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MobileLanguageSelector() {
  const { setLocale, currentLocale } = useLocaleStore();
  return (
    <div className="border-t mt-4 pt-2">
      <div className="flex items-center px-4 py-2 text-sm font-medium">
        <Languages className="h-4 w-4 mr-2" />
        {I18n.t("menu.language")}
      </div>
      <div className="flex flex-col">
        <button
          className={`flex items-center px-4 py-2 text-left text-sm ${currentLocale === "en" ? "font-semibold text-primary" : ""
            }`}
          onClick={() => setLocale("en")}
          type="button"
        >
          <span className="mr-2">🇺🇸</span> English
          {currentLocale === "en" && <span className="ml-2">✓</span>}
        </button>
        <button
          className={`flex items-center px-4 py-2 text-left text-sm ${currentLocale === "es" ? "font-semibold text-primary" : ""
            }`}
          onClick={() => setLocale("es")}
          type="button"
        >
          <span className="mr-2">🇪🇸</span> Español
          {currentLocale === "es" && <span className="ml-2">✓</span>}
        </button>
      </div>
    </div>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 1023px)").matches
      : false
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const handler = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener
      ? mediaQuery.addEventListener("change", handler)
      : mediaQuery.addListener(handler);
    return () => {
      mediaQuery.removeEventListener
        ? mediaQuery.removeEventListener("change", handler)
        : mediaQuery.removeListener(handler);
    };
  }, []);

  return isMobile;
}

export default function UserMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const { 
    currentUser, 
    labelUser, 
    cartItemCount, 
    unreadMessagesCount, 
    signOut,
    incrementUnreadMessagesCount 
  } = useAuthStore();
  const { setLocale, t, currentLocale } = useLocaleStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { subscribe, unsubscribe } = useActionCable();

  // Hide main menu if route matches "/:username/podcasts"
  const hideMainMenu = /^\/[^/]+\/podcasts(\/|$)/.test(location.pathname);

  // Subscribe to NotificationsChannel for real-time updates
  useEffect(() => {
    if (!currentUser) return;

    const channel = subscribe(
      'NotificationsChannel',
      {},
      {
        received: (data) => {
          if (data.type === 'new_message') {
            // Increment unread count when a new message arrives
            incrementUnreadMessagesCount();
          }
        }
      }
    );

    return () => {
      unsubscribe('NotificationsChannel');
    };
  }, [currentUser, subscribe, unsubscribe, incrementUnreadMessagesCount]);

  const handleSignOut = async () => {
    await signOut();
    // navigate('/')
  };

  const renderMessagesMenuItem = () => (
    <DropdownMenuItem asChild>
      <Link to="/conversations">
        <MessageSquare className="mr-2 h-4 w-4" />
        <span>Messages</span>
      </Link>
    </DropdownMenuItem>
  );


  const eventsNavItems = [
    {
      title: I18n.t('menu_main.events.physical.title'),
      href: "/events",
      description: I18n.t('menu_main.events.physical.description'),
      icon: CalendarDays,
    },
    {
      title: I18n.t('menu_main.events.digital.title'),
      href: "/events",
      description: I18n.t('menu_main.events.digital.description'),
      icon: Laptop,
    },
    {
      title: I18n.t('menu_main.events.hybrid.title'),
      href: "/events",
      description: I18n.t('menu_main.events.hybrid.description'),
      icon: CalendarClock,
    },
  ];

  const magazineNavItems = [
    {
      title: I18n.t('menu_main.magazine.news.title'),
      href: "/articles/c/news",
      description: I18n.t('menu_main.magazine.news.description'),
      icon: Newspaper,
    },
    {
      title: I18n.t('menu_main.magazine.interviews.title'),
      href: "/articles/c/interviews",
      description: I18n.t('menu_main.magazine.interviews.description'),
      icon: Users,
    },
    {
      title: I18n.t('menu_main.magazine.reviews.title'),
      href: "/articles/c/reviews",
      description: I18n.t('menu_main.magazine.reviews.description'),
      icon: Headphones,
    },
    {
      title: I18n.t('menu_main.magazine.releases.title'),
      href: "/articles/c/releases",
      description: I18n.t('menu_main.magazine.releases.description'),
      icon: Music,
    },
  ];

  const musicNavItems = [
    {
      title: I18n.t('menu_main.music.all.title'),
      href: "/tracks",
      description: I18n.t('menu_main.music.all.description'),
      icon: Music,
    },
    {
      title: I18n.t('menu_main.music.artists.title'),
      href: "/artists",
      description: I18n.t('menu_main.music.artists.description'),
      icon: Users,
    },
    {
      title: I18n.t('menu_main.music.playlists.title'),
      href: "/playlists",
      description: I18n.t('menu_main.music.playlists.description'),
      icon: Headphones,
    },
    {
      title: I18n.t('menu_main.music.releases.title'),
      href: "/albums",
      description: I18n.t('menu_main.music.releases.description'),
      icon: Music,
    },
  ];

  const storeNavItems = [
    {
      title: I18n.t('menu_main.store.music.title'),
      href: "/store/music",
      description: I18n.t('menu_main.store.music.description'),
      icon: Music,
    },
    {
      title: I18n.t('menu_main.store.services.title'),
      href: "/store/services",
      description: I18n.t('menu_main.store.services.description'),
      icon: CalendarClock,
    },
    {
      title: I18n.t('menu_main.store.gear.title'),
      href: "/store/gear",
      description: I18n.t('menu_main.store.gear.description'),
      icon: Package,
    },
  ];

  return (
    <>
      {labelUser && currentUser && (
        <nav className="border-b-muted border-b bg-purple-600 text-white flex justify-center py-1">
          <span className="text-xs">
            {I18n.t("menu.acting_on_behalf")}{" "}
            <span className="font-bold hover:underline">
              <Link to={`/${currentUser.username}`}>
                {currentUser.username}
              </Link>
            </span>
            <span className="font-bold underline">
              <a
                href="/account_connections/impersonate"
                className="text-default"
                target="_blank"
                rel="noopener noreferrer"
              >
                {I18n.t("menu.back_to_label", { username: labelUser.username })}
              </a>
            </span>
          </span>
        </nav>
      )}

      <nav className="border-b-muted border-b" aria-label="Global">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 text-default">
          <div className="flex justify-between h-16">
            <div className="flex items-center px-2 lg:px-0">
              <div className="md:flex flex-shrink-0 items-center">
                <Link
                  to="/"
                  className="flex items-center space-x-3 text-default sm:text-2xl text-sm font-extrabold"
                >
                  <img
                    src={"/logo.png"}
                    className="h-8 sm:h-12 w-auto"
                    alt="Logo"
                  />
                  <span className="hidden md:block">{window.ENV.APP_NAME}</span>
                </Link>
              </div>
              {!hideMainMenu && (
                <div className="hidden lg:ml-8 lg:flex lg:space-x-4">
                  <NavigationMenu>
                    <NavigationMenuList>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className="rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted">
                          {I18n.t("menu.magazine")}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                            {magazineNavItems.map((item) => (
                              <ListItem
                                key={item.title}
                                to={item.href}
                                title={item.title}
                                icon={item.icon}
                              >
                                {item.description}
                              </ListItem>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className="rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted">
                          {I18n.t("menu.events")}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                            {eventsNavItems.map((item) => (
                              <ListItem
                                key={item.title}
                                to={item.href}
                                title={item.title}
                                icon={item.icon}
                              >
                                {item.description}
                              </ListItem>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className="rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted">
                          {I18n.t("menu.music")}
                        </NavigationMenuTrigger>

                        <NavigationMenuContent>
                          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                            {musicNavItems.map((item) => (
                              <ListItem
                                key={item.title}
                                to={item.href}
                                title={item.title}
                                icon={item.icon}
                              >
                                {item.description}
                              </ListItem>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className="rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted">
                          {I18n.t("menu.store")}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                            <li className="row-span-3">
                              <NavigationMenuLink asChild>
                                <Link
                                  to="/store"
                                  className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-pink-800 p-6 no-underline outline-none focus:shadow-md"
                                >
                                  <Store className="h-6 w-6 mb-2" />
                                  <div className="mb-2 mt-4 text-lg font-medium">Rau Advisors</div>
                                  <p className="text-sm leading-tight text-muted-foreground">
                                    {
                                      I18n.t("menu_main.store.descr")
                                    }
                                  </p>
                                </Link>
                              </NavigationMenuLink>
                            </li>

                            <ListItem
                              to="/store/music"
                              title={I18n.t("menu_main.store.music.title")}
                              icon={Music}
                            >
                              {
                                I18n.t("menu_main.store.music.description")
                              }
                            </ListItem>
                            <ListItem
                              to="/store/services"
                              title={I18n.t("menu_main.store.services.title")}
                              icon={CalendarClock}
                            >
                              {
                                I18n.t("menu_main.store.services.description")
                              }
                            </ListItem>

                            {/*<ListItem
                              to="/store/merch"
                              title={I18n.t("menu_main.store.merch.description")}
                              icon={Package}
                            >
                              {
                                I18n.t("menu_main.store.merch.description")
                              }
                            </ListItem>*/}

                            <ListItem
                              to="/store/gear"
                              title={I18n.t("menu_main.store.gear.description")}
                              icon={Package}
                            >
                              {
                                I18n.t("menu_main.store.gear.description")
                              }
                            </ListItem>
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>
                </div>
              )}
            </div>

            {/* Mobile Menu Button and User Menu */}
            <div className="lg:hidden mt-3 flex items-center space-x-2">
              <div className="flex items-center gap-2">
                <Link
                  to="/search"
                  className="rounded-full p-2 hover:bg-muted transition-colors"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </Link>
                {isMobile && <CartIndicator isPrimary={false} />}
                {currentUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-10 w-10 rounded-full"
                      >
                        <Avatar>
                          <AvatarImage
                            src={currentUser.avatar_url?.small}
                            alt={currentUser.username}
                          />
                          <AvatarFallback>
                            {currentUser.username?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <NotificationBadge count={unreadMessagesCount} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56"
                      align="end"
                      forceMount
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {currentUser.username}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {currentUser.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link to={`/${currentUser.username}`}>
                            <User className="mr-2 h-4 w-4" />
                            <span>{I18n.t("menu.profile")}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/${currentUser.username}/settings`}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>{I18n.t("menu.settings")}</span>
                          </Link>
                        </DropdownMenuItem>
                        {renderMessagesMenuItem()}
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator />

                      <DropdownMenuGroup>
                        {currentUser.is_creator && (
                          <DropdownMenuItem asChild>
                            <Link to={`/${currentUser.username}/tracks`}>
                              <Music className="mr-2 h-4 w-4" />
                              <span>{I18n.t("menu.my_music")}</span>
                            </Link>
                          </DropdownMenuItem>
                        )}

                        {currentUser.is_creator && (
                          <DropdownMenuItem asChild>
                            <Link to="/articles/mine">
                              <FileText className="mr-2 h-4 w-4" />
                              <span>{I18n.t("menu.my_articles")}</span>
                            </Link>
                          </DropdownMenuItem>
                        )}

                        {currentUser.is_creator && (
                          <DropdownMenuItem asChild>
                            <Link to="/events/mine">
                              <Calendar className="mr-2 h-4 w-4" />
                              <span>{I18n.t("menu.my_events")}</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator />

                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link to="/purchases">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            <span>{I18n.t("menu.my_purchases")}</span>
                          </Link>
                        </DropdownMenuItem>

                        {currentUser.can_sell_products && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link to="/sales">
                                <Store className="mr-2 h-4 w-4" />
                                <span>{I18n.t("menu.my_sales")}</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Link to={`/${currentUser.username}/products`}>
                                <Package className="mr-2 h-4 w-4" />
                                <span>{I18n.t("menu.my_products")}</span>
                              </Link>
                            </DropdownMenuItem>

                            {currentUser?.is_admin &&
                              <DropdownMenuItem asChild>
                                <Link to={`/courses/mine`}>
                                  <Package className="mr-2 h-4 w-4" />
                                  <span>{I18n.t("menu.my_courses")}</span>
                                </Link>
                              </DropdownMenuItem>
                            }
                          </>
                        )}


                        <DropdownMenuItem asChild>
                          <Link to="/service_bookings">
                            <CalendarClock className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.service_bookings')}</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator />

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Languages className="mr-2 h-4 w-4" />
                          <span>{I18n.t("menu.language")}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => setLocale("en")}>
                            <span className="mr-2">🇺🇸</span> English
                            {currentLocale === "en" && (
                              <span className="ml-2">✓</span>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocale("es")}>
                            <span className="mr-2">🇪🇸</span> Español
                            {currentLocale === "es" && (
                              <span className="ml-2">✓</span>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{I18n.t("menu.log_out")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <MobileNavigation
                storeNavItems={storeNavItems}
                eventsNavItems={eventsNavItems}
                magazineNavItems={magazineNavItems}
                musicNavItems={musicNavItems}
                currentUser={currentUser}
              />
            </div>

            <div className="hidden lg:flex items-center justify-end space-x-4">


              <div className="flex items-center gap-2">

                <Link
                  to="/search"
                  className="rounded-full p-2 hover:bg-muted transition-colors"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </Link>

                {!isMobile && <CartIndicator isPrimary={true} />}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="mr-2"
              >
                {isDarkMode ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>

              {currentUser ? (
                <>
                  <Link
                    to="/tracks/new"
                    className="hidden lg:block rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted"
                  >
                    {I18n.t("menu.upload")}
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-10 w-10 rounded-full"
                      >
                        <Avatar>
                          <AvatarImage
                            src={currentUser.avatar_url?.small}
                            alt={currentUser.username}
                          />
                          <AvatarFallback>
                            {currentUser.username?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <NotificationBadge count={unreadMessagesCount} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56"
                      align="end"
                      forceMount
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {currentUser.username}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {currentUser.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link to={`/${currentUser.username}`}>
                            <User className="mr-2 h-4 w-4" />
                            <span>{I18n.t("menu.profile")}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/${currentUser.username}/settings`}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>{I18n.t("menu.settings")}</span>
                          </Link>
                        </DropdownMenuItem>
                        {renderMessagesMenuItem()}
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator />

                      <DropdownMenuGroup>
                        {currentUser.is_creator && (
                          <DropdownMenuItem asChild>
                            <Link to={`/${currentUser.username}/tracks`}>
                              <Music className="mr-2 h-4 w-4" />
                              <span>{I18n.t("menu.my_music")}</span>
                            </Link>
                          </DropdownMenuItem>
                        )}

                        {currentUser.is_creator && (
                          <DropdownMenuItem asChild>
                            <Link to="/articles/mine">
                              <FileText className="mr-2 h-4 w-4" />
                              <span>{I18n.t("menu.my_articles")}</span>
                            </Link>
                          </DropdownMenuItem>
                        )}

                        {currentUser.is_creator && (
                          <DropdownMenuItem asChild>
                            <Link to="/events/mine">
                              <Calendar className="mr-2 h-4 w-4" />
                              <span>{I18n.t("menu.my_events")}</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator />

                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link to="/purchases">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            <span>{I18n.t("menu.my_purchases")}</span>
                          </Link>
                        </DropdownMenuItem>

                        {currentUser.can_sell_products && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link to="/sales">
                                <Store className="mr-2 h-4 w-4" />
                                <span>{I18n.t("menu.my_sales")}</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Link to={`/${currentUser.username}/products`}>
                                <Package className="mr-2 h-4 w-4" />
                                <span>{I18n.t("menu.my_products")}</span>
                              </Link>
                            </DropdownMenuItem>

                            {currentUser?.is_admin &&
                              <DropdownMenuItem asChild>
                                <Link to={`/courses/mine`}>
                                  <Package className="mr-2 h-4 w-4" />
                                  <span>{I18n.t("menu.my_courses")}</span>
                                </Link>
                              </DropdownMenuItem>
                            }
                          </>
                        )}


                        <DropdownMenuItem asChild>
                          <Link to="/service_bookings">
                            <CalendarClock className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.service_bookings')}</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator />

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Languages className="mr-2 h-4 w-4" />
                          <span>{I18n.t("menu.language")}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => setLocale("en")}>
                            <span className="mr-2">🇺🇸</span> English
                            {currentLocale === "en" && (
                              <span className="ml-2">✓</span>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocale("es")}>
                            <span className="mr-2">🇪🇸</span> Español
                            {currentLocale === "es" && (
                              <span className="ml-2">✓</span>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{I18n.t("menu.log_out")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center">
                  <a
                    href="/users/sign_in"
                    className="rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted"
                  >
                    {I18n.t("menu.log_in")}
                  </a>
                  <a
                    href="/users/sign_up"
                    className="ml-4 inline-flex items-center justify-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
                  >
                    {I18n.t("menu.register")}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
