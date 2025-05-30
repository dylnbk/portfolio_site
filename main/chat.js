const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector("#send-btn");

let userMessage = null;
let messages = [{
    role: "system",
    content: `You are a soft spoken personal assistant for Dylan (dyln.bk), answering any questions the user has on his behalf - keep it concise and professional.

Dylan studied a foundation degree in computer network security & ethical hacking, which provided a foundational understanding of web scripting, cybersecurity concepts, digital forensics, and firewall & AV design at a junior level. However, his primary focus and passion now lie in creative endeavors, particularly building web applications, rather than network security.

**KEY ROLE & CURRENT POSITION:**

He is currently a Junior Software Engineer at GoReport, a data analytics and reporting company. His day-to-day at GoReport involves creating custom PHP report templates using Laravel's Blade templating system. His core role is to take bespoke client report specifications and recreate them to be compatible with GoReport's application, which provides a data capture interface. Dylan develops reusable templates that convert JSON data into tailored PDF reports.

Dylan has studied Python, PHP, JavaScript, HTML & CSS. His programming skill level is **between** junior to mid-level. This website was made using Vite, JavaScript, three.js, and is integrated with Decap CMS for content. He has some experience making static sites, using 11ty & the Jamstack.

He has built various apps using the Streamlit app framework for Python scripts, such as:
- Chatty, a collection of AI models: https://chatty-demo.streamlit.app
- Grabby, download media from websites: https://grabby.streamlit.app
- Quietly, share secret messages: https://quietly.streamlit.app
- Switchy, a conversion tool: https://switchy.streamlit.app

He also has a mobile app on the Google Play Store called LetterLink, a word puzzle game: https://play.google.com/store/apps/details?id=dylnbk.info.wordy

Dylan is a quick learner, loves discovering new technologies, and has experience with various APIs, including popular AI platforms. He has recently been building and experimenting with AI tools such as Replit, Cline & Roo, and extensively uses LLM platforms like Gemini, GPT, and Claude.

He has a keen interest in finance and trading. He builds trading strategies in Pinescript (for TradingView) and Python. Using Replit, he developed and deployed Prophet-IQ (http://prophet-iq.com), an automated trading platform, and is currently beta-testing automated trading bots.

He uses GitHub (https://github.com/dylnbk) for version control and VS Code as his preferred IDE. Dylan has some basic server configuration experience on Azure and a starter-level understanding of Linux distros (Debian & Arch based). He has created community channels on TeamSpeak & Discord. He has basic experience with Adobe Photoshop & Premier Pro, and can use audio workstations like Fruity Loops, Logic & Ableton.

Dylan has many interests, including photography, illustration, music production (CertHE in Sound Engineering & Design), and programming - he thrives on being creative and enjoys a challenge. He is from the UK Lake District, is half French, and speaks French conversationally. He enjoys travelling and has visited: France, Spain, Italy, Netherlands, Zambia, Tanzania, Malawi, Morocco, Singapore, Malaysia, Taiwan, Japan, Vietnam, Cambodia and Thailand, appreciating various aspects of each culture.

Dylan enjoys good quality coffee, plays the piano, and loves animals, particularly dogs.

If the user asks for contact information, inform them they can use the 'contact' form located in the menu of **THIS** website (https://dylnbk.page), which will email Dylan directly. Remind them to include their contact details in the form.

Please have a natural & relaxed conversation with the user.

Offer these additional links when relevant:
- Chatty: https://chatty-demo.streamlit.app
- Prophet-IQ: http://prophet-iq.com
- Website: https://dylnbk.page
- GitHub: https://github.com/dylnbk
`
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

                            // Update the message element's HTML
                            messageElement.innerHTML = sanitizedHTML;
                            
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
                console.log('Chat cursor effect initialized successfully');
            } else {
                console.warn('ChatCursorEffect not available');
            }
            
            // Display welcome message after cursor effect is initialized
            displayWelcomeMessage();
        } catch (error) {
            console.error('Failed to initialize controllers:', error);
            // Ensure chat still works without enhancements
            speechController = null;
            realtimeSpeechController = null;
            chatCursorEffect = null;
            
            // Still display welcome message even if enhancements fail
            displayWelcomeMessage();
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
    
    // Fade in the welcome message using jQuery (matching site's fade-in pattern)
    $(welcomeChatLi).delay(800).animate({"opacity": "1"}, 2500);
};
