import Phaser from 'phaser';

export class SwipePuzzle extends Phaser.Scene {
  constructor() {
    super({ key: 'SwipePuzzle' });
  }

  init(data) {
    this.petName = data.petName || 'Buddy';
    this.petEmoji = data.petEmoji || '🐕';
    this.onComplete = data.onComplete || 'Salon';
    this.totalSpots = 8;
    this.cleanedCount = 0;
    this.timeLeft = 20;
    this.isComplete = false;
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor('#f8f2fc');

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
    const petArea = {
      x: width / 2 - 120,
      y: height * 0.4 - 130,
      w: 240,
      h: 260
    };

    // Create dirt spots
    this.dirtSpots = [];
    for (let i = 0; i < this.totalSpots; i++) {
      const sx = Phaser.Math.Between(petArea.x, petArea.x + petArea.w);
      const sy = Phaser.Math.Between(petArea.y, petArea.y + petArea.h);

      const spot = this.add.circle(sx, sy, 18, 0x8B4513, 0.85);
      spot.cleaned = false;
      this.dirtSpots.push(spot);
    }

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

    // Timer event
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.tickTimer,
      callbackScope: this,
      loop: true
    });

    // Global pointer move for swiping
    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown || this.isComplete) return;
      this.checkSwipe(pointer.x, pointer.y);
    });

    this.input.on('pointerdown', (pointer) => {
      if (this.isComplete) return;
      this.checkSwipe(pointer.x, pointer.y);
    });
  }

  checkSwipe(px, py) {
    for (const spot of this.dirtSpots) {
      if (spot.cleaned) continue;
      const dist = Phaser.Math.Distance.Between(px, py, spot.x, spot.y);
      if (dist < 30) {
        this.cleanSpot(spot);
      }
    }
  }

  cleanSpot(spot) {
    spot.cleaned = true;
    this.cleanedCount++;

    // Sparkle burst
    this.spawnSparkles(spot.x, spot.y);

    // Fade out the dirt spot
    this.tweens.add({
      targets: spot,
      alpha: 0,
      scale: 0.2,
      duration: 200,
      ease: 'Power2'
    });

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

  spawnSparkles(x, y) {
    for (let i = 0; i < 6; i++) {
      const sparkle = this.add.text(x, y, '✨', { fontSize: '20px' }).setOrigin(0.5);
      const angle = (i / 6) * Math.PI * 2;
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
        this.time.delayedCall(i * 80, () => this.spawnSparkles(sx, sy));
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
