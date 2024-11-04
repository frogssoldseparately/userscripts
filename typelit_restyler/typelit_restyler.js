// ==UserScript==
// @name         typelit restyler
// @namespace    https://raw.githubusercontent.com/frogssoldseparately/
// @downloadURL  https://raw.githubusercontent.com/frogssoldseparately/userscripts/refs/heads/main/typelit_restyler/typelit_restyler.js
// @updateURL    https://raw.githubusercontent.com/frogssoldseparately/userscripts/refs/heads/main/typelit_restyler/typelit_restyler.js
// @version      0.3
// @description  Adds additional themes to typelit.io
// @author       frogssoldseparately
// @match        https://www.typelit.io
// @match        https://www.typelit.io/typing-console*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.typelit.io
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // checks to see if elemFetchHandle returns a non-null value in a set interval.
    // once it returns a non-null value, runs actionHandle with that value as an input.
    function waitForElement(elemFetchHandle, actionHandle, interval, name="element") {
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
                console.log(`Waiting for ${name} to load. Checking again in ${interval}ms.`);
                iterationMax--;
            }
        }, interval);
    }
    // generates additional theme elements and appends them to the provided theme menu
    function generateThemes(elem) {
        // fetching necessary classnames
        const headerClass = elem.querySelector('div[class*="headerMargin"]').className;
        const separatorClass = elem.querySelector('hr[class*="divider"]').className;
        const themeButtonGroupExample = elem.querySelectorAll('div[class*="themeButtonSection"]')[1];
        const themeContainerExamples = themeButtonGroupExample.querySelectorAll('div[class*="premiumThemeButtonContainer"]');

        const firstThemeContainerExample = themeContainerExamples[0];
        const themeContainerExample = themeContainerExamples[1];
        const lastThemeContainerExample = themeContainerExamples[themeContainerExamples.length - 1];

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

        // creates horizontal rule to add space between premium themes and additional themes
        const separator = document.createElement('hr');
        separator.className = separatorClass;
        elem.appendChild(separator);

        // creates header for the additional themes button container
        const newStyleHeader = document.createElement('div');
        newStyleHeader.className = headerClass;
        newStyleHeader.appendChild(document.createTextNode('Naughty Themes'));
        elem.appendChild(newStyleHeader);

        // creates a button section for the additional themes
        const newButtonSection = document.createElement('div');
        newButtonSection.className = themeButtonGroupClass;
        newButtonSection.addEventListener("mouseleave", () => {
            styleContainer.revertPick();
        });
        elem.appendChild(newButtonSection);

        // creates a theme button for each additional style
        const additionalStyles = styleContainer.styles;
        for (var i = 0; i < additionalStyles.length; i++) {
            const style = additionalStyles[i];
            // creates a theme container
            const buttonContainer = document.createElement('div');
            buttonContainer.className = themeContainerClass;

            // creates the button that does the work
            const styleButton = document.createElement('button');
            // ensure proper class assignment so the button corners round properly.
            switch (i) {
                case 0: styleButton.className = firstThemeButtonClass; break;
                case additionalStyles.length - 1: styleButton.className = lastThemeButtonClass; break;
                default: styleButton.className = themeButtonClass;
            }
            // styleButton.className = themeButtonClass;
            styleButton.setAttribute('tabindex', 0);
            styleButton.setAttribute('type', 'button');
            styleButton.style.background = style.style.pageBackground;
            styleButton.style.color = style.style.untypedColor;
            styleButton.addEventListener('click', () => {
                styleContainer.pickByName(style.name);
                document.querySelector('div[role="presentation"]').firstChild.click();
            });
            styleButton.addEventListener('mouseenter', () => styleContainer.temporaryPickByName(style.name));

            // create theme display elements for the button
            const menuChip = document.createElement('div');
            menuChip.className = colorChipClass;
            menuChip.style.background = style.style.blinkBackground;
            const label = document.createElement('div');
            label.className = labelClass;
            label.appendChild(document.createTextNode(style.name.toUpperCase()));
            const span = document.createElement('span');
            span.className = spanClass;

            // append button elements to button, button to container, and container to button section
            styleButton.appendChild(menuChip);
            styleButton.appendChild(label);
            styleButton.appendChild(span);
            buttonContainer.appendChild(styleButton);
            newButtonSection.appendChild(buttonContainer);
        }
    }
    // add necessary listeners to settings elements to make custom themes appear
    function settingsButtonAction() {
        // waits for the theme button to exist and adds an event listener to it to generate additional theme buttons
        waitForElement(() => {
            return Array.from(document.querySelectorAll('button')).filter(elem => {
                for (var i = 0; i < elem.childNodes.length; i++) {
                    const child = elem.childNodes[i];
                    if (child.attributes == null) return child.nodeValue === "Themes";
                }
                return false;
            })[0];
        }, (elem) => {
            // readds the click listener to the settings button when settings are closed.
            // this is necessary because the settings button gets replaced.
            document.querySelector('div[role="presentation"]').firstChild.addEventListener('click', () => {
                const heldInstance = document.querySelector('button[aria-label="Settings"]');
                waitForElement(() => {
                    // waits for the settings button to get replaced
                    const checkedInstance = document.querySelector('button[aria-label="Settings"]');
                    return checkedInstance !== heldInstance ? checkedInstance : null;
                }, (elem) => {
                    // adds the listener to the new button
                    elem.addEventListener('click', settingsButtonAction);
                }, 50, "Settings Button");
            });
            // generates additional theme buttons when the theme settings panel is opened
            elem.addEventListener('click', () => {
                if (document.querySelector('div[class$="themeMenu"]')) return;
                waitForElement(() => document.querySelector('div[class$="themeMenu"]'), generateThemes, 50, "Themes Menu");
            });
        }, 50, "Themes Button");
    };

    const restylerLSName = "restyler-selected-style"; // localStorage field name for last selected theme

    // holds information about additional themes and generates necessary css to apply them to the page
    class StyleContainer {
        constructor() {
            // generate available themes

            //      theme name     | untyped |   typed  |   blink   | mistype |  alt miss | misspace |   page     |
            //                     |  color  |   color  | background|  color  |   color   |  color   | background |
            this.newStyle(
                "incognito-adjacent",
                                    "#ffa500", "#7b786f", "#fff59d", "#d13100", "#00ccff", "#a32600", "#111111");
            this.newStyle(
                "simulation",
                                    "#4ac10a", "#205b00", "#ffffff", "#ff0000", "#4ac10a", "#ff0000", "#000000");
            this.newStyle(
                "ultra-contrast",
                                    "#ffffff", "#000000", "#aaaaaa", "#ff0000", "#ffffff", "#ff0000", "#000000");
            this.newStyle(
                "blinding",
                                    "#000000", "#ffffff", "#aaaaaa", "#ff0000", "#000000", "#ff0000", "#ffffff");
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
        newStyle(name, untypedColor, typedColor, blinkBackground, mistypeColor, altMistypeColor, misspaceBackground, pageBackground) {
            this.#styles[name] = { untypedColor, typedColor, blinkBackground, mistypeColor, altMistypeColor, misspaceBackground, pageBackground };
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
            Object.getOwnPropertyNames(this.#styles).forEach(name => {
                const entry = {name, style: this.#styles[name]};
                arr.push(entry);
            });
            return arr;
        }
        // applys theme to page
        #generateCSS() {
            this.#styleElement.innerText = "";
            const style = this.#temporaryHold ? this.#temporaryHold : this.#selectedStyle;
            this.#styleElement.appendChild(StyleContainer.fillStyleTemplate(style));
        }
        static fillStyleTemplate(style) {
            const { untypedColor, typedColor, blinkBackground, mistypeColor, altMistypeColor, misspaceBackground, pageBackground } = style;
            return document.createTextNode(
                `.darkThemeStyles_TYPED__Ol9UD { color: ${typedColor} !important; } ` +
                `.darkThemeStyles_ACTIVE_BOX__fsX__ { color: ${untypedColor} !important; background-color: ${blinkBackground} !important; } ` +
                `.darkThemeStyles_FIRST_ACTIVE_BLINK_FILL__9fCaF { color: ${untypedColor} !important; } ` +
                `.darkThemeStyles_UNTYPED__72cJX { color: ${untypedColor} !important; } ` +
                `.darkThemeStyles_MISTYPED__RhNiC { color: ${mistypeColor} !important; }` +
                `.darkThemeStyles_SPACE_MISTYPED__iyOcf { color: ${altMistypeColor} !important; background-color: ${misspaceBackground} !important; } ` +
                `.css-10g5w9r-pageBackground { background-color: ${pageBackground} !important; } ` +
                `.css-9detj6-consolePageBreadcrumbsContainer { background-color: ${pageBackground} !important; } ` +
                `.css-uiqvvv-statTracker { color: ${untypedColor} !important; } ` +
                `.css-pdbaiw-statTracker-savedStat { color: ${untypedColor} !important; } ` +
                `.css-1ezckq4-backLink { color: ${untypedColor} !important; } ` +
                `path { color: ${untypedColor} !important; } ` +
                `.css-jkutsy-settingsHeader { color: ${typedColor} !important; }` +
                `.css-13yn9ar-sectionHeader { color: ${typedColor} !important; } ` +
                `.css-1d8gozu-themeMenuButton { color: ${typedColor} !important; } ` +
                `.css-t57uu5-settingLabel .MuiFormControlLabel-label { color: ${typedColor} !important; } ` +
                `.css-1cb7on9-paper { background-color: ${blinkBackground} !important; } ` +
                `.css-ucvewq-charTyped { color: ${typedColor} !important; } ` +
                `.css-1qck3km-charActiveBox { color: ${untypedColor} !important; background-color: ${blinkBackground} !important; } ` +
                `.css-w8p19a-charUntyped { color: ${untypedColor} !important; } ` +
                `.css-15kta94-buttonGroup .MuiToggleButtonGroup-root .MuiToggleButton-root { background-color: ${pageBackground} !important; } ` +
                `.css-kotobf-root { background-color: ${blinkBackground} !important; } ` +
                `.css-1ln3q1d-themeSectionHeader-_headerMargin { color: ${typedColor} !important; } ` +
                `.css-iq0y6w-themeSectionHeader { color: ${typedColor} !important; } ` +
                `.css-if064g-sectionHeader { color: ${typedColor} !important; } ` +
                `.css-wlgkji-resetDefaultsButton { color: ${typedColor} !important; } `
            );
        }
        #temporaryHold = null;
        #selectedStyle = {};
        #styleElement = document.createElement("style");
        #styles = {};
    }
    // prepare additional themes. check for and apply last selected theme in localStorage.
    const styleContainer = new StyleContainer();
    // Prevents F5 keydowns from having their default action prevented.
    window.addEventListener('keydown', (event) => {
        if (event.key === 'F5') {
            event.stopImmediatePropagation();
        }
    });
    // Makes additional themes appear in the theme selector
    waitForElement(() => document.querySelector('button[aria-label="Settings"]'), (elem) => {
        elem.addEventListener('click', settingsButtonAction);
    }, 100, "Settings Button");
})();
