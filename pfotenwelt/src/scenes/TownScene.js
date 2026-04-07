import Phaser from 'phaser';
import { loadSave, writeSave, regenerateEnergy } from '../data/SaveManager.js';

// Buildings mapped to approximate positions on town_map_clean.jpg
// The AI image has buildings at these rough locations (1024x1024 map)
const BUILDINGS = [
  { id: 'shelter', key: 'Shelter', name: 'Tierheim', x: 180, y: 190, r: 55, unlockCost: 0, unlocked: true },
  { id: 'merge', key: 'MergeBoard', name: 'Werkstatt', x: 510, y: 130, r: 50, unlockCost: 0, unlocked: true },
  { id: 'vet', key: 'Vet', name: 'Tierarzt', x: 820, y: 180, r: 50, unlockCost: 200 },
  { id: 'salon', key: 'Salon', name: 'Salon', x: 160, y: 520, r: 50, unlockCost: 350 },
  { id: 'school', key: 'School', name: 'Schule', x: 510, y: 560, r: 50, unlockCost: 500 },
  { id: 'hotel', key: 'Hotel', name: 'Pension', x: 840, y: 520, r: 50, unlockCost: 800 },
  { id: 'cafe', key: 'Cafe', name: 'Café', x: 350, y: 360, r: 45, unlockCost: 1200 },
  { id: 'guild', key: 'Guild', name: 'Gilde', x: 700, y: 370, r: 45, unlockCost: 300 },
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

    // === DRAG TO SCROLL ===
    this.isDragging = false;
    this.dragMoved = false;

    this.input.on('pointerdown', (pointer) => {
      this.isDragging = true;
      this.dragMoved = false;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.camStartX = this.cameras.main.scrollX;
      this.camStartY = this.cameras.main.scrollY;
    });

    this.input.on('pointermove', (pointer) => {
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
      if (this.dragMoved) return; // was scroll, not tap

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
}
