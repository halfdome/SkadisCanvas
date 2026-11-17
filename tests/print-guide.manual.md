# Print guide browser regression

Run against the local preview and the published site. Use Safari for the reported expand-control regression; repeat narrow-viewport checks at 390 × 844.

1. Open **Print guide**. The highlighted introduction reads “Follow the workflow below, step by step.” The Configure stage contains five numbered headings matching the control sections; Test and Print follow. Each stage link reaches its matching content.
2. Move the floating guide away from its initial position. Select **Expand print guide**. The panel and its content fill the browser viewport with reachable edges; at 1800 px wide, the content must grow beyond the old 1100 px limit; its button changes to **Restore print guide** and shows the pressed state. The old failure only reset the position and never enlarged the panel.
3. Select **Restore print guide**. The original floating size and position return. Repeat the cycle to check that it remains reversible.
4. Expand, resize the browser, then restore. The restored guide stays within the viewport and its close/expand controls remain reachable.
5. At 390 × 844, expand the guide and select **05 Print layers**. The section scrolls into view without horizontal overflow. Restore and close the guide.
6. Check Section 05’s enlarged comparison: both samples show the same 10 × 8 mm area; the 2 mm/pixel edge is coarser and loses the small dot, while 0.4 mm/pixel retains it. The diagram and caption must remain readable at mobile width.
7. Reopen the guide, then close with Escape. Confirm the canvas controls remain usable.

Validation for the expand-control fix: reproduced the original failure and exercised expand/restore in native Safari; checked position restoration, mobile bounds, section navigation, and close in the in-app browser. Recheck the published build before release.
