// ======================================================================= //
// ndhr-characterization.mjs
// ======================================================================= //

// Characterization harness for the Neighborhood Development Health Report page
// (assets/js/ndhr-report/ + themes/dohmh/layouts/ndhr/ndhr-report.html): captures the
// rendered output for a fixed set of category/community-district pairs so a refactor can
// be diffed against a committed baseline.
//
// Modelled on nr-characterization.mjs, and the parts that are NOT copied are the point:
//
//   - `strategies`, `geotypeTags` and `tertileSentences` have no NR counterpart. The
//     strategies column is NDHR-only (plan DECIDED-5), and the other two exist because
//     three measures are read at PUMA2020 and two at CDTA2020 (DECIDED-10) rather than at
//     the district the page is titled with. Nothing else in this repo guards any of them:
//     `lint` does not run the file, `smoke` only proves it throws no console error, and
//     `characterize:site` reads structure counts and not the words in them.
//
//     `geotypeTags` and `tertileSentences` are a PAIR and are worth reading as one. The
//     tag says a row was read at a PUMA; the sentence says what it was ranked among. Task
//     13 fixed a defect where they contradicted each other inside one card header — the
//     tag read "PUMA area" and the sentence "than most community districts" — and this
//     harness could see only the tag, so it passed throughout. Capturing the sentence too
//     is what makes that class of contradiction visible here `[added 2026-09-14]`.
//
//   - `indicatorNames` is captured where NR captures only accordion ids, which makes a
//     dropped or reordered row a diff with a name attached rather than a count that went
//     down.
//
//     CHANGED 2026-09-13: these names now come from EHDP-data's own `IndicatorName`,
//     read live from metadata.json, where they used to be the site-authored
//     `indicator_short_name` in data/globals/NDHR_content/. An earlier version of this
//     comment said they were committed here and so could not move on an EHDP-data
//     refresh; that is no longer true, and a rename upstream will now fail this check.
//     That is the intended trade — the same refresh silently renames the page, and a
//     harness that could not see it was the worse option. The YAML still carries a
//     validated copy for the category index, so `node
//     scripts/ndhr-indicator-availability.mjs check` fails on the same upstream rename
//     and names the measure, which is the cheaper diagnosis to reach for first.
//
//   - One target is the empty-state category. Mental Health has no measures (DECIDED-7),
//     so its report page renders a server-side sentence and app.js's bootstrap() returns
//     before wiring anything. A page that renders nothing is indistinguishable from a
//     template bug, and this is the target that tells them apart.
//
// IMPORTANT: this reads only DOM output, never the report page's internal names. The ten
// modules share one top-level scope so those names ARE reachable from an evaluate(); the
// rule is what keeps the harness valid across a refactor that renames them.
//
// It navigates straight to the real /ndhr/<cd>/<category>/ page, so it exercises the path
// the site serves. The Leaflet map is deliberately not clicked — that would make this a
// test of map hit-detection rather than of report rendering.
//
// One accordion panel is expanded per target, because charts render lazily: a harness that
// never expands one leaves the whole Vega path uncovered. What is asserted about the chart
// is structural — the renderer in use and whether each mark group painted — not the number
// of marks, which tracks EHDP-data row counts and would churn on every data refresh.
//
// Baselines are filed per EHDP-data branch, under ndhr-characterization-baseline/<branch>/,
// and the branch is read off the running server rather than passed in.
//
// THE TWO BRANCHES CURRENTLY CAPTURE IDENTICALLY — all four targets byte-for-byte, staging
// against production `[verified 2026-09-12]`. That is a consequence of what is captured,
// not a coincidence: every field here is site-owned. The row set comes from
// data/globals/NDHR_content/ and the demographics from data/globals/cdlist.json, both
// committed in THIS repo, and no captured field reads an indicator value. The NR harness's
// own justification does not transfer — staging carries two accordion ids production does
// not, because NR's rows come from a per-branch payload where these come from the YAML.
//
// The split is kept anyway, for a reason that does not depend on the two differing: a
// production-data environment gets a real check instead of a refusal, and that covers five
// of the eight environments. The mechanism that would make them diverge is live — a
// measure withdrawn on one branch changes what renders — so a single shared baseline would
// have to be re-captured on whichever branch moved and would then be wrong for the other.
//
// Usage (reuses a running dev server, or starts one — see dev-server.mjs):
//   npm run characterize:ndhr check
//   npm run characterize:ndhr baseline
//
// POSITIONAL ARGUMENTS, where the NR harness takes `-- --check`, and the departure is
// deliberate. PowerShell eats the `--` in `npm run x -- --flag` and npm then eats the
// flag NAME, so `npm run characterize:nr -- --check` reaches the script with no arguments
// at all — which, for a script that prints usage and exits, reads exactly like a check
// that ran. A bare positional survives both intact [measured 2026-08-26, npm 11.4.1].
// The three existing ndhr:* scripts already take positionals for this reason; an argument
// beginning with `-` is refused rather than half-honoured, as characterize-env.mjs does.

