import Phaser from 'phaser';

const SPOT_TYPES = [
  { emoji: '💩', color: 0x8B4513, radius: 18, swipes: 1, label: 'Dreck' },
  { emoji: '🪵', color: 0x6B4226, radius: 22, swipes: 2, label: 'Klette' },
  { emoji: '🧶', color: 0x886644, radius: 15, swipes: 1, label: 'Knoten' },
  { emoji: '🍂', color: 0xaa7733, radius: 20, swipes: 1, label: 'Blätter' },
];

export class SwipePuzzle extends Phaser.Scene {
  constructor() {
    super({ key: 'SwipePuzzle' });
  }

  init(data) {
    this.petName = data.petName || 'Buddy';
    this.petEmoji = data.petEmoji || '🐕';
    this.onComplete = data.onComplete || 'Salon';

    // Dynamic difficulty
    const diff = data.difficulty || 1;
    this.totalSpots = 6 + diff * 2; // 8, 10, 12
    this.timeLeft = 25 - diff * 3;  // 22, 19, 16

    this.cleanedCount = 0;
    this.isComplete = false;

    // Power-wipe state
    this.powerWipeAvailable = true;
    this.powerWipeCharging = false;
    this.powerWipeChargeStart = 0;
    this.powerWipeThreshold = 800; // ms to hold

    // Combo state
    this.lastCleanTime = 0;
    this.comboCount = 0;
    this.comboWindow = 1500; // ms

    // Progressive spawning
    this.spawnedCount = 0;
    this.initialSpots = 3;
    this.spawnBatchSize = 2;
    this.spawnInterval = 4000; // ms
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor('#f8f2fc');

    // Background image
    const bgKey = 'bg_puzzle_bathroom';
    if (this.textures.exists(bgKey)) {
      const bg = this.add.image(width / 2, height / 2, bgKey);
      bg.setDisplaySize(width, height);
      bg.setAlpha(0.18);
      bg.setDepth(-1);
    }

    // Title
    this.add.text(width / 2, 40, `${this.petName} pflegen`, {
      fontSize: '30px',
      fontFamily: 'Arial',
      color: '#8a60aa',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Pet emoji in center
    this.add.text(width / 2, height * 0.4, this.petEmoji, {
      fontSize: '180px'
    }).setOrigin(0.5);

    // Pet area bounds for dirt spots
    this.petArea = {
      x: width / 2 - 120,
      y: height * 0.4 - 130,
      w: 240,
      h: 260
    };

    // Initialize dirt spots array
    this.dirtSpots = [];

    // Pre-generate all spot configs (types, positions) but spawn progressively
    this.spotConfigs = [];
    for (let i = 0; i < this.totalSpots; i++) {
      const type = Phaser.Math.RND.pick(
        // Weight: most spots are 1-swipe types, Klette is rarer
        i % 4 === 1 ? [SPOT_TYPES[1]] : [SPOT_TYPES[0], SPOT_TYPES[2], SPOT_TYPES[3]]
      );
      const sx = Phaser.Math.Between(this.petArea.x, this.petArea.x + this.petArea.w);
      const sy = Phaser.Math.Between(this.petArea.y, this.petArea.y + this.petArea.h);
      const opacity = Phaser.Math.FloatBetween(0.6, 0.9);
      this.spotConfigs.push({ type, x: sx, y: sy, opacity });
    }

    // Spawn initial batch
    this.spawnBatch(this.initialSpots);

    // Schedule progressive spawns
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnInterval,
      callback: () => {
        if (this.isComplete) return;
        const remaining = this.totalSpots - this.spawnedCount;
        if (remaining > 0) {
          const count = Math.min(this.spawnBatchSize, remaining);
          this.spawnBatch(count);
        }
      },
      callbackScope: this,
      loop: true
    });

    // Progress bar background
    const barY = height - 120;
    this.add.rectangle(width / 2, barY, 400, 28, 0xe0d0e8).setOrigin(0.5);
    this.progressFill = this.add.rectangle(width / 2 - 198, barY, 0, 24, 0xcc66cc).setOrigin(0, 0.5);

    // Progress text
    this.progressText = this.add.text(width / 2, barY - 24, `0/${this.totalSpots} sauber`, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#8a60aa'
    }).setOrigin(0.5);

