// ======================================================================= //
// nr-a11y-audit.mjs
// ======================================================================= //

// Accessibility audit harness for the four Neighborhood Reports page kinds:
// the NR landing page, a neighborhood index, a topic index, and the report page
// (assets/js/nr-report/ + layouts/neighborhood-reports/nr-report.html).
//
// This is an audit instrument, not a pass/fail guardrail. It reports what it
// found and exits 0 unless a *control* failed — see below. Turning a subset of
// its output into a regression gate is a separate decision, taken once the
// findings it produces have been triaged.
//
// Two controls guard every number it prints, because an accessibility scan is
// exactly the kind of check whose clean result and whose total failure look
// identical in the output:
//
//   - The axe positive control. An <img> with no alt is injected, axe re-run,
//     and `image-alt` asserted to fire. A scan where axe never loaded and a page
//     with no violations both report zero violations. If the control does not
//     fire the whole run is void, and the script says so and exits non-zero.
//
//   - The rendered-content control. Each page declares a selector that must
//     match before it is worth scanning. The report page fetches its indicator rows from
//     the data repo; when that is empty it renders five empty accordion shells,
//     and axe will honestly report almost nothing wrong with a page that has
//     almost nothing on it. A scan of an empty page is not a clean page.
//
// Three states of the report page are scanned rather than one, because they are
// different documents. The chart, the panel body and the tertile sentences do
// not exist until a panel is expanded; the print rendition is separate markup
// (cards.js builds `.print-only` siblings) and the QR image exists only there.
//
// Beyond axe, the probes in `runProbes` cover what no automated rule checks:
// keyboard reachability and focus visibility, heading order as the accessibility
// tree sees it rather than as the DOM holds it, whether anything is announced
// when the report page re-renders, and how the charts and colour-coded comparisons are
// exposed. Each probe exists to confirm or drop a specific candidate finding
// from the source read — a candidate no probe confirms is not a finding.
//
// Usage (reuses a running dev server, or starts one — see dev-server.mjs):
//   node scripts/nr-a11y-audit.mjs
//   A11Y_OUT=some/dir node scripts/nr-a11y-audit.mjs
//
// Note for PowerShell: `npm run a11y:nr -- --flag` loses the `--`, so call the
// node command directly when passing arguments.

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ensureDevServer } from './dev-server.mjs';

// ----------------------------------------------------------------------- //
// configuration
// ----------------------------------------------------------------------- //

// One sample of each page kind. East New York is one of the characterization
// harness's own targets, so its data is known to exist; the topic slug matches
// the `url:` frontmatter on the topic content file.
const PAGES = [
    {
        key:     'landing',
        label:   'NR landing',
        path:    'neighborhood-reports/',
        // The 42-neighborhood list is server-rendered, so its absence means the
        // page did not build rather than that data is missing.
        present: '.neighborhood-list a'
    },
    {
        key:     'neighborhood-index',
        label:   'Neighborhood index (East New York)',
        path:    'neighborhood-reports/east_new_york/',
        present: '.card-title'
    },
    {
        key:     'topic-index',
        label:   'Topic index (Asthma and the Environment)',
        path:    'neighborhood-reports/asthma_and_the_environment/',
        present: '.neighborhood-list a'
    },
    {
        key:     'report-spa',
        label:   'Report SPA (East New York / Asthma)',
        path:    'neighborhood-reports/east_new_york/asthma_and_the_environment/',
        // Indicator cards are client-rendered from the data repo. This is the
        // control that separates "no violations" from "nothing rendered".
        present: '.card-header button',
        spa:     true
    }
];

// WCAG 2.1 A and AA. Run separately from best-practice so an advisory item is
// never reported as a conformance failure.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const OUT_DIR = process.env.A11Y_OUT || join(tmpdir(), 'nr-a11y-audit');

// Console noise that predates this harness, copied from nr-characterization.mjs
// so the two agree on what is dev-only rather than a defect.
const KNOWN_NOISE = /pagefind|PagefindUI|favicon|Failed to load resource|net::ERR|frame-ancestors|docs\.google\.com/i;