import { chromium } from 'playwright';
import { mkdirSync, rmSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDevServer } from './dev-server.mjs';
import { startServer } from './isolated-server.mjs';

// ----------------------------------------------------------------------- //
// configuration
// ----------------------------------------------------------------------- //

// Four category/district pairs, chosen to vary one axis at a time and to reach the two
// states no single ordinary page has:
//
//   climate-and-active-design is the ONLY category carrying all three geotypes — one CD
//   row, one CDTA2020, one PUMA2020 [verified 2026-09-12 against the content YAML], so it
//   is the single page that exercises every branch of geotypeTag() and geotypeSentence().
//
//   housing at two districts isolates district-driven content; climate and housing at
//   midtown isolates category-driven content. financial_district (CD1) is the second
//   district rather than an arbitrary one because its PUMA2020 is 4121, which merges CD1
//   with CD2 — so its two PUMA-sourced rows carry a value shared with a neighbouring
//   district, which is the case DECIDED-10 accepted and the tag exists to disclose.
//
//   mental-health has no measures at all. See the empty-state note in the header.
//
// Slugs match the `url:` frontmatter on the category markdown files and `page_name` in
// data/globals/cdlist.json.
const TARGETS = [
    { category: 'climate-and-active-design', district: 'midtown' },
    { category: 'housing',                   district: 'midtown' },
    { category: 'housing',                   district: 'financial_district' },
    { category: 'mental-health',             district: 'midtown' }
];

const BASELINE_ROOT = 'scripts/ndhr-characterization-baseline';
const CURRENT_ROOT  = 'scripts/ndhr-characterization-current';

// Console noise that predates this harness and is not a regression signal. Pagefind is
// not built by `hugo server` for a server this harness merely reused, so PagefindUI is
// legitimately absent; the rest is dev-only resource noise.
const KNOWN_NOISE = /pagefind|PagefindUI|favicon|Failed to load resource|net::ERR|frame-ancestors|docs\.google\.com/i;

// ----------------------------------------------------------------------- //
// capture
// ----------------------------------------------------------------------- //

// Collapses runs of whitespace so captures don't churn on template reindentation.
const tidy = (s) => (s ?? '').replace(/\s+/g, ' ').trim();

// Drops the environment's baseURL path prefix from a captured pathname, so one baseline
// checks from any environment serving the same data branch. Anchored to the start rather
// than a global replace: this field exists to catch a silent redirect to the 404 page,
// which is a change AFTER the prefix, and stripping every occurrence would also eat a
// prefix-shaped segment deeper in the path — the one way this could hide what it guards.
const stripBasePath = (pathname, baseURL) => {
    const prefix = new URL(baseURL).pathname.replace(/\/$/, '');
    if (!prefix || !pathname.startsWith(`${prefix}/`)) return pathname;
    return pathname.slice(prefix.length);
};

