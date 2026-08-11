# Running `characterize:nr` against environments other than `dev_stage`

**2026-08-11. Options memo — nothing here is implemented.** Written after asking whether
`npm run characterize:nr` could run against a `local_stage` server, then extended to `local_prod`.
It records what the current harness does, the two independent things that block it, and the ways to
unblock each with what they cost. No option is chosen.

The headline: **`local_stage` and `local_prod` are not the same problem.** One is a cosmetic
mismatch in a single field. The other is a data-branch mismatch that makes every content field
differ for real, and this repo already has a worked precedent for getting it wrong.

## 1. What is already true

Verified by reading the files on 2026-08-11; each claim names where it lives.

- **A running server on any known prefix is already reused.** `PREFIXES` in
  `scripts/dev-server.mjs` lists `/dev-stage/`, `/local-stage/`, `/dev-prod/`, `/local-prod/`,
  `/IndicatorPublic/` and `/`, and `findRunningServer()` probes every one on :8080 and :1313. So
  pointing the harness at a local-stage *or* local-prod server needs no code change and not even
  `DE_BASE_URL` — the probe finds it.
- **Spawning is fixed to one environment.** `SPAWN_ARGS` in the same file is
  `server --environment dev_stage --cleanDestinationDir --disableFastRender --logLevel debug -p 8080`,
  and `SPAWN_PREFIX` is `/dev-stage/`. When nothing is running, that is what comes up, whatever the
  caller wanted.
- **The committed baseline was captured on `dev_stage`** — `/dev-stage/` prefix, `staging` data.
  Re-captured 2026-08-11 in `0903812150`, same environment.

## 2. Two axes, not one

The environment name bundles two independent variables, and only one of them is cosmetic. Read
from every `config/*/config.toml` on 2026-08-11:

| Environment | URL prefix | `data_branch` | Data source |
|---|---|---|---|
| `dev_stage` | `/dev-stage/` | `staging` | GitHub |
| `dev_prod`, `development` | `/dev-prod/` | `production` | GitHub |
| `local_stage` | `/local-stage/` | `staging` | `http://localhost/EHDP-data/` |
| `local_prod` | `/local-prod/` | `production` | `http://localhost/EHDP-data/` |
| `prod_stage` | `/IndicatorPublic/` | `staging` | GitHub |
| `prod_prod`, `production` | `/IndicatorPublic/` | `production` | GitHub |

**Axis 1 — the URL prefix. One field, cosmetic.** `nr-characterization.mjs` records
`finalURL: window.location.pathname`. A grep of `scripts/nr-characterization-baseline/` for
`dev-stage` returns three lines and nothing else, so `finalURL` is the only prefix-bearing field in
the baseline. A `--check` from any other prefix therefore fails every target on that field alone.
This is a string comparison in `diff()`, not a behavioural claim.

`finalURL` exists on purpose: NR routing is path-based, and a silent redirect to the 404 page is the
failure this branch is prone to (site-wide audit §5i). Capturing the landing URL turns that into a
diff instead of an empty-looking report. Any option below has to keep that property.

**Axis 2 — the data branch. Every content field, and the differences are real.** `demographics`,
`zipList`, `accordionIds`, `accordionCount`, `chartCount` and the `markGroups` membership all come
from EHDP-data. The branches differ in row counts — staging carries an Indoor Air topic that
production does not, per the header of `scripts/nr-postswap-check.mjs`. Against a
`staging`-derived baseline, a production-data server reports those as content regressions that are
nothing of the kind. CLAUDE.md records the incident: the same confusion read as **210 content
regressions** in the post-swap check.

## 3. What each environment actually needs

- **`local_stage` — axis 1 only.** Same `staging` branch as the baseline, so the content fields are
  comparable *to the extent the local clone at `http://localhost/EHDP-data/` is level with the
  staging branch*. Fix `finalURL` and it works. A drift in the local clone is a true report about
  the data, not a harness defect, and nothing in the harness can absorb it.
- **`local_prod` — both axes.** `production` data against a `staging`-derived baseline. Fixing
  `finalURL` alone would convert three obvious one-field failures into a scatter of plausible-looking
  content diffs, which is strictly worse: the current failure is unmistakable, and that one would
  need diagnosing every time. **`local_prod` needs a data-branch guard before it needs a prefix
  fix.** The same applies to `dev_prod` / `development` and to the two `/IndicatorPublic/`
  environments — this is not a local-server problem, it is a branch problem.

The a11y audit run against `local_prod` on :8080 (Stage A and Stage B, 2026-08-10/11) was
unaffected by any of this, because axe reads the rendered page and has no baseline to compare
against. Only the characterization harness has this coupling.

