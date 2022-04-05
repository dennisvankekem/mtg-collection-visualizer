// ==UserScript==
// @name         moxfield collection overlay for scryfall
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  visual overlay for scryfall for your moxfield collection, resulting in a best of both worlds collection tracker (and free)
// @author       Hands
// @match        https://scryfall.com/sets*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=scryfall.com
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

const CARD_STORE = "card_store";

(function () {
  "use strict";
  //console.log('pathname', window.location.pathname)
  let location = window.location.pathname;
  if (location === "/sets" || location === "/sets/") {
    allSetsPageLayout();
  } else if (location.includes("/sets")) {
    specificSetPageLayout(location.replace("/sets/", ""));
  }
})();

//create image overlay for pages with for specific sets
function specificSetPageLayout(setName) {
  const data = GM_getValue(CARD_STORE);
  if (data && Object.keys(data).length !== 0) {
    let dataSet = data[setName];
    //let setNames = Array.from(document.querySelectorAll("small")).map(x => x.innerText)
    const numberFromUrlRegex = new RegExp(
      `(?<=https:\/\/scryfall\.com\/card\/${setName}\/).*(?=\/)`
    );
    //new RegExp("/(?<=https:\/\/scryfall\.com\/card\/"+ setName + "\/).*(?=\/)/g");
    let setCards = Array.from(
      document.getElementsByClassName("card-grid-item-card")
    );
    setCards.forEach((card, index) => {
      if (!dataSet[card.href.match(numberFromUrlRegex)[0]]) {
        card.style.opacity = "0.4";
      }
    });

    //const numberFromUrlRegex = new RegExp("/(?<=https:\/\/scryfall\.com\/card\/"+ setName + "\/).*(?=\/)/g");
    //Array.from(document.getElementsByClassName('card-grid-item-card')).map(x => x.href.match(numberFromUrlRegex))
  }
}

// create banner input + label to import csv in scryfall/sets
function allSetsPageLayout() {
  let controlBanner = document.getElementsByClassName(
    "search-controls-inner"
  )[0];

  let updateCollectionLabel = document.createElement("label");
  updateCollectionLabel.className = "button-n";
  updateCollectionLabel.textContent = "Update Collection";

  let updateCollectionButton = document.createElement("input");
  updateCollectionButton.type = "file";
  updateCollectionButton.style.display = "none";

  updateCollectionButton.addEventListener("input", function (value) {
    let reader = new FileReader();
    reader.readAsText(value.target.files[0]);
    reader.onload = function () {
      let data = CsvToJson(reader.result);
      GM_setValue(CARD_STORE, data);
      insertTableColumn(data);
      console.log("data has been loaded to gmstore");
    };
  });

  const data = GM_getValue(CARD_STORE);
  if (data && Object.keys(data).length !== 0) {
    //leave this in
    console.log("data loaded", data);
    insertTableColumn(data);
  }

  updateCollectionLabel.appendChild(updateCollectionButton);
  controlBanner.appendChild(updateCollectionLabel);
}

// csv to custom json tree sorted by sets
function CsvToJson(data) {
  let dataArr = data.split("\n");
  var result = {};

  for (var i = 1; i < dataArr.length - 1; i++) {
    //Moxfield has this weird csv format where everything is encapsulated by quotes
    //might make this compatible with normal formatted CSV files later
    let currentLine = dataArr[i].match(/"([^"]*)"/gm);
    //for now it only works with the most ugly trim in the world
    let number = currentLine[9].replace(/['"]+/g, "");
    let set = currentLine[3].replace(/['"]+/g, "");

    //not happy with this json pivot, but it is what it is
    if (!result[set]) {
      result[set] = {
        [number]: {
          condition: currentLine[4],
          language: currentLine[5],
          name: currentLine[2].replace(/['"]+/g, ""),
        },
      };
    } else {
      result[set][number] = {
        condition: currentLine[4],
        language: currentLine[5],
        name: currentLine[2].replace(/['"]+/g, ""),
      };
    }
  }

  return result;
}

//create extra column on scryfall/sets to track owned cards
function insertTableColumn(data) {
  let tableHead = document.querySelectorAll("thead tr");
  let tableCountHead = document.createElement("th");
  tableCountHead.className = "em9";
  tableCountHead.innerText = "Owned";
  tableHead[0].insertBefore(tableCountHead, tableHead[0].children[2]);

  let tableRows = document.querySelectorAll("tbody tr");
  let tableCountData = document.createElement("td");
  tableCountData.innerText = 0;

  let setNames = Array.from(document.querySelectorAll("small")).map(
    x => x.innerText
  );

  tableRows.forEach((row, index) => {
    let testnode = document.createElement("td");
    let count = 0;
    let setSym = setNames[index].toLowerCase();
    if (data[setSym]) {
      count = Object.keys(data[setSym]).length;
    }
    testnode.innerText = count;

    row.insertBefore(testnode, row.children[2]);
  });
}
