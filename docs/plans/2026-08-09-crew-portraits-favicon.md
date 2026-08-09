# Crew Portraits and Favicon Implementation Plan

> **For Hermes:** Implement this plan task-by-task in the existing Astro project.

**Goal:** Wire nine supplied crew portraits into the carousel, correct Dax and DV-U5, and add a local branded SVG favicon.

**Architecture:** Keep roster data in `src/pages/crew.astro`, add local static assets under `public/media/crew/`, and resolve the favicon through the shared layout's existing `BASE_URL`. Preserve the current carousel and reveal JavaScript.

**Tech Stack:** Astro static output, local CSS, JPG/PNG/SVG assets.

---

### Task 1: Add local portrait assets

**Files:**
- Create: `public/media/crew/dax.jpg`
- Create: `public/media/crew/morkk.jpg`
- Create: `public/media/crew/deech.png`
- Create: `public/media/crew/dv-8.jpg`
- Create: `public/media/crew/dv-rangoon.jpg`
- Create: `public/media/crew/dv-u5.jpg`
- Create: `public/media/crew/t-zel.png`
- Create: `public/media/crew/maurice.png`
- Create: `public/media/crew/boris.png`

Copy the two downloaded share previews and seven supplied attachments into the exact paths above. Verify with `file` and `du`.

### Task 2: Make roster records data-driven for portraits

**Files:**
- Modify: `src/pages/crew.astro`

Add a portrait path to each record, correct `Dax Thorne` and `DV-U5`, destructure the new field, and render an `<img>` when present. Keep initials as the fallback for Stalker.

### Task 3: Style image portraits and add favicon metadata

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/layouts/Layout.astro`
- Create: `public/favicon.svg`

Add image sizing rules that preserve the existing card proportions. Create the compact black/orange diamond favicon and reference it as an SVG through `BASE_URL`.

### Task 4: Build and inspect output

Run:

```bash
npm run build
find dist -path '*/index.html' | sort
```

Expected: exit 0 and nine generated route pages. Confirm built HTML contains the corrected names, local portrait paths, and favicon reference.

### Task 5: Commit and push

```bash
git add public/media/crew public/favicon.svg src/pages/crew.astro src/styles/global.css src/layouts/Layout.astro
 git commit -m "feat: add crew portraits and archive favicon"
git push
```

Verify `git status --short --branch` reports the branch aligned with origin.
