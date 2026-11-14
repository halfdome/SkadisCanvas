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
