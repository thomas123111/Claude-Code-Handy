import Phaser from 'phaser';

// Sort puzzle: match the right food/item to the right pet
export class SortPuzzle extends Phaser.Scene {
  constructor() { super('SortPuzzle'); }

  init(data) {
    this.petName = data.petName || 'Tier';
    this.onComplete = data.onComplete || 'Shelter';
    this.need = data.need || 'hunger';
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor('#1e1a14');

    this.add.text(cx, 30, `🍽️ Fütterung: ${this.petName}`, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 60, 'Ziehe das richtige Futter zum Tier!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#998877',
    }).setOrigin(0.5);

    // Timer
    this.timeLeft = 25;
    this.timerText = this.add.text(width - 15, 30, `${this.timeLeft}s`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#ff8844', fontStyle: 'bold',
    }).setOrigin(1, 0);

    // Score
    this.score = 0;
    this.rounds = 0;
    this.maxRounds = 5;
    this.scoreText = this.add.text(15, 30, `${this.score}/${this.maxRounds}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#88ff88',
    });

    // Pets at the top - 3 pets that need different food
    this.petTypes = [
      { emoji: '🐕', needs: '🍖', label: 'Fleisch', x: cx - 140 },
      { emoji: '🐱', needs: '🐟', label: 'Fisch', x: cx },
      { emoji: '🐰', needs: '🥕', label: 'Möhre', x: cx + 140 },
    ];

    // Drop zones for pets
    this.dropZones = [];
    this.petTypes.forEach((pet) => {
      this.add.circle(pet.x, 160, 50, 0x332820, 0.6).setStrokeStyle(2, 0x554433);
      this.add.text(pet.x, 140, pet.emoji, { fontSize: '40px' }).setOrigin(0.5);
      this.add.text(pet.x, 190, pet.label, {
        fontSize: '10px', fontFamily: 'monospace', color: '#aa9977',
      }).setOrigin(0.5);
      this.dropZones.push({ x: pet.x, y: 160, needs: pet.needs, radius: 55 });
    });

    // Food items to drag - spawn a round
    this.foodItems = [];
    this.currentRound = null;
    this.spawnRound();

    // Drag state
    this.dragTarget = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    this.input.on('pointerdown', (pointer) => {
      // Find food item under pointer
      for (let i = this.foodItems.length - 1; i >= 0; i--) {
        const f = this.foodItems[i];
        if (!f.active) continue;
        const d = Phaser.Math.Distance.Between(pointer.x, pointer.y, f.sprite.x, f.sprite.y);
        if (d < 40) {
          this.dragTarget = f;
          f.sprite.setScale(1.3);
          return;
        }
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (this.dragTarget) {
        this.dragTarget.sprite.setPosition(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.dragTarget) return;
      const f = this.dragTarget;
      f.sprite.setScale(1);
      this.dragTarget = null;

      // Check drop zones
      for (const zone of this.dropZones) {
        const d = Phaser.Math.Distance.Between(f.sprite.x, f.sprite.y, zone.x, zone.y);
        if (d < zone.radius) {
          if (f.foodEmoji === zone.needs) {
            // Correct match!
            this.correctMatch(f, zone);
          } else {
            // Wrong match
            this.wrongMatch(f);
          }
          return;
        }
      }
      // Snap back to original position
      this.tweens.add({
        targets: f.sprite, x: f.origX, y: f.origY, duration: 200,
      });
    });

    // Timer countdown
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: this.timeLeft - 1,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}s`);
        if (this.timeLeft <= 5) this.timerText.setColor('#ff4444');
        if (this.timeLeft <= 0) this.finishPuzzle(false);
      },
    });
  }

  spawnRound() {
    // Clear old food items
    this.foodItems.forEach((f) => { if (f.sprite) f.sprite.destroy(); });
    this.foodItems = [];

    const { width } = this.scale;
    const foods = ['🍖', '🐟', '🥕', '🧀', '🍎'];

    // Spawn 4-5 food items at bottom, shuffle
    const shuffled = Phaser.Utils.Array.Shuffle([...foods]).slice(0, 4);
    // Ensure at least one correct answer from each pet type
    const correct = this.petTypes[this.rounds % this.petTypes.length].needs;
    if (!shuffled.includes(correct)) shuffled[0] = correct;
    Phaser.Utils.Array.Shuffle(shuffled);

    shuffled.forEach((food, i) => {
      const x = 80 + i * 110;
      const y = 400 + Math.random() * 200;
      const sprite = this.add.text(x, y, food, { fontSize: '36px' }).setOrigin(0.5).setDepth(10);

      // Pop-in animation
      sprite.setScale(0);
      this.tweens.add({ targets: sprite, scale: 1, duration: 300, delay: i * 80, ease: 'Back.Out' });

      this.foodItems.push({ sprite, foodEmoji: food, origX: x, origY: y, active: true });
    });
  }

  correctMatch(food, zone) {
    const { x, y } = zone;
    food.active = false;

    // Success animation
    this.tweens.add({
      targets: food.sprite, x, y, scale: 0.3, alpha: 0, duration: 300,
      onComplete: () => food.sprite.destroy(),
    });

    // Sparkles
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const star = this.add.text(x + Math.cos(angle) * 10, y + Math.sin(angle) * 10, '⭐', {
        fontSize: '16px',
      }).setDepth(20);
      this.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * 40, y: y + Math.sin(angle) * 40,
        alpha: 0, scale: 0.5, duration: 500,
        onComplete: () => star.destroy(),
      });
    }

    // Green flash on zone
    const flash = this.add.circle(x, y, 50, 0x44ff44, 0.3).setDepth(15);
    this.tweens.add({ targets: flash, alpha: 0, scale: 1.5, duration: 300, onComplete: () => flash.destroy() });

    this.score++;
    this.rounds++;
    this.scoreText.setText(`${this.score}/${this.maxRounds}`);

    if (this.score >= this.maxRounds) {
      this.time.delayedCall(500, () => this.finishPuzzle(true));
    } else {
      this.time.delayedCall(400, () => this.spawnRound());
    }
  }

  wrongMatch(food) {
    // Shake + red flash
    const orig = { x: food.sprite.x, y: food.sprite.y };
    this.tweens.add({
      targets: food.sprite,
      x: { from: orig.x - 10, to: orig.x + 10 },
      duration: 50, repeat: 3, yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: food.sprite, x: food.origX, y: food.origY, duration: 300,
        });
      },
    });

    const flash = this.add.circle(food.sprite.x, food.sprite.y, 30, 0xff4444, 0.3).setDepth(15);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

    // Show hint briefly
    const hint = this.add.text(food.sprite.x, food.sprite.y - 30, '❌', { fontSize: '20px' })
      .setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: hint, alpha: 0, y: hint.y - 20, duration: 600, onComplete: () => hint.destroy() });
  }

  finishPuzzle(success) {
    if (this.timerEvent) this.timerEvent.remove();
    const { width, height } = this.scale;

    // Result overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setDepth(50);
    const resultEmoji = success ? '🎉' : '😢';
    const resultText = success ? 'Geschafft!' : 'Nicht geschafft...';
    const resultColor = success ? '#44ff88' : '#ff6644';

    this.add.text(width / 2, height / 2 - 40, resultEmoji, { fontSize: '48px' }).setOrigin(0.5).setDepth(51);
    this.add.text(width / 2, height / 2 + 20, resultText, {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: resultColor, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51);
    this.add.text(width / 2, height / 2 + 55, `${this.score}/${this.maxRounds} richtig`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(51);

    this.registry.set('puzzleResult', { success, score: this.score });

    this.time.delayedCall(2000, () => {
      this.scene.start(this.onComplete);
    });
  }
}
