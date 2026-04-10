import Phaser from 'phaser';
import { THEME } from '../../ui/Theme.js';

// Arrow directions and their movement vectors
const DIRS = {
  right: { dx: 1, dy: 0, emoji: '→', angle: 0 },
  left:  { dx: -1, dy: 0, emoji: '←', angle: 180 },
  down:  { dx: 0, dy: 1, emoji: '↓', angle: 90 },
  up:    { dx: 0, dy: -1, emoji: '↑', angle: 270 },
};
const DIR_KEYS = ['right', 'left', 'down', 'up'];

export class ArrowPuzzle extends Phaser.Scene {
  constructor() { super('ArrowPuzzle'); }

  init(data) {
    this.petName = data.petName || 'Tier';
    this.onCompleteScene = data.onComplete || 'Shelter';
    this.need = data.need || 'play';
    const diff = data.difficulty || 2;
    // Grid size scales with difficulty
    this.COLS = diff <= 1 ? 4 : diff <= 2 ? 5 : 6;
    this.ROWS = diff <= 1 ? 4 : diff <= 2 ? 5 : 6;
    this.MAX_LIVES = 3;
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    this.lives = this.MAX_LIVES;

    this.cameras.main.setBackgroundColor('#f0f4f8');

    // Header
    this.add.text(cx, 28, '🧩 Pfeil-Rätsel', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 52, 'Tippe Pfeile in der richtigen Reihenfolge!', {
      fontSize: '11px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Lives display
    this.livesText = this.add.text(cx, 72, this.getLivesText(), {
      fontSize: '18px',
    }).setOrigin(0.5);

    // Calculate grid layout
    const cellSize = Math.min(55, Math.floor((width - 40) / this.COLS));
    const gridW = this.COLS * cellSize;
    const gridH = this.ROWS * cellSize;
    const gridX = (width - gridW) / 2;
    const gridY = 100;
    this.cellSize = cellSize;
    this.gridX = gridX;
    this.gridY = gridY;

    // Generate puzzle grid
    this.grid = [];
    for (let r = 0; r < this.ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.COLS; c++) {
        const dir = DIR_KEYS[Math.floor(Math.random() * 4)];
        this.grid[r][c] = { dir, removed: false };
      }
    }

    // Ensure puzzle is solvable: at least some arrows can be removed initially
    this.ensureSolvable();

    // Draw grid
    this.arrowSprites = [];
    this.cellBgs = [];
    this.drawGrid();

    // Score
    this.totalArrows = this.COLS * this.ROWS;
    this.removedCount = 0;
    this.scoreText = this.add.text(cx, gridY + gridH + 20, `0/${this.totalArrows} entfernt`, {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.body,
    }).setOrigin(0.5);

    // Progress bar
    const barY = gridY + gridH + 45;
    const barW = width - 60;
    this.add.rectangle(cx, barY, barW, 16, 0xd8d0e0).setStrokeStyle(1, 0xc0b0c8);
    this.progressFill = this.add.rectangle(cx - barW / 2 + 2, barY, 0, 12, 0x66aa88).setOrigin(0, 0.5);
    this.progressMaxW = barW - 4;

    // Input
    this.input.on('pointerdown', (pointer) => {
      if (this.gameOver) return;
      const col = Math.floor((pointer.x - gridX) / cellSize);
      const row = Math.floor((pointer.y - gridY) / cellSize);
      if (col >= 0 && col < this.COLS && row >= 0 && row < this.ROWS) {
        this.tryRemoveArrow(row, col);
      }
    });

    // Cancel button
    this.add.text(cx, height - 30, '← Abbrechen', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: THEME.text.muted,
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
      this.registry.set('puzzleResult', { success: false });
      this.scene.start(this.onCompleteScene);
    });

    this.gameOver = false;
  }

  ensureSolvable() {
    // Make sure border arrows pointing outward exist (always removable)
    // Top row: some point up, Bottom row: some point down, etc.
    for (let c = 0; c < this.COLS; c++) {
      if (Math.random() > 0.5) this.grid[0][c].dir = 'up';
      if (Math.random() > 0.5) this.grid[this.ROWS - 1][c].dir = 'down';
    }
    for (let r = 0; r < this.ROWS; r++) {
      if (Math.random() > 0.5) this.grid[r][0].dir = 'left';
      if (Math.random() > 0.5) this.grid[r][this.COLS - 1].dir = 'right';
    }
  }

