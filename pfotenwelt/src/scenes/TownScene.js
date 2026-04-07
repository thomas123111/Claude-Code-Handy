import Phaser from 'phaser';
import { loadSave, writeSave, regenerateEnergy } from '../data/SaveManager.js';

// Buildings mapped to ACTUAL positions in town_map_clean.jpg (1024x1024)
const BUILDINGS = [
  { id: 'shelter', key: 'Shelter', name: 'Tierheim', x: 200, y: 280, r: 65, unlockCost: 0, unlocked: true },
  { id: 'vet', key: 'Vet', name: 'Tierarzt', x: 540, y: 200, r: 60, unlockCost: 200 },
  { id: 'merge', key: 'MergeBoard', name: 'Werkstatt', x: 780, y: 280, r: 60, unlockCost: 0, unlocked: true },
  { id: 'salon', key: 'Salon', name: 'Salon', x: 200, y: 680, r: 60, unlockCost: 350 },
  { id: 'school', key: 'School', name: 'Schule', x: 790, y: 480, r: 60, unlockCost: 500 },
  { id: 'cafe', key: 'Cafe', name: 'Café', x: 370, y: 780, r: 55, unlockCost: 1200 },
  { id: 'guild', key: 'Guild', name: 'Gilde', x: 650, y: 680, r: 55, unlockCost: 300 },
  { id: 'hotel', key: 'Hotel', name: 'Pension', x: 650, y: 850, r: 55, unlockCost: 800 },
];

export class TownScene extends Phaser.Scene {
  constructor() { super('Town'); }

