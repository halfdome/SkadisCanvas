# Skadis Canvas v1.2 validation

- 98 automated tests passed, including real geometry, closed internal cavities, independent bit recovery from mesh occupancy, face-up/face-down, full-depth colors, spacer feet, mounting holes and thin-tile rejection.
- Runtime resolver loaded all 15 supported Bambu printers from revision `8e524a39d4c4cd0541801c1c46d2f77debb0bf1d`. Loader tests cover cache reuse without network, retries, missing profiles, cyclic inheritance and version mismatch.
- Bambu Studio 2.9.1.70 sliced marked two-tile projects for all 15 printers using its G-code output mode. All had 25 layers with the first three colored layers and measured prime-tower separation. Its thumbnail-producing 3MF output mode timed out; this was not counted as a pass.
- In-browser workflow: selected printer loaded; Download All was disabled during loading; cancelling terms left agreement unchecked; an accepted local test exported 40 tiles in two 20-plate rectangular projects. The downloaded archive contains matching export IDs and upstream profile revision metadata.
- Simple guide text and its download illustration were inspected in the browser and use Download All.
- Native GUI inspection of the newly downloaded project remains unverified: Bambu Studio's file-picker keyboard actions repeatedly reopened/reset its Go to Folder sheet. Command-line slicing is verified separately above.
- No physical printing, mounting strength test, physical watermark readback, legal enforceability review or claim of copyright ownership was performed.

Printer settings are fetched directly from the pinned official public repository and cached in the browser; they are not bundled in the application source. Display swatches remain a separate static color catalog. Exported printer settings retain upstream source and license information. Dynamic retrieval does not by itself settle all upstream licensing questions.
