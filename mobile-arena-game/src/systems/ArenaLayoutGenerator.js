// Arena layout generator
// Walls are thin barriers (lines) - horizontal, vertical, or DIAGONAL
// Diagonal walls are built from small axis-aligned segments for Arcade Physics

const CELL_SIZE = 40;
const WALL_THICKNESS = 6;
const DIAG_STEP = 10; // small step size for diagonal wall segments

// Convert a diagonal line (x1,y1 -> x2,y2) into small axis-aligned rectangles
function makeDiagonalWall(x1, y1, x2, y2) {
  const segments = [];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
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

// Helper: straight wall (h or v)
function hWall(x, y, len) {
  return [{ x: x + len / 2, y, w: len, h: WALL_THICKNESS }];
}
function vWall(x, y, len) {
  return [{ x, y: y + len / 2, w: WALL_THICKNESS, h: len }];
}
// Diagonal wall
function dWall(x1, y1, x2, y2) {
  return makeDiagonalWall(x1, y1, x2, y2);
}

const LAYOUT_GENERATORS = [
  // Mixed: short walls at various angles
  (cols, rows, rng, tm) => {
    const segs = [];
    const w = cols * CELL_SIZE;
    const count = 8 + Math.floor(rng() * 6);
    for (let i = 0; i < count; i++) {
      const cx = CELL_SIZE + rng() * (w - CELL_SIZE * 2);
      const cy = tm + CELL_SIZE * 2 + rng() * ((rows - 4) * CELL_SIZE);
      const len = (1.5 + rng() * 2.5) * CELL_SIZE;
      const type = rng();
      if (type < 0.3) {
        segs.push(...hWall(cx, cy, len));
      } else if (type < 0.6) {
        segs.push(...vWall(cx, cy, len));
      } else {
        // Diagonal at random angle
        const angle = (rng() * 0.8 + 0.2) * Math.PI * (rng() > 0.5 ? 1 : -1) * 0.5;
        const ex = cx + Math.cos(angle) * len;
        const ey = cy + Math.sin(angle) * len;
        segs.push(...dWall(cx, cy, ex, ey));
      }
    }
    return segs;
  },

  // V-shapes and chevrons
  (cols, rows, rng, tm) => {
    const segs = [];
    const w = cols * CELL_SIZE;
    const count = 4 + Math.floor(rng() * 4);
    for (let i = 0; i < count; i++) {
      const cx = CELL_SIZE * 2 + rng() * (w - CELL_SIZE * 4);
      const cy = tm + CELL_SIZE * 2 + rng() * ((rows - 5) * CELL_SIZE);
      const armLen = (1.5 + rng() * 2) * CELL_SIZE;
      const spread = 0.3 + rng() * 0.7; // angle spread
      const flip = rng() > 0.5 ? 1 : -1;
      // Left arm
      segs.push(...dWall(cx, cy, cx - armLen * spread, cy + armLen * flip));
      // Right arm
      segs.push(...dWall(cx, cy, cx + armLen * spread, cy + armLen * flip));
    }
    return segs;
  },

  // Cross pattern with diagonal connectors
  (cols, rows, rng, tm) => {
    const segs = [];
    const w = cols * CELL_SIZE;
    const h = rows * CELL_SIZE;
    // Horizontal bars with gaps
    for (let i = 0; i < 2; i++) {
      const y = tm + Math.floor((i + 1) / 3 * h);
      const gapX = CELL_SIZE * 2 + rng() * (w - CELL_SIZE * 5);
      const gapW = CELL_SIZE * 2;
      if (gapX > CELL_SIZE) segs.push(...hWall(CELL_SIZE / 2, y, gapX));
      if (gapX + gapW < w - CELL_SIZE) segs.push(...hWall(gapX + gapW, y, w - gapX - gapW - CELL_SIZE));
    }
    // Diagonal connectors between gaps
    const diagCount = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < diagCount; i++) {
      const x1 = CELL_SIZE * 2 + rng() * (w - CELL_SIZE * 4);
      const y1 = tm + CELL_SIZE * 2 + rng() * (h * 0.3);
      const x2 = CELL_SIZE * 2 + rng() * (w - CELL_SIZE * 4);
      const y2 = y1 + CELL_SIZE * 2 + rng() * CELL_SIZE * 3;
      segs.push(...dWall(x1, y1, x2, y2));
    }
    return segs;
  },

  // Starburst / radial walls from center points
  (cols, rows, rng, tm) => {
    const segs = [];
    const w = cols * CELL_SIZE;
    const h = rows * CELL_SIZE;
    const centers = 2 + Math.floor(rng() * 2);
    for (let c = 0; c < centers; c++) {
      const cx = CELL_SIZE * 2 + rng() * (w - CELL_SIZE * 4);
      const cy = tm + CELL_SIZE * 3 + rng() * (h - CELL_SIZE * 6);
      const armCount = 3 + Math.floor(rng() * 3);
      for (let a = 0; a < armCount; a++) {
        const angle = (a / armCount) * Math.PI * 2 + rng() * 0.3;
        const armLen = (1.5 + rng() * 2) * CELL_SIZE;
        const ex = cx + Math.cos(angle) * armLen;
        const ey = cy + Math.sin(angle) * armLen;
        segs.push(...dWall(cx, cy, ex, ey));
      }
    }
    return segs;
  },

  // Zigzag with diagonals
  (cols, rows, rng, tm) => {
    const segs = [];
    const w = cols * CELL_SIZE;
    let fromLeft = rng() > 0.5;
    for (let row = 2; row < rows - 3; row += 3) {
      const y = tm + row * CELL_SIZE;
      const startX = fromLeft ? CELL_SIZE : w * 0.4;
      const endX = fromLeft ? w * 0.6 : w - CELL_SIZE;
      // Horizontal part
      segs.push(...hWall(startX, y, endX - startX));
      // Diagonal connector to next row
      if (row + 3 < rows - 3) {
        const nextY = tm + (row + 3) * CELL_SIZE;
        const nextFromLeft = !fromLeft;
        const nextStartX = nextFromLeft ? CELL_SIZE : w * 0.4;
        // Connect end of this wall to start of next
        const connX1 = fromLeft ? endX : startX;
        const connX2 = nextFromLeft ? nextStartX : w - CELL_SIZE;
        segs.push(...dWall(connX1, y, connX2, nextY));
      }
      fromLeft = !fromLeft;
    }
    return segs;
  },

  // Maze-like thin walls with diagonals
  (cols, rows, rng, tm) => {
    const segs = [];
    const w = cols * CELL_SIZE;
    const count = 10 + Math.floor(rng() * 5);
    for (let i = 0; i < count; i++) {
      const cx = CELL_SIZE + rng() * (w - CELL_SIZE * 2);
      const cy = tm + CELL_SIZE * 2 + rng() * ((rows - 4) * CELL_SIZE);
      const len = (1 + rng() * 2) * CELL_SIZE;
      // Random angle: 0, 45, 90, 135 degrees (with some variation)
      const baseAngles = [0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4];
      const angle = baseAngles[Math.floor(rng() * 4)] + (rng() - 0.5) * 0.3;
      const ex = cx + Math.cos(angle) * len;
      const ey = cy + Math.sin(angle) * len;

      if (Math.abs(angle) < 0.15 || Math.abs(angle - Math.PI) < 0.15) {
        segs.push(...hWall(Math.min(cx, ex), cy, Math.abs(ex - cx)));
      } else if (Math.abs(angle - Math.PI / 2) < 0.15) {
        segs.push(...vWall(cx, Math.min(cy, ey), Math.abs(ey - cy)));
      } else {
        segs.push(...dWall(cx, cy, ex, ey));
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

export function generateArenaLayout(arenaIndex, arenaWidth, arenaHeight, topMargin) {
  const cols = Math.floor(arenaWidth / CELL_SIZE);
  const rows = Math.floor((arenaHeight - topMargin) / CELL_SIZE);
  const rng = seedRng(arenaIndex * 7919 + 42);

  const layoutIdx = Math.floor(rng() * LAYOUT_GENERATORS.length);
  const rawWalls = LAYOUT_GENERATORS[layoutIdx](cols, rows, rng, topMargin);

  // Filter walls: keep within playable area
  const walls = rawWalls.filter((w) => {
    return w.y >= topMargin + CELL_SIZE &&
      w.y <= arenaHeight - CELL_SIZE * 2 &&
      w.x >= 0 && w.x <= arenaWidth &&
      w.w > 0 && w.h > 0;
  });

  // Build occupancy grid for open-space detection
  const occupied = Array.from({ length: rows }, () => Array(cols).fill(false));
  walls.forEach((w) => {
    const c = Math.floor(w.x / CELL_SIZE);
    const r = Math.floor((w.y - topMargin) / CELL_SIZE);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      occupied[r][c] = true;
    }
  });

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
