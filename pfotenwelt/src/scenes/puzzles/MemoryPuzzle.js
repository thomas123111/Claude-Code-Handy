export class MemoryPuzzle extends Phaser.Scene {
  constructor() {
    super('MemoryPuzzle');
  }

  init(data) {
    this.petName = data.petName || 'Unbekannt';
    this.onCompleteScene = data.onComplete || 'Shelter';
    this.need = data.need || 'hygiene';

    this.COLS = 4;
    this.ROWS = 3;
    this.CARD_SIZE = 80;
    this.CARD_GAP = 10;
    this.EMOJIS = ['🍖', '🧼', '🎾', '💊', '🛁', '🧸'];
    this.TIME_LIMIT = 45;

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
    this.totalPairs = 6;
    this.timer = this.TIME_LIMIT;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#f8f2fc');

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

    // Give up button
    const giveUpBtn = this.add.text(width / 2, 155, '❌ Aufgeben', {
      fontSize: '18px', color: '#cc4444', fontFamily: 'Arial',
      backgroundColor: '#f5e0e0', padding: { x: 12, y: 4 }
    }).setOrigin(0.5, 0);

    // Build card deck (pairs)
    this.buildDeck();
    this.renderCards();

    // Timer
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
      const t = this.add.text(cx, cy, '❓', {
        fontSize: '36px', fontFamily: 'Arial'
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
      this.score += 20;

      this.matchText.setText(`Paare: ${this.matchesFound} / ${this.totalPairs}`);
      this.scoreText.setText(`Punkte: ${this.score}`);

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
      // No match - flip back after delay
      this.time.delayedCall(500, () => {
        this.flipCard(i1, false);
        this.flipCard(i2, false);

        this.time.delayedCall(250, () => {
          this.firstCard = null;
          this.secondCard = null;
          this.locked = false;
        });
      });
    }
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
