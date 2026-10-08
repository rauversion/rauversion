import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["deliveryMethod", "shippingCountry"]

  connect() {
    this.update()
  }

  update() {
    if (!this.hasShippingCountryTarget) return

    const pickup = this.hasDeliveryMethodTarget && this.deliveryMethodTarget.value === "local_pickup"
    this.shippingCountryTarget.hidden = pickup
    this.shippingCountryTarget.disabled = pickup
  }
}
