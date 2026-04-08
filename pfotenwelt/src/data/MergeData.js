// Merge item definitions and chains
// Items merge in chains: level 1 + level 1 = level 2, etc.

// Each level has a UNIQUE emoji — no two levels share the same icon!
// Sprites are also unique per level where assets exist.
export const ITEM_CHAINS = {
  food: {
    name: 'Futter',
    icon: '🍖',
    levels: [
      { id: 'food_1', name: 'Krümel', emoji: '🌾', sprite: 'item_kibble', value: 1 },
      { id: 'food_2', name: 'Leckerli', emoji: '🦴', sprite: 'item_treat', value: 3 },
      { id: 'food_3', name: 'Futternapf', emoji: '🥣', sprite: 'item_bowl', value: 8 },
      { id: 'food_4', name: 'Premium Futter', emoji: '🥩', sprite: 'item_premium_food', value: 20 },
      { id: 'food_5', name: 'Festmahl', emoji: '👑🍖', sprite: 'item_feast', value: 50 },
    ],
  },
  toy: {
    name: 'Spielzeug',
    icon: '🧸',
    levels: [
      { id: 'toy_1', name: 'Faden', emoji: '🧶', sprite: 'item_yarn', value: 1 },
      { id: 'toy_2', name: 'Ball', emoji: '⚽', sprite: 'item_ball', value: 3 },
      { id: 'toy_3', name: 'Plüschtier', emoji: '🧸', sprite: 'item_plush', value: 8 },
      { id: 'toy_4', name: 'Kratzbaum', emoji: '🎄', sprite: 'item_cattree', value: 20 },
      { id: 'toy_5', name: 'Spielparadies', emoji: '👑🎪', sprite: 'item_playground', value: 50 },
    ],
  },
  bed: {
    name: 'Betten',
    icon: '🛏️',
    levels: [
      { id: 'bed_1', name: 'Decke', emoji: '🧣', sprite: 'item_blanket', value: 1 },
      { id: 'bed_2', name: 'Kissen', emoji: '🛋️', sprite: 'item_cushion', value: 3 },
      { id: 'bed_3', name: 'Körbchen', emoji: '🧺', sprite: 'item_bed', value: 8 },
      { id: 'bed_4', name: 'Luxus-Bett', emoji: '🛏️', sprite: null, value: 20 },
      { id: 'bed_5', name: 'Himmelbett', emoji: '👑🛏️', sprite: null, value: 50 },
    ],
  },
  medicine: {
    name: 'Medizin',
    icon: '💊',
    levels: [
      { id: 'med_1', name: 'Pflaster', emoji: '🩹', sprite: 'item_bandage', value: 1 },
      { id: 'med_2', name: 'Salbe', emoji: '🧴', sprite: 'item_medicine', value: 3 },
      { id: 'med_3', name: 'Medizin', emoji: '💊', sprite: null, value: 8 },
      { id: 'med_4', name: 'Arzt-Set', emoji: '🩺', sprite: 'item_medkit', value: 20 },
      { id: 'med_5', name: 'Wunderheilung', emoji: '👑💊', sprite: null, value: 50 },
    ],
  },
  hygiene: {
    name: 'Pflege',
    icon: '🧼',
    levels: [
      { id: 'hyg_1', name: 'Wasser', emoji: '💧', sprite: 'item_soap', value: 1 },
      { id: 'hyg_2', name: 'Seife', emoji: '🧼', sprite: 'item_brush', value: 3 },
      { id: 'hyg_3', name: 'Bürste', emoji: '🪮', sprite: 'item_shampoo', value: 8 },
      { id: 'hyg_4', name: 'Shampoo-Set', emoji: '🛁', sprite: null, value: 20 },
      { id: 'hyg_5', name: 'Wellness-Paket', emoji: '👑🧼', sprite: null, value: 50 },
    ],
  },
};

// All items flat (for lookup)
const ALL_ITEMS = {};
Object.entries(ITEM_CHAINS).forEach(([chainKey, chain]) => {
  chain.levels.forEach((item, idx) => {
    ALL_ITEMS[item.id] = { ...item, chain: chainKey, level: idx + 1, maxLevel: chain.levels.length };
  });
});

export function getItem(itemId) {
  return ALL_ITEMS[itemId] || null;
}

// Get the merge result of two items
export function getMergeResult(itemId1, itemId2) {
  const item1 = ALL_ITEMS[itemId1];
  const item2 = ALL_ITEMS[itemId2];
  if (!item1 || !item2) return null;
  if (item1.chain !== item2.chain) return null; // different chains can't merge
  if (item1.level !== item2.level) return null; // must be same level
  if (item1.level >= item1.maxLevel) return null; // already max level

  const chain = ITEM_CHAINS[item1.chain];
  return chain.levels[item1.level]; // next level item
}

// Generate a random level-1 item
export function randomItem() {
  const chains = Object.keys(ITEM_CHAINS);
  const chain = chains[Math.floor(Math.random() * chains.length)];
  return ITEM_CHAINS[chain].levels[0].id;
}

// Merge board: 7 columns x 7 rows
export const BOARD_COLS = 7;
export const BOARD_ROWS = 7;

// Create empty board
export function createEmptyBoard() {
  const board = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    board.push(new Array(BOARD_COLS).fill(null));
  }
  return board;
}

// Create initial board with some random items
export function createInitialBoard() {
  const board = createEmptyBoard();
  // Place 8-12 random items
  const count = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    let r, c;
    do {
      r = Math.floor(Math.random() * BOARD_ROWS);
      c = Math.floor(Math.random() * BOARD_COLS);
    } while (board[r][c] !== null);
    board[r][c] = randomItem();
  }
  return board;
}

// Find first empty cell
export function findEmptyCell(board) {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] === null) return { r, c };
    }
  }
  return null;
}

// Count items on board
export function countItems(board) {
  let count = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] !== null) count++;
    }
  }
  return count;
}
