// ======================================================================= //
// hover-open.js
// ======================================================================= //

// Hover behavior for the data explorer's controls, so a mouse user can see
// what a control does before clicking it. Three kinds of control, three
// behaviors:
//
//   - Dropdowns (Measure, Boundary, Time, Cite, Take Action, the pill menus)
//     open on hover and close when the pointer leaves. Clicking one that hover
//     opened keeps it open, the way a click-opened menu stays open.
//   - Sidebar tabs (Bar, Trends, Correlate, Table, Data Sources) open their
//     pane after the pointer rests on them, so sweeping across the sidebar does
//     not flash every pane open. A hover-opened pane replaces the current
//     history entry instead of adding one (app.js reads data-hover-open).
//   - Buttons that open a modal get a short hint saying what will open. Modals
//     cover the page and take focus, so hover never opens them.
//
// Only real mouse pointers trigger any of this (pointerType 'mouse'). Touch and
// pen keep tap-to-open, and keyboard users keep Bootstrap's own behavior.
//
// Loaded on its own after the SPA bundle. It only registers listeners and
// calls Bootstrap's jQuery plugins from inside them, so it reads no SPA state
// and its position among the other scripts does not matter.


// ----------------------------------------------------------------------- //
// shared settings
// ----------------------------------------------------------------------- //

// Delays in milliseconds. Open delays filter out a pointer that is only passing
// over a control; close delays let the pointer cross small gaps (toggle to menu,
// trigger to hint) without the thing closing under it.

const HOVER_OPEN_TIMING = {
    dropdownOpen: 150,
    dropdownClose: 300,
    // After any dropdown closes, ignore hover briefly. Choosing a Measure closes
    // its menu and leaves the pointer over the Boundary toggle below it, which
    // would otherwise open the next menu without the user moving.
    dropdownCooldown: 400,
    tabOpen: 500,
    hintShow: 300,
    hintHide: 150
};

// Dropdowns in the site-wide header menu keep click-only behavior: that menu is
// shared with every other page on the site and is out of scope here.

const HOVER_OPEN_EXCLUDED = '#global-header, #nav-primary';

// Fields where hover must not move focus away while someone is typing.

const HOVER_OPEN_TEXT_FIELDS = 'input, textarea, select, [contenteditable="true"]';

// Modal triggers and the hint each one shows. The text says what opens and that
// the page itself does not change, which is the worry these hints address.

const HOVER_HINTS = [
    {
        selector: '#topicSelectorButton',
        text: 'Opens a list of topics in a pop-up window. This page stays as it is until a topic is chosen.'
    },
    {
        selector: '.indicator-selector-trigger',
        text: 'Opens a list of datasets for this topic in a pop-up window. Nothing changes until a dataset is chosen.'
    },
    {
        selector: '[data-toggle="modal"][data-target="#learnMore"]',
        text: 'Opens background on this topic in a pop-up window.'
    },
    {
        selector: '.de-save-map-button, .de-save-chart-button',
        text: 'Opens save options in a pop-up window.'
    }
];

// True for a real mouse. Pointer events carry pointerType; touch taps also fire
// pointerover, and those must not start a hover timer.

const isMousePointer = (event) => event.pointerType === 'mouse';


// ----------------------------------------------------------------------- //
// dropdowns
// ----------------------------------------------------------------------- //

// The one dropdown hover is currently tracking. Only one menu is open at a time,
// so one record is enough.
//   container     - the .dropdown / .dropup wrapper (Bootstrap's "parent")
//   toggle        - its [data-toggle="dropdown"] button
//   openedByHover - hover opened it, so leaving should close it
//   pinned        - a click claimed it, so leaving no longer closes it

const hoverDropdown = {
    container: null,
    toggle: null,
    openedByHover: false,
    pinned: false,
    openTimer: null,
    closeTimer: null,
    // Set while this script itself is calling Bootstrap, so the shown/hidden
    // listeners below can tell hover's own opens and closes from a user's.
    openingByHover: false,
    closingByHover: false,
    lastClosedAt: 0
};

