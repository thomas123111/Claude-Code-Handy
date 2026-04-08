export class MemoryPuzzle extends Phaser.Scene {
  constructor() {
    super('MemoryPuzzle');
  }

  init(data) {
    this.petName = data.petName || 'Unbekannt';
    this.onCompleteScene = data.onComplete || 'Shelter';
    this.need = data.need || 'hygiene';

    // --- Grid sizes for adult audience (40+) — no baby difficulty ---
    const diff = data.difficulty || 2; // default to medium, not easy
    const GRID_CONFIGS = [
      { cols: 4, rows: 3, pairs: 6, time: 45 },   // easy = still 12 cards
      { cols: 4, rows: 4, pairs: 8, time: 50 },   // medium
      { cols: 5, rows: 4, pairs: 10, time: 60 },  // hard
    ];
    const config = GRID_CONFIGS[Math.min(diff - 1, 2)];
    this.COLS = config.cols;
    this.ROWS = config.rows;
    this.totalPairs = config.pairs;
    this.TIME_LIMIT = config.time;
    this.CARD_SIZE = 65;
    this.CARD_GAP = 6;

    // --- Themed card sets ---
    const CARD_THEMES = [
      ['🐕', '🐱', '🐰', '🐹', '🐦', '🐢', '🦎', '🐠'],
      ['🍖', '🧼', '🎾', '💊', '🛁', '🧸', '🪮', '🦴'],
      ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '💐', '🌵'],
      ['⭐', '🌙', '☀️', '🌈', '💎', '🔮', '🎀', '🍀'],
    ];
    const themeIndex = Phaser.Math.Between(0, CARD_THEMES.length - 1);
    this.EMOJIS = CARD_THEMES[themeIndex].slice(0, this.totalPairs);

    this.cards = [];
    this.cardTexts = [];
    this.revealed = [];
    this.matched = [];
    this.firstCard = null;
    this.secondCard = null;
    this.locked = false;
    this.gameOver = false;
    this.score = 0;
    this.matchesFound = 0;
    this.timer = this.TIME_LIMIT;

    // Streak tracking
    this.streak = 0;

    // Wrong streak tracking for hint system
    this.wrongStreak = 0;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#f8f2fc');

    // Background image
    const bgKey = 'bg_puzzle_workshop';
    if (this.textures.exists(bgKey)) {
      const bg = this.add.image(width / 2, height / 2, bgKey);
      bg.setDisplaySize(width, height);
      bg.setAlpha(0.18);
      bg.setDepth(-1);
    }

    // Board dimensions
    const boardW = this.COLS * (this.CARD_SIZE + this.CARD_GAP) - this.CARD_GAP;
    const boardH = this.ROWS * (this.CARD_SIZE + this.CARD_GAP) - this.CARD_GAP;
    this.boardX = (width - boardW) / 2;
    this.boardY = 200;

    // UI
    this.titleText = this.add.text(width / 2, 20, `🧠 Memory für ${this.petName}`, {
      fontSize: '22px', color: '#4a3560', fontFamily: 'Arial'
    }).setOrigin(0.5, 0);

    this.timerText = this.add.text(width / 2, 55, `⏱ ${this.timer}s`, {
      fontSize: '24px', color: '#e89030', fontFamily: 'Arial'
    }).setOrigin(0.5, 0);

    this.matchText = this.add.text(width / 2, 85, `Paare: 0 / ${this.totalPairs}`, {
      fontSize: '20px', color: '#5588cc', fontFamily: 'Arial'
    }).setOrigin(0.5, 0);

    this.scoreText = this.add.text(width / 2, 115, `Punkte: 0`, {
      fontSize: '18px', color: '#33aa55', fontFamily: 'Arial'
    }).setOrigin(0.5, 0);

    // Streak text (hidden initially, shown when streak > 1)
    this.streakText = this.add.text(width / 2, 145, '', {
      fontSize: '18px', color: '#e85020', fontFamily: 'Arial'
    }).setOrigin(0.5, 0).setAlpha(0);

    // Give up button
    const giveUpBtn = this.add.text(width / 2, height - 30, '❌ Aufgeben', {
      fontSize: '18px', color: '#cc4444', fontFamily: 'Arial',
      backgroundColor: '#f5e0e0', padding: { x: 12, y: 4 }
    }).setOrigin(0.5, 1);

    // Build card deck (pairs)
    this.buildDeck();
    this.renderCards();

    // No preview — cards start face-down, player must find pairs from scratch
    this.locked = false;
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.tickTimer,
      callbackScope: this,
      loop: true
    });

    // Pointer input
    this.input.on('pointerdown', (pointer) => {
      if (this.locked || this.gameOver) return;

      // Check give up
      const btnBounds = giveUpBtn.getBounds();
      if (btnBounds.contains(pointer.x, pointer.y)) {
        this.endGame(false);
        return;
      }

      const cardIndex = this.getCardAt(pointer.x, pointer.y);
      if (cardIndex < 0) return;
      if (this.revealed[cardIndex] || this.matched[cardIndex]) return;

      this.flipCard(cardIndex, true);

      if (this.firstCard === null) {
        this.firstCard = cardIndex;
      } else if (this.secondCard === null && cardIndex !== this.firstCard) {
        this.secondCard = cardIndex;
        this.locked = true;
        this.checkMatch();
      }
    });
  }

  // --- Preview flash: briefly show all cards face-up ---
  showPreview(onComplete) {
    // Show all card emojis immediately (no flip animation, just set text)
    for (let i = 0; i < this.cards.length; i++) {
      const emoji = this.EMOJIS[this.cards[i]];
      this.cardTexts[i].setText(emoji);
      this.revealed[i] = true;

      // Light background for revealed
      const col = i % this.COLS;
      const row = Math.floor(i / this.COLS);
      const x = this.boardX + col * (this.CARD_SIZE + this.CARD_GAP);
      const y = this.boardY + row * (this.CARD_SIZE + this.CARD_GAP);
      const bg = this.cardBgs[i];
      bg.clear();
      bg.fillStyle(0xe8e0f2, 1);
      bg.fillRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);
      bg.lineStyle(2, 0xc8b0e0, 1);
      bg.strokeRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);
    }

    // After 1.5 seconds, flip all back
    this.time.delayedCall(800, () => { // 0.8s preview (was 1.5s — too easy)
      for (let i = 0; i < this.cards.length; i++) {
        this.cardTexts[i].setText('❓');
        this.revealed[i] = false;

        const col = i % this.COLS;
        const row = Math.floor(i / this.COLS);
        const x = this.boardX + col * (this.CARD_SIZE + this.CARD_GAP);
        const y = this.boardY + row * (this.CARD_SIZE + this.CARD_GAP);
        const bg = this.cardBgs[i];
        bg.clear();
        bg.fillStyle(0xddd0e8, 1);
        bg.fillRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);
        bg.lineStyle(2, 0xc0a8d4, 1);
        bg.strokeRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);
      }

      if (onComplete) onComplete();
    });
  }

  buildDeck() {
    // Create pairs array and shuffle
    const deck = [];
    for (let i = 0; i < this.totalPairs; i++) {
      deck.push(i, i);
    }
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Phaser.Math.Between(0, i);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    this.cards = deck;
    this.revealed = new Array(deck.length).fill(false);
    this.matched = new Array(deck.length).fill(false);
  }

  renderCards() {
    this.cardBgs = [];
    this.cardTexts = [];

    for (let i = 0; i < this.cards.length; i++) {
      const col = i % this.COLS;
      const row = Math.floor(i / this.COLS);
      const x = this.boardX + col * (this.CARD_SIZE + this.CARD_GAP);
      const y = this.boardY + row * (this.CARD_SIZE + this.CARD_GAP);

      // Card background
      const bg = this.add.graphics();
      bg.fillStyle(0xddd0e8, 1);
      bg.fillRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);
      bg.lineStyle(2, 0xc0a8d4, 1);
      bg.strokeRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);
      this.cardBgs.push(bg);

      // Card text (hidden initially)
      const cx = x + this.CARD_SIZE / 2;
      const cy = y + this.CARD_SIZE / 2;
      const fontSize = this.CARD_SIZE >= 80 ? '36px' : '30px';
      const t = this.add.text(cx, cy, '❓', {
        fontSize, fontFamily: 'Arial'
      }).setOrigin(0.5);
      this.cardTexts.push(t);
    }
  }

  getCardAt(px, py) {
    for (let i = 0; i < this.cards.length; i++) {
      const col = i % this.COLS;
      const row = Math.floor(i / this.COLS);
      const x = this.boardX + col * (this.CARD_SIZE + this.CARD_GAP);
      const y = this.boardY + row * (this.CARD_SIZE + this.CARD_GAP);

      if (px >= x && px <= x + this.CARD_SIZE && py >= y && py <= y + this.CARD_SIZE) {
        return i;
      }
    }
    return -1;
  }

  flipCard(index, show) {
    const text = this.cardTexts[index];
    const col = index % this.COLS;
    const row = Math.floor(index / this.COLS);
    const x = this.boardX + col * (this.CARD_SIZE + this.CARD_GAP);
    const y = this.boardY + row * (this.CARD_SIZE + this.CARD_GAP);

    if (show) {
      this.revealed[index] = true;
      const emoji = this.EMOJIS[this.cards[index]];

      // Flip animation: scale X to 0, change text, scale back
      this.tweens.add({
        targets: text,
        scaleX: 0,
        duration: 100,
        onComplete: () => {
          text.setText(emoji);
          // Recolor background
          const bg = this.cardBgs[index];
          bg.clear();
          bg.fillStyle(0xe8e0f2, 1);
          bg.fillRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);
          bg.lineStyle(2, 0xc8b0e0, 1);
          bg.strokeRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);

          this.tweens.add({
            targets: text,
            scaleX: 1,
            duration: 100,
          });
        }
      });
    } else {
      this.revealed[index] = false;
      this.tweens.add({
        targets: text,
        scaleX: 0,
        duration: 100,
        onComplete: () => {
          text.setText('❓');
          const bg = this.cardBgs[index];
          bg.clear();
          bg.fillStyle(0xddd0e8, 1);
          bg.fillRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);
          bg.lineStyle(2, 0xc0a8d4, 1);
          bg.strokeRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);

          this.tweens.add({
            targets: text,
            scaleX: 1,
            duration: 100,
          });
        }
      });
    }
  }

  checkMatch() {
    const i1 = this.firstCard;
    const i2 = this.secondCard;

    if (this.cards[i1] === this.cards[i2]) {
      // Match found
      this.matched[i1] = true;
      this.matched[i2] = true;
      this.matchesFound++;

      // Streak bonus
      this.streak++;
      this.score += 20 + this.streak * 5;
      this.wrongStreak = 0;

      this.matchText.setText(`Paare: ${this.matchesFound} / ${this.totalPairs}`);
      this.scoreText.setText(`Punkte: ${this.score}`);

      // Show streak text if streak > 1
      if (this.streak > 1) {
        this.showStreakText();
      }

      // Animate matched cards
      this.time.delayedCall(300, () => {
        [i1, i2].forEach(idx => {
          this.tweens.add({
            targets: this.cardTexts[idx],
            scale: 1.2,
            duration: 150,
            yoyo: true,
          });
          // Green tint on background
          const col = idx % this.COLS;
          const row = Math.floor(idx / this.COLS);
          const x = this.boardX + col * (this.CARD_SIZE + this.CARD_GAP);
          const y = this.boardY + row * (this.CARD_SIZE + this.CARD_GAP);
          const bg = this.cardBgs[idx];
          bg.clear();
          bg.fillStyle(0xd4f0d8, 1);
          bg.fillRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);
          bg.lineStyle(2, 0x88cc88, 1);
          bg.strokeRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);
        });

        this.firstCard = null;
        this.secondCard = null;
        this.locked = false;

        if (this.matchesFound >= this.totalPairs) {
          this.endGame(true);
        }
      });
    } else {
      // No match
      this.streak = 0;
      this.wrongStreak++;

      // No match - flip back after delay
      this.time.delayedCall(500, () => {
        this.flipCard(i1, false);
        this.flipCard(i2, false);

        this.time.delayedCall(250, () => {
          this.firstCard = null;
          this.secondCard = null;
          this.locked = false;

          // Hint system: after 3 consecutive wrong guesses, flash a hint
          if (this.wrongStreak >= 3) {
            this.showHint();
            this.wrongStreak = 0;
          }
        });
      });
    }
  }

  // --- Streak bonus display ---
  showStreakText() {
    this.streakText.setText(`🔥 ${this.streak}er Serie!`);
    this.streakText.setAlpha(1);

    // Fade out after a moment
    this.tweens.add({
      targets: this.streakText,
      alpha: 0,
      delay: 800,
      duration: 400,
    });
  }

  // --- Hint system: flash one unmatched pair briefly ---
  showHint() {
    // Find the first unmatched pair
    const unmatchedValues = [];
    for (let i = 0; i < this.cards.length; i++) {
      if (!this.matched[i]) {
        const val = this.cards[i];
        if (!unmatchedValues.includes(val)) {
          unmatchedValues.push(val);
        }
      }
    }
    if (unmatchedValues.length === 0) return;

    // Pick a random unmatched value
    const hintVal = unmatchedValues[Phaser.Math.Between(0, unmatchedValues.length - 1)];

    // Find the two card indices for this value
    const hintIndices = [];
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i] === hintVal && !this.matched[i]) {
        hintIndices.push(i);
      }
    }
    if (hintIndices.length < 2) return;

    // Lock input during hint
    this.locked = true;

    // Briefly show the pair
    const emoji = this.EMOJIS[hintVal];
    hintIndices.forEach(idx => {
      this.cardTexts[idx].setText(emoji);
      // Highlight background in hint color (soft yellow)
      const col = idx % this.COLS;
      const row = Math.floor(idx / this.COLS);
      const x = this.boardX + col * (this.CARD_SIZE + this.CARD_GAP);
      const y = this.boardY + row * (this.CARD_SIZE + this.CARD_GAP);
      const bg = this.cardBgs[idx];
      bg.clear();
      bg.fillStyle(0xfff0c0, 1);
      bg.fillRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);
      bg.lineStyle(2, 0xe8c850, 1);
      bg.strokeRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);
    });

    // Hide after 0.3 seconds
    this.time.delayedCall(300, () => {
      hintIndices.forEach(idx => {
        this.cardTexts[idx].setText('❓');
        const col = idx % this.COLS;
        const row = Math.floor(idx / this.COLS);
        const x = this.boardX + col * (this.CARD_SIZE + this.CARD_GAP);
        const y = this.boardY + row * (this.CARD_SIZE + this.CARD_GAP);
        const bg = this.cardBgs[idx];
        bg.clear();
        bg.fillStyle(0xddd0e8, 1);
        bg.fillRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);
        bg.lineStyle(2, 0xc0a8d4, 1);
        bg.strokeRoundedRect(x, y, this.CARD_SIZE, this.CARD_SIZE, 10);
      });
      this.locked = false;
    });
  }

  tickTimer() {
    if (this.gameOver) return;
    this.timer--;
    this.timerText.setText(`⏱ ${this.timer}s`);

    if (this.timer <= 10) {
      this.timerText.setColor('#dd4444');
    }

    if (this.timer <= 0) {
      this.endGame(this.matchesFound >= this.totalPairs);
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
      ? `✅ Alle Paare gefunden!\nPunkte: ${this.score}`
      : `❌ Zeit abgelaufen!\nPaare: ${this.matchesFound} / ${this.totalPairs}`;

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
