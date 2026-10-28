// The files a JS formatting sweep may edit, shared by js-brace-padding.mjs and
// js-guard-braces.mjs. scripts/js-comment-spacing.py keeps its own copy of these
// three lists; change them in both.
//
// Targets come from `git ls-files`, never a directory walk, so a sweep cannot edit an
// untracked file its `git diff` proof would not show.

import { execFileSync } from "node:child_process";


// ----- what is not ours to restyle ----- //

// Vendored third-party files, and the two generated crosswalks, which
// documents/js-conventions.md § Scope leaves exactly as they arrive. Hand-maintained:
// a file added after this list was written will be reformatted like our own
export const VENDORED = new Set([
    "assets/js/L.colorIcon.js",
    "assets/js/ccd-to-uhf42.js",
    "assets/js/cd-to-uhf42.js",
    "assets/js/color-convert.js",
    "assets/js/naturalSort.js",
    "content/data-features/healthy-homes-info/source/assets/js/bootstrap.js",
    "content/data-features/healthy-homes-info/source/assets/js/plugins.js",
    "content/data-features/healthy-homes-info/source/assets/js/popper.js",
]);

// The retiring explorer, exempt in documents/js-conventions.md § Scope
export const EXEMPT_DIRS = [
    "assets/js/data-explorer-old/",
    "themes/dohmh/layouts/data-explorer-old/",
];

export const TARGET_ROOTS = [
    ["assets/js", ".js"],
    ["content", ".js"],
    ["themes/dohmh/layouts", ".html"],
];


// ----- the target list, optionally narrowed to paths containing `filter` ----- //

export const sweepTargets = (filter) =>
    TARGET_ROOTS
        .flatMap(([root, ext]) =>
            execFileSync("git", ["ls-files", "-z", "--", root], { encoding: "utf8" })
                .split("\0")
                .filter((p) => p.endsWith(ext) && !p.endsWith(".min.js")))
        .filter((p) => !VENDORED.has(p) && !EXEMPT_DIRS.some((d) => p.startsWith(d)))
        .filter((p) => !filter || p.includes(filter))
        .sort();
