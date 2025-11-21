import React from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { get, post, put, destroy } from '@rails/request.js'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import I18n from '@/stores/locales'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Trash2, Upload, Users, Mail } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const listSchema = z.object({
  name: z.string().min(2, {
    message: I18n.t('event_lists.form.name.validation', { defaultValue: 'Name must be at least 2 characters' }),
  }),
})

const contactSchema = z.object({
  email: z.string().email({
    message: I18n.t('event_lists.contacts.form.email.validation', { defaultValue: 'Invalid email address' }),
  }),
  name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  dni: z.string().optional(),
  country: z.string().optional(),
})

export default function EventLists() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [lists, setLists] = React.useState([])
  const [listsPagination, setListsPagination] = React.useState(null)
  const [selectedList, setSelectedList] = React.useState(null)
  const [contacts, setContacts] = React.useState([])
  const [contactsPagination, setContactsPagination] = React.useState(null)
  const [isListDialogOpen, setIsListDialogOpen] = React.useState(false)
  const [isContactDialogOpen, setIsContactDialogOpen] = React.useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [listToDelete, setListToDelete] = React.useState(null)
  const [editingList, setEditingList] = React.useState(null)
  const [editingContact, setEditingContact] = React.useState(null)
  const [importFile, setImportFile] = React.useState(null)
  const [importing, setImporting] = React.useState(false)

  const listForm = useForm({
    resolver: zodResolver(listSchema),
    defaultValues: {
      name: "",
    }
  })

  const contactForm = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: "",
      name: "",
      first_name: "",
      last_name: "",
      dni: "",
      country: "",
    }
  })

  React.useEffect(() => {
    fetchLists()
  }, [slug])

  React.useEffect(() => {
    if (selectedList) {
      fetchContacts(selectedList.id)
    }
  }, [selectedList])

  const fetchLists = async (page = 1) => {
    try {
      const response = await get(`/events/${slug}/event_lists.json?page=${page}`)
      const data = await response.json
      setLists(data.collection)
      setListsPagination(data.metadata)
    } catch (error) {
      console.error('Error fetching lists:', error)
      toast({
        title: I18n.t('event_lists.messages.error', { defaultValue: 'Error' }),
        description: I18n.t('event_lists.messages.load_error', { defaultValue: 'Failed to load lists' }),
        variant: "destructive",
      })
    }
  }

  const fetchContacts = async (listId, page = 1) => {
    try {
      const response = await get(`/events/${slug}/event_lists/${listId}/event_list_contacts.json?page=${page}`)
      const data = await response.json
      setContacts(data.collection)
      setContactsPagination(data.metadata)
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  const onSubmitList = async (data) => {
    try {
      if (editingList) {
        const response = await put(`/events/${slug}/event_lists/${editingList.id}.json`, {
          body: JSON.stringify({ event_list: data }),
        })

        if (response.ok) {
          toast({
            title: I18n.t('event_lists.messages.update_success'),
          })
          fetchLists()
          setIsListDialogOpen(false)
          setEditingList(null)
          listForm.reset()
        }
      } else {
        const response = await post(`/events/${slug}/event_lists.json`, {
          body: JSON.stringify({ event_list: data }),
        })

        if (response.ok) {
          toast({
            title: I18n.t('event_lists.messages.create_success'),
          })
          fetchLists()
          setIsListDialogOpen(false)
          listForm.reset()
        }
      }
    } catch (error) {
      console.error('Error saving list:', error)
      toast({
        title: I18n.t('event_lists.messages.error', { defaultValue: 'Error' }),
        description: I18n.t('event_lists.messages.save_error', { defaultValue: 'Failed to save list' }),
        variant: "destructive",
      })
    }
  }

  const onSubmitContact = async (data) => {
    try {
      if (!selectedList) return

      if (editingContact) {
        const response = await put(`/events/${slug}/event_lists/${selectedList.id}/event_list_contacts/${editingContact.id}.json`, {
          body: JSON.stringify({ event_list_contact: data }),
        })

        if (response.ok) {
          toast({
            title: I18n.t('event_lists.contacts.messages.update_success', { defaultValue: 'Contact updated' }),
          })
          fetchContacts(selectedList.id)
          setIsContactDialogOpen(false)
          setEditingContact(null)
          contactForm.reset()
        }
      } else {
        const response = await post(`/events/${slug}/event_lists/${selectedList.id}/event_list_contacts.json`, {
          body: JSON.stringify({ event_list_contact: data }),
        })

        if (response.ok) {
          toast({
            title: I18n.t('event_lists.contacts.messages.create_success', { defaultValue: 'Contact added' }),
          })
          fetchContacts(selectedList.id)
          setIsContactDialogOpen(false)
          contactForm.reset()
        }
      }
    } catch (error) {
      console.error('Error saving contact:', error)
      toast({
        title: I18n.t('event_lists.messages.error', { defaultValue: 'Error' }),
        description: I18n.t('event_lists.contacts.messages.save_error', { defaultValue: 'Failed to save contact' }),
        variant: "destructive",
      })
    }
  }

  const handleDeleteList = async () => {
    if (!listToDelete) return

    try {
      const response = await destroy(`/events/${slug}/event_lists/${listToDelete.id}.json`)

      if (response.ok) {
        toast({
          title: I18n.t('event_lists.messages.delete_success'),
        })
        fetchLists()
        if (selectedList?.id === listToDelete.id) {
          setSelectedList(null)
          setContacts([])
        }
      }
    } catch (error) {
      console.error('Error deleting list:', error)
      toast({
        title: I18n.t('event_lists.messages.error', { defaultValue: 'Error' }),
        description: I18n.t('event_lists.messages.delete_error', { defaultValue: 'Failed to delete list' }),
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setListToDelete(null)
    }
  }

  const handleDeleteContact = async (contactId) => {
    if (!selectedList) return

    try {
      const response = await destroy(`/events/${slug}/event_lists/${selectedList.id}/event_list_contacts/${contactId}.json`)

      if (response.ok) {
        toast({
          title: I18n.t('event_lists.contacts.messages.delete_success', { defaultValue: 'Contact deleted' }),
        })
        fetchContacts(selectedList.id)
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast({
        title: I18n.t('event_lists.messages.error', { defaultValue: 'Error' }),
        description: I18n.t('event_lists.contacts.messages.delete_error', { defaultValue: 'Failed to delete contact' }),
        variant: "destructive",
      })
    }
  }

  const handleImport = async () => {
    if (!importFile || !selectedList) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const response = await post(`/events/${slug}/event_lists/${selectedList.id}/import.json`, {
        body: formData,
      })

      const result = await response.json

      if (response.ok) {
        if (result.errors && result.errors.length > 0) {
          toast({
            title: I18n.t('event_lists.messages.import_partial', {
              imported: result.imported,
              total: result.total
            }),
            description: result.errors.slice(0, 3).join('\n'),
            variant: "warning",
          })
        } else {
          toast({
            title: I18n.t('event_lists.messages.import_success', { count: result.imported }),
          })
        }
        fetchContacts(selectedList.id)
        setIsImportDialogOpen(false)
        setImportFile(null)
      } else {
        toast({
          title: I18n.t('event_lists.messages.error', { defaultValue: 'Error' }),
          description: result.errors?.join(', ') || I18n.t('event_lists.messages.import_error'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error importing contacts:', error)
      toast({
        title: I18n.t('event_lists.messages.error', { defaultValue: 'Error' }),
        description: I18n.t('event_lists.messages.import_error'),
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const openEditListDialog = (list) => {
    setEditingList(list)
    listForm.reset({ name: list.name })
    setIsListDialogOpen(true)
  }

  const openNewListDialog = () => {
    setEditingList(null)
    listForm.reset({ name: "" })
    setIsListDialogOpen(true)
  }

  const openEditContactDialog = (contact) => {
    setEditingContact(contact)
    contactForm.reset(contact)
    setIsContactDialogOpen(true)
  }

  const openNewContactDialog = () => {
    setEditingContact(null)
    contactForm.reset({
      email: "",
      name: "",
      first_name: "",
      last_name: "",
      dni: "",
      country: "",
    })
    setIsContactDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{I18n.t('event_lists.title')}</CardTitle>
              <CardDescription>
                {I18n.t('event_lists.description')}
              </CardDescription>
            </div>
            <Button onClick={openNewListDialog}>
              <Plus className="h-4 w-4 mr-2" />
              {I18n.t('event_lists.new_list')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Lists Column */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Lists ({lists.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lists.map((list) => (
                    <div
                      key={list.id}
                      className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${selectedList?.id === list.id ? 'bg-muted border-primary' : ''
                        }`}
                      onClick={() => setSelectedList(list)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{list.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {list.contacts_count || 0} contacts
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditListDialog(list)
                            }}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setListToDelete(list)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {lists.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No lists yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contacts Column */}
            <Card className="col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">
                    {selectedList ? `${I18n.t('event_lists.contacts.title')} - ${selectedList.name}` : I18n.t('event_lists.contacts.title')}
                  </CardTitle>
                  {selectedList && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsImportDialogOpen(true)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {I18n.t('event_lists.import')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={openNewContactDialog}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {I18n.t('event_lists.contacts.add_contact')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedList ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>First Name</TableHead>
                          <TableHead>Last Name</TableHead>
                          <TableHead>DNI</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell className="font-medium">{contact.email}</TableCell>
                            <TableCell>{contact.name || '-'}</TableCell>
                            <TableCell>{contact.first_name || '-'}</TableCell>
                            <TableCell>{contact.last_name || '-'}</TableCell>
                            <TableCell>{contact.dni || '-'}</TableCell>
                            <TableCell>{contact.country || '-'}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteContact(contact.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {contacts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                              {I18n.t('event_lists.contacts.no_contacts')}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {/* Contacts Pagination */}
                    {contactsPagination && contactsPagination.total_pages > 1 && (
                      <div className="flex justify-center py-4">
                        <Pagination>
                          <PaginationContent>
                            {contactsPagination.prev_page && (
                              <PaginationItem>
                                <PaginationPrevious
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    fetchContacts(selectedList.id, contactsPagination.prev_page)
                                  }}
                                />
                              </PaginationItem>
                            )}

                            {Array.from({ length: contactsPagination.total_pages }, (_, i) => i + 1).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  href="#"
                                  isActive={page === contactsPagination.current_page}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    fetchContacts(selectedList.id, page)
                                  }}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}

                            {contactsPagination.next_page && (
                              <PaginationItem>
                                <PaginationNext
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    fetchContacts(selectedList.id, contactsPagination.next_page)
                                  }}
                                />
                              </PaginationItem>
                            )}
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Select a list to view contacts
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* List Dialog */}
      <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingList ? I18n.t('event_lists.edit_list') : I18n.t('event_lists.new_list')}
            </DialogTitle>
          </DialogHeader>
          <Form {...listForm}>
            <form onSubmit={listForm.handleSubmit(onSubmitList)} className="space-y-4">
              <FormField
                control={listForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('event_lists.form.name.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={I18n.t('event_lists.form.name.placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">
                  {editingList ? I18n.t('save') : I18n.t('event_lists.new_list')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? I18n.t('event_lists.contacts.edit_contact') : I18n.t('event_lists.contacts.add_contact')}
            </DialogTitle>
          </DialogHeader>
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
              <FormField
                control={contactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('event_lists.contacts.form.email.label')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={I18n.t('event_lists.contacts.form.email.placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contactForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('event_lists.contacts.form.name.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={I18n.t('event_lists.contacts.form.name.placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={contactForm.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('event_lists.contacts.form.first_name.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={I18n.t('event_lists.contacts.form.first_name.placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('event_lists.contacts.form.last_name.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={I18n.t('event_lists.contacts.form.last_name.placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={contactForm.control}
                  name="dni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('event_lists.contacts.form.dni.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={I18n.t('event_lists.contacts.form.dni.placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('event_lists.contacts.form.country.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={I18n.t('event_lists.contacts.form.country.placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingContact ? I18n.t('save') : I18n.t('event_lists.contacts.add_contact')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{I18n.t('event_lists.import')}</DialogTitle>
            <DialogDescription>
              {I18n.t('event_lists.form.file.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {I18n.t('event_lists.form.file.label')}
              </label>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files[0])}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleImport}
              disabled={!importFile || importing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? I18n.t('loading') : I18n.t('event_lists.form.upload_button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {I18n.t('event_lists.delete_list')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {I18n.t('event_lists.messages.delete_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{I18n.t('back')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteList}>
              {I18n.t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
