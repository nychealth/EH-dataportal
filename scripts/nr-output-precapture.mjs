// Capture what the OLD nr-output pages render, before they are deleted.
//
// Option D replaces 252 content-file-backed pages with adapter-generated ones in a single
// commit — the generated pages occupy the same paths, so the two cannot coexist for
// comparison. That removes the usual rollback. This script buys it back: it records, from a
// built site, the content that must survive the swap, so the generated pages can be checked
// against it afterwards.
//
// Capture only. There is deliberately no --check mode: the generated pages have different
// markup, so their extractor has to be written against pages that do not exist yet. What this
// guarantees is that the *data* to compare against still exists once nr-output is gone.
//
// Usage:  node scripts/nr-output-precapture.mjs <built-site-dir> [ga-csv-path]
//
// Build the site with a COLD remote cache — config sets caches.getresource maxAge = -1
// (cache forever), so a warm build records whatever was cached locally rather than what
// EHDP-data currently serves:
//
//   npx hugo --environment production --ignoreCache -d <dir>
//
// A warm build of this site takes ~4s and a cold one ~32s; if the build was fast, the
// capture is of the cache, not of the data.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(REPO_ROOT, "scripts", "nr-output-precapture");
const OUT_FILE = join(OUT_DIR, "capture.json");

const siteDir = process.argv[2];
const gaCsv = process.argv[3];

if (!siteDir || !existsSync(siteDir)) {
    console.error("usage: node scripts/nr-output-precapture.mjs <built-site-dir> [ga-csv-path]");
    process.exit(1);
}

// ----------------------------------------------------------------------- //
// html helpers
// ----------------------------------------------------------------------- //

// Hugo emits attributes and closing brackets across line breaks, so every pattern below
// would need \s* in a dozen places. Collapsing whitespace once is cheaper and less fragile.
const flatten = html => html.replace(/\s+/g, " ");

const stripTags = s => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const decode = s => s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(d))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

const clean = s => decode(stripTags(s));

const first = (flat, re) => {
    const m = flat.match(re);
    return m ? clean(m[1]) : null;
};

// ----------------------------------------------------------------------- //
// per-page extraction
// ----------------------------------------------------------------------- //

