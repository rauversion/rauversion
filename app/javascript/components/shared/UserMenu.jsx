import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "../ui/dropdown-menu"
import { CartIndicator } from '@/components/cart/CartIndicator'
import I18n, {useLocaleStore} from '@/stores/locales'

import { Button } from "../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useThemeStore } from "../../stores/theme"
import useAuthStore from "../../stores/authStore"
import { 
  User, Settings, Music, ShoppingCart, Package, FileText, 
  Calendar, LogOut, Sun, Moon, Bell, Store, CreditCard,
  Languages, CalendarClock, MessageSquare
} from 'lucide-react'

export default function UserMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isDarkMode, toggleDarkMode } = useThemeStore()
  const { currentUser, labelUser, cartItemCount, signOut } = useAuthStore()
  const { setLocale, t, currentLocale } = useLocaleStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const renderMessagesMenuItem = () => (
    <DropdownMenuItem asChild>
      <Link to="/conversations">
        <MessageSquare className="mr-2 h-4 w-4" />
        <span>Messages</span>
      </Link>
    </DropdownMenuItem>
  )

  return (
    <>
      {labelUser && currentUser && (
        <nav className="border-b-muted border-b bg-purple-600 text-white flex justify-center py-1">
          <span className="text-xs">
            {I18n.t('menu.acting_on_behalf')}{' '}
            <span className="font-bold hover:underline">
              <Link to={`/${currentUser.username}`}>{currentUser.username}</Link>
            </span>
            <span className="font-bold underline">
              <a href="/account_connections/impersonate" className="text-default">
                {I18n.t('menu.back_to_label', { username: labelUser.username })}
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
                <Link to="/" className="flex items-center space-x-3 text-default sm:text-2xl text-sm font-extrabold">
                  <img src={"/logo.png"} className="h-12 w-auto" alt="Logo" />
                  <span className="hidden md:block">{window.ENV.APP_NAME}</span>
                </Link>
              </div>
              <div className="lg:ml-8 lg:flex lg:space-x-4">
                <Link to="/tracks" className="rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted">
                  {I18n.t('menu.music')}
                </Link>
                <Link to="/events" className="rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted">
                  {I18n.t('menu.events')}
                </Link>
                <Link to="/articles" className="rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted">
                  {I18n.t('menu.magazine')}
                </Link>
                {
                  currentUser && currentUser.can_sell_products && (
                    <Link to="/store" className="rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted">
                      {I18n.t('menu.store')}
                    </Link>
                  )
                }
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden mt-3 flex items-center space-x-2">
              <div className="flex items-center gap-2">
                <CartIndicator />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="/tracks">
                        <Music className="mr-2 h-4 w-4" />
                        <span>{I18n.t('menu.music')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/events">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>{I18n.t('menu.events')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/articles">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>{I18n.t('menu.magazine')}</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />
                  
                  {currentUser ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/tracks/new">
                          <Music className="mr-2 h-4 w-4" />
                          <span>{I18n.t('menu.upload')}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link to={`/${currentUser.username}`}>
                            <User className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.profile')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/${currentUser.username}/settings`}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.settings')}</span>
                          </Link>
                        </DropdownMenuItem>
                        {renderMessagesMenuItem()}
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link to={`/${currentUser.username}`}>
                            <Music className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.my_music')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/articles/mine">
                            <FileText className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.my_articles')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/events/mine">
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.my_events')}</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link to="/purchases">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.my_purchases')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/sales">
                            <Store className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.my_sales')}</span>
                          </Link>
                        </DropdownMenuItem>
                        {currentUser && currentUser.can_sell_products && (
                          <DropdownMenuItem asChild>
                            <Link to={`/${currentUser.username}/products`}>
                              <Package className="mr-2 h-4 w-4" />
                              <span>{I18n.t('menu.my_products')}</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {currentUser && currentUser.can_sell_products && (
                          <DropdownMenuItem asChild>
                            <Link to="/service_bookings">
                              <CalendarClock className="mr-2 h-4 w-4" />
                              <span>Service Bookings</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{I18n.t('menu.log_out')}</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link to="/login">
                          <User className="mr-2 h-4 w-4" />
                          <span>{I18n.t('menu.log_in')}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/register" className="text-primary">
                          <User className="mr-2 h-4 w-4" />
                          <span>{I18n.t('menu.register')}</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggleDarkMode}>
                    {isDarkMode ? (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>{I18n.t('menu.dark_mode')}</span>
                      </>
                    ) : (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>{I18n.t('menu.light_mode')}</span>
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="hidden lg:flex items-center justify-end space-x-4">
              <div className="flex items-center gap-2">
                <CartIndicator />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="mr-2"
              >
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>

              {currentUser ? (
                <>
                  <Link to="/tracks/new" className="hidden lg:block rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted">
                    {I18n.t('menu.upload')}
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar>
                          <AvatarImage src={currentUser.avatar_url?.small} alt={currentUser.username} />
                          <AvatarFallback>{currentUser.username?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{currentUser.username}</p>
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
                            <span>{I18n.t('menu.profile')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/${currentUser.username}/settings`}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.settings')}</span>
                          </Link>
                        </DropdownMenuItem>
                        {renderMessagesMenuItem()}
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link to={`/${currentUser.username}`}>
                            <Music className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.my_music')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/articles/mine">
                            <FileText className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.my_articles')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/events/mine">
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.my_events')}</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link to="/purchases">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.my_purchases')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/sales">
                            <Store className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.my_sales')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/${currentUser.username}/products`}>
                            <Package className="mr-2 h-4 w-4" />
                            <span>{I18n.t('menu.my_products')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/service_bookings">
                            <CalendarClock className="mr-2 h-4 w-4" />
                            <span>Service Bookings</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Languages className="mr-2 h-4 w-4" />
                          <span>{I18n.t('menu.language')}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => setLocale('en')}>
                            <span className="mr-2">🇺🇸</span> English
                            {currentLocale === 'en' && <span className="ml-2">✓</span>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocale('es')}>
                            <span className="mr-2">🇪🇸</span> Español
                            {currentLocale === 'es' && <span className="ml-2">✓</span>}
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{I18n.t('menu.log_out')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center">
                  <Link
                    to="/login"
                    className="rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted"
                  >
                    {I18n.t('menu.log_in')}
                  </Link>
                  <Link
                    to="/register"
                    className="ml-4 inline-flex items-center justify-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
                  >
                    {I18n.t('menu.register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
