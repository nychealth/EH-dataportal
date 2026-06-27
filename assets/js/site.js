(() => {
	function canTrackAnalytics() {
		return typeof window.gtag === "function";
	}

	function getClickUrl(element) {
		return element.getAttribute("href") || element.getAttribute("data-bs-target") || "";
	}

	function getAnalyticsLabel(element) {
		const explicitLabel =
			element.dataset.homepageLabel ||
			element.dataset.gaLabel ||
			element.getAttribute("aria-label") ||
			element.getAttribute("title");

		if (explicitLabel) {
			return explicitLabel.trim();
		}

		const textLabel = element.textContent.replace(/\s+/g, " ").trim();

		if (textLabel) {
			return textLabel;
		}

		const image = element.querySelector("img[alt]");

		if (image && image.getAttribute("alt")) {
			return image.getAttribute("alt").trim();
		}

		return "";
	}

	function getAnalyticsPlace(element) {
		const homepageSection = element.closest("[data-homepage-section]");

		if (homepageSection) {
			return `homepage:${homepageSection.dataset.homepageSection}`;
		}

		if (element.closest("#global-header")) {
			return "header";
		}

		if (element.closest("#global-footer")) {
			return "footer";
		}

		if (element.closest("#article-footer")) {
			return "article-footer";
		}

		return "body";
	}

	function sendAnalyticsEvent(eventName, params = {}) {
		if (!canTrackAnalytics()) {
			return;
		}

		window.gtag("event", eventName, {
			page: window.location.pathname,
			...params,
		});
	}

	// Delegate common CTA tracking in one place instead of scattering inline handlers.
	document.addEventListener("click", (event) => {
		const clickTarget = event.target.closest("a, button");

		if (!clickTarget) {
			return;
		}

		if (clickTarget.classList.contains("pagefind-ui__result-link")) {
			sendAnalyticsEvent("search_click", {
				page_viewed: clickTarget.href,
				result_label: getAnalyticsLabel(clickTarget),
			});
			return;
		}

		if (clickTarget.classList.contains("lang-select")) {
			sendAnalyticsEvent("click_language", {
				language: clickTarget.dataset.lang || getAnalyticsLabel(clickTarget),
				place: getAnalyticsPlace(clickTarget),
			});
			return;
		}

		// Track both direct subscribe links and subscribe CTAs that open the shared modal.
		if (
			clickTarget.classList.contains("subscribe-link") ||
			clickTarget.dataset.subscribeClick ||
			clickTarget.getAttribute("data-bs-target") === "#subscribeModal"
		) {
			sendAnalyticsEvent("click_subscribe", {
				place: clickTarget.dataset.subscribeClick || getAnalyticsPlace(clickTarget),
				click_url: getClickUrl(clickTarget),
			});
			return;
		}

		if (clickTarget.getAttribute("data-bs-target") === "#searchModal") {
			sendAnalyticsEvent("click_search_open", {
				place: getAnalyticsPlace(clickTarget),
			});
			return;
		}

		const homepageSection = clickTarget.closest("[data-homepage-section]");

		if (homepageSection) {
			const clickLabel = getAnalyticsLabel(clickTarget);

			if (!clickLabel) {
				return;
			}

			sendAnalyticsEvent("click_homepage_link", {
				homepage_section: homepageSection.dataset.homepageSection,
				homepage_label: clickLabel,
				click_url: getClickUrl(clickTarget),
			});
			return;
		}

		if (clickTarget.classList.contains("link-track")) {
			sendAnalyticsEvent("click_topic_link", {
				click_url: getClickUrl(clickTarget),
				click_label: getAnalyticsLabel(clickTarget),
			});
			return;
		}

		const navigationRoot = clickTarget.closest("#global-header, #global-footer");
		const clickUrl = getClickUrl(clickTarget);

		if (
			navigationRoot &&
			clickUrl &&
			clickUrl !== "#" &&
			!clickTarget.hasAttribute("data-bs-toggle")
		) {
			const clickLabel = getAnalyticsLabel(clickTarget);

			if (!clickLabel) {
				return;
			}

			sendAnalyticsEvent("click_navigation", {
				navigation_region: navigationRoot.id === "global-header" ? "header" : "footer",
				navigation_label: clickLabel,
				click_url: clickUrl,
			});
		}
	});
})();
