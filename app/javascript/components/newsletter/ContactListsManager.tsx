import React from "react"
import { Plus, Save, Trash2, Upload } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  createNewsletterContact,
  createNewsletterContactList,
  destroyNewsletterContact,
  destroyNewsletterContactList,
  fetchNewsletterContactLists,
  fetchNewsletterContacts,
  importNewsletterContacts,
  updateNewsletterContactList,
} from "@/lib/newsletter/api"
import type {
  NewsletterContactListRecord,
  NewsletterContactRecord,
} from "@/lib/newsletter/types"
import { cn } from "@/lib/utils"

const EMPTY_CONTACT = {
  email: "",
  name: "",
  firstName: "",
  lastName: "",
  country: "",
  dni: "",
}

export function ContactListsManager() {
  const { toast } = useToast()
  const [contactLists, setContactLists] = React.useState<NewsletterContactListRecord[]>([])
  const [selectedListId, setSelectedListId] = React.useState<string | null>(null)
  const [contacts, setContacts] = React.useState<NewsletterContactRecord[]>([])
  const [loadingLists, setLoadingLists] = React.useState(true)
  const [loadingContacts, setLoadingContacts] = React.useState(false)
  const [creatingList, setCreatingList] = React.useState(false)
  const [newListName, setNewListName] = React.useState("")
  const [selectedListName, setSelectedListName] = React.useState("")
  const [savingListName, setSavingListName] = React.useState(false)
  const [newContact, setNewContact] = React.useState(EMPTY_CONTACT)
  const [creatingContact, setCreatingContact] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const selectedList = React.useMemo(
    () => contactLists.find((contactList) => contactList.id === selectedListId) ?? null,
    [contactLists, selectedListId]
  )

  const loadContactLists = React.useCallback(async () => {
    setLoadingLists(true)
    try {
      const lists = await fetchNewsletterContactLists()
      setContactLists(lists)

      setSelectedListId((current) => {
        if (current && lists.some((list) => list.id === current)) return current
        return lists[0]?.id ?? null
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar las listas",
        variant: "destructive",
      })
    } finally {
      setLoadingLists(false)
    }
  }, [toast])

  const loadContacts = React.useCallback(async (contactListId: string) => {
    setLoadingContacts(true)
    try {
      setContacts(await fetchNewsletterContacts(contactListId))
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar los contactos",
        variant: "destructive",
      })
    } finally {
      setLoadingContacts(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadContactLists()
  }, [loadContactLists])

  React.useEffect(() => {
    setSelectedListName(selectedList?.name ?? "")
  }, [selectedList])

  React.useEffect(() => {
    if (!selectedListId) {
      setContacts([])
      return
    }

    loadContacts(selectedListId)
  }, [loadContacts, selectedListId])

  const handleCreateList = async () => {
    if (!newListName.trim()) return

    setCreatingList(true)
    try {
      const created = await createNewsletterContactList(newListName.trim())
      setNewListName("")
      await loadContactLists()
      setSelectedListId(created.id)
      toast({
        title: "Lista creada",
        description: `Se creó ${created.name}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la lista",
        variant: "destructive",
      })
    } finally {
      setCreatingList(false)
    }
  }

  const handleRenameList = async () => {
    if (!selectedList || !selectedListName.trim() || selectedListName.trim() === selectedList.name) return

    setSavingListName(true)
    try {
      await updateNewsletterContactList(selectedList.id, selectedListName.trim())
      await loadContactLists()
      toast({
        title: "Lista actualizada",
        description: "El nombre de la lista se guardó correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el nombre",
        variant: "destructive",
      })
    } finally {
      setSavingListName(false)
    }
  }

  const handleDeleteList = async () => {
    if (!selectedList) return
    if (!window.confirm(`Eliminar la lista "${selectedList.name}"?`)) return

    try {
      await destroyNewsletterContactList(selectedList.id)
      await loadContactLists()
      toast({
        title: "Lista eliminada",
        description: `${selectedList.name} se eliminó correctamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la lista",
        variant: "destructive",
      })
    }
  }

  const handleCreateContact = async () => {
    if (!selectedList || !newContact.email.trim()) return

    setCreatingContact(true)
    try {
      await createNewsletterContact(selectedList.id, {
        email: newContact.email.trim(),
        name: newContact.name.trim(),
        firstName: newContact.firstName.trim(),
        lastName: newContact.lastName.trim(),
        country: newContact.country.trim(),
        dni: newContact.dni.trim(),
      })
      setNewContact(EMPTY_CONTACT)
      await Promise.all([loadContacts(selectedList.id), loadContactLists()])
      toast({
        title: "Contacto agregado",
        description: "El contacto ya quedó disponible para tus audiencias.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el contacto",
        variant: "destructive",
      })
    } finally {
      setCreatingContact(false)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!selectedList) return

    try {
      await destroyNewsletterContact(selectedList.id, contactId)
      await Promise.all([loadContacts(selectedList.id), loadContactLists()])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el contacto",
        variant: "destructive",
      })
    }
  }

  const handleImportContacts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!selectedList || !file) return

    setImporting(true)
    try {
      const result = await importNewsletterContacts(selectedList.id, file)
      await Promise.all([loadContacts(selectedList.id), loadContactLists()])
      toast({
        title: result.errors.length > 0 ? "Importación parcial" : "Importación completada",
        description: `${result.imported} contactos importados de ${result.total}.`,
        variant: result.errors.length > 0 ? "destructive" : undefined,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo importar el CSV",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
      event.target.value = ""
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Listas</CardTitle>
          <CardDescription>Sube CSVs y arma tus bases de contactos propias.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="Nueva lista"
            />
            <Button type="button" onClick={handleCreateList} disabled={creatingList || !newListName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {loadingLists ? (
              <div className="py-6 text-sm text-muted-foreground">Cargando listas…</div>
            ) : contactLists.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Crea tu primera lista para importar contactos desde CSV.
              </div>
            ) : (
              contactLists.map((contactList) => (
                <button
                  key={contactList.id}
                  type="button"
                  className={cn(
                    "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                    selectedListId === contactList.id ? "border-primary bg-primary/5" : "hover:bg-muted/60"
                  )}
                  onClick={() => setSelectedListId(contactList.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{contactList.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {contactList.updatedAt ? new Date(contactList.updatedAt).toLocaleString() : "—"}
                      </div>
                    </div>
                    <Badge variant="outline">{contactList.contactsCount}</Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedList ? selectedList.name : "Selecciona una lista"}</CardTitle>
          <CardDescription>
            {selectedList
              ? "Puedes renombrarla, agregar contactos manualmente o importar un CSV con email, name, first_name, last_name, dni y country."
              : "Elige una lista para ver y administrar sus contactos."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedList ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              No hay una lista seleccionada.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 gap-2">
                  <Input value={selectedListName} onChange={(event) => setSelectedListName(event.target.value)} />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRenameList}
                    disabled={savingListName || !selectedListName.trim() || selectedListName.trim() === selectedList.name}
                  >
                    <Save className="h-4 w-4" />
                    Guardar
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedList.contactsCount} contactos</Badge>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleImportContacts}
                  />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                    <Upload className="h-4 w-4" />
                    {importing ? "Importando…" : "Importar CSV"}
                  </Button>
                  <Button type="button" variant="destructive" onClick={handleDeleteList}>
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Input
                  value={newContact.email}
                  onChange={(event) => setNewContact((current) => ({ ...current, email: event.target.value }))}
                  placeholder="email"
                />
                <Input
                  value={newContact.name}
                  onChange={(event) => setNewContact((current) => ({ ...current, name: event.target.value }))}
                  placeholder="name"
                />
                <Input
                  value={newContact.firstName}
                  onChange={(event) => setNewContact((current) => ({ ...current, firstName: event.target.value }))}
                  placeholder="first_name"
                />
                <Input
                  value={newContact.lastName}
                  onChange={(event) => setNewContact((current) => ({ ...current, lastName: event.target.value }))}
                  placeholder="last_name"
                />
                <Input
                  value={newContact.country}
                  onChange={(event) => setNewContact((current) => ({ ...current, country: event.target.value }))}
                  placeholder="country"
                />
                <Input
                  value={newContact.dni}
                  onChange={(event) => setNewContact((current) => ({ ...current, dni: event.target.value }))}
                  placeholder="dni"
                />
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={handleCreateContact} disabled={creatingContact || !newContact.email.trim()}>
                  <Plus className="h-4 w-4" />
                  {creatingContact ? "Guardando…" : "Agregar contacto"}
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingContacts ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                          Cargando contactos…
                        </TableCell>
                      </TableRow>
                    ) : contacts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                          Esta lista todavía no tiene contactos.
                        </TableCell>
                      </TableRow>
                    ) : (
                      contacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>{contact.resolvedName || "—"}</TableCell>
                          <TableCell>{contact.country || "—"}</TableCell>
                          <TableCell>
                            <Button type="button" size="sm" variant="ghost" onClick={() => handleDeleteContact(contact.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
