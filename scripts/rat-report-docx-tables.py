"""
Turn the rat report's source .docx into the 32 chart CSVs, and diff it against
what Datawrapper currently holds.

    python scripts/rat-report-docx-tables.py fetch
    python scripts/rat-report-docx-tables.py check "C:/path/to/Annual Rat Mitigation Report.docx"
    python scripts/rat-report-docx-tables.py write "C:/path/to/Annual Rat Mitigation Report.docx"

WHY THIS EXISTS. The annual update needs 32 CSVs whose numbers all live in one
Word document, laid out as 12 tables that do not correspond one-to-one with the
page's 32 panels. Transcribing them by hand is where a wrong number enters and
nothing catches it -- the chart renders, the page renders, and the smoke sweep
passes. See documents/rat-report-2026-update-plan-2026-09-14.md Task 3, which
carries the derivation of the map below and the evidence for every claim here.

    fetch   Download all 32 published datasets to scripts/rat-report-charts/published/.
            Read-only, no credentials: Datawrapper serves a published chart's data at
            dwcdn.net/<id>/<version>/dataset.csv. Run this before check or write.
    check   Extract the docx and compare it against published/ on the periods the two
            share. This is the point of the tool. Exit 1 when anything disagrees.
    write   Emit scripts/rat-report-charts/next/<slot>.csv for rat-report-charts.mjs
            to push. Local only; writes nothing to Datawrapper.

NO DEPENDENCY, AND THAT IS WHY THIS IS PYTHON rather than .mjs like its siblings
in this directory. A .docx is a zip whose word/document.xml holds <w:tbl>
elements, which zipfile and ElementTree read outright; Node has no built-in zip
reader, so the same tool there would mean a new npm dependency.
scripts/js-comment-spacing.py is the precedent for Python here.

ARGUMENTS ARE POSITIONAL, and an argument starting with `-` is rejected. Same
contract, and the same measured reason, as scripts/characterize-env.mjs: npm and
PowerShell between them eat a flag's `--` and its name, leaving the value as a
nameless positional.

THREE THINGS THIS DELIBERATELY DOES NOT DO.
  1. It does not decide how many periods a chart shows. The live charts hold 5
     (the table-33 group, 2) and the 2026 docx has 7. `write` emits every period
     the docx has and prints the row-count change per slot, because dropping the
     oldest is a content decision and not one to make silently.
  2. It does not touch headers. Several differ from the docx wording on purpose,
     and two groups carry labels that are wrong in ways only a person should
     correct -- table-5a-5 labels two different columns `Failed (#)`, and the
     table-33 group labels four pairs with case-varying duplicates. The live
     header row is carried through verbatim.
  3. It does not write to Datawrapper. rat-report-charts.mjs does that, behind
     its own guard against writing to a published chart.
"""

import re
import sys
import time
import json
import urllib.error
import urllib.request
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

W         = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
REPO      = Path(__file__).resolve().parent.parent
PAGE      = REPO / "content/data-features/rat-report/index.md"
WORK      = REPO / "scripts/rat-report-charts"
PUBLISHED = WORK / "published"
NEXT      = WORK / "next"

PERIOD = re.compile(r"^(Jan-Jun|Jul-Dec)\s+\d{4}$")

# Where each panel's numbers live in the docx, as (table, first cell, cell count)
# on a data row. Derived by matching every published dataset against the docx
# rather than read off the headings, and cross-checked against the page's own
# switcher labels -- the page orders zones Bronx, Harlem, East Village,
# Brooklyn, Totals while the docx orders them Bronx, Brooklyn, Harlem, East
# Village, Total, so `-2` and `-4` are swapped relative to the document in every
# group that has them.
ZONE_CELL = {1: 1, 2: 5, 3: 7, 4: 3, 5: 9}   # panel suffix -> first cell, 5-panel groups

