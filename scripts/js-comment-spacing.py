"""
Insert a blank line between a comment and the code it introduces.

This is the convergence tool for the rule in documents/js-conventions.md
(§ Vertical whitespace). It is NOT part of any check and no npm script wraps it:
new code should be written to the convention, and this exists for the moment old
code arrives, which is the merge of a long-lived branch. Run it, review the diff,
commit separately from whatever else that branch changed.

Idempotent — it skips any comment that already has a blank line after it — so a
re-run only touches newly-arrived code.

    python scripts/js-comment-spacing.py            # every target file
    python scripts/js-comment-spacing.py chart-tod  # only paths containing that substring

REQUIRED CHECK AFTER RUNNING. These are regex heuristics, not a JS parser:
OBJ_PROP and CONTINUATION are approximations and the template-literal guard is a
backtick parity count. Nothing here verifies its own output, so run it on a clean
tree and prove the diff is empty-line insertions and nothing else:

    git diff -U0 | grep -E '^\\+' | grep -v '^+++' | grep -c '[^+[:space:]]'   # must be 0
    git diff -U0 | grep -E '^-'   | grep -v '^---' | wc -l                     # must be 0

Two things it does NOT touch, both cases where the comment introduces nothing:
a comment above an object-literal property (Vega and Leaflet specs annotate
consecutive keys, and spacing each one doubles the block's height), and a comment
above a line that continues or closes what came before — a `.filter()` in a fluent
chain, a closing brace, an `else` — where a blank line would split the chain from
its own continuation.

First run: 775 insertions across 69 files, on hotfix-comment-spacing.
"""

import os, re, sys

COMMENT      = re.compile(r'^\s*//')
# `const fn = (` / `= function` / `= {` / `= [` — a binding that opens a block, which
# reads as a property when the name is followed by a colon, so it is checked first
DECL_BLOCK   = re.compile(r'^\s*(?:const|let|var)\s+[\w$]+\s*=\s*(?:async\s+)?(?:\(|function\b|\{|\[)')
OBJ_PROP     = re.compile(r'''^\s*(?:["'][^"']*["']|[\w$-]+)\s*:''')
CONTINUATION = re.compile(r'^\s*(?:[.)\]}?:,+]|&&|\|\||else\b|catch\b|finally\b|break\b|continue\b)')

# Vendored third-party files, which are not ours to restyle. Hand-maintained: a
# vendored file added after this list was written will be reformatted like our own.
VENDORED = (
    "assets/js/L.colorIcon.js",                  # Leaflet.ColorIcon, MIT
    "assets/js/color-convert.js",                # from a public gist
    "assets/js/naturalSort.js",                  # Jim Palmer's natural sort, MIT
    "content/data-features/healthy-homes-info/source/assets/js/plugins.js",  # HTML5 Boilerplate
)

TARGET_ROOTS = (
    ("assets/js", (".js",)),
    ("content", (".js",)),
    ("themes/dohmh/layouts", (".html",)),
)


# Decide whether the comment block above this line is introducing it
def qualifies(line):

    if OBJ_PROP.match(line) and not DECL_BLOCK.match(line):
        return False

    if CONTINUATION.match(line):
        return False

    return True


# Guard against inserting into a string: an odd backtick count before this point
# means we are inside a template literal, where a new line changes the contents
def in_template_literal(lines, upto):

    return sum(l.count('`') for l in lines[:upto]) % 2 == 1


# Bound the edit to <script> bodies in an HTML file, so nothing lands in markup
def script_regions(lines):

    out, start = [], None

    for i, l in enumerate(lines):

        low = l.lower()

        if start is None and '<script' in low and '</script' not in low:
            start = i + 1
        elif start is not None and '</script' in low:
            out.append((start, i))
            start = None

    return out


# Rewrite one file in place, returning how many blank lines were inserted
def process(path):

    raw = open(path, encoding='utf-8', errors='strict').read()

    # Preserve whatever the file already uses rather than normalizing to one of them
    nl = '\r\n' if '\r\n' in raw else '\n'
    lines = raw.replace('\r\n', '\n').split('\n')

    regions = script_regions(lines) if path.endswith('.html') else [(0, len(lines))]

    inserts = set()

    for start, end in regions:

        i = start

        while i < end:

            if not COMMENT.match(lines[i]):
                i += 1
                continue

            # A run of consecutive comment lines is one block; the blank goes after all of it
            j = i
            while j < end and COMMENT.match(lines[j]):
                j += 1

            # lines[j] is blank already when the file is conformant, and .strip() is
            # what makes the whole pass idempotent
            if j < end and lines[j].strip() and qualifies(lines[j]) \
                    and not in_template_literal(lines, i):
                inserts.add(j)

            i = j + 1

    if not inserts:
        return 0

    out = []

    for n, l in enumerate(lines):

        if n in inserts:
            out.append('')

        out.append(l)

    open(path, 'w', encoding='utf-8', newline='').write(nl.join(out))

    return len(inserts)


if __name__ == '__main__':

    targets = []

    for root, exts in TARGET_ROOTS:
        for dp, _, fns in os.walk(root):
            for fn in fns:
                if fn.endswith(exts):
                    targets.append(os.path.join(dp, fn).replace("\\", "/"))

    targets = [t for t in targets if t not in VENDORED]

    if len(sys.argv) > 1:
        targets = [t for t in targets if sys.argv[1] in t]

    total, files = 0, 0

    for t in sorted(targets):

        n = process(t)

        if n:
            files += 1
            total += n
            print(f"{n:4d}  {t}")

    print(f"\n{total} blank lines inserted across {files} files")
    print("Now prove the diff is empty-line insertions only — see the module docstring.")