// Finds the dropdown wrapper and its toggle for any element inside one. Returns
// null for disabled toggles (measures.js removes data-toggle from a disabled
// Measures pill, so the toggle lookup fails for it too) and for the site header.

const findHoverDropdown = (element) => {

    const container = element?.closest?.('.dropdown, .dropup, .dropright, .dropleft');
    if (!container || container.closest(HOVER_OPEN_EXCLUDED)) return null;

    const toggle = container.querySelector(':scope > [data-toggle="dropdown"]');
    if (!toggle || toggle.disabled || toggle.classList.contains('disabled')) return null;

    return { container, toggle };
};

// True when the dropdown's menu is showing.

const isDropdownOpen = (container) => container.classList.contains('show');

// Stops any pending open or close.

const clearDropdownTimers = () => {

    clearTimeout(hoverDropdown.openTimer);
    clearTimeout(hoverDropdown.closeTimer);
    hoverDropdown.openTimer = null;
    hoverDropdown.closeTimer = null;

};

// Opens a dropdown on behalf of hover.

const openDropdownByHover = (container, toggle) => {

    if (isDropdownOpen(container)) return;

    // Bootstrap's 'toggle' closes any other open menu and positions this one with
    // Popper, the same path a click takes. Its show() also focuses the toggle;
    // when someone is typing in a field, focus goes back so the typing continues.

    const previousFocus = document.activeElement;

    hoverDropdown.container = container;
    hoverDropdown.toggle = toggle;
    hoverDropdown.openedByHover = true;
    hoverDropdown.pinned = false;

    hoverDropdown.openingByHover = true;

    try {
        $(toggle).dropdown('toggle');
    } finally {
        hoverDropdown.openingByHover = false;
    }

    if (previousFocus && previousFocus !== toggle && previousFocus.matches?.(HOVER_OPEN_TEXT_FIELDS)) {
        previousFocus.focus({ preventScroll: true });
    }

};

// Closes the tracked dropdown if hover opened it and no click has claimed it.

const closeDropdownByHover = () => {

    const { container, toggle, openedByHover, pinned } = hoverDropdown;

    if (!container || !openedByHover || pinned || !isDropdownOpen(container)) return;

    hoverDropdown.closingByHover = true;

    try {
        $(toggle).dropdown('hide');
    } finally {
        hoverDropdown.closingByHover = false;
    }

};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// dropdown listeners
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// Pointer enters a dropdown (toggle or menu): cancel a pending close, or start
// the open timer.

document.addEventListener('pointerover', (event) => {

    if (!isMousePointer(event)) return;

    const found = findHoverDropdown(event.target);
    if (!found) return;

    const { container, toggle } = found;

    // Same dropdown as before: moving between the toggle and its menu (cancel any
    // pending close), or between children of a toggle still waiting to open.

    if (container === hoverDropdown.container) {
        if (isDropdownOpen(container)) {
            clearDropdownTimers();
            return;
        }
        if (hoverDropdown.openTimer) return;
    }

    if (isDropdownOpen(container)) return;

    // Leave a menu someone clicked open alone; hovering past another dropdown
    // must not swap it out.

    const current = hoverDropdown.container;
    if (current && hoverDropdown.pinned && isDropdownOpen(current)) return;

    if (Date.now() - hoverDropdown.lastClosedAt < HOVER_OPEN_TIMING.dropdownCooldown) return;

    // Moving straight from one hover-opened menu to another closes the first
    // now, so it cannot be left open if the second never opens.

    closeDropdownByHover();
    clearDropdownTimers();

    hoverDropdown.container = container;
    hoverDropdown.toggle = toggle;

    hoverDropdown.openTimer = setTimeout(() => {
        hoverDropdown.openTimer = null;
        openDropdownByHover(container, toggle);
    }, HOVER_OPEN_TIMING.dropdownOpen);

});

// Pointer leaves the dropdown entirely: cancel a pending open, and schedule a
// close if hover opened it.