SLOT_MAP = {
    "slot16": (6, 1, 5),                      # TABLE 4,  pest management visits
    "slot17": (7, 1, 5),                      # TABLE 4a, stoppage visits
    "table-33-1": (4, 1, 5),                  # TABLE 3a is split across two docx
    "table-33-2": (5, 1, 5),                  # tables, two zones each -- and the
    "table-33-3": (5, 6, 5),                  # page's four panels do not follow
    "table-33-4": (4, 6, 5),                  # that split's order
    "table-6-1": (10, 1, 5),                  # TABLE 6 is split the same way
    "table-6-2": (11, 1, 5),
    "table-6-3": (11, 6, 5),
    "table-6-4": (10, 6, 5),
    "table-6-5": (12, 1, 5),                  # TABLE 6a, the citywide roll-up
}
for _suffix, _cell in ZONE_CELL.items():
    SLOT_MAP[f"table-2-{_suffix}"] = (2, _cell, 2)     # initial inspections + COTA
    SLOT_MAP[f"table-3-{_suffix}"] = (3, _cell, 2)     # compliance inspections + summons
    SLOT_MAP[f"table-5-{_suffix}"] = (8, _cell, 2)     # initial inspections + agency referrals
    SLOT_MAP[f"table-5a-{_suffix}"] = (9, _cell, 2)    # park and playground inspections

# slot1 is the one panel whose rows are zones rather than periods, so it is
# matched by row label against docx TABLE 1 instead of by period.
ROW_SLOT = "slot1"
ROW_TABLE = 1


def usage(message):
    print(message, file=sys.stderr)
    print(__doc__.split("WHY THIS EXISTS")[0].strip(), file=sys.stderr)
    return 2


# ---------------------------------------------------------------------------
# Reading the page
# ---------------------------------------------------------------------------

def read_slots():
    """slot -> chart id, derived from index.md itself so there is no second copy."""
    lines = PAGE.read_text(encoding="utf-8").split("\n")

    # The commented-out "old by buttons" block holds 5 dead embed ids.
    dead, start = set(), None
    for i, ln in enumerate(lines, 1):
        if "<!--" in ln and "-->" not in ln:
            start = i
        elif "-->" in ln and start:
            dead.update(range(start, i + 1))
            start = None

    rows, panel = [], None
    for i, ln in enumerate(lines, 1):
        if i in dead:
            continue
        m = re.search(r'<div id="(table-[\w-]+)"', ln)
        if m:
            panel = m.group(1)
        m = re.search(r"datawrapper-vis-([A-Za-z0-9]+)", ln)
        if m:
            rows.append([panel, m.group(1)])
            panel = None
    for n, r in enumerate(rows, 1):
        if r[0] is None:
            r[0] = f"slot{n}"
    return dict(rows)


# ---------------------------------------------------------------------------
# Reading the docx
# ---------------------------------------------------------------------------

def docx_tables(path):
    """Every top-level table as a list of rows of cell strings.

    Cell position is the only reliable index here. Docx TABLE 2's header row
    sums to 13 grid columns while all of its data rows sum to 12 and tblGrid
    declares 13, so gridSpan arithmetic places that table's Total column one
    column off while every other table reads correctly.

    Reading cell text through iter(w:t) is the tracked-changes-ACCEPTED view,
    and that is load-bearing rather than incidental: a deletion's text sits in
    <w:delText>, which this never sees, while an insertion's sits in an
    ordinary <w:t>, which it does. itertext() is the form that merges both into
    prose that still parses [verified 2026-09-17 on a constructed cell]. The
    2026 document carries no tracked changes at all -- 0 w:ins, 0 w:del -- but
    a later one may, and nothing in the output would announce it.
    """
    root = ET.fromstring(ZipFile(path).read("word/document.xml"))
    out = []
    for tbl in root.find(W + "body"):
        if tbl.tag != W + "tbl":
            continue
        out.append([
            [" ".join("".join(t.text or "" for t in p.iter(W + "t")).strip()
                      for p in tc.findall(W + "p")).strip()
             for tc in tr.findall(W + "tc")]
            for tr in tbl.findall(W + "tr")
        ])
    return out


def numbers(text):
    """Every number in a cell, in order. '2,627 (26%)' -> [2627, 26]."""
    out = []
    for tok in re.findall(r"[\d,]*\d", text):
        try:
            out.append(int(tok.replace(",", "")))
        except ValueError:
            pass
    return out


# ---------------------------------------------------------------------------
# Reading the published datasets
# ---------------------------------------------------------------------------

def read_published(slot):
    f = PUBLISHED / f"{slot}.tsv"
    if not f.exists():
        raise SystemExit(f"{f} does not exist. Run `fetch` first.")
    return [ln.split("\t") for ln in f.read_text(encoding="utf-8").split("\n") if ln.strip()]


def is_header(row):
    """A header row carries no digits in any cell."""
    return not any(re.search(r"\d", c) for c in row)


