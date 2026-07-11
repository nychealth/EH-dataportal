// ======================================================================= //
// de-tab-content.js
// ======================================================================= //

// UI behavior for the data-explorer tab panes (de-tab-content.html): tab
// toggle-off, close buttons, Escape-to-close, mobile accordion, and the
// has-open-panel state class. NOT part of the synchronous SPA bundle
// (global.js … print.js); it's loaded on its own from de-tab-content.html and
// only touches SPA globals (updateChartPlotSize, pushSelectionToURL, DE.state.overlay)
// from inside deferred handlers, guarded so load order never matters.

// ----------------------------------------------------------------------- //
// tab toggle-off
// ----------------------------------------------------------------------- //

// Clicking an already-active tab closes its pane and records the closed state.
document.addEventListener('DOMContentLoaded', function() {
    const tabLinks = document.querySelectorAll('.nav-link[data-toggle="pill"]');

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetPane = document.querySelector(targetId);

            if (typeof updateChartPlotSize === 'function') {
                updateChartPlotSize();
            }

            // Check if this tab is already active
            if (this.classList.contains('active') && targetPane.classList.contains('show')) {
                e.preventDefault();
                e.stopImmediatePropagation();

                // Remove active state from this tab
                this.classList.remove('active');
                this.setAttribute('aria-selected', 'false');

                // Hide the tab pane
                targetPane.classList.remove('show', 'active');

                // Hide the tab content container
                const tabContent = document.querySelector('#v-pills-tabContent');
                if (tabContent) {
                    tabContent.style.display = 'none';
                }

                // Persist the closed state in the URL
                DE.state.overlay = 'none';
                if (typeof pushSelectionToURL === 'function') pushSelectionToURL();
            }
        });
    });

    // Add a separate listener to ensure container is visible when clicking any tab

    document.addEventListener('click', function(e) {
        if (e.target.closest('.nav-link[data-toggle="pill"]')) {
            const tabContent = document.querySelector('#v-pills-tabContent');
            if (tabContent && tabContent.style.display === 'none') {
                tabContent.style.display = 'block';
            }

            // Smooth scroll to top of viewport
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    });
});


// ----------------------------------------------------------------------- //
// close buttons and Escape-to-close
// ----------------------------------------------------------------------- //

// Close buttons carry their target pane in markup so the script can
// bind once here without relying on inline handlers.
const closeExplorerTabPane = (paneId) => {
    const targetPane = document.querySelector('#' + paneId);
    const targetTab = document.querySelector('[href="#' + paneId + '"]');

    if (targetPane && targetTab) {
        // Remove active state from the tab
        targetTab.classList.remove('active');
        targetTab.setAttribute('aria-selected', 'false');

        // Hide the tab pane
        targetPane.classList.remove('show', 'active');

        // Hide the tab content container
        const tabContent = document.querySelector('#v-pills-tabContent');
        if (tabContent) {
            tabContent.style.display = 'none';
        }

        // Persist the closed state in the URL
        DE.state.overlay = 'none';
        if (typeof pushSelectionToURL === 'function') pushSelectionToURL();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const closeTabPaneButtons = document.querySelectorAll('.de-close-tab-button[data-pane-id]');

    closeTabPaneButtons.forEach(button => {
        button.addEventListener('click', function() {
            const paneId = this.dataset.paneId;

            if (paneId) {
                closeExplorerTabPane(paneId);
            }
        });
    });

    // close tab pane with Escape key

    document.addEventListener('keydown', function(event) {
        if (event.key !== 'Escape') {
            return;
        }

        const openPane = document.querySelector('#v-pills-tabContent .tab-pane.show.active');

        if (openPane?.id) {
            closeExplorerTabPane(openPane.id);
            return;
        }

        const detailsContent = document.querySelector('#detailsContent.show');

        if (detailsContent) {
            $('#detailsContent').collapse('hide');
        }
    });
});


// ----------------------------------------------------------------------- //
// mobile accordion
// ----------------------------------------------------------------------- //

