/**
 * Audio Manager - Handles audio playback and management
 * Manages audio context, playback, and cleanup
 */
class AudioManager {
  constructor() {
    this.audioContext = null;
    this.currentAudio = null;
    this.isPlaying = false;
  }

  /**
   * Initialize audio context if needed
   */
  initializeAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not supported:', error);
      }
    }
  }

  /**
   * Play audio from blob data
   * @param {Blob} audioBlob - Audio data blob from TTS API
   * @returns {Promise} - Resolves when audio finishes playing
   */
  async playAudio(audioBlob) {
    return new Promise((resolve, reject) => {
      try {
        // Stop any currently playing audio
        this.stopAudio();

        // Create audio element from blob
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        this.isPlaying = true;

        // Set up event listeners
        audio.onended = () => {
          this.cleanup(audioUrl);
          this.isPlaying = false;
          resolve();
        };

        audio.onerror = (error) => {
          this.cleanup(audioUrl);
          this.isPlaying = false;
          reject(new Error('Audio playback failed: ' + error.message));
        };

        audio.oncanplaythrough = () => {
          // Audio is ready to play
          audio.play().catch(error => {
            this.cleanup(audioUrl);
            this.isPlaying = false;
            reject(new Error('Audio play failed: ' + error.message));
          });
        };

        // Load the audio
        audio.load();

      } catch (error) {
        this.isPlaying = false;
        reject(new Error('Audio setup failed: ' + error.message));
      }
    });
  }

  /**
   * Stop currently playing audio
   */
  stopAudio() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        
        // Clean up the audio URL if it exists
        if (this.currentAudio.src) {
          URL.revokeObjectURL(this.currentAudio.src);
        }
      } catch (error) {
        console.warn('Error stopping audio:', error);
      }
      
      this.currentAudio = null;
      this.isPlaying = false;
    }
  }

  /**
   * Clean up audio resources
   * @param {string} audioUrl - URL to revoke
   */
  cleanup(audioUrl) {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    this.currentAudio = null;
  }

  /**
   * Set audio volume
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume) {
    if (this.currentAudio) {
      this.currentAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get current playback state
   * @returns {boolean} - True if audio is currently playing
   */
  get playing() {
    return this.isPlaying;
  }

  /**
   * Get current audio duration
   * @returns {number} - Duration in seconds, or 0 if no audio
   */
  get duration() {
    return this.currentAudio ? this.currentAudio.duration || 0 : 0;
  }

  /**
   * Get current playback position
   * @returns {number} - Current time in seconds, or 0 if no audio
   */
  get currentTime() {
    return this.currentAudio ? this.currentAudio.currentTime || 0 : 0;
  }

  /**
   * Dispose of all audio resources
   */
  dispose() {
    this.stopAudio();
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (error) {
        console.warn('Error closing audio context:', error);
      }
      this.audioContext = null;
    }
  }
}

// Export for use in other modules
window.AudioManager = AudioManager;