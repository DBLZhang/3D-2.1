import elevationData from "@/assets/helong_elevation.json";

const { minX, maxX, minY, maxY, gridWidth, gridHeight, heights, maxHeight } = elevationData;

// Find the minimum height to align the bottom of the terrain layer with Z = 0
const minH = (() => {
  let min = Infinity;
  for (let r = 0; r < heights.length; r++) {
    for (let c = 0; c < heights[r].length; c++) {
      if (heights[r][c] < min) min = heights[r][c];
    }
  }
  return min;
})();

/**
 * Computes the interpolated terrain height in Three.js units for any coordinate (x, y).
 * Maps minH - maxHeight raw elevation to 0 - 1.1 units in Three.js space (50% flattened from 2.2).
 */
export function getInterpolatedHeight(x: number, y: number): number {
  const u = Math.min(1, Math.max(0, (x - minX) / (maxX - minX)));
  const v = Math.min(1, Math.max(0, (y - minY) / (maxY - minY)));
  
  const i = u * (gridWidth - 1);
  const j = v * (gridHeight - 1);
  
  const i0 = Math.floor(i);
  const i1 = Math.min(gridWidth - 1, i0 + 1);
  const j0 = Math.floor(j);
  const j1 = Math.min(gridHeight - 1, j0 + 1);
  
  const fX = i - i0;
  const fY = j - j0;
  
  const h00 = heights[j0][i0];
  const h10 = heights[j0][i1];
  const h01 = heights[j1][i0];
  const h11 = heights[j1][i1];
  
  const h0 = h00 * (1 - fX) + h10 * fX;
  const h1 = h01 * (1 - fX) + h11 * fX;
  
  const h = h0 * (1 - fY) + h1 * fY;
  
  // Normalize elevation: map minH - maxHeight to a realistic height e.g. 0 to 1.1 units
  const normalized = (h - minH) / (maxHeight - minH);
  return normalized * 1.1;
}
