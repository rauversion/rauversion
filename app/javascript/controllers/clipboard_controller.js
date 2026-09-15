import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
    static targets = ["source", "message"];

    copy() {
        const source = this.sourceTarget;
        //source.select(); // Select the text field
        navigator.clipboard.writeText(source.value);
        //document.execCommand("copy"); // Copy the text inside the text field
        //alert("Copied the text: " + source.value); // Alert the copied text

        this.updateText()
    }


    updateText() {
      
      this.messageTarget.textContent = this.messageTarget.dataset.text.ok || "Copied!"
      this.messageTarget.classList.add("animate-pulse", "text-success"); // Adding animation and style

      setTimeout(() => {
          this.messageTarget.textContent = this.messageTarget.dataset.text;
          this.messageTarget.classList.remove("animate-pulse", "text-success"); // Remove animation and style
      }, 2000); // Revert after 2 seconds
  }
}
