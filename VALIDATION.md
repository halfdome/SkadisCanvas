## Bambu lineup, filament presets and rear tile IDs — 2026-11-13

- Bambu Studio 2.9.1.70 imported and sliced two labeled plates for each of 15 printer profiles. Verified the saved printer preset and 25-layer output with color on the first three layers. X2D required recognizing indented filament-switch commands in the G-code validator. Dual-nozzle placement uses the common travel area.
- Downloaded two 2 × 2 walls from the actual browser build: A1 mini with PETG HF face-down and P2S with ASA face-up. All eight plates sliced, retained their material type, and placed the artwork only in the expected layer band. Visually inspected PETG back engraving R02-C02 and artwork in Studio Preview, and the ASA artwork and four-plate layout. Studio displayed its high-temperature nozzle-clumping warning on the ASA project.
- All 43 tests and the production build passed. Tests cover engraving watertightness, front artwork preservation in both orientations, compatible material metadata and dual-nozzle reach. No physical prints were run. Evidence: outputs/printer-and-tile-id/.

## Customer-facing interface copy — 2026-11-13

- Removed the prototype badge, browser-storage banner, promotional introduction, repeated layer summary and nonessential preview commentary. Refined labels, notifications, STL dimension guidance and the print guide; retained actionable printer, material and import information.
- Reviewed the rendered designer and print guide at 1280 × 720 and 390 × 844. Final narrow-pane review found preview-tab overflow near 320 px. Added a small-screen breakpoint for the header and wrapping preview tabs, then confirmed no horizontal overflow at 320 px. Exercised board dimensions, artwork upload, color matching, STL guidance, selected-tile controls and the actual selected-tile download.
- Confirmed the downloaded ZIP includes the revised tile print guide. Bambu Studio sliced its 80 × 80 mm H3C tile successfully; G-code validation confirmed one plate, 25 layers and three colored layers. Opened the slice in Studio and inspected the centered tile, separate tower and colored artwork at layer 3 (0.60 mm).
- Production build and all 40 tests passed. X1C and H3C Bambu integration checks passed with two plates each. No geometry or printer configuration changes. No physical print was performed.
- Screenshots and slice evidence: outputs/validation-polish/.

## Skadis Canvas rename — 2026-11-13

- Renamed the visible app, browser title, settings picker and export generator metadata to Skadis Canvas. Kept the Bambu Studio compatibility marker unchanged.
- Production build and all 40 automated tests passed. Bambu Studio integration validation passed for X1C and H3C, each with two plates and three colored layers in a 25-layer board.
- Downloaded an 80 × 80 mm H3C project through the renamed browser UI, sliced that actual download successfully in Bambu Studio, and opened the sliced result in its GUI. Inspected layer 3 at 0.60 mm: colored artwork, holes, centered tile and separate purge tower were visible.
- Evidence: outputs/skadis-canvas.png and outputs/skadis-canvas-studio-layer3.png. No physical print was performed.

## Dynamic cross-section, print orientation, backing and Save As — 2026-11-13

- Reproduced the report in the prior browser build: changing colored layers from 3 to 8 left the diagram fixed at 23 px backing / 7 px color.
- Browser regression checks now show 1, 3 and 8 colored strata, with color heights 2.55, 7.68 and 20.48 px in a 64 px stack for a 5 mm board at 0.2 mm/layer. Backing shrinks proportionally. At 0.1 mm/layer and 4 mm thickness, eight layers produce 0.80 mm color / 3.20 mm backing and a 20% color band. Invalid zero colored layers hides the diagram and disables export.
- Face-up reverses the stack; the build plate remains below it. Checked desktop and 390 px mobile layout, without horizontal page overflow.
- New sessions default to Bambu PLA Basic / Jade White. Verified this persisted after original-image upload, palette rematching and changing printer.
- Real browser downloads: H3C face-up with 8 colored layers and X1C face-down with 3 colored layers, each an 80 × 80 × 5 mm tile. Bambu Studio CLI successfully sliced both. Inspected actual generated G-code: H3C has only white backing in layers 1–17 and all four source colors in layers 18–25; X1C has all four source colors in layers 1–3 and only white backing in layers 4–25.
- Opened the H3C slice in Bambu Studio GUI; visually inspected top artwork at layer 25 and white backing at layer 17 (3.40 mm). Restored the original user project and Device view afterward. Did not start or modify any print job.
- Chrome native Save As: selected outputs/validation-orientation and a custom settings-save-as-test.json filename; verified the resulting JSON and reloaded it through the app's Load settings flow. Restored grid dimensions, layer count and white backing matched. Native picker cancellation is covered by an automated test; unsupported browsers retain browser-managed downloads.
- Production build passed. All 40 tests passed, including new orientation geometry/guide, white backing, layer alignment and save-handle tests. Existing custom-filament fixtures explicitly retain their intended backing material.
- Evidence and executable slice validator: outputs/validation-orientation/ and scripts/validate-orientation-export.mjs. No physical print was performed. Face-up requires board thickness to be a multiple of layer height so the requested colored layer count is exact.

## Total dimensions and compact navigation — 2026-11-13

