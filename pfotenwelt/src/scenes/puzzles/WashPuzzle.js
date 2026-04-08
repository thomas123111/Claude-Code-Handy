import Phaser from 'phaser';
import { THEME } from '../../ui/Theme.js';

// More dirt spots, spread wider — each needs multiple swipes to clean
const DIRT_SPOTS = [
  // Head area
  { x: -40, y: -100, r: 22 }, { x: 20, y: -110, r: 20 }, { x: 50, y: -90, r: 18 },
  // Ears
  { x: -70, y: -80, r: 20 }, { x: 70, y: -70, r: 18 },
  // Face
  { x: -20, y: -60, r: 24 }, { x: 30, y: -50, r: 22 },
  // Body upper
  { x: -60, y: -20, r: 28 }, { x: 0, y: -10, r: 26 }, { x: 60, y: -15, r: 24 },
  // Body middle
  { x: -50, y: 20, r: 30 }, { x: 20, y: 30, r: 28 }, { x: 70, y: 25, r: 22 },
  // Body lower
  { x: -40, y: 60, r: 26 }, { x: 30, y: 55, r: 24 }, { x: -10, y: 80, r: 20 },
  // Legs/paws
  { x: -60, y: 90, r: 18 }, { x: 50, y: 85, r: 20 },
  // Extra grime
  { x: -30, y: -40, r: 16 }, { x: 40, y: 10, r: 18 },
  { x: -10, y: 50, r: 16 }, { x: 60, y: 60, r: 14 },
];

const SWIPES_TO_CLEAN = 25; // each spot needs many swipes — ~7x longer than original

export class WashPuzzle extends Phaser.Scene {
  constructor() { super('WashPuzzle'); }

