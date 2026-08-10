# Crew Dossiers from Foundry Exports Design

## Goal

Generate the crew roster from Foundry VTT actor exports instead of a hand-maintained array in
`crew.astro`. Mechanics come from the exports; personality stays hand-written. Each crew member
gains a dossier page at `/crew/<slug>`, linked from the existing carousel.

## Findings that shape the design

- **The exports are self-contained.** Each actor JSON embeds full item data for species,
  background, class, subclass, and every feat, weapon, and power, each with its own HTML
  description. Nothing needs to be resolved against the `sw5e-module` compendium packs, so
  the module is not vendored, submoduled, or referenced.
- **Derived values are absent.** `attributes.hp.max`, `movement.walk`, and the proficiency bonus
  are all `null`; Foundry computes them at runtime. `attributes.ac` holds a formula, not a number.
  `hp.value` holds *current* hit points at export time, which is stale by definition.
- **Skills store a proficiency multiplier**, not a modifier: `0` none, `1` proficient, `2` expertise.
- **Biographies are mostly empty.** Only Dax (2.4 KB) and Deech (6.4 KB) have
  `details.biography.value`. The roster's voice lives in the hand-written copy, not the exports.
- **Language traits are unreliable.** Boris, Dax, and Deech record none; T'Zel records only
  `binary`. They are not a usable source.
- **The roster and the exports disagree.** Nine exports, ten roster entries, eight overlapping.
  Kreia has an export but no roster entry; DV-U5 and Stalker have roster entries but no export.

## Architecture

```
data/actors/*.json           raw Foundry exports (committed, provenance only)
        |
        v  scripts/build-roster.mjs   (plain Node, no dependencies)
src/data/roster.json         pruned mechanics, committed, ~15 KB
        |
        +--------------+
        |              |
src/content/crew/*.md   |    overlay files, hand-written flavor
        |              |
        v              v
src/lib/roster.js            merge into a view model
        |
        +--> src/pages/crew/index.astro    carousel index
        +--> src/pages/crew/[slug].astro   dossier per member
```

`src/pages/crew.astro` moves to `src/pages/crew/index.astro`, matching the existing `hangar/`
layout. The URL is unchanged.

### Why not a git submodule

A submodule is a pinned pointer to another git repository. It earns its complexity when the
dependency has its own release cadence and its own history you want to track separately. These
exports are files dropped in by hand, and the module they derive from is not needed at all. Plain
committed files under `data/actors/` are simpler, and portable in the sense that matters: a fresh
clone builds with no extra commands.

## Component: the prune script

`scripts/build-roster.mjs`. Reads every `data/actors/*.json` as UTF-8, writes `src/data/roster.json`.
Node built-ins only.

Extracted per actor:

| Field | Source |
|---|---|
| `sourceName` | `name` |
| `species` | name of the item with `type: "race"` |
| `background` | name of the item with `type: "background"` |
| `classes` | `[{ name, levels }]` for each item with `type: "class"` |
| `subclasses` | names of items with `type: "subclass"` |
| `size` | `system.traits.size`, expanded via lookup |
| `abilities` | `system.abilities.<key>.value` for the six abilities |
| `skills` | `system.skills` entries with `value > 0`, as `{ name, expertise }` |

Nothing else. No HTML, no inventory, no formula evaluation, no dice math.

**Levels are extracted but never rendered.** The whole crew levels together, so a number on the
page says nothing about the character. `classes[].levels` is retained solely to identify the
primary class should anyone multiclass; no page displays it and no total is computed.

Two lookup tables are hardcoded, both stable across SW5e releases: the eighteen skill codes
(the fifteen conventional ones plus `lor` Lore, `pil` Piloting, `tec` Technology) and the six size
codes (`tiny`, `sm`, `med`, `lg`, `huge`, `grg`). **An unrecognized skill or size code throws.**
Failing the build is the correct response to a schema shift; rendering `undefined` onto a page is not.

Output is keyed by export filename, which is the join key the overlay names. Renaming a character
in Foundry therefore does not break the link.

