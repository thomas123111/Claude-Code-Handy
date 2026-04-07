// Arena layout generator - FIXED hand-designed layouts
// Each layout is tested and guaranteed passable
// Walls are thin segments: { x, y, w, h } in world coordinates

const CELL = 40;
const T = 6; // wall thickness

// Scale factors - layouts designed for 9x17 grid, scaled to actual world
let SX = 1; // horizontal scale
let SY = 1; // vertical scale

function h(col, row, lengthCells, tm) {
  return { x: col * SX * CELL + (lengthCells * SX * CELL) / 2, y: tm + row * SY * CELL, w: lengthCells * SX * CELL, h: T };
}
function v(col, row, lengthCells, tm) {
  return { x: col * SX * CELL, y: tm + row * SY * CELL + (lengthCells * SY * CELL) / 2, w: T, h: lengthCells * SY * CELL };
}
function d(col1, row1, col2, row2, tm) {
  const x1 = col1 * SX * CELL, y1 = tm + row1 * SY * CELL;
  const x2 = col2 * SX * CELL, y2 = tm + row2 * SY * CELL;
  const segs = [];
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const step = 10;
  const steps = Math.ceil(len / step);
  for (let i = 0; i < steps; i++) {
    segs.push({
      x: x1 + (dx / steps) * (i + 0.5),
      y: y1 + (dy / steps) * (i + 0.5),
      w: step + 2,
      h: step + 2,
    });
  }
  return segs;
}

// 9 cols wide (0-9), ~18 rows tall (0-17) for 390x844 with 95px top margin
// Player spawns row 16-17, portal in top third (row 0-5)
// Every layout has clear paths from bottom to top

