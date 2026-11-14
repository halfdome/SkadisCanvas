# Validation — 2026-11-13, export and color repair

Tested with installed Bambu Studio **2.9.1.70** on macOS. No physical print was performed and no print job was sent.

## Reported single-tile download

Revisited the deployed previous version with R07/C04 selected. Its entire-wall action downloaded two 20-plate projects, whereas its selected-tile action downloaded one R07/C04 project but displayed an incorrect whole-project success message. The reported one-tile artifact is reproducible through that ambiguous action; a one-tile result from the entire-wall action was not reproduced.

The primary action now explicitly says “Download entire wall · 40 tiles” above the composition. Single-tile exports are separately labelled and collapsed under “1 tile only.” Download filenames and success messages include their actual scope. The exporter rejects incomplete, duplicate or out-of-range whole-wall tile lists.

## Browser → download → Bambu Studio

Used the production build in the Codex in-app browser, uploaded an eight-color PNG, selected R07/C04, and downloaded the entire 5×8 wall. Validation consumed those exact downloaded bytes, not regenerated substitutes.

| Printer | Board size | Surface colors | Rectangular files | Actual sliced plates |
| --- | --- | --- | --- | --- |
| H3C | 320 × 240 × 5 mm | 8 | rows 1–4 and 5–8, all 5 columns | 20 + 20, passed |
| X1C | 200 × 200 × 5 mm | 4 | rows 1–4 and 5–8, all 5 columns | 20 + 20, passed |

Each pair contains exactly 40 distinct tiles. Bambu's actual slicer processed all four projects successfully. Inspection of every plate's G-code verified 25 layers at 0.2 mm, all requested surface colors in layers 1–3, and only backing filament in layers 4–25.

Opened the first downloaded section for each printer in Bambu Studio's GUI, sliced its first plate and inspected the colored surface at the first layers. Both showed separate plates and the correct filament count without the earlier tower collision warning. Saved each project through the GUI and compared its process settings, colors and tower clearance against the downloaded original.

This GUI round trip exposed a defect the CLI did not: without `different_settings_to_system`, Studio replaced exported process values with preset defaults. The exporter now marks its intentional process overrides. The saved copies preserve the layer, shell and rectangular purge-tower settings. Studio adjusts the H3C tower's X coordinate from 5 to 15 mm for its edge clearance; the validator permits that bed-safe adjustment while requiring Y clearance and process values to remain unchanged.

Final downloaded artifacts are `skadis-ENTIRE-WALL-h3c-5x8-40-tiles (2).zip` and `skadis-ENTIRE-WALL-x1c-5x8-40-tiles (2).zip` in Downloads. Sliced projects, logs and reports are in `outputs/validation-v4/h3c-verified/` and `outputs/validation-v4/x1c-verified/`. GUI evidence is in `outputs/validation-v4/*-gui-colored-layers.png`.

## Original-color mapping and controls

The test PNG contains eight exact manufacturer swatch RGB values repeated over the entire wall. Browser upload extracted those exact original values and matched all eight to identical catalog colors. Switching to X1C reset the requested count to four. Changing the count to three and back to eight rebuilt the source palette from the original image and restored all eight source colors. Switching back to H3C reset the requested count to eight. Fewer-color sample artwork retains its four dominant fills when eight colors are allowed.

Source RGB values and filament matches are now separate. Source-region classification uses original colors; adjusting a filament recolors that region without reclassifying the image against the replacement filament. The UI shows source and matched swatches separately and provides original, extracted-color and filament previews. Matching uses the combined Basic + Matte catalog by default.

## Regression and build checks

- 27 automated tests passed, including 4→8→3 remapping, exact RGB retention, antialias shade suppression, stable source-region membership, whole-wall completeness, native GUI process overrides, closed meshes, face-down orientation, continuous half-slot seams and rectangular partition coverage.
- `node scripts/validate-bambu.mjs` passed after the final changes: two four-color plates per printer, actual slicing, first-layer colors and single-color backing.
- Production build passed. All 23 production source/config/asset inputs were verified identical between the hydrated preview checkout and main checkout before copying the tested build for publication.
- Browser checks covered upload, printer defaults, count changes, size limits, whole-wall download and separately labelled selected-tile download. No browser console errors were observed during local validation.

## Limits

The user's specific illustration was not available as a local fixture. Extraction was exercised with controlled flat-color artwork and the built-in illustration; arbitrary photos, gradients and every parameter combination were not exhaustively tested. Catalog filament colors are approximations to real printed appearance, not a physical color guarantee.

Import, slicing and GUI round trips do not establish adhesion, opacity, accessory fit, strength, mounting or real AMS operation. Native profiles target 0.4 mm nozzles. Custom-printer core 3MF requires manual slicer setup.

The CLI logs warnings about unavailable pre-expanded machine/process preset files and H3C logs `Invalid T command(T65535)` when parsing the unchanged official machine-end template. Tested runs completed with exit code 0 and passed layer assertions. Vendor G-code was not modified to suppress these messages.
