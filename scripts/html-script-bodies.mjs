// The JavaScript inside a Hugo layout, in a form espree can read. Shared by
// js-brace-padding.mjs, which edits it, and js-comment-spacing-verify.mjs, which
// proves an edit changed no token — both must read a layout the same way.


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
