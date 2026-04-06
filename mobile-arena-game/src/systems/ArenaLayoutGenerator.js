import Phaser from 'phaser';

// Grid-based arena layout generator
// Creates varied wall layouts for each arena

const CELL_SIZE = 40;

// Layout templates - each is a function returning a grid
// 0 = open, 1 = wall
// Grid is based on cols x rows fitting the arena

const LAYOUT_GENERATORS = [
  // Layout: Scattered pillars
  (cols, rows, rng) => {
    const grid = makeEmptyGrid(cols, rows);
    const pillarCount = 6 + Math.floor(rng() * 5);
    for (let i = 0; i < pillarCount; i++) {
      const cx = 2 + Math.floor(rng() * (cols - 4));
      const cy = 2 + Math.floor(rng() * (rows - 4));
      // 1x1 or 2x1 or 1x2 pillar
      grid[cy][cx] = 1;
      if (rng() > 0.5 && cx + 1 < cols - 1) grid[cy][cx + 1] = 1;
      if (rng() > 0.5 && cy + 1 < rows - 1) grid[cy + 1][cx] = 1;
    }
    return grid;
  },

  // Layout: Cross corridors
  (cols, rows, rng) => {
    const grid = makeEmptyGrid(cols, rows);
    // Horizontal walls with gaps
    const hWalls = [Math.floor(rows * 0.3), Math.floor(rows * 0.6)];
    hWalls.forEach((wy) => {
      for (let x = 0; x < cols; x++) {
        grid[wy][x] = 1;
      }
      // Cut 2-3 gaps
      const gapCount = 2 + Math.floor(rng() * 2);
      for (let g = 0; g < gapCount; g++) {
        const gx = 1 + Math.floor(rng() * (cols - 2));
        grid[wy][gx] = 0;
        if (gx + 1 < cols) grid[wy][gx + 1] = 0;
      }
    });
    // Vertical walls with gaps
    const vWalls = [Math.floor(cols * 0.35), Math.floor(cols * 0.65)];
    vWalls.forEach((wx) => {
      for (let y = 2; y < rows - 2; y++) {
        if (grid[y][wx] === 0) grid[y][wx] = 1;
      }
      const gapCount = 2 + Math.floor(rng() * 2);
      for (let g = 0; g < gapCount; g++) {
        const gy = 2 + Math.floor(rng() * (rows - 4));
        grid[gy][wx] = 0;
        if (gy + 1 < rows) grid[gy + 1][wx] = 0;
      }
    });
    return grid;
  },

  // Layout: Rooms with doorways
  (cols, rows, rng) => {
    const grid = makeEmptyGrid(cols, rows);
    // Create 2-4 rectangular rooms
    const roomCount = 2 + Math.floor(rng() * 3);
    for (let r = 0; r < roomCount; r++) {
      const rx = 1 + Math.floor(rng() * (cols - 5));
      const ry = 2 + Math.floor(rng() * (rows - 6));
      const rw = 3 + Math.floor(rng() * 3);
      const rh = 2 + Math.floor(rng() * 3);
      // Draw room walls
      for (let x = rx; x < rx + rw && x < cols - 1; x++) {
        if (ry < rows) grid[ry][x] = 1;
        if (ry + rh - 1 < rows) grid[ry + rh - 1][x] = 1;
      }
      for (let y = ry; y < ry + rh && y < rows; y++) {
        if (rx < cols) grid[y][rx] = 1;
        if (rx + rw - 1 < cols) grid[y][rx + rw - 1] = 1;
      }
      // Cut a doorway on each side
      const doorX = rx + 1 + Math.floor(rng() * Math.max(1, rw - 2));
      const doorY = ry + 1 + Math.floor(rng() * Math.max(1, rh - 2));
      if (doorX < cols && ry < rows) grid[ry][doorX] = 0;
      if (doorX < cols && ry + rh - 1 < rows) grid[ry + rh - 1][doorX] = 0;
      if (rx < cols && doorY < rows) grid[doorY][rx] = 0;
      if (rx + rw - 1 < cols && doorY < rows) grid[doorY][rx + rw - 1] = 0;
    }
    return grid;
  },

  // Layout: L-shaped walls
  (cols, rows, rng) => {
    const grid = makeEmptyGrid(cols, rows);
    const wallCount = 4 + Math.floor(rng() * 3);
    for (let i = 0; i < wallCount; i++) {
      const cx = 2 + Math.floor(rng() * (cols - 4));
      const cy = 2 + Math.floor(rng() * (rows - 5));
      const len = 2 + Math.floor(rng() * 3);
      const dir = Math.floor(rng() * 4); // 0=right-down, 1=right-up, 2=left-down, 3=left-up
      // Horizontal part
      for (let s = 0; s < len; s++) {
        const dx = (dir < 2) ? s : -s;
        const nx = cx + dx;
        if (nx >= 1 && nx < cols - 1) grid[cy][nx] = 1;
      }
      // Vertical part
      for (let s = 0; s < len; s++) {
        const dy = (dir % 2 === 0) ? s : -s;
        const ny = cy + dy;
        if (ny >= 2 && ny < rows - 1) grid[ny][cx] = 1;
      }
    }
    return grid;
  },

  // Layout: Zigzag corridors
  (cols, rows, rng) => {
    const grid = makeEmptyGrid(cols, rows);
    // Create horizontal zigzag walls
    for (let wy = 3; wy < rows - 3; wy += 4) {
      const fromLeft = (wy % 8 < 4);
      const startX = fromLeft ? 0 : Math.floor(cols * 0.3);
      const endX = fromLeft ? Math.floor(cols * 0.7) : cols;
      for (let x = startX; x < endX && x < cols; x++) {
        grid[wy][x] = 1;
      }
      // Cut a gap
      const gx = startX + 1 + Math.floor(rng() * Math.max(1, endX - startX - 3));
      if (gx < cols) grid[wy][gx] = 0;
      if (gx + 1 < cols) grid[wy][gx + 1] = 0;
    }
    return grid;
  },
];

