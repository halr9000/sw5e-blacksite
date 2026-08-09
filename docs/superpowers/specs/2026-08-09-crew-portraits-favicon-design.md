# Crew Portraits and Favicon Design

## Goal
Replace the crew carousel placeholders with the supplied portraits, correct the roster names, and add a branded SVG favicon that works on the subpath preview and GitHub Pages.

## Design

- Store all supplied portraits locally under `public/media/crew/` so the static build has no dependency on the Home Gallery share host.
- Add a `portrait` field to each roster record. The existing carousel, reveal interaction, and presentation-only clones remain unchanged.
- Render a real image when a record has a portrait; retain the existing initials plate only for Stalker, who has no supplied portrait.
- Use `object-fit: cover` inside the existing portrait panel, with the panel's current palette and sizing preserved.
- Correct `Dax Throne` to `Dax Thorne` and `DV-US` to `DV-U5` everywhere in the roster.
- Add `public/favicon.svg`, using the existing black/orange forged-plate palette and the wordmark's diamond mark. Reference it through `BASE_URL` in the shared layout.

## Asset map

| Roster record | Local asset |
|---|---|
| Dax Thorne | `media/crew/dax.jpg` |
| Morkk the Guiltless Predator | `media/crew/morkk.jpg` |
| Deech Zhetriss | `media/crew/deech.png` |
| DV-8 | `media/crew/dv-8.jpg` |
| DV-Rangoon | `media/crew/dv-rangoon.jpg` |
| DV-U5 | `media/crew/dv-u5.jpg` |
| T’zel | `media/crew/t-zel.png` |
| Maurice | `media/crew/maurice.png` |
| Borís | `media/crew/boris.png` |

## Scope

Modify only the roster page, shared layout, relevant CSS, and the new local media/favicon assets. Do not alter the existing carousel behavior or unrelated page copy.

## Verification

- Confirm all nine portrait files and the favicon exist.
- Run `npm run build` and verify all nine static routes are generated.
- Scan built HTML for `Dax Thorne`, `DV-U5`, portrait asset paths, and favicon reference.
- Confirm the git working tree is clean after commit and push.
