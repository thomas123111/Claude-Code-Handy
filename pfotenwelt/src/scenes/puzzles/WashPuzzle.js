import Phaser from 'phaser';
import { THEME } from '../../ui/Theme.js';

// Dirt spots — positions relative to the pet image center (0,0)
const DIRT_SPOTS = [
  { x: -60, y: -40, r: 28 },
  { x: 40, y: -60, r: 24 },
  { x: -30, y: 20, r: 32 },
  { x: 50, y: 10, r: 26 },
  { x: -10, y: -80, r: 20 },
  { x: 70, y: -30, r: 22 },
  { x: -50, y: 60, r: 25 },
  { x: 20, y: 50, r: 30 },
  { x: -70, y: -10, r: 18 },
  { x: 60, y: 60, r: 20 },
  { x: 0, y: -50, r: 22 },
  { x: -40, y: -70, r: 18 },
];

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
    const cy = height * 0.4;

    this.cameras.main.setBackgroundColor('#e8f4fc');

    // Title
    this.add.text(cx, 30, `🧼 ${this.petName} waschen`, {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 55, 'Wische den Dreck weg!', {
      fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // === PET IMAGE with Tween animations ===
    const washKey = `wash_${this.breedId}`;
    const texKey = this.textures.exists(washKey) ? washKey : 'wash_labrador';

    if (this.textures.exists(texKey)) {
      this.petImg = this.add.image(cx, cy, texKey).setScale(0.55);
    } else {
      // Fallback: emoji
      this.petImg = this.add.text(cx, cy, '🐕', { fontSize: '120px' }).setOrigin(0.5);
    }

    // Breathing animation (subtle scale pulse)
    this.tweens.add({
      targets: this.petImg, scaleY: { from: 0.55, to: 0.565 },
      duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    // Gentle sway
    this.tweens.add({
      targets: this.petImg, angle: { from: -1.5, to: 1.5 },
      duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });

    // === DIRT OVERLAY — brown/grey circles on top of pet ===
    this.dirtSpots = [];
    this.totalDirt = DIRT_SPOTS.length;
    this.cleanedCount = 0;

    DIRT_SPOTS.forEach((spot, i) => {
      const dx = cx + spot.x;
      const dy = cy + spot.y;
      // Brown dirt circle (layered for texture)
      const dirtOuter = this.add.circle(dx, dy, spot.r, 0x6B4226, 0.55).setDepth(10);
      const dirtInner = this.add.circle(dx, dy, spot.r * 0.6, 0x8B5E3C, 0.4).setDepth(11);
      // Slight random offset for organic look
      const dirtSpeck = this.add.circle(dx + Phaser.Math.Between(-5, 5), dy + Phaser.Math.Between(-5, 5), spot.r * 0.3, 0x4a3520, 0.3).setDepth(12);
      this.dirtSpots.push({ outer: dirtOuter, inner: dirtInner, speck: dirtSpeck, x: dx, y: dy, r: spot.r, cleaned: false });
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

    // === TOUCH INPUT — wipe to clean ===
    this.lastPointerX = 0;
    this.lastPointerY = 0;

    this.input.on('pointerdown', (pointer) => {
      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
      this.checkClean(pointer.x, pointer.y);
    });

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      const dx = pointer.x - this.lastPointerX;
      const dy = pointer.y - this.lastPointerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Only clean if actually swiping (not just holding)
      if (dist > 5) {
        this.checkClean(pointer.x, pointer.y);
        this.spawnSoapBubble(pointer.x, pointer.y);
        // Trigger pet reaction based on touch position
        this.petReaction(pointer.x, pointer.y, cx, cy);
      }
      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
    });

    // Back button
    this.add.text(cx, height - 40, '← Abbrechen', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: THEME.text.muted,
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
      this.registry.set('puzzleResult', { success: false });
      this.scene.start(this.onCompleteScene);
    });
  }

  checkClean(px, py) {
    this.dirtSpots.forEach((spot) => {
      if (spot.cleaned) return;
      const dist = Phaser.Math.Distance.Between(px, py, spot.x, spot.y);
      if (dist < spot.r + 15) {
        // Clean this spot!
        spot.cleaned = true;
        this.cleanedCount++;

        // Fade out dirt with satisfying animation
        [spot.outer, spot.inner, spot.speck].forEach((obj) => {
          this.tweens.add({
            targets: obj, alpha: 0, scale: 0.3, duration: 300,
            onComplete: () => obj.destroy(),
          });
        });

        // Sparkle effect at clean spot
        for (let i = 0; i < 4; i++) {
          const sparkle = this.add.circle(
            spot.x + Phaser.Math.Between(-15, 15),
            spot.y + Phaser.Math.Between(-15, 15),
            3, 0xffffff, 0.8
          ).setDepth(20);
          this.tweens.add({
            targets: sparkle, alpha: 0, scale: 2, y: sparkle.y - 15,
            duration: 400, delay: i * 50,
            onComplete: () => sparkle.destroy(),
          });
        }

        this.updateProgress();
      }
    });
  }

  spawnSoapBubble(x, y) {
    if (Math.random() > 0.4) return; // not every move
    const bubble = this.add.circle(
      x + Phaser.Math.Between(-20, 20),
      y + Phaser.Math.Between(-10, 10),
      Phaser.Math.Between(3, 8),
      0xeeffff, 0.6
    ).setDepth(15).setStrokeStyle(1, 0xccddee, 0.4);

    this.tweens.add({
      targets: bubble,
      y: bubble.y - Phaser.Math.Between(20, 50),
      alpha: 0, scale: { from: 1, to: 0.3 },
      duration: Phaser.Math.Between(500, 1000),
      onComplete: () => bubble.destroy(),
    });
  }

  petReaction(px, py, cx, cy) {
    if (!this.petImg) return;
    // Head area (top) — tilt away from touch
    const relX = (px - cx) / 100;
    const relY = (py - cy) / 100;

    // Slight lean away from where you're scrubbing
    this.tweens.add({
      targets: this.petImg,
      x: cx - relX * 8,
      duration: 200, ease: 'Quad.Out',
    });
  }

  updateProgress() {
    const pct = this.cleanedCount / this.totalDirt;
    this.progressFill.width = this.progressMaxW * pct;
    this.progressText.setText(`${Math.round(pct * 100)}% sauber`);

    if (pct >= 1.0) {
      // All clean! Success!
      this.time.delayedCall(300, () => this.showSuccess());
    }
  }

  showSuccess() {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Big sparkle burst
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      const star = this.add.text(cx, height * 0.4, '✨', { fontSize: '20px' }).setOrigin(0.5).setDepth(30);
      this.tweens.add({
        targets: star,
        x: cx + Math.cos(angle) * 100,
        y: height * 0.4 + Math.sin(angle) * 100,
        alpha: 0, duration: 800,
        onComplete: () => star.destroy(),
      });
    }

    // Success text
    this.add.text(cx, height * 0.65, '✨ Blitzsauber! ✨', {
      fontSize: '26px', fontFamily: 'Georgia, serif', color: '#33aa55', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(30);

    this.time.delayedCall(1500, () => {
      this.registry.set('puzzleResult', { success: true, score: 100 });
      this.scene.start(this.onCompleteScene);
    });
  }
}