// Reads the rendered state of one category/district pair.
const captureTarget = async (browser, target, baseURL) => {

    const page = await browser.newPage();
    const consoleErrors = [];

    page.on('console', (msg) => {
        if (msg.type() === 'error' && !KNOWN_NOISE.test(msg.text())) consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
        if (!KNOWN_NOISE.test(err.message)) consoleErrors.push(`pageerror: ${err.message}`);
    });

    const url = `${baseURL}ndhr/${target.district}/${target.category}/`;

    await page.goto(url, { waitUntil: 'load', timeout: 30000 });

    // The rows are computed in the browser from several EHDP-data fetches, so wait for a
    // card to exist rather than for a fixed delay — but fail soft, because "nothing
    // rendered" is a result the baseline should record rather than an error that aborts.
    // Mental Health legitimately never satisfies this and spends the full timeout; it is
    // the last target for that reason.
    await page
        .waitForFunction(() => document.querySelector('.ndhr-report-accordion .card-header'), { timeout: 20000 })
        .catch(() => {});

    // ----- expand the first panel so the lazy chart path runs ----- //

    // onAccordionExpand renders on `shown.bs.collapse`, so the chart only exists after a
    // real expand. Failing soft matches the wait above.
    const firstPanel = page.locator('#ndhr-acc-1-h button');

    if (await firstPanel.count()) {
        await firstPanel.click().catch(() => {});
    }

    // Wait for Vega to paint rather than for a fixed delay. The chart fetches a topojson
    // from EHDP-data at render time, so this is the slowest step in the capture.
    await page
        .waitForFunction(() => {
            const embed = document.querySelector('.vega-embed');
            return !!embed && (embed.querySelector('svg.marks') || embed.querySelector('canvas'));
        }, { timeout: 30000 })
        .catch(() => {});

    // Let any remaining embeds settle after the first one paints.
    await page.waitForTimeout(1500);

    const captured = await page.evaluate(() => {

        const textOf = (id) => document.getElementById(id)?.textContent ?? null;

        // Scoped to the ndhr-acc- prefix: a bare `.collapse[id]` also matches site chrome
        // (the language menu, the primary nav), which would churn the baseline on
        // unrelated header edits.
        const accordions = [...document.querySelectorAll('[id^="ndhr-acc-"]')].map((el) => el.id).sort();

        // Row identity, in render order. These come from the content YAML in this repo,
        // not from EHDP-data, so they are stable across a data refresh in a way no
        // indicator value is — which is what makes a dropped row legible here.
        const indicatorNames = [...document.querySelectorAll('.ndhr-report-accordion .card-header button .col-7 .font-weight-bold')]
            .map((el) => el.textContent.trim());

        // The strategies column (Task 8). Read off the cell rather than off the config so
        // this captures what a reader sees, including the micro-label.
        const strategies = [...document.querySelectorAll('.ndhr-strategy-cell')]
            .map((el) => el.textContent.replace(/\s+/g, ' ').trim());

        // Per-row geography disclosure (DECIDED-10). '' for an ordinary CD row, so the
        // array's SHAPE is the assertion: one entry per card, in the same order as
        // indicatorNames, and a tag that stops rendering shows as a '' appearing
        // where a name was.
        const geotypeTags = [...document.querySelectorAll('.ndhr-report-accordion .card-header button .col-3')]
            .map((el) => {
                const tag = el.querySelector('.text-muted');
                return tag ? tag.textContent.trim() : '';
            });

        // The tertile sentence, which is the OTHER half of the pair geotypeTags records.
        // Added 2026-09-14 with plan Task 13: the defect that task fixed was this sentence
        // naming community districts on a row tagged "PUMA area", and the harness could see
        // the tag and not the sentence — so the contradiction was invisible to it. The
        // sentence is the row's screen-reader copy and lives in the only .sr-only inside a
        // header button; the panel's "Full dataset" sr-only is outside this scope.
        // '' for a row with no rank, which is a real state (a suppressed value renders N/A
        // and gets no sentence), so the array's shape is the assertion exactly as above
        const tertileSentences = [...document.querySelectorAll('.ndhr-report-accordion .card-header button')]
            .map((el) => {
                const sentence = el.querySelector('.sr-only');
                return sentence ? sentence.textContent.trim() : '';
            });

        // chartName reads the node that carries the name — `.vega-embed` itself has NO
        // aria-label, and reading it there is what left NR's chart naming uncovered for
        // three baselines. The spec's description lands on the inner .chart-wrapper, which
        // carries role="graphics-document"; selected by role because the role is what
        // assistive tech navigates by.
        //
        // hasCanvas/hasSvg pin the renderer: chart.js passes renderer: 'svg', and a silent
        // revert to vega-embed's canvas default would otherwise be invisible. `svg.marks`
        // is the scenegraph specifically — a bare `svg` also matches the action menu icon.
        //
        // markGroups records that each half of the vconcat painted, keyed by Vega's own
        // group class. Membership and a painted flag survive an EHDP-data refresh; child
        // counts do not.
        const charts = [...document.querySelectorAll('.vega-embed')].map((el) => {

            const marks = el.querySelector('svg.marks');

            return {
                chartName: el.querySelector('[role="graphics-document"]')?.getAttribute('aria-label') ?? null,
                actionsLabel: el.querySelector('details > summary')?.getAttribute('aria-label') ?? null,
                hasCanvas: !!el.querySelector('canvas'),
                hasSvg: !!marks,
                markGroups: marks
                    ? [...marks.querySelectorAll('g[class*="role-mark"]')]
                        .map((g) => ({ cls: g.getAttribute('class'), painted: g.children.length > 0 }))
                        .sort((a, b) => a.cls.localeCompare(b.cls))
                    : []
            };

        });

        // The server-rendered empty state, present only on a category with no measures.
        // Read from the accordion container's non-accordion sibling shape: #ndhr-indicators
        // exists only on the `if $measures` branch of the template, so its absence beside a
        // present #ndhr-accordion is exactly the empty-state branch.
        const indicatorsContainer = document.getElementById('ndhr-indicators');
        const accordionContainer = document.getElementById('ndhr-accordion');

        return {
            finalURL: window.location.pathname,
            headerDistrict: textOf('ndhr-header-district'),
            mobileDistrict: textOf('ndhr-mobile-district'),
            mobileTitle: textOf('ndhr-mobile-title'),
            reportHeader: textOf('ndhr-report-header'),
            demographics: textOf('ndhr-demographics'),
            // NDHR-only: the shared-ACS-area note, empty on the 51 districts the survey
            // reports on their own and filled on the 8 that share a PUMA2010 group
            demographicsNote: textOf('ndhr-demographics-note'),
            // NO ZIP LIST, unlike the NR harness: cdlist.json carries none, because
            // community districts are not ZIP-based
            accordionIds: accordions,
            accordionCount: accordions.length,
            indicatorNames,
            strategies,
            geotypeTags,
            tertileSentences,
            emptyStateRendered: !!accordionContainer && !indicatorsContainer,
            emptyStateText: (!!accordionContainer && !indicatorsContainer)
                ? accordionContainer.textContent
                : null,
            // Distinguishes "the panel opened and drew nothing" from "the click never
            // landed", which look identical in an empty charts array.
            expandedPanel: document.querySelector('#ndhr-acc-1-c.show') ? 'ndhr-acc-1-c' : null,
            charts,
            chartCount: charts.length,
            categoryLinkCount: document.querySelectorAll('.ndhr-category-link').length,
            mapPanes: document.querySelectorAll('#ndhr-map .leaflet-pane').length
        };

    });

    await page.close();

    return {
        ...captured,
        finalURL: stripBasePath(captured.finalURL, baseURL),
        headerDistrict: tidy(captured.headerDistrict),
        mobileDistrict: tidy(captured.mobileDistrict),
        mobileTitle: tidy(captured.mobileTitle),
        reportHeader: tidy(captured.reportHeader),
        demographics: tidy(captured.demographics),
        demographicsNote: tidy(captured.demographicsNote),
        emptyStateText: captured.emptyStateText === null ? null : tidy(captured.emptyStateText),
        // Whitespace-normalized like the rest, but null is PRESERVED rather than collapsed
        // to '': tidy() turning a missing attribute into an empty string is what made NR's
        // old .vega-embed read look like a captured value. An absent name must be visibly
        // absent.
        charts: captured.charts.map((c) => ({
            ...c,
            chartName: c.chartName === null ? null : tidy(c.chartName),
            actionsLabel: c.actionsLabel === null ? null : tidy(c.actionsLabel)
        })),
        consoleErrors
    };

};

