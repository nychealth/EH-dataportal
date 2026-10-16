# Data explorer charts at tablet widths — findings, 2026-10-15

Branch `feature-new-data-explorer` at `991606caad`. Measured with Playwright against a
`local_prod` server (EHDP-data `production`), headless Chromium, fresh page loads.

## Summary

Between a 720px and roughly a 1000px window, every explorer chart is too narrow to draw
properly. At 720px the layout switches from a full-width chart to a side panel that is 38% of
the window, and the chart gets what is left after the tab-button column: 172px at a 720px
window, 190px at 768px. Titles are cut off on every chart, the bar chart loses its axis
numbers, and the correlate chart runs past its panel. Desktop widths (1200px and up) and
phone widths (below 720px) are clean.

This predates the 2026-10-15 chart fixes (`068ed473da`, `991606caad`). Those fixed charts
that overflowed or were scaled down within a panel of normal width; this is the panel itself.

## Where the chart width comes from

`assets/scss/_de-custom.scss`, inside `@media (min-width: 720px)`:

```scss
.de-tabs {
    width: 38%;
    max-width: 860px;
}
```

(from `823f925efe`, 2026-05-04). The tab-button column takes about 70px of that 38%, and the
panel's padding about 32px more. The left details panel is a fixed `width: 380px` in the same
block.

Chart width by window width, bar chart, `air-quality/?id=2023`:

| Window | Pane content | Chart |
|---:|---:|---:|
| 700 | 698 | 666 |
| 719 | 717 | 685 |
| 720 | 204 | 172 |
| 768 | 222 | 190 |
| 800 | 234 | 202 |
| 900 | 272 | 240 |
| 992 | 307 | 275 |
| 1024 | 319 | 287 |
| 1100 | 348 | 316 |
| 1200 | 386 | 354 |

The jump at 719 → 720 is the switch from the full-width overlay to the side panel.

## What breaks at a 768px window

"Clipped" means a text element extends past the SVG's own edge, so part of it is not drawn.

| Chart | Chart width | Clipped |
|---|---:|---|
| Trend, `asthma/?id=2380` | 190 | title ("Asthma emergency department vi…") |
| Bar, `weather-related-illness/?id=2445` | 190 | title, and the axis numbers 10, 20, 30 |
| Bar, `air-quality/?id=2023` | 190 | title |
| Disparities, `air-quality/?id=2023` | 190 | three title lines: "Neighborhood poverty (2019-23)", "Fine particles (PM 2.5)", "Annual mean (mcg/m3) (2025)" |
| Correlate, `air-quality/?id=2023` | 280 | nothing inside the chart, but the chart runs 75px past its pane, so its right side is hidden |

Correlate is wider than the others because `updateCorrelatePaneLayout` (`correlate.js`) pins its
holder to at least 280px. Everywhere else that floor is below the pane width and does nothing;
here it pushes the chart out of the pane.

## What was checked and is clean

Same test (text past the SVG's edges, SVG past its holder's bottom):

- At 375, 700, 1200 and 1920px: trend (2023, 2380), bar (2023, 2445), correlate (2023, 2380).
  Nothing clipped, every chart inside its holder.
- Disparities (2023) at 1200px: clean. At 700 and 1920px the probe's click on "Disparities" did
  not register, so those widths are untested for disparities.
- Trend comparison mode: the only comparison offered on these indicators was "Age" on 2380,
  clean at 700 and 1200px. Comparisons with longer series names were not found or tested.

The test was checked against a known failure: forcing the correlate legend back to one row at
1200px made it report "Staten Island" as clipped.

## Options

Neither has been built or tested.

1. **Keep the full-width chart up to a wider breakpoint, for example 992px.** At 991px the side
   panel would still give only a 275px chart, so the side panel would start where it is roughly
   as wide as it is at 1024px today. This means moving the side-panel rules in
   `_de-custom.scss` to the new breakpoint (eight `@media (min-width: 720px)` blocks and one
   `max-width: 719.98px` block), and `trend.js`'s `viewportWidth < 720` mobile-legend switch
   with them, the only explorer JS that switches at 720.
2. **Give the side panel a minimum width**, for example about 360px including the tab buttons.
   A smaller change, but between 720 and about 800px the panel would overlap the 380px details
   panel more than it does now.

Option 1 is the recommendation: it keeps the phone layout, which works, for longer, instead of
squeezing two fixed-width panels into a window too narrow for both.

## How to reproduce

```text
Window 768px wide, any explorer page with ?overlay=bar (or trend, links).
Compare each SVG text element's right edge with the SVG's right edge.
```

The probes used are in the repo's ignored `.playwright-mcp/` folder on the machine they ran on
(`pane-width-range.mjs`, `chart-clip-768-disparities.mjs`, `chart-text-clip.mjs`); they are
scratch scripts, not part of the repo.
