// Arena layout generator
// Walls are thin barriers (lines) - horizontal, vertical, or DIAGONAL
// Diagonal walls are built from small axis-aligned segments for Arcade Physics
// ALL layouts are validated via flood-fill to guarantee a path from bottom to top

const CELL_SIZE = 40;
const WALL_THICKNESS = 6;
const DIAG_STEP = 10;

function makeDiagonalWall(x1, y1, x2, y2) {
  const segments = [];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return segments;
  const steps = Math.ceil(len / DIAG_STEP);
  const sx = dx / steps;
  const sy = dy / steps;
  for (let i = 0; i < steps; i++) {
    segments.push({
      x: x1 + sx * (i + 0.5),
      y: y1 + sy * (i + 0.5),
      w: DIAG_STEP + 2,
      h: DIAG_STEP + 2,
    });
  }
  return segments;
}

function hWall(x, y, len) {
  if (len <= 0) return [];
  return [{ x: x + len / 2, y, w: len, h: WALL_THICKNESS }];
}
function vWall(x, y, len) {
  if (len <= 0) return [];
  return [{ x, y: y + len / 2, w: WALL_THICKNESS, h: len }];
}
function dWall(x1, y1, x2, y2) {
  return makeDiagonalWall(x1, y1, x2, y2);
}

