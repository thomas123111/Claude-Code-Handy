import Phaser from 'phaser';
import { loadSave, writeSave, regenerateEnergy } from '../data/SaveManager.js';

// Town layout: buildings placed on a grid with exact positions
// Map is 1200x1400 (scrollable, larger than screen)
const MAP_W = 1200;
const MAP_H = 1400;

const BUILDINGS = [
  // Tierheim oben mittig = die Basis
  { id: 'shelter', key: 'Shelter', name: 'Tierheim', tex: 'bld_shelter',
    x: 600, y: 200, scale: 1.1, unlockCost: 0, unlocked: true },
  // Werkstatt links oben
  { id: 'merge', key: 'MergeBoard', name: 'Werkstatt', tex: 'bld_workshop',
    x: 200, y: 350, scale: 1.0, unlockCost: 0, unlocked: true },
  // Tierarzt rechts oben
  { id: 'vet', key: 'Vet', name: 'Tierarzt', tex: 'bld_vet',
    x: 1000, y: 350, scale: 1.0, unlockCost: 0, unlocked: true },
  // Salon links mitte
  { id: 'salon', key: 'Salon', name: 'Salon', tex: 'bld_salon',
    x: 200, y: 750, scale: 1.0, unlockCost: 0, unlocked: true },
  // Hundeschule rechts mitte
  { id: 'school', key: 'School', name: 'Schule', tex: 'bld_school',
    x: 1000, y: 750, scale: 1.0, unlockCost: 0, unlocked: true },
  // Hotel links unten
  { id: 'hotel', key: 'Hotel', name: 'Pension', tex: 'bld_hotel',
    x: 200, y: 1100, scale: 1.0, unlockCost: 0, unlocked: true },
  // Café rechts unten
  { id: 'cafe', key: 'Cafe', name: 'Café', tex: 'bld_cafe',
    x: 1000, y: 1100, scale: 1.0, unlockCost: 0, unlocked: true },
  // Gilde unten mitte
  { id: 'guild', key: 'Guild', name: 'Gilde', tex: 'bld_guild',
    x: 600, y: 1250, scale: 1.0, unlockCost: 0, unlocked: true },
];

// Decoration - trees placed BETWEEN buildings, never on paths
const TREES = [
  // Top corners
  { x: 80, y: 150, type: 'big' }, { x: 1120, y: 150, type: 'big' },
  // Left side between buildings
  { x: 80, y: 550, type: 'small' }, { x: 80, y: 950, type: 'small' },
  // Right side between buildings
  { x: 1120, y: 550, type: 'small' }, { x: 1120, y: 950, type: 'small' },
  // Around fountain area (not on paths)
  { x: 400, y: 500, type: 'small' }, { x: 800, y: 500, type: 'small' },
  { x: 400, y: 700, type: 'small' }, { x: 800, y: 700, type: 'small' },
  // Bottom corners
  { x: 80, y: 1300, type: 'big' }, { x: 1120, y: 1300, type: 'big' },
];

const DECOR = [
  // Fountain CENTER with plaza
  { x: 600, y: 600, tex: 'env_fountain', scale: 1.0 },
  // Benches near fountain plaza
  { x: 480, y: 600, tex: 'env_bench', scale: 0.6 },
  { x: 720, y: 600, tex: 'env_bench', scale: 0.6 },
  // Lampposts along main paths
  { x: 350, y: 200, tex: 'env_lamppost', scale: 0.5 },
  { x: 850, y: 200, tex: 'env_lamppost', scale: 0.5 },
  { x: 350, y: 1100, tex: 'env_lamppost', scale: 0.5 },
  { x: 850, y: 1100, tex: 'env_lamppost', scale: 0.5 },
  // Flowerbeds near buildings
  { x: 320, y: 280, tex: 'env_flowerbed', scale: 0.5 },
  { x: 880, y: 280, tex: 'env_flowerbed', scale: 0.5 },
  { x: 600, y: 1000, tex: 'env_flowerbed', scale: 0.5 },
];
];

export class TownScene extends Phaser.Scene {
  constructor() { super('Town'); }

  create() {
    this.save = loadSave();
    regenerateEnergy(this.save);
    const { width, height } = this.scale;

    // Camera setup
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.centerOn(MAP_W / 2, 400);
    this.cameras.main.setZoom(Math.min(width / MAP_W * 1.8, 1.2));

    // === GREEN GRASS BACKGROUND (solid + subtle noise) ===
    this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x5a9a42).setDepth(0);
    // Add subtle variation patches (no tiling artifacts)
    for (let i = 0; i < 30; i++) {
      const gx = Phaser.Math.Between(0, MAP_W);
      const gy = Phaser.Math.Between(0, MAP_H);
      const shade = Phaser.Math.Between(0x4a8a3a, 0x6aaa52);
      this.add.circle(gx, gy, Phaser.Math.Between(40, 100), shade, 0.15).setDepth(0);
    }

    // === PATHS leading TO buildings (not through them) ===
    const pathColor = 0xc4a76c;

