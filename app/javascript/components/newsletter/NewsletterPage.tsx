import React from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"

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
import EmailTemplatesTable from "@/components/email-templates/EmailTemplatesTable"
import NewsletterBroadcastsManager from "@/components/newsletter/NewsletterBroadcastsPage"

const NEWSLETTER_TABS = ["contacts", "audiences", "broadcasts", "templates"] as const
type NewsletterTab = typeof NEWSLETTER_TABS[number]

export default function NewsletterPage() {
  const navigate = useNavigate()
  const { tab } = useParams<{ tab: string }>()
  const activeTab = NEWSLETTER_TABS.includes((tab || "") as NewsletterTab) ? (tab as NewsletterTab) : null

  if (!activeTab) {
    return <Navigate to="/newsletter/contacts" replace />
  }

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

        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => navigate(`/newsletter/${value}`)} className="space-y-4">
            <TabsList>
              <TabsTrigger value="contacts">Contactos</TabsTrigger>
              <TabsTrigger value="audiences">Audiencias</TabsTrigger>
              <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
              <TabsTrigger value="templates">Email templates</TabsTrigger>
            </TabsList>

            <TabsContent value="contacts">
              <ContactListsManager />
            </TabsContent>

            <TabsContent value="audiences">
              <AudiencesManager />
            </TabsContent>

            <TabsContent value="broadcasts">
              <NewsletterBroadcastsManager embedded />
            </TabsContent>

            <TabsContent value="templates">
              <EmailTemplatesTable embedded />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