const LAYOUTS = [
  // 0: Simple pillars - open field with short obstacles
  (tm) => [
    h(1, 4, 2, tm),
    h(6, 4, 2, tm),
    h(3, 7, 3, tm),
    v(2, 9, 3, tm),
    v(7, 9, 3, tm),
    h(1, 13, 2, tm),
    h(6, 13, 2, tm),
  ],

  // 1: Two horizontal bars with wide gaps
  (tm) => [
    h(0, 5, 3, tm),
    h(5, 5, 4, tm),
    // gap at col 3-5
    h(0, 11, 4, tm),
    h(6, 11, 3, tm),
    // gap at col 4-6
    v(4.5, 7, 2, tm),
  ],

  // 2: Diagonal corridors
  (tm) => [
    ...d(1, 3, 4, 6, tm),
    ...d(8, 3, 5, 6, tm),
    ...d(2, 9, 5, 12, tm),
    ...d(7, 9, 4, 12, tm),
    h(3, 15, 3, tm),
  ],

  // 3: L-shapes creating cover spots
  (tm) => [
    h(1, 4, 3, tm),
    v(1, 4, 2, tm),
    h(6, 4, 2, tm),
    v(8, 4, 2, tm),
    h(3, 9, 3, tm),
    v(3, 9, 2, tm),
    v(6, 9, 2, tm),
    h(1, 14, 2, tm),
    h(7, 14, 2, tm),
  ],

  // 4: Zigzag - alternating short walls
  (tm) => [
    h(0, 3, 4, tm),
    h(5, 6, 4, tm),
    h(0, 9, 4, tm),
    h(5, 12, 4, tm),
    ...d(4, 3, 5, 6, tm),
    ...d(4, 9, 5, 12, tm),
  ],

  // 5: Center fortress with openings
  (tm) => [
    h(2, 5, 5, tm),
    h(2, 10, 5, tm),
    v(2, 5, 5, tm),
    v(7, 5, 5, tm),
    // Openings: top-center, bottom-center, left-mid, right-mid
    // (gaps are implicit: h walls don't connect to v walls at corners)
  ],

  // 6: V-shapes pointing down (player can go around sides)
  (tm) => [
    ...d(4.5, 3, 2, 6, tm),
    ...d(4.5, 3, 7, 6, tm),
    ...d(4.5, 9, 2, 12, tm),
    ...d(4.5, 9, 7, 12, tm),
  ],

  // 7: Grid of small walls (lots of cover)
  (tm) => [
    h(1, 3, 2, tm),
    h(4, 3, 2, tm),
    h(7, 3, 2, tm),
    v(3, 5, 2, tm),
    v(6, 5, 2, tm),
    h(1, 8, 2, tm),
    h(4, 8, 2, tm),
    h(7, 8, 2, tm),
    v(3, 10, 2, tm),
    v(6, 10, 2, tm),
    h(2, 13, 2, tm),
    h(6, 13, 2, tm),
  ],

  // 8: Diagonal cross
  (tm) => [
    ...d(1, 2, 5, 8, tm),
    ...d(8, 2, 4, 8, tm),
    h(3, 10, 3, tm),
    ...d(2, 12, 5, 15, tm),
    ...d(7, 12, 4, 15, tm),
  ],

  // 9: Tunnels - vertical walls create corridors
  (tm) => [
    v(3, 1, 5, tm),
    v(6, 1, 5, tm),
    // Gap at row 6-8
    v(3, 8, 5, tm),
    v(6, 8, 5, tm),
    // Horizontal connectors to force weaving
    h(3, 4, 3, tm),
    h(3, 11, 3, tm),
  ],

  // 10: Scattered diagonals at various angles
  (tm) => [
    ...d(1, 3, 3, 5, tm),
    ...d(7, 2, 5, 5, tm),
    h(3, 7, 3, tm),
    ...d(2, 9, 4, 7, tm),
    ...d(6, 9, 8, 7, tm),
    ...d(1, 12, 3, 14, tm),
    ...d(8, 12, 6, 14, tm),
  ],

  // 11: Starburst from two points
  (tm) => [
    ...d(3, 6, 1, 4, tm),
    ...d(3, 6, 5, 4, tm),
    ...d(3, 6, 1, 8, tm),
    ...d(3, 6, 5, 8, tm),
    ...d(6, 11, 4, 9, tm),
    ...d(6, 11, 8, 9, tm),
    ...d(6, 11, 4, 13, tm),
    ...d(6, 11, 8, 13, tm),
  ],

  // 12: Maze-lite - connected walls but always passable
  (tm) => [
    h(0, 3, 3, tm),
    v(3, 3, 2, tm),
    h(5, 5, 4, tm),
    v(5, 5, 3, tm),
    h(1, 8, 4, tm),
    v(1, 8, 2, tm),
    h(6, 10, 3, tm),
    v(6, 10, 2, tm),
    h(2, 13, 3, tm),
  ],

  // 13: Arrow formations pointing at player
  (tm) => [
    ...d(2, 3, 4.5, 5, tm),
    ...d(7, 3, 4.5, 5, tm),
    h(3, 8, 3, tm),
    ...d(1, 10, 4, 13, tm),
    ...d(8, 10, 5, 13, tm),
  ],

  // 14: Spiral-ish pattern
  (tm) => [
    h(2, 3, 6, tm),
    v(8, 3, 4, tm),
    h(2, 7, 6, tm),
    v(2, 7, 3, tm),
    h(2, 10, 5, tm),
    v(7, 10, 3, tm),
    h(3, 13, 4, tm),
  ],

  // 15: Diamond shapes
  (tm) => [
    ...d(4.5, 2, 2, 5, tm),
    ...d(4.5, 2, 7, 5, tm),
    ...d(2, 5, 4.5, 8, tm),
    ...d(7, 5, 4.5, 8, tm),
    h(3, 11, 3, tm),
    v(2, 12, 2, tm),
    v(7, 12, 2, tm),
  ],

  // 16: Parallel diagonals
  (tm) => [
    ...d(0, 4, 4, 8, tm),
    ...d(2, 4, 6, 8, tm),
    ...d(5, 4, 9, 8, tm),
    ...d(0, 10, 4, 14, tm),
    ...d(5, 10, 9, 14, tm),
  ],

  // 17: Fortress with diagonal walls
  (tm) => [
    ...d(2, 4, 4.5, 6, tm),
    ...d(7, 4, 4.5, 6, tm),
    h(2, 4, 2, tm),
    h(6, 4, 2, tm),
    v(4, 8, 3, tm),
    v(5, 8, 3, tm),
    h(1, 13, 3, tm),
    h(6, 13, 3, tm),
  ],

  // 18: Wide open with scattered small obstacles
  (tm) => [
    h(2, 4, 1.5, tm),
    h(6, 3, 1.5, tm),
    v(4.5, 6, 1.5, tm),
    h(1, 9, 1.5, tm),
    h(7, 8, 1.5, tm),
    ...d(3, 11, 4, 12, tm),
    ...d(6, 11, 5, 12, tm),
    h(3, 14, 1.5, tm),
  ],

  // 19: Cross pattern
  (tm) => [
    v(4.5, 2, 4, tm),
    h(1, 5, 3, tm),
    h(6, 5, 3, tm),
    v(4.5, 8, 3, tm),
    h(1, 11, 3, tm),
    h(6, 11, 3, tm),
    ...d(2, 13, 4, 15, tm),
    ...d(7, 13, 5, 15, tm),
  ],
];

