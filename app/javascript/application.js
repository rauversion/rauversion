// Entry point for the build script in your package.json
// import "@hotwired/turbo-rails"
// import './stores/audioStore'
// import "./controllers"
import { initReactApp } from "./react_app"
// import "./styles/react-select.css"

window.dispatchMapsEvent = function (...args) {
  const event = document.createEvent("Events")
  event.initEvent("google-maps-callback", true, true)
  event.args = args
  window.dispatchEvent(event)
}

// Initialize React app when DOM is loaded
document.addEventListener('DOMContentLoaded', initReactApp)

/*
Turbo.setConfirmMethod((message) => {
  let dialog = document.getElementById("data-turbo-confirm");
  dialog.showModal();
  document.getElementById("delete-message").textContent = message;
  return new Promise((resolve) =>{
    dialog.addEventListener("close", ()=>{
      resolve(dialog.returnValue == 'confirm')
    }, {once: true})
  })
})*/
