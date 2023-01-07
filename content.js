let retoots = new Map(JSON.parse(localStorage.getItem("retoots")));
if (!retoots) {
  retoots = new Map();
}

const textarea = document.querySelector('textarea');

document.addEventListener("DOMNodeInserted", event => {
  if (event.target.querySelector) {

    const actionBar = event.target.querySelector(".status__action-bar");
    const detailedBar = event.target.querySelector(".detailed-status__action-bar");

    if (actionBar || detailedBar) {

      // Create the 💬 button
      const button = document.createElement("button");
      button.innerHTML = '<i class="fa fa-thumbs-up fa-fw"></i>';
      button.title = "Retoot";
      button.style = "font-size: 18px; width: 23.1429px; height: 23.1429px; line-height: 18px;"

      if (actionBar && !actionBar.querySelector(".retoot")) {
        button.classList.add("status__action-bar__button", "icon-button", "retoot");
        if (retoots.has(event.target.closest("article")?.dataset?.id)) {
          button.classList.add("active", "activate");
        }
        const firstButton = actionBar.querySelector("button");
        actionBar.insertBefore(button, firstButton.nextSibling);
      }

      if (detailedBar && !detailedBar.querySelector(".retoot")) {
        const div = document.createElement("div");
        div.classList.add("detailed-status__button", "retoot");
        button.classList.add("icon-button")
        div.appendChild(button);

        const firstButton = detailedBar.querySelector("div");
        detailedBar.insertBefore(div, firstButton.nextSibling);
      }

      // Add a click event listener 
      button.addEventListener("click", handleClick);
      button.addEventListener("eventlistenerremoved", function(event) {
        console.log("Event listener removed:", event.listener);
      });

    }
  }
});

async function handleClick(event) {
  // Get the article's unique ID
  const statusId = event.target.closest("div").parentElement.dataset?.id;
  // Check if the article has already been retooted
  if (retoots.has(statusId)) {
    button.classList.add("active", "activate");
  }

  const div = document.querySelector(`div[data-id="${statusId}"]`) || document.querySelector(`div.detailed-status`);
  if (div) {
    // get the dimensions of the selected div
    const rect = div.getBoundingClientRect();
    const divWidth = rect.width; 
    const divHeight = rect.height - 50; // we don't need to see the status bar again

    // If we are on the detailed page, scroll to the top before taking the screenshot
    if (document.querySelector(`div.detailed-status`)) {
      window.scrollTo(0, 0);
    }
    
    // get the window offset of the selected div
    const viewportHeight = window.innerHeight;
    const windowOffsetX = rect.left + window.scrollX;
    const windowOffsetY = (rect.top + window.scrollY) % viewportHeight;

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

          document.execCommand('paste');
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
