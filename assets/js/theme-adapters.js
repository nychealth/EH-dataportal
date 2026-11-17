// ======================================================================= //
// theme-adapters.js
// ======================================================================= //

// Site-wide dark-mode wiring: the header toggle, and the embeds that need telling about the
// theme. Theme state itself lives in head.html (ehdpTheme), so it is settled before paint;
// Vega's adapter lives in lib-vega.html, beside the library it wraps.
// Design: documents/dark-mode-design-2026-11-17.md

(() => {

    // ----------------------------------------------------------------------- //
    // header toggle
    // ----------------------------------------------------------------------- //

    // Every header carries one toggle (theme-toggle.html); aria-pressed mirrors the mode

    const toggles = document.querySelectorAll('[data-theme-toggle]');

    const syncToggles = (mode) => {

        toggles.forEach((button) => {
            button.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
        });
    };

    toggles.forEach((button) => {

        button.addEventListener('click', () => {
            ehdpTheme.set(ehdpTheme.current() === 'dark' ? 'light' : 'dark');
        });
    });


    // ----------------------------------------------------------------------- //
    // Datawrapper
    // ----------------------------------------------------------------------- //

    // Datawrapper documents ?dark=true / ?dark=false on the iframe URL as forcing the chart's
    // mode (datawrapper.de/docs/dark-mode-in-embedded-datawrapper-visualizations, read
    // 2026-11-17). An explicit value, never "auto", because the site's own toggle can
    // disagree with the OS. Embeds come from the datawrapper shortcode and from raw iframes
    // in ~70 content files, so they are found by host rather than by markup.

    const DATAWRAPPER_HOST = 'datawrapper.dwcdn.net';

    // ON: Chris, having seen it, 2026-11-17 ("i like the look of datawrapper dark"). The cost,
    // measured on the heat report's HVI map (OEVex/6): Datawrapper's
    // dark mode re-colours the data, not just the chrome. ?dark=true reverses the sequential
    // palette (class 1 pale yellow -> dark purple) and draws classes 4 and 5 in near-identical
    // peach. With this false, embeds stay light on a light plate (_i-dark-mode.scss), which reads
    // the data-dw-follow attribute this sets; the one switch flips both.

    const DATAWRAPPER_FOLLOWS_THEME = true;

    const syncDatawrapper = (mode) => {

        document.querySelectorAll(`iframe[src*="${DATAWRAPPER_HOST}"]`).forEach((frame) => {

            // Protocol-relative srcs ("//datawrapper.dwcdn.net/…") resolve against the page

            const url = new URL(frame.getAttribute('src'), window.location.href);
            const wanted = mode === 'dark' ? 'true' : 'false';

            // Skip a no-op write: setting src reloads the iframe even when it is unchanged

            if (url.searchParams.get('dark') === wanted) return;

            // Light mode on a frame that never carried the flag stays untouched, so the
            // light-mode request is byte-identical to before this file existed

            if (mode === 'light' && !url.searchParams.has('dark')) return;

            url.searchParams.set('dark', wanted);
            frame.setAttribute('src', url.toString());
        });
    };


    // Script embeds (<script src="…/embed.js" data-target="#datawrapper-vis-…">) render without
    // an iframe. Datawrapper's render() reads its flags off document.currentScript with
    // getAttribute('data-<flag>') (read from embed.js's window.datawrapper.render, 2026-11-17),
    // and the docs name data-dark for this form. Those scripts are `defer`, so on load setting
    // the attribute before they run is enough: this file is a plain script at the end of
    // <body>, which runs before any deferred one. On a toggle the chart is already drawn, so
    // the rendered component is removed and a fresh copy of the script runs with the new flag.

    // Holds a script embed's space while its new copy renders. Removing the old chart collapsed
    // its container to 0-60px for a moment on 8 of the heat report's 9 charts (dw-shift.mjs,
    // 2026-11-17), and everything below it jumped. The hold is a min-height on the container's
    // parent, because embed.js resets the container's own inline style (style.all = "initial")
    // when it reuses it. Released when the new chart reaches 90% of the old height, or after 8s.

    const holdHeight = (container) => {

        const holder = container.parentElement;
        const held = container.offsetHeight;

        if (!holder || !held) return;

        const previous = holder.style.minHeight;
        holder.style.minHeight = `${holder.offsetHeight}px`;

        let released = false;

        const release = () => {
            if (released) return;
            released = true;
            observer.disconnect();
            holder.style.minHeight = previous;
        };

        const observer = new ResizeObserver(() => {
            if (container.offsetHeight >= held * 0.9) release();
        });

        // Observed after the old chart is gone (the caller removes it next), so the first
        // callback cannot release on the old height
        requestAnimationFrame(() => observer.observe(container));
        setTimeout(release, 8000);
    };


    const syncDatawrapperScripts = (mode, rerender) => {

        const wanted = mode === 'dark' ? 'true' : 'false';

        document.querySelectorAll(`script[src*="${DATAWRAPPER_HOST}"][src*="embed.js"]`).forEach((script) => {

            if (script.getAttribute('data-dark') === wanted) return;
            if (mode === 'light' && !script.hasAttribute('data-dark')) return;

            if (!rerender) {
                script.setAttribute('data-dark', wanted);
                return;
            }

            // The rendered chart is a custom element beside the script in its target container

            const container = document.querySelector(script.dataset.target) || script.parentElement;

            holdHeight(container);

            [...container.children]
                .filter((el) => el.tagName.toLowerCase().startsWith('datawrapper-'))
                .forEach((el) => el.remove());

            // embed.js reuses a data-target container only while it lacks __dwEmbedTarget,
            // which it sets on first use; otherwise it nests a second div with the same id
            // (read from embed.js, 2026-11-17). A private property, so if Datawrapper renames
            // it the symptom is a duplicate id after a toggle, not a broken chart.

            delete container.__dwEmbedTarget;

            const fresh = document.createElement('script');
            [...script.attributes].forEach((attr) => fresh.setAttribute(attr.name, attr.value));
            fresh.setAttribute('data-dark', wanted);
            script.replaceWith(fresh);
        });
    };


    // ----------------------------------------------------------------------- //
    // apply now and on every change
    // ----------------------------------------------------------------------- //

    // Charts that load after this file runs (a story's hidden tab, via lazy-tab-embeds.js; the
    // housing story's income radios) arrive without the flag. Caught as they appear: an iframe
    // whose src is set, or an embed script added. A new defer script has not run when this
    // callback does (microtask), so data-dark set here still reaches embed.js. Leaflet's tile
    // <img> src writes reach the callback too, and are dismissed by the tag check.

    const watchLateEmbeds = () => {

        new MutationObserver((records) => {

            const late = records.some((r) =>
                (r.type === 'attributes' && r.target.tagName === 'IFRAME') ||
                [...r.addedNodes].some((n) => n.tagName === 'SCRIPT'));

            if (!late) return;

            syncDatawrapper(ehdpTheme.current());
            syncDatawrapperScripts(ehdpTheme.current(), false);

        }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
    };

    syncToggles(ehdpTheme.current());

    if (DATAWRAPPER_FOLLOWS_THEME) {
        document.documentElement.setAttribute('data-dw-follow', '');
        syncDatawrapper(ehdpTheme.current());
        syncDatawrapperScripts(ehdpTheme.current(), false);
        watchLateEmbeds();
    }

    ehdpTheme.onChange((mode) => {

        syncToggles(mode);

        if (DATAWRAPPER_FOLLOWS_THEME) {
            syncDatawrapper(mode);
            syncDatawrapperScripts(mode, true);
        }
    });

})();
