# Body image resizing — plan and ledger (2026-11-15)

Fixes site-wide audit 2026-10, Area g item 1 ("Images in story bodies are served at original
resolution"). Chosen 2026-11-15 by Chris: options 1 + 2 of the three offered.

- **Option 1** — a theme `figure` shortcode and a markdown `render-image` hook sharing one partial,
  which resizes page-bundle images and adds `width`, `height` and `loading="lazy"`. Covers the 37
  `{{< figure >}}` and 18 `![](…)` uses.
- **Option 2** — shrink, once, the oversized source files that no template can process: raw
  `<img>` in markdown (sanitation, federal-funding, rat-complaints, adult-lead, …) and frontmatter
  images such as `ADG-2/ADG.png`.
- **Rejected: option 3**, converting raw `<img>` to `figure`. Several carry inline styles
  (`width:48%` side-by-side in adult-lead) that `figure` cannot express, so it is a per-page markup
  and visual-check job for the same bytes option 2 removes.

Branch `feature-body-image-resize`, cut from local `production` at `e8fe4a3c4d`.

**Status as of 2026-11-16: steps 1–6 and 8 done on `feature-body-image-resize`; step 7 (convert
the PNG photos) awaits Chris's choice of JPEG or WebP.**

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Measure the widest rendered body-image box (story column) at desktop widths; pick the resize width | *no commit* — a measurement | **DONE 2026-11-15** | `[verified 2026-11-15: measure.mjs over 17 pages × 5 viewports, 374 local <img>, all 200: story column ≤ 640 CSS px at every width; housing's figures 1120 and the about/ screenshots 1248 at 1920]`. Chosen: resize to `1600x`, only when wider; JPEG `q80` (site default q95; home hero q75) |
| 2 | Capture the before-state | *no commit* — build output | **DONE 2026-11-15** | Isolated build of `e8fe4a3c4d` into `C:/temp/bir-before` (`--environment development`, exit 0). Hugo v0.147.3's own `figure` and `render-image` sources fetched from the v0.147.3 tag into `scripts/.sc-rebaseline/body-image-resize/hugo-*.html` as the starting point. Content passes `figure` only `src`, `alt`, `class`, all bundle-relative |
| 3 | `partials/body-image.html` + `shortcodes/figure.html` + `_markup/render-image.html` | `72fe11f863` | **DONE 2026-11-15** | see step 4 |
| 4 | Verify option 1 | `72fe11f863` | **DONE 2026-11-15** | `[verified 2026-11-15, isolated development builds before/after, diff_builds.py: 1674 HTML/XML files each; 44 differ, every one only inside <img> tags (16 pages; 25 RSS feeds, escaped) or the home pages' build_datetime; the normalizer flagged the 3 home pages before build_datetime was stripped, so it can fire]`. Tag pairs: 53 changed = 35 built `figure` + 18 markdown, alt and class unchanged on all 53, none lost an attribute, 21 resized (Processed images 167 → 188), all 53 carry width/height/`loading="lazy"`. Browser: 265 sized imgs over 17 pages × 5 viewports, 0 rendered >2% off their attribute ratio. Bytes (root-relative srcs only): 66.9 → 31.5 MB over the 16 pages; public-transit 27.3 → 1.3 MB. Curated smoke 44/44 on the :8080 development server (a first run lost `data-explorer/` to a navigation timeout while characterization was building beside it; that page's HTML is byte-identical before/after). `characterize-env.mjs prod_prod` PASSED, 840 pages — **no power here**: it records no img attributes, and the change adds no elements |
| 5 | Option 2: shrink the source files no template resizes | `19ef5eec55` | **DONE 2026-11-15** (scope narrowed, below) | Targets taken from the after-build, not from greps: `opt2-targets.out`, every unresized local `<img>` > 500 KB on the 886 real pages = 22 files, 44.6 MB. Of those, only 5 are wider than 1600 px, and those 5 were re-encoded in place with `magick -auto-orient -resize '1600x>' -quality 80 -strip`: `federal-funding/CentralPark_MarleyWhite.jpg`, `federal-funding/waterfront_redhook.jpg`, `sanitation/trash-can-photovoice.jpg`, `sanitation/tree-trash-photovoice.jpg`, `rat-complaints/Inspector_looks.jpg`. 19.8 → 4.1 MB. All five upright (`TopLeft` or undefined) and sRGB before stripping; none is a frontmatter header image (grep with a positive control on `rat-inspections`' `inspector_looks3.jpg`). `[verified 2026-11-15: RMSE at 640 px display size, original vs new, 0.56–0.79 %; controls: identical 0, the original rotated 180° 27.6 %]`. Originals copied to `scripts/.sc-rebaseline/body-image-resize/originals/` and remain in git history |
| 6 | Re-measure per-page `<img>` bytes | *no commit* — a measurement | **DONE 2026-11-15** | `[verified 2026-11-15: page_weight.py, isolated builds of e8fe4a3c4d vs the working tree, 886 real pages, root- and page-relative srcs: total 137.9 → 86.8 MB; pages over 2 MB 16 → 10, over 1 MB 24 → 22; 11 pages lighter, none heavier]`. public-transit 27.3 → 1.3, federal-funding 8.5 → 1.6, rat-complaints 4.5 → 2.0, sanitation 15.2 → 9.0 MB |
| 7 | Convert the six PNG photos (list below) to a lossy format, and change their references | | **Not started** — Chris chose to convert 2026-11-16; format open | Sizes measured 2026-11-16, `magick <png> -background white -flatten -quality 80 -strip`, all six opaque: PNG 15.6 MB → JPEG 1.91 MB → WebP 1.51 MB. References: `ADG-2/index.md` frontmatter `image:`, `adult-lead/index.md` (2 raw `<img>`), `sanitation/index.md` (2 raw `<img>`), `zappa/index.md` (1 `figure`). `ADG.png` is a report cover with title text and `Zappa1.png` a UI screenshot, so check text edges for ringing before choosing the quality. WebP would also need a `.webp` `mimeMap` in `static/Web.config`, which has none, and no tracked file is WebP today |
| 8 | `rat-complaints/index.md` named `inspector_looks.jpg`; the file is `Inspector_looks.jpg` | | **DONE 2026-11-16** | `git grep -i inspector_looks` over content/themes/data: one reference, now matching the file's case (rat-inspections' `inspector_looks3.jpg` is a different file) |

**Left out of step 5 (raised with Chris 2026-11-15; on 2026-11-16 Chris chose to convert the PNG photos, step 7; housing's JPEGs are undecided):** 15 of the 22 files are
already ≤ 1600 px wide but still heavy, so resizing gains nothing.
- Mostly these are photos saved as PNG: sanitation's `trash-can-wire.png` and `trash-can-enclosed.png`
  (3.4 and 3.0 MB at 1302 px), `ADG-2/ADG.png` (4.0 MB), adult-lead's two `anon lead picture *.png`
  (1.5 MB each at ~705 px), and `zappa/Zappa1.png`.
- The rest are high-quality JPEGs, housing's `h1`–`h3.jpeg` (0.7–1.2 MB at 1200 px).
- Converting a PNG photo to JPEG renames the file, so its markup references change too.
- `nyccas/embed/map-images/BC_2024.png` (3000 px) was excluded deliberately: it is one of the ~100
  rasters `nyccas_pollutant_maps.html` swaps between, and shrinking one would make it the odd one out.

## Next command

Step 7: once the format is chosen, convert the six PNGs with the command in its row, `git mv`
is not enough since the extension changes - write the new file, `git rm` the PNG, and update the
five references. Then re-measure:

```
HUGO_RESOURCEDIR=C:/temp/bir-res-x npx hugo --environment development -d C:/temp/bir-x
python scripts/.sc-rebaseline/body-image-resize/page_weight.py C:/temp/bir-before C:/temp/bir-x
```

`C:/temp/bir-before` is the build of `e8fe4a3c4d`; rebuild it from that commit in a worktree if
it is gone. Scripts and outputs: `scripts/.sc-rebaseline/body-image-resize/` (git-ignored).
