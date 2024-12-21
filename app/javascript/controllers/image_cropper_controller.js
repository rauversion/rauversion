import { Controller } from "@hotwired/stimulus"
import Cropper from "cropperjs";

// Connects to data-controller="image-cropper"
export default class extends Controller {
  static targets = ["image", "input", "cropData"];

  static values = {
    viewMode: { type: Number, default: 3 },
    aspectRatio: { type: Number, default: 2.99 },
    autoCropArea: { type: Number, default: 0.5 },
  }

  connect() {
    if(!this.hasImageTarget) return
    // Initialize Cropper.js
  }

  imageTargetConnected(element) {
    const savedCropData = this.inputTarget.value ? JSON.parse(this.inputTarget.value) : null;

    this.cropper = new Cropper(element, {
      aspectRatio: this.aspectRatioValue, // Adjust as needed
      viewMode: this.viewModeValue,
      autoCropArea: this.autoCropAreaValue,
      data: savedCropData,
      crop: this.crop.bind(this),
    });
  }

  crop(event) {
    // Retrieve crop data
    const data = this.cropper.getData();
    this.inputTarget.value = JSON.stringify({
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
    });
  }

  disconnect() {
    // Destroy Cropper.js when the controller is disconnected
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
  }
}