  create() {
    this.save = loadSave();
    regenerateEnergy(this.save);
    const { width, height } = this.scale;
    const mapW = 1024;
    const mapH = 1024;

    // Camera bounds for the map
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.centerOn(mapW / 2, mapH / 2);
    this.cameras.main.setZoom(Math.max(width / mapW, height / mapH) * 1.3);

    // Town map background - the KI image IS the town, no overlays
    const mapKey = this.textures.exists('town_map_clean') ? 'town_map_clean' : 'town_map_main';
    if (this.textures.exists(mapKey)) {
      this.add.image(mapW / 2, mapH / 2, mapKey).setDisplaySize(mapW, mapH).setDepth(0);
    } else {
      // Fallback solid color
      this.add.rectangle(mapW / 2, mapH / 2, mapW, mapH, 0x5a8a3c).setDepth(0);
    }

    // Only add subtle name labels over buildings - no emojis, no walkers
    BUILDINGS.forEach((b) => {
      const isUnlocked = b.unlocked || (this.save.stations[b.id] && this.save.stations[b.id].unlocked);

      if (isUnlocked) {
        // Small clean name label
        const label = this.add.text(b.x, b.y + b.r - 5, b.name, {
          fontSize: '11px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
          backgroundColor: '#00000088', padding: { x: 6, y: 2 },
        }).setOrigin(0.5).setDepth(2);

        // Pet count badge on shelter
        if (b.id === 'shelter' && this.save.pets.length > 0) {
          this.add.circle(b.x + 30, b.y - 30, 12, 0xff4466).setDepth(3);
          this.add.text(b.x + 30, b.y - 30, `${this.save.pets.length}`, {
            fontSize: '10px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
          }).setOrigin(0.5).setDepth(4);
        }
      } else {
        // Locked: dark overlay circle + cost
        this.add.circle(b.x, b.y, b.r, 0x000000, 0.5).setDepth(1);
        this.add.text(b.x, b.y - 8, '🔒', { fontSize: '20px' }).setOrigin(0.5).setDepth(2);
        this.add.text(b.x, b.y + 14, `${b.unlockCost}❤️`, {
          fontSize: '10px', fontFamily: 'monospace', color: '#ffaa44',
        }).setOrigin(0.5).setDepth(2);
      }
    });

    // === HUD (fixed to camera) ===
    // Top bar
    this.add.rectangle(width / 2, 0, width, 48, 0x2a1f35, 0.9).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);
    this.add.text(width / 2, 14, '🐾 Pfotenwelt', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.add.text(12, 8, `❤️ ${this.save.hearts}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff6688',
    }).setScrollFactor(0).setDepth(51);
    this.add.text(12, 26, `⚡ ${this.save.energy}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffcc00',
    }).setScrollFactor(0).setDepth(51);
    this.add.text(width - 12, 14, `Lv.${this.save.level}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#88ccff', fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51);
    this.add.text(width - 12, 30, `${this.save.pets.length}🐾`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#aa88cc',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51);

    // Bottom bar
    this.add.rectangle(width / 2, height - 35, width, 40, 0x2a1f35, 0.9).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);
    this.add.text(width / 2, height - 18, `🎁 ${this.save.totalDonatedKg.toFixed(1)}kg gespendet`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#88cc88',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    // === ANIMATED CHARACTERS on paths (proper sprites, correct scale) ===
    this.walkers = [];

    // Paths follow the cobblestone roads in the image
    // Scale: buildings are ~100px wide in 1024 map, so characters should be ~25-35px
    const walkerDefs = [
      // Dog walker along horizontal path (middle road)
      { tex: 'sprite_dog_walker', scale: 0.5, speed: 18, depth: 3,
        path: [[100, 480], [450, 480], [450, 350], [600, 350], [900, 350]] },
      // Cat sitting near the salon, moves occasionally
      { tex: 'sprite_cat_sitting', scale: 0.35, speed: 5, depth: 3,
        path: [[280, 620], [320, 640], [260, 660], [280, 620]] },
      // Jogger on the lower path
      { tex: 'sprite_jogger', scale: 0.4, speed: 30, depth: 3,
        path: [[900, 750], [500, 750], [500, 880], [100, 880]] },
      // Child playing near the fountain
      { tex: 'sprite_child', scale: 0.35, speed: 8, depth: 3,
        path: [[460, 520], [540, 520], [540, 450], [460, 450], [460, 520]] },
      // Bicycle on upper road
      { tex: 'sprite_bicycle', scale: 0.4, speed: 35, depth: 3,
        path: [[50, 200], [450, 200], [700, 200], [950, 200]] },
      // Bird flying high above
      { tex: 'sprite_bird', scale: 0.3, speed: 25, depth: 4,
        path: [[100, 100], [500, 80], [900, 120], [600, 60], [100, 100]] },
    ];

    walkerDefs.forEach((wd) => {
      if (!this.textures.exists(wd.tex)) return;
      const start = wd.path[0];
      const sprite = this.add.image(start[0], start[1], wd.tex)
        .setScale(wd.scale).setDepth(wd.depth);
      this.walkers.push({
        sprite, path: wd.path, speed: wd.speed,
        currentTarget: 1,
      });
    });

    // === DRAG TO SCROLL + PINCH TO ZOOM ===
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
      // Pinch zoom with 2 fingers
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        const p1 = this.input.pointer1;
        const p2 = this.input.pointer2;
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        if (this.lastPinchDist > 0) {
          const delta = dist - this.lastPinchDist;
          const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + delta * 0.005, 0.6, 3.0);
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
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) this.dragMoved = true;
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

      // Tap: check buildings in world coords
      const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      for (const b of BUILDINGS) {
        const dist = Math.sqrt((wp.x - b.x) ** 2 + (wp.y - b.y) ** 2);
        if (dist < b.r) {
          const isUnlocked = b.unlocked || (this.save.stations[b.id] && this.save.stations[b.id].unlocked);
          if (isUnlocked) {
            this.scene.start(b.key);
          } else if (this.save.hearts >= b.unlockCost) {
            this.unlockBuilding(b);
          }
          return;
        }
      }

      // Double-tap to zoom in/out
      const now = Date.now();
      if (this.lastTapTime && now - this.lastTapTime < 300) {
        // Double tap: toggle zoom
        const targetZoom = this.cameras.main.zoom < 1.5 ? 2.2 : 1.0;
        this.tweens.add({
          targets: this.cameras.main,
          zoom: targetZoom,
          scrollX: wp.x - width / (2 * targetZoom),
          scrollY: wp.y - height / (2 * targetZoom),
          duration: 300,
          ease: 'Cubic.Out',
        });
        this.lastTapTime = 0;
      } else {
        this.lastTapTime = now;
      }
    });
  }

  unlockBuilding(b) {
    this.save.hearts -= b.unlockCost;
    if (!this.save.stations[b.id]) this.save.stations[b.id] = {};
    this.save.stations[b.id].unlocked = true;
    this.save.stations[b.id].level = 1;
    writeSave(this.save);
    this.scene.restart();
  }

  update(time, delta) {
    // Animate walker sprites along paths
    if (!this.walkers) return;
    this.walkers.forEach((w) => {
      const target = w.path[w.currentTarget];
      const dx = target[0] - w.sprite.x;
      const dy = target[1] - w.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 3) {
        // Reached waypoint, go to next
        w.currentTarget = (w.currentTarget + 1) % w.path.length;
        // Flip sprite based on horizontal direction
        const next = w.path[w.currentTarget];
        w.sprite.setFlipX(next[0] < w.sprite.x);
      } else {
        const spd = w.speed * (delta / 1000);
        w.sprite.x += (dx / dist) * spd;
        w.sprite.y += (dy / dist) * spd;
      }
    });
  }
}