// The four things §11 names as having to survive, plus the report-topic scaffolding that
// carries the written prose.
function extractReportPage(html) {
    const flat = flatten(html);

    const neighborhood = first(flat, /<span class="h2 sub-title text-primary">([^<]*)</);
    const zips = first(flat, /<span id="zips">([^<]*)/);

    // Report-topic headings and their prose, in document order.
    const reportTopics = [];
    const topicRe = /<h3 class="h4 fs-rg">(.*?)<\/h3>\s*<p class="fs-sm">(.*?)<\/p>/g;
    for (const m of flat.matchAll(topicRe)) {
        reportTopics.push({ heading: clean(m[1]), description: clean(m[2]) });
    }

    // Indicator cards. Split on the header anchors, then read each card's slice up to the
    // next one, so a pattern cannot stray across card boundaries.
    const headings = [...flat.matchAll(/id="heading-([A-Za-z0-9_.-]+)"/g)];
    const indicators = [];
    headings.forEach((h, i) => {
        const start = h.index;
        const end = i + 1 < headings.length ? headings[i + 1].index : flat.length;
        const slice = flat.slice(start, end);
        indicators.push({
            key: h[1],
            shortName: first(slice, /<span class="font-weight-bold fs-md" ?>(.*?)<\/span/),
            longName: first(slice, /<span class="fs-sm font-weight-normal" ?>(.*?)<\/span/),
            description: first(slice, /<p class="fs-md mt-1 mb-2">(.*?)<\/p>/),
            // Scoped to the card slice on purpose: the demographics sidebar carries its own
            // "Source:" line, but it sits before the first heading anchor and so is excluded.
            sourceList: first(slice, /<strong>Source:<\/strong>(.*?)<\/(?:p|div|span)>/i)
        });
    });

    const ehdpUrls = [...new Set(
        [...flat.matchAll(/https:\/\/raw\.githubusercontent\.com\/nychealth\/EHDP-data\/[^"' ]+/g)]
            .map(m => m[0].replace(/[.,)]+$/, ""))
    )].sort();

    return { neighborhood, zips, reportTopics, indicators, ehdpUrls };
}

// The neighborhood landing page: name, zips, and the five topic cards it links to.
function extractIndexPage(html) {
    const flat = flatten(html);
    const cardTitles = [...flat.matchAll(/<h2 class="card-title[^"]*">(.*?)<\/h2>/g)].map(m => clean(m[1]));
    return {
        neighborhood: first(flat, /<span class="sub-title">([^<]*)</) || first(flat, /<h1 class="report-title[^"]*"[^>]*>(.*?)<\/h1>/),
        zips: first(flat, /<span id="zips">([^<]*)/),
        topicCards: cardTitles,
        topicLinks: [...new Set([...flat.matchAll(/href="[^"]*\/neighborhood-reports\/([a-z_]+)\/"/g)].map(m => m[1]))].sort()
    };
}

// ----------------------------------------------------------------------- //
// traffic ranking (optional)
// ----------------------------------------------------------------------- //

// GA4 landing-page export: nine comment lines, then a header row. Sessions is column 2.
function loadTraffic(csvPath) {
    if (!csvPath || !existsSync(csvPath)) return null;
    const lines = readFileSync(csvPath, "utf8").split(/\r?\n/).filter(l => l && !l.startsWith("#"));
    const header = lines.shift().split(",");
    const sessionsIdx = header.indexOf("Sessions");
    const traffic = new Map();
    for (const line of lines) {
        const cols = line.split(",");
        const path = cols[0];
        if (!path || !path.includes("/neighborhood-reports/")) continue;
        // Scanner-probe URLs carry injection strings; they are one session each and not real.
        if (/['"<>&]/.test(path)) continue;
        const key = path.replace(/^\/IndicatorPublic\//, "").replace(/\/$/, "");
        traffic.set(key, (traffic.get(key) || 0) + Number(cols[sessionsIdx] || 0));
    }
    return traffic;
}

// ----------------------------------------------------------------------- //
// walk the built site
// ----------------------------------------------------------------------- //

const nrRoot = join(siteDir, "neighborhood-reports");
if (!existsSync(nrRoot)) {
    console.error(`no neighborhood-reports/ under ${siteDir} — is this a built site?`);
    process.exit(1);
}

const TOPIC_SLUGS = new Set([
    "active_design_physical_activity_and_health",
    "asthma_and_the_environment",
    "climate_and_health",
    "housing_and_health",
    "outdoor_air_and_health"
]);

const traffic = loadTraffic(gaCsv);
const reportPages = {};
const indexPages = {};
const indicatorLibrary = {};
const collisions = [];

for (const entry of readdirSync(nrRoot)) {
    const dir = join(nrRoot, entry);
    if (!statSync(dir).isDirectory()) continue;
    // Topic-slug directories are the SPA pages, not nr-output neighborhoods.
    if (TOPIC_SLUGS.has(entry)) continue;

    const indexHtml = join(dir, "index.html");
    if (existsSync(indexHtml)) {
        indexPages[entry] = extractIndexPage(readFileSync(indexHtml, "utf8"));
        const t = traffic?.get(`neighborhood-reports/${entry}`);
        if (t !== undefined) indexPages[entry].sessions = t;
    }

    for (const topic of readdirSync(dir)) {
        const page = join(dir, topic, "index.html");
        if (!TOPIC_SLUGS.has(topic) || !existsSync(page)) continue;

        const data = extractReportPage(readFileSync(page, "utf8"));
        const key = `${entry}/${topic}`;

        // Indicator name/description are indicator metadata, so they should be identical
        // across all 42 neighborhoods. Dedupe into a library to keep the artifact small —
        // but prove the assumption rather than silently keeping whichever came last.
        const indicatorKeys = [];
        for (const ind of data.indicators) {
            const libKey = `${topic}/${ind.key}`;
            const value = { shortName: ind.shortName, longName: ind.longName, description: ind.description, sourceList: ind.sourceList };
            const existing = indicatorLibrary[libKey];
            if (existing && JSON.stringify(existing) !== JSON.stringify(value)) {
                collisions.push({ libKey, page: key, existing, value });
            }
            indicatorLibrary[libKey] = value;
            indicatorKeys.push(ind.key);
        }

        reportPages[key] = {
            neighborhood: data.neighborhood,
            zips: data.zips,
            reportTopics: data.reportTopics,
            indicatorKeys,
            indicatorCount: indicatorKeys.length,
            ehdpUrls: data.ehdpUrls,
            sessions: traffic?.get(`neighborhood-reports/${key}`)
        };
    }
}

// A collision means the library dedupe is lossy and the artifact cannot be trusted.
if (collisions.length) {
    console.error(`\nFAIL — ${collisions.length} indicator metadata collision(s); the dedupe assumption does not hold.`);
    for (const c of collisions.slice(0, 5)) console.error(`  ${c.libKey} on ${c.page}\n    was: ${JSON.stringify(c.existing)}\n    now: ${JSON.stringify(c.value)}`);
    process.exit(1);
}

// Rank report pages by sessions so the top-20 §11 asks about are identifiable in the artifact.
const ranked = Object.entries(reportPages)
    .filter(([, v]) => typeof v.sessions === "number")
    .sort((a, b) => b[1].sessions - a[1].sessions);
ranked.forEach(([k], i) => { reportPages[k].trafficRank = i + 1; });

const capture = {
    capturedAt: new Date().toISOString(),
    commit: execSync("git rev-parse HEAD", { cwd: REPO_ROOT, encoding: "utf8" }).trim(),
    environment: "production",
    note: "Built with --ignoreCache so build-time EHDP-data fetches were live, not cached.",
    counts: {
        reportPages: Object.keys(reportPages).length,
        indexPages: Object.keys(indexPages).length,
        indicatorsInLibrary: Object.keys(indicatorLibrary).length
    },
    trafficSource: gaCsv ? gaCsv.replace(/\\/g, "/") : null,
    top20: ranked.slice(0, 20).map(([k, v]) => ({ page: k, sessions: v.sessions })),
    indicatorLibrary,
    reportPages,
    indexPages
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(capture, null, 2) + "\n");

console.log(`captured ${capture.counts.reportPages} report pages, ${capture.counts.indexPages} neighborhood indexes`);
console.log(`indicator library: ${capture.counts.indicatorsInLibrary} entries, no collisions`);
console.log(`top page: ${capture.top20[0]?.page} (${capture.top20[0]?.sessions} sessions)`);
console.log(`written to scripts/nr-output-precapture/capture.json`);
