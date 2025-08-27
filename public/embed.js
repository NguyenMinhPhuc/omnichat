
(function() {
    // Find the script tag that loaded this script.
    const scriptTag = document.getElementById('omnichat-embed-script');
    if (!scriptTag) {
        console.error("OmniChat embed script tag not found. Make sure the script tag has id='omnichat-embed-script'.");
        return;
    }

    // Get configuration from the script's data attributes.
    const chatbotId = scriptTag.getAttribute('data-chatbot-id');
    const targetId = scriptTag.getAttribute('data-target-id');
    const baseUrl = scriptTag.src.replace('/embed.js', '');

    if (!chatbotId) {
        console.error("OmniChat: 'data-chatbot-id' attribute is missing.");
        return;
    }
    if (!targetId) {
        console.error("OmniChat: 'data-target-id' attribute is missing. You must specify the ID of the container element.");
        return;
    }

    // Find the container element on the page.
    const targetElement = document.getElementById(targetId);
    if (!targetElement) {
        console.error(`OmniChat: Target container with ID '${targetId}' not found.`);
        return;
    }

    // Create the iframe element that will host the chatbot.
    const iframe = document.createElement('iframe');
    
    // Style the iframe to fill its container.
    iframe.src = `${baseUrl}/chatbot/${chatbotId}`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.margin = '0';
    iframe.style.padding = '0';
    
    // Clear the target element and append the iframe.
    // This ensures that any placeholder content in the div is removed.
    targetElement.innerHTML = '';
    targetElement.appendChild(iframe);
})();
