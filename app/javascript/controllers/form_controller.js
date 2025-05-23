import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  submit() {
    clearTimeout(this._timeout)
    this._timeout = setTimeout(() => {
      this.element.requestSubmit()
    }, 300)
  }
}
