/**
 * Speech Synthesis - OpenAI TTS Integration
 * Handles text-to-speech conversion using OpenAI's TTS API
 */
class OpenAISpeechSynthesis {
  constructor() {
    this.apiKey = null;
    this.apiKeyInitialized = false;
    this.baseUrl = 'https://api.openai.com/v1/audio/speech';
    this.defaultVoice = 'alloy';
    this.defaultModel = 'tts-1';
    // Don't initialize API key immediately - wait until needed
  }

  /**
   * Initialize API key from environment or Netlify function (lazy loading)
   */
  async initializeAPIKey() {
    if (this.apiKeyInitialized) {
      return this.apiKey;
    }

    console.log('OpenAISpeechSynthesis: Initializing API key...');
    try {
      // Use the same method as the existing chat system
      // Use Netlify dev server port for functions in development
      const apiUrl = window.location.hostname === 'localhost' && window.location.port !== '8888'
          ? 'http://localhost:8888/.netlify/functions/manageAPIKey'
          : '/.netlify/functions/manageAPIKey';
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        this.apiKey = data.key;
        if (!this.apiKey) {
          throw new Error('API key is empty');
        }
        console.log('OpenAISpeechSynthesis: API key loaded successfully from Netlify function');
      } else {
        throw new Error('Failed to fetch API key from Netlify function');
      }
    } catch (error) {
      console.warn('OpenAISpeechSynthesis: Netlify function failed, TTS will be disabled:', error);
      
      // For local development, TTS will be disabled but speech recognition can still work
      console.warn('OpenAISpeechSynthesis: API key not available - TTS disabled, speech recognition only');
      this.apiKey = null;
    }
    
    this.apiKeyInitialized = true;
    return this.apiKey;
  }

  /**
   * Synthesize text to speech using OpenAI TTS API
   * @param {string} text - Text to convert to speech
   * @param {string} voice - Voice to use (alloy, echo, fable, onyx, nova, shimmer)
   * @param {string} model - TTS model to use (tts-1 or tts-1-hd)
   * @returns {Promise<Blob>} - Audio blob data
   */
  async synthesize(text, voice = this.defaultVoice, model = this.defaultModel) {
    // Lazy load API key only when TTS is actually used
    const apiKey = await this.initializeAPIKey();

    if (!apiKey) {
      throw new Error('Speech synthesis not available: API key not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text provided for synthesis');
    }

    // Clean and prepare text for TTS
    const cleanText = this.prepareTextForTTS(text);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          input: cleanText,
          voice: voice,
          response_format: 'mp3',
          speed: 1.0
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS API Error (${response.status}): ${errorText}`);
      }

      const audioBlob = await response.blob();
      
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio response');
      }

      return audioBlob;

    } catch (error) {
      console.error('TTS synthesis error:', error);
      throw new Error(`Speech synthesis failed: ${error.message}`);
    }
  }

  /**
   * Prepare text for TTS by cleaning and formatting
   * @param {string} text - Raw text input
   * @returns {string} - Cleaned text suitable for TTS
   */
  prepareTextForTTS(text) {
    // Remove HTML tags
    let cleanText = text.replace(/<[^>]*>/g, '');
    
    // Convert HTML entities back to characters
    const htmlEntities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
      '&nbsp;': ' '
    };
    
    Object.keys(htmlEntities).forEach(entity => {
      cleanText = cleanText.replace(new RegExp(entity, 'g'), htmlEntities[entity]);
    });
    
    // Clean up markdown-style formatting
    cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    cleanText = cleanText.replace(/\*(.*?)\*/g, '$1'); // Italic
    cleanText = cleanText.replace(/`(.*?)`/g, '$1'); // Code
    cleanText = cleanText.replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Links
    
    // Clean up extra whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // Limit length for TTS (OpenAI has a 4096 character limit)
    if (cleanText.length > 4000) {
      cleanText = cleanText.substring(0, 4000) + '...';
    }
    
    return cleanText;
  }

  /**
   * Get available voices
   * @returns {Array} - List of available voice options
   */
  getAvailableVoices() {
    return [
      { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice' },
      { id: 'echo', name: 'Echo', description: 'Male voice' },
      { id: 'fable', name: 'Fable', description: 'British accent' },
      { id: 'onyx', name: 'Onyx', description: 'Deep male voice' },
      { id: 'nova', name: 'Nova', description: 'Female voice' },
      { id: 'shimmer', name: 'Shimmer', description: 'Soft female voice' }
    ];
  }

  /**
   * Set default voice
   * @param {string} voice - Voice ID to set as default
   */
  setDefaultVoice(voice) {
    const availableVoices = this.getAvailableVoices().map(v => v.id);
    if (availableVoices.includes(voice)) {
      this.defaultVoice = voice;
    } else {
      console.warn(`Voice "${voice}" not available. Using default: ${this.defaultVoice}`);
    }
  }

  /**
   * Test TTS functionality
   * @returns {Promise<Blob>} - Test audio blob
   */
  async test() {
    return this.synthesize('Hello! Speech synthesis is working correctly.');
  }

  /**
   * Check if TTS is available
   * @returns {boolean} - True if TTS can be used
   */
  get isAvailable() {
    return !!this.apiKey;
  }
}

// Export for use in other modules
window.OpenAISpeechSynthesis = OpenAISpeechSynthesis;