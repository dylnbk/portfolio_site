/**
 * Realtime Speech Controller - OpenAI Realtime API with WebRTC
 * Provides true end-to-end speech-to-speech functionality
 */
import LoadingSpinner from '../components/shared/LoadingSpinner.js';
import { realtimeInstructions } from '../prompts/dylanAssistantPrompt.js';
import { loadExternalDependencies } from '../utils/externalDependencies.js';
import { renderMarkdownToSafeHtml } from '../utils/chatMarkdown.js';

class RealtimeSpeechController {
    constructor() {
        this.isActive = false;
        this.isConnecting = false;
        this.peerConnection = null;
        this.dataChannel = null;
        this.audioElement = null;
        this.micToggle = null;
        this.localStream = null;
        this.currentSpinner = null;
        
        // Chat integration properties (simplified - only for assistant responses)
        this.currentAssistantResponse = '';
        this.currentAssistantChatElement = null;
        
        loadExternalDependencies().catch((error) => {
            console.warn('RealtimeSpeechController: Failed to preload markdown dependencies:', error);
        });

        this.initializeUI();
    }

    /**
     * Initialize the microphone UI element
     */
    initializeUI() {
        console.log('RealtimeSpeechController: Initializing UI...');
        this.micToggle = document.getElementById('micToggle');
        if (this.micToggle) {
            console.log('RealtimeSpeechController: Microphone element found, adding click listener');
            this.micToggle.addEventListener('click', () => {
                console.log('RealtimeSpeechController: Microphone clicked!');
                this.toggle();
            });
        } else {
            console.warn('RealtimeSpeechController: Microphone element not found!');
        }
    }

    /**
     * Toggle realtime speech session on/off
     */
    async toggle() {
        console.log('RealtimeSpeechController: Toggle called, current state:', this.isActive);
        if (this.isActive) {
            console.log('RealtimeSpeechController: Stopping session...');
            await this.stopSession();
        } else {
            console.log('RealtimeSpeechController: Starting session...');
            await this.startSession();
        }
    }

