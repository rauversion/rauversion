import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["marquee"];

  connect() {
    
  }

  marqueeTargetConnected(element){
    setTimeout(()=>{
      this.checkOverflow()
    }, 1000)
  }

  checkOverflow() {
    const marqueeElement = this.element
    const spanElement = marqueeElement.querySelector("span");

    //console.log("Span content:", spanElement.textContent);  // Check if content is present
    //console.log("Span scrollWidth:", spanElement.scrollWidth);  // Check scrollWidth
    //console.log("Span clientWidth:", marqueeElement.clientWidth);  // Check clientWidth
    
    const contentWidth = spanElement.scrollWidth;
    const containerWidth = marqueeElement.clientWidth;

    if (spanElement.scrollWidth > marqueeElement.clientWidth) {
      // The text overflows, apply marquee animation
      const overflowDistance = spanElement.scrollWidth - marqueeElement.clientWidth;
      const animationDuration = 3 //overflowDistance / 100; // Adjust speed by modifying the divisor (e.g., 100)

      spanElement.style.animationDuration = `${animationDuration}s`;
      marqueeElement.classList.add("marquee-active");

    } else {
      // The text doesn't overflow, disable marquee
      marqueeElement.classList.remove("marquee-active");
      // spanElement.style.animation = "none"; // Disable animation if not overflowing
    }
  }

}