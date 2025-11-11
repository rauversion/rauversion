import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { useDebounce } from '@/hooks/use_debounce'
import { get, post } from '@rails/request.js'
import I18n from '@/stores/locales'

export default function AccountConnectionForm() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchResults, setSearchResults] = useState([])
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [loading, setLoading] = useState(false)

  const {
    register: registerNew,
    handleSubmit: handleNewSubmit,
    formState: { errors: newErrors }
  } = useForm()

  const {
    register: registerExisting,
    handleSubmit: handleExistingSubmit,
    watch
  } = useForm()

  const searchQuery = watch('search', '')
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedSearchQuery?.length > 2) {
        try {
          const response = await get('/account_connections/user_search.json', {
            query: { q: debouncedSearchQuery }
          })
          const data = await response.json
          setSearchResults(data.collection || [])
        } catch (error) {
          console.error('Error searching artists:', error)
          setSearchResults([])
        }
      } else {
        setSearchResults([])
      }
    }
    
    fetchResults()
  }, [debouncedSearchQuery])


  const onSubmitNew = async (data) => {
    setLoading(true)

    try {
      const response = await post('/account_connections.json', {
        body: {
          form_models_artist_form: {
            ...data,
            request_access: 'request',
            hide: false
          },
          kind: 'new'
        }
      })
      
      const result = await response.json

      if (result.created) {
        toast({
          title: I18n.t('artists.connection_success'),
          description: I18n.t('artists.connection_success_desc'),
        })
        navigate(-1)
      } else {
        toast({
          variant: 'destructive',
          title: I18n.t('artists.connection_error'),
          description: result.error || I18n.t('artists.connection_error_desc'),
        })
      }
    } catch (error) {
      console.error('Error creating connection:', error)
      toast({
        variant: 'destructive',
        title: I18n.t('artists.connection_error'),
        description: I18n.t('artists.connection_error_desc'),
      })
    }
    setLoading(false)
  }

  const onSubmitExisting = async () => {
    if (!selectedArtist) return
    
    setLoading(true)
    try {
      const response = await post('/account_connections.json', {
        body: {
          user: {
            id: selectedArtist.id
          },
          commit: 'Send connect request'
        }
      })
      
      const result = await response.json
      if (result.created) {
        toast({
          title: I18n.t('artists.connection_success'),
          description: I18n.t('artists.connection_success_desc'),
        })
        navigate(-1)
      } else {
        toast({
          variant: 'destructive',
          title: I18n.t('artists.connection_error'),
          description: result.error || I18n.t('artists.connection_error_desc'),
        })
      }
    } catch (error) {
      console.error('Error creating connection:', error)
      toast({
        variant: 'destructive',
        title: I18n.t('artists.connection_error'),
        description: I18n.t('artists.connection_error_desc'),
      })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {I18n.t('artists.new_connection')}
      </h1>

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">
            {I18n.t('artists.new_artist')}
          </TabsTrigger>
          <TabsTrigger value="existing">
            {I18n.t('artists.existing_artist')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <form onSubmit={handleNewSubmit(onSubmitNew)} className="space-y-4">
            <div>
              <Label htmlFor="username">
                {I18n.t('artists.username')}
              </Label>
              <Input
                id="username"
                {...registerNew('username', { required: true })}
                className={newErrors.username ? 'border-red-500' : ''}
              />
              {newErrors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {I18n.t('artists.username_required')}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">
                {I18n.t('artists.email')}
              </Label>
              <Input
                id="email"
                type="email"
                {...registerNew('email', { required: true })}
                className={newErrors.email ? 'border-red-500' : ''}
              />
              {newErrors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {I18n.t('artists.email_required')}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="first_name">
                {I18n.t('artists.first_name')}
              </Label>
              <Input
                id="first_name"
                {...registerNew('first_name')}
              />
            </div>

            <div>
              <Label htmlFor="last_name">
                {I18n.t('artists.last_name')}
              </Label>
              <Input
                id="last_name"
                {...registerNew('last_name')}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? I18n.t('loading') : I18n.t('artists.create_connection')}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="existing">
          <form onSubmit={handleExistingSubmit(onSubmitExisting)} className="space-y-4">
            <div>
              <Label htmlFor="search">
                {I18n.t('artists.search')}
              </Label>
              <Input
                id="search"
                {...registerExisting('search')}
                placeholder={I18n.t('artists.search_placeholder')}
              />
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y">
                {searchResults.map((artist) => (
                  <div
                    key={artist.id}
                    className={`p-4 flex items-center justify-between cursor-pointer hover:bg-muted dark:hover:bg-secondary ${
                      selectedArtist?.id === artist.id ? 'bg-muted dark:bg-secondary' : ''
                    }`}
                    onClick={() => setSelectedArtist(artist)}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={artist.avatar_url?.medium}
                        alt={artist.username}
                        className="h-10 w-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{artist.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {artist.full_name}
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={selectedArtist?.id === artist.id}
                      onChange={() => {}}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {searchQuery?.length > 2 && searchResults.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                {I18n.t('artists.no_results')}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !selectedArtist}
              className="w-full"
            >
              {loading
                ? I18n.t('loading')
                : I18n.t('artists.send_connection_request')}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
