import { Controller } from "@hotwired/stimulus";
import WaveSurfer from 'wavesurfer.js';
import { get, post, put, patch, destroy } from '@rails/request.js'

export default class extends Controller {
  static targets = [
    "player", 
    "playicon", 
    "pauseicon", 
    "loadingicon", 
    "play", 
    "next", 
    "rew", 
    "range",
    "trackinfo",
    "sidebar"
  ];
  static values = {
    id: Number,
    url: String,
    peaks: String,
    height: Number,
  }
  initialize() {
    this.waveClickListener = null;
    this.hasHalfwayEventFired = false;

    this.currentSongIndex = 0;
    this.currentSong = window.store.getState().playlist[this.currentSongIndex];

    this.rangeValue = window.store.getState().volume;

    this.rangePaint(this.rangeTarget);

    this._wave = null;
    this.initWave();

    document.addEventListener("player:info", 
      (e) =>  {
        if(e.detail.id !== this.idValue){
          this.idValue = e.detail.id
          this.peaksValue = e.detail.peaks
          this.urlValue = e.detail.url

          this.playSongListener(e)
        }
      }
    )

  }

  connect(){
  }

  disconnect() {
    // this._wave.destroy();
  }

  toggleVolume(e){
    document.getElementById("volume-wrapper").classList.toggle("hidden");
  }

  updateVolume(e){
    window.store.setState({ volume: e.target.value });
    this._wave.setVolume(e.target.value);
    this.rangePaint(e.target);
  }

  rangePaint(range) {
    let percent = parseFloat(range.value) * 100.0;
    range.style.backgroundSize = `${percent}% 100%`;
  }

  addToNextListener(e) {
    console.log("ADD TO NEXT ITEM", e.detail);
    //this.pushEvent("add-song", { id: e.detail.value.id });
  }

  playSongListener(e) {
    console.log("PLAY SONG", e.detail)

    this.pauseiconTarget.style.display = 'none'
    this.loadingiconTarget.style.display = 'block'
    this.playiconTarget.style.display = 'none'

    // this.el.dataset.playerPeaks = e.detail.peaks
    // this.el.dataset.playerUrl = e.detail.url
    this._wave.stop()
    // this generates a double play and thereof a memory bloat ....
    // this bug only happens when there is no store.playlist
    //this._wave.once('ready', () => this._wave.play())
    setTimeout(()=>{
      // this does nothing for now. We will improve this soon...
      // window.prependSongID(this.el.dataset.trackId)
      this._wave.load(this.urlValue, JSON.parse(this.peaksValue))
    }, 400)
  }

  waveClickListener(e) {
    setTimeout(()=>{
      const ev = new CustomEvent(`audio-process-${this.idValue}`, {
        detail: {
         position: this._wave.getCurrentTime(),
         percent: this._wave.getCurrentTime() / this._wave.getDuration()
       }
      });
      document.dispatchEvent(ev)

    }, 20)
  }

  mouseUpHandler(e) {
    if(e.detail.trackId == this.idValue){
      this._wave.seekTo(e.detail.percent)
      //this._wave.drawer.progress(e.detail.percent)
    }
  }

  audioPauseHandler(e) {
    if(e.detail.trackId == this.idValue){
      this._wave.pause()
    }
  }

