// noprotect

let jsonData = []; // sequence library as JSON

// add the metronome
let metroDiv = document.getElementById("metronome");
metroDiv.style = "position:relative;";
let metro = new p5(metroGUI, metroDiv);

// add the main sequence editor
let editorDiv = document.getElementById("editor");
let seqEditor = new p5(sequenceEditorGUI, editorDiv);
// seqEditor.setLibrary(structuredClone(testBeatLibrary));

// find the div for the individual sequence patterns
let seqPartDiv = document.getElementById("sequences");
seqPartDiv.style = "position: relative;";
// hand the div reference to the controller
seqEditor.setSeqDiv(seqPartDiv);

// save beats to library
//let savebeats = document.getElementById("saveBeats");
//savebeats.addEventListener("click", updateJSON);
setInterval(updateJSON, 1000); // update automatically every second

function updateJSON() {
  //jsonData = [{}]; // rebuild from p5 beat loops
  //jsonData = beatControl.getLibrary();
  const libraryJSON = document.querySelector(".data pre");
  libraryJSON.innerHTML = JSON.stringify(jsonData, null, 2);
}
//updateJSON();


// Download json file: sequences.json
const dl = document.getElementById("download");
dl.addEventListener("click", downloadZip);

function download() {
  let filename = "sequences.json";
  console.log(filename);
  let text = JSON.stringify(jsonData, null, 2);

  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function downloadZip() {
  //updateJSON();
  var zip = new JSZip();
  let text = JSON.stringify(jsonData, null, 2);
  zip.folder("JSON").file("sequences.json", text);
  // make a .zip and download it
  zip.generateAsync({ type: "blob" }).then(function (content) {
    // see FileSaver.js
    saveAs(content, "sequenceLibrary.zip");
  });
}



// Upload previous file for editing
const fileSelect = document.getElementById("upload");
const fileElem = document.getElementById("fileElem");

fileSelect.addEventListener(
  "click",
  (e) => {
    if (fileElem) {
      fileElem.click();
    }
  },
  false
);

fileElem.addEventListener("change", handleFiles, false);

function handleFiles() {
  const file = this.files[0];
  console.log("loading file: " + file.name + " file type: " + file.type);

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      let obj = JSON.parse(e.target.result); // if JSON is valid, make an object
      if (checkObject(obj)) {
        console.log("checks out OK"); // make sure it's a valid library
        // send the file to sequence editor as a library
        jsonData = obj;
        seqEditor.setLibrary(jsonData);
      } else {
        console.log("wrong file format for sequences.json");
      }
      return obj;
    } catch (error) {
      let e =
        `error - invalid JSON file ${file.name}<br /> copy and paste your JSON to https://jsonlint.com`;
      console.log(e);
      return;
    }
  };
  reader.readAsText(file);
}


function checkObject(obj) {
  // is this a valid sequence library?

  let flag = false;
  if (Array.isArray(obj) && obj.length > 0) {
    // library should be an array
    for (let i = 0; i < obj.length; i++) {
      if (obj[i].hasOwnProperty("octave") && obj[i].hasOwnProperty("sequence")) {
        if (Array.isArray(obj[i].sequence)) {
          flag = true;
        }
      } else flag = false;
    }
  }
  // console.log(obj);
  return flag;
}


async function getJsonFromUrl(url) {
  try {
    const response = await fetch(url); // Make the HTTP request
    if (!response.ok) {
      // Check if the request was successful
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json(); // Parse the response as JSON
    return data;
  } catch (error) {
    //console.error("Error fetching JSON:", error);
    return null; // Or handle the error as appropriate
  }
}

// Load the JSON library:
const jsonUrl = "JSON/sequences.json"; // look for the library
getJsonFromUrl(jsonUrl).then((data) => {
  if (data) {
    // console.log("JSON data:", data);
    // You can now work with the 'data' object
    if (checkObject(data)) {
      console.log("data looks OK");
      jsonData = data;
      //seqEditor.setLibrary(jsonData);
      // seqEditor gets a reference to the jsonData object
    } else if (Array.isArray(data) && data.length == 0) {
      jsonData = data
      console.log("empty sequence library (sequences.json)");
    } else {
      console.log("not a valid sequences.json file");
    }
  } else {
    console.log("No file " + jsonUrl);
  }
  seqEditor.setLibrary(jsonData);
});

let copyButton = document.getElementById("copy");
copyButton.addEventListener("click", copyToClipboard);


// * this function uses the now-deprecated document.execCommand('copy') because of the cross-origin frame in editor.p5js.org

function copyToClipboard() {
  console.log("copy json");
  // Get the text from the input field
  //let textToCopy = JSON.stringify(beatControl.getLibrary(), null, 2);
  let textToCopy = JSON.stringify(jsonData, null, 2); // temporary
  // Create a temporary textarea element
  let tempTextarea = document.createElement("textarea");
  tempTextarea.value = textToCopy;

  // Make the textarea invisible and add it to the DOM
  tempTextarea.style.position = "fixed";
  document.body.appendChild(tempTextarea);

  // Select the text and copy it
  tempTextarea.select();
  document.execCommand("copy");

  // Remove the temporary textarea
  document.body.removeChild(tempTextarea);
}
