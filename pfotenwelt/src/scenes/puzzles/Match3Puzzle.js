const ITEM_THEMES = {
  medical: ['💊', '💉', '🩹', '🧴', '🩺', '🌡️'],
  food: ['🍖', '🐟', '🥕', '🧀', '🍎', '🥩'],
  grooming: ['🧼', '🪮', '✂️', '🧴', '🪥', '🧽'],
  toys: ['🎾', '🧸', '🎀', '🦴', '🪃', '🧩'],
  general: ['⭐', '💎', '🔮', '🌸', '🍀', '🌈'],
};

export class Match3Puzzle extends Phaser.Scene {
  constructor() {
    super('Match3Puzzle');
  }

  init(data) {
    this.petName = data.petName || 'Unbekannt';
    this.onCompleteScene = data.onComplete || 'Vet';
    this.cost = data.cost || 20;

    // Themed item sets
    this.theme = data.theme || 'medical';
    this.TYPES = ITEM_THEMES[this.theme] || ITEM_THEMES.general;

    // Dynamic difficulty (1-3)
    const diff = data.difficulty || 1;
    this.COLS = diff >= 3 ? 6 : 5;
    this.ROWS = diff >= 3 ? 6 : 5;
    this.CELL = diff >= 3 ? 52 : 60;
    this.GOAL = 80 + diff * 30; // 110, 140, 170
    this.TIME_LIMIT = 35 - diff * 3; // 32, 29, 26

    this.score = 0;
    this.timer = this.TIME_LIMIT;
    this.grid = [];
    this.cells = [];
    this.selected = null;
    this.locked = false;
    this.gameOver = false;

    // Combo counter
    this.comboCount = 0;

    // Move counter
    this.moveCount = 0;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#f8f2fc');

    // Background image
    const bgKey = 'bg_puzzle_medical';
    if (this.textures.exists(bgKey)) {
      const bg = this.add.image(width / 2, height / 2, bgKey);
      bg.setDisplaySize(width, height);
      bg.setAlpha(0.18);
      bg.setDepth(-1);
    }

    // Board offset to center
    this.boardX = (width - this.COLS * this.CELL) / 2;
    this.boardY = 180;

    // UI texts
    this.titleText = this.add.text(width / 2, 20, `🏥 Behandlung für ${this.petName}`, {
      fontSize: '22px', color: '#4a3560', fontFamily: 'Arial'
    }).setOrigin(0.5, 0);

    this.timerText = this.add.text(width / 2 - 60, 55, `⏱ ${this.timer}s`, {
      fontSize: '24px', color: '#e89030', fontFamily: 'Arial'
    }).setOrigin(0.5, 0);

    // Move counter display
    this.moveText = this.add.text(width / 2 + 60, 55, `🔄 0 Züge`, {
      fontSize: '20px', color: '#8866aa', fontFamily: 'Arial'
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

    // === DRAG & DROP INPUT ===
    this.dragSource = null;
    this.dragSprite = null;

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
      if (this.grid[row][col] < 0) return;

      this.dragSource = { col, row };
      this.highlightCell(col, row);

      // Create floating drag sprite
      const emoji = this.TYPES[this.grid[row][col]];
      this.dragSprite = this.add.text(pointer.x, pointer.y, emoji, {
        fontSize: '40px', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(50).setAlpha(0.8);

      // Dim the original cell
      if (this.cells[row] && this.cells[row][col]) {
        this.cells[row][col].setAlpha(0.3);
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.dragSprite) return;
      this.dragSprite.setPosition(pointer.x, pointer.y);
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.dragSprite || !this.dragSource) return;

      this.dragSprite.destroy();
      this.dragSprite = null;
      this.clearHighlight();

      const src = this.dragSource;
      this.dragSource = null;

      // Restore original cell alpha
      if (this.cells[src.row] && this.cells[src.row][src.col]) {
        this.cells[src.row][src.col].setAlpha(1);
      }

      const col = Math.floor((pointer.x - this.boardX) / this.CELL);
      const row = Math.floor((pointer.y - this.boardY) / this.CELL);
      if (col < 0 || col >= this.COLS || row < 0 || row >= this.ROWS) return;

      // Must be adjacent
      const dx = Math.abs(col - src.col);
      const dy = Math.abs(row - src.row);
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        this.trySwap(src.col, src.row, col, row);
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

    // Valid swap - increment move counter and animate
    this.moveCount++;
    this.moveText.setText(`🔄 ${this.moveCount} Züge`);

    // Reset combo for a new player-initiated chain
    this.comboCount = 0;

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

  /**
   * Detect special matches (4-in-a-row or 5-in-a-row) for power-ups.
   * Returns an array of { type: 'bomb'|'rainbow', r, c, length } objects.
   */
  checkSpecialMatches() {
    const specials = [];

    // Check horizontal runs
    for (let r = 0; r < this.ROWS; r++) {
      let c = 0;
      while (c < this.COLS) {
        const t = this.grid[r][c];
        if (t < 0) { c++; continue; }
        let len = 1;
        while (c + len < this.COLS && this.grid[r][c + len] === t) len++;
        if (len >= 5) {
          specials.push({ type: 'rainbow', r, c: c + Math.floor(len / 2), length: len });
        } else if (len >= 4) {
          specials.push({ type: 'bomb', r, c: c + Math.floor(len / 2), length: len });
        }
        c += len;
      }
    }

    // Check vertical runs
    for (let c = 0; c < this.COLS; c++) {
      let r = 0;
      while (r < this.ROWS) {
        const t = this.grid[r][c];
        if (t < 0) { r++; continue; }
        let len = 1;
        while (r + len < this.ROWS && this.grid[r + len][c] === t) len++;
        if (len >= 5) {
          specials.push({ type: 'rainbow', r: r + Math.floor(len / 2), c, length: len });
        } else if (len >= 4) {
          specials.push({ type: 'bomb', r: r + Math.floor(len / 2), c, length: len });
        }
        r += len;
      }
    }

    return specials;
  }

  /**
   * Apply a bomb power-up: clear a 3x3 area around (row, col).
   * Returns the set of additional cells cleared as [{r, c}, ...].
   */
  applyBomb(row, col) {
    const extra = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < this.ROWS && nc >= 0 && nc < this.COLS && this.grid[nr][nc] >= 0) {
          extra.push({ r: nr, c: nc });
        }
      }
    }
    return extra;
  }

  /**
   * Apply a rainbow power-up: clear all items of a random type.
   * Returns the set of additional cells cleared as [{r, c}, ...].
   */
  applyRainbow() {
    // Pick a random type that exists on the board
    const typesOnBoard = new Set();
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.grid[r][c] >= 0) typesOnBoard.add(this.grid[r][c]);
      }
    }
    if (typesOnBoard.size === 0) return [];

    const typeArr = Array.from(typesOnBoard);
    const target = typeArr[Phaser.Math.Between(0, typeArr.length - 1)];

    const extra = [];
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.grid[r][c] === target) {
          extra.push({ r, c });
        }
      }
    }
    return extra;
  }

  /**
   * Show a brief floating emoji effect at a grid position.
   */
  showPowerUpEffect(row, col, emoji) {
    const x = this.boardX + col * this.CELL + this.CELL / 2;
    const y = this.boardY + row * this.CELL + this.CELL / 2;
    const fx = this.add.text(x, y, emoji, {
      fontSize: '48px', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: fx,
      scale: 2,
      alpha: 0,
      y: y - 40,
      duration: 500,
      onComplete: () => fx.destroy()
    });
  }

  /**
   * Show the combo counter text briefly.
   */
  showComboText(comboNum) {
    const { width } = this.scale;
    const comboLabel = this.add.text(width / 2, this.boardY - 20, `${comboNum}x COMBO!`, {
      fontSize: '28px', color: '#ffaa00', fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#996600',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: comboLabel,
      scale: 1.5,
      alpha: 0,
      y: comboLabel.y - 30,
      duration: 700,
      onComplete: () => comboLabel.destroy()
    });
  }

  resolveMatches(matches) {
    // Increment combo
    this.comboCount++;

    // Show combo text if chain > 1
    if (this.comboCount > 1) {
      this.showComboText(this.comboCount);
    }

    // Check for special matches (4+ or 5+) BEFORE clearing the grid
    const specials = this.checkSpecialMatches();

    // Collect additional cells from power-ups
    const allMatched = new Set(matches.map(({ r, c }) => `${r},${c}`));
    let bonusMultiplier = 1;

    for (const special of specials) {
      if (special.type === 'rainbow') {
        bonusMultiplier = Math.max(bonusMultiplier, 3);
        const extras = this.applyRainbow();
        extras.forEach(({ r, c }) => allMatched.add(`${r},${c}`));
        this.showPowerUpEffect(special.r, special.c, '🌈');
      } else if (special.type === 'bomb') {
        bonusMultiplier = Math.max(bonusMultiplier, 2);
        const extras = this.applyBomb(special.r, special.c);
        extras.forEach(({ r, c }) => allMatched.add(`${r},${c}`));
        this.showPowerUpEffect(special.r, special.c, '💥');
      }
    }

    // Convert back to array of {r, c}
    const allMatchedArr = Array.from(allMatched).map(s => {
      const [r, c] = s.split(',').map(Number);
      return { r, c };
    });

    // Score with combo multiplier and power-up bonus
    const comboMult = Math.min(this.comboCount, 4);
    const count = allMatchedArr.length;
    this.score += count * 10 * comboMult * bonusMultiplier;

    this.scoreText.setText(`Punkte: ${this.score} / ${this.GOAL}`);
    this.updateProgressBar(
      (this.scale.width - 300) / 2, 120, 300, 16
    );

    // Animate matched cells
    allMatchedArr.forEach(({ r, c }) => {
      if (this.cells[r] && this.cells[r][c]) {
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
        // No more chain matches - reset combo
        this.comboCount = 0;

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
