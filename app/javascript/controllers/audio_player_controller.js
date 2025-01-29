import { Controller } from "@hotwired/stimulus";
import { get } from '@rails/request.js'
import useAudioStore from '../stores/audioStore'

export default class extends Controller {
  static targets = [
    "audio",
    "playButton",
    "progress",
    "currentTime",
    "duration",
    "playIcon",
    "pauseIcon",
    "volumeSlider",
    "volumeOnIcon",
    "volumeOffIcon",
    "sidebar"
  ];

  static values = {
    id: Number,
    url: String,
    peaks: String,
    height: Number,
  }

  connect() {
    this.audio = this.audioTarget;
    this.playButton = this.playButtonTarget;
    this.progress = this.progressTarget;
    this.currentTime = this.currentTimeTarget;
    this.duration = this.durationTarget;
    this.volumeSlider = this.volumeSliderTarget;
    this.volumeOnIcon = this.volumeOnIconTarget;
    this.volumeOffIcon = this.volumeOffIconTarget;
    this.audio.addEventListener("timeupdate", this.updateProgress.bind(this));
    this.audio.addEventListener("loadedmetadata", this.updateDuration.bind(this));

    // Automatically play the audio when it's loaded
    this.audio.addEventListener("loadeddata", this.autoPlay.bind(this));

    // Initialize volume level
    this.volumeSlider.value = window.store.getState().volume || this.audio.volume;

    // Initialize halfway tracking
    this.hasHalfwayEventFired = false;

    // Listen for the 'ended' event to play the next song
    this.audio.addEventListener("ended", this.nextSong.bind(this));

    // Listen for the 'audio-process-mouseup' event
    document.addEventListener(`audio-process-mouseup-${this.idValue}`, this.updateSeek.bind(this));
  }

