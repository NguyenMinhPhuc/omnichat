
(function() {
    // Self-executing function to avoid polluting the global scope

    // --- Configuration ---
    const scriptTag = document.getElementById('omnichat-embed-script');
    if (!scriptTag) {
        console.error("OmniChat embed script not found. Make sure the script tag has the ID 'omnichat-embed-script'.");
        return;
    }

    const chatbotId = scriptTag.dataset.chatbotId;
    const primaryColor = scriptTag.dataset.primaryColor || '#29ABE2';
    const logoUrl = scriptTag.dataset.logoUrl; // Can be null
    const chatPageUrl = `${window.location.origin}/chatbot/${chatbotId}`;


    // --- Helper Functions ---
    function createChatElements() {
        // Create a container for all chat elements to live in the shadow DOM
        const host = document.createElement('div');
        host.id = 'omnichat-host';
        document.body.appendChild(host);
        const shadowRoot = host.attachShadow({ mode: 'open' });

        // Create chat bubble
        const chatBubble = document.createElement('div');
        chatBubble.id = 'omnichat-bubble';
        Object.assign(chatBubble.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            backgroundColor: primaryColor,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            zIndex: '9999',
            transition: 'transform 0.2s ease-out',
        });
        chatBubble.addEventListener('mouseover', () => chatBubble.style.transform = 'scale(1.1)');
        chatBubble.addEventListener('mouseout', () => chatBubble.style.transform = 'scale(1)');

        // Create close icon for the bubble
        const closeIcon = document.createElement('div');
        closeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        closeIcon.style.display = 'none'; // Initially hidden

        // Create chat/logo icon for the bubble
        const chatIcon = document.createElement('div');
        if (logoUrl) {
            chatIcon.innerHTML = `<img src="${logoUrl}" alt="Chat" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />`;
        } else {
            chatIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
        }
        chatIcon.style.display = 'flex'; // Initially visible

        chatBubble.appendChild(chatIcon);
        chatBubble.appendChild(closeIcon);

        // Create chat container (iframe)
        const chatContainer = document.createElement('iframe');
        chatContainer.id = 'omnichat-iframe';
        chatContainer.src = chatPageUrl;
        Object.assign(chatContainer.style, {
            display: 'none',
            position: 'fixed',
            bottom: '100px',
            right: '20px',
            width: '200px',
            height: '300px',
            border: 'none',
            borderRadius: '10px',
            boxShadow: '0 5px 25px rgba(0,0,0,0.2)',
            zIndex: '9998',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            transform: 'translateY(20px)',
            opacity: '0',
            boxSizing: 'border-box',
        });

        // Append to shadow DOM
        shadowRoot.appendChild(chatBubble);
        shadowRoot.appendChild(chatContainer);

        return { shadowRoot, chatBubble, chatContainer, chatIcon, closeIcon };
    }


    // --- Main Logic ---
    if (!chatbotId) {
        console.error("OmniChat: data-chatbot-id is missing.");
        return;
    }

    // Wait for the DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', () => {
        const { shadowRoot, chatBubble, chatContainer, chatIcon, closeIcon } = createChatElements();
        let isOpen = false;

        chatBubble.addEventListener('click', () => {
            isOpen = !isOpen;
            if (isOpen) {
                chatContainer.style.display = 'block';
                setTimeout(() => { // Allow display to apply before transition
                    chatContainer.style.opacity = '1';
                    chatContainer.style.transform = 'translateY(0)';
                }, 10);
                chatIcon.style.display = 'none';
                closeIcon.style.display = 'flex';
            } else {
                chatContainer.style.opacity = '0';
                chatContainer.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    chatContainer.style.display = 'none';
                }, 300); // Match transition duration
                chatIcon.style.display = 'flex';
                closeIcon.style.display = 'none';
            }
        });
    });

})();
