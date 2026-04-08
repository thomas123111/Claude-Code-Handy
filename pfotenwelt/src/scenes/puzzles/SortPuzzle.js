import Phaser from 'phaser';

// Theme-based animal/food combinations
const SORT_THEMES = [
  // Theme 1: Classic
  { pets: [
    { emoji: '🐕', needs: '🍖', label: 'Fleisch' },
    { emoji: '🐱', needs: '🐟', label: 'Fisch' },
    { emoji: '🐰', needs: '🥕', label: 'Möhre' },
  ], foods: ['🍖', '🐟', '🥕', '🧀', '🍎'] },
  // Theme 2: Exotic
  { pets: [
    { emoji: '🐢', needs: '🥬', label: 'Salat' },
    { emoji: '🐹', needs: '🌻', label: 'Kerne' },
    { emoji: '🐦', needs: '🫐', label: 'Beeren' },
  ], foods: ['🥬', '🌻', '🫐', '🥜', '🍇'] },
  // Theme 3: Farm
  { pets: [
    { emoji: '🐄', needs: '🌾', label: 'Heu' },
    { emoji: '🐷', needs: '🥔', label: 'Rüben' },
    { emoji: '🐔', needs: '🌽', label: 'Mais' },
  ], foods: ['🌾', '🥔', '🌽', '🥒', '🍠'] },
];