const AXE_PATH = 'node_modules/axe-core/axe.min.js';

// ----------------------------------------------------------------------- //
// axe plumbing
// ----------------------------------------------------------------------- //

// Runs axe in the page for one tag set and returns a trimmed result. The full
// axe result carries every passing node on the page and is far too large to
// keep; what a finding needs is the rule, its impact, and where it fired.
const runAxe = async (page, tags) => {

    const raw = await page.evaluate(async (t) => {
        const result = await window.axe.run(document, {
            runOnly:    { type: 'tag', values: t },
            resultTypes: ['violations']
        });
        return {
            violations: result.violations.map((v) => ({
                id:          v.id,
                impact:      v.impact,
                help:        v.help,
                helpUrl:     v.helpUrl,
                tags:        v.tags.filter((tag) => /^wcag|^best-practice$/.test(tag)),
                nodeCount:   v.nodes.length,
                nodes:       v.nodes.slice(0, 6).map((n) => ({
                    target:  n.target,
                    html:    n.html.slice(0, 300),
                    summary: (n.failureSummary || '').slice(0, 400)
                }))
            })),
            passCount:      result.passes.length,
            incompleteIds:  result.incomplete.map((i) => i.id)
        };
    }, tags);

    return raw;
};

// Injects axe and proves it can actually fire before any of its numbers are
// believed. Returns true only if a deliberately broken element was caught.
const provePositiveControl = async (page) => {

    const fired = await page.evaluate(async () => {
        const probe = document.createElement('img');
        probe.src = 'a11y-positive-control.png';
        probe.id  = 'a11y-positive-control';
        document.body.appendChild(probe);

        const result = await window.axe.run(document, {
            runOnly:     { type: 'rule', values: ['image-alt'] },
            resultTypes: ['violations']
        });

        probe.remove();

        return result.violations.some((v) => v.id === 'image-alt'
            && v.nodes.some((n) => String(n.target).includes('a11y-positive-control')));
    });

    return fired;
};

// ----------------------------------------------------------------------- //
// probes: what no axe rule checks
// ----------------------------------------------------------------------- //

// Everything below runs inside the page. They are grouped into one evaluate per
// concern rather than one per element so a single round trip answers a whole
// question, and so results cannot be misattributed between elements.

