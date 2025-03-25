import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { useForm } from 'react-hook-form'
import { get, post, destroy, put } from '@rails/request.js'
import { useToast } from '../../hooks/use-toast'

export default function UserLinks() {
  const { username } = useParams()
  const { toast } = useToast()
  const { register: registerSocial, handleSubmit: handleSubmitSocial, formState: { errors: socialErrors }, reset: resetSocial, setValue: setValueSocial } = useForm()
  const { register: registerNew, handleSubmit: handleSubmitNew, formState: { errors: newErrors }, reset: resetNew, setValue: setValueNew } = useForm()
  const [isSocialDialogOpen, setIsSocialDialogOpen] = React.useState(false)
  const [isNewLinkDialogOpen, setIsNewLinkDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editingLink, setEditingLink] = React.useState(null)
  
  const { 
    data, 
    items: links,
    isLoading, 
    error,
    page,
    fetchItems
  } = useInfiniteScroll(`/${username}/links.json`)

  const [linkTypes, setLinkTypes] = useState({})
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)
  const [wizardStep, setWizardStep] = useState('choose') // 'choose' or 'configure'
  const [selectedServices, setSelectedServices] = useState([])

  useEffect(() => {
    // Reset and initialize form values when linkTypes change
    Object.keys(linkTypes).forEach(type => {
      setValueSocial(`services[${type}]`, false)
    })
  }, [linkTypes, setValueSocial])

  useEffect(() => {
    const fetchLinkTypes = async () => {
      if (isSocialDialogOpen) {
        setIsLoadingTypes(true)
        try {
          const response = await get(`/${username}/links/wizard/new.json`)
          if (response.ok) {
            const data = await response.json
            setLinkTypes(data.link_types)
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load social media types",
          })
        } finally {
          setIsLoadingTypes(false)
        }
      }
    }

    fetchLinkTypes()
  }, [isSocialDialogOpen])

  const onSubmitSocial = async (formData) => {
    try {
      if (wizardStep === 'choose') {
        console.log('Raw form data:', formData)
       
        const response = await post(`/${username}/links/wizard/configure.json`, {
          body: formData
        })

        if (response.ok) {
          const data = await response.json
          if (data.error) {
            toast({
              variant: "destructive",
              title: "Error",
              description: data.error,
            })
          } else {
            setSelectedServices(data.user_links)
            setLinkTypes(data.link_types || {})
            setWizardStep('configure')
          }
        }
      } else {
        // For the configure step, we need to transform the form data into the expected format
        const userLinksAttributes = selectedServices.map((service) => {
          return {
            type: service.type,
            username: formData[service.type]?.username || '',
            custom_url: formData[service.type]?.custom_url || '',
            title: formData[service.type]?.title || '',
            id: formData[service.type]?.id || null
          }
        })

        const response = await post(`/${username}/links/wizard.json`, {
          body: { user: { user_links_attributes: userLinksAttributes } }
        })

        if (response.ok) {
          const data = await response.json
          if (data.error) {
            toast({
              variant: "destructive",
              title: "Error",
              description: data.error,
            })
          } else {
            toast({
              title: "Success",
              description: "Social media links were successfully configured.",
            })
            resetSocial()
            setWizardStep('choose')
            setIsSocialDialogOpen(false)
            fetchItems(page)
          }
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data) return null

  const { user } = data

  const renderLinkInput = (type, linkData) => {

    const baseClasses = "w-full"
    const fieldName = type === 'website' ? 'custom_url' : 'username'
    const label = type === 'website' ? 'URL' :
                 type === 'whatsapp' ? 'Phone Number' :
                 type === 'amazon' ? 'Amazon Shop Name' :
                 'Username'

    const placeholder = type === 'website' ? 'Enter the full URL' :
                       type === 'whatsapp' ? '+1234567890' :
                       type === 'amazon' ? 'your-shop-name' :
                       type === 'thread' ? 'username' :
                       type === 'snapchat' ? 'snapchat_username' :
                       type === 'soundcloud' ? 'artist-name' :
                       'Enter your username'

    const helper = type === 'whatsapp' ? 'Include country code (e.g., +1 for US)' :
                  type === 'amazon' ? 'Enter your Amazon shop name (found in your store URL)' :
                  type === 'thread' ? 'Enter without @ symbol (e.g., \'username\' not \'@username\')' :
                  type === 'snapchat' ? 'Your Snapchat username without snapchat.com/add/' :
                  type === 'soundcloud' ? 'Your SoundCloud profile name (found in your profile URL)' :
                  null

    return (
      <div key={type} className="bg-muted p-4 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <i className={`${linkData.icon_class} text-xl`}></i>
          <h3 className="text-lg font-medium text-default">{linkData.name}</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor={`${type}.${fieldName}`}>{label}</Label>
            <Input
              id={`${type}.${fieldName}`}
              {...registerSocial(`${type}.${fieldName}`)}
              className={baseClasses}
              placeholder={placeholder}
            />
            {helper && (
              <p className="mt-1 text-sm text-gray-500">{helper}</p>
            )}
          </div>

          <div>
            <Label htmlFor={`${type}.title`}>Display Title (optional)</Label>
            <Input
              id={`${type}.title`}
              {...registerSocial(`${type}.title`)}
              className={baseClasses}
              placeholder={linkData.name}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-default shadow rounded-lg p-6">
        <div className="flex flex-col items-center justify-between mb-6">
            <div className="relative aspect-square overflow-hidden rounded-full mb-4">
              <img 
                src={user.avatar_url.medium} 
                alt={user.username}
                className="object-cover w-40 h-40 group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            <h1 className="text-2xl font-bold text-default py-3">
              {user.social_title}
            </h1>

            <p className="text-sm text-muted pb-4">
              {user.social_description}
            </p>

            {links && links[0]?.can_edit && (
              <div className="space-x-4">
                <Dialog open={isNewLinkDialogOpen} onOpenChange={setIsNewLinkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default">
                      Add New Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Link</DialogTitle>
                      <DialogDescription>
                        Add a custom link to share with your audience.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitNew(async (data) => {
                      setIsNewLinkDialogOpen(false)
                      try {
                        const response = await post(`/${username}/links.json`, {
                          body: {
                            user_links_website_link: {
                              title: data.title,
                              custom_url: data.url
                            }
                          }
                        })

                        if (response.ok) {
                          toast({
                            title: "Success",
                            description: "Link was successfully added.",
                          })
                          resetNew()
                          fetchItems(page)
                        } else {
                          const errorData = await response.json
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: errorData.error || "Failed to add link",
                          })
                        }
                      } catch (error) {
                        console.log(error)
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: "An unexpected error occurred",
                        })
                      }
                    })} className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="url">URL</Label>
                        <Input
                          id="url"
                          {...registerNew("url", { required: "URL is required" })}
                          placeholder="https://example.com"
                        />
                        {newErrors.url && (
                          <p className="text-sm text-red-500 mt-1">{newErrors.url.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="title">Display Title</Label>
                        <Input
                          id="title"
                          {...registerNew("title", { required: "Title is required" })}
                          placeholder="My Website"
                        />
                        {newErrors.title && (
                          <p className="text-sm text-red-500 mt-1">{newErrors.title.message}</p>
                        )}
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsNewLinkDialogOpen(false)
                            resetNew()
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          Add Link
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog 
                  open={isSocialDialogOpen} 
                  onOpenChange={(open) => {
                    setIsSocialDialogOpen(open)
                    if (!open) {
                      setWizardStep('choose')
                      resetSocial()
                      // Reset all checkbox values
                      Object.keys(linkTypes).forEach(type => {
                        setValueSocial(`services[${type}]`, false)
                      })
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      Configure Social Media
                    </Button>
                  </DialogTrigger>
               
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {wizardStep === 'choose' ? 'Choose Social Media Services' : 'Configure Your Social Media Links'}
                      </DialogTitle>
                      <DialogDescription>
                        {wizardStep === 'choose' 
                          ? 'Select which social media services you want to configure.'
                          : 'Add your social media profiles to share with your audience.'}
                      </DialogDescription>
                    </DialogHeader>

                    {isLoadingTypes ? (
                      <div className="flex justify-center py-8">
                        Loading...
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitSocial(onSubmitSocial)} className="space-y-8 mt-4">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          {wizardStep === 'choose' 
                            ? Object.entries(linkTypes).map(([type, data]) => (
                                <div key={type} className="bg-muted p-4 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      id={`services[${type}]`}
                                      {...registerSocial(`services[${type}]`, {
                                        onChange: (e) => {
                                          setValueSocial(`services[${type}]`, e.target.checked)
                                        }
                                      })}
                                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div className="flex items-center space-x-3">
                                      <i className={`${data.icon_class} text-xl`}></i>
                                      <Label htmlFor={`services[${type}]`} className="text-lg font-medium text-default">
                                        {data.name}
                                      </Label>
                                    </div>
                                  </div>
                                </div>
                              ))
                            : selectedServices.map((service) => renderLinkInput(service.type, service))}
                        </div>

                        <div className="flex justify-end space-x-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsSocialDialogOpen(false)
                              setWizardStep('choose')
                              resetSocial()
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">
                            {wizardStep === 'choose' ? 'Next' : 'Save Links'}
                          </Button>
                        </div>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {links.map((link) => (
              <div key={link.id} className="block p-4 bg-default rounded-lg border border-muted">
                <div className="flex items-center justify-between">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 flex-1 hover:opacity-75 transition-opacity duration-200"
                    onClick={() => {
                      // Track click if needed
                      console.log('Link clicked:', link.title, link.url)
                    }}
                  >
                    <i className={`${link.icon_class} text-muted`} />
                    <div className="flex flex-col">
                      <span className="font-medium text-default">{link.title}</span>
                      <p className="text-sm text-muted mt-1">{link.url}</p>
                    </div>
                  </a>

                  {link.can_edit && (
                    <div className="flex space-x-2 text-xs">
                      <button
                        onClick={() => {
                          setEditingLink(link)
                          setValueNew('url', link.custom_url || link.url)
                          setValueNew('title', link.title)
                          setIsEditDialogOpen(true)
                        }}
                        className="text-muted hover:text-default"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this link?')) {
                            try {
                              const response = await destroy(`/${username}/links/${link.id}.json`)
                              
                              if (response.ok) {
                                toast({
                                  title: "Success",
                                  description: "Link was successfully deleted.",
                                })
                                fetchItems(page)
                              } else {
                                const data = await response.json
                                toast({
                                  variant: "destructive",
                                  title: "Error",
                                  description: data.error || "Failed to delete link",
                                })
                              }

                            } catch (error) {
                              console.log(error)
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: "An unexpected error occurred",
                              })
                            }
                          }
                        }}
                        className="text-muted hover:text-default"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) {
              setEditingLink(null)
              resetNew()
            }
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Link</DialogTitle>
                <DialogDescription>
                  Update your custom link details.
                </DialogDescription>
              </DialogHeader>

              {editingLink && (
                <form onSubmit={handleSubmitNew(async (data) => {
                  try {
                    const response = await put(`/${username}/links/${editingLink.id}.json`, {
                      body: {
                        user_links_website_link: {
                          title: data.title,
                          custom_url: data.url
                        }
                      }
                    })

                    if (response.ok) {
                      toast({
                        title: "Success",
                        description: "Link was successfully updated.",
                      })
                      resetNew()
                      fetchItems(page)
                    } else {
                      const errorData = await response.json
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: errorData.error || "Failed to update link",
                      })
                    }
                  } catch (error) {
                    console.log(error)
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "An unexpected error occurred",
                    })
                  } finally {
                    setIsEditDialogOpen(false)
                  }
                })} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="edit-url">URL</Label>
                    <Input
                      id="edit-url"
                      {...registerNew("url", { 
                        required: "URL is required",
                      })}
                      placeholder="https://example.com"
                    />
                    {newErrors.url && (
                      <p className="text-sm text-red-500 mt-1">{newErrors.url.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="edit-title">Display Title</Label>
                    <Input
                      id="edit-title"
                      {...registerNew("title", { 
                        required: "Title is required",
                      })}
                      placeholder="My Website"
                    />
                    {newErrors.title && (
                      <p className="text-sm text-red-500 mt-1">{newErrors.title.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false)
                        setEditingLink(null)
                        resetNew()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Update Link
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
      </div>
    </div>
  )
}
