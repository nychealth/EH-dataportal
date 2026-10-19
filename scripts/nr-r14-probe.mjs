// ======================================================================= //
// nr-r14-probe.mjs
// ======================================================================= //

// Runtime checks for the Neighborhood Reports rows fixed under roadmap batch R14
// (documents/nr-audit-r14-fixes-2026-10-18.md). Each check drives the page the way
// a visitor would and asserts the end state the audit row says was missing, so it
// is the reproduction before a fix and the proof after one.
//
// Covers N-025 and N-027 so far; the ledger's later steps add their rows here.
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
