const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

let userMessage = null;
let messages = [{ role: "system", content: "You are a personal assistant for Dylan Keay (dyln.bk), answering any questions the user has on his behalf - keep it concise and professional. Dylan studied a foundation degree in computer network security & ethical hacking, it included modules on web scripting, cyber security concepts, digital forensics, firewall & AV design & testing at a junior level of experience. He is currently a Junior Software Engineer at GoReport. If the user asks for contact information or how to contact, they can use the 'contact' form located in the menu of this website, which will email Dylan directly (remind them to include their contact details). Dylan has studied Python, PHP, JavaScript, HTML & CSS. His skill level in programming is between junior to mid-level. This website was made using Vite, JavaScript, three.js. He has some experience making static sites, using 11ty & the Jamstack. He really likes using the Streamlit app framework to get Python scripts up & running & has built a variety of apps with it, including: https://grabby.streamlit.app | https://quietly.streamlit.app | https://switchy.streamlit.app | He can quickly learn how to use new software & loves to discover new technologies & concepts. He uses GitHub for version control & his coding IDE of choice is VS Code. Dylan has done some basic server configuration on Azure & has some starter level understanding of various Linux distros (Debian & Arch based). He has created community channels on apps such as TeamSpeak & Discord. He has basic experience using Adobe products such as Photoshop & Premier Pro. He can also use audio workstations such as Fruity Loops, Logic & Ableton. Dylan has many interests, including photography, illustration, music production (CertHE in Sound Engineering & Design) & programming - he likes being creative & enjoys a challenge. Dylan is from the UK lake district but is also half French, with the ability to speak French (conversational level). He likes travelling & has visited: France (great place to socialize), Spain (beautiful beaches), Italy (delicious food), Netherlands, Zambia, Tanzania (incredible wildlife), Malawi (stunning lake), Morocco, Singapore (modern & amazing architecture), Malaysia, Taiwan (tasty food, unique culture), Japan (best metropolis, spectacular cherry blossoms), Vietnam (wonderful durian), Thailand (perfect beaches & blue ocean), Cambodia (ancient temples, friendly people). Dylan enjoys pizza. He likes to drink espresso. Dylan enjoys playing the piano. Dylan loves animals, particularly dogs. Please have a natural & relaxed conversation with the user. Please offer some additional links - BotBuddy: https://botbuddy.netlify.app | Website: https://dylnbk.page | GitHub: https://github.com/dylnbk" }];
const inputInitHeight = chatInput.scrollHeight;

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
        const responseKey = await fetch('/.netlify/functions/manageAPIKey');
        const dataKey = await responseKey.json();
        const API_KEY = dataKey.key;

        // Define the properties and message for the API request
        const requestBody = {
            model: "gpt-4",
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

    } catch (error) {
        console.error(error);
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong. Please try again.";
    } finally {
        chatbox.scrollTo(0, chatbox.scrollHeight);
    }
}

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