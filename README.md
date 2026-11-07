# SKÅDIS Surface Studio

A browser app for turning a flat-color illustration into a tiled, multicolor pegboard mural. Built with React and Vinext. Artwork processing and mesh generation run in the browser; the app does not upload images or STL files.

## Run

Requires Node 22.13+ and pnpm. Run `pnpm install`, then `pnpm dev`. Use `pnpm build` for the production Worker build. Run `node --test tests/*.test.mjs` for geometry tests.

## First prototype

- Parametric board width, height, thickness, staggered hole pitch and capsule slot dimensions.
- Configurable rows, columns and installed gaps; defaults to 5 columns × 8 rows of 200 mm tiles with zero gap. One wall-wide hole lattice preserves spacing across seams. Shared-edge mode uses half-slots (and quarter-slots at junctions) that complete at tile seams, while keeping the outer wall perimeter closed. Multiples of the pitch give regular half-slots; arbitrary sizes retain the global lattice with asymmetrically split slots. Inset mode is also available.
- PNG/JPEG/WebP/SVG artwork, fit/fill, zoom, positioning and 2–8 editable filament colors with palette extraction.
- Whole-wall preview, tile selection and source-resolution feedback.
- Face-down colored surface, default 3 × 0.2 mm layers with a 4.4 mm backing.
- One core 3MF containing all named tile assemblies and their color parts. Selected-tile ZIP includes a 3MF, STL parts and assembly map; blank fit-test STL and project settings are also available.
- X1C, H3C and custom-printer dimension presets, editable edge margin and rear tower reserve. Oversize boards block export. These are geometry planning presets, not native Bambu Studio process profiles.
- Bambu PLA Basic / PLA Matte named display-color presets; Bambu PETG HF, Bambu ABS and other brands can use custom colors. Filament selections are retained in exported part names and project metadata.
- ASCII/binary STL inspection and optional bounding-box dimensions. Imported mesh geometry is not used.
- Worker-based export with progress and cancellation. Limits: 100 boards, 160,000 samples per tile, 1.5 million samples across the design.

## Geometry and orientation

The image is placed once in installed-wall coordinates, including the gaps. Each tile samples its physical region and quantizes the image to the chosen palette. Horizontal pixel runs are unioned per color with polygon-clipping, intersected with the slotted board footprint, triangulated with earcut and extruded into a thin surface volume. The backing occupies the remaining thickness. Surface regions and backing share boundaries without volume overlap.

Artwork rows go from top to bottom. Model Y goes from bottom to top. Face-down export rotates the model 180 degrees around Y, using `(width − x, y, thickness − z)`. This is a rotation, so triangle winding is preserved and the installed artwork reads correctly. Do not apply an additional mirror in the slicer.

## Slicer workflow and current limits

1. Print a blank board to check accessory fit. Default slot dimensions are a starting point, not a certified IKEA fit.
2. Export one colored tile and import its 3MF as a multipart model. Assign each named part to a filament. Core 3MF material colors do not guarantee that a slicer assigns AMS/MMU slots automatically.
3. Alternatively, import all selected-tile STLs together as parts of ONE object; preserve their positions. Do not independently center or drop parts to the bed.
4. Use the configured first and subsequent layer heights. Inspect the colored layers and small features before printing.
5. Print one test before committing to the whole wall.

The output is geometry, not G-code or a machine-specific print profile. Bambu Studio import and physical printing have not yet been validated. No wall mounts, rear standoffs, tile connectors, screw holes, load rating or structural engineering are provided. The preview uses an approximate screen raster; exported color boundaries follow the selected mm/pixel sampling. Raster upscaling cannot restore detail. Vector paths are currently rasterized too. Small clipped features may be below the nozzle’s printable width.

Project JSON contains settings but not source artwork; upload the matching image when restoring settings. Browser reloads otherwise reset the project.

## Next milestones

- Validate a sample 3MF in Bambu Studio, including parts, filament mapping and layer inspection.
- Test fit and face opacity on a small print; tune slot tolerance and colored-layer count.
- Add calibrated mounting, standoffs and panel connectors.
- Preserve flat uploaded template geometry using mesh slicing/booleans.
- Trace vector color regions for smoother, more efficient illustration exports.
- Consider an OpenSCAD board-only edition for MakerWorld Customizer after the core print workflow is proven.

## References

- [3MF core specification](https://github.com/3MFConsortium/spec_core/blob/master/3MF%20Core%20Specification.md)
- [MakerWorld Parametric Model Maker overview](https://forum.bambulab.com/t/parametric-model-maker-v1-1-0-major-ui-refresh/203564)

## Printer planning

X1C nominal volume is 256 × 256 × 256 mm; H3C is 330 × 320 × 325 mm. The X1C rectangle conservatively reserves the full left 18 mm strip to avoid its 18 × 28 mm front-left cutter area. Default planning allowances add 5 mm on every edge and a 40 mm rear strip for a tower. Resulting tile allowances are X1C 228 × 206 mm and H3C 320 × 270 mm. These margins are app defaults, not manufacturer requirements; confirm actual tower, brim, nozzle and plate placement in the slicer. The largest pitch-aligned sizes with these defaults are 200 × 200 mm and 320 × 240 mm respectively.

The all-tile 3MF is an inventory layout with 10 mm spacing, not a single print plate or pre-sliced Bambu project. Each tile has its own build item and multipart assembly; distribute the tiles across plates before slicing. Its filename identifies the selected printer version. Changing printer does not silently resize the artwork or board: the app blocks oversized boards and offers an explicit largest-size button.

Sources: [X1C manufacturer specifications](https://public-cdn.bambulab.com/store/bambulab-X1-carbon-tech-specs.pdf?v=20250816053819), [X1C machine profile](https://raw.githubusercontent.com/bambulab/BambuStudio/master/resources/profiles/BBL/machine/Bambu%20Lab%20X1%20Carbon%200.4%20nozzle.json), [H3C machine profile](https://raw.githubusercontent.com/bambulab/BambuStudio/master/resources/profiles/BBL/machine/Bambu%20Lab%20H3C%200.4%20nozzle.json). Filament swatch sources are recorded in `lib/filaments.mjs`. Colors are approximate manufacturer display swatches, not calibrated predictions of a finished print or live inventory.
