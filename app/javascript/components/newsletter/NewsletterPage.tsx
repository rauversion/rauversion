import React from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AudiencesManager } from "@/components/newsletter/AudiencesManager"
import { ContactListsManager } from "@/components/newsletter/ContactListsManager"

export default function NewsletterPage() {
  return (
    <div className="container mx-auto my-8 space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Newsletter</CardTitle>
            <CardDescription>
              Administra listas, arma audiencias y deja preparado el terreno para campañas y envíos.
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Button asChild>
              <Link to="/newsletter/broadcasts">Abrir broadcasts</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/email-templates">Abrir editor de correos</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="contacts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="contacts">Contactos</TabsTrigger>
              <TabsTrigger value="audiences">Audiencias</TabsTrigger>
            </TabsList>

            <TabsContent value="contacts">
              <ContactListsManager />
            </TabsContent>

            <TabsContent value="audiences">
              <AudiencesManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
