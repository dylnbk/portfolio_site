import { loadExternalDependencies } from '../utils/externalDependencies.js';
import { renderMarkdownToSafeHtml } from '../utils/chatMarkdown.js';
import { contactPageSystemPrompt } from '../prompts/dylanAssistantPrompt.js';

const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

let userMessage = null;
let messages = [{ role: "system", content: contactPageSystemPrompt }];
const inputInitHeight = chatInput.scrollHeight;

loadExternalDependencies().catch((err) => {
    console.warn('Failed to preload contact chat dependencies:', err);
});

const createChatLi = (message, className, { isHtml = false } = {}) => {
    // Create a chat <li> element with passed message and className
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    const messageContent = document.createElement("div");
    messageContent.classList.add("chat-content");

    if (className === "incoming") {
        messageContent.classList.add("incoming-text");
    }

    if (isHtml) {
        messageContent.innerHTML = message;
    } else {
        messageContent.textContent = message;
    }

    const icon = document.createElement("span");
    if (className === "outgoing") {
        icon.className = "out-material-symbols-outlined";
        icon.textContent = "🕹️";
        chatLi.appendChild(messageContent);
        chatLi.appendChild(icon);
    } else {
        icon.className = "material-symbols-outlined";
        icon.textContent = "👾";
        chatLi.appendChild(icon);
        chatLi.appendChild(messageContent);
    }

    return chatLi; // Return chat <li> element
}

const generateResponse = async (chatElement) => {
    const API_URL = "https://api.openai.com/v1/chat/completions";
    const messageElement = chatElement.querySelector(".chat-content");

    // Add user's current message to messages array
    messages.push({ role: "user", content: userMessage });

    try {
        try {
            await loadExternalDependencies();
        } catch (dependencyError) {
            console.warn('Contact chat markdown dependencies unavailable, falling back to plain text rendering.', dependencyError);
        }

        const keyResponse = await fetch('/.netlify/functions/manageAPIKey');
        const data = await keyResponse.json();
        const API_KEY = data.key;

        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: messages,
                frequency_penalty: 0.5,
            })
        };

        const response = await fetch(API_URL, requestOptions);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const responseData = await response.json();

        if (responseData.usage?.total_tokens > 7000) {
            messages.splice(1, 1);
        }

        const rawAssistantMessage = responseData.choices[0].message.content.trim();
        messageElement.classList.remove('thinking-indicator');
        messageElement.innerHTML = renderMarkdownToSafeHtml(rawAssistantMessage);

        messages.push({ role: "assistant", content: rawAssistantMessage });
    } catch (error) {
        console.error(error);
        messageElement.classList.remove('thinking-indicator');
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong. Please try again.";
    } finally {
        chatbox.scrollTo(0, chatbox.scrollHeight);
    }
}

const handleChat = () => {
    userMessage = chatInput.value.trim(); // Get user entered message and remove extra whitespace
    if (!userMessage) return;

    // Clear the input textarea and set its height to default
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

    // Append the user's message to the chatbox
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    // Define the states of thinking dots animation
    const elipsis_frames = ["   ", ".  ", ".. ", "..."];
    let current_frame = 0;

    setTimeout(() => {
        const incomingChatLi = createChatLi(elipsis_frames[0], "incoming");
    
        const incomingP = incomingChatLi.querySelector('.incoming-text');
        incomingP.classList.add('thinking-indicator');
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
    
        let elipsis_interval = setInterval(() => {
            current_frame = (current_frame + 1) % elipsis_frames.length; // Cycle through frames
            incomingP.textContent = elipsis_frames[current_frame]; // Update p content
        }, 250); // Change the dots every half second
    
        generateResponse(incomingChatLi).then(() => {
            clearInterval(elipsis_interval); // Cancel the interval
        });
    }, 600);
}

chatInput.addEventListener("input", () => {
    // Adjust the height of the input textarea based on its content
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    // If Enter key is pressed without Shift key and the window 
    // width is greater than 800px, handle the chat
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
    }
});

sendChatBtn.addEventListener("click", handleChat);