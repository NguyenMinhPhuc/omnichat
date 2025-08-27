
(function() {
    // Self-executing function to avoid polluting the global scope

    let isOpen = false;

    // --- Create SVG Icons ---
    const chatIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
        </svg>
    `;
    const closeIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>
        </svg>
    `;

    // --- Find the script tag and get data attributes ---
    const scriptTag = document.getElementById('omnichat-embed-script');
    if (!scriptTag) {
        console.error("OmniChat embed script not found. Make sure the script tag has id='omnichat-embed-script'.");
        return;
    }
    const chatbotId = scriptTag.getAttribute('data-chatbot-id');
    const primaryColor = scriptTag.getAttribute('data-primary-color') || '#2563EB'; // Default blue
    const logoUrl = scriptTag.getAttribute('data-logo-url');

    if (!chatbotId) {
        console.error("OmniChat: data-chatbot-id attribute is missing.");
        return;
    }

    // --- Create Styles ---
    const style = document.createElement('style');
    style.innerHTML = `
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
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999998;
            transition: transform 0.2s ease-in-out, background-color 0.2s;
            color: white;
        }
        #omnichat-bubble:hover {
            transform: scale(1.1);
        }
        #omnichat-bubble svg {
            width: 32px;
            height: 32px;
            transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
        }
        #omnichat-iframe-container {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 350px;
            height: 550px;
            border: none;
            border-radius: 12px;
            box-shadow: 0 5px 25px rgba(0,0,0,0.2);
            z-index: 9999999;
            transform: translateY(20px) scale(0.95);
            opacity: 0;
            transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
            pointer-events: none;
            overflow: hidden;
        }
        #omnichat-iframe-container.omnichat-open {
            transform: translateY(0) scale(1);
            opacity: 1;
            pointer-events: auto;
        }
        @media (max-width: 400px) {
            #omnichat-iframe-container {
                width: calc(100vw - 20px);
                height: calc(100% - 90px);
                right: 10px;
                bottom: 80px;
            }
        }
    `;
    document.head.appendChild(style);

    // --- Create Chat Bubble ---
    const chatBubble = document.createElement('div');
    chatBubble.id = 'omnichat-bubble';
    chatBubble.innerHTML = `
        <div id="omnichat-icon-chat" style="position: absolute; opacity: 1; transform: scale(1);">${chatIconSVG}</div>
        <div id="omnichat-icon-close" style="position: absolute; opacity: 0; transform: scale(0);">${closeIconSVG}</div>
    `;
    document.body.appendChild(chatBubble);

    const chatIcon = document.getElementById('omnichat-icon-chat');
    const closeIcon = document.getElementById('omnichat-icon-close');

    // --- Create Iframe Container ---
    const iframeContainer = document.createElement('div');
    iframeContainer.id = 'omnichat-iframe-container';
    document.body.appendChild(iframeContainer);

    // --- Iframe (created only when needed) ---
    let iframe = null;

    function createIframe() {
        if (iframe) return; // Only create once

        iframe = document.createElement('iframe');
        iframe.src = `${window.location.origin}/chatbot/${chatbotId}`;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframeContainer.appendChild(iframe);
    }
    
    // --- Toggle Function ---
    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            createIframe(); // Create iframe on first open
            iframeContainer.classList.add('omnichat-open');
            // Animate icons
            chatIcon.style.opacity = '0';
            chatIcon.style.transform = 'scale(0)';
            closeIcon.style.opacity = '1';
            closeIcon.style.transform = 'scale(1)';
        } else {
            iframeContainer.classList.remove('omnichat-open');
            // Animate icons back
            chatIcon.style.opacity = '1';
            chatIcon.style.transform = 'scale(1)';
            closeIcon.style.opacity = '0';
            closeIcon.style.transform = 'scale(0)';
        }
    }

    // --- Event Listener ---
    chatBubble.addEventListener('click', toggleChat);

})();