    /**
     * Start a new realtime speech session
     */
    async startSession() {
        if (this.isConnecting) {
            console.log('RealtimeSpeechController: Already connecting...');
            return;
        }

        try {
            this.isConnecting = true;
            this.updateUI('connecting');

            console.log('RealtimeSpeechController: Getting ephemeral key...');
            
            // Get ephemeral key from session endpoint
            const apiUrl = window.location.hostname === 'localhost' && window.location.port !== '8888' 
                ? 'http://localhost:8888/.netlify/functions/session'
                : '/.netlify/functions/session';
                
            const tokenResponse = await fetch(apiUrl);
            if (!tokenResponse.ok) {
                throw new Error(`Failed to get session token: ${tokenResponse.statusText}`);
            }
            
            const data = await tokenResponse.json();
            const EPHEMERAL_KEY = data.client_secret.value;
            console.log('RealtimeSpeechController: Got ephemeral key');

            // Create peer connection
            console.log('RealtimeSpeechController: Creating peer connection...');
            this.peerConnection = new RTCPeerConnection();

            // Set up audio element for remote audio from the model
            this.audioElement = document.createElement("audio");
            this.audioElement.autoplay = true;
            this.audioElement.style.display = 'none'; // Hidden audio element
            document.body.appendChild(this.audioElement);

            this.peerConnection.ontrack = (e) => {
                console.log('RealtimeSpeechController: Received remote audio track');
                this.audioElement.srcObject = e.streams[0];
            };

            // Get microphone access and add local audio track
            console.log('RealtimeSpeechController: Getting microphone access...');
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            this.peerConnection.addTrack(this.localStream.getTracks()[0]);
            console.log('RealtimeSpeechController: Added local audio track');

            // Set up data channel for events
            this.dataChannel = this.peerConnection.createDataChannel("oai-events");
            this.dataChannel.addEventListener("message", (e) => {
                try {
                    const event = JSON.parse(e.data);
                    this.handleRealtimeEvent(event);
                } catch (error) {
                    console.error('RealtimeSpeechController: Error parsing event:', error);
                }
            });

            this.dataChannel.addEventListener("open", () => {
                console.log('RealtimeSpeechController: Data channel opened');
                this.isActive = true;
                this.isConnecting = false;
                this.updateUI('active');
                
                // Configure session for transcription and text output
                this.configureSession();
            });

            this.dataChannel.addEventListener("close", () => {
                console.log('RealtimeSpeechController: Data channel closed');
                this.isActive = false;
                this.updateUI('inactive');
            });

            // Create offer and set local description
            console.log('RealtimeSpeechController: Creating offer...');
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            // Send offer to OpenAI Realtime API
            const baseUrl = "https://api.openai.com/v1/realtime";
            const model = "gpt-realtime";
            
            console.log('RealtimeSpeechController: Sending offer to OpenAI...');
            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: "POST",
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${EPHEMERAL_KEY}`,
                    "Content-Type": "application/sdp"
                },
            });

            if (!sdpResponse.ok) {
                throw new Error(`OpenAI SDP Error: ${sdpResponse.statusText}`);
            }

            const answerSdp = await sdpResponse.text();
            const answer = {
                type: "answer",
                sdp: answerSdp,
            };
            
            await this.peerConnection.setRemoteDescription(answer);
            console.log('RealtimeSpeechController: Session established successfully');

        } catch (error) {
            console.error('RealtimeSpeechController: Error starting session:', error);
            this.isConnecting = false;
            this.isActive = false;
            this.updateUI('error');
            this.cleanup();
            
            // Show user-friendly error
            alert(`Failed to start voice session: ${error.message}`);
        }
    }

    /**
     * Configure session settings for transcription and text output
     */
    configureSession() {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            console.warn('RealtimeSpeechController: Data channel not ready for session config');
            return;
        }

        try {
            // Configure session to enable transcription and text output
            const sessionConfig = {
                type: 'session.update',
                session: {
                    input_audio_transcription: {
                        model: 'whisper-1'
                    },
                    instructions: realtimeInstructions,
                    modalities: ['text', 'audio'],
                    tools: []
                }
            };

            console.log('RealtimeSpeechController: Sending session configuration...');
            this.dataChannel.send(JSON.stringify(sessionConfig));
        } catch (error) {
            console.error('RealtimeSpeechController: Error configuring session:', error);
        }
    }

    /**
     * Stop the current realtime speech session
     */
    async stopSession() {
        console.log('RealtimeSpeechController: Stopping session...');
        this.isActive = false;
        this.isConnecting = false;
        this.cleanup();
        this.updateUI('inactive');
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        if (this.audioElement) {
            this.audioElement.remove();
            this.audioElement = null;
        }

        // Clean up thinking animation
        if (this.thinkingInterval) {
            clearInterval(this.thinkingInterval);
            this.thinkingInterval = null;
        }

        // Reset chat integration properties (simplified)
        this.currentAssistantResponse = '';
        this.currentAssistantChatElement = null;

        // Clean up spinner
        this.removeSpinner();
    }

    /**
     * Handle realtime events from OpenAI
     */
    handleRealtimeEvent(event) {
        console.log('RealtimeSpeechController: Received event:', event.type, event);
        
        switch (event.type) {
            case 'session.created':
                console.log('RealtimeSpeechController: Session created');
                break;
                
            case 'input_audio_buffer.speech_started':
                console.log('RealtimeSpeechController: User started speaking');
                this.handleUserSpeechStart();
                break;
                
            case 'input_audio_buffer.speech_stopped':
                console.log('RealtimeSpeechController: User stopped speaking');
                this.handleUserSpeechStop();
                break;
                
            case 'conversation.item.input_audio_transcription.completed':
                console.log('RealtimeSpeechController: User speech transcribed:', event.transcript);
                this.handleUserTranscript(event.transcript);
                break;
                
            case 'response.created':
                console.log('RealtimeSpeechController: Assistant response started');
                this.handleAssistantResponseStart();
                break;
                
            case 'response.output_item.added':
                if (event.item?.type === 'message') {
                    console.log('RealtimeSpeechController: Assistant message item added');
                }
                break;
                
            case 'response.content_part.added':
                if (event.part?.type === 'text') {
                    console.log('RealtimeSpeechController: Assistant text content added:', event.part);
                    console.log('RealtimeSpeechController: Current assistant response before update:', this.currentAssistantResponse);
                    // Don't overwrite existing text, only set if we don't have content yet
                    if (!this.currentAssistantResponse && event.part.text && event.part.text.trim()) {
                        console.log('RealtimeSpeechController: Setting initial text content:', event.part.text);
                        this.currentAssistantResponse = event.part.text;
                        
                        // Only create and update element if we have meaningful content
                        if (!this.currentAssistantChatElement) {
                            console.log('RealtimeSpeechController: Creating assistant element for content_part.added with text');
                            this.createAssistantChatElement();
                        }
                        
                        if (this.currentAssistantChatElement) {
                            this.updateAssistantChatElement(this.currentAssistantResponse);
                        }
                    } else {
                        console.log('RealtimeSpeechController: Skipping content_part.added - already have content or no meaningful text in part');
                    }
                }
                break;
                
            case 'response.audio_transcript.delta':
                console.log('RealtimeSpeechController: Assistant audio transcript delta received:', event.delta);
                console.log('RealtimeSpeechController: Current response before transcript delta:', this.currentAssistantResponse);
                console.log('RealtimeSpeechController: Assistant element exists:', !!this.currentAssistantChatElement);
                this.handleAssistantTextDelta(event.delta);
                console.log('RealtimeSpeechController: Current response after transcript delta:', this.currentAssistantResponse);
                break;
                
            case 'response.audio.delta':
                // Audio is handled automatically by WebRTC
                break;
                
            case 'response.done':
                console.log('RealtimeSpeechController: Response completed');
                this.handleResponseComplete();
                break;
                
            case 'conversation.item.created':
                console.log('RealtimeSpeechController: Conversation item created', event.item);
                break;
                
            case 'error':
                console.error('RealtimeSpeechController: Received error:', event.error);
                break;
                
            default:
                console.log('RealtimeSpeechController: Unknown event type:', event.type);
        }
    }

    /**
     * Handle user speech start
     */
    handleUserSpeechStart() {
        console.log('RealtimeSpeechController: User started speaking (no chat bubble will be created)');
    }

    /**
     * Handle user speech stop
     */
    handleUserSpeechStop() {
        console.log('RealtimeSpeechController: User stopped speaking (no chat bubble will be created)');
    }

    /**
     * Handle user transcript from realtime API (simplified - no chat integration)
     */
    handleUserTranscript(transcript) {
        if (!transcript || transcript.trim() === '') return;
        
        console.log('RealtimeSpeechController: User transcript received but NOT adding to chat:', transcript.trim());
        // User transcripts are no longer added to chat - only used for triggering LLM responses
    }

    /**
     * Handle assistant response start (simplified)
     */
    handleAssistantResponseStart() {
        console.log('RealtimeSpeechController: Assistant response starting');
        
        // Reset response text
        this.currentAssistantResponse = '';
        
        // Don't create chat element yet - wait for actual content
        // This prevents empty bubbles from being created
        console.log('RealtimeSpeechController: Waiting for actual text content before creating chat element');
        
        // Clear any existing element reference to ensure clean state
        this.currentAssistantChatElement = null;
    }

    /**
     * Handle assistant text delta updates
     */
    handleAssistantTextDelta(delta) {
        console.log('RealtimeSpeechController: handleAssistantTextDelta called with delta:', delta);
        console.log('RealtimeSpeechController: Delta type:', typeof delta, 'Delta length:', delta ? delta.length : 0);
        
        if (!delta) {
            console.log('RealtimeSpeechController: No delta provided, returning early');
            return;
        }
        
        console.log('RealtimeSpeechController: Before accumulating delta - currentAssistantResponse:', `"${this.currentAssistantResponse}"`);
        this.currentAssistantResponse += delta;
        console.log('RealtimeSpeechController: After accumulating delta - currentAssistantResponse:', `"${this.currentAssistantResponse}"`);
        
        // Only create chat element when we have actual content to display
        // This prevents empty bubbles from being created
        if (!this.currentAssistantChatElement && this.currentAssistantResponse.trim()) {
            console.log('RealtimeSpeechController: Creating assistant element now that we have actual content:', `"${this.currentAssistantResponse.trim()}"`);
            this.createAssistantChatElement();
        }
        
        // Update element only if we have content and a valid element
        if (this.currentAssistantChatElement && this.currentAssistantResponse.trim()) {
            console.log('RealtimeSpeechController: Updating assistant chat element with accumulated text:', `"${this.currentAssistantResponse}"`);
            this.updateAssistantChatElement(this.currentAssistantResponse);
        } else if (!this.currentAssistantResponse.trim()) {
            console.log('RealtimeSpeechController: Skipping update - no meaningful content yet');
        } else {
            console.error('RealtimeSpeechController: ERROR - Still no assistant chat element available for update');
        }
    }

    /**
     * Handle response completion
     */
    handleResponseComplete() {
        // Final update to make sure all text is displayed
        if (this.currentAssistantResponse && this.currentAssistantChatElement) {
            this.updateAssistantChatElement(this.currentAssistantResponse);
        }
        
        // Clear the current assistant element reference only after response is complete
        // This allows the next response to create a fresh element
        console.log('RealtimeSpeechController: Response completed, clearing assistant element reference');
        this.currentAssistantChatElement = null;
    }


    /**
     * Create assistant chat element without thinking animation for realtime speech
     */
    createAssistantChatElement() {
        console.log('RealtimeSpeechController: createAssistantChatElement called');
        console.log('RealtimeSpeechController: window.createChatLi available:', typeof window.createChatLi === 'function');
        
        if (typeof window.createChatLi === 'function') {
            const chatbox = document.querySelector(".chatbox");
            console.log('RealtimeSpeechController: chatbox found:', !!chatbox);
            
            if (chatbox) {
                // Create chat element with empty content - NO thinking animation for realtime speech
                this.currentAssistantChatElement = window.createChatLi('', "incoming");
                console.log('RealtimeSpeechController: Created assistant chat element (no thinking animation):', this.currentAssistantChatElement);
                
                chatbox.appendChild(this.currentAssistantChatElement);
                chatbox.scrollTo(0, chatbox.scrollHeight);
                
                console.log('RealtimeSpeechController: Assistant chat element ready for streaming text');
                
                // Verify element structure for debugging
                const messageElement = this.currentAssistantChatElement.querySelector('.chat-content');
                console.log('RealtimeSpeechController: Message element found in chat element:', !!messageElement);
                
            } else {
                console.error('RealtimeSpeechController: ERROR - Chatbox not found, cannot create assistant element');
            }
        } else {
            console.error('RealtimeSpeechController: ERROR - window.createChatLi function not available');
        }
    }

    /**
     * Update assistant chat element with response text
     */
    updateAssistantChatElement(text) {
        console.log('RealtimeSpeechController: updateAssistantChatElement called with text length:', text ? text.length : 0);
        console.log('RealtimeSpeechController: Text preview:', text ? `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"` : 'null');
        console.log('RealtimeSpeechController: currentAssistantChatElement exists:', !!this.currentAssistantChatElement);
        
        if (!this.currentAssistantChatElement) {
            console.error('RealtimeSpeechController: ERROR - No currentAssistantChatElement available for update');
            return;
        }
        
        // Update content immediately for real-time streaming (no thinking animation)
        if (text) {
            const messageElement = this.currentAssistantChatElement.querySelector('.chat-content');
            console.log('RealtimeSpeechController: Message element found:', !!messageElement);
            
            if (messageElement) {
                const finalHTML = renderMarkdownToSafeHtml(text);
                console.log('RealtimeSpeechController: Setting processed text to message element');
                messageElement.innerHTML = finalHTML;
                console.log('RealtimeSpeechController: Text successfully updated in chat element');
                
                // Apply cursor effect if available
                if (typeof window.chatCursorEffect !== 'undefined' && window.chatCursorEffect) {
                    window.chatCursorEffect.applyCursorEffect(this.currentAssistantChatElement);
                }
                
                // Auto-scroll to bottom to follow conversation
                const chatbox = document.querySelector(".chatbox");
                if (chatbox) {
                    chatbox.scrollTo(0, chatbox.scrollHeight);
                }
            } else {
                console.error('RealtimeSpeechController: ERROR - Missing messageElement, cannot update text');
                console.log('RealtimeSpeechController: Debug - messageElement:', messageElement);
            }
        } else {
            console.log('RealtimeSpeechController: No text provided, skipping content update');
        }
    }

    /**
     * Update UI based on current state
     */
    updateUI(state) {
        if (!this.micToggle) return;

        // Get mic icon element
        const micIcon = this.micToggle.querySelector('.mic-icon');

        // Remove all state classes
        this.micToggle.classList.remove('active', 'connecting', 'error');

        switch (state) {
            case 'connecting':
                this.micToggle.classList.add('connecting');
                this.micToggle.title = 'Connecting to voice session...';
                
                // Hide mic icon and show spinner
                if (micIcon) {
                    micIcon.style.display = 'none';
                }
                
                // Remove any existing spinner first
                this.removeSpinner();
                
                // Create and insert micro spinner
                this.currentSpinner = LoadingSpinner.createMicro();
                this.micToggle.appendChild(this.currentSpinner);
                break;
                
            case 'active':
                this.micToggle.classList.add('active');
                this.micToggle.title = 'Voice session active - Click to stop';
                
                // Remove spinner and restore mic icon
                this.removeSpinner();
                if (micIcon) {
                    micIcon.style.display = '';
                }
                break;
                
            case 'error':
                this.micToggle.classList.add('error');
                this.micToggle.title = 'Voice session error - Click to retry';
                
                // Remove spinner and restore mic icon
                this.removeSpinner();
                if (micIcon) {
                    micIcon.style.display = '';
                }
                break;
                
            case 'inactive':
            default:
                this.micToggle.title = 'Click to start voice conversation';
                
                // Remove spinner and restore mic icon
                this.removeSpinner();
                if (micIcon) {
                    micIcon.style.display = '';
                }
                break;
        }
    }

    /**
     * Remove the current spinner if it exists
     */
    removeSpinner() {
        if (this.currentSpinner) {
            this.currentSpinner.remove();
            this.currentSpinner = null;
        }
    }

    /**
     * Check if speech is currently active
     */
    get isSessionActive() {
        return this.isActive;
    }
}

// Export for use in other modules
window.RealtimeSpeechController = RealtimeSpeechController;