document.addEventListener('pointerout', (event) => {

    if (!isMousePointer(event)) return;

    const { container } = hoverDropdown;
    if (!container || !container.contains(event.target)) return;

    // pointerout also fires when moving between children; only a move out of the
    // container counts as leaving.

    if (event.relatedTarget && container.contains(event.relatedTarget)) return;

    clearTimeout(hoverDropdown.openTimer);
    hoverDropdown.openTimer = null;

    if (hoverDropdown.openedByHover && !hoverDropdown.pinned) {
        clearTimeout(hoverDropdown.closeTimer);
        hoverDropdown.closeTimer = setTimeout(closeDropdownByHover, HOVER_OPEN_TIMING.dropdownClose);
    }

});

// A click on a hover-opened dropdown pins it open. Runs in the capture phase so
// it sees the click before Bootstrap's document-level toggle handler and before
// global.js stops Cite-menu clicks from bubbling.

document.addEventListener('click', (event) => {

    const { container, toggle, openedByHover, pinned } = hoverDropdown;

    if (!container || !openedByHover || pinned || !isDropdownOpen(container)) return;
    if (!container.contains(event.target)) return;

    hoverDropdown.pinned = true;
    clearDropdownTimers();

    // Without this, the click on the toggle would close the menu hover just
    // opened, the opposite of what the click meant. Clicks inside the menu go
    // through untouched so menu items still work.

    if (toggle.contains(event.target)) {
        event.preventDefault();
        event.stopPropagation();
    }

}, true);

// Keep the record in step with Bootstrap. A menu opened by click or keyboard is
// pinned from the start; any close resets the record and starts the cooldown.

$(document).on('shown.bs.dropdown', (event) => {

    if (hoverDropdown.openingByHover) return;

    const found = findHoverDropdown(event.target);

    // The site header's menus are not tracked at all.

    if (!found) return;

    clearDropdownTimers();
    hoverDropdown.container = found.container;
    hoverDropdown.toggle = found.toggle;
    hoverDropdown.openedByHover = false;
    hoverDropdown.pinned = true;

});

$(document).on('hidden.bs.dropdown', (event) => {

    if (event.target !== hoverDropdown.container) return;

    // The cooldown is for menus a click closed (a choice was made, and the
    // pointer may now sit over the next toggle). A menu hover closed because
    // the pointer left needs none, or moving from one toggle to the next would
    // stall.

    if (!hoverDropdown.closingByHover) hoverDropdown.lastClosedAt = Date.now();

    clearDropdownTimers();
    hoverDropdown.container = null;
    hoverDropdown.toggle = null;
    hoverDropdown.openedByHover = false;
    hoverDropdown.pinned = false;

});


// ----------------------------------------------------------------------- //
// sidebar tabs
// ----------------------------------------------------------------------- //

// The tab waiting to open, and its timer.

const hoverTab = {
    tab: null,
    timer: null
};

// Returns the sidebar tab for an element inside one, or null.

const findHoverTab = (element) => element?.closest?.('#v-pills-tab .nav-link[data-toggle="pill"]') || null;

// Cancels a pending tab open.

const cancelHoverTab = () => {

    clearTimeout(hoverTab.timer);
    hoverTab.tab = null;
    hoverTab.timer = null;

};

// Opens a tab's pane by clicking it, so every existing click handler (overlay
// state, pane container, open-panel class, analytics) runs exactly as for a
// real click. data-hover-open tells app.js to replace the history entry rather
// than add one, so hovering does not fill the Back button.

const openTabByHover = (tab) => {

    // A tab whose pane is already showing is skipped: de-tab-content.js closes
    // the pane when its active tab is clicked, and hover must never close one.

    const pane = document.querySelector(tab.getAttribute('href'));
    if (tab.classList.contains('active') && pane?.classList.contains('show')) return;

    if (tab.classList.contains('disabled')) return;

    // Don't open a pane behind an open modal.

    if (document.body.classList.contains('modal-open')) return;

    tab.dataset.hoverOpen = 'true';

    try {
        tab.click();
    } finally {
        delete tab.dataset.hoverOpen;
    }

};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// tab listeners
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// Pointer rests on a tab: start (or keep) its timer.

