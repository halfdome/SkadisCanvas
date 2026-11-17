# Skadis Canvas

Current release: **v1.1** (November 16, 2026).

- **v1.0** — the version before November 16, 2026; tagged at `504e1fc`, the last commit before that date in the site history.
- **v1.1** — today’s board-style and spacer controls, usability improvements, prime-tower sizing, filament estimates, and preview color mapping. Git tags preserve both release snapshots without rewriting prior commits.

A browser app for turning a flat-color illustration into a tiled, multicolor pegboard mural. Built with React and Vinext. Artwork processing and mesh generation run in the browser; the app does not upload images or STL files.

## Run

Requires Node 22.13+ and pnpm. Run `pnpm install`, then `pnpm dev`. Use `pnpm build` for the production Worker build. Run `node --test tests/*.test.mjs` for geometry tests.

## Features

- **Full flat board** is the default board design (8 columns × 5 rows): a flat pegboard with configurable slots. Saved settings include its design identifier; older settings files use this default.

- **Board with spacers** preserves the supplied 200 × 200.08 mm mesh, including the original outline, slots, and mounting-hole profiles. Defaults are 10 mm spacer height and 15 mm outer diameter; height is adjustable from 2–40 mm and diameter from 10–20 mm. Only the rear spacer section changes; board dimensions and face-down orientation are fixed. Back engraving is currently available on the full flat board only. The reference is unsliced geometry; slicer reinforcement modifiers from the uploaded project are not part of the board shape.
- Parametric board width, height, thickness, staggered hole pitch and capsule slot dimensions.
- Configurable rows, columns and installed gaps; defaults to 8 columns × 5 rows of 200 mm tiles with zero gap. One wall-wide hole lattice preserves spacing across seams. Shared-edge mode uses half-slots (and quarter-slots at junctions) that complete at tile seams, while keeping the outer wall perimeter closed. Multiples of the pitch give regular half-slots; arbitrary sizes retain the global lattice with asymmetrically split slots. Inset mode is also available.
- PNG/JPEG/WebP/SVG artwork, fit/fill, zoom, positioning and 1–32 source colors. Defaults to 8 colors for H3C and 4 for other Bambu models; changing the count rebuilds the palette from the original image. Similar source colors can share a filament.
- Filament estimates in grams and meters for the selected tile, plus an on-demand whole-canvas breakdown. Estimates integrate the generated model cross-sections with 15% infill, two preset-width walls, and exported skin settings, including the 1 mm minimum top skin. Holes, backing, engraving and spacer legs are included; purge, prime towers, supports and failed prints are excluded. Named filaments use their profile density and diameter; custom materials explicitly assume PLA (1.24 g/cm³), 1.75 mm. Design changes invalidate cached totals; whole-canvas estimation is cancellable. Final spool usage must be checked after slicing.
- Preview sidebars rank the chosen source colors by sampled image share and show numbered matches to unique filaments, with whole-canvas estimated grams. The source count follows the surface-color selection, capped by colors actually extracted; shared material matches are merged and backing is identified separately. On narrow screens the lists move below the full-canvas preview.
- Landscape coastal sample, whole-wall preview, temporary selection masking, a selected-tile close-up and source-resolution feedback. The print cross-section uses only filament colors actually present in that tile’s exported surface geometry. Controls include keyboard-accessible help bubbles; seam alignment includes an explanatory diagram.
- Face-down or face-up printing, defaulting to face-down with 3 × 0.2 mm colored layers and a 4.4 mm backing. The live cross-section reflects layer count, layer height, board thickness and orientation. Backing defaults to Bambu PLA Basic / Jade White and remains independent of surface palette rematching.
- One native Bambu Studio 3MF for up to 36 tiles; larger murals automatically split into balanced rectangular projects, downloaded in one ZIP. Custom printers use one portable core 3MF. Selected-tile ZIP includes a 3MF, STL parts and assembly map; blank fit-test STL and project settings are also available.
- Native Bambu Studio 0.4 mm presets for H3C, X1C, H2C, H2D, H2D Pro, H2S, X2D, X1E, X1, P2S, P1S, P1P, A2L, A1 and A1 mini. Board limits account for nozzle reach, cutter clearance and the prime tower.
- Named Bambu filament swatches and machine-specific slicer presets for PLA Basic, Matte, Tough+, Silk+ and CF; PETG Basic, HF, Matte, Translucent and CF; ABS, ABS-GF, ASA and ASA-CF. Combined matching ranges include Basic + Matte, all PLA, PETG Basic + HF, and all PETG. The available choices depend on the printer. Use one base material across the surface and backing for easier print setup.
- Color depth can cover every layer; at full depth the artwork colors extend through the tile with no separate backing.
- Optional recessed rear tile IDs such as R02-C03. Engraving requires a separate backing. IDs use the same installed-wall coordinates as the 3MF plate names and assembly map.
- ASCII/binary STL inspection and optional bounding-box dimensions. Imported mesh geometry is not used.
- Worker-based export with progress and cancellation. Limits: 100 boards, 160,000 samples per tile, 1.5 million samples across the design.