const DISTRACTORS = ['🪨', '🧱', '📦', '🔧'];

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

    this.cameras.main.setBackgroundColor('#f8f2fc');

    this.add.text(cx, 30, `🍽️ Fütterung: ${this.petName}`, {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#4a3560', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 60, 'Ziehe das richtige Futter zum Tier!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#7a6a8a',
    }).setOrigin(0.5);

    // Pick a random theme
    this.theme = Phaser.Utils.Array.GetRandom(SORT_THEMES);

    // Timer
    this.maxTime = 25;
    this.timeLeft = this.maxTime;
    this.timerText = this.add.text(width - 15, 30, `${this.timeLeft}s`, {
      fontSize: '18px', fontFamily: 'monospace', color: '#e89030', fontStyle: 'bold',
    }).setOrigin(1, 0);

    // Score
    this.score = 0;
    this.rounds = 0;
    this.maxRounds = 5;
    this.mistakes = 0;
    this.roundMistakes = 0;
    this.perfectStreak = 0;
    this.startTime = this.time.now;

    this.scoreText = this.add.text(15, 30, `${this.score}/${this.maxRounds}`, {
      fontSize: '18px', fontFamily: 'monospace', color: '#33aa55',
    });

    // Streak display
    this.streakText = this.add.text(15, 55, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#e8a030',
    });

    // Round display
    this.roundText = this.add.text(cx, 80, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#9a8aaa',
    }).setOrigin(0.5);

    // Pets at the top from chosen theme
    this.petTypes = this.theme.pets.map((pet, i) => ({
      ...pet,
      x: cx - 140 + i * 140,
    }));

    // Drop zones for pets
    this.dropZones = [];
    this.petTypes.forEach((pet) => {
      this.add.circle(pet.x, 160, 50, 0xf0e8f0, 0.6).setStrokeStyle(2, 0xd0c0d8);
      this.add.text(pet.x, 140, pet.emoji, { fontSize: '40px' }).setOrigin(0.5);
      this.add.text(pet.x, 190, pet.label, {
        fontSize: '12px', fontFamily: 'monospace', color: '#7a6a8a',
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
          if (f.isDistractor) {
            // Distractor dragged to a pet: shake + time penalty
            this.distractorPenalty(f);
          } else if (f.foodEmoji === zone.needs) {
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
      repeat: -1,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}s`);
        if (this.timeLeft <= 5) this.timerText.setColor('#dd4444');
        if (this.timeLeft <= 0) this.finishPuzzle(false);
      },
    });
  }

  // Get difficulty settings based on current round
  getRoundConfig() {
    const r = this.rounds;
    if (r < 2) {
      return { foodCount: 3, dropSpeed: 300, distractors: false, isBonus: false };
    } else if (r < 4) {
      return { foodCount: 4, dropSpeed: 250, distractors: true, isBonus: false };
    } else {
      return { foodCount: 5, dropSpeed: 180, distractors: true, isBonus: true };
    }
  }

  spawnRound() {
    // Clear old food items
    this.foodItems.forEach((f) => { if (f.sprite) f.sprite.destroy(); });
    this.foodItems = [];
    this.roundMistakes = 0;

    const { width, height } = this.scale;
    const config = this.getRoundConfig();

    // Update round display
    const roundLabel = config.isBonus ? 'Bonus Runde!' : `Runde ${this.rounds + 1}/${this.maxRounds}`;
    this.roundText.setText(roundLabel);

    // Show bonus round announcement
    if (config.isBonus) {
      this.showBonusAnnouncement();
    }

    // Show speed-up flash between rounds
    if (this.rounds > 0) {
      this.showSpeedUpEffect();
    }

    const foods = [...this.theme.foods];

    // Spawn food items, shuffle and slice to count
    let shuffled = Phaser.Utils.Array.Shuffle([...foods]).slice(0, config.foodCount);

    // Ensure at least one correct answer from the current pet target
    const correct = this.petTypes[this.rounds % this.petTypes.length].needs;
    if (!shuffled.includes(correct)) shuffled[0] = correct;
    Phaser.Utils.Array.Shuffle(shuffled);

    // Add a distractor from round 3 onwards
    let hasDistractor = false;
    if (config.distractors) {
      const distractor = Phaser.Utils.Array.GetRandom(DISTRACTORS);
      shuffled.push(distractor);
      Phaser.Utils.Array.Shuffle(shuffled);
      hasDistractor = true;
    }

    const totalItems = shuffled.length;
    // Spread items evenly across bottom area with slight random offset
    const startX = 60;
    const endX = width - 60;
    const spacing = totalItems > 1 ? (endX - startX) / (totalItems - 1) : 0;
    const baseY = 420;

    shuffled.forEach((food, i) => {
      const x = totalItems > 1 ? startX + i * spacing : width / 2;
      const yOffset = (Math.random() - 0.5) * 80; // slight random Y offset
      const y = baseY + yOffset;
      const sprite = this.add.text(x, y, food, { fontSize: '36px' }).setOrigin(0.5).setDepth(10);

      const isDistractor = DISTRACTORS.includes(food);

      // Pop-in animation with speed based on round
      sprite.setScale(0);
      this.tweens.add({
        targets: sprite, scale: 1,
        duration: config.dropSpeed, delay: i * 80, ease: 'Back.Out',
      });

      this.foodItems.push({
        sprite, foodEmoji: food, origX: x, origY: y, active: true, isDistractor,
      });
    });
  }

  showBonusAnnouncement() {
    const { width, height } = this.scale;
    const cx = width / 2;

    const bonusText = this.add.text(cx, height / 2, '⭐ Bonus Runde! ⭐', {
      fontSize: '28px', fontFamily: 'Georgia, serif', color: '#e8a030', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    this.tweens.add({
      targets: bonusText,
      alpha: 1, scale: { from: 0.5, to: 1.2 },
      duration: 400, ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: bonusText,
          alpha: 0, y: bonusText.y - 40,
          duration: 600, delay: 400,
          onComplete: () => bonusText.destroy(),
        });
      },
    });
  }

  showSpeedUpEffect() {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Brief speed lines flash
    const lines = [];
    for (let i = 0; i < 6; i++) {
      const y = 250 + i * 30;
      const line = this.add.rectangle(cx, y, width * 0.6, 2, 0xd0b8e8, 0.5)
        .setDepth(90).setAlpha(0);
      lines.push(line);
    }

    this.tweens.add({
      targets: lines,
      alpha: { from: 0, to: 0.6 },
      scaleX: { from: 0.2, to: 1.5 },
      duration: 200,
      yoyo: true,
      onComplete: () => lines.forEach((l) => l.destroy()),
    });
  }

  showTimeBonusFloat(x, y) {
    const floatText = this.add.text(x, y - 20, '+2s', {
      fontSize: '18px', fontFamily: 'monospace', color: '#33cc55', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(25).setAlpha(0);

    this.tweens.add({
      targets: floatText,
      alpha: 1, y: y - 50,
      duration: 300, ease: 'Power2',
      onComplete: () => {
        this.tweens.add({
          targets: floatText,
          alpha: 0, y: y - 80,
          duration: 400, delay: 200,
          onComplete: () => floatText.destroy(),
        });
      },
    });
  }

  showPerfectRound() {
    const { width } = this.scale;
    const cx = width / 2;

    const perfectText = this.add.text(cx, 260, 'Perfekt! ⭐', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#e8a030', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(25).setAlpha(0);

    this.tweens.add({
      targets: perfectText,
      alpha: 1, scale: { from: 0.5, to: 1.1 },
      duration: 300, ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: perfectText,
          alpha: 0, y: 240,
          duration: 500, delay: 500,
          onComplete: () => perfectText.destroy(),
        });
      },
    });

    // Sparkle burst around the area
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const sparkle = this.add.text(
        cx + Math.cos(angle) * 15,
        260 + Math.sin(angle) * 15,
        '✨', { fontSize: '14px' },
      ).setOrigin(0.5).setDepth(25);

      this.tweens.add({
        targets: sparkle,
        x: cx + Math.cos(angle) * 60,
        y: 260 + Math.sin(angle) * 60,
        alpha: 0, scale: 0.3,
        duration: 500, delay: 100 + i * 40,
        onComplete: () => sparkle.destroy(),
      });
    }
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

    // Time bonus: add 2 seconds (up to max)
    this.timeLeft = Math.min(this.timeLeft + 2, this.maxTime);
    this.timerText.setText(`${this.timeLeft}s`);
    if (this.timeLeft > 5) this.timerText.setColor('#e89030');
    this.showTimeBonusFloat(x, y);

    this.score++;
    this.rounds++;
    this.scoreText.setText(`${this.score}/${this.maxRounds}`);

    // Check for perfect round
    if (this.roundMistakes === 0) {
      this.perfectStreak++;
      this.showPerfectRound();
      this.streakText.setText(this.perfectStreak > 1 ? `🔥 ${this.perfectStreak}x Streak` : '');
    } else {
      this.perfectStreak = 0;
      this.streakText.setText('');
    }

    if (this.score >= this.maxRounds) {
      this.time.delayedCall(500, () => this.finishPuzzle(true));
    } else {
      this.time.delayedCall(400, () => this.spawnRound());
    }
  }

  wrongMatch(food) {
    this.roundMistakes++;
    this.mistakes++;

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

  distractorPenalty(food) {
    this.roundMistakes++;
    this.mistakes++;

    // Time penalty: lose 1 second
    this.timeLeft = Math.max(this.timeLeft - 1, 0);
    this.timerText.setText(`${this.timeLeft}s`);
    if (this.timeLeft <= 5) this.timerText.setColor('#dd4444');

    // Show penalty float
    const penaltyText = this.add.text(food.sprite.x, food.sprite.y - 30, '-1s', {
      fontSize: '18px', fontFamily: 'monospace', color: '#dd4444', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: penaltyText,
      alpha: 0, y: penaltyText.y - 40,
      duration: 600,
      onComplete: () => penaltyText.destroy(),
    });

    // Shake harder than normal wrong match
    const orig = { x: food.sprite.x, y: food.sprite.y };
    this.tweens.add({
      targets: food.sprite,
      x: { from: orig.x - 15, to: orig.x + 15 },
      duration: 40, repeat: 5, yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: food.sprite, x: food.origX, y: food.origY, duration: 300,
        });
      },
    });

    // Red flash
    const flash = this.add.circle(food.sprite.x, food.sprite.y, 30, 0xff4444, 0.4).setDepth(15);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

    // Show distractor hint
    const hint = this.add.text(food.sprite.x, food.sprite.y - 50, '🚫 Kein Futter!', {
      fontSize: '12px', fontFamily: 'monospace', color: '#dd4444',
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({ targets: hint, alpha: 0, y: hint.y - 20, duration: 800, onComplete: () => hint.destroy() });

    if (this.timeLeft <= 0) this.finishPuzzle(false);
  }

  finishPuzzle(success) {
    if (this.timerEvent) this.timerEvent.remove();
    const { width, height } = this.scale;

    // Calculate speed bonus: seconds remaining contribute to score
    const elapsedMs = this.time.now - this.startTime;
    const elapsedSec = Math.floor(elapsedMs / 1000);
    const speedBonus = success ? Math.max(0, this.timeLeft) : 0;
    const perfectBonus = this.perfectStreak >= 3 ? 5 : (this.perfectStreak >= 2 ? 2 : 0);
    const finalScore = this.score + speedBonus + perfectBonus;

    // Result overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x2a1a3a, 0.75).setDepth(50);
    const resultEmoji = success ? '🎉' : '😢';
    const resultText = success ? 'Geschafft!' : 'Nicht geschafft...';
    const resultColor = success ? '#33aa55' : '#dd4444';

    this.add.text(width / 2, height / 2 - 60, resultEmoji, { fontSize: '48px' }).setOrigin(0.5).setDepth(51);
    this.add.text(width / 2, height / 2, resultText, {
      fontSize: '24px', fontFamily: 'Georgia, serif', color: resultColor, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51);
    this.add.text(width / 2, height / 2 + 35, `${this.score}/${this.maxRounds} richtig`, {
      fontSize: '18px', fontFamily: 'monospace', color: '#7a6a8a',
    }).setOrigin(0.5).setDepth(51);

    // Score breakdown
    const breakdownParts = [];
    if (speedBonus > 0) breakdownParts.push(`+${speedBonus} Zeitbonus`);
    if (perfectBonus > 0) breakdownParts.push(`+${perfectBonus} Perfektbonus`);
    if (breakdownParts.length > 0) {
      this.add.text(width / 2, height / 2 + 60, breakdownParts.join(' | '), {
        fontSize: '12px', fontFamily: 'monospace', color: '#b8a8c8',
      }).setOrigin(0.5).setDepth(51);
    }

    this.add.text(width / 2, height / 2 + 82, `Punkte: ${finalScore}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#e8a030', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51);

    // Show streak if achieved
    if (this.perfectStreak >= 2) {
      this.add.text(width / 2, height / 2 + 105, `🔥 ${this.perfectStreak}x Perfekt-Streak!`, {
        fontSize: '14px', fontFamily: 'monospace', color: '#e8a030',
      }).setOrigin(0.5).setDepth(51);
    }

    this.registry.set('puzzleResult', { success, score: finalScore });

    this.time.delayedCall(2000, () => {
      this.scene.start(this.onComplete);
    });
  }
}
