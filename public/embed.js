
(function () {
    // Get the chatbotId from the script tag
    const scriptTag = document.currentScript;
    const chatbotId = scriptTag.getAttribute('data-chatbot-id');
    const primaryColor = scriptTag.getAttribute('data-primary-color') || '#29ABE2';
    const logoUrl = scriptTag.getAttribute('data-logo-url');

    if (!chatbotId) {
        console.error('Chatbot ID is not provided. Please add data-chatbot-id attribute to the script tag.');
        return;
    }

    const API_ORIGIN = scriptTag.src.startsWith('http') ? new URL(scriptTag.src).origin : window.location.origin;
    const CHATBOT_URL = `${API_ORIGIN}/chatbot/${chatbotId}`;
    
    // Icons (as inline SVGs to avoid external dependencies)
    const chatIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
        </svg>
    `;
    const closeIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
    `;

    // Create the main container
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'omnichat-container';
    chatbotContainer.style.position = 'fixed';
    chatbotContainer.style.bottom = '20px';
    chatbotContainer.style.right = '20px';
    chatbotContainer.style.zIndex = '9999';

    // Create the chat bubble
    const chatBubble = document.createElement('button');
    chatBubble.id = 'omnichat-bubble';
    chatBubble.style.backgroundColor = primaryColor;
    chatBubble.style.color = 'white';
    chatBubble.style.border = 'none';
    chatBubble.style.borderRadius = '50%';
    chatBubble.style.width = '60px';
    chatBubble.style.height = '60px';
    chatBubble.style.display = 'flex';
    chatBubble.style.alignItems = 'center';
    chatBubble.style.justifyContent = 'center';
    chatBubble.style.cursor = 'pointer';
    chatBubble.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    chatBubble.style.transition = 'transform 0.2s ease-in-out';
    
    if (logoUrl) {
       chatBubble.innerHTML = `<img src="${logoUrl}" alt="Chat" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" />`;
    } else {
       chatBubble.innerHTML = chatIcon;
    }
   

    // Create the iframe container
    const iframeContainer = document.createElement('div');
    iframeContainer.id = 'omnichat-iframe-container';
    iframeContainer.style.position = 'absolute';
    iframeContainer.style.bottom = '80px'; // 60px (bubble height) + 20px (gap)
    iframeContainer.style.right = '0';
    iframeContainer.style.width = '400px';
    iframeContainer.style.height = '600px';
    iframeContainer.style.maxWidth = '90vw';
    iframeContainer.style.maxHeight = '80vh';
    iframeContainer.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
    iframeContainer.style.borderRadius = '12px';
    iframeContainer.style.overflow = 'hidden';
    iframeContainer.style.display = 'none'; // Hidden by default
    iframeContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    iframeContainer.style.transformOrigin = 'bottom right';
    iframeContainer.style.opacity = '0';
    iframeContainer.style.transform = 'scale(0.9)';

    // Create the iframe
    const iframe = document.createElement('iframe');
    iframe.src = CHATBOT_URL;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    // Append elements
    iframeContainer.appendChild(iframe);
    chatbotContainer.appendChild(iframeContainer);
    chatbotContainer.appendChild(chatBubble);
    document.body.appendChild(chatbotContainer);

    // Toggle function
    const toggleChat = () => {
        const isHidden = iframeContainer.style.display === 'none';
        if (isHidden) {
            iframeContainer.style.display = 'block';
            setTimeout(() => {
                iframeContainer.style.opacity = '1';
                iframeContainer.style.transform = 'scale(1)';
            }, 10); // Short delay to allow display property to apply before transition
            chatBubble.innerHTML = closeIcon;
        } else {
            iframeContainer.style.opacity = '0';
            iframeContainer.style.transform = 'scale(0.9)';
            setTimeout(() => {
                iframeContainer.style.display = 'none';
            }, 300); // Wait for transition to finish
            if (logoUrl) {
                chatBubble.innerHTML = `<img src="${logoUrl}" alt="Chat" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" />`;
            } else {
                chatBubble.innerHTML = chatIcon;
            }
        }
    };

    // Add event listener
    chatBubble.addEventListener('click', toggleChat);
    chatBubble.addEventListener('mouseenter', () => chatBubble.style.transform = 'scale(1.1)');
    chatBubble.addEventListener('mouseleave', () => chatBubble.style.transform = 'scale(1)');

})();