const LAYOUT_GENERATORS = [
  // Mixed: short walls at various angles
  (cols, rows, rng, tm, w) => {
    const segs = [];
    const count = 7 + Math.floor(rng() * 5);
    const maxLen = w * 0.4; // walls never span more than 40% of width
    for (let i = 0; i < count; i++) {
      const cx = CELL_SIZE * 1.5 + rng() * (w - CELL_SIZE * 3);
      const cy = tm + CELL_SIZE * 2 + rng() * ((rows - 4) * CELL_SIZE);
      const len = Math.min((1.5 + rng() * 2) * CELL_SIZE, maxLen);
      const type = rng();
      if (type < 0.3) {
        segs.push(...hWall(cx, cy, len));
      } else if (type < 0.6) {
        segs.push(...vWall(cx, cy, len));
      } else {
        const angle = (rng() * 0.8 + 0.2) * Math.PI * (rng() > 0.5 ? 1 : -1) * 0.5;
        segs.push(...dWall(cx, cy, cx + Math.cos(angle) * len, cy + Math.sin(angle) * len));
      }
    }
    return segs;
  },

  // V-shapes (smaller, with gaps between them)
  (cols, rows, rng, tm, w) => {
    const segs = [];
    const count = 3 + Math.floor(rng() * 2);
    for (let i = 0; i < count; i++) {
      // Center the V, keep arms short so they don't span full width
      const cx = CELL_SIZE * 2 + rng() * (w - CELL_SIZE * 4);
      const cy = tm + CELL_SIZE * 3 + (i / count) * ((rows - 6) * CELL_SIZE);
      const armLen = (1 + rng() * 1.2) * CELL_SIZE; // shorter arms
      const spread = 0.4 + rng() * 0.4;
      const flip = rng() > 0.5 ? 1 : -1;
      segs.push(...dWall(cx, cy, cx - armLen * spread, cy + armLen * flip));
      segs.push(...dWall(cx, cy, cx + armLen * spread, cy + armLen * flip));
    }
    return segs;
  },

  // Horizontal bars with guaranteed wide gaps
  (cols, rows, rng, tm, w) => {
    const segs = [];
    const h = rows * CELL_SIZE;
    for (let i = 0; i < 2; i++) {
      const y = tm + Math.floor((i + 1) / 3 * h);
      // Gap is always at least 3 cells wide (plenty of room)
      const gapW = CELL_SIZE * (3 + Math.floor(rng() * 2));
      const gapX = CELL_SIZE + rng() * (w - gapW - CELL_SIZE * 2);
      if (gapX > CELL_SIZE) segs.push(...hWall(CELL_SIZE / 2, y, gapX - CELL_SIZE / 2));
      const rightStart = gapX + gapW;
      if (rightStart < w - CELL_SIZE) segs.push(...hWall(rightStart, y, w - rightStart - CELL_SIZE));
    }
    // A few short diagonal accents
    for (let i = 0; i < 3; i++) {
      const cx = CELL_SIZE * 2 + rng() * (w - CELL_SIZE * 4);
      const cy = tm + CELL_SIZE * 2 + rng() * (h - CELL_SIZE * 4);
      const len = (1 + rng() * 1.5) * CELL_SIZE;
      const angle = rng() * Math.PI;
      segs.push(...dWall(cx, cy, cx + Math.cos(angle) * len, cy + Math.sin(angle) * len));
    }
    return segs;
  },

  // Starburst (fewer arms, shorter reach)
  (cols, rows, rng, tm, w) => {
    const segs = [];
    const h = rows * CELL_SIZE;
    const centers = 2 + Math.floor(rng() * 2);
    for (let c = 0; c < centers; c++) {
      const cx = CELL_SIZE * 3 + rng() * (w - CELL_SIZE * 6);
      const cy = tm + CELL_SIZE * 3 + rng() * (h - CELL_SIZE * 6);
      const armCount = 3 + Math.floor(rng() * 2);
      for (let a = 0; a < armCount; a++) {
        const angle = (a / armCount) * Math.PI * 2 + rng() * 0.4;
        const armLen = (1 + rng() * 1.5) * CELL_SIZE; // shorter arms
        segs.push(...dWall(cx, cy, cx + Math.cos(angle) * armLen, cy + Math.sin(angle) * armLen));
      }
    }
    return segs;
  },

  // Zigzag barriers (shorter, always leave open side)
  (cols, rows, rng, tm, w) => {
    const segs = [];
    let fromLeft = rng() > 0.5;
    for (let row = 2; row < rows - 3; row += 4) {
      const y = tm + row * CELL_SIZE;
      // Wall covers max 50% of width, always leaving the other half open
      const wallLen = w * (0.3 + rng() * 0.2);
      if (fromLeft) {
        segs.push(...hWall(0, y, wallLen));
      } else {
        segs.push(...hWall(w - wallLen, y, wallLen));
      }
      fromLeft = !fromLeft;
    }
    // Add a few diagonal accent walls
    for (let i = 0; i < 2; i++) {
      const cx = CELL_SIZE * 2 + rng() * (w - CELL_SIZE * 4);
      const cy = tm + CELL_SIZE * 3 + rng() * ((rows - 6) * CELL_SIZE);
      const len = (1 + rng() * 1.5) * CELL_SIZE;
      const angle = (rng() - 0.5) * Math.PI * 0.6;
      segs.push(...dWall(cx, cy, cx + Math.cos(angle) * len, cy + Math.sin(angle) * len));
    }
    return segs;
  },

  // Scattered short walls at grid-aligned angles (0/45/90/135)
  (cols, rows, rng, tm, w) => {
    const segs = [];
    const count = 8 + Math.floor(rng() * 5);
    const maxLen = w * 0.35;
    for (let i = 0; i < count; i++) {
      const cx = CELL_SIZE + rng() * (w - CELL_SIZE * 2);
      const cy = tm + CELL_SIZE * 2 + rng() * ((rows - 4) * CELL_SIZE);
      const len = Math.min((1 + rng() * 1.5) * CELL_SIZE, maxLen);
      const baseAngles = [0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4];
      const angle = baseAngles[Math.floor(rng() * 4)];
      if (Math.abs(angle) < 0.01 || Math.abs(angle - Math.PI) < 0.01) {
        segs.push(...hWall(cx, cy, len));
      } else if (Math.abs(angle - Math.PI / 2) < 0.01) {
        segs.push(...vWall(cx, cy, len));
      } else {
        segs.push(...dWall(cx, cy, cx + Math.cos(angle) * len, cy + Math.sin(angle) * len));
      }
    }
    return segs;
  },
];

