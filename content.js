const script = document.createElement('script');
script.src = chrome.runtime.getURL('html2canvas.min.js');
document.head.appendChild(script);

let retoots = new Map(JSON.parse(localStorage.getItem("retoots")));
if (!retoots) {
  retoots = new Map();
}

const textarea = document.querySelector('textarea');
textarea.addEventListener('paste', function(event) {

  // Get the clipboard data
  const clipboardData = event.clipboardData;

  // Check if the clipboard data contains an image
  if (clipboardData.items[0].type.startsWith('image/')) {
    // Get the image data as a blob
    const imageBlob = clipboardData.items[0].getAsFile();

    // Use the image data as needed (e.g., upload it)
    // ...
    console.log(imageBlob.size);
    try {
      document.execCommand('paste');
    } catch {
      console.log('execCommand paste failed')
    }
  }
});

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
      button.addEventListener("click", handleClick);

      // Insert the 💬 button as the second button in the action bar
      const firstButton = actionBar.querySelector("button");
      actionBar.insertBefore(button, firstButton.nextSibling);
    }
  }
});

async function handleClick(event) {
  // Get the article's unique ID
  const statusId = event.target.closest("div").parentElement.dataset?.id;
  if (statusId) {
    // Check if the article has already been retooted
    if (retoots.has(statusId)) {
      button.classList.add("active", "activate");
    }

    const div = document.querySelector(`div[data-id="${statusId}"]`);
    if (div) {
      // Take a screenshot of the div element using html2canvas
      const canvas = await html2canvas(div, {scale: .75, quality: 1, logging: true});

      // Get the canvas data as a PNG data URL
      const dataUri = canvas.toDataURL('image/png');

      // Create a Blob object from the data URI
      const blob = dataURLtoBlob(dataUri);

      // Create a ClipboardItem object from the blob
      const clip = new ClipboardItem({ 'image/png': blob });

      // Set the onload event handler to copy the data to the clipboard
      navigator.clipboard.write([clip]).then(() => {
        console.log('PNG data copied to clipboard');

        // Get the textarea element
        if (textarea) {
          // Simulate a paste event on the textarea element
          const pasteEvent = new Event('paste');

          // Set the data property of the paste event to the clipboard data
          pasteEvent.clipboardData = {
            items: [{
              type: 'image/png',
              getAsFile: () => new File([blob], 'screenshot.png'),
            }],
          };

          // Dispatch the paste event on the textarea element
          textarea.dispatchEvent(pasteEvent);
        } else {
          console.error('Could not find the textarea');
        }
      }).catch((error) => {
        console.error(`Failed: blob type ${blob.type} size ${blob.size}\n ${error})`);
      });
    } else {
      console.log(`No element with data-id "${statusId}" was found.`);
    }
    // Save the ratings map to local storage
    localStorage.setItem("retoots", JSON.stringify([...retoots]));
  }
}

function dataURLtoBlob(dataURL) {
  const [, base64] = dataURL.split(',');
  const byteString = atob(base64);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const int8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    int8Array[i] = byteString.charCodeAt(i);
  }
  return new Blob([int8Array], { type: 'image/png' });
}