def formatter(samples):
    """Build a per-column format function by majority vote over that column.

    The same percentage is stored as `-26%` in table-2-1, `61%` in table-3-1,
    `(-15%)` in table-2-3 and a bare `8` in table-5-1, so there is no site-wide
    rule to apply -- each column's convention is read off the values already
    there. A vote rather than the first row, because two columns carry a
    hand-entry slip in exactly one row: table-33-1 drops the `%` on its second
    row and table-33-3 on its first, and reading the style off that row would
    copy the slip onto every row written.
    """
    def style(s):
        s = s.strip()
        paren = s.startswith("(") and s.endswith(")")
        core = s[1:-1] if paren else s
        return (paren, core.startswith("-"), core.endswith("%"), "," in core)

    votes = [style(s) for s in samples if s.strip()]
    paren, neg, pct, comma = (max(set(votes), key=votes.count) if votes
                              else (False, False, False, False))

    def fmt(value):
        s = f"{value:,}" if comma else str(value)
        if pct:
            s += "%"
        if neg:
            s = "-" + s
        if paren:
            s = f"({s})"
        return s

    return fmt


# ---------------------------------------------------------------------------
# Building a slot's rows from the docx
# ---------------------------------------------------------------------------

def extract(slot, tables, live):
    """Return the slot's data rows as lists of strings, formatted like `live`.

    `live` is the published dataset's rows, which supply both the header (carried
    through untouched) and the per-column formatting.
    """
    header = live[0] if is_header(live[0]) else None
    live_data = live[1:] if header else live
    width = len(live_data[0]) - 1
    fmts = [formatter([r[i + 1] for r in live_data if len(r) > i + 1]) for i in range(width)]

    if slot == ROW_SLOT:
        # Zone rows rather than period rows: match on the row label.
        src = {r[0].strip(): r for r in tables[ROW_TABLE - 1] if r and not is_header(r)}
        rows = []
        for lr in live_data:
            d = src.get(lr[0].strip())
            if d is None:
                rows.append([lr[0]] + ["?"] * width)
                continue
            vals = [v for c in d[1:] for v in numbers(c)][:width]
            rows.append([lr[0]] + [f(v) for f, v in zip(fmts, vals)])
        return header, rows

    ti, cell, ncells = SLOT_MAP[slot]
    rows = []
    for r in tables[ti - 1]:
        if not r or not PERIOD.match(r[0].strip()):
            continue
        block = r[cell:cell + ncells]
        vals = [v for c in block for v in numbers(c)]
        if len(vals) < width:
            vals += [None] * (width - len(vals))
        rows.append([r[0].strip()]
                    + [("?" if v is None else f(v)) for f, v in zip(fmts, vals[:width])])
    return header, rows


# ---------------------------------------------------------------------------
# fetch
# ---------------------------------------------------------------------------

