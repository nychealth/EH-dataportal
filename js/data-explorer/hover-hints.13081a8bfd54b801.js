// ======================================================================= //
// hover-hints.js
// ======================================================================= //

// Short hints on the data explorer buttons that open a modal, so a mouse user
// can see what a click will do before making it. Modals cover the page and take
// focus, so hover never opens them; it only says what will open. Since
// 2026-11-13 also on icon-only buttons that act in place rather than opening
// anything: the map's own controls (map.js, addMapControls), the header logo, the
// dataset details toggle and a view pane's close button.
//
// Hints show after the mouse rests on a trigger, or right away on keyboard focus,
// and hide when the pointer or focus leaves, on Escape, on scroll or resize, and
// when any modal opens. Touch and pen get no hint: pointerType must be 'mouse'.
//
// Loaded on its own after the SPA bundle. It only registers listeners and listens
// for Bootstrap's modal events, so it reads no SPA state and its position among
// the other scripts does not matter. Its top-level names all carry a hint prefix
// so they cannot collide with another file in this shared classic-script scope.


// ----------------------------------------------------------------------- //
// settings
// ----------------------------------------------------------------------- //

// Delays in milliseconds. The show delay filters out a pointer that is only
// passing over a button; the hide delay lets the pointer cross the gap from the
// trigger to the hint without the hint closing under it.

const HOVER_HINT_TIMING = {
    show: 300,
    hide: 150
};

// Modal triggers and the hint each one shows. "Opens ..." signals a pop-up rather
// than a new page; kept to a short phrase. Each entry names the modal it opens.

const HOVER_HINTS = [
    {
        // #topicSelector (header-de.html). Icon-only button, so this is the only
        // visible text it has.
        selector: '#topicSelectorButton',
        text: 'Opens topic list'
    },
    {
        // #indicatorSelector (de-indicator-info.html), desktop and mobile copies.
        selector: '.indicator-selector-trigger',
        text: 'Opens dataset list'
    },
    {
        // #learnMore (header-de.html): "About <topic>" and related resources.
        // This script loads only on topic pages (data-explorer/single.html), so
        // the modal is always about a topic here.
        selector: '[data-toggle="modal"][data-target="#learnMore"]',
        text: 'Opens topic details'
    },
    {
        // #printModal ("Save this visualization", de-print-chart-modal.html),
        // opened by print.js for the map and for each chart pane.
        selector: '.de-save-map-button, .de-save-chart-button',
        text: 'Opens save options'
    },

    // The question-mark help buttons (de-help-modals.html). Icon-only, so the hint is their
    // only visible text. One entry per modal, since several buttons open each one: the detail
    // card and the table's filters both open #geoModal and #timeModal.
    {
        selector: '.de-help-button[data-target="#measureModal"]',
        text: 'Opens help on measures'
    },
    {
        selector: '.de-help-button[data-target="#geoModal"]',
        text: 'Opens help on boundaries'
    },
    {
        selector: '.de-help-button[data-target="#timeModal"]',
        text: 'Opens help on time periods'
    },
    {
        selector: '.de-help-button[data-target="#trendModal"]',
        text: 'Opens help on trend charts'
    },
    {
        selector: '.de-help-button[data-target="#linksModal"]',
        text: 'Opens help on correlations'
    },

    // Icon-only buttons that act in place (Chris, 2026-11-13). The two collapse
    // toggles read aria-expanded, which Bootstrap's collapse keeps current, so the
    // hint says what a click will do.
    {
        // The portal logo in header-de.html. It expands #global-header: the nyc.gov
        // bar, the portal title, its menu (All topics, Search) and the language picker.
        selector: '[data-target="#global-header"]',
        text: (trigger) => (trigger.getAttribute('aria-expanded') === 'true' ? 'Hide site menu' : 'Show site menu')
    },
    {
        // The minus / plus on the dataset details card (de-indicator-info.html).
        selector: '.desktop-details-toggle, .mobile-details-toggle',
        text: (trigger) => (trigger.getAttribute('aria-expanded') === 'true' ? 'Hide dataset details' : 'Show dataset details')
    },
    {
        // The close button on an open view pane (de-tab-content.html).
        selector: '.de-close-tab-button',
        text: 'Close this view'
    },

    // The map's control stack (map.js, addMapControls; Chris, 2026-11-13), all
    // icon-only, so every one gets the same hint rather than a mix of these and the
    // browser's title tooltips. Scoped to #map so no other Leaflet map's controls match.
    // The three zoom buttons sit in a column, so a hint below one covered the next
    // (measured 2026-11-13: "Zoom in" lay over the Zoom out button); theirs open to the
    // right, over the map.
    {
        selector: '#map .leaflet-control-zoom-in',
        text: 'Zoom in',
        placement: 'right'
    },
    {
        selector: '#map .leaflet-control-zoom-out',
        text: 'Zoom out',
        placement: 'right'
    },
    {
        selector: '#map .de-map-reset',
        text: 'Reset zoom',
        placement: 'right'
    },

    // The eye toggles, so its hint is a function read when the hint opens:
    // aria-pressed is its state, and the hint says what a click will do. The slider's
    // value is shown beside it, so its hint names it only.
    {
        selector: '.de-map-fill-toggle',
        text: (trigger) => (trigger.getAttribute('aria-pressed') === 'true' ? 'Show data layer' : 'Hide data layer')
    },
    {
        selector: '#de-map-opacity-input',
        text: 'Data layer opacity'
    }
];