function seedRng(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Flood-fill reachability check: can we get from bottom rows to top rows?
function checkReachability(occupied, cols, rows) {
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const queue = [];

  // Start from all open cells in bottom 2 rows
  for (let c = 0; c < cols; c++) {
    if (!occupied[rows - 1][c]) { visited[rows - 1][c] = true; queue.push([rows - 1, c]); }
    if (!occupied[rows - 2][c]) { visited[rows - 2][c] = true; queue.push([rows - 2, c]); }
  }

  // BFS flood fill
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
  let head = 0;
  while (head < queue.length) {
    const [r, c] = queue[head++];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && !occupied[nr][nc]) {
        visited[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }

  // Check if any cell in top 3 rows is reachable
  for (let c = 0; c < cols; c++) {
    if (visited[0][c] || visited[1][c] || visited[2][c]) return true;
  }
  return false;
}

export function generateArenaLayout(arenaIndex, arenaWidth, arenaHeight, topMargin) {
  const cols = Math.floor(arenaWidth / CELL_SIZE);
  const rows = Math.floor((arenaHeight - topMargin) / CELL_SIZE);
  const rng = seedRng(arenaIndex * 7919 + 42);
  const w = cols * CELL_SIZE;

  const layoutIdx = Math.floor(rng() * LAYOUT_GENERATORS.length);
  let rawWalls = LAYOUT_GENERATORS[layoutIdx](cols, rows, rng, topMargin, w);

  // Filter walls: keep within playable area
  let walls = rawWalls.filter((seg) => {
    return seg.y >= topMargin + CELL_SIZE &&
      seg.y <= arenaHeight - CELL_SIZE * 2 &&
      seg.x >= 0 && seg.x <= arenaWidth &&
      seg.w > 0 && seg.h > 0;
  });

  // Build occupancy grid
  let occupied = buildOccupancyGrid(walls, cols, rows, topMargin);

  // REACHABILITY CHECK: ensure path from bottom to top exists
  // If blocked, remove walls one at a time (largest first) until passable
  let attempts = 0;
  while (!checkReachability(occupied, cols, rows) && walls.length > 0 && attempts < 50) {
    // Find a wall segment in the most-blocked row and remove it
    const blockedRow = findMostBlockedRow(occupied, cols, rows);
    // Remove wall segments in that row area
    const rowY = topMargin + blockedRow * CELL_SIZE + CELL_SIZE / 2;
    const removed = [];
    walls = walls.filter((seg) => {
      if (Math.abs(seg.y - rowY) < CELL_SIZE && removed.length < 3) {
        removed.push(seg);
        return false;
      }
      return true;
    });
    // If we couldn't remove from that row, remove random walls
    if (removed.length === 0) {
      const idx = Math.floor(rng() * walls.length);
      walls.splice(idx, Math.min(3, walls.length));
    }
    occupied = buildOccupancyGrid(walls, cols, rows, topMargin);
    attempts++;
  }

  const openSpaces = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!occupied[r][c]) {
        openSpaces.push({
          x: c * CELL_SIZE + CELL_SIZE / 2,
          y: topMargin + r * CELL_SIZE + CELL_SIZE / 2,
          gridR: r,
          gridC: c,
        });
      }
    }
  }

  // Portal: random open position in top third
  const topThird = openSpaces.filter((s) => s.gridR < Math.floor(rows / 3) && s.gridR > 0);
  const portalSpace = topThird.length > 0
    ? topThird[Math.floor(rng() * topThird.length)]
    : openSpaces[Math.floor(rng() * openSpaces.length)];

  return {
    walls,
    openSpaces,
    occupied,
    portalPosition: { x: portalSpace.x, y: portalSpace.y },
    cols,
    rows,
    cellSize: CELL_SIZE,
    topMargin,
  };
}

function buildOccupancyGrid(walls, cols, rows, topMargin) {
  const occupied = Array.from({ length: rows }, () => Array(cols).fill(false));
  walls.forEach((seg) => {
    const c = Math.floor(seg.x / CELL_SIZE);
    const r = Math.floor((seg.y - topMargin) / CELL_SIZE);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      occupied[r][c] = true;
    }
  });
  // Always clear bottom 2 rows
  for (let c = 0; c < cols; c++) {
    if (rows - 1 >= 0) occupied[rows - 1][c] = false;
    if (rows - 2 >= 0) occupied[rows - 2][c] = false;
  }
  return occupied;
}

function findMostBlockedRow(occupied, cols, rows) {
  let worstRow = 0;
  let worstCount = 0;
  // Check middle rows (not spawn area)
  for (let r = 1; r < rows - 2; r++) {
    let blocked = 0;
    for (let c = 0; c < cols; c++) {
      if (occupied[r][c]) blocked++;
    }
    if (blocked > worstCount) {
      worstCount = blocked;
      worstRow = r;
    }
  }
  return worstRow;
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
