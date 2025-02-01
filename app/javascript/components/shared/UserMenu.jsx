import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Button } from "../ui/button"
import { useThemeStore } from "../../stores/theme"
import useAuthStore from "../../stores/authStore"

export default function UserMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isDarkMode, toggleDarkMode } = useThemeStore()
  const { currentUser, labelUser, cartItemCount, signOut } = useAuthStore()

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
                  <img src="/logo.png" className="h-12 w-auto" alt="Logo" />
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

            <div className="flex items-center px-2 lg:px-0">
              {cartItemCount > 0 && (
                <div className="checkout-link">
                  <Link to="/cart" className="text-white px-4 py-2 rounded-full flex items-center text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    Cart
                    <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold">
                      {cartItemCount}
                    </span>
                  </Link>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex"
                onClick={toggleDarkMode}
              >
                {isDarkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex items-center space-x-1"
                asChild
              >
                <Link to="/tracks/new">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                  <span>Upload</span>
                </Link>
              </Button>

              {currentUser ? (
                <div className="hidden lg:ml-4 lg:flex lg:items-center z-50">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-2 h-8 px-2">
                        <img
                          src={currentUser.avatar.small}
                          alt={currentUser.username}
                          className="h-8 w-8 rounded-full"
                        />
                        <span className="text-sm">{currentUser.username}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{currentUser.username}</p>
                          <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {currentUser.is_creator && (
                        <DropdownMenuItem asChild>
                          <Link to={`/${currentUser.username}`}>
                            {currentUser.label ? 'My Label' : 'My Music'}
                          </Link>
                        </DropdownMenuItem>
                      )}

                      {(currentUser.is_admin || currentUser.editor) && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to="/articles/mine">My Articles</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/events/mine">My Events</Link>
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuItem asChild>
                        <Link to="/purchases">My Purchases</Link>
                      </DropdownMenuItem>

                      {currentUser.can_sell_products && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to={`/${currentUser.username}/products`}>
                              My Products & Merch
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/sales">My Sales</Link>
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem asChild>
                        <Link to={`/${currentUser.username}/settings`}>Settings</Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link to="/plain/docs">Docs</Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem>
                        <form action="/users/sign_out" method="post" className="w-full">
                          <input type="hidden" name="_method" value="delete" />
                          <button type="submit" className="w-full text-left">
                            Log Out
                          </button>
                        </form>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <div className="flex items-center px-2 py-2">
                        <Link
                          to="?locale=en"
                          className={`${window.I18n.locale === 'en' ? 'text-brand-600' : 'text-gray-700 dark:text-gray-300'} px-2 text-sm`}
                        >
                          English
                        </Link>
                        <Link
                          to="?locale=es"
                          className={`${window.I18n.locale === 'es' ? 'text-brand-600' : 'text-gray-700 dark:text-gray-300'} px-2 text-sm`}
                        >
                          Español
                        </Link>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
                    <Link to="/users/sign_up">Register</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
                    <Link to="/users/sign_in">Log In</Link>
                  </Button>
                </>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open menu</span>
                {mobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden" id="mobile-menu">
            <div className="pt-2 pb-3 px-2 space-y-1">
              <Link
                to="/tracks"
                className="block rounded-md py-2 px-3 text-base font-medium text-default hover:text-default hover:bg-muted"
              >
                Music
              </Link>
              <Link
                to="/articles"
                className="block rounded-md py-2 px-3 text-base font-medium text-default hover:text-default hover:bg-muted"
              >
                Magazine
              </Link>
              <Link
                to="/events"
                className="block rounded-md py-2 px-3 text-base font-medium text-default hover:text-default hover:bg-muted"
              >
                Events
              </Link>

              {!currentUser && (
                <>
                  <Link
                    to="/users/sign_up"
                    className="block rounded-md py-2 px-3 text-base font-medium text-default hover:text-default hover:bg-muted"
                  >
                    Register
                  </Link>
                  <Link
                    to="/users/sign_in"
                    className="block rounded-md py-2 px-3 text-base font-medium text-default hover:text-default hover:bg-muted"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>

            {currentUser && (
              <div className="pt-4 pb-3 border-t border-gray-500">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <img src={currentUser.avatar} alt={currentUser.username} className="h-10 w-10 rounded-full" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-default">{currentUser.username}</div>
                    <div className="text-sm font-medium text-gray-200">{currentUser.email}</div>
                  </div>
                </div>

                <div className="mt-3 px-2 space-y-1">
                  {currentUser.is_creator && currentUser.username && (
                    <Link
                      to={`/${currentUser.username}`}
                      className="block rounded-md py-2 px-3 text-base font-medium text-gray-200 hover:text-default hover:bg-muted"
                    >
                      My Music
                    </Link>
                  )}

                  {currentUser.is_admin && (
                    <>
                      <Link
                        to="/articles/mine"
                        className="block rounded-md py-2 px-3 text-base font-medium text-gray-200 hover:text-default hover:bg-muted"
                      >
                        My Articles
                      </Link>
                      <Link
                        to="/events/mine"
                        className="block rounded-md py-2 px-3 text-base font-medium text-gray-200 hover:text-default hover:bg-muted"
                      >
                        My Events
                      </Link>
                    </>
                  )}

                  <Link
                    to="/purchases/tickets"
                    className="block rounded-md py-2 px-3 text-base font-medium text-gray-200 hover:text-default hover:bg-muted"
                  >
                    My Purchases
                  </Link>

                  {currentUser.can_sell_products && (
                    <Link
                      to={`/${currentUser.username}/products`}
                      className="block rounded-md py-2 px-3 text-base font-medium text-gray-200 hover:text-default hover:bg-muted"
                    >
                      My Products
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  )
}
