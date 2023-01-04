const script = document.createElement('script');
script.src = chrome.runtime.getURL('html2canvas.min.js');
document.head.appendChild(script);

let retoots = new Map(JSON.parse(localStorage.getItem("retoots")));
if (!retoots) {
  retoots = new Map();
}

document.addEventListener("DOMNodeInserted", event => {
  if (event.target.querySelector) {
    const actionBar = event.target.querySelector(".status__action-bar");

    if (actionBar && !actionBar.querySelector(".retoot")) {

      // Create the 💬 button
      const button = document.createElement("button");

      button.innerHTML = '<i class="fa fa-thumbs-up fa-fw"></i>';
      button.style = "font-size: 18px; width: 23.1429px; height: 23.1429px; line-height: 18px;"
      button.classList.add("status__action-bar__button", "icon-button", "retoot");
      if (retoots.has(event.target.closest("article")?.dataset?.id)) {
        button.classList.add("active", "activate");
      }

      // Add a click event listener 
      button.addEventListener("click", async event => {
        await handleClick(event);
      });

      // Insert the 💬 button as the second button in the action bar
      const firstButton = actionBar.querySelector("button");
      actionBar.insertBefore(button, firstButton.nextSibling);
    }
  }
});

async function handleClick(event) {
  // Get the article's unique ID
  const statusId = event.target.closest("article")?.dataset?.id;
  if (statusId) {
    // Check if the article has already been retooted
    if (retoots.has(statusId)) {
      button.classList.add("active", "activate");
    }

    const div = document.querySelector(`div[data-id="${statusId}"]`);
    if (div) {
      // Take a screenshot of the div element using html2canvas
      const canvas = await html2canvas(div);

      // Get the canvas data as a data URI
      const dataUri = canvas.toDataURL();

      // Create an image element
      const img = document.createElement('img');
      img.src = dataUri;

      // Create a Blob object from the data URI
      const blob = new Blob([dataUri], { type: 'image/png' });
      const clip = new ClipboardItem({'image/png': blob});

      // Copy the image data to the clipboard
      await navigator.clipboard.write([clip]).then(() => {
        console.log('Image data copied to clipboard');

        // Get the textarea element
        const textarea = document.querySelector('textarea');
        if (textarea) {
          // Simulate a paste event on the textarea element
          const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: new DataTransfer(),
            bubbles: true,
            cancelable: true,
          });
          pasteEvent.clipboardData.items.add(new File([dataUri], 'screenshot.png'));
          textarea.dispatchEvent(pasteEvent);
        } else {
          console.error('No textarea element was found.');
        }
      }).catch((error) => {
        console.error('Failed to copy image data to clipboard:', error);
      });
    } else {
      console.log(`No element with data-id "${statusId}" was found.`);
    }
    // Save the ratings map to local storage
    localStorage.setItem("retoots", JSON.stringify([...retoots]));
  }
}

function logPermalink() {
  // Find the permalink element
  const baseUrl = 'https://mastodon.social';
  const permalinkElement = statusDiv.querySelector('div.status__info > a');
  if (permalinkElement) {
    // Get the relative permalink from the href attribute
    const relativePermalink = permalinkElement.getAttribute('href');
    const permalink = `${baseUrl}${relativePermalink}`;
    console.log(permalink); // This will print the permalink to the console
  }
}