- Built the production app successfully and exercised its rendered browser UI.
- Both the Board dimensions total and preview heading showed 1,000 × 1,600 mm for the default 5 × 8 grid.
- Changed columns to 4, rows to 3, board width to 240 mm, height to 160 mm, and gap to 2 mm through the UI. Both totals updated to 966 × 484 mm; changing gap back to 0 produced 960 × 480 mm.
- Checked 1280, 1024, and 390 px viewport widths; no horizontal page overflow. Visually inspected desktop and phone layouts.
- Navigation measured 64 px on desktop (previously 85 px) and 60 px on mobile (previously 70 px). Desktop preview top measured 161.09 px (previously 183.59 px).
- Screenshot: outputs/total-dimensions-desktop.png.
- This update changes labels and layout only. No new 3MF/slicer or physical-print validation was performed; prior export validation below remains the applicable evidence.

# Compact composition toolbar — 2026-11-13

UI-only update: combined the composition heading, view controls and wall download into one toolbar. At 1280px desktop width, the preview begins at Y=184 instead of Y=301, reclaiming about 117px. At 390px, controls wrap without horizontal overflow. Preview switches and the relocated download button were exercised in the browser; the downloaded ZIP contained two 3MF projects with all 40 unique tiles. Production build passed. Export and geometry code are unchanged; no new slicer or physical tests were performed for this layout-only change.

# Validation — 2026-11-13, layout, palette, placement and crop update

Tested with Bambu Studio 2.9.1.70 on macOS. No physical print or print job was performed.

## Browser and consuming-application checks

- Uploaded controlled eight-color PNG and 32-color SVG illustrations through the browser. The 32-color image retained all original RGB source colors. Custom-filament export retained all 32 assignments. Bambu Studio CLI and GUI both sliced the actual downloaded 32-color project; the GUI save preserved its filament assignments and process settings.
- Exercised 400% zoom, pointer dragging, keyboard positioning, reset, Fill canvas and Fit artwork. Downloaded a cropped two-color image at horizontal position 100%, leaving only its blue half, with an independently chosen green backing. The backing selection survived upload and palette regeneration. Actual G-code used blue in layers 1–3 and green alone in layers 4–25.
- Downloaded a fitted version with green borders. Actual slicing contained all three colors in layers 1–3 and green alone above them. Opened this download in Studio, sliced it and visually inspected layer 3 and layer 25: the fitted face, green borders and solid green backing matched the browser configuration.
- At 1440 × 1000, left controls and lower details scrolled independently while page scroll stayed zero and canvas Y stayed at 337. At 580 × 900, normal document scrolling worked, document width stayed at 580 without horizontal overflow, and the canvas fit. Temporary viewport overrides were reset.

## Whole-wall export and tower regression

With R07/C04 selected, the entire-wall button downloaded all 40 tiles for X1C (200 × 200 mm, four colors) and H3C (320 × 240 mm, eight colors). Each ZIP contained two rectangular 20-plate projects. Every tile appeared exactly once. Bambu Studio CLI sliced all 80 plates successfully, with the expected colors in layers 1–3 and single-color backing in layers 4–25.

An initial large eight-color export reproduced a prime-tower collision. The revised planner accounts for nozzle-change prime volume, filament-change volume, ribs and slicer tolerance. Standard Bambu tower settings are preferred; compact rectangular towers preserve larger tile sizes. Tiles remain as close to plate center as tower and excluded-region clearance permit.

`node scripts/validate-placement.mjs` sliced five additional cases: X1C 200 × 200/4 colors; H3C 200 × 200/8, 320 × 240/8, 320 × 270/8 and 120 × 120/32. Actual extruding tower bounds stayed inside the bed and clear of the tile. The largest case retained its requested 320 × 270 mm size.

Opened the large H3C browser export in Studio and visually inspected its first three colored layers and compact tower. Saved it through the GUI and verified all authored process/tower overrides survived. The 32-color GUI round trip also preserved standard tower settings. Studio may adjust tower X coordinates; the validator permits bed-safe X movement and requires unchanged Y clearance and overrides.

## Evidence and automated validation

- 36 regression tests passed, covering geometry, continuous half-slot seams, partition completeness, original colors, 32-color export, backing persistence, crop transforms and uncovered surface geometry.
- Required `node scripts/validate-bambu.mjs` passed on final geometry: two actual four-color sliced plates per printer with surface/backing layer checks.
- Production build passed. Verified 25 production source/config/asset inputs against the hydrated build checkout before copying the build for publication.
- No browser console errors observed during final local validation.
- Full-wall logs, sliced projects and reports: `outputs/validation-v5/x1c/` and `outputs/validation-v5/h3c-corrected/`.
- GUI screenshots: `outputs/validation-v5/studio-h3c-color-layers.png`, `studio-32-colors.png`, `studio-fit-surface.png` and `studio-green-backing.png`.

## Limits

Testing used controlled flat-color fixtures and the built-in illustration, not every image or parameter combination. Palette slots do not establish installed printer filament capacity. Screen swatches approximate printed appearance. No physical testing of color, opacity, bonding, accessory fit, strength or mounting was performed. Custom-printer exports require manual slicer setup.

CLI logs include preset-resource warnings and an H3C `Invalid T command(T65535)` parsing warning from the unchanged official machine-end template. Validated runs exited successfully and passed layer assertions; vendor G-code was not altered to suppress these messages.