// ----------------------------------------------------------------------- //
// baseline / check
// ----------------------------------------------------------------------- //

const fileFor = (dir, target) => join(dir, `${target.category}__${target.district}.json`);

// Which EHDP-data branch the running server is serving, or null if it could not be read.
//
// head.html declares `data_branch` as a top-level `let`, so it is reachable from an
// evaluate() but is NOT a window property — `window.data_branch` reads undefined. Read
// from the page rather than from a flag, because a flag can be wrong and --baseline
// cannot fail, so a mislabelled capture would install itself silently as the wrong
// reference.
const readServedBranch = async (browser, baseURL) => {

    const page = await browser.newPage();

    try {
        await page.goto(`${baseURL}ndhr/`, { waitUntil: 'load', timeout: 45000 });
        return await page.evaluate(() => (typeof data_branch === 'undefined' ? null : data_branch));
    } catch {
        return null;
    } finally {
        await page.close();
    }

};

// Reports the field-level differences between two captures.
const diff = (baseline, current) => {

    const changes = [];
    const keys = [...new Set([...Object.keys(baseline), ...Object.keys(current)])].sort();

    for (const key of keys) {
        const a = JSON.stringify(baseline[key]);
        const b = JSON.stringify(current[key]);
        if (a !== b) changes.push(`      ${key}:\n        baseline: ${a}\n        current:  ${b}`);
    }

    return changes;

};

