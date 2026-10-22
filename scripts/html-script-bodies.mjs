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
