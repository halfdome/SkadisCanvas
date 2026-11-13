export const MAX_PLATES = 36;
// Search rectangular cuts. Minimize file count first, then unequal tile counts,
// then perimeter, so each project is a compact, contiguous part of the mural.
export function partitionWall(cols, rows, limit = MAX_PLATES) {
  if (![cols, rows, limit].every(n => Number.isInteger(n) && n > 0) || cols * rows > 400) return [];
  const memo = new Map();
  function solve(w, h) {
    const key = `${w},${h}`;
    if (memo.has(key)) return memo.get(key);
    const area = w * h;
    if (area <= limit) return {regions: [{col: 0, row: 0, cols: w, rows: h}], variance: area * area, perimeter: w + h};
    let best;
    function consider(a, b, dx, dy) {
      const candidate = {regions: [...a.regions, ...b.regions.map(r => ({...r, col: r.col + dx, row: r.row + dy}))], variance: a.variance + b.variance, perimeter: a.perimeter + b.perimeter};
      if (!best || candidate.regions.length < best.regions.length || (candidate.regions.length === best.regions.length && (candidate.variance < best.variance || (candidate.variance === best.variance && candidate.perimeter < best.perimeter)))) best = candidate;
    }
    for (let y = 1; y < h; y++) consider(solve(w, y), solve(w, h - y), 0, y);
    for (let x = 1; x < w; x++) consider(solve(x, h), solve(w - x, h), x, 0);
    memo.set(key, best);
    return best;
  }
  return solve(cols, rows).regions.sort((a, b) => a.row - b.row || a.col - b.col).map((r, i) => ({...r, number: i + 1, count: r.cols * r.rows}));
}
export const inRegion = (tile, r) => tile.col >= r.col && tile.col < r.col + r.cols && tile.row >= r.row && tile.row < r.row + r.rows;
export const regionLabel = r => `R${String(r.row + 1).padStart(2, '0')}-${String(r.row + r.rows).padStart(2, '0')}_C${String(r.col + 1).padStart(2, '0')}-${String(r.col + r.cols).padStart(2, '0')}`;