  drawGrid() {
    // Clear old sprites
    this.arrowSprites.forEach(s => { if (s) s.forEach(o => { if (o) o.destroy(); }); });
    this.cellBgs.forEach(s => { if (s) s.forEach(o => { if (o) o.destroy(); }); });
    this.arrowSprites = [];
    this.cellBgs = [];

    for (let r = 0; r < this.ROWS; r++) {
      this.arrowSprites[r] = [];
      this.cellBgs[r] = [];
      for (let c = 0; c < this.COLS; c++) {
        const cell = this.grid[r][c];
        const x = this.gridX + c * this.cellSize + this.cellSize / 2;
        const y = this.gridY + r * this.cellSize + this.cellSize / 2;

        // Cell background
        const canRemove = !cell.removed && this.canRemove(r, c);
        const bgColor = cell.removed ? 0xf0f4f8 : (canRemove ? 0xe8f5e8 : 0xf5f0f8);
        const bg = this.add.rectangle(x, y, this.cellSize - 3, this.cellSize - 3, bgColor, cell.removed ? 0 : 0.9)
          .setStrokeStyle(cell.removed ? 0 : 1, canRemove ? 0x88cc88 : 0xd0c0d8);
        this.cellBgs[r][c] = bg;

        if (cell.removed) {
          this.arrowSprites[r][c] = null;
          continue;
        }

        // Arrow
        const dir = DIRS[cell.dir];
        const arrow = this.add.text(x, y, dir.emoji, {
          fontSize: `${Math.floor(this.cellSize * 0.55)}px`,
          fontFamily: 'monospace', color: canRemove ? '#2a6a3a' : '#4a3a5a',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        this.arrowSprites[r][c] = arrow;
      }
    }
  }

  canRemove(row, col) {
    const cell = this.grid[row][col];
    if (cell.removed) return false;
    const dir = DIRS[cell.dir];
    // Check if path in arrow direction is clear (no blocking arrow)
    let r = row + dir.dy;
    let c = col + dir.dx;
    while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS) {
      if (!this.grid[r][c].removed) return false; // blocked!
      r += dir.dy;
      c += dir.dx;
    }
    return true; // clear path to edge
  }

  tryRemoveArrow(row, col) {
    const cell = this.grid[row][col];
    if (cell.removed) return;

    if (this.canRemove(row, col)) {
      // Success — fly arrow out
      cell.removed = true;
      this.removedCount++;
      this.animateArrowOut(row, col, cell.dir);
      this.updateScore();

      // Redraw to update highlights
      this.time.delayedCall(200, () => {
        if (!this.gameOver) this.drawGrid();
      });
    } else {
      // Blocked — lose a life!
      this.lives--;
      this.livesText.setText(this.getLivesText());
      this.shakeCell(row, col);

      // Show what blocked it
      const dir = DIRS[cell.dir];
      let r = row + dir.dy, c = col + dir.dx;
      while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS) {
        if (!this.grid[r][c].removed) {
          // Flash the blocking arrow red
          const blocker = this.arrowSprites[r][c];
          if (blocker) {
            blocker.setColor('#ff3333');
            this.time.delayedCall(500, () => { if (blocker.active) blocker.setColor('#4a3a5a'); });
          }
          break;
        }
        r += dir.dy; c += dir.dx;
      }

      if (this.lives <= 0) {
        this.gameOver = true;
        this.showGameOver();
      }
    }
  }

  animateArrowOut(row, col, dirKey) {
    const dir = DIRS[dirKey];
    const x = this.gridX + col * this.cellSize + this.cellSize / 2;
    const y = this.gridY + row * this.cellSize + this.cellSize / 2;
    const arrow = this.arrowSprites[row][col];
    if (!arrow) return;

    this.tweens.add({
      targets: arrow,
      x: x + dir.dx * 200,
      y: y + dir.dy * 200,
      alpha: 0, scale: 0.5,
      duration: 300, ease: 'Quad.In',
      onComplete: () => arrow.destroy(),
    });

    // Sparkle trail
    for (let i = 0; i < 3; i++) {
      const sp = this.add.circle(x + dir.dx * i * 15, y + dir.dy * i * 15, 3, 0x88cc88, 0.6);
      this.tweens.add({
        targets: sp, alpha: 0, scale: 2, duration: 300, delay: i * 50,
        onComplete: () => sp.destroy(),
      });
    }
  }

  shakeCell(row, col) {
    const x = this.gridX + col * this.cellSize + this.cellSize / 2;
    const y = this.gridY + row * this.cellSize + this.cellSize / 2;
    const bg = this.cellBgs[row][col];
    if (bg) {
      bg.setFillStyle(0xffcccc, 0.9);
      this.tweens.add({
        targets: bg, x: x - 4, duration: 50, yoyo: true, repeat: 3,
        onComplete: () => { bg.x = x; bg.setFillStyle(0xf5f0f8, 0.9); },
      });
    }
  }

  updateScore() {
    this.scoreText.setText(`${this.removedCount}/${this.totalArrows} entfernt`);
    this.progressFill.width = this.progressMaxW * (this.removedCount / this.totalArrows);

    if (this.removedCount >= this.totalArrows) {
      this.gameOver = true;
      this.showSuccess();
    }
  }

  getLivesText() {
    return '❤️'.repeat(this.lives) + '🖤'.repeat(this.MAX_LIVES - this.lives);
  }

  showSuccess() {
    const { width, height } = this.scale;
    const cx = width / 2;
    this.add.text(cx, height * 0.75, '🎉 Alle Pfeile entfernt!', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#33aa55', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.time.delayedCall(1500, () => {
      this.registry.set('puzzleResult', { success: true, score: this.lives * 30 + this.removedCount });
      this.scene.start(this.onCompleteScene);
    });
  }

  showGameOver() {
    const { width, height } = this.scale;
    const cx = width / 2;
    this.add.text(cx, height * 0.75, '💔 Keine Leben mehr!', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#dd4444', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.time.delayedCall(1500, () => {
      this.registry.set('puzzleResult', { success: false, score: this.removedCount });
      this.scene.start(this.onCompleteScene);
    });
  }
}
