// ----------------------------------------------------------------------- //
//
// site-characterization-summary.mjs
//
// Turns the two projected record trees that project() writes into
// .sc-check/base and .sc-check/head into a field-level summary: which fields
// moved, on how many pages, and what the change looks like.
//
// The raw `git diff` the check prints is fine for the three-page case and bad
// for the common one — a template edit moves one field on all 925 pages, and
// the log becomes 925 near-identical hunks with no sentence saying it is one
// field.
//
// Reads the JSON rather than parsing the diff text, deliberately: recovering a
// dotted field path from `-            "missingAlt": 3,` means reconstructing
// nesting from indentation, which the objects already carry.
//
// Consumed by site-characterization.mjs. The caller supplies the record list
// because it already has walk(); importing walk from there would make the two
// modules circular.
//
// ----------------------------------------------------------------------- //

import { existsSync, readFileSync } from "node:fs";

// ----------------------------------------------------------------------- //
// flattening
// ----------------------------------------------------------------------- //

// Objects recurse into dotted paths; arrays stop, because an array is one
// finding rather than N. `assets` gaining an entry should read as one changed
// field, not as an insertion at index 7 plus 23 shifted neighbours.
const flatten = (value, prefix, out) => {

    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        out.set(prefix, value);
        return out;
    }

    for (const [k, v] of Object.entries(value)) {
        flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }

    return out;
};

// ----------------------------------------------------------------------- //
// describing one change
// ----------------------------------------------------------------------- //

const show = (list, sign) => list.slice(0, 3).map((x) => sign + x).join(" ")
    + (list.length > 3 ? ` (+${list.length - 3} more)` : "");

// Three array shapes need three treatments, and using one for all of them is
// how a real change reads as noise. `assets` is an unordered set of strings, so
// membership is the finding. `headingLevels` is a SEQUENCE of repeating numbers
// where a set delta says almost nothing — one 3 becoming a 4 leaves 3 in the
// set — so position is the finding. `jsonld` holds objects, where neither
// applies and the count is what a reader can act on.
const describe = (before, after) => {

    if (Array.isArray(before) && Array.isArray(after)) {

        const isNum = (a) => a.every((x) => typeof x === "number");

        if (isNum(before) && isNum(after)) {
            if (before.length !== after.length) {
                return `${before.length} entries -> ${after.length}`;
            }
            const i = before.findIndex((v, j) => v !== after[j]);
            return `${before.length} entries, first change at index ${i}: ${before[i]} -> ${after[i]}`;
        }

        const isStr = (a) => a.every((x) => typeof x === "string");

        if (isStr(before) && isStr(after)) {
            const added = after.filter((x) => !before.includes(x));
            const removed = before.filter((x) => !after.includes(x));
            if (!added.length && !removed.length) {
                return `reordered (${before.length} entries)`;
            }
            return [removed.length ? show(removed, "-") : "", added.length ? show(added, "+") : ""]
                .filter(Boolean).join("  ");
        }

        return `${before.length} entries -> ${after.length}`;
    }

    return `${JSON.stringify(before)} -> ${JSON.stringify(after)}`;
};

// ----------------------------------------------------------------------- //
// comparing the two trees
// ----------------------------------------------------------------------- //

// `rels` is the union of both trees' record paths. A record on one side only is
// a page that appeared or vanished, which is a regression in its own right and
// must not be silently skipped — that is the failure this whole harness exists
// against.
export const summarize = (baseDir, headDir, rels) => {

    const rows = [];

    for (const rel of rels) {

        const basePath = `${baseDir}/${rel}`;
        const headPath = `${headDir}/${rel}`;
        const inBase = existsSync(basePath);
        const inHead = existsSync(headPath);

        if (!inBase || !inHead) {
            rows.push({
                page: rel.replace(/(\/index)?\.json$/, "").replace(/^_home$/, ""),
                field: "(whole page)",
                text: inBase ? "in the baseline, absent from this run" : "new, absent from the baseline",
            });
            continue;
        }

        const baseRec = JSON.parse(readFileSync(basePath, "utf8"));
        const headRec = JSON.parse(readFileSync(headPath, "utf8"));
        const page = headRec.path ?? baseRec.path ?? rel;

        const b = flatten(baseRec, "", new Map());
        const h = flatten(headRec, "", new Map());

        for (const key of new Set([...b.keys(), ...h.keys()])) {

            // `path` is the record's identity, not a finding about it.
            if (key === "path") continue;

            const bv = b.get(key);
            const hv = h.get(key);
            if (JSON.stringify(bv) === JSON.stringify(hv)) continue;

            rows.push({ page, field: key, text: describe(bv, hv) });
        }
    }

    return rows;
};

// ----------------------------------------------------------------------- //
// the shape of the change
// ----------------------------------------------------------------------- //

