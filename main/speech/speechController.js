/**
 * Speech Controller - Main coordination for speech functionality
 * Handles speech recognition, conversation flow, and UI state management
 */
class SpeechController {
  constructor(chatHandler) {
    // Handle both function and object parameter formats for backward compatibility
    if (typeof chatHandler === 'function') {
      this.chatHandler = { processMessage: chatHandler };
    } else if (chatHandler && typeof chatHandler.processMessage === 'function') {
      this.chatHandler = chatHandler;
    } else {
      throw new Error('SpeechController requires a valid chat handler function or object');
    }
    
    this.isListening = false;
    this.isProcessing = false;
    this.recognition = null;
    this.audioManager = new AudioManager();
    this.tts = new OpenAISpeechSynthesis();
    this.micToggle = null;
    
    this.initializeSpeechRecognition();
    this.initializeUI();
  }

  /**
   * Initialize the microphone UI element
   */
  initializeUI() {
    console.log('SpeechController: Initializing UI...');
    this.micToggle = document.getElementById('micToggle');
    if (this.micToggle) {
      console.log('SpeechController: Microphone element found (RealtimeSpeechController will handle clicks)');
      // Note: micToggle click events are now handled exclusively by RealtimeSpeechController
      // SpeechController should be activated through alternative mechanisms if needed
    } else {
      console.warn('SpeechController: Microphone element not found!');
    }
  }

  /**
   * Initialize Web Speech API recognition
   */
  initializeSpeechRecognition() {
    console.log('SpeechController: Initializing speech recognition...');
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('SpeechController: Speech recognition not supported in this browser');
      this.hideMicrophone();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    console.log('SpeechController: Creating SpeechRecognition instance...');
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    console.log('SpeechController: Speech recognition configured');

    this.recognition.onresult = (event) => {
      console.log('SpeechController: Speech result received:', event.results[0][0].transcript);
      const transcript = event.results[0][0].transcript;
      this.handleSpeechResult(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error('SpeechController: Speech recognition error:', event.error);
      this.handleError(event.error);
    };

    this.recognition.onend = () => {
      console.log('SpeechController: Speech recognition ended');
      if (this.isListening && !this.isProcessing) {
        console.log('SpeechController: Auto-restarting listening...');
        // Auto-restart listening in conversation mode
        setTimeout(() => {
          if (this.isListening) {
            this.recognition.start();
          }
        }, 100);
      }
    };

    this.recognition.onstart = () => {
      console.log('SpeechController: Speech recognition started');
      this.updateUI('listening');
    };
    
    console.log('SpeechController: Speech recognition initialization complete');
  }

  /**
   * Toggle speech recognition on/off
   */
  toggle() {
    console.log('SpeechController: Toggle called, current state:', this.isListening);
    if (this.isListening) {
      console.log('SpeechController: Stopping listening...');
      this.stopListening();
    } else {
      console.log('SpeechController: Starting listening...');
      this.startListening();
    }
  }

  /**
   * Start speech recognition
   */
  async startListening() {
    console.log('SpeechController: startListening called');
    if (!this.recognition) {
      console.warn('SpeechController: Speech recognition not available');
      return;
    }

    try {
      console.log('SpeechController: Setting listening state and starting recognition...');
      this.isListening = true;
      this.isProcessing = false;
      this.updateUI('listening');
      
      // Add a timeout to detect if permissions are denied or not granted
      const permissionTimeout = setTimeout(() => {
        if (this.isListening) {
          console.warn('SpeechController: Speech recognition may be waiting for permissions or failed to start');
          // Don't automatically stop, let user try again
        }
      }, 3000);
      
      this.recognition.start();
      console.log('SpeechController: Recognition.start() called successfully');
      
      // Clear timeout if recognition starts successfully
      this.recognition.onstart = () => {
        clearTimeout(permissionTimeout);
        console.log('SpeechController: Speech recognition started successfully');
        this.updateUI('listening');
      };
      
    } catch (error) {
      console.error('SpeechController: Error in startListening:', error);
      this.handleError(error);
    }
  }

  /**
   * Stop speech recognition
   */
  stopListening() {
    this.isListening = false;
    this.isProcessing = false;
    if (this.recognition) {
      this.recognition.stop();
    }
    this.audioManager.stopAudio();
    this.updateUI('inactive');
  }

  /**
   * Handle speech recognition result
   */
  async handleSpeechResult(transcript) {
    if (transcript.trim()) {
      this.isProcessing = true;
      this.updateUI('processing');
      
      try {
        // Use existing chat handler to process the message
        await this.chatHandler.processMessage(transcript);
      } catch (error) {
        console.error('Error processing speech message:', error);
        this.handleError(error);
      }
    }
  }

  /**
   * Speak the AI response using TTS
   */
  async speakResponse(text) {
    if (!this.isListening) return;

    try {
      this.updateUI('speaking');
      const audioBlob = await this.tts.synthesize(text);
      await this.audioManager.playAudio(audioBlob);
      
      // Auto-resume listening after response
      if (this.isListening) {
        this.isProcessing = false;
        setTimeout(() => {
          if (this.isListening && this.recognition) {
            this.recognition.start();
          }
        }, 500);
      }
    } catch (error) {
      console.warn('TTS not available, continuing with voice recognition only:', error);
      this.isProcessing = false;
      if (this.isListening) {
        // Continue listening even if TTS fails
        setTimeout(() => {
          if (this.isListening && this.recognition) {
            this.recognition.start();
          }
        }, 500);
        this.updateUI('listening');
      }
    }
  }

  /**
   * Update UI based on current state
   */
  updateUI(state) {
    if (!this.micToggle) return;

    // Remove all state classes
    this.micToggle.classList.remove('active', 'processing', 'speaking');

    switch (state) {
      case 'listening':
        this.micToggle.classList.add('active');
        this.micToggle.title = 'Listening... Click to stop';
        break;
      case 'processing':
        this.micToggle.classList.add('active', 'processing');
        this.micToggle.title = 'Processing...';
        break;
      case 'speaking':
        this.micToggle.classList.add('active', 'speaking');
        this.micToggle.title = 'Speaking...';
        break;
      case 'inactive':
      default:
        this.micToggle.title = 'Click to start voice conversation';
        break;
    }
  }

  /**
   * Handle errors gracefully
   */
  handleError(error) {
    console.warn('Speech error:', error);
    
    // Silently fall back to text mode
    this.stopListening();
    
    // Hide microphone if permissions denied or not supported
    if (error === 'not-allowed' || error === 'service-not-allowed') {
      this.hideMicrophone();
    }
  }

  /**
   * Hide microphone icon for unsupported browsers
   */
  hideMicrophone() {
    if (this.micToggle) {
      this.micToggle.style.display = 'none';
    }
  }

  /**
   * Check if speech is currently active
   */
  get isActive() {
    return this.isListening;
  }
}

// Export for use in other modules
window.SpeechController = SpeechController;