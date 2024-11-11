// ==UserScript==
// @name         typersguild restyler
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds themes to typersguild.com
// @author       frogssoldseparately
// @match        https://typersguild.com
// @match        https://typersguild.com/books/*
// @grant        none
// ==/UserScript==

(function () {
  function waitForElement(
    elemFetchHandle,
    actionHandle,
    interval,
    name = "element",
    iMax = 100
  ) {
    let iterationMax = iMax;
    let intervalId = setInterval(() => {
      if (iterationMax === 0) {
        clearInterval(intervalId);
        throw new Error(`${name} didn't load. Maximum iterations surpassed.`);
      }
      const elem = elemFetchHandle();
      if (elem) {
        console.log(`${name} has loaded.`);
        clearInterval(intervalId);
        actionHandle(elem);
      } else {
        console.log(
          `Waiting for ${name} to load. Checking again in ${interval}ms`
        );
        iterationMax--;
      }
    }, interval);
  }

  function generateThemes(elem) {
    if (elem.querySelector(".newThemeButtonTarget")) return;
    const themeEntryExample = elem.firstChild;
    const entryCheckSpan = themeEntryExample.firstChild;

    const themeEntryClass = themeEntryExample.className;
    const entryCheckClass = entryCheckSpan.className;

    const entryTextIdTemplate = `${themeEntryExample.lastChild.id.slice(
      0,
      -3
    )}{UNIQUE_LETTER}:`;
    const startAscii = themeEntryExample.lastChild.id
      .slice(-2, -1)
      .charCodeAt(0);

    let tagString = "";

    const additionalStyles = styleContainer.styles;
    for (var i = 0; i < additionalStyles.length; i++) {
      const entryTextId = entryTextIdTemplate.replace(
        "{UNIQUE_LETTER}",
        String.fromCharCode(startAscii + i + 1)
      );
      const style = additionalStyles[i];
      tagString += `
      <div class="${themeEntryClass} newThemeButtonTarget" role="option" aria-labelledby="${entryTextId}"
          aria-selected="false" data-state="unchecked" tabIndex="-1" data-radix-collection-item="">
        <span class="${entryCheckClass}"></span>
        <span id="${entryTextId}">${style.name}</span>
      </div>
      `;
    }

    const range = document.createRange();
    range.selectNodeContents(document.body);
    const fragment = range.createContextualFragment(tagString);

    Array.from(fragment.querySelectorAll(".newThemeButtonTarget")).forEach(
      (buttonTarget, i) => {
        buttonTarget.addEventListener("click", () => {
          styleContainer.pickByName(additionalStyles[i].name);
          document.querySelector("button.absolute").click();
          waitForElement(
            () => document.querySelector('body[style*="pointer-events: none"]'),
            (elem) => {
              setTimeout(() => {
                elem.style.pointerEvents = "";
              }, 300);
            },
            100,
            "Silenced Body"
          );
        });
        if (additionalStyles[i].name === styleContainer.name) {
          const currentSelected = elem.querySelector('[data-state="checked"]');
          const checkContents = currentSelected.querySelector(
            '[aria-hidden="true"]'
          );
          const newCheck = document.createElement("span");
          newCheck.setAttribute("aria-hidden", "true");
          newCheck.innerHTML = checkContents.innerHTML;
          currentSelected.setAttribute("data-state", "unchecked");
          checkContents.remove();
          currentSelected.blur();
          buttonTarget.setAttribute("data-state", "checked");
          buttonTarget.querySelector("span").appendChild(newCheck);
        }
      }
    );

    elem.appendChild(fragment);
  }

  function settingsButtonAction() {
    waitForElement(
      () => document.getElementById("theme"),
      (elem) => {
        const overrideSpan = document.createElement("span");
        overrideSpan.style.pointerEvents = "none";
        overrideSpan.appendChild(document.createTextNode(styleContainer.name));
        elem.insertBefore(overrideSpan, elem.querySelector("svg"));
        elem.addEventListener("click", () => {
          const themeMenu = document.getElementById(
            elem.getAttribute("aria-controls")
          );
          if (themeMenu) generateThemes(themeMenu.lastChild);
        });
      },
      100,
      "Theme Button"
    );
  }

  const restylerLSName = "restyler-selected-style";

  class StyleContainer {
    constructor() {
      this.newStyle(
        "incognito-adjacent",
        "#ffa500",
        "#7b786f",
        "#fff59d",
        "#d13100",
        "#a32600",
        "#111111"
      );
      this.newStyle(
        "simulation",
        "#4ac10a",
        "#205b00",
        "#ffffff",
        "#ff0000",
        "#ff0000",
        "#000000"
      );
      this.newStyle(
        "ultra-contrast",
        "#ffffff",
        "#000000",
        "#aaaaaa",
        "#ff0000",
        "#ff0000",
        "#000000"
      );
      this.newStyle(
        "blinding",
        "#000000",
        "#ffffff",
        "#aaaaaa",
        "#ff0000",
        "#ff0000",
        "#ffffff"
      );
      this.newStyle(
        "pumpkin",
        "#ffc94a",
        "#4e5b40",
        "#a8cc88",
        "#d7977b",
        "#9f673e",
        "#4b703a"
      );
      this.newStyle(
        "deep sea",
        "#4cc9f0",
        "#4361ee",
        "#bde0fe",
        "#f72585",
        "#7209b7",
        "#3a0ca3"
      );
      this.newStyle(
        "oak",
        "#d8f3dc",
        "#74c69d",
        "#081c15",
        "#9f6d2b",
        "#442f17",
        "#1b4332"
      );
      document.head.appendChild(this.#styleElement);
      this.#selectedStyle = this.#styles[localStorage.getItem(restylerLSName)];
      if (this.#selectedStyle == null) {
        this.pickNth(0);
      } else {
        this.#selectedName = localStorage.getItem(restylerLSName);
        this.#generateCSS();
      }
    }
    newStyle(
      name,
      untypedColor,
      typedColor,
      blinkBackground,
      mistypeColor,
      misspaceBackground,
      pageBackground
    ) {
      this.#styles[name] = {
        untypedColor,
        typedColor,
        blinkBackground,
        mistypeColor,
        misspaceBackground,
        pageBackground,
      };
    }
    pickNth(index) {
      this.pickByName(Object.getOwnPropertyNames(this.#styles)[index]);
    }
    pickByName(name) {
      const newStyle = this.#styles[name];
      if (newStyle !== this.#selectedStyle) {
        localStorage.setItem(restylerLSName, name);
        this.#selectedStyle = newStyle;
        this.#selectedName = name;
        this.#generateCSS();
      }
    }
    get styles() {
      const arr = [];
      Object.getOwnPropertyNames(this.#styles).forEach((name) => {
        const entry = { name, style: this.#styles[name] };
        arr.push(entry);
      });
      return arr;
    }
    get name() {
      return this.#selectedName;
    }
    #generateCSS() {
      this.#styleElement.innerText = "";
      this.#styleElement.appendChild(
        StyleContainer.fillStyleTemplate(this.#selectedStyle)
      );
    }
    static fillStyleTemplate(style) {
      const {
        untypedColor,
        typedColor,
        blinkBackground,
        mistypeColor,
        misspaceBackground,
        pageBackground,
      } = style;
      const styleTemplate = `
      .text-white, .text-black {
        color: ${untypedColor} !important;
      }
      [class^="text-gray-"] {
        color: ${typedColor} !important;
      }
      [class^="text-red-"] {
        color: ${mistypeColor} !important;
      }
      [class^="text-red-"][class$="\/20"] {
        background-color: ${misspaceBackground} !important;
      }
      .cursor-element[padding-bottom="2px"] {
        border-bottom: 2px solid ${blinkBackground} !important;
      }
      .cursor-element:not([padding-bottom="2px"]) {
        box-shadow: ${blinkBackground} 2px 0px 0px 0px inset !important;
      }
      .bg-background {
        background-color: ${pageBackground} !important;
      }
      header {
        background-color: ${pageBackground} !important;
      }
      .text-sm {
        color: ${untypedColor} !important;
      }
      .text-lg {
        color: ${untypedColor} !important;
      }
      .bg-card {
        background-color: ${pageBackground} !important;
      }
      #theme span:first-of-type {
        display: none;
      }
      .bg-popover {
        background-color: ${pageBackground} !important;
      }
      div[role="option"][data-highlighted=""], div[role="option"]:hover {
        background-color: ${blinkBackground} !important;
      }
      .transition-colors[class*="text-foreground"] {
        color: ${untypedColor} !important;
      }
      .transition-colors[class*="text-foreground"]:hover {
        color: ${blinkBackground} !important;
      }
      body {
        color: ${untypedColor} !important;
      }
      `;

      return document.createTextNode(styleTemplate);
    }
    #selectedStyle = {};
    #selectedName = "";
    #styleElement = document.createElement("style");
    #styles = {};
  }

  const styleContainer = new StyleContainer();

  waitForElement(
    () => document.querySelector('button[aria-label="Open settings"]'),
    (elem) => {
      elem.addEventListener("click", settingsButtonAction);
    },
    100,
    "Settings Button",
    -1 // run this with no timeout
  );
})();
