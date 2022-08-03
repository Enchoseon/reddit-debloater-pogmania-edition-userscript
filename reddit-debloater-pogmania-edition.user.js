// ==UserScript==
// @name        Reddit Debloater (Pogmania Edition)
// @namespace   https://github.com/Enchoseon/reddit-debloater-pogmania-edition-userscript/raw/main/reddit-debloater-pogmania-edition.user.js
// @version     0.1.3
// @description Debloat the Reddit redesign. Remove NFTs, RPAN, and more. Incredibly experimental, buggy, and slow!
// @author      Enchoseon
// @match       https://www.reddit.com/*
// @run-at      document-start
// @grant       GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    // ==================
    // User Configuration
    // ==================
    const config = {
        remove: { // Remove elements from the page ...
            header: { // ... in the header ...
                createAvatar: true, // ... to create an avatar
                getCoins: true, // ... to buy coins
                createAd: true, // ... to create an ad campaign
                RPAN: true, // ... to go to RPAN
                premium: true, // ... to purchase premium
                talk: true // ... to "Talks"
            },
            sidebar: { // ... in the sidebar ...
                topCommunities: true // ... to visit "Top Communities"
            }
        },

        block: { // Block JavaScript and disable features for...
            RPAN: true, // ... RPAN
            nativeAds: true, // ... Native Ads
            awardTooltip: true, // ... Award Tooltips
            webvitals: true, // ... Webvitals
            frontpageLinks: true, // ... Frontpage Links
        },

        modify: { // Modify Reddit features
            restrictScrollEvents: { // Port of "Restrict Scroll Events" from Reddit Enhancement Suite (https://github.com/honestbleeps/Reddit-Enhancement-Suite/blob/master/lib/modules/betteReddit.js)
                enabled: true,
                delay: 196, // Time (in ms) events should be throttled
            },
        },

        settings: { // Settings specific to Pogmania
            moreChecks: true, // Sacrifice even more performance to catch and remove more elements that dynamically regenerate
            alwaysFocused: true, // Copy of https://github.com/daijro/always-on-focus (related: https://files.catbox.moe/2wn2oc.png)
            isChildLimit: 10, // The maximum number of parentNodes that will be checked when isChild is ran. Turning this down breaks things, turning it up loses performance... :p
        },

        debug: { // Settings for debugging things (and powerusers!)
            log: true, // Log things to the console
            killRedditLogs: true, // Remove the page's ability to use console.log (almost never useful)
            coolFunctions: true, // Aforementioned Poweruser features. Expose some cool functions to unsafeWindow so that you can use them in the developer console (e.g. copy all post links on page (useful for feeding links to Hydrus!))
            highlight: false, // Whether to highlight mutation-observed elements in keyElems
            search: "" // String to search for in observed elements in keyElems and in served JavaScript
        }
    };
    // ===========
    // Global Vars
    // ===========
    const keyElems = { // Selectors for key elems that get used a lot. Mutation observers get attached to these elements to intercept their children.
        headerTooltip: "header div#change-username-tooltip-id", // header tooltip
        userDropdown: `[role=menu][style*="position: fixed; left: "][tabindex="-1"]`, // user dropdown modal
        headerDropdown: "header div[role=menu]", // dropdown menu to the left of the search bar
        frontpageSidebar: "div[data-testid=frontpage-sidebar]", // frontpage right sidebar
        frontpageSidebarSection: `div[data-redditstyle=true] div[style*="max-height:none"]`, // section of frontpage right sidebar
        frontpageSidebarSectionRegen: `div[data-redditstyle=true] div[style*="max-height: none"]`, // section of frontpage right sidebar
    }
    var block = { // Things marked for removal are stored here
        js: [], // Array of JavaScript files to block
        remove: [] // Array of objects describing elements to remove
    };
    // ===============
    // Remove Elements
    // ===============
    /*
     * Some Notes on Selectors:
     * - Selectors should balance human-readablity (no gibberish webpacked names!) with reasonable preciseness
     * - ^ More-specific selectors will reduce the # of times querySelector is ran
     * - ^ See comments above function removeElem for more info
     * - This is so goddamn inefficient (I've forgotten how it works tbh), it would be appropriate to label this as bloat. However, it does debloat the UI, which is so atrocious that it's worth the performance hit :D
     * - parentElems can be no more than 10 levels (config.settings.isChildLimit) above respective target elems
     */
    if (config.remove.header.createAvatar) { // Remove buttons in the header to create an avatar
        removeElem("button", keyElems.headerTooltip, "Shop Avatars");
        removeElem("button", keyElems.userDropdown, "Create Avatar", true);
        removeElem("a#focus-Avatar", keyElems.headerDropdown, "icon icon-avatar");
    }
    if (config.remove.header.getCoins) { // Remove buttons in the header to buy coins
        removeElem("button#COIN_PURCHASE_DROPDOWN_ID", keyElems.headerTooltip, "icon icon-coins");
        removeElem(`a[href="/coins"]`, keyElems.userDropdown, "icon icon-coins", true)
        removeElem("a#focus-Coins", keyElems.headerDropdown, "icon icon-coins");
    }
    if (config.remove.header.createAd) { // Remove buttons in the header to create an ad campaign
        removeElem("span", keyElems.headerTooltip, "icon icon-campaign");
        removeElem("a", keyElems.headerTooltip, "icon icon-campaign"); // ... ^ (clean up leftover icon)
        removeElem(`a[href*="https://ads.reddit.com"]`, keyElems.userDropdown, "icon icon-campaign", true);
    }
    if (config.remove.header.RPAN) { // Remove buttons in the header to go to RPAN
        removeElem(`a[href="/rpan/"]`, "header", "icon icon-video_live");
        removeElem("button#focus-PublicAccessNetwork", keyElems.headerDropdown, "icon icon-video_live");
    }
    if (config.remove.header.premium) { // Remove buttons in the header to purchase premium
        removeElem(`a[href="/premium"]`, keyElems.userDropdown, "icon icon-premium", true);
        removeElem("a#focus-Premium", keyElems.headerDropdown, "icon icon-premium");
    }
    if (config.remove.header.talk) { // Remove buttons in the header to Talks (note: Just learned that this is a setting you can disable :O (rewrite))
        removeElem(`a[href="/talk"]`, keyElems.userDropdown, "icon icon-live", true);
        removeElem("a#focus-Talk", keyElems.headerDropdown, "icon icon-live");
        removeElem("div > div", "div[aria-label=carousel]", `id="talk__t3_`, false, 2); // ... talk carousel at top of frontpage
        removeElem(`div > button[aria-label="previous items"]`, "div[aria-label=carousel]", `icon-caret_left`, false, 3); // ^
        removeElem("div > div", "div[aria-label=carousel]", `id="talk__t3_`, true, 3); // ^
    }
    if (config.remove.sidebar.topCommunities) { // Remove section in the sidebar advertising "Top X Communities"
        removeElem(keyElems.frontpageSidebarSection + ` h2 > a[href="/subreddits/leaderboard/"]`, keyElems.frontpageSidebar, "Top", false, 4);
        removeElem(keyElems.frontpageSidebarSectionRegen + ` h2 > a[href="/subreddits/leaderboard/"]`, keyElems.frontpageSidebar, "Top", false, 4);
    }
    // ================
    // Block JavaScript
    // ================
    if (config.block.RPAN) { // Block RPAN
        block.js.push("LiveVideoPlayer~PublicAccessNetwork~RpanListingUnit");
        if (window.location.pathname.startsWith("/rpan/")) { // Redirect to homepage if you attempt to visit an RPAN page to prevent getting stuck infinitely refreshing
            window.location === "https://www.reddit.com/";
        }
    }
    if (config.block.nativeAds) { // Block Native Ads
        block.js.push([
            "reddit-components-SidebarNativeAd",
            "CommentsPageNativeAd",
            "xads"
        ]);
    }
    if (config.block.awardTooltip) { // Block award tooltip
        block.js.push("AwardTooltip");
    }
    if (config.block.webvitals) { // Block web vitals
        block.js.push("webvitals");
    }
    if (config.block.frontpageLinks) { // Block frontpageLinks
        block.js.push("FrontpageLinks");
    }
    // ====================
    // Modify Functionality
    // ====================
    if (config.modify.restrictScrollEvents.enabled) {
        let throttledScroll, lastEvent;
        window.addEventListener("scroll", e => {
            if (!throttledScroll) {
                throttledScroll = throttle(e => window.dispatchEvent(e), config.modify.restrictScrollEvents.delay);
            }
            if (e === lastEvent) {
                return;
            }
            lastEvent = e;
            throttledScroll(e);
            e.stopImmediatePropagation();
        }, true);
    }
    // ============
    // Filter Posts
    // ============
    /*
     * Long-Term Goal: Filter Posts
     * - Iterating: Loop document.querySelector("[data-testid=post-container]"); with :not some added attribute
     * - We need to parse post title, subreddit, and user so that we can filter by all of them
     * - ^ We also need to parse states like "crossposting", and the variety of way posts get recommended (note on recommended posts: https://www.reddit.com/settings/feed)
     * - ^ Integration with https://www.karmalb.com/ to streamline removal of low-quality content (pandering to a "peak Reddit" audience, reposters, etc.)
     * - ^ In my experience, removing posts by the top 100 users with highest link karma drastically changed my Reddit experience to be a lot more user-centric and devoid of pandering even while subscribed to large subreddits. (Use https://www.karmalb.com/)
     * -   ^ Of course, removing large subreddits is still the best way to remove a lot of brain-rotting inflammatory bait. This resource seems promising: https://subredditstats.com/
     * - Need to find out where we can filter posts (e.g. r/all, popular, Home, subreddits, etc.) and different formats.
     * - Feature: Store list of "seen" posts and automatically remove them
     */
    // =========
    // Functions
    // =========
    /**
     * Mark elements for removal. (At least one element selected by selectorStr or parentSelectorStr must be dynamically created to be caught by the mutation observer)
     * @selectorStr {string} Selector string that represents the element to be removed
     * @parentSelectorStr {string} Selector string that represents the parent of the element to be removed
     * @filterStr {string} String that the selected element must contain
     * @onlyHideBool {boolean} If true, the element won't be removed, only hidden. Use sparingly and ONLY for edge-cases where removing the element would break something.
     * @removeParentsInt {integer} Int that moves changes the element to be removed to the nth parent (occurs after all of the filtering). Easy to create loopholes on dynamically-created elements, use caution.
     */
    function removeElem(selectorStr, parentSelectorStr, filterStr, onlyHideBool, removeParentsInt) {
        block.remove.push({
            "selector": selectorStr,
            "parentSelector": parentSelectorStr,
            "filter": filterStr,
            "onlyHide": onlyHideBool || false,
            "removeParents": removeParentsInt || 0
        });
    }
    /**
     * Returns whether elem is child of parentElem (https://stackoverflow.com/a/38504572)
     * @elem {object} Selector string that represents the element to be removed
     * @parentElem {object} Selector string that represents the parent of the element to be removed
     */
    function isChild(elem, parentElem) {
        var limit = config.settings.isChildLimit;
        while (elem != undefined && elem != null && elem.tagName.toUpperCase() != "BODY" && limit > 0){
            if (elem == parentElem) {
                return true;
            }
            elem = elem.parentNode;
            limit--;
        }
        return false;
    }
    /**
     * Remove a given element from the DOM if it matches any conditions specified in block.remove. Probably buggy and not very performant. Just keep your selectors specific I guess.
     * @elem {object} Element to check against block.remove
     */
    function interceptElem(elem) {
        block.remove.every((check) => {
            if (elem.matches(check.selector)) { // CASE 1: Mutation observed elem is the one specified in check.selector
                if (isChild(elem, document.querySelector(check.parentSelector)) && elem.outerHTML.includes(check.filter)) { // 1) Check if elem is child of parentSelector 2) Check if elem contains filter
                    remove(elem);
                    return false;
                }
            } else if (elem.matches(check.parentSelector)) { // CASE 2: Mutation observed elem is the one specified in check.parentSelector
                elem.querySelectorAll(check.selector).forEach((derived) => { // Derive possible children
                    if (derived && derived.outerHTML.includes(check.filter)) { // 1) Check if check.selector is child 2) Check if check.selector contains filter
                        remove(derived);
                        return false;
                    }
                });
            }
            return true;
            // Remove elem
            function remove(elem) {
                // Change selection to the nth parent
                if (check.removeParents > 0) {
                    while (check.removeParents > 0) {
                        elem = elem.parentNode;
                        check.removeParents--;
                    }
                }
                // Log to console
                if (config.debug.log) {
                    console.log("Removing Intercepted Elem: " + check.filter);
                    console.log(elem);
                }
                // Remove elem
                if (!check.onlyHide) {
                    elem.remove();
                } else { // ... or hide it
                    elem.style.display = "none";
                }
            }
        });
        // Debug search
        if (config.debug.log && config.debug.search.length > 1) {
            if (elem.outerHTML.includes(config.debug.search)) {
                console.log("DEBUG SEARCH FOUND (DOMNODE): " + config.debug);
                console.log(elem);
            }
        }
    }
    /**
     * Throttle a function (https://codeforgeek.com/throttle-function-javascript/)
     * @fn {function} Function to be throttled
     * @delay {integer} Time (in milliseconds) to throttle
     */
    const throttle = (fn, delay) => {
        let lastCalled = 0;
        return (...args) => {
            let now = new Date().getTime();
            if(now - lastCalled < delay) {
                return;
            }
            lastCalled = now;
            return fn(...args);
        }
    }
    // ============
    // Interceptors
    // ============
    /** Inefficiently catch and remove elements that weren't noticed by the mutation observer */
    function laggyCatch() {
        if (config.debug.log) {
            console.log("Ran laggy catch");
        }
        block.remove.forEach((check) => {
            document.querySelectorAll(check.parentSelector).forEach((parentElem) => {
                parentElem.querySelectorAll(check.selector).forEach((elem) => {
                    interceptElem(elem);
                });
            });
        });
    }
    const laggyCatchThrottle = throttle(laggyCatch, 196); // Throttled version of laggyCatch
    window.addEventListener("DOMContentLoaded", laggyCatch);
    window.addEventListener("load", laggyCatch);
    window.addEventListener("onfocus", laggyCatchThrottle);
    // Intercept elements being added to keyElems with MutationObserver
    Object.values(keyElems).forEach((selector) => {
        createObserver(document.querySelector(selector), function(node) {
            // Add attribute for easy debugging
            node.setAttribute("pogmania", "true");
            // Process elem for removal
            interceptElem(node);
            // Additional checks
            if (config.settings.moreChecks) {
                laggyCatchThrottle();
            }
        });
    });
    // Intercept ALL elements being added to DOM with MutationObserver (even worse performance)
    /*
    if (config.settings.moreChecks) {
        createObserver(document.body, function(node) {
            laggyCatchThrottle();
        });
    }
    */
    // Create observer
    function createObserver(targetElem, callbackFunc) {
        let observer = new MutationObserver(mutations => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        callbackFunc(node);
                    }
                });
            });
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    // Block JavaScript
    window.addEventListener("beforescriptexecute", function(e) {
        const src = e.target.src;
        if (src.startsWith("https://www.redditstatic.com/desktop2x/") && src.endsWith(".js")) { // Only block Javascript from Redditstatic.com
            block.js.forEach((url) => {
                if (src.includes(url)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                if (config.debug.log && config.debug.search.length > 1) {
                    GM_xmlhttpRequest({ // Request JavaScript if debug search is enabled
                        method: "GET",
                        url: e.target.src,
                        onload: function(response) {
                            if (response.responseText.includes(config.debug.search)) {
                                console.log("DEBUG SEARCH FOUND (SCRIPT): " + config.debug.search);
                                console.log(src);
                            }
                        }
                    });
                }
            });
        }
    });
    // Always focused (copy of https://github.com/daijro/always-on-focus)
    if (config.settings.alwaysFocused) {
        unsafeWindow.onblur = null;
        unsafeWindow.blurred = false;
        unsafeWindow.document.hasFocus = function () {return true;};
        unsafeWindow.window.onFocus = function () {return true;};
        Object.defineProperty(document, "hidden", { value : false});
        Object.defineProperty(document, "mozHidden", { value : false});
        Object.defineProperty(document, "msHidden", { value : false});
        Object.defineProperty(document, "webkitHidden", { value : false});
        Object.defineProperty(document, 'visibilityState', { get: function () { return "visible"; } });
        unsafeWindow.document.onvisibilitychange = undefined;
        for (const event_name of ["visibilitychange", "webkitvisibilitychange", "blur", "mozvisibilitychange", "msvisibilitychange"]) {
            window.addEventListener(event_name, function (event) {
                if (event.type === "blur" && event.target instanceof HTMLInputElement) {
                    return;
                }
                event.stopImmediatePropagation();
            }, true);
        }
    }
    // =====
    // Debug
    // =====
    if (config.debug.highlight) { // Apply highlight on dynamically-created elements picked up by keyElem mutation observers
        const css = `
        [pogmania = "true"]  {
            background: pink !important;
            background-color: pink !important;
        }
        `;
        var s = document.createElement("style"); // Create <style>
        s.setAttribute("type", "text/css");
        s.appendChild(document.createTextNode(css));
        document.querySelector("head").appendChild(s); // Inject into <head>
    }
    if (config.debug.coolFunctions) { // Expose some cool functions to unsafeWindow so that you can use them in the developer console
        /** Return list URLs of displayed posts */
        unsafeWindow.getPostUrls = function() {
            var output = "";
            document.querySelectorAll(`a[data-click-id="body"]`).forEach((node) => {
                const url = node.href;
                if (url && url.startsWith("https://www.reddit.com/r/")) { // Make sure the URL exists and is actually linking a post
                    output += node.href + "\n";
                }
            });
            return output;
        }
        /**
         * Return array of filtered dynamic elements (caught by mutation observer)
         * @selectorStr {string} Selector string for elements to target
         * @filterStr {string} String that the selected element must contain
         */
        unsafeWindow.getDynamicElems = function(selectorStr, filterStr) {
            var output = [];
            if (!filterStr) {
                filterStr= "";
            }
            document.querySelectorAll("[pogmania=true]").forEach((elem) => {
                if (elem.matches(selectorStr) && elem.outerHTML.includes(filterStr)) {
                    output.push(elem);
                }
            });
            return output;
        }
    }
})();
