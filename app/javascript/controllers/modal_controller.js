import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  connect() {
    // Show modal on connect
    document.body.classList.add('overflow-hidden');
    this.element.style.display = 'block';
  }

  disconnect() {
    // Remove body class when modal is removed
    document.body.classList.remove('overflow-hidden');
  }

  close(event) {
    // Prevent event bubbling
    event.stopPropagation();
    
    // Only close if clicking the backdrop or close button
    if (event.target === this.element || 
        event.target.closest('[data-action="modal#close"]')) {
      this.element.style.display = 'none';
      // Remove the Turbo Frame
      const frame = document.querySelector('turbo-frame[id="modal"]');
      if (frame) {
        frame.remove();
      }
    }
  }
}