export function generateArenaLayout(arenaIndex, arenaWidth, arenaHeight, topMargin, runSeed) {
  const cols = Math.floor(arenaWidth / CELL);
  const rows = Math.floor((arenaHeight - topMargin) / CELL);

  // Scale layouts from design grid (9x17) to actual world size
  SX = cols / 9;
  SY = rows / 17;

  // Shuffled layout order - uses runSeed so each run has different order
  const layoutIdx = getShuffledLayoutIndex(arenaIndex, LAYOUTS.length, runSeed || 1);
  const rawWalls = LAYOUTS[layoutIdx](topMargin).flat();

  // Reset scale
  SX = 1;
  SY = 1;

  // Filter walls within playable area
  const walls = rawWalls.filter((w) => {
    return w.y >= topMargin + CELL &&
      w.y <= arenaHeight - CELL * 2 &&
      w.x >= 0 && w.x <= arenaWidth &&
      w.w > 0 && w.h > 0;
  });

  // Build occupancy grid
  let occupied = Array.from({ length: rows }, () => Array(cols).fill(false));
  walls.forEach((w) => {
    const c = Math.floor(w.x / CELL);
    const r = Math.floor((w.y - topMargin) / CELL);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      occupied[r][c] = true;
    }
  });
  // Always clear bottom 2 rows
  for (let c = 0; c < cols; c++) {
    if (rows - 1 >= 0) occupied[rows - 1][c] = false;
    if (rows - 2 >= 0) occupied[rows - 2][c] = false;
  }

  // Reachability check: flood-fill from bottom, remove blocking walls
  let attempts = 0;
  while (attempts < 30) {
    // BFS from bottom 2 rows
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const queue = [];
    for (let c = 0; c < cols; c++) {
      if (!occupied[rows - 1][c]) { visited[rows - 1][c] = true; queue.push([rows - 1, c]); }
      if (rows - 2 >= 0 && !occupied[rows - 2][c]) { visited[rows - 2][c] = true; queue.push([rows - 2, c]); }
    }
    let head = 0;
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    while (head < queue.length) {
      const [cr, cc] = queue[head++];
      for (const [dr, dc] of dirs) {
        const nr = cr + dr, nc = cc + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && !occupied[nr][nc]) {
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }
    // Check top 3 rows reachable
    let reachable = false;
    for (let c = 0; c < cols; c++) {
      if (visited[0][c] || visited[1][c] || visited[2][c]) { reachable = true; break; }
    }
    if (reachable) break;
    // Remove walls from most blocked row
    let worstRow = 0, worstCount = 0;
    for (let r = 1; r < rows - 2; r++) {
      let cnt = 0;
      for (let c = 0; c < cols; c++) if (occupied[r][c]) cnt++;
      if (cnt > worstCount) { worstCount = cnt; worstRow = r; }
    }
    // Clear that row
    for (let c = 0; c < cols; c++) occupied[worstRow][c] = false;
    // Remove wall segments in that row from walls array
    const rowYmin = topMargin + worstRow * CELL;
    const rowYmax = rowYmin + CELL;
    for (let i = walls.length - 1; i >= 0; i--) {
      if (walls[i].y >= rowYmin && walls[i].y < rowYmax) walls.splice(i, 1);
    }
    attempts++;
  }

  const openSpaces = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!occupied[r][c]) {
        openSpaces.push({
          x: c * CELL + CELL / 2,
          y: topMargin + r * CELL + CELL / 2,
          gridR: r,
          gridC: c,
        });
      }
    }
  }

  // Portal positions per layout (hand-picked to be reachable)
  const portalPositions = [
    { c: 4.5, r: 1 }, // 0
    { c: 4, r: 2 },   // 1
    { c: 4.5, r: 1 }, // 2
    { c: 4.5, r: 1 }, // 3
    { c: 7, r: 1 },   // 4
    { c: 4.5, r: 2 }, // 5
    { c: 4.5, r: 1 }, // 6
    { c: 5, r: 1 },   // 7
    { c: 4.5, r: 1 }, // 8
    { c: 4.5, r: 0.5 }, // 9
    { c: 4.5, r: 1 }, // 10
    { c: 4.5, r: 2 }, // 11
    { c: 7, r: 1 },   // 12
    { c: 4.5, r: 1 }, // 13
    { c: 5, r: 1 },   // 14
    { c: 4.5, r: 1 }, // 15
    { c: 4.5, r: 1 }, // 16
    { c: 4.5, r: 1 }, // 17
    { c: 4.5, r: 1 }, // 18
    { c: 4.5, r: 1 }, // 19
  ];

  const pp = portalPositions[layoutIdx] || { c: 4.5, r: 1 };

  return {
    walls,
    openSpaces,
    occupied,
    portalPosition: { x: pp.c * (cols / 9) * CELL, y: topMargin + pp.r * (rows / 17) * CELL },
    cols,
    rows,
    cellSize: CELL,
    topMargin,
  };
}

