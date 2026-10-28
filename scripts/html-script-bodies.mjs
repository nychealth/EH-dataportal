// The JavaScript inside a Hugo layout, in a form espree can read. Shared by the sweep
// tools that edit it (js-brace-padding, js-guard-braces, js-semicolons) and the
// verifiers that prove an edit (js-comment-spacing-verify, js-guard-braces-verify) —
// all must read a layout the same way.


// ----- Hugo actions masked, keeping every offset and line number ----- //

// Each action is masked by its role. A control action (`if`, `range`, `end`, a `$x :=`
// assignment, a `{{/* */}}` comment …) renders no JS of its own, so it becomes a
// same-length comment `/*___*/`. Any other single-line action renders a value —
// `const x = {{ .Data | jsonify }}`, `return {{ .x }}` — so it becomes a same-length
// identifier `____`. Masking every action in a body one way misreads the other kind:
// as comments, `return {{ .x }}` is a bare `return`; as values, `{{- end }}` is a
// statement that takes a `;`. A multi-line action stays a comment
const CONTROL_ACTION = /^(?:(?:if|else|end|range|with|define|block|break|continue)\b|\$[A-Za-z_]\w*\s*:?=|\/\*)/;

const isControl = (action) => CONTROL_ACTION.test(action.slice(2, -2).replace(/^-?\s*/, ""));

export const maskHugo = (text) =>
    text.replace(/\{\{[\s\S]*?\}\}/g, (m) =>
        m.includes("\n") || isControl(m)
            ? "/*" + m.slice(2, -2).replace(/[^\n]/g, "_") + "*/"
            : "_".repeat(m.length));


// ----- <script> bodies, as [startLine, endLine) pairs ----- //

// Found on the masked file, so a Hugo comment that mentions <script> is not one. A
// src-only script has no body; a JSON or template script is not JavaScript. An
// opening tag split over several lines is read to its `>` before deciding either:
// a Datawrapper embed's attributes, one per line, are not a body
export const scriptRegions = (source) => {

    const lines = maskHugo(source.replace(/\r\n/g, "\n")).split("\n");
    const out = [];
    let start = null;
    let openTag = null;

    // The opening tag is complete: no body if `</script>` follows on the same line
    const closeTag = (tag, i) => {

        if (tag.includes("</script")) return null;

        return /type=["']?(application\/(ld\+)?json|text\/template)/.test(tag) ? -1 : i + 1;

    };

    lines.forEach((l, i) => {

        const low = l.toLowerCase();

        if (openTag !== null) {

            openTag += " " + low;

            if (low.includes(">")) {
                start = closeTag(openTag, i);
                openTag = null;
            }

        } else if (start === null && low.includes("<script") && !low.includes("</script")) {

            const tag = low.slice(low.indexOf("<script"));

            if (tag.includes(">")) {

                start = closeTag(tag, i);

            } else {

                openTag = tag;

            }

        } else if (start !== null && low.includes("</script")) {
            if (start >= 0) out.push([start, i]);
            start = null;
        }

    });

    return out;

};


// ----- the JS bodies of one sweep target ----- //

// A .js file is one body; a layout has one per <script>, read with its Hugo actions
// masked. `lines` is the file split on "\n" once CRLF is normalized, and each body's
// [start, end) indexes it. `source` is what to parse, `text` what to edit
export const jsBodies = (path, raw, lines) => {

    const isHtml = path.endsWith(".html");
    const regions = isHtml ? scriptRegions(raw) : [[0, lines.length]];

    return regions.map(([start, end]) => {

        const text = lines.slice(start, end).join("\n");

        return { start, end, text, source: isHtml ? maskHugo(text) : text };

    });

};


// ----- offsets to line numbers in one source ----- //

// lineOf(offset) is the 0-based line holding that offset
export const lineIndex = (source) => {

    const lineStarts = [0];
    for (let i = 0; i < source.length; i++) if (source[i] === "\n") lineStarts.push(i + 1);

    const lineOf = (offset) => {
        let lo = 0, hi = lineStarts.length - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (lineStarts[mid] <= offset) lo = mid; else hi = mid - 1;
        }
        return lo;
    };

    return { lineStarts, lineOf };

};


// ----- bodies no sweep tool can parse, on purpose ----- //

// Each is left untouched and reported, but does not fail a run, so that exit 0 means
// clean. Fixed by hand when its rule changes; an entry that starts to parse fails the
// run, so a file cannot stay listed after it is fixed
export const KNOWN_UNPARSEABLE = new Map([
    ["themes/dohmh/layouts/partials/render-table.html", "its {{ if }}…{{ else }}…{{ end }} sits inside a JS value"],
]);

// Prints a run's parse failures ("<path>[:line]  <message>"), known entries apart from
// new ones. Returns true when the run should fail: a new failure, or a known entry
// among `targets` that parsed
export const reportUnparseable = (failures, targets) => {

    const pathOf = (f) => f.match(/^[^:\s]+/)[0];

    const known = failures.filter((f) => KNOWN_UNPARSEABLE.has(pathOf(f)));
    const unknown = failures.filter((f) => !KNOWN_UNPARSEABLE.has(pathOf(f)));

    const failed = new Set(known.map(pathOf));
    const stale = [...KNOWN_UNPARSEABLE.keys()].filter((p) => targets.includes(p) && !failed.has(p));

    known.forEach((f) => console.log(`\nKnown unparseable, left untouched (${KNOWN_UNPARSEABLE.get(pathOf(f))}):\n  ${f}`));

    if (unknown.length) {
        console.log(`\n${unknown.length} script bodies could not be parsed and were left untouched:`);
        unknown.forEach((f) => console.log(`  ${f}`));
    }

    if (stale.length) {
        console.log(`\nListed in KNOWN_UNPARSEABLE (html-script-bodies.mjs) but parsed; remove the entry:`);
        stale.forEach((p) => console.log(`  ${p}`));
    }

    return unknown.length > 0 || stale.length > 0;

};
