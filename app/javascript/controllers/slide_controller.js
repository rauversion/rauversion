// app/javascript/controllers/ui_carousel_controller.js
import { Controller } from "@hotwired/stimulus"
import { useTransition } from 'stimulus-use'

export default class extends Controller {
  static targets = ["slide", "previousButton", "nextButton"]
  static values = {
    currentIndex: { type: Number, default: 0 },
    autoPlay: { type: Boolean, default: false },
    interval: { type: Number, default: 5000 }, // 5 seconds
    itemsToShow: { type: Number, default: 4 } // Number of items to show at once
  }

  connect() {
    useTransition(this, {
      element: () => this.slideTargets[this.currentIndexValue],
      enterActive: 'transition ease-out duration-300',
      enterFrom: 'opacity-0',
      enterTo: 'opacity-100',
      leaveActive: 'transition ease-in duration-300',
      leaveFrom: 'opacity-100',
      leaveTo: 'opacity-0',
    })

    // Calculate items to show based on screen size
    this.updateItemsToShow()
    window.addEventListener('resize', () => this.updateItemsToShow())

    this.updateSlidePosition()
    this.updateButtonStates()
    this.updateSlideIndicators()

    if (this.autoPlayValue) {
      this.startAutoPlay()
    }
  }

  disconnect() {
    window.removeEventListener('resize', () => this.updateItemsToShow())
    this.stopAutoPlay()
  }

  next() {
    this.currentIndexValue = (this.currentIndexValue + 1) % this.slideTargets.length
    this.updateSlidePosition()
    this.updateButtonStates()
    this.updateSlideIndicators()
  }

  previous() {
    this.currentIndexValue = (this.currentIndexValue - 1 + this.slideTargets.length) % this.slideTargets.length
    this.updateSlidePosition()
    this.updateButtonStates()
    this.updateSlideIndicators()
  }

  goToSlide(event) {
    const index = parseInt(event.currentTarget.dataset.slideIndex)
    this.currentIndexValue = index
    this.updateSlidePosition()
    this.updateButtonStates()
    this.updateSlideIndicators()
  }

  updateItemsToShow() {
    const width = window.innerWidth
    if (width < 768) { // mobile
      this.itemsToShowValue = 2
    } else if (width < 1024) { // tablet
      this.itemsToShowValue = 3
    } else { // desktop
      this.itemsToShowValue = 4
    }
    this.updateSlidePosition()
  }

  updateSlidePosition() {
    const slideContainer = this.element.querySelector('.flex')
    if (!slideContainer || !this.slideTargets.length) return

    const slideWidth = this.slideTargets[0].offsetWidth
    const offset = -this.currentIndexValue * slideWidth
    slideContainer.style.transform = `translate3d(${offset}px, 0px, 0px)`
  }

  updateButtonStates() {
    if (this.hasPreviousButtonTarget) {
      this.previousButtonTarget.disabled = this.currentIndexValue === 0
    }
    if (this.hasNextButtonTarget) {
      // We should be able to slide until the last item is visible
      const lastVisibleIndex = this.currentIndexValue + this.itemsToShowValue
      this.nextButtonTarget.disabled = lastVisibleIndex >= this.slideTargets.length
    }
  }

  updateSlideIndicators() {
    const indicators = this.element.querySelectorAll('[data-slide-index]')
    indicators.forEach((indicator, index) => {
      if (index === this.currentIndexValue) {
        indicator.classList.add('bg-white')
        indicator.classList.remove('bg-white/30')
      } else {
        indicator.classList.remove('bg-white')
        indicator.classList.add('bg-white/30')
      }
    })
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.next()
    }, this.intervalValue)
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval)
    }
  }
}