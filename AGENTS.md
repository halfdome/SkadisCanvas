# Validation

For export or geometry changes, run the geometry tests and the actual Bambu Studio integration test (`pnpm test:bambu`). Open a representative browser-downloaded export in Bambu Studio and inspect its plate layout and first colored layers. For changes to batch layout, verify every tile appears exactly once across rectangular projects, each with at most 36 printable plates. A successful build or ZIP/XML inspection alone is insufficient. Report physical-print testing separately; never imply it was performed.

# Completion and GitHub

Always commit completed changes and push them to https://github.com/halfdome/SkadisCanvas (the user's required GitHub repository). Verify the commit is present on GitHub before reporting that the work is finished. Publishing to the Sites source repository does not replace the GitHub push. Preserve existing remote changes and never force-push without explicit authorization. If the GitHub destination is not configured or known, obtain the repository URL rather than guessing.

Publish the updated service and refresh the live page after completing the requested changes, unless the user requests local-only work.

Create focused commits with descriptive messages before running the Sites publishing helper, so publication does not create generic "Update Site source" commits. Keep the existing commit history; do not squash or rewrite published commits without explicit user authorization.

# User-facing changes

Always update the print guide when changing controls, export behavior or printing workflows. Keep its wording and illustrations consistent with the current UI.