```json
{
  "fvtt-Actor-t'zel-nloZyUHeyUKNuQDw.json": {
    "sourceName": "T'Zel",
    "species": "Echani",
    "background": "Bounty Hunter",
    "size": "Medium",
    "classes": [{ "name": "Monk", "levels": 11 }],
    "subclasses": ["Echani Order"],
    "abilities": { "str": 10, "dex": 18, "con": 14, "int": 11, "wis": 16, "cha": 10 },
    "skills": [{ "name": "Acrobatics", "expertise": false }]
  }
}
```

The file carries no generation timestamp. A timestamp would churn the diff on every build and
defeat the reason for committing the file, which is to make a re-export's effect on the site
reviewable.

## Component: the overlay

An Astro content collection at `src/content/crew/`, one Markdown file per member, declared and
Zod-validated in `src/content.config.ts`. The filename is the URL slug.

```yaml
---
export: "fvtt-Actor-t'zel-nloZyUHeyUKNuQDw.json"
displayName: T’zel
role: ECHANI MONK
initials: T
tagline: Quiet hands. Quieter judgement.
portrait: media/crew/t-zel.png
languages: [Basic, Huttese, Binary]
status: active
order: 1
---
Echani monk. Notices who reaches for a weapon first.
```

Schema:

| Field | Required | Notes |
|---|---|---|
| `export` | no | Export filename. Absent means a flavor-only member with no stat strip. |
| `displayName` | yes | Wins over `sourceName`; preserves typography such as `T’zel` and `Borís`. |
| `initials` | yes | Fallback plate when `portrait` is absent. |
| `tagline` | yes | One line, shown on the card and the dossier. |
| `role` | no | Hand-written and expected; falls back to a derived `ECHANI · MONK`. |
| `portrait` | no | Path under `public/`, base-prefixed at render. |
| `languages` | no | Hand-written. The exports are not a usable source. |
| `status` | yes | `active`, `former`, or `deceased`. |
| `order` | yes | Carousel and index ordering. |

The Markdown body is the bio prose. Every field currently inline in the `crew` array in
`crew.astro` moves into these files; the array is deleted.

## Component: the merge layer

`src/lib/roster.js`. Reads the content collection, sorts by `order`, and joins each entry to
`roster.json[entry.data.export]`. Returns
`{ slug, displayName, role, initials, tagline, portrait, languages, status, body, sheet }`,
where `sheet` is `null` for flavor-only members.

**`role` is expected to be hand-written.** The existing roster copy already carries roles with more
character than any derivation would produce — `HUMAN SCOUT / SMUGGLER`, `SMALL WHEELED DROID /
DECEASED` — and those carry over verbatim into the overlay files. The overlay's `role` is the
normal path, not an override.

The derived fallback exists for a member whose overlay omits it: species and primary class,
uppercased, as `RODIAN · SENTINEL`.

The dossier appends the subclass to whichever form is in play — `ECHANI MONK · ECHANI ORDER`,
`HUMAN SCOUT / SMUGGLER · TELEPORTATION TECHNIQUE` — since the subclass is genuinely
characterizing where a level number is not. The carousel card shows the role alone. No level
appears anywhere.

The layer emits a build-time console warning in both mismatch directions: an overlay naming an
export that does not exist, and an export that no overlay references. Warnings, not errors, so a
freshly dropped export never blocks a build.

## Component: the pages

**`src/pages/crew/index.astro`.** The existing carousel, its circular navigation, and the
UNSEAL BIO toggle are unchanged. Each card keeps its hand-written role line and gains an
`OPEN FILE →` link to the dossier.

**`src/pages/crew/[slug].astro`.** `getStaticPaths()` from the merge layer, so a page exists as
soon as an overlay file does.

```
[portrait]   T’ZEL
             ECHANI MONK · ECHANI ORDER
             "Quiet hands. Quieter judgement."

             Background  Bounty Hunter      Size  Medium
             Languages   Basic, Huttese, Binary

             STR 10   DEX 18   CON 14   INT 11   WIS 16   CHA 10

             PROFICIENT  Acrobatics · Athletics · Insight · Stealth

             Echani monk. Notices who reaches for a weapon first.
```

Expertise skills are marked distinctly from plain proficiency. Rows whose data is absent do not
render, so a member with no recorded languages simply has no Languages row.