// True for a real mouse. Pointer events carry pointerType; touch taps also fire
// pointerover, and those must not start a hint timer.

const isHintMousePointer = (event) => event.pointerType === 'mouse';


// ----------------------------------------------------------------------- //
// hint element
// ----------------------------------------------------------------------- //

// One shared hint element, created on first use so pages at rest carry no
// extra markup. role="tooltip" plus aria-describedby on the trigger gives screen
// readers the same text.

const hoverHint = {
    element: null,
    trigger: null,
    placement: undefined,
    showTimer: null,
    hideTimer: null,
    // A trigger that was just clicked. Its modal is opening, and when the modal
    // closes Bootstrap returns focus to the trigger, which would show the hint
    // again at the moment it is least useful.
    suppressedFor: null
};

const HOVER_HINT_ID = 'deHoverHint';

// Wrappers that topic-indicator-selector.js marks when a chooser closed with nothing
// picked. They show a "Choose topic" / "Choose dataset" prompt beside the button,
// which already says what to do, and the hint drew on top of it (measured
// 2026-11-05 on a topic page with no ?id=: the two boxes overlapped). So a trigger
// inside one gets no hint until the prompt clears.

const HOVER_HINT_PROMPTED = '.topic-selector-required, .indicator-selector-required';

// Returns the hint config entry and trigger element for an element inside one. An
// entry's text may be a function of the trigger, for a control whose hint follows
// its state.

