// ==UserScript==
// @name         typelit restyler
// @namespace    https://raw.githubusercontent.com/frogssoldseparately/
// @downloadURL  https://raw.githubusercontent.com/frogssoldseparately/userscripts/refs/heads/main/typelit_restyler/typelit_restyler.js
// @updateURL    https://raw.githubusercontent.com/frogssoldseparately/userscripts/refs/heads/main/typelit_restyler/typelit_restyler.js
// @version      0.5
// @description  Adds additional themes to typelit.io
// @author       frogssoldseparately
// @match        https://www.typelit.io
// @match        https://www.typelit.io/typing-console*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.typelit.io
// @grant        none
// ==/UserScript==

(function () {
  "use strict";
  // checks to see if elemFetchHandle returns a non-null value in a set interval.
  // once it returns a non-null value, runs actionHandle with that value as an input.
  function waitForElement(
    elemFetchHandle,
    actionHandle,
    interval,
    name = "element"
  ) {
    let iterationMax = 100; // maximum amount of allowed checks. Throws an error after this many attempts
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
          `Waiting for ${name} to load. Checking again in ${interval}ms.`
        );
        iterationMax--;
      }
    }, interval);
  }
  // generates additional theme elements and appends them to the provided theme menu
  function generateThemes(elem) {
    // fetching necessary classnames
    const headerClass = elem.querySelector(
      'div[class*="headerMargin"]'
    ).className;
    const separatorClass = elem.querySelector('hr[class*="divider"]').className;
    const themeButtonGroupExample = elem.querySelectorAll(
      'div[class*="themeButtonSection"]'
    )[1];
    const themeContainerExamples = themeButtonGroupExample.querySelectorAll(
      'div[class*="premiumThemeButtonContainer"]'
    );

    const firstThemeContainerExample = themeContainerExamples[0];
    const themeContainerExample = themeContainerExamples[1];
    const lastThemeContainerExample =
      themeContainerExamples[themeContainerExamples.length - 1];

    const firstThemeButtonExample = firstThemeContainerExample.firstChild;
    const themeButtonExample = themeContainerExample.firstChild;
    const lastThemeButtonExample = lastThemeContainerExample.firstChild;

    const themeButtonGroupClass = themeButtonGroupExample.className;
    const themeContainerClass = themeContainerExample.className;
    const firstThemeButtonClass = firstThemeButtonExample.className;
    const themeButtonClass = themeButtonExample.className;
    const lastThemeButtonClass = lastThemeButtonExample.className;

    const colorChipClass = themeButtonExample.firstChild.className;
    const labelClass = themeButtonExample.childNodes[1].className;
    const spanClass = themeButtonExample.lastChild.className;

    // generate the tags to inject into the themes menu

    let tagString = `
    <hr class="${separatorClass}">
    <div class="${headerClass}">Naughty Themes</div>
    <div id="newButtonSectionTarget" class="${themeButtonGroupClass}">
    `;

    // generates a button container (and associated contents) for each additional theme
    const additionalStyles = styleContainer.styles;
    for (var i = 0; i < additionalStyles.length; i++) {
      const style = additionalStyles[i];
      let styleButtonClassName = "newThemeButtonTarget ";
      switch (i) {
        case 0:
          styleButtonClassName += firstThemeButtonClass;
          break;
        case additionalStyles.length - 1:
          styleButtonClassName += lastThemeButtonClass;
          break;
        default:
          styleButtonClassName += themeButtonClass;
      }
      tagString += `
      <div class="${themeContainerClass}">
        <button class="${styleButtonClassName}" tabindex="0" type="button"
            style="background: ${style.style.pageBackground}; color: ${
        style.style.untypedColor
      }">
          <div class="${colorChipClass}" style="background: ${
        style.style.blinkBackground
      }"></div>
          <div class="${labelClass}">${style.name.toUpperCase()}</div>
          <span class="${spanClass}"></span>
        </button>
      </div>
      `;
    }

    tagString += "</div>"; // closes button group div

    // generate a manipulatable document fragment
    const range = document.createRange();
    range.selectNodeContents(document.body);
    const fragment = range.createContextualFragment(tagString);

    // add listeners to necessary elements

    const newButtonSection = fragment.getElementById("newButtonSectionTarget");
    newButtonSection.removeAttribute("id");
    // undoes the theme applied by hovering over a theme button
    newButtonSection.addEventListener("mouseleave", () => {
      styleContainer.revertPick();
    });

    Array.from(fragment.querySelectorAll(".newThemeButtonTarget")).forEach(
      (buttonTarget, i) => {
        buttonTarget.classList.remove("newThemeButtonTarget");
        // applies the desired theme and closes the settings menu
        buttonTarget.addEventListener("click", () => {
          styleContainer.pickByName(additionalStyles[i].name);
          document.querySelector(".css-esi9ax").click();
        });
        // temporarily applies theme as a preview while hovering over the theme button
        buttonTarget.addEventListener("mouseenter", () => {
          styleContainer.temporaryPickByName(additionalStyles[i].name);
        });
      }
    );

    // appends fragment children to the theme menu container
    elem.appendChild(fragment);
  }
  // add necessary listeners to settings elements to make custom themes appear
  function settingsButtonAction() {
    // waits for the theme button to exist and adds an event listener to it to generate additional theme buttons
    waitForElement(
      () => {
        return Array.from(document.querySelectorAll("button")).filter(
          (elem) => {
            for (var i = 0; i < elem.childNodes.length; i++) {
              const child = elem.childNodes[i];
              if (child.attributes == null) return child.nodeValue === "Themes";
            }
            return false;
          }
        )[0];
      },
      (elem) => {
        // readds the click listener to the settings button when settings are closed.
        // this is necessary because the settings button gets replaced.
        document.querySelector(".css-esi9ax").addEventListener("click", () => {
          const heldInstance = document.querySelector(
            'button[aria-label="Settings"]'
          );
          waitForElement(
            () => {
              // waits for the settings button to get replaced
              const checkedInstance = document.querySelector(
                'button[aria-label="Settings"]'
              );
              return checkedInstance !== heldInstance ? checkedInstance : null;
            },
            (elem) => {
              // adds the listener to the new button
              elem.addEventListener("click", settingsButtonAction);
            },
            50,
            "Settings Button"
          );
        });
        // generates additional theme buttons when the theme settings panel is opened
        elem.addEventListener("click", () => {
          if (document.querySelector('div[class$="themeMenu"]')) return;
          waitForElement(
            () => document.querySelector('div[class$="themeMenu"]'),
            generateThemes,
            50,
            "Themes Menu"
          );
        });
      },
      50,
      "Themes Button"
    );
  }

  const restylerLSName = "restyler-selected-style"; // localStorage field name for last selected theme

  // holds information about additional themes and generates necessary css to apply them to the page
  class StyleContainer {
    constructor() {
      // generate available themes
      this.newStyle(
        "incognito-adjacent",
        "#ffa500",
        "#7b786f",
        "#fff59d",
        "#d13100",
        "#00ccff",
        "#a32600",
        "#111111"
      );
      this.newStyle(
        "simulation",
        "#4ac10a",
        "#205b00",
        "#ffffff",
        "#ff0000",
        "#4ac10a",
        "#ff0000",
        "#000000"
      );
      this.newStyle(
        "ultra-contrast",
        "#ffffff",
        "#000000",
        "#aaaaaa",
        "#ff0000",
        "#ffffff",
        "#ff0000",
        "#000000"
      );
      this.newStyle(
        "blinding",
        "#000000",
        "#ffffff",
        "#aaaaaa",
        "#ff0000",
        "#000000",
        "#ff0000",
        "#ffffff"
      );
      // appends a style tag
      document.head.appendChild(this.#styleElement);
      // fetches last selected theme from localStorage
      this.#selectedStyle = this.#styles[localStorage.getItem(restylerLSName)];
      // if no theme was last selected
      if (this.#selectedStyle == null) {
        // pick the first known theme
        this.pickNth(0);
      } else {
        // generate and apply the theme
        this.#generateCSS();
      }
    }
    newStyle(
      name,
      untypedColor,
      typedColor,
      blinkBackground,
      mistypeColor,
      altMistypeColor,
      misspaceBackground,
      pageBackground
    ) {
      this.#styles[name] = {
        untypedColor,
        typedColor,
        blinkBackground,
        mistypeColor,
        altMistypeColor,
        misspaceBackground,
        pageBackground,
      };
    }
    // picks the nth theme based on order they were added
    pickNth(index) {
      this.pickByName(Object.getOwnPropertyNames(this.#styles)[index]);
    }
    // picks theme based on property name
    pickByName(name) {
      const newStyle = this.#styles[name];
      if (newStyle !== this.#selectedStyle) {
        localStorage.setItem(restylerLSName, name);
        this.#selectedStyle = newStyle;
        this.#generateCSS();
      }
    }
    temporaryPickByName(name) {
      this.#temporaryHold = this.#styles[name];
      this.#generateCSS();
    }
    revertPick() {
      this.#temporaryHold = null;
      this.#generateCSS();
    }
    // returns array of objects with name and style object fields
    get styles() {
      const arr = [];
      Object.getOwnPropertyNames(this.#styles).forEach((name) => {
        const entry = { name, style: this.#styles[name] };
        arr.push(entry);
      });
      return arr;
    }
    // applys theme to page
    #generateCSS() {
      this.#styleElement.innerText = "";
      const style = this.#temporaryHold
        ? this.#temporaryHold
        : this.#selectedStyle;
      this.#styleElement.appendChild(StyleContainer.fillStyleTemplate(style));
    }
    static fillStyleTemplate(style) {
      const {
        untypedColor,
        typedColor,
        blinkBackground,
        mistypeColor,
        altMistypeColor,
        misspaceBackground,
        pageBackground,
      } = style;
      const styleTemplate = `
      [class*="_TYPED__"] {
        color: ${typedColor} !important;
      }

      [class*="_ACTIVE_BOX__"] {
        color: ${untypedColor} !important;
        background-color: ${blinkBackground} !important;
      }

      [class*="_ACTIVE_LINE__"] {
        color: ${untypedColor} !important;
        box-shadow: -2px 0 ${blinkBackground} !important;
      }

      [class*="_ACTIVE_NONE__"] {
        color: ${untypedColor} !important;
      }

      [class*="_FIRST_ACTIVE_BLINK_FILL__"] {
        color: ${untypedColor} !important;
      }

      [class*="_UNTYPED__"] {
        color: ${untypedColor} !important;
      }

      [class*="_MISTYPED__"] {
        color: ${mistypeColor} !important;
      }

      [class*="_SPACE_MISTYPED__"] {
        color: ${altMistypeColor} !important;
        background-color: ${misspaceBackground} !important;
      }

      [class$="-pageBackground"] {
        background-color: ${pageBackground} !important;
      }

      [class$="-consolePageBreadcrumbsContainer"] {
        background-color: ${pageBackground} !important;
      }

      [class$="-statTracker"] {
        color: ${untypedColor} !important;
      }

      [class$="-statTracker-savedStat"] {
        color: ${untypedColor} !important;
      }

      [class$="-backLink"] {
        color: ${untypedColor} !important;
      }

      path {
        color: ${untypedColor} !important;
      }

      [class$="-settingsHeader"] {
        color: ${typedColor} !important;
      }

      [class$="-sectionHeader"] {
        color: ${typedColor} !important;
      }

      [class$="-themeMenuButton"] {
        color: ${typedColor} !important;
      }

      [class$="-settingLabel"] .MuiFormControlLabel-label {
        color: ${typedColor} !important;
      }

      [class$="-paper"] {
        background-color: ${blinkBackground} !important;
      }

      [aria-label="theme menu"] {
        background-color: ${blinkBackground} !important;
      }

      [class$="-charTyped"] {
        color: ${typedColor} !important;
      }

      [class$="-charActiveBox"] {
        color: ${untypedColor} !important;
        background-color: ${blinkBackground} !important;
      }

      [class$="-charUntyped"] {
        color: ${untypedColor} !important;
      }

      [class$="-buttonGroup"] .MuiToggleButtonGroup-root .MuiToggleButton-root {
        background-color: ${pageBackground} !important;
      }

      [class$="-themeSectionHeader-_headerMargin"] {
        color: ${typedColor} !important;
      }

      [class$="-themeSectionHeader"] {
        color: ${typedColor} !important;
      }

      [class$="-resetDefaultsButton"] {
        color: ${typedColor} !important;
      }
      `;

      return document.createTextNode(styleTemplate);
    }
    #temporaryHold = null;
    #selectedStyle = {};
    #styleElement = document.createElement("style");
    #styles = {};
  }
  // prepare additional themes. check for and apply last selected theme in localStorage.
  const styleContainer = new StyleContainer();
  // Prevents F5 keydowns from having their default action prevented.
  window.addEventListener("keydown", (event) => {
    if (event.key === "F5") {
      event.stopImmediatePropagation();
    }
  });
  // Makes additional themes appear in the theme selector
  waitForElement(
    () => document.querySelector('button[aria-label="Settings"]'),
    (elem) => {
      elem.addEventListener("click", settingsButtonAction);
    },
    100,
    "Settings Button"
  );
})();
