import { Controller } from "@hotwired/stimulus"
import useAudioStore from "../stores/audioStore"

export default class extends Controller {
  static targets = ["playButton"]
  static values = {
    trackId: String,
    audioElement: {
      type: String,
      default: "audioElement"
    }
  }

  connect() {
    // Subscribe to store changes to update UI if needed
    this.unsubscribe = useAudioStore.subscribe(
      (state) => ({ currentTrackId: state.currentTrackId, isPlaying: state.isPlaying }),
      this.updatePlayButton.bind(this)
    )
  }

  disconnect() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  updatePlayButton({ currentTrackId, isPlaying }) {
    if (!this.hasPlayButtonTarget) return

    const isCurrentTrack = currentTrackId === this.trackIdValue
    
    // Update play/pause icon based on state
    const playIcon = this.playButtonTarget.querySelector('.play-icon')
    const pauseIcon = this.playButtonTarget.querySelector('.pause-icon')
    
    if (isCurrentTrack && isPlaying) {
      playIcon?.classList.add('hidden')
      pauseIcon?.classList.remove('hidden')
    } else {
      playIcon?.classList.remove('hidden')
      pauseIcon?.classList.add('hidden')
    }
  }

  play(event) {
    event.preventDefault()
    const audioElement = document.getElementById(this.audioElementValue)
    
    if (audioElement?.paused) {
      useAudioStore.setState({ 
        currentTrackId: event.currentTarget.dataset.trackId,
        isPlaying: true 
      })
    } else {
      useAudioStore.setState({ isPlaying: false })
    }
  }
}
