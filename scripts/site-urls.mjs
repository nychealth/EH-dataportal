// Enumerate every page URL the site serves, for the smoke test's --all mode.
// Returns prefix-relative paths, so callers can join them onto the same baseURL
// ensureDevServer() handed them.
//
// The set is built from three sources because no single one is complete:
//   - sitemap.xml covers real content pages, in all three languages.
//   - Paginator pages (`page/2/`, `page/3/`, ...) are NOT in the sitemap. Hugo
//     reports them in its build summary but exposes no list, so they are found
//     by probing.
//   - 404.html is in neither, and is a real template that loads the shared JS.
//
// Every run prints its own breakdown, so the total can be checked against Hugo's
// build summary rather than trusted once and assumed stable.

// Ceiling on the paginator walk. Nothing on this site comes close (the largest
// taxonomy ran to page/6/ when this was written), but an unbounded loop against
// a misbehaving server would hang the run rather than fail it.
const MAX_PAGINATOR_PAGES = 50;

// Requests in flight during enumeration. These are HEAD/GET against a local
// server with no browser involved, so this is far higher than the browser-side
// concurrency and still cheap.
const PROBE_CONCURRENCY = 20;

// Run `fn` over `items` with at most `limit` in flight. Results are returned in
// input order. Shared with smoke-pages.mjs, which needs the same shape for its
// browser workers.
export async function mapPool(items, limit, fn) {
    const results = new Array(items.length);
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const i = next++;
            results[i] = await fn(items[i], i);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
}

// All <loc> values in a sitemap document. The three sitemap files are generated
// by Hugo from a template in this repo, so their shape is fixed and a regex is
// enough — an XML dependency would not buy anything here.
const extractLocs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

// Convert a sitemap <loc> — either an absolute URL or a RelPermalink — into a
// path relative to baseURL's own prefix.
//
// The absolute form embeds the *config's* baseURL, which is not necessarily the
// server being tested (DE_BASE_URL can point anywhere). Only the pathname is
// used, so the host in the sitemap is discarded rather than followed.
const toRelative = (loc, prefix) => {
    const pathname = loc.startsWith("http") ? new URL(loc).pathname : loc;
    return pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname.replace(/^\//, "");
};

const status = async (url, method) => {
    try {
        const res = await fetch(url, { method });
        return res.status;
    } catch {
        return 0;
    }
};

// Walk `page/2/`, `page/3/`, ... under one path until the server stops serving
// them. HEAD is enough to tell a real paginator page from Hugo's 404 (verified
// against this site: page/2/ -> 200, page/99/ -> 404).
const paginatorPathsFor = async (baseURL, path) => {
    const found = [];
    for (let n = 2; n <= MAX_PAGINATOR_PAGES; n++) {
        const sub = `${path}page/${n}/`;
        if (await status(baseURL + sub, "HEAD") !== 200) break;
        found.push(sub);
    }
    return found;
};

export async function collectAllPaths(baseURL) {

    const prefix = new URL(baseURL).pathname;

    // The root sitemap is a <sitemapindex> pointing at one sitemap per language.
    const indexXml = await fetch(baseURL + "sitemap.xml").then((r) => r.text());
    const languageSitemaps = extractLocs(indexXml).map((loc) => baseURL + toRelative(loc, prefix));

    if (!languageSitemaps.length) {
        throw new Error(`No <loc> entries in ${baseURL}sitemap.xml — cannot enumerate the site.`);
    }

    // Content pages, all languages. A Set because a page translated into every
    // language appears once per language sitemap only under its own path, but
    // deduplicating costs nothing and protects against config changes.
    const contentPaths = new Set();
    for (const url of languageSitemaps) {
        const xml = await fetch(url).then((r) => r.text());
        for (const loc of extractLocs(xml)) contentPaths.add(toRelative(loc, prefix));
    }

    // Probe every content path rather than only the taxonomy sections known to
    // paginate. One extra HEAD per path is cheap against a local server, and it
    // removes any assumption about which templates use .Paginator — an
    // assumption that would fail silently the day a new section adds one.
    const walks = await mapPool([...contentPaths], PROBE_CONCURRENCY, (p) => paginatorPathsFor(baseURL, p));
    const paginatorPaths = walks.flat();

    // 404.html is served directly (200 when requested by name) and renders
    // through the same head.html as every other page.
    const extraPaths = ["404.html"];

    const all = [...contentPaths, ...paginatorPaths, ...extraPaths];

    console.log(
        `Enumerated ${all.length} pages = ${contentPaths.size} sitemap ` +
        `+ ${paginatorPaths.length} paginator + ${extraPaths.length} extra ` +
        `(from ${languageSitemaps.length} language sitemaps)`
    );

    return all;
}