document.addEventListener('pointerover', (event) => {

    if (!isMousePointer(event)) return;

    const tab = findHoverTab(event.target);
    if (!tab || tab === hoverTab.tab) return;

    cancelHoverTab();
    hoverTab.tab = tab;

    hoverTab.timer = setTimeout(() => {
        hoverTab.timer = null;
        hoverTab.tab = null;
        openTabByHover(tab);
    }, HOVER_OPEN_TIMING.tabOpen);

});

// Pointer leaves the tab before the pause is up: cancel.

document.addEventListener('pointerout', (event) => {

    if (!hoverTab.tab || !hoverTab.tab.contains(event.target)) return;
    if (event.relatedTarget && hoverTab.tab.contains(event.relatedTarget)) return;

    cancelHoverTab();

});

// A press on the tab means the click handles it; a pending hover open would
// then land on an already-open pane, or toggle it shut.

document.addEventListener('pointerdown', (event) => {

    if (hoverTab.tab && hoverTab.tab.contains(event.target)) cancelHoverTab();

}, true);


// ----------------------------------------------------------------------- //
// modal hints
// ----------------------------------------------------------------------- //

// One shared hint element, created on first use so pages at rest carry no
// extra markup. role="tooltip" plus aria-describedby on the trigger gives screen
// readers the same text.

const hoverHint = {
    element: null,
    trigger: null,
    showTimer: null,
    hideTimer: null,
    // A trigger that was just clicked. Its modal is opening, and when the modal
    // closes Bootstrap returns focus to the trigger, which would show the hint
    // again at the moment it is least useful.
    suppressedFor: null
};

const HOVER_HINT_ID = 'deHoverHint';

// Returns the hint config entry and trigger element for an element inside one.

const findHintTrigger = (element) => {

    if (!element?.closest) return null;

    for (const hint of HOVER_HINTS) {
        const trigger = element.closest(hint.selector);
        if (trigger && !trigger.closest(HOVER_OPEN_EXCLUDED)) return { trigger, text: hint.text };
    }

    return null;
};

// Builds the hint element once. Pointer events stay on so the pointer can move
// onto the hint (to read it) without it disappearing, as WCAG 1.4.13 asks.

const ensureHintElement = () => {

    if (hoverHint.element) return hoverHint.element;

    const element = document.createElement('div');
    element.id = HOVER_HINT_ID;
    element.className = 'de-hover-hint';
    element.setAttribute('role', 'tooltip');
    element.hidden = true;

    element.addEventListener('pointerenter', () => clearTimeout(hoverHint.hideTimer));
    element.addEventListener('pointerleave', () => scheduleHintHide());

    document.body.appendChild(element);
    hoverHint.element = element;

    return element;
};

// Places the hint below the trigger, or above it when there is no room below,
// and keeps it inside the viewport horizontally.

const positionHint = (element, trigger) => {

    const gap = 6;
    const edge = 8;
    const rect = trigger.getBoundingClientRect();
    const hintRect = element.getBoundingClientRect();

    let top = rect.bottom + gap;
    if (top + hintRect.height > window.innerHeight - edge) top = rect.top - gap - hintRect.height;

    let left = rect.left + (rect.width / 2) - (hintRect.width / 2);
    left = Math.max(edge, Math.min(left, window.innerWidth - hintRect.width - edge));

    element.style.top = `${Math.max(edge, top) + window.scrollY}px`;
    element.style.left = `${left + window.scrollX}px`;

};

// Shows the hint for a trigger and links the two for assistive tech.