## Geometry and orientation

The image is placed once in installed-wall coordinates, including the gaps. Each tile samples its physical region and quantizes the image to the chosen palette. Horizontal pixel runs are unioned per color with polygon-clipping, intersected with the slotted board footprint, triangulated with earcut and extruded into a thin surface volume. The backing occupies the remaining thickness. Surface regions and backing share boundaries without volume overlap.

Artwork rows go from top to bottom. Model Y goes from bottom to top. Face-down export rotates the model 180 degrees around Y, using `(width − x, y, thickness − z)`. This is a rotation, so triangle winding is preserved and the installed artwork reads correctly. Do not apply an additional mirror in the slicer. Face-up export retains the artwork on top of the backing, so the colored layers print last. For face-up printing, board thickness must be a multiple of layer height to preserve the requested colored-layer count.

## Slicer workflow and current limits

1. Print a blank board to check accessory fit. Default slot dimensions are a starting point, not a certified IKEA fit.
2. Export one colored tile and open its 3MF as a project in Bambu Studio. Review the printer and filament presets. Custom-printer core 3MF needs manual filament and plate setup.
3. Alternatively, import all selected-tile STLs together as parts of ONE object; preserve their positions. Do not independently center or drop parts to the bed.
4. Use the configured first and subsequent layer heights. Inspect the colored layers and small features before printing.
5. Print one test before committing to the whole wall.

The output is unsliced geometry with machine-specific Bambu project settings. Import and slicing have been validated in Bambu Studio 2.9.1.70. Physical printing has not been tested. The full flat board has no rear spacers or mounting holes. The spacer reference preserves its existing spacers and mounting-hole geometry. Mounting hardware, tile connectors, load rating and structural engineering are not provided. The preview uses an approximate screen raster; exported color boundaries follow the selected mm/pixel sampling. Raster upscaling cannot restore detail. Vector paths are currently rasterized too. Small clipped features may be below the nozzle’s printable width.

Save settings as… opens a native file-location picker in compatible browsers; other browsers use their download settings. Project JSON contains settings but not source artwork; upload the matching image when restoring settings. Browser reloads otherwise reset the project.

## Next milestones

- Test fit and face opacity on a small print; tune slot tolerance and colored-layer count.
- Physically validate the reference spacer design and add calibrated mounting or panel connectors as needed.
- Extend the curated reference-design approach to arbitrary uploaded templates with explicit face selection.
- Trace vector color regions for smoother, more efficient illustration exports.
- Consider an OpenSCAD board-only edition for MakerWorld Customizer after the core print workflow is proven.

## References

