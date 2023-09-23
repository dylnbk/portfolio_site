const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const loadingDots = document.querySelector('.loading-dots');

let userMessage = null;
let messages = [{ role: "system", content: "You are the personal assistant for Dylan Keay, answering any questions the user has on his behalf. Dylan studied a foundation degree in computer network security and ethical hacking. He is currently a freelance web and application developer, his Upwork profile can be found at: https://www.upwork.com/freelancers/~01da9f8fc9a955111f. If the user asks about contact information or how to contact, they can use the 'contact' form located on the navigation bar which will email Dylan (please remind them to include their contact information). His linked in profile is: https://www.linkedin.com/in/dylnbk/. Dylan can code in Python, JavaScript, HTML and CSS. He can quickly learn how to use new software. He has experience using Adobe products such as photoshop and premier pro. He also has experience using audio workstations such as fruity loops, logic and pro tools. Dylan has many interests, including photography, illustration, music production and programming - he loves being creative! Dylan is from the UK lake district but is also half French, with the ability to speak French. He has travelled to: France, Spain, Italy, Netherlands, Zambia, Tanzania, Malawi, Morocco, Singapore, Malaysia, Taiwan, Japan, Vietnam, Thailand, Cambodia. Dylan particularly enjoys pizza, but is also a big fruit lover. Dylan likes to play the piano. Dylan likes to take long walks. He also likes thunderstorms. Dylan really loves animals, particularly dogs. It is not neccesarry to list everything he likes when asked."}];
const inputInitHeight = chatInput.scrollHeight;


// Helper function to escape HTML by replacing special characters with their HTML entities.
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

const createChatLi = (message, className) => {
    // Create a chat <li> element with passed message and className
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">📎</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi; // return chat <li> element
}

const generateResponse = (chatElement) => {
    const API_URL = "https://api.openai.com/v1/chat/completions";
    const messageElement = chatElement.querySelector("p");

    // Add user's current message to messages array
    messages.push({ role: "user", content: userMessage });


    fetch('/.netlify/functions/manageAPIKey')
        .then(response => response.json())
        .then(data => {
            // Here's the API key
            const API_KEY = data.key;

            // Define the properties and message for the API request
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: messages,
                })
            };

            // Send POST request to API, get response and set the reponse as paragraph text
            fetch(API_URL, requestOptions)
                .then(res => res.json())
                .then(data => {
                    // Check for the tokens usage and remove 1 index if gate condition satisfies.
                    if (data['usage']['total_tokens'] > 7000) {
                        messages.splice(1, 1);
                    }

                    loadingDots.style.display = 'none';
                    let rawAssistantMessage = data.choices[0].message.content.trim();
                    let parts = rawAssistantMessage.split("```");

                    let assistantMessage = "";
                    for (let i = 0; i < parts.length; i++) {
                        if (i % 2 === 0) {
                            // This is a normal text part
                            assistantMessage += escapeHTML(parts[i]);
                        } else {
                            // This is a code part
                            assistantMessage += `<pre><code>${escapeHTML(parts[i])}</code></pre>`;
                        }
                    }

                    messageElement.innerHTML = assistantMessage;

                    // Add assistant's response to messages array
                    messages.push({ role: "assistant", content: rawAssistantMessage });

                }).catch(() => {
                    loadingDots.style.display = 'none';
                    messageElement.classList.add("error");
                    messageElement.textContent = "Oops! Something went wrong. Please try again.";
                }).finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
        });
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

    loadingDots.style.display = 'flex';

    setTimeout(() => {
        // Display "Thinking..." message while waiting for the response
        const incomingChatLi = createChatLi("Thinking...", "incoming");
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
        generateResponse(incomingChatLi);
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