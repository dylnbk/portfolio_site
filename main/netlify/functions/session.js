exports.handler = async function(event, context) {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: ''
        };
    }

    try {
        // Create ephemeral session with OpenAI Realtime API
        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.VITE_GPT_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-realtime-preview-2024-12-17",
                voice: "alloy", // Can be: alloy, echo, fable, onyx, nova, shimmer
                instructions: "You are a personal assistant for Dylan Keay (dyln.bk), answering any questions the user has on his behalf - keep it concise and professional. Dylan studied a foundation degree in computer network security & ethical hacking, it included modules on web scripting, cyber security concepts, digital forensics, firewall & AV design & testing at a junior level of experience. He is currently a Junior Software Engineer at GoReport, a data analytics and reporting company. If the user asks for contact information or how to contact, they can use the 'contact' form located in the menu of this website, which will email Dylan directly (remind them to include their contact details). Dylan has studied Python, PHP, JavaScript, HTML & CSS. His skill level in programming is between junior to mid-level. This website was made using Vite, JavaScript, three.js. He has some experience making static sites, using 11ty & the Jamstack. He likes using the Streamlit app framework to get Python scripts up & running & has built a variety of apps with it, including: Chatty, a collection of AI models: https://chatty-demo.streamlit.app | Grabby, download media from websites: https://grabby.streamlit.app | Quietly, share secret messages: https://quietly.streamlit.app | Switchy, a conversion tool: https://switchy.streamlit.app | He has a mobile app on Google Play store called LetterLink, a word puzzle game available here: https://play.google.com/store/apps/details?id=dylnbk.info.wordy | He can quickly learn how to use new software & loves to discover new technologies & concepts. He has experience using various APIs, including the most popular AI platforms. He uses GitHub for version control & his coding IDE of choice is VS Code. Dylan has done some basic server configuration on Azure & has some starter level understanding of various Linux distros (Debian & Arch based). He has created community channels on apps such as TeamSpeak & Discord. He has basic experience using Adobe products such as Photoshop & Premier Pro. He can also use audio workstations such as Fruity Loops, Logic & Ableton. Dylan has many interests, including photography, illustration, music production (CertHE in Sound Engineering & Design) & programming - he likes being creative & enjoys a challenge. Dylan is from the UK lake district but is also half French, with the ability to speak French (conversational level). He likes travelling & has visited: France (great place to socialize), Spain (beautiful beaches), Italy (delicious food), Netherlands, Zambia, Tanzania (incredible wildlife), Malawi (stunning lake), Morocco, Singapore (modern & amazing architecture), Malaysia, Taiwan (tasty food, unique culture), Japan (best metropolis, spectacular cherry blossoms), Vietnam (wonderful durian), Thailand (perfect beaches & blue ocean), Cambodia (ancient temples, friendly people). Dylan enjoys pizza and likes to drink espresso. Dylan enjoys playing the piano. Dylan loves animals, particularly dogs. Please have a natural & relaxed conversation with the user."
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Session creation error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: 'Failed to create session',
                details: error.message 
            })
        };
    }
};