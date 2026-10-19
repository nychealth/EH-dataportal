// ======================================================================= //
// nr-r14-probe.mjs
// ======================================================================= //

// Runtime checks for the Neighborhood Reports rows fixed under roadmap batch R14
// (documents/nr-audit-r14-fixes-2026-10-18.md). Each check drives the page the way
// a visitor would and asserts the end state the audit row says was missing, so it
// is the reproduction before a fix and the proof after one.
//
// Covers N-025, N-026, N-027 and N-028 so far; the ledger's later steps add their rows here.
//
//     node scripts/nr-r14-probe.mjs
//
// Exits 1 if any check fails. Uses ensureDevServer(), so the server rules in
// CLAUDE.md apply: with nothing running it starts dev_stage and stops it afterwards.

import { chromium } from 'playwright';
import { ensureDevServer } from './dev-server.mjs';


// ----------------------------------------------------------------------- //
// N-025: breadcrumb follows an in-place neighborhood switch
// ----------------------------------------------------------------------- //

const checkN025 = async (browser, baseURL) => {

    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto(baseURL + 'neighborhood-reports/central_harlem_morningside_heights/active_design_physical_activity_and_health/', { waitUntil: 'load' });
    await page.waitForSelector("path[aria-label*='Kingsbridge']", { timeout: 20000 });

    // Read by position, not by the fix's class hook, so the check means the same
    // thing on a tree that predates the fix
    const read = () => page.evaluate(() => {
        const a = document.querySelector('nav[aria-label=breadcrumb] li:nth-child(3) a');
        return {
            h1: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
            path: location.pathname,
            crumbText: a?.textContent.trim(),
            crumbHref: a?.getAttribute('href'),
        };
    });

    const before = await read();

    // Enter on a focused polygon is the same route a click takes (map.js binds both
    // to one handler), and avoids making this a test of Leaflet hit-detection
    await page.focus("path[aria-label*='Kingsbridge']");
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => location.pathname.includes('kingsbridge'), null, { timeout: 15000 });
    await page.waitForTimeout(1500);

    const after = await read();
    await page.close();

    // The "before" read is the control: a selector that found no crumb would
    // otherwise fail the "after" assertions for the wrong reason
    const pass = before.crumbText?.startsWith('Central Harlem')
        && after.crumbText === 'Kingsbridge - Riverdale'
        && /\/neighborhood-reports\/kingsbridge_riverdale\/$/.test(after.crumbHref ?? '')
        && after.h1?.includes('Kingsbridge')
        && errors.length === 0;

    return { row: 'N-025', pass, before, after, errors };

};


// ----------------------------------------------------------------------- //
// N-027: selected state is programmatic, not styling only
// ----------------------------------------------------------------------- //

// Topic buttons on the NR landing page carry aria-pressed, and it moves with .active
const checkN027Buttons = async (browser, baseURL) => {

    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto(baseURL + 'neighborhood-reports/', { waitUntil: 'load' });

    const read = () => page.$$eval('.nr-topic-button', bs => bs.map(b => ({
        id: b.id,
        active: b.classList.contains('active'),
        pressed: b.getAttribute('aria-pressed'),
    })));

    const before = await read();
    await page.click('#Climate_and_Health');
    const after = await read();
    await page.close();

    // Exactly the .active button reads "true" and every other one "false". The .active
    // half is the control: it proves the selector found the buttons and the click landed
    const agrees = states => states.length === 5
        && states.filter(s => s.active).length === 1
        && states.every(s => s.pressed === (s.active ? 'true' : 'false'));

    const pass = agrees(before) && agrees(after)
        && before[0].active
        && after.find(s => s.id === 'Climate_and_Health')?.active
        && errors.length === 0;

    return { row: 'N-027 topic buttons', pass, before, after, errors };

};


// The report map's selected polygon carries aria-current="true", and only that one
const checkN027Polygon = async (browser, baseURL) => {

    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto(baseURL + 'neighborhood-reports/central_harlem_morningside_heights/active_design_physical_activity_and_health/', { waitUntil: 'load' });
    await page.waitForSelector("path[aria-label*='Kingsbridge']", { timeout: 20000 });

    // Waits for the attribute to land on the expected polygon; a timeout leaves the
    // read below to report what is there instead, which is the failure before the fix
    const settle = name => page.waitForFunction(
        n => document.querySelector("path[aria-current='true']")?.getAttribute('aria-label')?.includes(n),
        name, { timeout: 10000 }
    ).catch(() => {});

    const read = () => page.evaluate(() => ({
        named: document.querySelectorAll('path[aria-label]').length,
        current: [...document.querySelectorAll("path[aria-current='true']")].map(p => p.getAttribute('aria-label')),
    }));

    await settle('Central Harlem');
    const before = await read();

    await page.focus("path[aria-label*='Kingsbridge']");
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => location.pathname.includes('kingsbridge'), null, { timeout: 15000 });
    await settle('Kingsbridge');
    const after = await read();
    await page.close();

    // named === 42 is the control: the polygons exist and the name probe can fire
    const pass = before.named === 42
        && before.current.length === 1 && before.current[0].startsWith('Central Harlem')
        && after.current.length === 1 && after.current[0].startsWith('Kingsbridge')
        && errors.length === 0;

    return { row: 'N-027 report polygon', pass, before, after, errors };

};