// Walks the tab order and records, at each stop, what a keyboard user lands on
// and whether they can see that they have landed on it. Driven from Node rather
// than in-page because only a real key press moves focus through the browser's
// own sequential navigation order.
const probeKeyboard = async (page, maxStops) => {

    const stops = [];

    // Wrap-around is detected by element identity, not by comparing the
    // recorded fields. Leaflet makes all 42 GeoJSON polygons focusable and they
    // are indistinguishable by tag, text and href — a fingerprint-based
    // stop condition reads the second polygon as a wrap and truncates the sweep
    // before it ever reaches the content below the map.
    await page.evaluate(() => {
        document.body.focus();
        window.__a11yFirstFocused = null;
    });

    for (let i = 0; i < maxStops; i++) {

        await page.keyboard.press('Tab');

        const wrapped = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return false;
            if (!window.__a11yFirstFocused) {
                window.__a11yFirstFocused = el;
                return false;
            }
            return el === window.__a11yFirstFocused;
        });

        if (wrapped) break;

        const stop = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return null;

            const cs = getComputedStyle(el);

            // An element inside an aria-hidden subtree is removed from the
            // accessibility tree but keeps its place in the tab order — the
            // "hidden but focusable" failure (WCAG 4.1.2). Walking to the root
            // is the only way to see it; the attribute is rarely on the control.
            let hiddenAncestor = null;
            for (let n = el; n; n = n.parentElement) {
                if (n.getAttribute && n.getAttribute('aria-hidden') === 'true') {
                    hiddenAncestor = n.tagName.toLowerCase()
                        + (n.id ? `#${n.id}` : '')
                        + (n.className && typeof n.className === 'string'
                            ? `.${n.className.trim().split(/\s+/).join('.')}` : '');
                    break;
                }
            }

            const path = [];
            for (let n = el; n && n !== document.body; n = n.parentElement) {
                path.unshift(n.tagName.toLowerCase() + (n.id ? `#${n.id}` : ''));
            }

            return {
                tag:            el.tagName.toLowerCase(),
                id:             el.id || null,
                cls:            typeof el.className === 'string' ? el.className.slice(0, 90) : null,
                href:           el.getAttribute ? el.getAttribute('href') : null,
                text:           (el.innerText || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 70),
                ariaLabel:      el.getAttribute ? el.getAttribute('aria-label') : null,
                ariaLabelledby: el.getAttribute ? el.getAttribute('aria-labelledby') : null,
                title:          el.getAttribute ? el.getAttribute('title') : null,
                role:           el.getAttribute ? el.getAttribute('role') : null,
                outline:        `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
                boxShadow:      cs.boxShadow === 'none' ? 'none' : cs.boxShadow.slice(0, 80),
                inAriaHidden:   hiddenAncestor,
                offScreen:      el.getClientRects().length === 0,
                path:           path.slice(-4).join(' > ')
            };
        });

        if (!stop) break;

        stops.push(stop);
    }

    // Collapse consecutive identical stops into a run. Forty-two Leaflet
    // polygons in the tab order is one finding, not forty-two, and leaving them
    // expanded buries the controls after them.
    const collapsed = [];
    for (const stop of stops) {
        const prev = collapsed[collapsed.length - 1];
        const same = prev
            && prev.tag === stop.tag
            && prev.id === stop.id
            && prev.text === stop.text
            && prev.href === stop.href
            && prev.path === stop.path;
        if (same) prev.runLength = (prev.runLength || 1) + 1;
        else collapsed.push({ ...stop, runLength: 1 });
    }

    return { stops: collapsed, totalStops: stops.length, hitLimit: stops.length >= maxStops };
};

// Heading order as the accessibility tree sees it. Reading the DOM would count
// headings that are display:none — the topic index emits a hidden h1 and h2 per
// indicator for Pagefind, and counting those would manufacture a finding no
// screen-reader user could ever experience.
const probeHeadings = async (page) => page.evaluate(() => {

    const visibleToAT = (el) => {
        if (el.getClientRects().length === 0) return false;
        for (let n = el; n; n = n.parentElement) {
            if (n.getAttribute && n.getAttribute('aria-hidden') === 'true') return false;
        }
        return true;
    };

    const all = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];

    return {
        exposed: all.filter(visibleToAT).map((el) => ({
            level: Number(el.tagName[1]),
            text:  el.innerText.replace(/\s+/g, ' ').trim().slice(0, 80)
        })),
        hiddenCount: all.length - all.filter(visibleToAT).length,
        domH1Count:  all.filter((el) => el.tagName === 'H1').length
    };
});

// Duplicate ids and broken ARIA id references. axe covers duplicate-id-active
// and aria-valid-attr-value, but not every reference it should, and having the
// raw list makes a finding citable rather than paraphrased from a rule name.
const probeIdIntegrity = async (page) => page.evaluate(() => {

    const counts = {};
    for (const el of document.querySelectorAll('[id]')) {
        counts[el.id] = (counts[el.id] || 0) + 1;
    }

    const broken = [];
    for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
        for (const el of document.querySelectorAll(`[${attr}]`)) {
            for (const ref of el.getAttribute(attr).trim().split(/\s+/)) {
                if (ref && !document.getElementById(ref)) {
                    broken.push({ attr, ref, on: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''), html: el.outerHTML.slice(0, 160) });
                }
            }
        }
    }

    return {
        duplicateIds: Object.entries(counts).filter(([, n]) => n > 1).map(([id, n]) => ({ id, n })),
        brokenRefs:   broken
    };
});

// Every live region on the page, and whether images have alt at all. Cheap, and
// the live-region list is the before half of the re-render probe below.
const probeAnnouncements = async (page) => page.evaluate(() => ({
    liveRegions: [...document.querySelectorAll('[aria-live],[role=status],[role=alert],[aria-busy=true]')]
        .map((el) => ({
            tag:  el.tagName.toLowerCase(),
            id:   el.id || null,
            live: el.getAttribute('aria-live'),
            role: el.getAttribute('role')
        })),
    imagesWithoutAlt: [...document.querySelectorAll('img:not([alt])')]
        .map((el) => ({ src: (el.getAttribute('src') || '').slice(0, 60), id: el.id || null, cls: el.className })),
    title: document.title
}));

// ----------------------------------------------------------------------- //
// probes specific to the report page
// ----------------------------------------------------------------------- //

// What the chart mount exposes once a panel is expanded. The renderer is read
// at runtime rather than trusted from the source: probing chart DOM is only
// valid if the output is SVG, and a canvas renderer would make every structural
// assertion below silently vacuous.
const probeCharts = async (page) => page.evaluate(() => {

    const mounts = [...document.querySelectorAll('.nr-map-container')];

    return mounts.filter((m) => m.children.length).map((m) => {
        const svg = m.querySelector('svg');
        return {
            id:           m.id,
            hasSvg:       !!svg,
            hasCanvas:    !!m.querySelector('canvas'),
            mountRole:    m.getAttribute('role'),
            mountLabel:   m.getAttribute('aria-label'),
            mountDescBy:  m.getAttribute('aria-describedby'),
            svgRole:      svg ? svg.getAttribute('role') : null,
            svgLabel:     svg ? svg.getAttribute('aria-label') : null,
            svgTitleText: svg ? (svg.querySelector('title')?.textContent || null) : null,
            svgDescText:  svg ? (svg.querySelector('desc')?.textContent || '').slice(0, 120) : null,
            markAriaLabels: svg ? svg.querySelectorAll('[aria-label]').length : 0,
            // vega-embed's actions menu — a real control, so whether it is
            // keyboard reachable and named is a conformance question.
            actionsSummary: (() => {
                const s = m.querySelector('summary, .vega-actions-wrapper summary, details summary');
                if (!s) return null;
                return {
                    tabIndex:  s.tabIndex,
                    ariaLabel: s.getAttribute('aria-label'),
                    text:      (s.innerText || '').trim().slice(0, 40)
                };
            })(),
            // A table alternative would be a <table> inside the panel. Recorded
            // rather than assumed absent.
            tableAlternative: !!m.closest('.collapse')?.querySelector('table')
        };
    });
});

// The colour-coded comparison vocabulary: the .comp-* words in the print
// rendition and the .worse/.better pills on screen. Records computed colour and
// what each contributes to innerText, which is the whole question about the
// Font Awesome ::before glyphs — a pseudo-element cannot carry aria-hidden.
const probeColourMeaning = async (page) => page.evaluate(() => {

    const sample = (sel, n) => [...document.querySelectorAll(sel)].slice(0, n).map((el) => {
        const cs     = getComputedStyle(el);
        const before = getComputedStyle(el, '::before');
        return {
            selector:    sel,
            cls:         el.className,
            text:        (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
            // innerText respects display and is what a copy/paste or a
            // text-extracting AT would see. Pseudo-element content is excluded
            // from it, which is the point of recording both.
            innerText:   (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40),
            color:       cs.color,
            background:  cs.backgroundColor,
            fontWeight:  cs.fontWeight,
            beforeContent: before.content,
            beforeFont:    before.fontFamily
        };
    });

    return [
        ...sample('.comp-good', 2),
        ...sample('.comp-bad', 2),
        ...sample('.comp-null', 2),
        ...sample('.worse', 2),
        ...sample('.better', 2),
        ...sample('.middle', 2)
    ];
});

// Clicks a Leaflet polygon and records what changed for a non-visual user. The
// report page tears down and rebuilds the entire report body on this interaction; the
// question is whether anything says so. Absence of a live region in the source
// is a grep result — this is the observation.
const probeReRender = async (page) => {

    const before = await page.evaluate(() => ({
        title:       document.title,
        h1:          document.querySelector('h1')?.innerText.replace(/\s+/g, ' ').trim() || null,
        url:         location.pathname,
        liveRegions: document.querySelectorAll('[aria-live],[role=status],[role=alert]').length,
        focus:       document.activeElement?.tagName.toLowerCase() || null,
        firstCard:   document.querySelector('.card-header button')?.innerText.replace(/\s+/g, ' ').trim().slice(0, 60) || null
    }));

    // A neighborhood polygon other than the current one. Leaflet renders GeoJSON
    // as SVG paths with .leaflet-interactive; index 3 is arbitrary but stable.
    const polygons = page.locator('#nr-map path.leaflet-interactive');
    const count    = await polygons.count();

    if (!count) return { clicked: false, reason: 'no interactive polygons found in #nr-map', before };

    await polygons.nth(Math.min(3, count - 1)).click({ force: true }).catch(() => {});
    await page.waitForTimeout(2500);

    const after = await page.evaluate(() => ({
        title:       document.title,
        h1:          document.querySelector('h1')?.innerText.replace(/\s+/g, ' ').trim() || null,
        url:         location.pathname,
        liveRegions: document.querySelectorAll('[aria-live],[role=status],[role=alert]').length,
        focus:       document.activeElement?.tagName.toLowerCase() || null,
        firstCard:   document.querySelector('.card-header button')?.innerText.replace(/\s+/g, ' ').trim().slice(0, 60) || null
    }));

    return { clicked: true, polygonCount: count, before, after };
};

// ----------------------------------------------------------------------- //
// per-page run
// ----------------------------------------------------------------------- //

const auditPage = async (browser, target, baseURL, controlState) => {

    const page          = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];

    page.on('console', (msg) => {
        if (msg.type() === 'error' && !KNOWN_NOISE.test(msg.text())) consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
        if (!KNOWN_NOISE.test(err.message)) consoleErrors.push(`pageerror: ${err.message}`);
    });

    const url = `${baseURL}${target.path}`;
    await page.goto(url, { waitUntil: 'load', timeout: 40000 });

    // The report page renders asynchronously. Wait for the rendered-content control
    // rather than a fixed delay, but do not throw — "nothing rendered" is a
    // reportable result, and it is the one that invalidates the scan.
    await page.waitForSelector(target.present, { timeout: 25000 }).catch(() => {});

    const rendered = await page.locator(target.present).count();

    await page.addScriptTag({ path: AXE_PATH });

    // The positive control only needs to pass once per run — it proves the
    // injection path and the axe build, neither of which varies by page.
    if (!controlState.proven) {
        controlState.proven = await provePositiveControl(page);
        controlState.provenOn = target.key;
    }

    const result = {
        label:            target.label,
        url,
        renderedControl:  { selector: target.present, matched: rendered, ok: rendered > 0 },
        axeVersion:       await page.evaluate(() => window.axe.version),
        wcag:             await runAxe(page, WCAG_TAGS),
        bestPractice:     await runAxe(page, ['best-practice']),
        headings:         await probeHeadings(page),
        idIntegrity:      await probeIdIntegrity(page),
        announcements:    await probeAnnouncements(page),
        // 250 comfortably exceeds the worst case — 42 Leaflet polygons, 22
        // accordion buttons and the site chrome — so hitting the limit means
        // the sweep did not complete and its coverage claim is void.
        keyboard:         await probeKeyboard(page, 250),
        colourMeaning:    await probeColourMeaning(page)
    };

    // ----- the report page's other three documents ----- //

    if (target.spa) {

        // 1. One panel expanded — the only state in which a chart exists.
        const firstPanel = page.locator('.card-header button').first();
        if (await firstPanel.count()) {
            await firstPanel.click().catch(() => {});
            await page.waitForTimeout(4000);
        }

        result.spaExpanded = {
            wcag:          await runAxe(page, WCAG_TAGS),
            charts:        await probeCharts(page),
            colourMeaning: await probeColourMeaning(page),
            idIntegrity:   await probeIdIntegrity(page)
        };

        // 2. Every panel expanded — duplicate ids and aria-controls collisions
        //    across generated cards only become observable with more than one live.
        const toggleAll = page.locator('#nr-toggle-accordions');
        if (await toggleAll.count() && await toggleAll.isEnabled().catch(() => false)) {
            await toggleAll.click().catch(() => {});
            await page.waitForTimeout(6000);
        }

        result.spaExpandAll = {
            wcag:        await runAxe(page, WCAG_TAGS),
            idIntegrity: await probeIdIntegrity(page),
            headings:    await probeHeadings(page),
            toggleState: await page.evaluate(() => {
                const b = document.getElementById('nr-toggle-accordions');
                return b && {
                    text:         b.innerText.replace(/\s+/g, ' ').trim(),
                    ariaExpanded: b.getAttribute('aria-expanded'),
                    ariaControls: b.getAttribute('aria-controls'),
                    disabled:     b.disabled
                };
            })
        };

        // 3. Print media. innerText respects display:none, so it is what print
        //    actually shows — nothing below this instrument proves a print claim.
        await page.emulateMedia({ media: 'print' });
        await page.waitForTimeout(1200);

        result.spaPrint = {
            wcag:          await runAxe(page, WCAG_TAGS),
            colourMeaning: await probeColourMeaning(page),
            announcements: await probeAnnouncements(page),
            innerTextHead: await page.evaluate(() => document.body.innerText.replace(/\n{2,}/g, '\n').slice(0, 2500)),
            qrImage:       await page.evaluate(() => {
                const img = document.querySelector('#nr-qrcode img, .print-only img');
                return img && {
                    hasAltAttribute: img.hasAttribute('alt'),
                    alt:             img.getAttribute('alt'),
                    parentId:        img.parentElement?.id || null
                };
            })
        };

        await page.emulateMedia({ media: 'screen' });

        // 4. The re-render. Done last: it navigates the report page's state and would
        //    invalidate everything captured above.
        result.spaReRender = await probeReRender(page);
    }

    result.consoleErrors = consoleErrors;

    await page.close();
    return result;
};

// ----------------------------------------------------------------------- //
// main
// ----------------------------------------------------------------------- //

const main = async () => {

    const { baseURL, stop } = await ensureDevServer();
    console.log(`Base URL: ${baseURL}`);
    console.log(`Output:   ${OUT_DIR}\n`);

    mkdirSync(OUT_DIR, { recursive: true });

    const browser      = await chromium.launch();
    const controlState = { proven: false, provenOn: null };
    const results      = [];

    try {
        for (const target of PAGES) {
            console.log(`Auditing ${target.label} ...`);
            const result = await auditPage(browser, target, baseURL, controlState);
            results.push(result);
            writeFileSync(join(OUT_DIR, `${target.key}.json`), `${JSON.stringify(result, null, 2)}\n`);

            const rc = result.renderedControl;
            console.log(`  rendered control: ${rc.matched} x "${rc.selector}" ${rc.ok ? 'OK' : 'FAILED — scan is not meaningful'}`);
            console.log(`  wcag violations:  ${result.wcag.violations.length} rules, ${result.wcag.violations.reduce((n, v) => n + v.nodeCount, 0)} nodes`);
            console.log(`  best practice:    ${result.bestPractice.violations.length} rules`);
            if (result.consoleErrors.length) console.log(`  console errors:   ${result.consoleErrors.length}`);
        }
    } finally {
        await browser.close();
        await stop();
    }

    writeFileSync(join(OUT_DIR, 'summary.json'), `${JSON.stringify({ baseURL, controlState, results }, null, 2)}\n`);

    // ----- verdict on the controls, not on the findings ----- //

    console.log('\n--- controls ---');
    console.log(`axe positive control: ${controlState.proven ? `FIRED (on ${controlState.provenOn})` : 'DID NOT FIRE'}`);

    const badRender = results.filter((r) => !r.renderedControl.ok);
    for (const r of badRender) console.log(`rendered control FAILED: ${r.label}`);

    if (!controlState.proven) {
        console.error('\nRun is VOID — axe could not be shown to detect a known failure.');
        process.exitCode = 1;
        return;
    }

    if (badRender.length) {
        console.error(`\n${badRender.length} page(s) had nothing to scan. Their zero counts mean nothing.`);
        process.exitCode = 1;
        return;
    }

    console.log('\nControls passed. Findings are in the JSON above; triage them by hand.');
};

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