const findHintTrigger = (element) => {

    if (!element?.closest) return null;

    for (const hint of HOVER_HINTS) {
        const trigger = element.closest(hint.selector);
        if (!trigger) continue;
        if (trigger.closest(HOVER_HINT_PROMPTED)) return null;
        const text = typeof hint.text === 'function' ? hint.text(trigger) : hint.text;
        return { trigger, text, placement: hint.placement };
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
// and keeps it inside the viewport horizontally. An entry placed 'right' sits
// beside its trigger, centred on it, unless that would leave the viewport.

const positionHint = (element, trigger, placement) => {

    const gap = 6;
    const edge = 8;
    const rect = trigger.getBoundingClientRect();
    const hintRect = element.getBoundingClientRect();

    if (placement === 'right' && rect.right + gap + hintRect.width <= window.innerWidth - edge) {
        const sideTop = rect.top + (rect.height / 2) - (hintRect.height / 2);
        element.style.top = `${Math.max(edge, sideTop) + window.scrollY}px`;
        element.style.left = `${rect.right + gap + window.scrollX}px`;
        return;
    }

    let top = rect.bottom + gap;
    if (top + hintRect.height > window.innerHeight - edge) top = rect.top - gap - hintRect.height;

    let left = rect.left + (rect.width / 2) - (hintRect.width / 2);
    left = Math.max(edge, Math.min(left, window.innerWidth - hintRect.width - edge));

    element.style.top = `${Math.max(edge, top) + window.scrollY}px`;
    element.style.left = `${left + window.scrollX}px`;

};

// Shows the hint for a trigger and links the two for assistive tech.

const showHint = (trigger, text, placement) => {

    const element = ensureHintElement();

    clearTimeout(hoverHint.showTimer);
    hoverHint.showTimer = null;
    clearTimeout(hoverHint.hideTimer);

    if (hoverHint.trigger && hoverHint.trigger !== trigger) removeHintDescription(hoverHint.trigger);

    element.textContent = text;
    element.hidden = false;
    positionHint(element, trigger, placement);

    const describedBy = (trigger.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (!describedBy.includes(HOVER_HINT_ID)) {
        trigger.setAttribute('aria-describedby', [...describedBy, HOVER_HINT_ID].join(' '));
    }

    hoverHint.trigger = trigger;
    hoverHint.placement = placement;

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
    hoverHint.hideTimer = setTimeout(hideHint, HOVER_HINT_TIMING.hide);

};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// hint listeners
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// Mouse rests on a modal trigger: show its hint after a pause.

document.addEventListener('pointerover', (event) => {

    if (!isHintMousePointer(event)) return;

    const found = findHintTrigger(event.target);
    if (!found || found.trigger === hoverHint.suppressedFor) return;

    clearTimeout(hoverHint.hideTimer);

    if (found.trigger === hoverHint.trigger) return;

    clearTimeout(hoverHint.showTimer);
    hoverHint.showTimer = setTimeout(() => showHint(found.trigger, found.text, found.placement), HOVER_HINT_TIMING.show);

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

    showHint(found.trigger, found.text, found.placement);

});

document.addEventListener('focusout', (event) => {

    if (hoverHint.trigger && hoverHint.trigger.contains(event.target)) hideHint();

    // A trigger that acts in place (the map's eye) is never followed by a modal
    // closing, so without this a keyboard user who pressed it would not see its hint
    // again. While a modal is open the focus is leaving for the modal, and the
    // suppression must outlast it.

    if (hoverHint.suppressedFor?.contains(event.target) && !document.body.classList.contains('modal-open')) {
        hoverHint.suppressedFor = null;
    }

});

// Activating a trigger opens its modal, so the hint has done its job. On the map's
// eye the click changes what its hint would say, so keeping it down until the
// pointer leaves also stops a hint that has just gone stale.

document.addEventListener('click', (event) => {

    const found = findHintTrigger(event.target);
    if (!found) return;

    hoverHint.suppressedFor = found.trigger;
    hideHint();

}, true);

// Any modal opening hides the hint. Closing lifts the click suppression once
// Bootstrap has returned focus to the trigger (it does that in its own hidden
// handler on the modal, which runs before this document-level one), unless the
// pointer is still resting on the trigger: the hint would otherwise pop up the
// moment the modal closes, about a modal the user has just seen. Then the
// pointerout listener lifts it when the pointer moves off.

$(document).on('show.bs.modal', hideHint);

$(document).on('hidden.bs.modal', () => {
    setTimeout(() => {
        if (!hoverHint.suppressedFor?.matches(':hover')) hoverHint.suppressedFor = null;
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

// The hint is placed in page coordinates, so a scroll (of the page or of a pane
// the trigger sits in) can leave it behind. Move it with its trigger, and hide it
// only once the trigger has scrolled out of view. Hiding on every scroll lost the
// hint for keyboard users: focusing Learn More with Tab scrolls the page 3px, and
// that scroll hid the hint focus had just shown (measured 2026-11-05).

window.addEventListener('scroll', () => {

    const { element, trigger } = hoverHint;
    if (!trigger || !element || element.hidden) return;

    const rect = trigger.getBoundingClientRect();
    const inView = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;

    if (inView) {
        positionHint(element, trigger, hoverHint.placement);
    } else {
        hideHint();
    }

}, { passive: true, capture: true });

window.addEventListener('resize', () => {
    if (hoverHint.trigger) hideHint();
});