// ----------------------------------------------------------------------- //
// N-026: neighborhood-index polygons are named and answer Enter
// ----------------------------------------------------------------------- //

const checkN026 = async (browser, baseURL) => {

    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto(baseURL + 'neighborhood-reports/east_new_york/', { waitUntil: 'load' });

    // 42 paths is the control: the polygons rendered, so a 0 below is about names.
    // .leaflet-interactive leaves out the attribution flag icon's three paths
    await page.waitForFunction(() => document.querySelectorAll('#map path.leaflet-interactive').length >= 42, null, { timeout: 20000 });

    const named = await page.evaluate(() => ({
        paths: document.querySelectorAll('#map path.leaflet-interactive').length,
        buttons: document.querySelectorAll("#map path.leaflet-interactive[role='button'][aria-label]").length,
        // GEONAME reads "Washington Heights - Inwood"; uhflist's UHF_name, which the
        // report map, the neighborhood list and the page URLs use, reads "Washington Heights"
        washingtonHeights: [...document.querySelectorAll('#map path.leaflet-interactive[aria-label]')]
            .map(p => p.getAttribute('aria-label')).filter(n => n.startsWith('Washington Heights')),
    }));

    // Enter on a focused polygon goes where a click goes: that neighborhood's index page
    let enterPath = null;
    const target = "#map path.leaflet-interactive[aria-label='Washington Heights']";

    if (await page.$(target)) {
        await page.focus(target);
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => location.pathname.includes('washington_heights'), null, { timeout: 15000 }).catch(() => {});
        enterPath = await page.evaluate(() => location.pathname);
    }

    await page.close();

    const pass = named.paths === 42
        && named.buttons === 42
        && named.washingtonHeights.length === 1 && named.washingtonHeights[0] === 'Washington Heights'
        && /\/neighborhood-reports\/washington_heights\/$/.test(enterPath ?? '')
        && errors.length === 0;

    return { row: 'N-026', pass, named, enterPath, errors };

};


// ----------------------------------------------------------------------- //
// N-026, pointer half: the neighborhood index map frames the whole city
// ----------------------------------------------------------------------- //