// The fields EHDP-data can move on its own. Task 8's cross-environment
// measurement is the only calibration there is for this: comparing the
// `staging` and `prod_prod` baselines, `controls` moved on 95 pages,
// `headingLevels` on 86 and `links` on 84 from the data branch, while `meta`
// moved on all 925 from the environment-NAME axis rather than from the data
// `[2026-08-24]`. Nothing else in `structure` has a data path to it.
//
// Calibration, not a rule — it was measured across two environments, not across
// two states of one.
const DATA_SENSITIVE = ["structure.controls", "structure.links", "structure.headingLevels"];

// The single most diagnostic thing about a red run, and it costs nothing to
// compute. Two axes, and only one of them is worth reading at small page
// counts: the PAGE SET says which template, and the FIELD SET says whether
// EHDP-data could have done it. Page count alone says nothing about the data
// question — a data change is a large, field-concentrated move, not a scatter —
// so this reports the two separately rather than inferring one from the other.
export const shapeOf = (rows, totalPages) => {

    const pages = new Set(rows.map((r) => r.page));
    if (!pages.size) return "";

    const fields = new Set(rows.map((r) => r.field));
    const dataish = (f) => DATA_SENSITIVE.some((d) => f === d || f.startsWith(d + "."));

    let where;

    if (pages.size === totalPages) {
        where = `EVERY page (${totalPages}). Look at baseof.html, head.html, the header or footer `
            + `partials, or a globally loaded asset — nothing else reaches all of them.`;
    } else {
        const sections = new Set([...pages].map((p) => (p || "").split("/")[0] || "(home)"));
        if (sections.size === 1) {
            where = `confined to ${[...sections][0]}/ — ${pages.size} of ${totalPages} pages. Look `
                + `at that section's layout folder, or the .Section gate in head.html.`;
        } else {
            where = `${pages.size} of ${totalPages} pages across ${sections.size} sections `
                + `(${[...sections].sort().join(", ")}).`;
        }
    }

    // Below this the page set carries no signal at all — a handful of pages is
    // as consistent with one content edit as with anything else, and a shape
    // sentence asserted over 3 pages reads as a finding when it is noise.
    const SHAPE_FLOOR = 5;
    if (pages.size < SHAPE_FLOOR && pages.size !== totalPages) {
        where = `${pages.size} of ${totalPages} pages — too few to infer a template from.`;
    }

    const moved = [...fields];
    const why = moved.every(dataish)
        ? `Every changed field is one EHDP-data can move on its own (${DATA_SENSITIVE.join(", ")}), `
          + `so this may not be your change at all — re-run the check at the merge base to find out.`
        : moved.some(dataish)
            ? `Some changed fields are ones EHDP-data can move on its own; the rest have no data `
              + `path and point at this repo.`
            : `No changed field has a data path to it, so this is a change in this repo.`;

    return `Shape: ${where}\nFields: ${why}`;
};

// ----------------------------------------------------------------------- //
// rendering
// ----------------------------------------------------------------------- //

// Grouped by field rather than by page, because the question a reader arrives
// with is "what moved", and the page count beside it answers "how widely".
const group = (rows) => {

    const byField = new Map();

    for (const r of rows) {
        if (!byField.has(r.field)) byField.set(r.field, []);
        byField.get(r.field).push(r);
    }

    return [...byField.entries()]
        .map(([field, rs]) => ({ field, pages: new Set(rs.map((r) => r.page)).size, example: rs[0] }))
        .sort((a, b) => b.pages - a.pages || a.field.localeCompare(b.field));
};

export const renderText = (rows, totalPages) => {

    if (!rows.length) return "";

    const grouped = group(rows);
    const pages = new Set(rows.map((r) => r.page)).size;
    const w = Math.max(20, ...grouped.map((g) => g.field.length));

    const lines = [
        "",
        `${pages} of ${totalPages} page(s) differ, across ${grouped.length} field(s):`,
        "",
        `  ${"FIELD".padEnd(w)}  PAGES  EXAMPLE`,
    ];

    for (const g of grouped) {
        lines.push(`  ${g.field.padEnd(w)}  ${String(g.pages).padStart(5)}  `
            + `${g.example.page || "(home)"} — ${g.example.text}`);
    }

    const shape = shapeOf(rows, totalPages);
    if (shape) lines.push("", shape);

    return lines.join("\n");
};

export const renderMarkdown = (rows, totalPages) => {

    if (!rows.length) return "";

    const grouped = group(rows);
    const pages = new Set(rows.map((r) => r.page)).size;

    const lines = [
        `### Characterization check FAILED`,
        "",
        `**${pages} of ${totalPages} pages differ**, across ${grouped.length} field(s).`,
        "",
        "| Field | Pages | Example page | Change |",
        "|---|---:|---|---|",
    ];

    for (const g of grouped) {
        lines.push(`| \`${g.field}\` | ${g.pages} | \`${g.example.page || "(home)"}\` `
            + `| ${g.example.text.replace(/\|/g, "\\|")} |`);
    }

    const shape = shapeOf(rows, totalPages);
    if (shape) lines.push("", shape);

    return lines.join("\n") + "\n";
};
