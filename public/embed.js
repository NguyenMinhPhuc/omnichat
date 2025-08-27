
(function() {
    // Find the script tag and read data attributes
    const scriptTag = document.getElementById('omnichat-embed-script');
    if (!scriptTag) {
        console.error("OmniChat embed script not found. Make sure the script tag has id='omnichat-embed-script'.");
        return;
    }

    const chatbotId = scriptTag.getAttribute('data-chatbot-id');
    const primaryColor = scriptTag.getAttribute('data-primary-color') || '#1F5AA8';
    const logoUrl = scriptTag.getAttribute('data-logo-url');

    if (!chatbotId) {
        console.error("OmniChat chatbot ID is missing. Please add data-chatbot-id to the script tag.");
        return;
    }

    // --- Create Styles ---
    const style = document.createElement('style');
    style.innerHTML = `
        .omnichat-bubble {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background-color: ${primaryColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            transition: transform 0.2s ease-in-out;
            z-index: 9999;
            border: 2px solid white;
        }
        .omnichat-bubble:hover {
            transform: scale(1.1);
        }
        .omnichat-bubble img, .omnichat-bubble svg {
            width: 32px;
            height: 32px;
            color: white;
        }
        .omnichat-iframe-container {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 400px;
            height: 600px;
            max-height: calc(100vh - 110px);
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            display: none; /* Initially hidden */
            flex-direction: column;
            z-index: 9998;
            background-color: white;
        }
        .omnichat-iframe-container.omnichat-open {
            display: flex;
        }
        .omnichat-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }

        @media (max-width: 450px) {
            .omnichat-iframe-container {
                width: calc(100vw - 40px);
                height: calc(100vh - 110px);
            }
        }
    `;
    document.head.appendChild(style);


    // --- Create Chat Bubble ---
    const chatBubble = document.createElement('div');
    chatBubble.className = 'omnichat-bubble';

    const messageIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>`;
    const closeIconSVG = `
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>`;

    if (logoUrl) {
        chatBubble.innerHTML = `<img src="${logoUrl}" alt="Chat" style="border-radius: 50%; object-fit: cover; width: 100%; height: 100%;" />`;
    } else {
        chatBubble.innerHTML = messageIconSVG;
    }
    document.body.appendChild(chatBubble);


    // --- Create Iframe Container ---
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'omnichat-iframe-container';

    const iframe = document.createElement('iframe');
    iframe.src = `${window.location.origin}/chatbot/${chatbotId}`;
    iframe.className = 'omnichat-iframe';
    iframeContainer.appendChild(iframe);
    document.body.appendChild(iframeContainer);


    // --- Add Event Listener ---
    chatBubble.addEventListener('click', () => {
        const isOpen = iframeContainer.classList.toggle('omnichat-open');
        if (isOpen) {
             if (logoUrl) { // Show X icon over the logo
                 chatBubble.innerHTML = `<img src="${logoUrl}" alt="Chat" style="border-radius: 50%; object-fit: cover; width: 100%; height: 100%; filter: brightness(0.7);" />` +
                                        `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">${closeIconSVG}</div>`;
             } else {
                 chatBubble.innerHTML = closeIconSVG;
             }
        } else {
             if (logoUrl) {
                chatBubble.innerHTML = `<img src="${logoUrl}" alt="Chat" style="border-radius: 50%; object-fit: cover; width: 100%; height: 100%;" />`;
             } else {
                chatBubble.innerHTML = messageIconSVG;
             }
        }
    });

})();
