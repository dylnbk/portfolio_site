import { loadExternalDependencies } from './utils/externalDependencies.js';

const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector("#send-btn");

let userMessage = null;

// Preload external dependencies (marked.js, DOMPurify) when chat module loads
// This ensures they're ready when user sends a message
loadExternalDependencies().catch(err => {
  console.warn('Failed to preload chat dependencies:', err);
});
let messages = [{
    role: "system",
    content: `## Critical information:

**Current Role & Professional Focus**

*   **Position:** Junior Software Engineer at GoReport, a software platform providing professional reports and analysis for Residential and Commercial Surveyors.
*   **Core Responsibilities:** Creates custom PDF report templates from client specifications using PHP, HTML, LESS, and Laravel's Blade templating system. He develops reusable templates to convert JSON data into bespoke PDF reports.
*   **Passion:** Primary focus and passions are in creative development, specifically building web applications.

**Technical Skills & Proficiency**

*   **Programming Languages:** Python, PHP, JavaScript, HTML & CSS.
*   **Skill Level:** Between junior and mid-level.
*   **Frameworks & Technologies:**
    *   **Web:** Vite, JavaScript, three.js, 11ty (for static sites/Jamstack).
    *   **PHP:** Laravel (Blade templating).
    *   **Python:** Streamlit for application frameworks.
    *   **CMS:** Integrated Decap CMS for content management.
    *   **Firebase:** Has a solid understanding of end-to-end Firebase deployments, using its auth, database, storage and hosting.
*   **Version Control & IDE:** Uses GitHub for version control and VS Code or Cursor as his preferred IDE.
*   **Server & OS:** Moderate experience with Google Cloud, and Render. Has deployed full stack on Firebase and a foundational understanding of Linux (Debian & Arch-based distributions).

**Projects & Experience (all solo dev)**

*   **Mobile App:** Developed and published "LetterLink," a word puzzle game, on the Google Play Store.
*   **Automated Trading:** Built and deployed “ProphetIQ”, an automated trading platform, using Replit. He is currently rebuilding the platform with a new architecture.
*   **Video Screening:** Latest finished project is an open-source screening tool called “OpenScreen” that allows users to create video assessment campaigns for education, training, recruitment, and more, integrated with AI for automated evaluations.
*   **AI Experimentation:** Actively builds and experiments with AI tools and extensively uses LLM platforms like Gemini, GPT, and Claude. He has experience with various APIs, including those for popular AI platforms.
*   **Freelance Work:** Develops custom web applications, managing the full project lifecycle.
*   **Check Code:** Check out the code tab in the menu to see more projects.

**Education & Additional Experience**

*   **Education:** Holds a foundation degree in computer network security & ethical hacking & CertHE in Sound Engineering

**Personal Interests & Background**

*   **Creative Pursuits:** Enjoys photography, illustration, and music production. He has experience with Adobe Photoshop, Premier Pro, and audio workstations like Fruity Loops, Logic & Ableton.
*   **Hobbies:** Plays the piano, enjoys good quality coffee, and loves nature.
*   **Personal Details:** He is from the UK Lake District, is half French, and speaks French conversationally.
*   **Travel:** Has traveled extensively through Europe, Africa, and Asia.

**Contact Information**

*   To contact Dylan, use the 'contact' form. Please include your own contact details in the form for a response.

## Work Experience:

*   **Junior Software Engineer at GoReport** (December 2023 - Present)
    *   Creates custom PDF report templates using HTML, LESS, PHP, and Laravel.
    *   Develops reusable helper libraries to streamline development.
    *   Collaborates on the expedited development, testing, and deployment of new features.
    *   Resolves technical issues related to data manipulation and presentation.
*   **Candidate Screener at Cappfinity** (September 2023 - Present)
    *   Screens and conducts first-round interviews for a variety of technical positions, for clients such as EY and Lloyds Banking Group.
*   **Freelance Web Development** (February 2023 - Present)
    *   Develops custom web applications, end-to-end.
    *   Manages the full project lifecycle, from bidding on contracts to project delivery.
*   **Customer Service at Parcel2Go** (July 2019 - December 2024)
    *   Acts as the primary point of contact for customer inquiries and issue resolution.
    *   Handles a high volume of customer interactions, including sales, refunds, and cancellations.
*   **Quality Assurance at 1st Central Insurance** (June 2017 - July 2019)
    *   Required in-depth subject matter knowledge.
    *   Played a key role in migrating to new quality control measures, resulting in improved audit scores.
    *   Provided constructive feedback to agents and consistently exceeded individual and team targets.

# Personality and Tone

## Identity
You’re a calm, friendly assistant who represents Dylan (dyln.bk). You know his work, background, and interests well, and you speak about him in a natural, down-to-earth way. You come across like a thoughtful friend or colleague who’s happy to chat and help people learn more about what he does.

## Task
Answer questions about Dylan — his work, projects, skills, and interests. Keep replies short, clear, and conversational. If someone wants to reach out or learn more, guide them naturally without sounding formal or 

## Other details
If someone asks for Dylan’s contact info, let them know they can use the **contact form**, and remind them to include their contact details.  
When it fits naturally, share these links:
- [Chatty](https://chatty-demo.streamlit.app)  
- [OpenScreen](https://openscreen.app)  
- [Prophet-IQ](http://prophet-iq.com)
- [GitHub](https://github.com/dylnbk)
- [LetterLink](https://play.google.com/store/apps/details?id=dylnbk.info.wordy)`
}];

