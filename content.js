let retoots = new Map(JSON.parse(localStorage.getItem("retoots")));
if (!retoots) {
  retoots = new Map();
}

const textarea = document.querySelector('textarea');
textarea.addEventListener('paste', function (event) {

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
      // get the dimensions of the selected div
      const rect = div.getBoundingClientRect();
      const divWidth = rect.width;
      const divHeight = rect.height;

      // get the window offset of the selected div
      const windowOffsetX = rect.left + window.scrollX;
      const windowOffsetY = rect.top + window.scrollY;

      // Scroll the webpage to the desired position
      window.scrollTo(0, windowOffsetY);

      // Wait for the webpage to finish scrolling
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send a message to the background service worker to request a screenshot
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ screenshot: true }, resolve);
      });

      // Check for any errors in the response
      if (response.error) {
        console.error(response.error);
        return;
      } else {
        console.log(`From response:\n ${response.dataUri}\n\n`);
      }
      console.log(windowOffsetX, windowOffsetY, divWidth, divHeight);

      // create the canvas
      const canvas = document.createElement('canvas');
      canvas.width = divWidth;
      canvas.height = divHeight;
      const context = canvas.getContext('2d');

      // create the image element
      const image = document.createElement('img');
      image.onload = async function () {
        // draw the image to the canvas starting at the top-left corner of the cropping region
        context.drawImage(image, -windowOffsetX, -windowOffsetY);

        console.log('Put cropped image');
        // get the data URL of the cropped image
        const dataUri = canvas.toDataURL();

        console.log(`From canvas;\n ${dataUri}\n\n`);

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

      }
      image.src = response.dataUri;
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
