// Puzzle rotation pool — never the same puzzle twice in a row
const PUZZLE_POOL = ['SortPuzzle', 'MemoryPuzzle', 'Match3Puzzle', 'SwipePuzzle', 'TimingPuzzle', 'ArrowPuzzle'];

// Get a random puzzle, avoiding the last one used for this context
export function getRandomPuzzle(save, contextKey) {
  const storeKey = `_lastPuzzle_${contextKey}`;
  const lastUsed = save[storeKey] || '';
  const available = PUZZLE_POOL.filter(p => p !== lastUsed);
  const chosen = available[Math.floor(Math.random() * available.length)];
  save[storeKey] = chosen;
  return chosen;
}
