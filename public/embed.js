
(function() {
    // Self-executing function to avoid polluting the global namespace
    const scriptTag = document.currentScript;
    if (!scriptTag) {
        console.error("Cannot find the script tag. Make sure the embed script is loaded correctly.");
        return;
    }
    const chatbotId = scriptTag.getAttribute('data-chatbot-id');
    const primaryColor = scriptTag.getAttribute('data-primary-color') || '#29ABE2';
    const logoUrl = scriptTag.getAttribute('data-logo-url');
    const origin = new URL(scriptTag.src).origin;

    if (!chatbotId) {
        console.error("OmniChat: 'data-chatbot-id' is missing on the script tag.");
        return;
    }

    // --- Create SVG Icons (as base64 Data URIs to be safely used in CSS) ---
    const messageCircleIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>`;
    const closeIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

    // --- Create Styles ---
    const style = document.createElement('style');
    style.textContent = `
        #omnichat-bubble {
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
            z-index: 9998;
            box-sizing: border-box;
        }
        #omnichat-bubble:hover {
            transform: scale(1.1);
        }
        #omnichat-bubble img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
        }
        #omnichat-iframe-container {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 400px;
            height: 600px;
            max-height: calc(100vh - 110px);
            max-width: calc(100vw - 40px);
            box-shadow: 0 5px 40px rgba(0,0,0,0.2);
            border-radius: 12px;
            overflow: hidden;
            display: none;
            transition: opacity 0.3s, transform 0.3s;
            opacity: 0;
            transform: translateY(20px);
            z-index: 9999;
            box-sizing: border-box;
        }
        #omnichat-iframe-container.omnichat-open {
            display: block;
            opacity: 1;
            transform: translateY(0);
        }
        #omnichat-iframe-container iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        #omnichat-bubble-icon {
             width: 32px;
             height: 32px;
        }
         #omnichat-close-button {
            position: absolute;
            top: -30px;
            right: 0px;
            width: 24px;
            height: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            color: ${primaryColor};
            display: none;
        }
        #omnichat-iframe-container.omnichat-open + #omnichat-bubble #omnichat-close-button {
            display: flex;
        }
         #omnichat-iframe-container.omnichat-open + #omnichat-bubble #omnichat-bubble-icon {
            display: none;
        }
    `;
    document.head.appendChild(style);


    // --- Create Iframe Container ---
    const iframeContainer = document.createElement('div');
    iframeContainer.id = 'omnichat-iframe-container';
    const iframe = document.createElement('iframe');
    iframe.src = `${origin}/chatbot/${chatbotId}`;
    iframeContainer.appendChild(iframe);
    document.body.appendChild(iframeContainer);
    
    // --- Create Chat Bubble ---
    const chatBubble = document.createElement('div');
    chatBubble.id = 'omnichat-bubble';
    
    const bubbleIconContainer = document.createElement('div');
    bubbleIconContainer.id = 'omnichat-bubble-icon';
    bubbleIconContainer.innerHTML = logoUrl 
        ? `<img src="${logoUrl}" alt="Chat Logo" />` 
        : messageCircleIconSvg;
    
    const closeButton = document.createElement('button');
    closeButton.id = 'omnichat-close-button';
    closeButton.innerHTML = closeIconSvg;

    chatBubble.appendChild(bubbleIconContainer);
    chatBubble.appendChild(closeButton);
    document.body.appendChild(chatBubble);

    // --- Add Event Listener ---
    const toggleChat = () => {
        const isOpen = iframeContainer.classList.contains('omnichat-open');
        if (isOpen) {
            iframeContainer.classList.remove('omnichat-open');
        } else {
            iframeContainer.classList.add('omnichat-open');
        }
    };
    
    chatBubble.addEventListener('click', toggleChat);

})();
