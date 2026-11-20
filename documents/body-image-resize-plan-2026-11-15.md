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

**Status as of 2026-11-16: steps 1–10 done on `feature-body-image-resize`; PR #1578 into
`production` opened at `958262e6b7`, smoke (run 43918462129) and site characterization (run
43918461994) both green on that commit. `.webp` serves on Chris's local IIS (Chris, 2026-11-16).**

| # | Step | Commit | Status | Proof that ran |
|---|---|---|---|---|
| 1 | Measure the widest rendered body-image box (story column) at desktop widths; pick the resize width | *no commit* — a measurement | **DONE 2026-11-15** | `[verified 2026-11-15: measure.mjs over 17 pages × 5 viewports, 374 local <img>, all 200: story column ≤ 640 CSS px at every width; housing's figures 1120 and the about/ screenshots 1248 at 1920]`. Chosen: resize to `1600x`, only when wider; JPEG `q80` (site default q95; home hero q75) |
| 2 | Capture the before-state | *no commit* — build output | **DONE 2026-11-15** | Isolated build of `e8fe4a3c4d` into `C:/temp/bir-before` (`--environment development`, exit 0). Hugo v0.147.3's own `figure` and `render-image` sources fetched from the v0.147.3 tag into `scripts/.sc-rebaseline/body-image-resize/hugo-*.html` as the starting point. Content passes `figure` only `src`, `alt`, `class`, all bundle-relative |
| 3 | `partials/body-image.html` + `shortcodes/figure.html` + `_markup/render-image.html` | `72fe11f863` | **DONE 2026-11-15** | see step 4 |
| 4 | Verify option 1 | `72fe11f863` | **DONE 2026-11-15** | `[verified 2026-11-15, isolated development builds before/after, diff_builds.py: 1674 HTML/XML files each; 44 differ, every one only inside <img> tags (16 pages; 25 RSS feeds, escaped) or the home pages' build_datetime; the normalizer flagged the 3 home pages before build_datetime was stripped, so it can fire]`. Tag pairs: 53 changed = 35 built `figure` + 18 markdown, alt and class unchanged on all 53, none lost an attribute, 21 resized (Processed images 167 → 188), all 53 carry width/height/`loading="lazy"`. Browser: 265 sized imgs over 17 pages × 5 viewports, 0 rendered >2% off their attribute ratio. Bytes (root-relative srcs only): 66.9 → 31.5 MB over the 16 pages; public-transit 27.3 → 1.3 MB. Curated smoke 44/44 on the :8080 development server (a first run lost `data-explorer/` to a navigation timeout while characterization was building beside it; that page's HTML is byte-identical before/after). `characterize-env.mjs prod_prod` PASSED, 840 pages — **no power here**: it records no img attributes, and the change adds no elements |
| 5 | Option 2: shrink the source files no template resizes | `19ef5eec55` | **DONE 2026-11-15** (scope narrowed, below) | Targets taken from the after-build, not from greps: `opt2-targets.out`, every unresized local `<img>` > 500 KB on the 886 real pages = 22 files, 44.6 MB. Of those, only 5 are wider than 1600 px, and those 5 were re-encoded in place with `magick -auto-orient -resize '1600x>' -quality 80 -strip`: `federal-funding/CentralPark_MarleyWhite.jpg`, `federal-funding/waterfront_redhook.jpg`, `sanitation/trash-can-photovoice.jpg`, `sanitation/tree-trash-photovoice.jpg`, `rat-complaints/Inspector_looks.jpg`. 19.8 → 4.1 MB. All five upright (`TopLeft` or undefined) and sRGB before stripping; none is a frontmatter header image (grep with a positive control on `rat-inspections`' `inspector_looks3.jpg`). `[verified 2026-11-15: RMSE at 640 px display size, original vs new, 0.56–0.79 %; controls: identical 0, the original rotated 180° 27.6 %]`. Originals copied to `scripts/.sc-rebaseline/body-image-resize/originals/` and remain in git history |
| 6 | Re-measure per-page `<img>` bytes | *no commit* — a measurement | **DONE 2026-11-15** | `[verified 2026-11-15: page_weight.py, isolated builds of e8fe4a3c4d vs the working tree, 886 real pages, root- and page-relative srcs: total 137.9 → 86.8 MB; pages over 2 MB 16 → 10, over 1 MB 24 → 22; 11 pages lighter, none heavier]`. public-transit 27.3 → 1.3, federal-funding 8.5 → 1.6, rat-complaints 4.5 → 2.0, sanitation 15.2 → 9.0 MB |
| 7 | Convert the six PNG photos to WebP, change their references, register `.webp` in `static/Web.config` | `f86de41d7e` | **DONE 2026-11-16** — Chris chose WebP on visual quality after first taking JPEG, accepting the trade-offs below | PNG 15.6 MB → WebP 1.51 MB with `magick <png> -background white -flatten -quality 80 -strip`, from the originals (all six opaque); JPEG q80 would have been 1.91 MB. Trade-offs accepted: caniuse's `webp.json` (updated 2026-11-11, read 2026-11-16) gives 97.24% full support, none in IE, iOS 14+, Safari 16+ (14–15 on macOS 11+ only); no `<picture>` fallback. `Web.config` gains `<remove>` + `<mimeMap fileExtension=".webp" mimeType="image/webp">`, the `.woff` pattern, so it cannot duplicate a server-level entry. Tested 2026-11-16 on Chris's local IIS: "webp works on my local iis" (Chris's report; the request and response were not seen in this session). Six references changed (`ADG-2/index.md` `image:`, adult-lead ×2, sanitation ×2, zappa ×1); `git grep` for the old names: 0, for the new: 6. `adg-2`'s `og:image` is the site default, so `ADG.webp` is not a share image. `[verified 2026-11-16: isolated development build, exit 0, 0 ERROR; unresolved.py: 1145 local <img> srcs on 886 real pages, 0 unresolved (the control - Zappa1 hidden from the JPEG build - read 1); page_weight.py: 137.9 → 72.7 MB total, pages over 2 MB 16 → 8; decoded.mjs on the :8080 development server in Chromium: all 26 local imgs on the five pages decoded, each converted file included]`. Originals in `scripts/.sc-rebaseline/body-image-resize/originals/` |
| 8 | `rat-complaints/index.md` named `inspector_looks.jpg`; the file is `Inspector_looks.jpg` | `f86de41d7e` | **DONE 2026-11-16** | `git grep -i inspector_looks` over content/themes/data: one reference, now matching the file's case (rat-inspections' `inspector_looks3.jpg` is a different file) |
| 9 | Convert housing's `h1`–`h3.jpeg` (q98, 1200 px) to WebP | `e99b0755d4` | **DONE 2026-11-16** — Chris: "yes do housing" | `magick <jpeg> -auto-orient -quality 80 -strip` (all `TopLeft`): 2.87 → 0.61 MB. `[verified 2026-11-16: RMSE at 640 px against the original 1.25–1.80 %, higher than step 5's 0.56–0.79 % from a q98 source; controls identical 0, rotated 180° 31.8–37.0 %; h2 at 1:1 showed no visible difference]`. Nine references, `figure` in `index.md`, `index.es.md`, `index.zh.md`; `git grep` old names 0, new 9. `[verified 2026-11-16: isolated development build exit 0, 0 ERROR; unresolved.py 1145 srcs, 0 unresolved; page_weight.py 137.9 → 65.9 MB total, over 2 MB 16 → 5 (the es and zh pages load the same three files, so the drop counts three times); decoded-args.mjs on :8080: h1–h3.webp decoded on all three language pages, each with width and loading="lazy"]`. Originals in `originals/housing-h*.jpeg` |
| 10 | Convert the seven remaining heavy files from `opt2-targets.out` to WebP | `54242a5922` | **DONE 2026-11-16** — Chris: "do the seven others too" | 5.30 → 1.02 MB. q80 for the photos and screenshots (`ratportal-screenshot`, both `data-explorer-screenshot` copies, `Zappa9`, `NyccasInstall_red`); `colonial.png` q80 keeping its alpha channel; `rwg_visual_abstract` lossless, which came out smaller than q80 (226 vs 255 KB) `[verified 2026-11-16: magick compare -metric AE 0 differing pixels; the lossy Zappa9 pair read non-zero as control]`. Screenshot text at 1:1, original vs q80, showed no visible difference. Eleven references: content markdown, `rat-information-portal` frontmatter `image:`, and two templates - `rat-info-portal.html` hardcodes the screenshot name, `nyccas-report.html` builds `images/NyccasInstall_red.webp` from an unset `.Params.fullurl`. `rat-report-archive/2023` and `/2024` still say `image: ratportal-screenshot.png`, but neither bundle has that file before or after, so they were left alone; `congestion-pricing-report`, `healthy-homes-info` and `rat-report` hold their own copies, out of scope. `[verified 2026-11-16: isolated development build exit 0, 0 ERROR; unresolved.py 1145 srcs, 0 unresolved; rwg's download href and the data-features card thumbnail (now a Hugo-processed .webp) resolve; page_weight.py 137.9 → 60.4 MB total, over 2 MB 16 → 4, over 1 MB 24 → 15; decoded-seven.mjs on a freshly started :8080 development server: each converted file decoded on its 9 pages incl. es and zh housing]`. The first run of that check failed zh housing on `colonial.png`: the old server was serving that page from before the new templates (its `<img>` had no width), while source and isolated build both said `.webp`. Restarting the server cleared it. Originals in `originals/`, named by their content path |

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

Review and merge PR #1578 (`gh pr view 1578`). To re-measure after any further change:

```
HUGO_RESOURCEDIR=C:/temp/bir-res-x npx hugo --environment development -d C:/temp/bir-x
python scripts/.sc-rebaseline/body-image-resize/page_weight.py C:/temp/bir-before C:/temp/bir-x
```

`C:/temp/bir-before` is the build of `e8fe4a3c4d`; rebuild it from that commit in a worktree if
it is gone. Scripts and outputs: `scripts/.sc-rebaseline/body-image-resize/` (git-ignored).