// Keeps the mobile details accordion's plus/minus icon in sync with its state.
document.addEventListener('DOMContentLoaded', function() {
    const mobileAccordionHeader = document.querySelector('.bg-primary[data-toggle="collapse"]');
    const detailsContent = document.querySelector('#detailsContent');
    const toggleIcon = mobileAccordionHeader ? mobileAccordionHeader.querySelector('.toggle-icon') : null;

    if (mobileAccordionHeader && detailsContent && toggleIcon) {
        // Function to update icon state
        function updateIconState(isOpen) {
            if (isOpen) {
                toggleIcon.classList.remove('fa-plus');
                toggleIcon.classList.add('fa-minus');
                mobileAccordionHeader.setAttribute('aria-expanded', 'true');
            } else {
                toggleIcon.classList.remove('fa-minus');
                toggleIcon.classList.add('fa-plus');
                mobileAccordionHeader.setAttribute('aria-expanded', 'false');
            }
        }

        // Listen for Bootstrap collapse events
        detailsContent.addEventListener('show.bs.collapse', function() {
            updateIconState(true);
        });

        detailsContent.addEventListener('hide.bs.collapse', function() {
            updateIconState(false);
        });

        // Handle initial state
        const isInitiallyOpen = detailsContent.classList.contains('show');
        updateIconState(isInitiallyOpen);

        // Also listen for click events on the header as a backup
        mobileAccordionHeader.addEventListener('click', function() {
            setTimeout(() => {
                const isCurrentlyOpen = detailsContent.classList.contains('show');
                updateIconState(isCurrentlyOpen);
            }, 100);
        });
    }
});


// ----------------------------------------------------------------------- //
// has-open-panel state class
// ----------------------------------------------------------------------- //

// Toggles .has-open-panel on .de-tabs whenever any pane opens or closes.
document.addEventListener('DOMContentLoaded', function() {
    const deTabsElement = document.querySelector('.de-tabs');
    const panelIds = ['v-pills-bar', 'v-pills-table', 'v-pills-trends', 'v-pills-correlate', 'v-pills-ds'];

    function updateHasOpenPanelClass() {
        let hasOpenPanel = false;

        // Check if any panel is currently open
        panelIds.forEach(panelId => {
            const panel = document.querySelector('#' + panelId);
            if (panel && panel.classList.contains('show') && panel.classList.contains('active')) {
                hasOpenPanel = true;
            }
        });

        // Also check if tab content container is visible
        const tabContent = document.querySelector('#v-pills-tabContent');
        if (tabContent && tabContent.style.display !== 'none') {
            hasOpenPanel = true;
        }

        // Toggle the class based on panel state
        if (hasOpenPanel) {
            deTabsElement.classList.add('has-open-panel');
        } else {
            deTabsElement.classList.remove('has-open-panel');
        }
    }

    // Monitor all tab panes for show/hide events
    panelIds.forEach(panelId => {
        const panel = document.querySelector('#' + panelId);
        if (panel) {
            // Listen for Bootstrap show/hide events
            panel.addEventListener('show.bs.tab', updateHasOpenPanelClass);
            panel.addEventListener('hide.bs.tab', updateHasOpenPanelClass);
            panel.addEventListener('shown.bs.tab', updateHasOpenPanelClass);
            panel.addEventListener('hidden.bs.tab', updateHasOpenPanelClass);
        }
    });

    // Monitor tab content container visibility
    const tabContent = document.querySelector('#v-pills-tabContent');
    if (tabContent) {
        // Use MutationObserver to watch for style changes
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    updateHasOpenPanelClass();
                }
            });
        });
        observer.observe(tabContent, { attributes: true, attributeFilter: ['style'] });
    }

    // Monitor tab link clicks for immediate response
    const tabLinks = document.querySelectorAll('.nav-link[data-toggle="pill"]');
    tabLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Small delay to ensure Bootstrap has processed the click
            setTimeout(updateHasOpenPanelClass, 50);
        });
    });

    // Apply the initial expanded state on first load.
    // This keeps the right overlay pane fully open when the page first renders.
    updateHasOpenPanelClass();
});


// ----------------------------------------------------------------------- //
// ready hook
// ----------------------------------------------------------------------- //

$(document).ready(function() {

    // Tab display is now managed via the `overlay` URL search param in app.js.
    // No hash fragment logic needed here.

});
