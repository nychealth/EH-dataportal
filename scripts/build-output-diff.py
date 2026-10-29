"""
Compare two Hugo builds of the site and fail on any difference beyond blank lines.

The build step for a whitespace sweep (js-comment-spacing.py, js-brace-padding.mjs).
Their verifier proves the JavaScript and the non-blank source lines are unchanged;
this proves Hugo still compiles every template and renders the same pages. Build
the commit before the sweep and the swept tree, each isolated so neither touches
docs/ or resources/_gen beside a running server:

    git worktree add --detach C:/temp/base HEAD      # the tree without the sweep
    (cd C:/temp/base && HUGO_RESOURCEDIR=C:/temp/res-a npx hugo --environment prod_prod -d C:/temp/out-a)
    HUGO_RESOURCEDIR=C:/temp/res-b npx hugo --environment prod_prod -d C:/temp/out-b
    python scripts/build-output-diff.py C:/temp/out-a C:/temp/out-b     # exit 0 = blank lines only
    git worktree remove C:/temp/base

Keep the paths short: git and Hugo hit Windows' path limit under a scratchpad.

Two things differ between any two builds and are normalized away first, both
measured on 2026-10-21 by building the same commit twice: a fingerprinted asset's
name and integrity hash (they follow the asset's bytes, so a blank line moves
them), and the home pages' build_datetime meta tag. With those removed, two builds
of one commit are byte-identical across all 3,020 files.

Exit 0 when every file pair is identical or differs only by blank lines; 1 when
any file differs otherwise or exists in one build only; it names each.

--leading-whitespace (after the two directories) also accepts a pair whose
non-blank lines differ only in leading whitespace: the build step for a
re-indent (indent-normalize.mjs), whose own --verify proves the rest. Off by
default, so a blank-line sweep's comparison stays as strict as it was. A line
inside a <pre> or <textarea>, where leading whitespace renders, is not accepted,
and every file that is accepted is named, to be read. What it cannot see: a JS
template literal in a built page, whose leading whitespace is part of the string.
A re-indent's own record must list every multi-line template literal it touched,
as the ledger's step 7 row does for minimum-wage-with-maps.html.
"""

import os
import re
import sys
from collections import Counter

# A short-fingerprint asset name, `chart-tod.4e68109a12b67fad.js`
FINGERPRINT = re.compile(r"\.[0-9a-f]{16}\.(js|css)\b")
INTEGRITY = re.compile(r'integrity="[^"]*"')
BUILD_DATETIME = re.compile(r'<meta name="build_datetime" content=\'[^\']*\'>')


# Remove what differs between two builds of the same commit
def normalize(text):

    text = FINGERPRINT.sub(r".FP.\1", text)
    text = INTEGRITY.sub('integrity=""', text)

    return BUILD_DATETIME.sub('<meta name="build_datetime">', text)


# Every file under a build, keyed by its fingerprint-normalized path
def tree(root):

    out = {}

    for d, _, names in os.walk(root):
        for name in names:
            rel = os.path.relpath(os.path.join(d, name), root).replace("\\", "/")
            out[FINGERPRINT.sub(r".FP.\1", rel)] = rel

    return out


def non_blank(text):
    return [line for line in text.replace("\r\n", "\n").split("\n") if line.strip()]


PRE_OPEN = re.compile(r"<(?:pre|textarea)\b", re.I)
PRE_CLOSE = re.compile(r"</(?:pre|textarea)\s*>", re.I)


# Indices of the lines whose leading whitespace renders: every line after one that
# opens a <pre> or <textarea>, through the line that closes it
def preformatted(lines):

    inside, out = False, set()

    for i, line in enumerate(lines):

        if inside:
            out.add(i)

        last_open = max((m.start() for m in PRE_OPEN.finditer(line)), default=-1)
        last_close = max((m.start() for m in PRE_CLOSE.finditer(line)), default=-1)

        if last_open > last_close:
            inside = True
        elif last_close > last_open:
            inside = False

    return out


# Non-blank lines equal past their leading whitespace, none of it inside a <pre>/<textarea>
def leading_whitespace_only(text_a, text_b):

    lines_a, lines_b = non_blank(text_a), non_blank(text_b)

    if [l.lstrip() for l in lines_a] != [l.lstrip() for l in lines_b]:
        return False

    rendered = preformatted(lines_a) | preformatted(lines_b)

    return not any(lines_a[i] != lines_b[i] for i in rendered)


if __name__ == "__main__":

    if len(sys.argv) not in (3, 4) or sys.argv[3:] not in ([], ["--leading-whitespace"]):
        sys.exit("Usage: python scripts/build-output-diff.py <build-a> <build-b> [--leading-whitespace]")

    root_a, root_b = sys.argv[1], sys.argv[2]
    leading_ok = len(sys.argv) == 4
    a, b = tree(root_a), tree(root_b)

    one_sided = sorted(set(a) ^ set(b))
    counts = Counter()
    changed = []
    reindented = []

    for key in sorted(set(a) & set(b)):

        raw_a = open(os.path.join(root_a, a[key]), "rb").read()
        raw_b = open(os.path.join(root_b, b[key]), "rb").read()

        if raw_a == raw_b:
            counts["identical"] += 1
            continue

        text_a = normalize(raw_a.decode("utf-8", "replace"))
        text_b = normalize(raw_b.decode("utf-8", "replace"))

        if text_a == text_b:
            counts["build noise only"] += 1
        elif non_blank(text_a) == non_blank(text_b):
            counts["blank lines only"] += 1
        elif leading_ok and leading_whitespace_only(text_a, text_b):
            counts["leading whitespace only"] += 1
            reindented.append(key)
        else:
            counts["changed"] += 1
            changed.append(key)

    print(f"{len(a)} files in A, {len(b)} in B")
    print(", ".join(f"{k}: {v}" for k, v in counts.items()))

    for key in reindented:
        print(f"  LEADING WS      {key}")
    for key in one_sided:
        print(f"  ONE BUILD ONLY  {key}")
    for key in changed:
        print(f"  CHANGED         {key}")

    sys.exit(1 if one_sided or changed else 0)
