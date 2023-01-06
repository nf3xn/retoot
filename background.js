// background.js

// Listen for a message from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Check if the message is requesting a screenshot
    if (request.screenshot) {
        // Take a screenshot of the active tab and return it as a data URI
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUri) => {
            // Check for any errors
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                sendResponse({ error: chrome.runtime.lastError.message });
                return;
            }
            sendResponse({ dataUri });
        });
        return true;
    }
});
