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
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "../ui/dropdown-menu"
import { CartIndicator } from '@/components/cart/CartIndicator'

import { Button } from "../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { useThemeStore } from "../../stores/theme"
import useAuthStore from "../../stores/authStore"
import { 
  User, Settings, Music, ShoppingCart, Package, FileText, 
  Calendar, LogOut, Sun, Moon, Bell, Store, CreditCard 
} from 'lucide-react'

export default function UserMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isDarkMode, toggleDarkMode } = useThemeStore()
  const { currentUser, labelUser, cartItemCount, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {labelUser && currentUser && (
        <nav className="border-b-muted border-b bg-purple-600 text-white flex justify-center py-1">
          <span className="text-xs">
            Acting on behalf of{' '}
            <span className="font-bold hover:underline">
              <Link to={`/${currentUser.username}`}>{currentUser.username}</Link>
            </span>
            <span className="font-bold underline">
              <Link to="/account/connections" className="text-default">
                back to: {labelUser.username} label
              </Link>
            </span>
          </span>
        </nav>
      )}

      <nav className="border-b-muted border-b" aria-label="Global">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 text-default">
          <div className="flex justify-between h-16">
            <div className="flex items-center px-2 lg:px-0">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center space-x-3 text-default sm:text-2xl text-sm font-extrabold">
                  <img src={"/logo.png"} className="h-12 w-auto" alt="Logo" />
                  <span>{window.ENV.APP_NAME}</span>
                </Link>
              </div>
              <div className="hidden lg:ml-8 lg:flex lg:space-x-4">
                <Link to="/tracks" className="rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted">
                  Music
                </Link>
                <Link to="/events" className="rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted">
                  Events
                </Link>
                <Link to="/articles" className="rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted">
                  Magazine
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4">
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
                  <Link to="/tracks/new" className="rounded-md py-2 px-3 text-sm font-medium text-default hover:bg-muted">
                    Upload
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
                            <span>Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/${currentUser.username}/settings`}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link to="/my-music">
                            <Music className="mr-2 h-4 w-4" />
                            <span>My Music</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/articles/mine">
                            <FileText className="mr-2 h-4 w-4" />
                            <span>My Articles</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/events/mine">
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>My Events</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link to="/purchases">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            <span>My Purchases</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/sales">
                            <Store className="mr-2 h-4 w-4" />
                            <span>My Sales</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/${currentUser.username}/products`}>
                            <Package className="mr-2 h-4 w-4" />
                            <span>My Products</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
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
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="ml-4 inline-flex items-center justify-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
                  >
                    Register
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