- [3MF core specification](https://github.com/3MFConsortium/spec_core/blob/master/3MF%20Core%20Specification.md)
- [MakerWorld Parametric Model Maker overview](https://forum.bambulab.com/t/parametric-model-maker-v1-1-0-major-ui-refresh/203564)

## Printer planning

X1C nominal volume is 256 × 256 × 256 mm; H3C is 330 × 320 × 325 mm. The X1C rectangle conservatively reserves the full left 18 mm strip to avoid its 18 × 28 mm front-left cutter area. Default planning allowances add 5 mm on every edge and a 40 mm rear strip for a tower. Resulting tile allowances are X1C 228 × 206 mm and H3C 320 × 270 mm. These margins are app defaults, not manufacturer requirements; confirm actual tower, brim, nozzle and plate placement in the slicer. The largest pitch-aligned sizes with these defaults are 200 × 200 mm and 320 × 240 mm respectively.

Bambu files place one tile per print plate. Murals larger than 36 tiles split into balanced rectangular portions. A 5×8 mural becomes two 5×4 projects with 20 plates each. Each tile appears once, retains its installed-wall coordinates, and uses the same whole-wall hole lattice and image sampling across file boundaries. Custom-printer 3MF uses an inventory layout with 10 mm spacing and requires manual plate arrangement. Its filename identifies the selected printer version. Changing printer does not silently resize the artwork or board: the app blocks oversized boards and offers an explicit largest-size button.

Sources: [X1C manufacturer specifications](https://public-cdn.bambulab.com/store/bambulab-X1-carbon-tech-specs.pdf?v=20250816053819), [X1C machine profile](https://raw.githubusercontent.com/bambulab/BambuStudio/master/resources/profiles/BBL/machine/Bambu%20Lab%20X1%20Carbon%200.4%20nozzle.json), [H3C machine profile](https://raw.githubusercontent.com/bambulab/BambuStudio/master/resources/profiles/BBL/machine/Bambu%20Lab%20H3C%200.4%20nozzle.json). Swatches come from the Bambu Studio system color catalog and the manufacturer color references recorded in `lib/filaments.mjs`. Colors are approximate manufacturer display swatches, not calibrated predictions of a finished print or live inventory.

## Bambu Studio export repair (2026-11-13)

Bambu exports are unsliced Bambu Studio projects for a 0.4 mm nozzle. Open the file as a **project**. Each active tile occupies one plate; backing and surface volumes remain parts of one named object. The project includes per-part filament assignments, the selected layer height, and official system preset values. A top view shows the backing because the artwork is face-down; inspect the first layers in Preview.

Bambu Studio supports **36 plates per project**. For a 5×8 mural, the exporter creates two 5×4 projects with 20 plates each. Both 3MF files and an assembly map download together in one ZIP. Rectangular splits minimize the number of files first, then balance the number of tiles. Every tile is included exactly once; there are no queued or disabled objects. Custom-printer export remains portable 3MF and requires manual plate arrangement and filament setup. Custom/other-brand filaments use Generic PLA as a starting preset; select the real material before printing.

The previous export had no Bambu project metadata and put the entire mural across a single plate. Reproduced in Bambu Studio 2.9.1.70: the generic color importer appeared, objects exceeded the plate boundary, and slicing was disabled.

Run `pnpm test` for geometry, seam, material, rectangular partition membership, and plate-placement regression tests. Run `pnpm test:bambu` on macOS with Bambu Studio installed, or set `BAMBU_STUDIO` to its executable path. The integration test imports and slices two four-color tiles for each printer using the actual Bambu CLI, requires a successful exit, and inspects the generated G-code. It asserts 25 layers at 0.2 mm, four colors in layers 1–3, only backing filament in layers 4–25, and nonzero material usage for every color. Results and logs are written under `outputs/validation/`. The CLI needs normal macOS graphics access to render preview images. Set `BAMBU_GCODE_ONLY=1` to validate native slice-only G-code without rendering thumbnails. This retains slicer checks, layer/material assertions, and measured tower-to-tile clearance; it does not test thumbnail generation. Set `MAX_TILE=1` and `PRIME_TOWER_STYLE=wall` or `standard` for maximum-size fixtures; `SURFACE_COLORS=8` and `TEST_LAYER_HEIGHT=0.1` exercise larger tower requirements.

`lib/bambu-profiles.mjs` is a snapshot of Bambu Studio 2.9.1.70 **system** presets, never user presets. Regenerate it with `python3 scripts/snapshot-bambu-profiles.py /path/to/BambuStudio/resources/profiles/BBL`. Upstream: https://github.com/bambulab/BambuStudio/tree/master/resources/profiles/BBL. See `third-party/BambuStudio-LICENSE.txt` for the upstream AGPL license. The `Application` marker selects Bambu's project importer; the `Generator` metadata identifies Skadis Canvas as the actual generator.

These checks establish import and slicing behavior. Physical print quality, color accuracy, layer adhesion, mounting, and accessory fit still require a test print.

For browser regression validation, upload `tests/fixtures/original-colors.svg`, keep the default 8×5 wall, and export each printer version (use the largest-size button for H3C). The upload must suggest Bambu Green, Yellow, Red and Cyan without clicking the match button. Pass each downloaded ZIP to `node scripts/validate-browser-export.mjs /path/to/download.zip outputs/validation/browser-x1c` (or `browser-h3c`). This uses the actual downloaded bytes, slices all 40 plates across both rectangular files, checks tile coverage and original wall coordinates, and verifies the surface/backing layers in the resulting G-code. Open a representative file in the GUI too; CLI success does not replace visual inspection.

For estimator calibration, `node scripts/validate-usage.mjs <h3c-sliced.3mf> <x1c-sliced.3mf>` compares each filament against native model extrusion in the two 80 mm integration-test tiles. It excludes tower and custom/start G-code. This is a slicer comparison, not a physical-print measurement.