// ----------------------------------------------------------------------- //
// rendered-content control
// ----------------------------------------------------------------------- //

// --baseline CANNOT FAIL on its own — it records whatever it finds, including four empty
// pages if a template change stopped the report rendering. This is what stands between
// that and a committed baseline: before writing, assert that the captures actually contain
// a rendered report.
//
// Modelled on the nr-a11y-audit rendered-content control and on the pagefind harness's
// refusal to baseline with a failing control. The NR characterization harness has neither
// and its --baseline genuinely cannot fail; that is the gap this closes rather than
// reproduces.
//
// Each assertion names a target so a failure says which page went empty. The empty-state
// target is asserted the other way round — it MUST have no cards — so a change that
// started rendering cards on a measure-less category fails here too.
const controlFailures = (captures) => {

    const failures = [];

    for (const { target, captured } of captures) {

        const label = `${target.category} / ${target.district}`;
        const isEmptyState = target.category === 'mental-health';

        if (isEmptyState) {

            if (!captured.emptyStateRendered) {
                failures.push(`${label}: expected the server-rendered empty state, found an indicator container`);
            }
            if (captured.accordionCount !== 0) {
                failures.push(`${label}: expected 0 accordions on a category with no measures, found ${captured.accordionCount}`);
            }
            if (!captured.emptyStateText) {
                failures.push(`${label}: the empty-state container rendered no text`);
            }

        } else {

            if (captured.accordionCount === 0) {
                failures.push(`${label}: no indicator cards rendered`);
            }
            if (captured.indicatorNames.length === 0) {
                failures.push(`${label}: no indicator names rendered`);
            }
            if (captured.strategies.length === 0) {
                failures.push(`${label}: no strategy cells rendered`);
            }
            if (captured.strategies.length !== captured.indicatorNames.length) {
                failures.push(
                    `${label}: ${captured.strategies.length} strategy cell(s) against ` +
                    `${captured.indicatorNames.length} indicator(s) — the columns must be row-aligned`
                );
            }
            if (captured.tertileSentences.length !== captured.indicatorNames.length) {
                failures.push(
                    `${label}: ${captured.tertileSentences.length} tertile slot(s) against ` +
                    `${captured.indicatorNames.length} indicator(s) — one per card, row-aligned`
                );
            }
            // A row with no rank legitimately has no sentence, so this cannot require all of
            // them to be non-empty. It requires at least one: an array of '' on every target
            // is what a dead selector returns, and would read as a passing field forever
            if (!captured.tertileSentences.some((s) => s)) {
                failures.push(`${label}: every tertile sentence is empty — the selector reads nothing`);
            }
            if (captured.chartCount === 0) {
                failures.push(`${label}: the expanded panel drew no chart, so the lazy Vega path is uncovered`);
            }

        }

        if (!captured.headerDistrict) {
            failures.push(`${label}: the district header is empty`);
        }

    }

    return failures;

};

