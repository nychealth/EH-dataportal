// The JavaScript inside a Hugo layout, in a form espree can read. Shared by
// js-brace-padding.mjs, which edits it, and js-comment-spacing-verify.mjs, which
// proves an edit changed no token — both must read a layout the same way.


// ----- Hugo actions masked, keeping every offset and line number ----- //

// `{{ … }}` becomes `/*___*/` by default: string text inside a JS string, a comment
// outside one. An action standing in for a value — `const x = {{ .Data | jsonify }};`
// — leaves nothing to parse as a comment, so `asValue` turns single-line actions into
// a same-length identifier `____` instead. Multi-line actions stay comments either way
export const maskHugo = (text, asValue = false) =>
    text.replace(/\{\{[\s\S]*?\}\}/g, (m) =>
        asValue && !m.includes("\n")
            ? "_".repeat(m.length)
            : "/*" + m.slice(2, -2).replace(/[^\n]/g, "_") + "*/");


// ----- <script> bodies, as [startLine, endLine) pairs ----- //

// Found on the masked file, so a Hugo comment that mentions <script> is not one. A
// src-only script has no body; a JSON or template script is not JavaScript
export const scriptRegions = (source) => {

    const lines = maskHugo(source.replace(/\r\n/g, "\n")).split("\n");
    const out = [];
    let start = null;

    lines.forEach((l, i) => {

        const low = l.toLowerCase();

        if (start === null && low.includes("<script") && !low.includes("</script")) {
            start = /type=["']?(application\/(ld\+)?json|text\/template)/.test(low) ? -1 : i + 1;
        } else if (start !== null && low.includes("</script")) {
            if (start >= 0) out.push([start, i]);
            start = null;
        }

    });

    return out;

};
