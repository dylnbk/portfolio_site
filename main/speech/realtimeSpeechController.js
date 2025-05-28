/**
 * Realtime Speech Controller - OpenAI Realtime API with WebRTC
 * Provides true end-to-end speech-to-speech functionality
 */
class RealtimeSpeechController {
    constructor() {
        this.isActive = false;
        this.isConnecting = false;
        this.peerConnection = null;
        this.dataChannel = null;
        this.audioElement = null;
        this.micToggle = null;
        this.localStream = null;
        
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
            const model = "gpt-4o-realtime-preview-2024-12-17";
            
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
    }

    /**
     * Handle realtime events from OpenAI
     */
    handleRealtimeEvent(event) {
        console.log('RealtimeSpeechController: Received event:', event.type);
        
        switch (event.type) {
            case 'session.created':
                console.log('RealtimeSpeechController: Session created');
                break;
            case 'conversation.item.created':
                console.log('RealtimeSpeechController: Conversation item created');
                break;
            case 'response.audio.delta':
                // Audio is handled automatically by WebRTC
                break;
            case 'response.done':
                console.log('RealtimeSpeechController: Response completed');
                break;
            case 'error':
                console.error('RealtimeSpeechController: Received error:', event.error);
                break;
            default:
                console.log('RealtimeSpeechController: Unknown event type:', event.type);
        }
    }

    /**
     * Update UI based on current state
     */
    updateUI(state) {
        if (!this.micToggle) return;

        // Remove all state classes
        this.micToggle.classList.remove('active', 'connecting', 'error');

        switch (state) {
            case 'connecting':
                this.micToggle.classList.add('connecting');
                this.micToggle.title = 'Connecting to voice session...';
                break;
            case 'active':
                this.micToggle.classList.add('active');
                this.micToggle.title = 'Voice session active - Click to stop';
                break;
            case 'error':
                this.micToggle.classList.add('error');
                this.micToggle.title = 'Voice session error - Click to retry';
                break;
            case 'inactive':
            default:
                this.micToggle.title = 'Click to start voice conversation';
                break;
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