const main = async () => {

    const argv = process.argv.slice(2);

    // Refuse a flag rather than ignore it. An argument merely ignored makes a typo
    // indistinguishable from the bare invocation — which is how a rebaseline script that
    // ignored `nosuchkey` began re-capturing every committed baseline [2026-08-26].
    const flagLike = argv.find((a) => a.startsWith('-'));

    if (flagLike) {
        console.error(
            `Refusing to run: "${flagLike}" looks like a flag, and this script takes positional ` +
            `arguments only.\nUsage: npm run characterize:ndhr check | baseline [environment]`
        );
        process.exitCode = 2;
        return;
    }

    const mode = argv[0] ?? null;

    if (mode !== 'baseline' && mode !== 'check') {
        console.error(
            `Usage: npm run characterize:ndhr check | baseline [environment]\n` +
            (mode === null ? '  (no mode given)' : `  (unrecognized mode "${mode}")`)
        );
        process.exitCode = 2;
        return;
    }

    // Optional second positional: a Hugo environment to spawn in isolation instead of
    // using whatever server is running. Validated against config/ on disk rather than
    // against a list written here, which would go stale the first time one is added.
    const environment = argv[1] ?? null;

    if (environment) {

        const configured = readdirSync('config', { withFileTypes: true })
            .filter((d) => d.isDirectory() && d.name !== '_default')
            .map((d) => d.name);

        if (!configured.includes(environment)) {
            console.error(
                `No config/${environment}/ in this repo. Environments: ${configured.sort().join(', ')}`
            );
            process.exitCode = 2;
            return;
        }

    }

    // ----- server: whichever one is running, or a named environment in isolation ----- //

    // With no environment named, this reuses a running dev server or starts one — the
    // ordinary case, and whatever branch that server happens to serve is what gets
    // captured. Naming one instead spawns it on :8090 with `-d` and HUGO_RESOURCEDIR
    // redirected outside the repo, which is the only way to capture a branch your machine
    // is not already serving: the production baseline has to come from somewhere, and
    // "switch your dev server over and remember to switch it back" is not a procedure.
    const { baseURL, stop } = environment
        ? await startServer(environment)
        : await ensureDevServer();

    const browser = await chromium.launch({ headless: true });

    // ----- data-branch gate ----- //

    // Everything below is filed under the served branch, so this resolves before a single
    // target is captured. An unreadable branch aborts rather than defaulting: a default
    // would file the capture somewhere plausible and wrong.
    const branch = await readServedBranch(browser, baseURL);

    if (!branch) {
        await browser.close();
        await stop();
        console.error(
            `\nREFUSING TO RUN — could not read the served EHDP-data branch from ${baseURL}.\n` +
            `Captures are filed per branch, so there is nowhere correct to put this one. ` +
            `Check that the server is up and that head.html still declares data_branch.`
        );
        process.exitCode = 2;
        return;
    }

    const baselineDir = join(BASELINE_ROOT, branch);
    const outDir = mode === 'baseline' ? baselineDir : join(CURRENT_ROOT, branch);

    if (mode === 'check' && !existsSync(baselineDir)) {
        await browser.close();
        await stop();
        console.error(
            `\nNO BASELINE for EHDP-data branch "${branch}" (looked in ${baselineDir}/).\n` +
            `Run --baseline against this server first, or point DE_BASE_URL at a server ` +
            `serving a branch that has one.`
        );
        process.exitCode = 1;
        return;
    }

    console.log(`Server: ${baseURL}  EHDP-data branch: ${branch}\n`);

    const captures = [];

    try {

        for (const target of TARGETS) {

            const label = `${target.category} / ${target.district}`;
            console.log(`Capturing ${label} ...`);

            captures.push({ target, captured: await captureTarget(browser, target, baseURL) });

        }

    } finally {
        await browser.close();
        await stop();
    }

    // ----- control, before anything is written ----- //

    const failures = controlFailures(captures);

    if (failures.length) {
        console.error('\nRENDERED-CONTENT CONTROL FAILED — refusing to write captures:');
        for (const f of failures) console.error(`  ${f}`);
        console.error(
            '\nA capture of four empty pages would install itself as a baseline that can ' +
            'never fail again. Fix the page, or the control, before re-running.'
        );
        process.exitCode = 2;
        return;
    }

    // Scoped to this branch's directory: clearing the root would delete the other branch's
    // baseline as a side effect of re-capturing this one.
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });

    let diffs = 0;

    for (const { target, captured } of captures) {

        const label = `${target.category} / ${target.district}`;

        writeFileSync(fileFor(outDir, target), `${JSON.stringify(captured, null, 2)}\n`);

        if (captured.consoleErrors.length) {
            console.error(`  console errors on ${label}:`);
            for (const e of captured.consoleErrors) console.error(`    ${e}`);
        }

        if (mode !== 'check') continue;

        const baselineFile = fileFor(baselineDir, target);

        if (!existsSync(baselineFile)) {
            console.error(`  NO BASELINE for ${label} — run --baseline first.`);
            diffs++;
            continue;
        }

        const changes = diff(JSON.parse(readFileSync(baselineFile, 'utf8')), captured);

        if (changes.length) {
            console.error(`  DIFF ${label}`);
            for (const c of changes) console.error(c);
            diffs++;
        } else {
            console.log(`  ok ${label}`);
        }

    }

    if (mode === 'baseline') {
        console.log(
            `\nBaseline written to ${baselineDir}/ (${TARGETS.length} target(s)), ` +
            `rendered-content control passed. Commit it.`
        );
        return;
    }

    if (diffs) {
        console.error(`\nNDHR characterization FAILED — ${diffs} of ${TARGETS.length} target(s) differ.`);
        process.exitCode = 1;
    } else {
        console.log(`\nNDHR characterization PASSED — ${TARGETS.length} target(s) match baseline.`);
    }

};

await main();
