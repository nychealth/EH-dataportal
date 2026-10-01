// ======================================================================= //
// site-characterization-probe-control.mjs
// ======================================================================= //

// Proves that site-characterization.mjs's suspicious probes can fire at all.
//
// Three structure fields read zero on all 925 pages: landmarks.aside,
// controls.textarea and tables.withCaption. Grepping the templates says those
// elements exist nowhere in the repo — but that argument cannot tell
// "constant by construction" apart from "the selector is wrong", because both
// produce the same zero. This injects the elements into a real page and checks
// the numbers move.
//
// It matters more than it looks. A characterization baseline full of fields
// that always read zero passes every check forever, and a dead probe is
// indistinguishable from a clean site right up until the day it was supposed
// to catch something.
//
// Run it whenever a probe is added that reads zero everywhere.
//
//   node scripts/site-characterization-probe-control.mjs
//
// Exits non-zero if any probe failed to respond.

import { chromium } from "playwright";
import { ensureDevServer } from "./dev-server.mjs";
import { CAPTURE } from "./site-characterization.mjs";

const INJECT = () => {
    document.body.insertAdjacentHTML("beforeend", `
        <aside id="ctl-aside">aside</aside>
        <textarea id="ctl-textarea"></textarea>
        <table id="ctl-table"><caption>ctl caption</caption><tr><td>x</td></tr></table>
    `);
};

const main = async () => {

    const { baseURL, stop } = await ensureDevServer();
    const prefix = new URL(baseURL).pathname;
    const browser = await chromium.launch({ headless: true });

    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        await page.goto(baseURL + "about/", { waitUntil: "load", timeout: 30000 });

        const before = await page.evaluate(CAPTURE, prefix);
        await page.evaluate(INJECT);
        const after = await page.evaluate(CAPTURE, prefix);

        const rows = [
            ["landmarks.aside", before.structure.landmarks.aside, after.structure.landmarks.aside],
            ["controls.textarea", before.structure.controls.textarea, after.structure.controls.textarea],
            ["tables.withCaption", before.structure.tables.withCaption, after.structure.tables.withCaption],
            ["tables.total", before.structure.tables.total, after.structure.tables.total],
        ];

        let failed = 0;
        for (const [field, b, a] of rows) {
            const fired = a > b;
            if (!fired) failed++;
            console.log(`${fired ? "FIRES " : "DEAD  "} ${field.padEnd(20)} ${b} -> ${a}`);
        }

        console.log(failed
            ? `\n${failed} probe(s) did NOT respond to an injected element — those fields are dead, not constant.`
            : "\nAll probes responded. The zeros are constant by construction, not dead selectors.");

        process.exitCode = failed ? 1 : 0;

    } finally {
        await browser.close();
        await stop();
    }
};

main();
