/**
 * Music Player Component
 * Simple track list with basic audio controls, fixed player at bottom
 */

import LoadingSpinner from '../shared/LoadingSpinner.js';

class MusicPlayer {
  constructor(container) {
    this.container = container;
    this.tracks = [];
    this.currentTrack = null;
    this.currentTrackIndex = -1;
    this.audio = null;
    this.isPlaying = false;
    this.isLoading = false;
    
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="music-player">
        <div class="music-player__tracklist" id="musicTracklist">
          ${LoadingSpinner.createInline('Loading tracks...').outerHTML}
        </div>
      </div>
    `;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Event listeners will be set up per track
  }

  async loadTracks(tracks) {
    this.tracks = tracks;
    const tracklistEl = this.container.querySelector('#musicTracklist');
    
    if (tracks.length === 0) {
      tracklistEl.innerHTML = '<div class="music-player__empty">No tracks available</div>';
      return;
    }

    const trackListHTML = tracks.map((track, index) => `
      <div class="music-track" data-index="${index}">
        <div class="music-track__play-btn" title="Play" data-index="${index}">▶</div>
        <div class="music-track__info">
          <div class="music-track__text-content">
            <div class="music-track__title">${track.title || 'Untitled'}</div>
            ${track.description ? `<div class="music-track__description">${track.description}</div>` : ''}
          </div>
          <div class="music-track__player-content">
            <div class="music-track__waveform">
              <div class="music-track__progress-bar" data-index="${index}">
                <div class="music-track__progress-fill"></div>
              </div>
            </div>
            <div class="music-track__time-info">
              <span class="music-track__current-time">0:00</span>
              <span class="music-track__total-time">0:00</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    tracklistEl.innerHTML = trackListHTML;

    // Add click handlers for track items
    tracklistEl.querySelectorAll('.music-track').forEach((trackEl, index) => {
      const playBtn = trackEl.querySelector('.music-track__play-btn');
      const progressBar = trackEl.querySelector('.music-track__progress-bar');
      
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleTrackPlayback(index);
      });
      
      // Progress bar click to seek
      progressBar?.addEventListener('click', (e) => {
        if (!this.audio || this.currentTrackIndex !== index) return;
        e.stopPropagation();
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = pos * this.audio.duration;
      });
    });
  }

  toggleTrackPlayback(index) {
    if (index < 0 || index >= this.tracks.length) return;
    
    const track = this.tracks[index];
    if (!track.audioFile) {
      console.warn('No audio file available for track:', track.title);
      return;
    }

    // If clicking on a different track, stop current and start new
    if (this.currentTrackIndex !== index) {
      this.stopCurrentTrack();
      this.selectTrack(index);
      this.playTrack(index);
    } else {
      // Toggle play/pause for current track
      this.togglePlay();
    }
  }

  selectTrack(index) {
    const track = this.tracks[index];
    
    // Update UI to show selected track
    this.container.querySelectorAll('.music-track').forEach((el, i) => {
      el.classList.toggle('music-track--active', i === index);
    });

    this.currentTrackIndex = index;
    this.currentTrack = track;
    this.loadAudio(track.audioFile);
    this.showPlayerContent(index);
  }

  playTrack(index) {
    if (this.audio) {
      this.audio.play();
      this.isPlaying = true;
      this.updatePlayButton(index, true);
    }
  }

  stopCurrentTrack() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
    }
    
    if (this.currentTrackIndex >= 0) {
      this.updatePlayButton(this.currentTrackIndex, false);
      this.hidePlayerContent(this.currentTrackIndex);
    }
  }

  loadAudio(audioFile) {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeEventListener('loadedmetadata', this.onLoadedMetadata);
      this.audio.removeEventListener('timeupdate', this.onTimeUpdate);
      this.audio.removeEventListener('ended', this.onEnded);
    }

    this.audio = new Audio(audioFile);
    this.audio.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this));
    this.audio.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
    this.audio.addEventListener('ended', this.onEnded.bind(this));
    this.audio.addEventListener('error', (e) => {
      console.error('Audio loading error:', e);
      this.updatePlayButton(false);
    });
  }

  onLoadedMetadata() {
    if (this.currentTrackIndex >= 0) {
      const trackEl = this.container.querySelector(`[data-index="${this.currentTrackIndex}"]`);
      const totalTimeEl = trackEl?.querySelector('.music-track__total-time');
      if (totalTimeEl) {
        totalTimeEl.textContent = this.formatTime(this.audio.duration);
      }
    }
  }

  onTimeUpdate() {
    if (this.currentTrackIndex >= 0) {
      const trackEl = this.container.querySelector(`[data-index="${this.currentTrackIndex}"]`);
      const currentTimeEl = trackEl?.querySelector('.music-track__current-time');
      const progressFill = trackEl?.querySelector('.music-track__progress-fill');
      
      if (currentTimeEl) {
        currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
      }
      
      if (progressFill && this.audio.duration) {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        progressFill.style.width = `${progress}%`;
      }
    }
  }

  onEnded() {
    this.isPlaying = false;
    if (this.currentTrackIndex >= 0) {
      this.updatePlayButton(this.currentTrackIndex, false);
      this.hidePlayerContent(this.currentTrackIndex);
    }
  }

  togglePlay() {
    if (!this.audio || this.currentTrackIndex < 0) return;
    
    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      this.hidePlayerContent(this.currentTrackIndex);
    } else {
      this.audio.play();
      this.isPlaying = true;
      this.showPlayerContent(this.currentTrackIndex);
    }
    
    this.updatePlayButton(this.currentTrackIndex, this.isPlaying);
  }

  updatePlayButton(trackIndex, isPlaying) {
    const trackEl = this.container.querySelector(`[data-index="${trackIndex}"]`);
    const playBtn = trackEl?.querySelector('.music-track__play-btn');
    if (playBtn) {
      playBtn.textContent = isPlaying ? '⏸' : '▶';
      playBtn.title = isPlaying ? 'Pause' : 'Play';
    }
  }

  showPlayerContent(trackIndex) {
    const trackEl = this.container.querySelector(`[data-index="${trackIndex}"]`);
    if (!trackEl) return;
    
    const textContent = trackEl.querySelector('.music-track__text-content');
    const playerContent = trackEl.querySelector('.music-track__player-content');
    
    if (textContent && playerContent) {
      // Fade out text content
      textContent.style.opacity = '0';
      textContent.style.transform = 'translateY(-10px)';
      
      // After fade out, hide text and show player
      setTimeout(() => {
        textContent.style.display = 'none';
        playerContent.style.display = 'block';
        
        // Fade in player content
        setTimeout(() => {
          playerContent.style.opacity = '1';
          playerContent.style.transform = 'translateY(0)';
        }, 50);
      }, 200);
    }
  }

  hidePlayerContent(trackIndex) {
    const trackEl = this.container.querySelector(`[data-index="${trackIndex}"]`);
    if (!trackEl) return;
    
    const textContent = trackEl.querySelector('.music-track__text-content');
    const playerContent = trackEl.querySelector('.music-track__player-content');
    
    if (textContent && playerContent) {
      // Fade out player content
      playerContent.style.opacity = '0';
      playerContent.style.transform = 'translateY(-10px)';
      
      // After fade out, hide player and show text
      setTimeout(() => {
        playerContent.style.display = 'none';
        textContent.style.display = 'block';
        
        // Fade in text content
        setTimeout(() => {
          textContent.style.opacity = '1';
          textContent.style.transform = 'translateY(0)';
        }, 50);
      }, 200);
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  destroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
  }
}

export default MusicPlayer;