// Deterministic shuffle: maps arenaIndex to a layout index
// Each "cycle" of 20 arenas uses a different permutation
function getShuffledLayoutIndex(arenaIndex, layoutCount, runSeed) {
  const cycle = Math.floor(arenaIndex / layoutCount);
  const posInCycle = arenaIndex % layoutCount;

  // Build a shuffled order using runSeed + cycle so each run is different
  const order = Array.from({ length: layoutCount }, (_, i) => i);
  let seed = ((runSeed || 1) * 2654435761 + (cycle + 1) * 7919) >>> 0;
  for (let i = layoutCount - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const j = (seed >>> 0) % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order[posInCycle];
}

export function getRandomOpenPositions(layout, count, rng, minRow, maxRow) {
  const filtered = layout.openSpaces.filter((s) => {
    if (minRow !== undefined && s.gridR < minRow) return false;
    if (maxRow !== undefined && s.gridR > maxRow) return false;
    return true;
  });
  const positions = [];
  const used = new Set();
  for (let i = 0; i < count && filtered.length > 0; i++) {
    let attempts = 0;
    while (attempts < 20) {
      const idx = Math.floor(rng() * filtered.length);
      if (!used.has(idx)) {
        used.add(idx);
        const s = filtered[idx];
        positions.push({ x: s.x + (rng() - 0.5) * 10, y: s.y + (rng() - 0.5) * 10 });
        break;
      }
      attempts++;
    }
  }
  return positions;
}