  init(data) {
    this.petName = data.petName || 'Tier';
    this.onCompleteScene = data.onComplete || 'Shelter';
    this.breedId = data.breedId || 'labrador';
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height * 0.38;

    this.cameras.main.setBackgroundColor('#e8f4fc');

    // Title
    this.add.text(cx, 30, `🧼 ${this.petName} waschen`, {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 55, 'Wische den Dreck weg!', {
      fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // === PET IMAGE ===
    const washKey = `wash_${this.breedId}`;
    const texKey = this.textures.exists(washKey) ? washKey : 'wash_labrador';

    if (this.textures.exists(texKey)) {
      this.petImg = this.add.image(cx, cy, texKey).setScale(0.55).setDepth(1);
    } else {
      this.petImg = this.add.text(cx, cy, '🐕', { fontSize: '120px' }).setOrigin(0.5).setDepth(1);
    }

    // Breathing animation
    this.tweens.add({
      targets: this.petImg, scaleY: { from: 0.55, to: 0.565 },
      duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    // Gentle sway
    this.tweens.add({
      targets: this.petImg, angle: { from: -1.2, to: 1.2 },
      duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });

    // === BLINKING EYES ===
    // Two small eyelid overlays that close periodically
    const eyeY = cy - 55;
    const eyeL = this.add.ellipse(cx - 18, eyeY, 14, 2, 0xd4a854, 0).setDepth(5);
    const eyeR = this.add.ellipse(cx + 18, eyeY, 14, 2, 0xd4a854, 0).setDepth(5);
    this.eyeL = eyeL;
    this.eyeR = eyeR;
    // Blink every 2-5 seconds
    this.time.addEvent({
      delay: 2500,
      loop: true,
      callback: () => {
        const blinkDelay = Phaser.Math.Between(0, 2000);
        this.time.delayedCall(blinkDelay, () => this.doBlink());
      },
    });

    // === DIRT OVERLAY ===
    this.dirtSpots = [];
    this.totalCleanPoints = DIRT_SPOTS.length * SWIPES_TO_CLEAN;
    this.cleanedPoints = 0;

    DIRT_SPOTS.forEach((spot) => {
      const dx = cx + spot.x;
      const dy = cy + spot.y;
      // Multiple layers for thick dirt look
      const dirtOuter = this.add.circle(dx, dy, spot.r, 0x5a3a1a, 0.6).setDepth(10);
      const dirtMid = this.add.circle(dx + 2, dy + 1, spot.r * 0.7, 0x7a5a3a, 0.45).setDepth(11);
      const dirtInner = this.add.circle(dx - 1, dy - 1, spot.r * 0.4, 0x3a2a10, 0.35).setDepth(12);
      this.dirtSpots.push({
        layers: [dirtOuter, dirtMid, dirtInner],
        x: dx, y: dy, r: spot.r,
        swipesLeft: SWIPES_TO_CLEAN,
        maxSwipes: SWIPES_TO_CLEAN,
      });
    });

    // === PROGRESS BAR ===
    const barY = height - 100;
    const barW = width - 60;
    this.add.rectangle(cx, barY, barW, 20, 0xd0c8d8).setStrokeStyle(1, 0xb0a8b8);
    this.progressFill = this.add.rectangle(cx - barW / 2 + 2, barY, 0, 16, 0x55bbdd).setOrigin(0, 0.5);
    this.progressMaxW = barW - 4;
    this.progressText = this.add.text(cx, barY - 18, '0% sauber', {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.body,
    }).setOrigin(0.5);

    // === TOUCH INPUT ===
    this.lastPointerX = 0;
    this.lastPointerY = 0;

    this.input.on('pointerdown', (pointer) => {
      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
      this.checkClean(pointer.x, pointer.y);
    });

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      const ddx = pointer.x - this.lastPointerX;
      const ddy = pointer.y - this.lastPointerY;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dist > 8) {
        this.checkClean(pointer.x, pointer.y);
        this.spawnSoapBubble(pointer.x, pointer.y);
        this.petReaction(pointer.x, pointer.y, cx, cy);
      }
      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
    });

    // Cancel button
    this.add.text(cx, height - 40, '← Abbrechen', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: THEME.text.muted,
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
      this.registry.set('puzzleResult', { success: false });
      this.scene.start(this.onCompleteScene);
    });
  }

  doBlink() {
    // Close eyes
    this.tweens.add({ targets: [this.eyeL, this.eyeR], scaleY: 6, alpha: 1, duration: 80, yoyo: true, hold: 60 });
  }

  checkClean(px, py) {
    let cleaned = false;
    this.dirtSpots.forEach((spot) => {
      if (spot.swipesLeft <= 0) return;
      const dist = Phaser.Math.Distance.Between(px, py, spot.x, spot.y);
      if (dist < spot.r + 12) {
        spot.swipesLeft--;
        this.cleanedPoints++;
        cleaned = true;

        // Fade dirt layers progressively
        const progress = 1 - (spot.swipesLeft / spot.maxSwipes);
        spot.layers.forEach((layer, li) => {
          const targetAlpha = Math.max(0, layer.alpha - (1 / spot.maxSwipes));
          this.tweens.add({ targets: layer, alpha: targetAlpha, duration: 150 });
        });

        // Small splash at wipe point
        const splash = this.add.circle(px, py, 4, 0xaaddff, 0.5).setDepth(20);
        this.tweens.add({
          targets: splash, scale: 2, alpha: 0, duration: 200,
          onComplete: () => splash.destroy(),
        });

        // Fully cleaned?
        if (spot.swipesLeft <= 0) {
          spot.layers.forEach((layer) => {
            this.tweens.add({
              targets: layer, alpha: 0, scale: 0.2, duration: 250,
              onComplete: () => layer.destroy(),
            });
          });
          // Sparkle
          for (let i = 0; i < 3; i++) {
            const sp = this.add.circle(
              spot.x + Phaser.Math.Between(-10, 10),
              spot.y + Phaser.Math.Between(-10, 10),
              2, 0xffffff, 0.8
            ).setDepth(20);
            this.tweens.add({
              targets: sp, alpha: 0, scale: 3, y: sp.y - 12,
              duration: 350, delay: i * 40,
              onComplete: () => sp.destroy(),
            });
          }
        }

        this.updateProgress();
      }
    });
    return cleaned;
  }

  spawnSoapBubble(x, y) {
    if (Math.random() > 0.35) return;
    const bubble = this.add.circle(
      x + Phaser.Math.Between(-15, 15),
      y + Phaser.Math.Between(-8, 8),
      Phaser.Math.Between(3, 7), 0xeeffff, 0.5
    ).setDepth(15).setStrokeStyle(1, 0xccddee, 0.3);
    this.tweens.add({
      targets: bubble, y: bubble.y - Phaser.Math.Between(20, 45),
      alpha: 0, scale: 0.3, duration: Phaser.Math.Between(500, 900),
      onComplete: () => bubble.destroy(),
    });
  }

  petReaction(px, py, cx, cy) {
    if (!this.petImg) return;
    const relX = (px - cx) / 100;
    this.tweens.add({
      targets: this.petImg, x: cx - relX * 6,
      duration: 200, ease: 'Quad.Out',
    });
    // Blink if touching face area
    if (py < cy - 30 && Math.random() > 0.7) {
      this.doBlink();
    }
  }

  updateProgress() {
    const pct = this.cleanedPoints / this.totalCleanPoints;
    this.progressFill.width = this.progressMaxW * pct;
    this.progressText.setText(`${Math.round(pct * 100)}% sauber`);
    if (pct >= 1.0) {
      this.time.delayedCall(300, () => this.showSuccess());
    }
  }

  showSuccess() {
    const { width, height } = this.scale;
    const cx = width / 2;
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      const star = this.add.text(cx, height * 0.38, '✨', { fontSize: '20px' }).setOrigin(0.5).setDepth(30);
      this.tweens.add({
        targets: star, x: cx + Math.cos(angle) * 100, y: height * 0.38 + Math.sin(angle) * 100,
        alpha: 0, duration: 800, onComplete: () => star.destroy(),
      });
    }
    this.add.text(cx, height * 0.62, '✨ Blitzsauber! ✨', {
      fontSize: '26px', fontFamily: 'Georgia, serif', color: '#33aa55', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(30);
    this.time.delayedCall(1500, () => {
      this.registry.set('puzzleResult', { success: true, score: 100 });
      this.scene.start(this.onCompleteScene);
    });
  }
}
