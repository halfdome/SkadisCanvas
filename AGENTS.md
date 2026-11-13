# Validation

For export or geometry changes, run the geometry tests and the actual Bambu Studio integration test (`pnpm test:bambu`). Open a representative browser-downloaded export in Bambu Studio and inspect its plate layout and first colored layers. For changes to batch layout, verify every tile appears exactly once across rectangular projects, each with at most 36 printable plates. A successful build or ZIP/XML inspection alone is insufficient. Report physical-print testing separately; never imply it was performed.
