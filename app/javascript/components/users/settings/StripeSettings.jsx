import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Select from 'react-select'
import { get, post } from '@rails/request.js'
import { useToast } from "@/hooks/use-toast"
import { STRIPE_CONNECT_COUNTRIES } from "@/components/products/shared/constants"


export default function StripeSettings() {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(null)

  const handleStripeConnect = async () => {
    setIsOpen(true)
  }

  const handleSubmit = async () => {
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
    setIsOpen(false)
  }

  const openStripePanel = async () => {
    try {
      const response = await get('/stripe_connect')
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
          <Button onClick={handleStripeConnect} className="w-full">
            Connect with Stripe
          </Button>
          <Button onClick={openStripePanel} variant="outline" className="w-full mb-2">
            Open Stripe Dashboard
          </Button>
          <Button 
            onClick={async () => {
              try {
                const response = await get('/stripe_connect/status')
                const data = await response.json
                toast({
                  title: "Account Status",
                  description: `Charges enabled: ${data.charges_enabled}, Payouts enabled: ${data.payouts_enabled}, Details submitted: ${data.details_submitted}`,
                  variant: data.charges_enabled && data.payouts_enabled ? "default" : "destructive"
                })
              } catch (error) {
                toast({
                  title: "Error",
                  description: error.message || "Failed to fetch account status",
                  variant: "destructive"
                })
              }
            }} 
            variant="outline" 
            className="w-full"
          >
            Check Account Status
          </Button>
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
            <Button onClick={handleSubmit}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