// Centre-point hit test, the audit's own method: a polygon counts as reachable when
// elementFromPoint at its bounding-box centre returns that polygon. It undercounts thin
// shapes (Rockaways, audit A-149), so 41 of 42 is the expected ceiling, as on the report map
const checkN026Pointer = async (browser, baseURL) => {

    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto(baseURL + 'neighborhood-reports/east_new_york/', { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelectorAll('#map path.leaflet-interactive').length >= 42, null, { timeout: 20000 });

    // Long enough for the old 0.5s-delayed, 0.5s fly-to to have finished, so the
    // before-fix reading is the settled zoomed view rather than a frame mid-flight
    await page.waitForTimeout(2500);
    await page.evaluate(() => document.getElementById('map').scrollIntoView({ block: 'center' }));

    const reach = await page.evaluate(() => {
        const paths = [...document.querySelectorAll('#map path.leaflet-interactive')];
        const hits = paths.filter(p => {
            const r = p.getBoundingClientRect();
            return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === p;
        });
        return {
            polygons: paths.length,
            reachable: hits.length,
            zoom: map.getZoom(),
            // The page's own neighborhood keeps its highlight under either framing
            highlighted: paths.filter(p => p.getAttribute('stroke') === '#008939').map(p => p.getAttribute('aria-label')),
        };
    });

    await page.close();

    const pass = reach.polygons === 42
        && reach.reachable >= 41
        && reach.highlighted.length === 1 && reach.highlighted[0] === 'East New York'
        && errors.length === 0;

    return { row: 'N-026 pointer', pass, reach, errors };

};


// ----------------------------------------------------------------------- //
// Zoom controls on every NR map (Chris, 2026-10-19)
// ----------------------------------------------------------------------- //

// The report page and the neighborhood index show the map as a control, so their zoom
// buttons are tab stops. The landing page and topic index hide the map from assistive tech
// (the neighborhood list is its text equivalent), so there they must not be tab stops
const checkZoomControls = async (browser, baseURL) => {

    const pages = {
        'neighborhood-reports/east_new_york/asthma_and_the_environment/': { container: '#nr-map', hidden: false },
        'neighborhood-reports/east_new_york/': { container: '#map', hidden: false },
        'neighborhood-reports/': { container: '#map', hidden: true },
        'neighborhood-reports/climate_and_health/': { container: '#map', hidden: true },
    };

    const results = {};
    const errors = [];

    for (const [path, { container, hidden }] of Object.entries(pages)) {

        const page = await browser.newPage();
        page.on('pageerror', e => errors.push(path + ': ' + e.message));

        await page.goto(baseURL + path, { waitUntil: 'load' });
        await page.waitForFunction(c => document.querySelectorAll(c + ' path.leaflet-interactive').length >= 42, container, { timeout: 20000 });

        const r = await page.evaluate(c => {
            const buttons = [...document.querySelectorAll(c + ' .leaflet-control-zoom a')];
            return buttons.map(b => ({ label: b.getAttribute('aria-label'), role: b.getAttribute('role'), tabindex: b.getAttribute('tabindex') }));
        }, container);

        // A real click on Zoom in must move the zoom, so the buttons are wired, not decoration
        // Bare names, not window.*: both maps are top-level let bindings, which are not window
        // properties, and window.map is the #map div by named access
        const getZoom = () => page.evaluate(() =>
            (typeof leafletMap !== 'undefined' ? leafletMap : map).getZoom());

        let zoomed = null;
        if (r.length && !hidden) {

            // The initial fitBounds animates from zoom 10, and Leaflet can drop a zoom request
            // made mid-animation: clicked the moment the polygons appeared, 1 of 2 report-page
            // clicks registered, against 2 of 2 once _animatingZoom was false [2026-10-19]
            await page.waitForFunction(() =>
                !(typeof leafletMap !== 'undefined' ? leafletMap : map)._animatingZoom, null, { timeout: 5000 });

            const before = await getZoom();
            await page.click(container + ' .leaflet-control-zoom-in');
            await page.waitForTimeout(600);
            zoomed = (await getZoom()) > before;
        }

        await page.close();

        const labels = r.map(b => b.label).join(',');
        results[path] = {
            buttons: r,
            zoomed,
            ok: labels === 'Zoom in,Zoom out'
                && r.every(b => b.role === 'button')
                && (hidden ? r.every(b => b.tabindex === '-1') : zoomed === true),
        };

    }

    const pass = Object.values(results).every(x => x.ok) && errors.length === 0;

    return { row: 'zoom controls', pass, results, errors };

};


// ----------------------------------------------------------------------- //
// N-028: no unconditional console.log from the NR picker pages
// ----------------------------------------------------------------------- //

const checkN028 = async (browser, baseURL) => {

    const counts = {};

    // The three pages that render nr-leaflet.html, so its inline script runs on each
    const errors = [];

    for (const path of ['neighborhood-reports/', 'neighborhood-reports/climate_and_health/', 'neighborhood-reports/east_new_york/']) {

        const page = await browser.newPage();
        const logs = [];
        page.on('console', m => { if (m.type() === 'log') logs.push(m.text()); });
        page.on('pageerror', e => errors.push(path + ': ' + e.message));

        await page.goto(baseURL + path, { waitUntil: 'load' });
        await page.waitForFunction(() => document.querySelectorAll('#map path.leaflet-interactive').length >= 42, null, { timeout: 20000 });
        await page.waitForTimeout(1000);
        await page.close();

        counts[path] = logs;

    }

    // Before the fix these read 8, 6 and 6 (audit N-028), which is what shows the
    // listener hears the page's own logs
    const pass = Object.values(counts).every(logs => logs.length === 0)
        && errors.length === 0;

    return { row: 'N-028', pass, counts, errors };

};


// ----------------------------------------------------------------------- //
// run
// ----------------------------------------------------------------------- //

const main = async () => {

    const server = await ensureDevServer();
    console.log(`Server: ${server.baseURL} (pagefind ${server.pagefind ? 'served' : 'ABSENT'})`);

    const browser = await chromium.launch();
    const results = [];

    try {
        results.push(await checkN025(browser, server.baseURL));
        results.push(await checkN027Buttons(browser, server.baseURL));
        results.push(await checkN027Polygon(browser, server.baseURL));
        results.push(await checkN026(browser, server.baseURL));
        results.push(await checkN028(browser, server.baseURL));
        results.push(await checkN026Pointer(browser, server.baseURL));
        results.push(await checkZoomControls(browser, server.baseURL));
    } finally {
        await browser.close();
        await server.stop();
    }

    for (const r of results) {
        console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.row}`);
        if (!r.pass) {
            console.log(JSON.stringify(r, null, 4));
        }
    }

    return results.every(r => r.pass) ? 0 : 1;

};

// Set exitCode rather than calling process.exit(): an exit right after network
// activity aborts Node on Windows with 127, whatever the script meant to return
process.exitCode = await main();