const showHint = (trigger, text) => {

    const element = ensureHintElement();

    clearTimeout(hoverHint.hideTimer);

    if (hoverHint.trigger && hoverHint.trigger !== trigger) removeHintDescription(hoverHint.trigger);

    element.textContent = text;
    element.hidden = false;
    positionHint(element, trigger);

    const describedBy = (trigger.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (!describedBy.includes(HOVER_HINT_ID)) {
        trigger.setAttribute('aria-describedby', [...describedBy, HOVER_HINT_ID].join(' '));
    }

    hoverHint.trigger = trigger;

};

// Removes this script's id from a trigger's aria-describedby, leaving any others.

const removeHintDescription = (trigger) => {

    const remaining = (trigger.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter(id => id && id !== HOVER_HINT_ID);

    if (remaining.length) {
        trigger.setAttribute('aria-describedby', remaining.join(' '));
    } else {
        trigger.removeAttribute('aria-describedby');
    }
};

// Hides the hint now.

const hideHint = () => {

    clearTimeout(hoverHint.showTimer);
    clearTimeout(hoverHint.hideTimer);
    hoverHint.showTimer = null;

    if (hoverHint.element) hoverHint.element.hidden = true;
    if (hoverHint.trigger) removeHintDescription(hoverHint.trigger);

    hoverHint.trigger = null;

};

// Hides the hint after a short grace period, so the pointer can reach it.

const scheduleHintHide = () => {

    clearTimeout(hoverHint.showTimer);
    clearTimeout(hoverHint.hideTimer);
    hoverHint.hideTimer = setTimeout(hideHint, HOVER_OPEN_TIMING.hintHide);

};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// hint listeners
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// Mouse rests on a modal trigger: show its hint after a pause.

document.addEventListener('pointerover', (event) => {

    if (!isMousePointer(event)) return;

    const found = findHintTrigger(event.target);
    if (!found || found.trigger === hoverHint.suppressedFor) return;

    clearTimeout(hoverHint.hideTimer);

    if (found.trigger === hoverHint.trigger) return;

    clearTimeout(hoverHint.showTimer);
    hoverHint.showTimer = setTimeout(() => showHint(found.trigger, found.text), HOVER_OPEN_TIMING.hintShow);

});

// Mouse leaves a trigger: hide, unless it moved onto the hint itself.

document.addEventListener('pointerout', (event) => {

    const found = findHintTrigger(event.target);
    if (!found) return;
    if (event.relatedTarget && found.trigger.contains(event.relatedTarget)) return;

    // A modal's backdrop lands under the pointer when the modal opens; that is
    // not the user leaving, so the suppression stays until the modal closes.

    if (found.trigger === hoverHint.suppressedFor && !document.body.classList.contains('modal-open')) {
        hoverHint.suppressedFor = null;
    }

    scheduleHintHide();

});

// Keyboard focus on a trigger shows the hint right away. :focus-visible limits
// this to keyboard focus, so a mouse click does not also raise it.

document.addEventListener('focusin', (event) => {

    const found = findHintTrigger(event.target);
    if (!found || found.trigger === hoverHint.suppressedFor) return;
    if (!found.trigger.matches(':focus-visible')) return;

    showHint(found.trigger, found.text);

});

document.addEventListener('focusout', (event) => {

    if (hoverHint.trigger && hoverHint.trigger.contains(event.target)) hideHint();

});

// Activating a trigger opens its modal, so the hint has done its job.

document.addEventListener('click', (event) => {

    const found = findHintTrigger(event.target);
    if (!found) return;

    hoverHint.suppressedFor = found.trigger;
    hideHint();

}, true);

// Any modal opening hides the hint; closing lifts the click suppression once
// Bootstrap has returned focus to the trigger (it does that in its own hidden
// handler on the modal, which runs before this document-level one).

$(document).on('show.bs.modal', hideHint);

$(document).on('hidden.bs.modal', () => {
    setTimeout(() => {
        hoverHint.suppressedFor = null;
    }, 0);
});

// Escape dismisses a visible hint without moving the pointer or focus (WCAG
// 1.4.13). Capture phase, and the key is consumed only when a hint was showing,
// so de-tab-content.js does not also close the open pane on the same press.

window.addEventListener('keydown', (event) => {

    if (event.key !== 'Escape' || !hoverHint.element || hoverHint.element.hidden) return;

    hideHint();
    event.preventDefault();

}, true);

// The hint is positioned once when shown; hide it rather than leave it behind
// when the page moves under it.

window.addEventListener('scroll', () => {
    if (hoverHint.trigger) hideHint();
}, { passive: true, capture: true });

window.addEventListener('resize', () => {
    if (hoverHint.trigger) hideHint();
});