function makeEmptyGrid(cols, rows) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

// Simple seeded RNG for reproducible layouts per arena
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

  // Pick a layout based on arena index
  const layoutIdx = Math.floor(rng() * LAYOUT_GENERATORS.length);
  const grid = LAYOUT_GENERATORS[layoutIdx](cols, rows, rng);

  // Always clear bottom 2 rows (player spawn area) and top row
  for (let x = 0; x < cols; x++) {
    grid[0][x] = 0;
    if (rows - 1 >= 0) grid[rows - 1][x] = 0;
    if (rows - 2 >= 0) grid[rows - 2][x] = 0;
  }

  // Convert grid to wall rectangles (world coordinates)
  const walls = [];
  const openSpaces = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = c * CELL_SIZE + CELL_SIZE / 2;
      const wy = topMargin + r * CELL_SIZE + CELL_SIZE / 2;
      if (grid[r][c] === 1) {
        walls.push({ x: wx, y: wy, w: CELL_SIZE, h: CELL_SIZE });
      } else {
        openSpaces.push({ x: wx, y: wy, gridR: r, gridC: c });
      }
    }
  }

  // Pick a random portal position from open spaces in the top third
  const topThird = openSpaces.filter((s) => s.gridR < Math.floor(rows / 3) && s.gridR > 0);
  const portalSpace = topThird.length > 0
    ? topThird[Math.floor(rng() * topThird.length)]
    : openSpaces[Math.floor(rng() * openSpaces.length)];

  return {
    walls,
    openSpaces,
    portalPosition: { x: portalSpace.x, y: portalSpace.y },
    cols,
    rows,
    cellSize: CELL_SIZE,
    topMargin,
  };
}

// Get random open positions avoiding walls
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