    // Central vertical main road (spine of the town)
    this.drawPath(600, 280, 600, 1180, pathColor);

    // Horizontal branches from main road to buildings
    // Top: main road → Werkstatt (left) and Tierarzt (right)
    this.drawPath(250, 350, 600, 350, pathColor);
    this.drawPath(600, 350, 950, 350, pathColor);

    // Middle: main road → Salon (left) and Schule (right)
    this.drawPath(250, 750, 600, 750, pathColor);
    this.drawPath(600, 750, 950, 750, pathColor);

    // Bottom: main road → Hotel (left) and Café (right)
    this.drawPath(250, 1100, 600, 1100, pathColor);
    this.drawPath(600, 1100, 950, 1100, pathColor);

    // Fountain plaza - circular-ish area around center
    this.add.circle(600, 600, 100, pathColor, 0.35).setDepth(0);
    this.add.circle(600, 600, 110, 0x8a7a5a, 0.12).setDepth(0);

    // === DECORATIONS ===
    TREES.forEach((t) => {
      const tex = t.type === 'big' ? 'env_tree_big' : 'env_tree_small';
      if (this.textures.exists(tex)) {
        this.add.image(t.x, t.y, tex).setScale(t.type === 'big' ? 0.8 : 0.5).setDepth(1);
      }
    });

    DECOR.forEach((d) => {
      if (this.textures.exists(d.tex)) {
        this.add.image(d.x, d.y, d.tex).setScale(d.scale).setDepth(2);
      }
    });