const inputInitHeight = chatInput.scrollHeight;

// Speech controller instances
let speechController = null; // Legacy speech controller (fallback)
let realtimeSpeechController = null; // New realtime speech controller

// Cursor effect instance
let chatCursorEffect = null;

/**
 * Create a chat <li> element with the provided message and class name.
 * @param {string} message - The message content.
 * @param {string} className - The class name to apply ("incoming" or "outgoing").
 * @returns {HTMLElement} - The constructed <li> element.
 */
const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    const p = document.createElement("p");

    if (className === "incoming") {
        p.classList.add("incoming-text");
    }

    p.innerHTML = message; // Use innerHTML to allow HTML content
    chatLi.appendChild(p);
    
    // Apply cursor effect to the new chat element
    if (chatCursorEffect) {
        chatCursorEffect.applyCursorEffect(chatLi);
    }
    
    return chatLi;
}

/**
 * Generate a response from the OpenAI API and update the chat UI accordingly.
 * @param {HTMLElement} chatElement - The chat <li> element for the assistant's response.
 * @param {Function} onFirstChunk - Callback to execute when the first response chunk is received.
 */
const generateResponse = async (chatElement, onFirstChunk) => {
    const API_URL = "https://api.openai.com/v1/chat/completions";
    const messageElement = chatElement.querySelector("p");

    // Add user's current message to messages array
    messages.push({ role: "user", content: userMessage });

    try {
        // Fetch the API key from your serverless function
        // Use Netlify dev server port for functions in development
        const apiUrl = window.location.hostname === 'localhost' && window.location.port !== '8888'
            ? 'http://localhost:8888/.netlify/functions/manageAPIKey'
            : '/.netlify/functions/manageAPIKey';
        const responseKey = await fetch(apiUrl);
        const dataKey = await responseKey.json();
        const API_KEY = dataKey.key;

        // Define the properties and message for the API request
        const requestBody = {
            model: "gpt-4o",
            messages: messages,
            stream: true // Enable streaming
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let doneReading = false;
        let assistantMessage = "";
        let buffer = "";
        let firstChunkReceived = false; // Flag to ensure callback is called only once

        while (!doneReading) {
            const { value, done } = await reader.read();
            doneReading = done;
            buffer += decoder.decode(value, { stream: true });

            // Split the buffer into lines
            let lines = buffer.split('\n');
            buffer = lines.pop(); // Handle incomplete lines

            for (let line of lines) {
                line = line.trim();
                if (line.startsWith("data: ")) {
                    const dataStr = line.replace("data: ", "");
                    if (dataStr === "[DONE]") {
                        doneReading = true;
                        break;
                    }
                    try {
                        const parsed = JSON.parse(dataStr);
                        const chunk = parsed.choices[0].delta.content;
                        if (chunk) {
                            assistantMessage += chunk;

                            // Trigger the callback on the first chunk
                            if (!firstChunkReceived) {
                                firstChunkReceived = true;
                                if (typeof onFirstChunk === 'function') {
                                    onFirstChunk();
                                }
                            }

                            // Convert markdown to HTML
                            const markdownHTML = marked.parseInline(assistantMessage);

                            // Sanitize the HTML to prevent XSS
                            const sanitizedHTML = DOMPurify.sanitize(markdownHTML);

                            // Process links to open in new tabs
                            const processedHTML = processLinksForNewTab(sanitizedHTML);

                            // Update the message element's HTML
                            messageElement.innerHTML = processedHTML;
                            
                            // Reapply cursor effect for streaming updates
                            if (chatCursorEffect) {
                                chatCursorEffect.applyCursorEffect(chatElement);
                            }
                            
                            chatbox.scrollTo(0, chatbox.scrollHeight);
                        }
                    } catch (e) {
                        console.error("Error parsing stream chunk:", e);
                    }
                }
            }
        }

        // Add assistant's complete response to messages array
        messages.push({ role: "assistant", content: assistantMessage });

        // Note: Realtime API handles speech synthesis automatically
        // Legacy TTS is only used if realtime speech is not active
        try {
            if (speechController && speechController.isActive &&
                (!realtimeSpeechController || !realtimeSpeechController.isSessionActive)) {
                await speechController.speakResponse(assistantMessage);
            }
        } catch (speechError) {
            console.warn('Speech synthesis failed, continuing without audio:', speechError);
            // Continue without speech - don't break the chat
        }

    } catch (error) {
        console.error(error);
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong. Please try again.";
    } finally {
        chatbox.scrollTo(0, chatbox.scrollHeight);
    }
}

/**
 * Handle speech message from voice input
 * @param {string} transcript - The transcribed speech text
 */
const handleSpeechMessage = async (transcript) => {
    userMessage = transcript.trim();
    if (!userMessage) return;

    // Escape and sanitize user message before displaying
    const safeMessage = DOMPurify.sanitize(escapeHTML(userMessage));

    // Append the user's message to the chatbox
    chatbox.appendChild(createChatLi(safeMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    // Define the states of thinking dots animation
    const ellipsisFrames = ["   ", ".  ", ".. ", "..."];
    let currentFrame = 0;

    setTimeout(() => {
        const incomingChatLi = createChatLi(ellipsisFrames[0], "incoming");
        const incomingP = incomingChatLi.querySelector('.incoming-text');
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);

        let ellipsisInterval = setInterval(() => {
            currentFrame = (currentFrame + 1) % ellipsisFrames.length;
            incomingP.textContent = ellipsisFrames[currentFrame];
        }, 250);

        // Define the callback to stop the thinking dots
        const stopThinkingDots = () => {
            clearInterval(ellipsisInterval);
        };

        generateResponse(incomingChatLi, stopThinkingDots).then(() => {
            clearInterval(ellipsisInterval);
        });
    }, 600);
};

/**
 * Handle sending a message: appends the user's message, starts the thinking animation, and triggers the assistant's response.
 */
const handleChat = () => {
    userMessage = chatInput.value.trim(); // Get user entered message and remove extra whitespace
    if (!userMessage) return;

    // Clear the input textarea and set its height to default
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

    // Escape and sanitize user message before displaying
    const safeMessage = DOMPurify.sanitize(escapeHTML(userMessage));

    // Append the user's message to the chatbox
    chatbox.appendChild(createChatLi(safeMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    // Define the states of thinking dots animation
    const ellipsisFrames = ["   ", ".  ", ".. ", "..."];
    let currentFrame = 0;

    setTimeout(() => {
        const incomingChatLi = createChatLi(ellipsisFrames[0], "incoming");
        const incomingP = incomingChatLi.querySelector('.incoming-text');
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);

        let ellipsisInterval = setInterval(() => {
            currentFrame = (currentFrame + 1) % ellipsisFrames.length; // Cycle through frames
            incomingP.textContent = ellipsisFrames[currentFrame]; // Update p content
        }, 250); // Change the dots every quarter second

        // Define the callback to stop the thinking dots
        const stopThinkingDots = () => {
            clearInterval(ellipsisInterval); // Stop the interval
        };

        generateResponse(incomingChatLi, stopThinkingDots).then(() => {
            // Ensure the interval is cleared in case of completion without callback
            clearInterval(ellipsisInterval);
        });
    }, 600);
}

/**
 * Escape HTML by replacing special characters with their HTML entities.
 * @param {string} str - The string to escape.
 * @returns {string} - The escaped string.
 */
function escapeHTML(str) {
    const specialChars = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#039;',
    };
    return str.replace(/[&<>"']/g, m => specialChars[m]);
}

/**
 * Process HTML content to make all links open in new tabs with security attributes
 * @param {string} html - The HTML content to process
 * @returns {string} - The processed HTML with link attributes added
 */
function processLinksForNewTab(html) {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find all anchor tags and add target and rel attributes
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
    
    return tempDiv.innerHTML;
}

/**
 * Adjust the height of the input textarea based on its content.
 */
chatInput.addEventListener("input", () => {
    // Adjust the height of the input textarea based on its content
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

/**
 * Handle the Enter key press to send messages.
 */
chatInput.addEventListener("keydown", (e) => {
    // If Enter key is pressed without Shift key and the window
    // width is greater than 800px, handle the chat
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
    }
});

/**
 * Handle the send button click to send messages.
 */
sendChatBtn.addEventListener("click", handleChat);

/**
 * Initialize speech controllers and cursor effect when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for all modules to load
    setTimeout(() => {
        try {
            // Initialize new Realtime Speech Controller (primary)
            if (window.RealtimeSpeechController) {
                realtimeSpeechController = new window.RealtimeSpeechController();
                console.log('Realtime speech controller initialized successfully');
            } else {
                console.warn('RealtimeSpeechController not available');
            }

            // Initialize legacy speech controller as fallback
            if (window.SpeechController) {
                speechController = new window.SpeechController(handleSpeechMessage);
                console.log('Legacy speech controller initialized as fallback');
            } else {
                console.warn('Legacy SpeechController not available');
            }

            // Initialize cursor effect system
            if (window.ChatCursorEffect) {
                chatCursorEffect = new window.ChatCursorEffect();
                // Update global reference for other modules
                window.chatCursorEffect = chatCursorEffect;
                console.log('Chat cursor effect initialized successfully');
            } else {
                console.warn('ChatCursorEffect not available');
            }
            
            // Display welcome message after cursor effect is initialized
            displayWelcomeMessage();
            
            // Notify loading coordinator that chat, speech controllers, and cursor effect are ready
            notifyLoadingCoordinator();
        } catch (error) {
            console.error('Failed to initialize controllers:', error);
            // Ensure chat still works without enhancements
            speechController = null;
            realtimeSpeechController = null;
            chatCursorEffect = null;
            
            // Still display welcome message even if enhancements fail
            displayWelcomeMessage();
            
            // Still notify loading coordinator even if enhancements fail
            notifyLoadingCoordinator();
        }
    }, 500);
});

/**
 * Display welcome message when chat initializes
 */
const displayWelcomeMessage = () => {
    const welcomeMessage = "Hi! Welcome to Dylan's site. I can answer any questions you have about Dylan, his skills, and experience. You can use text mode by simply writing normal messages, or have a realtime speech conversation by pressing the microphone icon.";
    
    // Create welcome message as incoming (assistant) message
    const welcomeChatLi = createChatLi(welcomeMessage, "incoming");
    
    // Add welcome-message class for initial styling
    welcomeChatLi.classList.add("welcome-message");
    
    // Append to chatbox
    chatbox.appendChild(welcomeChatLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);
    
    // Fade in the welcome message (matching site's fade-in pattern)
    setTimeout(() => {
        welcomeChatLi.style.transition = 'opacity 2500ms ease';
        welcomeChatLi.style.opacity = '1';
    }, 800);
};

/**
 * Notify loading coordinator that chat components are ready
 */
const notifyLoadingCoordinator = () => {
    if (window.loadingCoordinator) {
        window.loadingCoordinator.componentReady('chat-init');
        window.loadingCoordinator.componentReady('speech-controllers');
        window.loadingCoordinator.componentReady('chat-cursor-effect');
        console.log('Chat components ready - loading coordinator notified');
    }
};

// Make chat functions globally accessible for RealtimeSpeechController
window.createChatLi = createChatLi;
window.escapeHTML = escapeHTML;
window.processLinksForNewTab = processLinksForNewTab;
// Note: window.chatCursorEffect is set when the cursor effect is actually initialized