  initWave() {
    this.peaks = this.peaksValue
    this.url = this.urlValue

    this._wave = WaveSurfer.create({
      container: this.playerTarget,
      autoplay: true,
      waveColor: 'grey',
      //progressColor: 'tomato',
      progressColor: '#ddd',
      height: 45,
      barWidth: 2,
      barGap: 3,
      responsive: true,
      //minPxPerSec: 2,
      pixelRatio: 10,
      //cursorWidth: 1,
      //cursorColor: "lightgray",
      volume: this.rangeTarget.value
    })

    window.w = this._wave

    this._wave.setVolume( window.store.getState().volume )

    const data = JSON.parse(this.peaksValue) 

    this._wave.load(this.urlValue, data)

    this._wave.on('pause', ()=> {
      this.dispatchPause()
    })

    this._wave.on('play', ()=> {
      console.log("play")
      this.dispatchPlay()
    })

    this._wave.on('audioprocess', (e)=> {
      const currentTime = this._wave.getCurrentTime();
      const duration = this._wave.getDuration();
      const percent = currentTime / duration;
      //console.log("AUDIO PROCESS", percent)

      if (percent >= 0.3 && !this.hasHalfwayEventFired) {
        this.hasHalfwayEventFired = true;
        this.trackEvent(this.idValue);
      }

      const ev = new CustomEvent(`audio-process-${this.idValue}`, {
        detail: {
          position: this._wave.getCurrentTime(), //this._wave.drawer.lastPos,
          percent: this._wave.getCurrentTime() / this._wave.getDuration()
        }
      });
      document.dispatchEvent(ev)
    })

    this._wave.on('ready', ()=> {
      console.log("PLAYER READY")
      // sends the progress position to track_component
      //this.playiconTarget.style.display = 'block'
      //this.loadingiconTarget.style.display = 'none'
      this._wave.getWrapper().addEventListener('click', this.waveClickListener)
    })


    // receives audio-process progress from track hook
    document.addEventListener('audio-process-mouseup', this.mouseUpHandler)

    // receives pause
    document.addEventListener('audio-pause', this.audioPauseHandler)
    

    this._wave.on('finish', (e) => {
      console.log("FINISH PROCESS")
      this.nextSong()
    })
  }

  dispatchPlay() {
    this.playiconTarget.style.display = 'block'
    this.loadingiconTarget.style.display = 'none'
    // this.loadingiconTarget.style.display = 'block'
    this.pauseiconTarget.style.display = 'none'

    const ev = new CustomEvent(`audio-process-${this.idValue}-play`, {
      detail: {}
    });
    document.dispatchEvent(ev)
  }

  dispatchPause() {
    this.playiconTarget.style.display = 'none'
    this.pauseiconTarget.style.display = 'block'
    this.loadingiconTarget.style.display = 'none'
    const ev = new CustomEvent(`audio-process-${this.idValue}-pause`, {
      detail: {}
    });
    document.dispatchEvent(ev)
  }

  destroyWave() {
    this._wave.destroy();
  }

  async nextSong() {
    this.hasHalfwayEventFired = false;
    debugger
    const c = this.getNextTrackIndex()


    
    const response = await get(`/player?id=${c}&t=true`, { 
      responseKind: "turbo-stream", 
    })
    console.log("RESPONSE", response)
    console.log("no more songs to play", c, aa);
  }

  getNextTrackIndex(){
    const { playlist } = window.store.getState();

    const currentTrackId = this.idValue + ""
   
    const currentTrackIndex = playlist.indexOf(currentTrackId);
  
    // If the current track ID is not found, return null or undefined.
    if (currentTrackIndex === -1) return playlist[0];
  
    // If the current track is the last one, return the first track ID.
    // Otherwise, return the next track ID.
    return currentTrackIndex === playlist.length - 1
      ? playlist[0]
      : playlist[currentTrackIndex + 1];
  }

  getPreviousTrackIndex() {
    const { playlist } = window.store.getState();
  
    const currentTrackId = this.idValue + ""
   
    const currentTrackIndex = playlist.indexOf(currentTrackId);
  
    // If the current track ID is not found, return null or undefined.
    if (currentTrackIndex === -1) return playlist[0];
  
    // If the current track is the first one, return the last track ID.
    // Otherwise, return the previous track ID.
    return currentTrackIndex === 0
      ? playlist[playlist.length - 1]
      : playlist[currentTrackIndex - 1];
  }

  async prevSong() {
    this.hasHalfwayEventFired = false;

    const c = this.getPreviousTrackIndex()
    const response = await get(`/player?id=${c}&t=true`, { 
      responseKind: "turbo-stream", 
    })
    console.log("RESPONSE", response)
    console.log("no more songs to play", c, aa);
  }

  playSong() {
    this.hasHalfwayEventFired = false;
    this._wave.playPause();
  }

  trackEvent(trackId) {
    fetch(`/tracks/${trackId}/events`)
      .then(response => response.json())
      .then(data => console.log(data));
  }

  displaySidebar(){
    this.sidebarTarget.classList.toggle("hidden")
  }

  closeSidebar(){
    this.sidebarTarget.classList.add("hidden")
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