## 4. Option 1 — make `finalURL` prefix-relative

Store the path with the server's base prefix removed, so the baseline says
`/neighborhood-reports/bayside_little_neck/asthma_and_the_environment/` and matches from any prefix.

- **Touches** `scripts/nr-characterization.mjs` only — the capture, which already receives
  `baseURL`, and nothing in `dev-server.mjs`.
- **Costs** a one-time re-baseline, or a shim that strips a leading known prefix when reading an old
  baseline. Re-baselining is the honest form; a shim is a second code path that exists to avoid a
  two-minute run.
- **Keeps** the redirect guard: a redirect to the 404 page still changes the relative path.
- **Solves `local_stage` completely. Solves nothing for `local_prod`,** and arguably makes it worse
  per §3 — so it should land with Option 4, not before it.
- **Watch out for**: `--baseline` cannot fail (CLAUDE.md), so a re-baseline captured against a local
  clone that is behind staging would silently install stale data as the reference. Run `--check`
  first and read its diff, then re-baseline from the environment the team treats as canonical.

## 5. Option 2 — let the harness spawn a chosen environment

Add an environment selector to `dev-server.mjs` — an env var such as `EHDP_ENV`, defaulting to
`dev_stage` — mapping each environment to its spawn args and path prefix.

- **Touches** `scripts/dev-server.mjs`, shared by `npm run smoke`, both characterization harnesses
  and `nr-a11y-audit.mjs`. The default keeps their behaviour, but the surface is repo-wide.
- **Only matters when nothing is running.** With a server up, the probe already wins and this code
  never executes.
- **Does not on its own fix the check** on either axis. Additive to Options 1 and 4.
- **Note** that both local baseURLs are `https://localhost/…` while the probe builds
  `http://localhost:PORT/…`. For `local_prod` this is settled: the Stage A and Stage B a11y runs
  reached it at `http://localhost:8080/local-prod/`, so `hugo server` answers on http despite the
  https baseURL. `local_stage` is untested — same shape, but nobody has run one.

## 6. Option 3 — a baseline set per data branch

Store `scripts/nr-characterization-baseline/<branch>/` — `staging/` and `production/` — rather than
per environment. **Per branch, not per environment**, is the point: `dev_stage` and `local_stage`
share a baseline, and so do `local_prod`, `dev_prod` and `prod_prod`.

- **Honest about** the thing Option 1 alone glosses: the two branches genuinely render different
  reports, and one shared baseline asserts they do not.
- **Costs** every set being kept current. A set nobody re-captures is worse than no set, because
  `--check` failures against it read as regressions.
- **Combines with** Option 1 — the prefix still has to go, since `/dev-stage/` and `/local-stage/`
  share a branch but not a prefix.
- **Reasonable only if** checking production-data renders becomes routine. As a one-off, Option 4's
  refusal plus a manual read is cheaper.

## 7. Option 4 — copy the data-branch gate that already exists

`scripts/nr-postswap-check.mjs:189-212` reads the served branch out of the page and refuses to run
on a mismatch:

```js
const servedBranch = await gate.evaluate(() => (typeof data_branch === 'undefined' ? null : data_branch));
if (servedBranch !== EXPECTED_BRANCH) { /* explain, exit 2 */ }
```

`head.html` declares `data_branch` as a top-level `let`, so it is reachable from an `evaluate()`
without being a `window` property — that comment is at `nr-postswap-check.mjs:191-192` and is the
non-obvious part.

- **Touches** `nr-characterization.mjs` only, and the baseline gains a recorded branch.
- **Converts** `local_prod`'s failure mode from "a scatter of content diffs someone has to
  diagnose" into one refusal that names the cause. That is the entire value; it does not make the
  check *run* anywhere new.
- **Is the prerequisite for Option 1**, not an alternative to it — see §3.
- **Precedent** is house style rather than invention: the same gate, for the same reason, already
  guards the other NR harness.

## 8. The no-code option

For a single ad-hoc run against `local_stage`, none of the above is needed: the probe finds the
server, `--check` reports three targets differing only in `finalURL`, and that one field is
recognisable at a glance.

For `local_prod` the no-code option is **don't** — the output would mix one prefix diff with an
unknown number of real data diffs, and telling them apart by eye is exactly the mistake that
produced the 210-regression reading. Kill the server and run against `dev_stage`, which is what was
done on 2026-08-11 for `0903812150`.

All of this stops being adequate when someone wants a green run as a gate — which is the actual
question behind the request, and is not answered here.