def http(url):
    req = urllib.request.Request(url, headers={"User-Agent": "rat-report-docx-tables"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except Exception as e:                                   # noqa: BLE001 - reported, not raised
        return 0, str(e).encode()


def cmd_fetch(slots):
    """Download each published dataset, discovering its version by walking up from 1.

    The embeds in index.md carry no version segment, and a chart that has been
    republished several times serves only its current one, so the highest version
    that answers 200 is the live dataset.
    """
    PUBLISHED.mkdir(parents=True, exist_ok=True)
    ok = missing = 0
    for slot, cid in slots.items():
        best = None
        for v in range(1, 8):
            code, body = http(f"https://datawrapper.dwcdn.net/{cid}/{v}/dataset.csv")
            if code == 200:
                best = (v, body)
            elif best is not None:
                break
            time.sleep(0.15)
        if best is None:
            print(f"  {slot:<12} {cid}  NO VERSION ANSWERED 200")
            missing += 1
            continue
        v, body = best
        (PUBLISHED / f"{slot}.tsv").write_bytes(body)
        nrows = len([x for x in body.decode('utf-8', 'replace').split("\n") if x.strip()])
        print(f"  {slot:<12} {cid}  v{v}  {nrows} rows")
        ok += 1
    print(f"\n{ok} fetched, {missing} missing -> {PUBLISHED}")
    return 1 if missing else 0


# ---------------------------------------------------------------------------
# check
# ---------------------------------------------------------------------------

def cmd_check(slots, docx):
    """Diff the docx against the published data on the periods they share.

    A disagreement here is not necessarily an extraction bug. The live charts
    carry hand-entered values and the docx is a later document, so the same
    period can legitimately have been restated -- which is exactly why this
    prints every one rather than tolerating a threshold.
    """
    tables = docx_tables(docx)
    print(f"{len(tables)} docx tables\n")

    total = clean = 0
    findings = []
    for slot in slots:
        live = read_published(slot)
        header, rows = extract(slot, tables, live)
        live_data = live[1:] if header else live
        got = {r[0].strip(): r[1:] for r in rows}
        have = {r[0].strip(): r[1:] for r in live_data}
        shared = [k for k in have if k in got]

        bad = []
        for key in shared:
            for i, (a, b) in enumerate(zip(got[key], have[key]), 1):
                total += 1
                if a == b:
                    clean += 1
                    continue
                # A differing rendering of the same number is not a data
                # disagreement and must not be reported to the partner as one.
                kind = "value" if numbers(a) != numbers(b) else "format"
                bad.append((kind, key, i, b, a))
        if bad:
            findings.append((slot, len(shared), bad))

    for kind, label in (("value", "NUMBERS DISAGREE - these are for the partner"),
                        ("format", "same number, written differently - cosmetic")):
        groups = [(s, n, [x for x in b if x[0] == kind]) for s, n, b in findings]
        groups = [g for g in groups if g[2]]
        if not groups:
            continue
        print(f"=== {label} ===\n")
        for slot, nshared, bad in groups:
            print(f"--- {slot}  ({len(bad)} over {nshared} shared row(s))")
            for _, key, col, was, now in bad:
                print(f"      {key:<14} col {col}   published {was!r}   docx {now!r}")
        print()

    nval = sum(1 for _, _, b in findings for x in b if x[0] == "value")
    nfmt = sum(1 for _, _, b in findings for x in b if x[0] == "format")
    print(f"{clean} of {total} shared values agree exactly.")
    print(f"{nval} disagree on the NUMBER; {nfmt} differ only in how the value is written.")
    if not nval:
        print("No numeric disagreement, so the map and the extraction both hold.")
    return 1 if nval else 0


# ---------------------------------------------------------------------------
# write
# ---------------------------------------------------------------------------

def cmd_write(slots, docx):
    tables = docx_tables(docx)
    NEXT.mkdir(parents=True, exist_ok=True)
    grew = []
    for slot in slots:
        live = read_published(slot)
        header, rows = extract(slot, tables, live)
        live_data = live[1:] if header else live
        out = ([header] if header else []) + rows
        (NEXT / f"{slot}.csv").write_text(
            "\n".join("\t".join(r) for r in out) + "\n", encoding="utf-8", newline="\n")
        if len(rows) != len(live_data):
            grew.append((slot, len(live_data), len(rows)))
        print(f"  {slot:<12} {len(rows)} data row(s)"
              + (f"   (published has {len(live_data)})" if len(rows) != len(live_data) else ""))

    print(f"\nWrote {len(slots)} file(s) to {NEXT}")
    if grew:
        print(f"\n{len(grew)} slot(s) changed row count. The docx carries every period back to "
              "Jan-Jun 2023,\nso a chart that showed a rolling window now shows all of them. "
              "Decide whether that\nis wanted and trim before pushing -- nothing downstream "
              "checks it.")
    return 0


# ---------------------------------------------------------------------------

def main(argv):
    flag = next((a for a in argv if a.startswith("-")), None)
    if flag:
        return usage(f'This script takes no flags, and "{flag}" would not have survived npm intact.')
    if not argv:
        return usage("No command given.")

    command, rest = argv[0], argv[1:]
    slots = read_slots()
    print(f"{len(slots)} slots in {PAGE.relative_to(REPO)}")
    missing = [s for s in slots if s != ROW_SLOT and s not in SLOT_MAP]
    if missing:
        return usage(f"No docx mapping for: {', '.join(missing)}")

    if command == "fetch":
        return cmd_fetch(slots)
    if command in ("check", "write"):
        if len(rest) != 1:
            return usage(f"`{command}` takes exactly one argument, the path to the .docx.")
        docx = Path(rest[0])
        if not docx.exists():
            return usage(f"{docx} does not exist.")
        return cmd_check(slots, docx) if command == "check" else cmd_write(slots, docx)
    return usage(f'Unknown command "{command}".')


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
