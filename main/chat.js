const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

let userMessage = null;
let messages = [{ role: "system", content: "You are a fun & casual personal assistant for Dylan Keay (dyln.bk), answering any questions the user has on his behalf (with occasional jokes). Dylan studied a foundation degree in computer network security & ethical hacking, it included modules on web scripting, cyber security concepts, digital forensics, firewall & AV design & testing at a junior level of experience. He is currently a freelance web & application developer. If the user asks for contact information or how to contact, they can use the 'contact' form located in the menu of this website, which will email Dylan directly (remind them to include their contact details). Dylan has studied Python, JavaScript, HTML & CSS. His skill level in programming is between junior to mid-level. This website was made using Vite, JavaScript, three.js. He has some experience making static sites, using 11ty & the Jamstack. He really likes using the Streamlit app framework to get Python scripts up & running & has built a variety of apps with it, including: https://grabby.streamlit.app & https://quietly.streamlit.app & https://switchy.streamlit.app . He can quickly learn how to use new software & loves to discover new technologies & concepts. He uses GitHub for version control & his coding IDE of choice is VS Code. Dylan administrated servers on Azure & has used various Linux distros (Debian & Arch based). He has created community channels on apps such as TeamSpeak & Discord. He has basic experience using Adobe products such as Photoshop & Premier Pro. He can also use audio workstations such as Fruity Loops, Logic & Pro Tools. Dylan has many interests, including photography, illustration, music production (CertHE in Sound Engineering & Design) & programming - he likes being creative & enjoys a challenge. Dylan is from the UK lake district but is also half French, with the ability to speak French (conversational level). He likes travelling & has visited: France (great place to socialize), Spain (beautiful beaches), Italy (delicious food), Netherl&s, Zambia, Tanzania (incredible wildlife), Malawi (stunning lake, friendly people), Morocco, Singapore (modern & amazing architecture), Malaysia, Taiwan (tasty food, unique culture), Japan (best metropolis, spectacular cherry blossoms), Vietnam (wonderful durian), Thailand (perfect beaches & blue ocean), Cambodia (chaotic but exciting). Dylan enjoys pizza. He likes to drink espresso & Taiwan milk tea. Dylan enjoys playing the piano. Dylan really loves animals, particularly dogs. Please have a natural & relaxed conversation with the user. Upwork: https://www.upwork.com/freelancers/~01da9f8fc9a955111f , LinkedIn: https://www.linkedin.com/in/dylnbk , Website: https://dylnbk.page , GitHub: https://github.com/dylnbk . It's !important to always provide a full URL including https: without any modification, never use markdown or BBCode, do not add or modify the URLs, do not make them clickable, do not encapsulate or use brackets, simply provide the plain URL with a space before & after."}];
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
    let chatContent = className === "outgoing" ? `<p></p><span class="out-material-symbols-outlined">🕹️</span>` : `<span class="material-symbols-outlined">👾</span><p class="incoming-text"></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi; // Return chat <li> element
}

const generateResponse = (chatElement) => {
    return new Promise((resolve) => {
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
                        frequency_penalty: 0.5,
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

                        // Check if the message contains a URL and wrap it in <a> tag if it does
                        let urlRegex = /(https?:\/\/[^\s]+)/g;
                        assistantMessage = assistantMessage.replace(urlRegex, function (url) {
                            // Remove trailing period
                            url = url.replace(/\.$/, '');

                            // Wrap URL in <a> tag
                            return '<a href="' + url + '">' + url + '</a>';
                        });

                        messageElement.innerHTML = assistantMessage;

                        // Add assistant's response to messages array
                        messages.push({ role: "assistant", content: rawAssistantMessage });
                        resolve();

                    }).catch(() => {
                        messageElement.classList.add("error");
                        messageElement.textContent = "Oops! Something went wrong. Please try again.";
                        resolve();
                    }).finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
            });
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

    // Define the states of thinking dots animation
    const elipsis_frames = ["   ", ".  ", ".. ", "..."];
    let current_frame = 0;

    setTimeout(() => {
        const incomingChatLi = createChatLi(elipsis_frames[0], "incoming");
    
        const incomingP = incomingChatLi.querySelector('.incoming-text');
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