export class Match3Puzzle extends Phaser.Scene {
  constructor() {
    super('Match3Puzzle');
  }

  init(data) {
    this.petName = data.petName || 'Unbekannt';
    this.onCompleteScene = data.onComplete || 'Vet';
    this.cost = data.cost || 20;

    this.COLS = 5;
    this.ROWS = 5;
    this.CELL = 60;
    this.TYPES = ['💊', '💉', '🩹', '🧴', '🩺'];
    this.GOAL = 100;
    this.TIME_LIMIT = 30;

    this.score = 0;
    this.timer = this.TIME_LIMIT;
    this.grid = [];
    this.cells = [];
    this.selected = null;
    this.locked = false;
    this.gameOver = false;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#f8f2fc');

    // Board offset to center
    this.boardX = (width - this.COLS * this.CELL) / 2;
    this.boardY = 180;

    // UI texts
    this.titleText = this.add.text(width / 2, 20, `🏥 Behandlung für ${this.petName}`, {
      fontSize: '22px', color: '#4a3560', fontFamily: 'Arial'
    }).setOrigin(0.5, 0);

    this.timerText = this.add.text(width / 2, 55, `⏱ ${this.timer}s`, {
      fontSize: '24px', color: '#e89030', fontFamily: 'Arial'
    }).setOrigin(0.5, 0);

    this.scoreText = this.add.text(width / 2, 85, `Punkte: 0 / ${this.GOAL}`, {
      fontSize: '20px', color: '#5588cc', fontFamily: 'Arial'
    }).setOrigin(0.5, 0);

    // Progress bar background
    const barWidth = 300;
    const barHeight = 16;
    const barX = (width - barWidth) / 2;
    const barY = 120;
    this.add.graphics()
      .fillStyle(0xe0d0e8, 1)
      .fillRoundedRect(barX, barY, barWidth, barHeight, 8);

    this.progressBar = this.add.graphics();
    this.updateProgressBar(barX, barY, barWidth, barHeight);

    // Give up button
    const giveUpBtn = this.add.text(width / 2, 150, '❌ Aufgeben', {
      fontSize: '18px', color: '#cc4444', fontFamily: 'Arial',
      backgroundColor: '#f5e0e0', padding: { x: 12, y: 4 }
    }).setOrigin(0.5, 0);

    // Build the grid
    this.buildGrid();
    this.renderGrid();

    // Remove initial matches silently
    this.resolveInitialMatches();

    // Timer event
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.tickTimer,
      callbackScope: this,
      loop: true
    });

    // Pointer input
    this.input.on('pointerdown', (pointer) => {
      if (this.locked || this.gameOver) return;

      // Check give up button
      const btnBounds = giveUpBtn.getBounds();
      if (btnBounds.contains(pointer.x, pointer.y)) {
        this.endGame(false);
        return;
      }

      const col = Math.floor((pointer.x - this.boardX) / this.CELL);
      const row = Math.floor((pointer.y - this.boardY) / this.CELL);

      if (col < 0 || col >= this.COLS || row < 0 || row >= this.ROWS) return;

      if (this.selected === null) {
        this.selected = { col, row };
        this.highlightCell(col, row);
      } else {
        const prev = this.selected;
        const dx = Math.abs(col - prev.col);
        const dy = Math.abs(row - prev.row);

        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
          this.clearHighlight();
          this.trySwap(prev.col, prev.row, col, row);
        } else {
          this.clearHighlight();
          this.selected = { col, row };
          this.highlightCell(col, row);
        }
      }
    });
  }

  buildGrid() {
    this.grid = [];
    for (let r = 0; r < this.ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.COLS; c++) {
        this.grid[r][c] = this.randomType();
      }
    }
  }

  randomType() {
    return Phaser.Math.Between(0, this.TYPES.length - 1);
  }

  renderGrid() {
    // Destroy old cell texts
    if (this.cells.length > 0) {
      this.cells.forEach(row => row.forEach(t => { if (t) t.destroy(); }));
    }
    this.cells = [];

    for (let r = 0; r < this.ROWS; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.COLS; c++) {
        const x = this.boardX + c * this.CELL + this.CELL / 2;
        const y = this.boardY + r * this.CELL + this.CELL / 2;
        const emoji = this.TYPES[this.grid[r][c]];
        const t = this.add.text(x, y, emoji, {
          fontSize: '36px', fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.cells[r][c] = t;
      }
    }
  }

  updateCellPositions() {
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (!this.cells[r][c]) continue;
        const emoji = this.TYPES[this.grid[r][c]];
        this.cells[r][c].setText(emoji);
        const targetX = this.boardX + c * this.CELL + this.CELL / 2;
        const targetY = this.boardY + r * this.CELL + this.CELL / 2;
        this.cells[r][c].setPosition(targetX, targetY);
        this.cells[r][c].setAlpha(1);
        this.cells[r][c].setScale(1);
      }
    }
  }

  highlightCell(col, row) {
    if (this.highlight) this.highlight.destroy();
    const x = this.boardX + col * this.CELL;
    const y = this.boardY + row * this.CELL;
    this.highlight = this.add.graphics();
    this.highlight.lineStyle(3, 0xffff00, 1);
    this.highlight.strokeRoundedRect(x + 2, y + 2, this.CELL - 4, this.CELL - 4, 6);
  }

  clearHighlight() {
    if (this.highlight) {
      this.highlight.destroy();
      this.highlight = null;
    }
    this.selected = null;
  }

  trySwap(c1, r1, c2, r2) {
    this.locked = true;

    // Swap in grid
    const tmp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = tmp;

    const matches = this.findMatches();
    if (matches.length === 0) {
      // Swap back
      this.grid[r2][c2] = this.grid[r1][c1];
      this.grid[r1][c1] = tmp;

      // Animate failed swap
      const t1 = this.cells[r1][c1];
      const t2 = this.cells[r2][c2];
      const x1 = t1.x, y1 = t1.y;
      const x2 = t2.x, y2 = t2.y;

      this.tweens.add({
        targets: t1, x: x2, y: y2, duration: 120, yoyo: true,
      });
      this.tweens.add({
        targets: t2, x: x1, y: y1, duration: 120, yoyo: true,
        onComplete: () => { this.locked = false; }
      });
      return;
    }

    // Valid swap - animate and resolve
    this.updateCellPositions();
    this.resolveMatches(matches);
  }

  findMatches() {
    const matched = new Set();

    // Horizontal
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS - 2; c++) {
        const t = this.grid[r][c];
        if (t < 0) continue;
        let len = 1;
        while (c + len < this.COLS && this.grid[r][c + len] === t) len++;
        if (len >= 3) {
          for (let i = 0; i < len; i++) matched.add(`${r},${c + i}`);
        }
      }
    }

    // Vertical
    for (let c = 0; c < this.COLS; c++) {
      for (let r = 0; r < this.ROWS - 2; r++) {
        const t = this.grid[r][c];
        if (t < 0) continue;
        let len = 1;
        while (r + len < this.ROWS && this.grid[r + len][c] === t) len++;
        if (len >= 3) {
          for (let i = 0; i < len; i++) matched.add(`${r + i},${c}`);
        }
      }
    }

    return Array.from(matched).map(s => {
      const [r, c] = s.split(',').map(Number);
      return { r, c };
    });
  }

  resolveMatches(matches) {
    const count = matches.length;
    this.score += count * 10;
    this.scoreText.setText(`Punkte: ${this.score} / ${this.GOAL}`);
    this.updateProgressBar(
      (540 - 300) / 2, 120, 300, 16
    );

    // Animate matched cells
    matches.forEach(({ r, c }) => {
      if (this.cells[r][c]) {
        this.tweens.add({
          targets: this.cells[r][c],
          scale: 1.4,
          alpha: 0,
          duration: 200,
        });
      }
      this.grid[r][c] = -1;
    });

    // After animation, collapse and fill
    this.time.delayedCall(250, () => {
      if (this.score >= this.GOAL) {
        this.endGame(true);
        return;
      }
      this.collapseAndFill();
    });
  }

  collapseAndFill() {
    // Gravity: move items down
    for (let c = 0; c < this.COLS; c++) {
      let writeRow = this.ROWS - 1;
      for (let r = this.ROWS - 1; r >= 0; r--) {
        if (this.grid[r][c] >= 0) {
          this.grid[writeRow][c] = this.grid[r][c];
          if (writeRow !== r) this.grid[r][c] = -1;
          writeRow--;
        }
      }
      // Fill empty spots at top
      for (let r = writeRow; r >= 0; r--) {
        this.grid[r][c] = this.randomType();
      }
    }

    this.updateCellPositions();

    // Animate new cells falling in
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const cell = this.cells[r][c];
        const targetY = cell.y;
        cell.y = targetY - 30;
        cell.setAlpha(0.5);
        this.tweens.add({
          targets: cell,
          y: targetY,
          alpha: 1,
          duration: 150,
          delay: c * 30,
        });
      }
    }

    // Check for chain matches
    this.time.delayedCall(300, () => {
      const newMatches = this.findMatches();
      if (newMatches.length > 0) {
        this.resolveMatches(newMatches);
      } else {
        // Check if any moves remain
        if (!this.hasValidMoves()) {
          this.endGame(false);
        } else {
          this.locked = false;
        }
      }
    });
  }

  hasValidMoves() {
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        // Try swap right
        if (c + 1 < this.COLS) {
          this.swapGrid(r, c, r, c + 1);
          if (this.findMatches().length > 0) {
            this.swapGrid(r, c, r, c + 1);
            return true;
          }
          this.swapGrid(r, c, r, c + 1);
        }
        // Try swap down
        if (r + 1 < this.ROWS) {
          this.swapGrid(r, c, r + 1, c);
          if (this.findMatches().length > 0) {
            this.swapGrid(r, c, r + 1, c);
            return true;
          }
          this.swapGrid(r, c, r + 1, c);
        }
      }
    }
    return false;
  }

  swapGrid(r1, c1, r2, c2) {
    const tmp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = tmp;
  }

  resolveInitialMatches() {
    let matches = this.findMatches();
    let attempts = 0;
    while (matches.length > 0 && attempts < 50) {
      matches.forEach(({ r, c }) => {
        this.grid[r][c] = this.randomType();
      });
      matches = this.findMatches();
      attempts++;
    }
    this.updateCellPositions();
  }

  updateProgressBar(barX, barY, barWidth, barHeight) {
    this.progressBar.clear();
    const progress = Math.min(this.score / this.GOAL, 1);
    if (progress > 0) {
      this.progressBar.fillStyle(0x44dd66, 1);
      this.progressBar.fillRoundedRect(barX, barY, barWidth * progress, barHeight, 8);
    }
  }

  tickTimer() {
    if (this.gameOver) return;
    this.timer--;
    this.timerText.setText(`⏱ ${this.timer}s`);

    if (this.timer <= 5) {
      this.timerText.setColor('#dd4444');
    }

    if (this.timer <= 0) {
      this.endGame(this.score >= this.GOAL);
    }
  }

  endGame(success) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.locked = true;

    if (this.timerEvent) this.timerEvent.remove();

    const { width, height } = this.scale;
    const result = { success, score: this.score };

    // Overlay
    this.add.graphics()
      .fillStyle(0x2a1a3a, 0.75)
      .fillRect(0, 0, width, height);

    const msg = success
      ? `✅ Behandlung erfolgreich!\nPunkte: ${this.score}`
      : `❌ Nicht geschafft.\nPunkte: ${this.score}`;

    this.add.text(width / 2, height / 2 - 40, msg, {
      fontSize: '26px', color: '#ffffff', fontFamily: 'Arial',
      align: 'center', lineSpacing: 10
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 40, '▶ Weiter', {
      fontSize: '24px', color: '#33aa55', fontFamily: 'Arial',
      backgroundColor: '#e0f5e8', padding: { x: 20, y: 8 }
    }).setOrigin(0.5);

    // Wait for tap to continue
    this.time.delayedCall(400, () => {
      this.input.once('pointerdown', () => {
        this.registry.set('puzzleResult', result);
        this.scene.start(this.onCompleteScene);
      });
    });
  }
}
