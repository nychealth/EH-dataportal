// ======================================================================= //
// lazy-tab-embeds.js
// ======================================================================= //

// Defers Datawrapper embeds inside non-active Bootstrap tabs until their pane is
// actually shown, so they never render while it's still `display:none` (0x0
// layout box → Datawrapper's own script throws "negative/NaN SVG dimension"
// console errors trying to size itself). Markdown authors opt an embed in by
// using `data-lazy-src` (raw iframe) or `data-lazy-embed-src` (Datawrapper's
// responsive `embed.js` snippet) instead of loading it eagerly — see
// content/data-stories/{housing,redlining,air-quality-snapshots,vectorborne-diseases-and-health}.

(() => {
	function activateLazyEmbeds(pane) {
		pane.querySelectorAll("[data-lazy-src]").forEach((iframe) => {
			iframe.src = iframe.dataset.lazySrc;
			iframe.removeAttribute("data-lazy-src");
		});

		pane.querySelectorAll("[data-lazy-embed-src]").forEach((container) => {
			const script = document.createElement("script");

			script.src = container.dataset.lazyEmbedSrc;
			script.defer = true;
			script.dataset.target = `#${container.id}`;
			container.removeAttribute("data-lazy-embed-src");
			container.appendChild(script);
		});
	}

	// shown.bs.tab (not show.bs.tab, and not a plain click listener) fires only
	// after Bootstrap's fade transition finishes and the pane is actually
	// display:block — activating on click or on show.bs.tab sets `src` while the
	// pane is still hidden, reproducing the exact bug this file exists to avoid.
	// It's a jQuery-custom event Bootstrap's own tab.js triggers, so it's bound
	// through jQuery (already a hard dependency of data-toggle="tab" itself)
	// rather than a native document listener, which isn't guaranteed to see it.
	$(document).on("shown.bs.tab", '[data-toggle="tab"]', function () {
		const targetSelector = this.getAttribute("href") || this.dataset.target;
		const pane = targetSelector ? document.querySelector(targetSelector) : null;

		if (!pane) {
			return;
		}

		activateLazyEmbeds(pane);
	});
})();