Styling reuses the existing `global.css` vocabulary — `plate`, `kicker`, `mono`, `rank`, `lede` —
so the dossier reads as the same system as `/hangar/banshee`. No new design language is introduced.
All internal links and asset paths go through `import.meta.env.BASE_URL`, since the site is served
from `/blacksite` locally and `/sw5e-blacksite` on GitHub Pages.

## Build wiring

```json
"scripts": {
  "roster": "node scripts/build-roster.mjs",
  "dev":    "npm run roster && astro dev",
  "build":  "npm run roster && astro build"
}
```

Regeneration is idempotent, so the committed `roster.json` and a fresh build always agree.
No new dependencies.

## Content changes

**Kreia joins the roster.** Her portrait is downloaded from the Forge URL in her export to
`public/media/crew/kreia.png` (741x995 PNG, already retrieved). Her tagline and bio prose are
drafted in the roster's existing dry-institutional voice for the author to rewrite.

**Portraits stay local.** All nine actors carry `assets.forge-vtt.com` portrait URLs. The overlay
references local files under `public/media/crew/` so no build depends on Forge availability. The
Forge URL is not stored.

**Languages.** The `source` column records where each row came from, since only four were
supplied directly.

| Member | Languages | Source |
|---|---|---|
| Borís | Basic, Gunganese, Huttese | author |
| Dax Thorne | Basic, Huttese, Bocce | author |
| Deech Zhetriss | Basic, Rodian, Bocce (passable) | author |
| T'zel | Basic, Huttese, Binary | author, plus `binary` from export |
| Morkk | Basic, Huttese, Togorese | export, faithful |
| DV-Rangoon | Basic, Binary, Bothese, Ewokese, Jawaese, Twi'leki | export, faithful |
| DV-8 | Basic, Binary, Tusken, Huttese | author |
| Kreia | Basic, Miralukese, Sith, Zabraki | export, plus inferred Basic |
| Maurice | Basic, Gunganese, Huttese | export, plus inferred Basic |

Rows marked faithful are the export's `languages.value` expanded to display form, where the SW5e
key `common` maps to `Basic`. The two inferred rows add `Basic` where the export omitted it, which
is safe for a crew that operates together; nothing else is invented.

`Binary` is retained for T'zel because the export records it and the author's note read as
additive. The export vocabulary spells the Gungan language `gungan`; display spelling is
normalized to `Gunganese` for both Boris and Maurice.

## Scope

Adds `data/actors/`, `scripts/build-roster.mjs`, `scripts/build-roster.test.mjs`,
`src/data/roster.json`, `src/content/crew/`, `src/content.config.ts`, `src/lib/roster.js`,
`src/pages/crew/[slug].astro`, and `public/media/crew/kreia.png`. Moves `src/pages/crew.astro` to
`src/pages/crew/index.astro`. Extends `src/styles/global.css` with dossier styles and
`package.json` with the `roster` and `test` scripts.

Does not touch the hangar, travelogue, about, gm, or index pages, the shared layout, the carousel
behavior, or any existing page copy other than the roster array being relocated into overlay files.

## Testing

`scripts/build-roster.test.mjs`, using `node:test` and `node:assert`. The nine committed exports
serve as fixtures; they are real data and they do not move.

- Every actor yields a non-empty species, at least one class with a positive level, and all six
  ability scores as integers.
- An unknown skill code throws.
- An unknown size code throws.
- `Borís` survives the read with its accented character intact. The exports are UTF-8 and Windows
  tooling readily mangles that.
- Expertise is distinguished from plain proficiency where an actor has a multiplier of 2.
- The merge layer warns, and does not throw, on an overlay naming a missing export.

## Verification

- `npm test` passes.
- `npm run build` succeeds and generates `/crew` plus one route per overlay file.
- `src/data/roster.json` is unchanged by a rebuild after being committed.
- Built HTML for `/crew/t-zel` contains the ability scores, the proficient skills, and the
  languages row.
- Built HTML for `/crew/stalker` renders without a stat strip and without errors.
- `/crew/kreia` renders with the downloaded portrait.
- No class level number appears in any built page.
- The build log lists no unmatched exports.
