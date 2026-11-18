# Print guide browser regression

Run against the local preview and the published site. Use Safari for the reported expand-control regression; repeat narrow-viewport checks at 390 × 844.

1. Open **Print guide**. The highlighted introduction reads “Follow the workflow below, step by step.” The Configure stage contains five numbered headings matching the control sections; Test, Print and Assemble follow. Each stage link reaches its matching content. Select Advanced for checks 2–7 below.
2. Move the floating guide away from its initial position. Select **Expand print guide**. The panel and its content fill the browser viewport with reachable edges; at 1800 px wide, the content must grow beyond the old 1100 px limit; its button changes to **Restore print guide** and shows the pressed state. The old failure only reset the position and never enlarged the panel.
3. Select **Restore print guide**. The original floating size and position return. Repeat the cycle to check that it remains reversible.
4. Expand, resize the browser, then restore. The restored guide stays within the viewport and its close/expand controls remain reachable.
5. At 390 × 844, expand the guide and select **05 Print layers**. The section scrolls into view without horizontal overflow. Restore and close the guide.
6. Check Section 05’s enlarged comparison: both samples show the same centered 16 mm circle in a 20 × 20 mm area, with equal size and clear margins on all sides. Only the cell size changes: the 2 mm/pixel circle has coarser edge steps than the 0.4 mm/pixel circle. Both must remain recognizable as circles, without clipping or extra shapes. The diagram and caption must remain readable at mobile width.
7. Reopen the guide, then close with Escape. Confirm the canvas controls remain usable.

Validation for the expand-control fix: reproduced the original failure and exercised expand/restore in native Safari; checked position restoration, mobile bounds, section navigation, and close in the in-app browser. Recheck the published build before release.

## Simple / Advanced guide

1. Open Print guide from the main canvas. Simple is selected; Configure contains Sections 01–05 with the essential choices, followed by Test, Print and Assemble. Detailed tower settings and the surface-detail comparison are absent.
2. Choose Advanced. Confirm the full section navigation, detailed instructions and same-circle visual are available. Navigate to Section 05, then choose Simple using the fixed mode switch. The shorter guide returns at the top.
3. Record printer, tile dimensions and filament assignments before switching modes; confirm all remain unchanged afterward. These controls change guidance only.
4. Close while Advanced is selected, then reopen. Simple must be the default again. Repeat the switch using keyboard activation.
5. Repeat at 390 × 844 and in Safari. Both mode buttons must remain reachable while scrolling, pressed state must identify the active mode, and content must not overflow horizontally. Expand and restore in each mode.

## Expanded layout, tile export and production stages

1. At 1800 × 1000 and 1280 × 1000, expand Simple and Advanced. Simple configuration cards use two columns in numbered reading order; Section 05 spans both columns. Advanced uses full-width chapters with parameter explanations and bounded illustrations alongside them. Text remains readable and illustrations do not stretch to the window width.
2. At 390 × 844, repeat both modes. Cards stack in order, stage navigation wraps, and neither the dialog nor its content overflows horizontally. Restore, expand and close remain reachable.
3. In Test, inspect the illustrated canvas → Selected tile → Export tile → Download tile path. Close the guide and open the actual Export tile menu below the canvas; verify its labels and position match the illustration.
4. Follow Print steps below, then navigate to Assemble. Print has its own Bambu Studio hardware, material, layer, slice-preview and spool-mapping checklist; Assemble explains row/column order separately. Repeat in Advanced.
5. Confirm switching guide modes and expanding/restoring does not change the board settings. Closing and reopening defaults to Simple.

The production checklist was checked against the generated 3MF settings and Bambu's Studio documentation. Guide-only changes do not establish physical print quality; no print job is sent as part of this regression.

## Advanced parameter walkthrough

1. Open Simple and record its text, then switch to Advanced. Sections 01–05 contain individual parameter explanations, including Build plate settings, Hole pattern, crop positions, per-filament overrides, backing, STL dimension import and settings files. Switch back and verify Simple is unchanged.
2. Follow each sticky section link in the expanded guide at 1440 px and 390 px. The heading must remain visible below the sticky navigation; diagrams and comparison tables must stay inside the guide without horizontal overflow. Also inspect the floating guide.
3. Check the annotated diagrams: tower versus edge reserve; rows/columns/gap; all three board styles; spacer outer diameter versus mounting-hole diameter/inset; capsule width/height/pitch; top/down seam examples; the same image under Fill/Fit; face-down/face-up; and the same-circle detail comparison.
4. Set 3 columns, 2 rows, 180 × 160 mm tiles and 2 mm gaps. The guide must show 544 × 322 mm. Enable solid-picture mounting spacers and choose four 0.2 mm colored layers: current cross-section must show 0.80 mm artwork, 4.20 mm backing and 15 mm overall depth with the default legs. Restore the starting controls afterward.
5. At maximum colored layers, verify full-depth terminology and zero backing depth. With invalid layer settings, show the correction prompt rather than misleading arithmetic.
6. Check the detail table against grid arithmetic: a 200 mm tile at 2 mm/pixel is 100 × 100; at 0.4 it is 500 × 500 and exceeds the 160,000-cell per-tile limit. Explain workload as sample cells, not promised print-time/file-size multipliers.
7. Test, Print and Assemble remain separate and reachable in Advanced. The export-location illustrations still identify the actual Export tile and Download All controls.


## v1.2 exports and runtime profiles

1. With an empty browser cache, select a Bambu printer. Preview remains usable while printer settings load; exports wait for the matching profile. Switching printers must not apply a late response from the previous selection.
2. Revisit the selected printer with its cache available. The pinned settings should be reused. Test an unavailable upstream source without cache: show a retry action, never a generic-printer fallback.
3. In both guide modes, check **Download All** in the text and toolbar illustration. Simple explains loading/retry; Advanced explains cached profiles and export identifiers.
4. Cancel first-export terms; no file should download. Reopen: agreement is still unchecked and the download action disabled. Accept for a local sample and export; review terms from the controls afterward. A new session requires acceptance again.
5. Verify all wall tiles appear once, at most 36 plates per 3MF. Metadata, rear code and internal code must share the export ID. Open the browser download in Bambu Studio, inspect first colored layers and identification details. Print a physical sample separately before making claims about strength or forensic readability.