    // === BUILDINGS ===
    this.buildingSprites = [];
    BUILDINGS.forEach((b) => {
      const isUnlocked = b.unlocked || (this.save.stations[b.id] && this.save.stations[b.id].unlocked);

      if (this.textures.exists(b.tex)) {
        const img = this.add.image(b.x, b.y, b.tex).setScale(b.scale).setDepth(3);

        if (!isUnlocked) {
          img.setTint(0x444444); // greyed out
          img.setAlpha(0.6);
        }

        b._sprite = img;
      }

      // Name label
      this.add.text(b.x, b.y + 70, b.name, {
        fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
        backgroundColor: '#00000088', padding: { x: 8, y: 3 },
      }).setOrigin(0.5).setDepth(5);

      if (!isUnlocked) {
        // Lock + cost
        this.add.text(b.x, b.y - 10, '🔒', { fontSize: '28px' }).setOrigin(0.5).setDepth(6);
        this.add.text(b.x, b.y + 25, `${b.unlockCost}❤️`, {
          fontSize: '12px', fontFamily: 'monospace', color: '#ffaa44', fontStyle: 'bold',
          backgroundColor: '#00000066', padding: { x: 4, y: 2 },
        }).setOrigin(0.5).setDepth(6);
      } else if (b.id === 'shelter' && this.save.pets.length > 0) {
        // Pet count badge
        this.add.circle(b.x + 55, b.y - 55, 14, 0xff4466).setDepth(7);
        this.add.text(b.x + 55, b.y - 55, `${this.save.pets.length}`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(8);
      }
    });

    // === AMBIENT EFFECTS ===
    // Fountain sparkle
    if (this.textures.exists('env_fountain')) {
      this.time.addEvent({
        delay: 500, loop: true,
        callback: () => {
          const sparkle = this.add.circle(
            600 + Phaser.Math.Between(-12, 12), 590 + Phaser.Math.Between(-8, 8),
            2, 0x88ddff, 0.6
          ).setDepth(4);
          this.tweens.add({
            targets: sparkle, y: sparkle.y - 15, alpha: 0,
            duration: 800, onComplete: () => sparkle.destroy(),
          });
        },
      });
    }

    // Chimney smoke on shelter and cafe
    // Chimney smoke on shelter (top) and cafe (right bottom)
    [[600, 150], [1000, 1050]].forEach(([sx, sy]) => {
      this.time.addEvent({
        delay: 1000, loop: true,
        callback: () => {
          const smoke = this.add.circle(sx + Phaser.Math.Between(-3, 3), sy, 3, 0xffffff, 0.2).setDepth(4);
          this.tweens.add({
            targets: smoke,
            y: sy - 30, x: sx + Phaser.Math.Between(-8, 8),
            alpha: 0, scale: 2.5, duration: 2000,
            onComplete: () => smoke.destroy(),
          });
        },
      });
    });

    // Stadt-Leben: nur subtile Effekte die zum Stil passen
    // (Figuren brauchen echte Sprite-Packs, kommen später)

    // === HUD (fixed to camera) ===
    this.add.rectangle(width / 2, 0, width, 50, 0x2a1f35, 0.92).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);
    this.add.text(width / 2, 15, '🐾 Pfotenwelt', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.add.text(12, 8, `❤️ ${this.save.hearts}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff6688',
    }).setScrollFactor(0).setDepth(51);
    this.add.text(12, 28, `⚡ ${this.save.energy}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffcc00',
    }).setScrollFactor(0).setDepth(51);
    this.add.text(width - 12, 15, `Lv.${this.save.level}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#88ccff', fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51);

    // Bottom bar
    this.add.rectangle(width / 2, height - 38, width, 42, 0x2a1f35, 0.9).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);
    this.add.text(width / 2, height - 20, `🎁 ${this.save.totalDonatedKg.toFixed(1)}kg gespendet | 📅 Tag ${this.save.loginStreak}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#88cc88',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    // === INPUT: Drag to scroll, tap buildings ===
    this.isDragging = false;
    this.dragMoved = false;
    this.lastPinchDist = 0;

    this.input.on('pointerdown', (pointer) => {
      this.isDragging = true;
      this.dragMoved = false;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.camStartX = this.cameras.main.scrollX;
      this.camStartY = this.cameras.main.scrollY;
    });

    this.input.on('pointermove', (pointer) => {
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        const p1 = this.input.pointer1;
        const p2 = this.input.pointer2;
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        if (this.lastPinchDist > 0) {
          const newZoom = Phaser.Math.Clamp(
            this.cameras.main.zoom + (dist - this.lastPinchDist) * 0.004, 0.5, 2.5
          );
          this.cameras.main.setZoom(newZoom);
        }
        this.lastPinchDist = dist;
        this.dragMoved = true;
        return;
      }
      this.lastPinchDist = 0;

      if (!this.isDragging) return;
      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) this.dragMoved = true;
      if (this.dragMoved) {
        const z = this.cameras.main.zoom;
        this.cameras.main.scrollX = this.camStartX - dx / z;
        this.cameras.main.scrollY = this.camStartY - dy / z;
      }
    });

    this.input.on('pointerup', (pointer) => {
      this.isDragging = false;
      this.lastPinchDist = 0;
      if (this.dragMoved) return;

      const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      // Check building taps - the tap zone IS the sprite image
      for (const b of BUILDINGS) {
        if (!b._sprite) continue;
        const bx = b.x, by = b.y;
        const halfW = 60, halfH = 70; // approximate clickable area
        if (wp.x >= bx - halfW && wp.x <= bx + halfW &&
            wp.y >= by - halfH && wp.y <= by + halfH) {
          const isUnlocked = b.unlocked || (this.save.stations[b.id] && this.save.stations[b.id].unlocked);
          if (isUnlocked) {
            // Bounce animation then enter
            this.tweens.add({
              targets: b._sprite, scale: { from: 1.0, to: 1.1 },
              duration: 100, yoyo: true,
              onComplete: () => this.scene.start(b.key),
            });
          } else if (this.save.hearts >= b.unlockCost) {
            this.unlockBuilding(b);
          }
          return;
        }
      }

      // Double-tap zoom
      const now = Date.now();
      if (this.lastTapTime && now - this.lastTapTime < 300) {
        const targetZoom = this.cameras.main.zoom < 1.2 ? 1.8 : 0.8;
        this.tweens.add({
          targets: this.cameras.main, zoom: targetZoom, duration: 300, ease: 'Cubic.Out',
        });
        this.lastTapTime = 0;
      } else {
        this.lastTapTime = now;
      }
    });
  }

  drawPath(x1, y1, x2, y2, color) {
    const isHorizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1);
    const pathW = 50;
    const w = isHorizontal ? Math.abs(x2 - x1) : pathW;
    const h = isHorizontal ? pathW : Math.abs(y2 - y1);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    // Path edge (darker)
    this.add.rectangle(cx, cy, w + 6, h + 6, 0x7a6a4a, 0.5).setDepth(0);
    // Path fill
    this.add.rectangle(cx, cy, w, h, color, 0.6).setDepth(0);
    // Center line (subtle lighter)
    const cw = isHorizontal ? w - 20 : 4;
    const ch = isHorizontal ? 4 : h - 20;
    this.add.rectangle(cx, cy, cw, ch, 0xddccaa, 0.15).setDepth(0);
  }

  unlockBuilding(b) {
    this.save.hearts -= b.unlockCost;
    if (!this.save.stations[b.id]) this.save.stations[b.id] = {};
    this.save.stations[b.id].unlocked = true;
    this.save.stations[b.id].level = 1;
    writeSave(this.save);

    // Celebration
    if (b._sprite) {
      b._sprite.clearTint();
      b._sprite.setAlpha(1);
      this.tweens.add({
        targets: b._sprite, scale: { from: 0.5, to: 1.0 },
        duration: 500, ease: 'Back.Out',
      });
    }
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const star = this.add.text(b.x, b.y, '⭐', { fontSize: '16px' }).setOrigin(0.5).setDepth(20);
      this.tweens.add({
        targets: star,
        x: b.x + Math.cos(angle) * 70, y: b.y + Math.sin(angle) * 70,
        alpha: 0, duration: 700, onComplete: () => star.destroy(),
      });
    }
    this.time.delayedCall(800, () => this.scene.restart());
  }
}
