# Validation — 2026-11-13

Tested with the installed Bambu Studio **2.9.1.70** on macOS. No physical printing was performed.

## Reproduced failure

The previous generic 3MF opened through Studio's color-conversion wizard and placed the entire 40-tile inventory over one print bed. Studio reported objects outside the boundary and disabled slicing. The repair writes native project metadata, per-part filament assignments, complete system preset values, and one tile per plate.

## Actual browser → file → Bambu Studio checks

Used the production build in Safari, uploaded `tests/fixtures/original-colors.svg`, and confirmed automatic suggestions for Bambu Green, Yellow, Red and Cyan. Downloaded the ZIPs through the app's Export button; validation consumed those exact downloaded bytes.

| Printer | Board size | Downloaded files | Actual sliced plates | Result |
| --- | --- | --- | --- | --- |
| X1C | 200 × 200 × 5 mm | Two 5×4 rectangles | 20 + 20 | Passed |
| H3C | 320 × 240 × 5 mm | Two 5×4 rectangles | 20 + 20 | Passed |

Each pair contains exactly 40 distinct tiles. Files retain original row/column coordinates, cover rows 1–4 and 5–8, and include no disabled or queued tiles. The actual slicer exited successfully for all four projects. G-code inspection verified all 80 plates have 25 layers at 0.2 mm, four surface colors in layers 1–3, and only backing filament in layers 4–25.

Opened a browser-generated X1C rectangle in the Bambu Studio GUI: 20 separate plates, correct printer and four filament assignments, slicing enabled. Sliced the first plate in the GUI and visually inspected its four-color surface at layer 3 / 0.60 mm. Earlier native H3C import was also inspected in the GUI. The user's prior Studio project was restored afterward without overwriting it.

Also downloaded selected tile R07-C04 from the sample illustration. Its ZIP contains one native 3MF and four STL volumes; the 3MF retains row 7 / column 4 metadata. Actual Bambu slicing succeeded; its three surface colors occupy the first three layers, with backing only above. No print job was sent.

Results/logs are in `outputs/validation/browser-x1c/`, `outputs/validation/browser-h3c/`, and `outputs/validation/selected/`. GUI evidence is `outputs/validation/browser-x1c-layer3.png`.

## Regression checks

- 20 automated tests passed: closed meshes, orientation, volume partition, half-slot seams, printer limits, colors, native plate placement, selected-tile origin, and complete rectangular coverage for supported grid sizes.
- `pnpm test:bambu` passed: two four-color tiles per printer, actual import/slicing, first-layer colors, single-color backing, nonzero filament use.
- Production build passed. Preview used identical production source inputs; the generated build was copied back to the main checkout after source parity checks.
- Larger text, upload, automatic matching, maximum H3C size, full-wall ZIP download and selected-tile download exercised in Safari. Final desktop layout inspected visually.

## Limits

These checks establish import and slicing behavior for the tested cases, not physical print quality. Accessory fit, adhesion, face opacity, load capacity, mounting, and actual AMS/printer operation need a test print. Other materials, nozzle diameters, arbitrary user artwork and all possible parameter combinations were not physically or exhaustively tested. Native profiles target a 0.4 mm nozzle. Custom-printer core 3MF still needs manual slicer setup.

The macOS CLI logs warnings about missing pre-expanded `machine_full`/`process_full` presets; exported projects carry resolved system settings. H3C also logs `Invalid T command(T65535)` while parsing the unchanged official machine-end template. All tested CLI runs still completed with exit code 0 and passed Bambu's G-code export validation and the layer assertions. These log messages are retained; the vendor G-code was not edited to suppress them.