    // Timer text
    this.timerText = this.add.text(width / 2, 80, `⏱ ${this.timeLeft}s`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#e89030'
    }).setOrigin(0.5);

    // Power-wipe indicator
    this.powerWipeText = this.add.text(width - 20, 80, '💫 Power-Wipe: 1x', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#8a60aa'
    }).setOrigin(1, 0.5);

    // Power-wipe charge circle (hidden by default)
    this.powerWipeCircle = this.add.circle(0, 0, 0, 0xffdd00, 0.25);
    this.powerWipeCircle.setVisible(false);
    this.powerWipeCircle.setDepth(10);

    // Timer event
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.tickTimer,
      callbackScope: this,
      loop: true
    });

    // Track pointer position for power-wipe
    this.pointerX = 0;
    this.pointerY = 0;

    // Global pointer move for swiping
    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown || this.isComplete) return;
      this.pointerX = pointer.x;
      this.pointerY = pointer.y;

      // If charging power-wipe, update circle position
      if (this.powerWipeCharging) {
        this.powerWipeCircle.setPosition(pointer.x, pointer.y);
      }

      this.checkSwipe(pointer.x, pointer.y);
    });

    this.input.on('pointerdown', (pointer) => {
      if (this.isComplete) return;
      this.pointerX = pointer.x;
      this.pointerY = pointer.y;

      // Start power-wipe charge
      if (this.powerWipeAvailable) {
        this.powerWipeCharging = true;
        this.powerWipeChargeStart = this.time.now;
        this.powerWipeCircle.setPosition(pointer.x, pointer.y);
        this.powerWipeCircle.setRadius(0);
        this.powerWipeCircle.setVisible(true);
      }

      this.checkSwipe(pointer.x, pointer.y);
    });

    this.input.on('pointerup', (pointer) => {
      if (this.isComplete) return;

      if (this.powerWipeCharging) {
        const elapsed = this.time.now - this.powerWipeChargeStart;
        this.powerWipeCharging = false;
        this.powerWipeCircle.setVisible(false);

        if (elapsed >= this.powerWipeThreshold && this.powerWipeAvailable) {
          this.triggerPowerWipe(pointer.x, pointer.y);
        }
      }
    });
  }

  update() {
    // Update power-wipe charge circle
    if (this.powerWipeCharging && this.powerWipeAvailable) {
      const elapsed = this.time.now - this.powerWipeChargeStart;
      const progress = Math.min(elapsed / this.powerWipeThreshold, 1);
      const radius = progress * 80;
      this.powerWipeCircle.setRadius(radius);

      // Change color as it charges
      if (progress >= 1) {
        this.powerWipeCircle.setFillStyle(0xffdd00, 0.35);
      } else {
        this.powerWipeCircle.setFillStyle(0xffdd00, 0.15 + progress * 0.15);
      }
    }
  }

  spawnBatch(count) {
    for (let i = 0; i < count && this.spawnedCount < this.totalSpots; i++) {
      const config = this.spotConfigs[this.spawnedCount];
      this.spawnSpot(config);
      this.spawnedCount++;
    }
  }

  spawnSpot(config) {
    const { type, x, y, opacity } = config;

    // Create container for spot elements
    const circle = this.add.circle(x, y, type.radius, type.color, opacity);
    circle.cleaned = false;
    circle.spotType = type;
    circle.swipesLeft = type.swipes;

    // Add emoji label on the spot
    const emojiLabel = this.add.text(x, y - 2, type.emoji, {
      fontSize: '12px'
    }).setOrigin(0.5).setDepth(5);
    circle.emojiLabel = emojiLabel;

    // Pop-in animation (start small, bounce to full size)
    circle.setScale(0);
    emojiLabel.setScale(0);

    this.tweens.add({
      targets: [circle, emojiLabel],
      scale: 1,
      duration: 350,
      ease: 'Back.easeOut'
    });

    this.dirtSpots.push(circle);
  }

  checkSwipe(px, py) {
    for (const spot of this.dirtSpots) {
      if (spot.cleaned) continue;
      const hitRadius = spot.spotType.radius + 12;
      const dist = Phaser.Math.Distance.Between(px, py, spot.x, spot.y);
      if (dist < hitRadius) {
        this.handleSpotSwipe(spot);
      }
    }
  }

  handleSpotSwipe(spot) {
    spot.swipesLeft--;

    if (spot.swipesLeft <= 0) {
      // Fully cleaned
      this.cleanSpot(spot);
    } else {
      // Partially cleaned (Klette: shrink halfway)
      this.tweens.add({
        targets: spot,
        scale: 0.55,
        alpha: spot.alpha * 0.6,
        duration: 200,
        ease: 'Power2'
      });
      if (spot.emojiLabel) {
        this.tweens.add({
          targets: spot.emojiLabel,
          scale: 0.55,
          alpha: 0.6,
          duration: 200,
          ease: 'Power2'
        });
      }
      // Small sparkle to show progress
      this.spawnSparkles(spot.x, spot.y, 3);
    }
  }

  cleanSpot(spot) {
    spot.cleaned = true;
    this.cleanedCount++;

    // Combo tracking
    const now = this.time.now;
    if (now - this.lastCleanTime < this.comboWindow) {
      this.comboCount++;
      if (this.comboCount >= 2) {
        this.showComboText(spot.x, spot.y, this.comboCount);
      }
    } else {
      this.comboCount = 1;
    }
    this.lastCleanTime = now;

    // Sparkle burst
    this.spawnSparkles(spot.x, spot.y, 6);

    // Fade out the dirt spot
    this.tweens.add({
      targets: spot,
      alpha: 0,
      scale: 0.2,
      duration: 200,
      ease: 'Power2'
    });

    // Fade out emoji label
    if (spot.emojiLabel) {
      this.tweens.add({
        targets: spot.emojiLabel,
        alpha: 0,
        scale: 0.2,
        duration: 200,
        ease: 'Power2',
        onComplete: () => spot.emojiLabel.destroy()
      });
    }

    // Update progress
    const { width } = this.scale;
    const fillWidth = (this.cleanedCount / this.totalSpots) * 396;
    this.tweens.add({
      targets: this.progressFill,
      width: fillWidth,
      duration: 200
    });
    this.progressText.setText(`${this.cleanedCount}/${this.totalSpots} sauber`);

    // Check win
    if (this.cleanedCount >= this.totalSpots) {
      this.puzzleComplete(true);
    }
  }

  showComboText(x, y, count) {
    const sparkles = '✨'.repeat(Math.min(count - 1, 4));
    const comboLabel = this.add.text(x, y - 30, `${count}x! ${sparkles}`, {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: comboLabel,
      y: y - 80,
      alpha: 0,
      scale: 1.4,
      duration: 800,
      ease: 'Power2',
      onComplete: () => comboLabel.destroy()
    });
  }

  triggerPowerWipe(px, py) {
    this.powerWipeAvailable = false;
    this.powerWipeText.setText('💫 Power-Wipe: 0x');
    this.powerWipeText.setColor('#bbbbbb');

    const radius = 80;

    // Big burst visual
    const burstCircle = this.add.circle(px, py, 0, 0xffdd00, 0.4).setDepth(15);
    this.tweens.add({
      targets: burstCircle,
      radius: radius,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => burstCircle.destroy()
    });

    // Big sparkle burst
    this.spawnSparkles(px, py, 14);

    // Clear all spots within radius
    for (const spot of this.dirtSpots) {
      if (spot.cleaned) continue;
      const dist = Phaser.Math.Distance.Between(px, py, spot.x, spot.y);
      if (dist < radius) {
        this.cleanSpot(spot);
      }
    }

    // Flash effect on label
    const flashLabel = this.add.text(px, py - 40, '💫 POWER WIPE!', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffdd00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: flashLabel,
      y: py - 100,
      alpha: 0,
      scale: 1.5,
      duration: 900,
      ease: 'Power2',
      onComplete: () => flashLabel.destroy()
    });
  }

  spawnSparkles(x, y, count) {
    count = count || 6;
    for (let i = 0; i < count; i++) {
      const sparkle = this.add.text(x, y, '✨', { fontSize: '20px' }).setOrigin(0.5);
      const angle = (i / count) * Math.PI * 2;
      const dist = Phaser.Math.Between(30, 60);
      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.3,
        duration: 500,
        ease: 'Power2',
        onComplete: () => sparkle.destroy()
      });
    }
  }

  tickTimer() {
    if (this.isComplete) return;
    this.timeLeft--;
    this.timerText.setText(`⏱ ${this.timeLeft}s`);

    if (this.timeLeft <= 5) {
      this.timerText.setColor('#dd4444');
    }

    if (this.timeLeft <= 0) {
      this.timerEvent.remove();
      this.puzzleComplete(false);
    }
  }

  puzzleComplete(success) {
    if (this.isComplete) return;
    this.isComplete = true;
    this.timerEvent.remove();
    if (this.spawnTimer) this.spawnTimer.remove();

    const { width, height } = this.scale;

    if (success) {
      // Celebration effect
      const msg = this.add.text(width / 2, height * 0.25, 'Sauber! ✨', {
        fontSize: '48px',
        fontFamily: 'Arial',
        color: '#ffdd00',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0).setScale(0.5);

      this.tweens.add({
        targets: msg,
        alpha: 1,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut'
      });

      // Extra sparkles across screen
      for (let i = 0; i < 12; i++) {
        const sx = Phaser.Math.Between(60, width - 60);
        const sy = Phaser.Math.Between(100, height - 200);
        this.time.delayedCall(i * 80, () => this.spawnSparkles(sx, sy, 6));
      }
    } else {
      const msg = this.add.text(width / 2, height * 0.25, 'Zeit um! ⏰', {
        fontSize: '40px',
        fontFamily: 'Arial',
        color: '#dd4444',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: msg,
        alpha: 1,
        duration: 400
      });
    }

    // Transition
    this.time.delayedCall(1800, () => {
      this.registry.set('puzzleResult', { success });
      this.scene.start(this.onComplete);
    });
  }
}
