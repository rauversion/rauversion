import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Select from 'react-select'
import { get, post } from '@rails/request.js'
import { useParams } from 'react-router-dom'
import { useToast } from "hooks/use-toast"
import { STRIPE_CONNECT_COUNTRIES } from "@/components/products/shared/constants"


export default function StripeSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [statusData, setStatusData] = useState(null)
  const [showStatus, setShowStatus] = useState(false)
  const [user, setUser] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isStatusLoading, setIsStatusLoading] = useState(false)
  const [isDashboardLoading, setIsDashboardLoading] = useState(false)

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await get(`/${username}/settings.json`)
        if (response.ok) {
          const data = await response.json
          setUser(data.user)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: I18n.t('user_settings.social_links.messages.load_error'),
          variant: "destructive",
        })
      }
    }
    fetchUser()
  }, [username])

  const handleStripeConnect = async () => {
    setIsOpen(true)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    if (!selectedCountry?.value) {
      toast({
        title: "Error",
        description: "Please select a country",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await post('/stripe_connect', {
        body: JSON.stringify({ country: selectedCountry.value })
      })
      const data = await response.json
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect with Stripe",
        variant: "destructive"
      })
    }
    setIsLoading(false)
    setIsOpen(false)
  }

  const openStripePanel = async () => {
    setIsDashboardLoading(true)
    try {
      const response = await get('/stripe_connect.json')
      const data = await response.json
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open Stripe dashboard",
        variant: "destructive"
      })
    }
    setIsDashboardLoading(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Stripe Integration</CardTitle>
          <CardDescription>
            Connect your Stripe account to receive payments and manage your transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {
            !user.stripe_account_id && (
              <Button onClick={handleStripeConnect} className="w-full" disabled={isLoading}>
                Connect with Stripe
              </Button>
            )
          }

          {
            user.stripe_account_id && (
            <>
              <Button 
                onClick={openStripePanel} 
                variant="outline" 
                className="w-full mb-2"
                disabled={isDashboardLoading}
              >
                {isDashboardLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Dashboard...
                  </>
                ) : (
                  'Open Stripe Dashboard'
                )}
              </Button>
              <Button 
                onClick={async () => {
                  setIsStatusLoading(true)
                  try {
                    const response = await get('/stripe_connect/status')
                    const data = await response.json
                    setStatusData(data)
                    setShowStatus(true)
                  } catch (error) {
                    setStatusData({ error: error.message || "Failed to fetch account status" })
                    setShowStatus(true)
                  }
                  setIsStatusLoading(false)
                }}
                variant="outline" 
                className="w-full"
                disabled={isStatusLoading}
              >
                {isStatusLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking Status...
                  </>
                ) : (
                  'Check Account Status'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Your Country</DialogTitle>
            <DialogDescription>
              Choose the country where you'll be receiving payments
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              id="country"
              instanceId="country-select"
              placeholder="Select a country"
              options={STRIPE_CONNECT_COUNTRIES.map(country => ({
                value: country.code,
                label: country.name
              }))}
              value={selectedCountry}
              onChange={setSelectedCountry}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showStatus && statusData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
          >
            {statusData.error ? (
              <Alert variant="destructive" className="max-w-md mx-auto bg-default">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{statusData.error}</AlertDescription>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowStatus(false)}>
                    Close
                  </Button>
                </div>
              </Alert>
            ) : (
              <Alert variant={statusData.charges_enabled && statusData.payouts_enabled ? "default" : "warning"} 
                className="max-w-md mx-auto bg-default">
                {statusData.charges_enabled && statusData.payouts_enabled ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <AlertTitle>Account Status</AlertTitle>
                <AlertDescription className="mt-2 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusData.charges_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span>Charges: {statusData.charges_enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusData.payouts_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span>Payouts: {statusData.payouts_enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusData.details_submitted ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <span>Details: {statusData.details_submitted ? 'Submitted' : 'Pending'}</span>
                    </div>
                  </div>
                </AlertDescription>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowStatus(false)}>
                    Close
                  </Button>
                </div>
              </Alert>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