  autoPlay() {

    // check if at attribute is provided, if not, do not do autoplay
    if(!this.audio.dataset.ap){ 
      console.log("Skip AutoPlay")
      return 
    }
    // Show loading animation (optional)
    const playPromise = this.audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.toggleIcons()
          useAudioStore.setState({ currentTrackId: this.idValue, isPlaying: true });
          // Automatic playback started!
        })
        .catch((error) => {
          // Auto-play was prevented
          console.error("Playback failed:", error);
          useAudioStore.setState({ isPlaying: false });
          //this.playButton.textContent = "Play";
          this.toggleIcons()
        });
    }
  }

  playPause() {
    if (this.audio.paused) {
      this.audio.play();
      useAudioStore.setState({ currentTrackId: this.idValue, isPlaying: true });
      //this.playButton.textContent = "Pause";
      this.toggleIcons()
    } else {
      this.audio.pause();
      useAudioStore.setState({ isPlaying: false });
      this.toggleIcons()
      //this.playButton.textContent = "Play";
    }
  }

  setVolume() {
    this.audio.volume = this.volumeSlider.value;
    window.store.setState({ volume: this.volumeSlider.value })
    // Toggle volume icon
    if (this.audio.volume === 0) {
      this.volumeOnIcon.classList.add("hidden");
      this.volumeOffIcon.classList.remove("hidden");
    } else {
      this.volumeOnIcon.classList.remove("hidden");
      this.volumeOffIcon.classList.add("hidden");
    }
  }

  toggleMute() {
    if (this.audio.volume > 0) {
      this.audio.volume = 0;
      window.store.setState({ volume: 0 })
      this.volumeSlider.value = 0;
      this.volumeOnIcon.classList.add("hidden");
      this.volumeOffIcon.classList.remove("hidden");
    } else {
      this.audio.volume = 1;
      window.store.setState({ volume: 1 })
      this.volumeSlider.value = 1;
      this.volumeOnIcon.classList.remove("hidden");
      this.volumeOffIcon.classList.add("hidden");
    }
  }

  updateProgress() {
    const percent = (this.audio.currentTime / this.audio.duration) * 100;
    this.progress.style.width = `${percent}%`;
    this.currentTime.textContent = this.formatTime(this.audio.currentTime);
    // Check for halfway event trigger
    this.checkHalfwayEvent(percent);

    // Dispatch the custom event
    this.dispatchAudioProgressEvent(this.audio.currentTime, percent);
  }

  checkHalfwayEvent(percent) {
    if (percent >= 30 && !this.hasHalfwayEventFired) {
      this.hasHalfwayEventFired = true;
      this.trackEvent(this.audio.dataset.trackId);  // Assuming the track ID is stored in a data attribute
    }
  }

  trackEvent(trackId) {
    fetch(`/tracks/${trackId}/events`, {
      method: "GET",  // Use POST to signify this is an event that is being recorded
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content
      },
      // body: JSON.stringify({ event: "halfway" })
    })
    .then(response => response.json())
    .then(data => console.log("Event tracked:", data))
    .catch(error => console.error("Error tracking event:", error));
  }

  dispatchAudioProgressEvent(currentTime, percent) {
    const ev = new CustomEvent(`audio-process-${this.idValue}`, {
      detail: {
        position: currentTime,
        percent: parseFloat(percent.toFixed(2))/100
      }
    });

    // console.log(ev)
    document.dispatchEvent(ev);
  }

  updateDuration() {
    this.duration.textContent = this.formatTime(this.audio.duration);
  }

  seek(event) {
    const percent = event.offsetX / event.currentTarget.offsetWidth;
    this.audio.currentTime = percent * this.audio.duration;
  }

  updateSeek(event) {
    const { position } = event.detail;
    if (position !== undefined && !isNaN(position)) {
      this.audio.currentTime = position;
      this.updateProgress();  // Update the progress bar and related UI
    }
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  }

  toggleIcons() {
    this.playIconTargets.forEach((e)=> e.classList.toggle("hidden") )
    this.pauseIconTargets.forEach((e)=> e.classList.toggle("hidden") )
  }

  closeSidebar(){
    this.sidebarTarget.classList.add("hidden")
  }

  toggleSidebar(){
    this.sidebarTarget.classList.toggle("hidden")
  }

  stopAudio() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0; // Reset to the beginning
      useAudioStore.setState({ isPlaying: false });
    }
  }

  debounce(func, delay) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = setTimeout(func, delay);
  }

  async nextSong() {
    this.debounce(async () => {
      this.stopAudio()
      this.hasHalfwayEventFired = false;
      const c = this.getNextTrackIndex();
      let aa = document.querySelector(`#sidebar-track-${c}`);

      if (!aa) {
        const otherController = this.application.getControllerForElementAndIdentifier(
          document.getElementById("track-detector"),
          "track-detector"
        );
        otherController.detect();
      }

      if (aa) {
        const response = await get(aa.dataset.url, {
          responseKind: "turbo-stream",
        });
        console.log("RESPONSE", response);
        console.log("Playing next song", c, aa);
      } else {
        console.log("No more songs to play", c, aa);
      }

    }, 200)
  }

  async prevSong() {
    this.debounce(async () => {
      this.stopAudio()
      this.hasHalfwayEventFired = false;
      const c = this.getPreviousTrackIndex();
      let aa = document.querySelector(`#sidebar-track-${c}`);

      if (aa) {
        const response = await get(aa.dataset.url, {
          responseKind: "turbo-stream",
        });
        console.log("RESPONSE", response);
        console.log("Playing previous song", c, aa);
      } else {
        console.log("No more songs to play", c, aa);
      }
    }, 200)
  }

  getNextTrackIndex() {
    const { playlist } = window.store.getState();
    const currentTrackId = this.idValue + "";
    const currentTrackIndex = playlist.indexOf(currentTrackId);

    if (currentTrackIndex === -1) return playlist[0];
    return currentTrackIndex === playlist.length - 1
      ? playlist[0]
      : playlist[currentTrackIndex + 1];
  }

  getPreviousTrackIndex() {
    const { playlist } = window.store.getState();
    const currentTrackId = this.idValue + "";
    const currentTrackIndex = playlist.indexOf(currentTrackId);

    if (currentTrackIndex === -1) return playlist[0];
    return currentTrackIndex === 0
      ? playlist[playlist.length - 1]
      : playlist[currentTrackIndex - 1];
  }

  removeSong(e) {
    e.preventDefault()
    const trackIdToRemove = e.currentTarget.dataset.value
    const { playlist } = store.getState();

    document.querySelector(`#sidebar-track-${trackIdToRemove}`).remove()
  
    // Filter out the track ID to remove
    const newPlaylist = playlist.filter(trackId => trackId !== trackIdToRemove);
  
    store.setState({ playlist: newPlaylist });
  }
}
