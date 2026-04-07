import Phaser from 'phaser';
import { loadSave, writeSave, regenerateEnergy } from '../data/SaveManager.js';

// Town map positions for each building
const BUILDINGS = [
  {
    id: 'shelter', key: 'Shelter', name: 'Tierheim', emoji: '🏠',
    x: 270, y: 280, w: 110, h: 100,
    desc: 'Pflege & vermittle Tiere',
    unlockCost: 0, unlocked: true, bgAsset: 'bg_shelter',
  },
  {
    id: 'merge', key: 'MergeBoard', name: 'Werkstatt', emoji: '🧩',
    x: 100, y: 200, w: 100, h: 90,
    desc: 'Merge Items herstellen',
    unlockCost: 0, unlocked: true, bgAsset: null,
  },
  {
    id: 'vet', key: 'Vet', name: 'Tierarzt', emoji: '🏥',
    x: 430, y: 200, w: 100, h: 90,
    desc: 'Heile kranke Tiere',
    unlockCost: 200, bgAsset: 'bg_vet',
  },
  {
    id: 'salon', key: 'Salon', name: 'Tiersalon', emoji: '✂️',
    x: 100, y: 400, w: 100, h: 90,
    desc: 'Pflege & Style',
    unlockCost: 350, bgAsset: 'bg_salon',
  },
  {
    id: 'school', key: 'School', name: 'Hundeschule', emoji: '🎓',
    x: 430, y: 400, w: 100, h: 90,
    desc: 'Trainiere Tricks',
    unlockCost: 500, bgAsset: 'bg_school',
  },
  {
    id: 'hotel', key: 'Hotel', name: 'Tierpension', emoji: '🏨',
    x: 160, y: 530, w: 100, h: 90,
    desc: 'Passive Einnahmen',
    unlockCost: 800, bgAsset: 'bg_hotel',
  },
  {
    id: 'cafe', key: 'Cafe', name: 'Tier-Café', emoji: '☕',
    x: 380, y: 530, w: 100, h: 90,
    desc: 'Besucher & Herzen',
    unlockCost: 1200, bgAsset: 'bg_cafe',
  },
];

export class TownScene extends Phaser.Scene {
  constructor() { super('Town'); }

  create() {
    this.save = loadSave();
    regenerateEnergy(this.save);
    const { width, height } = this.scale;
    const cx = width / 2;

    // Sky gradient background
    this.cameras.main.setBackgroundColor('#87CEEB');
    // Ground
    this.add.rectangle(cx, height - 200, width, 400, 0x5a8a3c).setOrigin(0.5, 0);
    // Path/road
    this.add.rectangle(cx, 350, 60, 500, 0xc4a76c, 0.6);
    this.add.rectangle(cx, 480, 350, 40, 0xc4a76c, 0.6);

    // Decorative trees
    const treePositions = [[30, 300], [510, 180], [50, 500], [490, 520], [270, 650]];
    treePositions.forEach(([tx, ty]) => {
      this.add.circle(tx, ty - 15, 18, 0x3a7a2a);
      this.add.circle(tx, ty - 25, 14, 0x4a9a3a);
      this.add.rectangle(tx, ty + 5, 8, 20, 0x6b4226);
    });

    // Clouds
    [[80, 60], [350, 40], [460, 80]].forEach(([cx2, cy]) => {
      this.add.ellipse(cx2, cy, 60, 25, 0xffffff, 0.7);
      this.add.ellipse(cx2 + 20, cy - 5, 40, 20, 0xffffff, 0.7);
    });

    // Header bar
    this.add.rectangle(cx, 0, width, 55, 0x2a1f35, 0.9).setOrigin(0.5, 0).setDepth(50);
    this.add.text(cx, 15, '🐾 Pfotenwelt', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51);
    this.add.text(15, 10, `❤️ ${this.save.hearts}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#ff6688',
    }).setDepth(51);
    this.add.text(15, 28, `⚡ ${this.save.energy}/${this.save.maxEnergy}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffcc00',
    }).setDepth(51);
    this.add.text(width - 15, 10, `Lv.${this.save.level}`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#88ccff', fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(51);
    this.add.text(width - 15, 28, `${this.save.pets.length} Tiere`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#aa88cc',
    }).setOrigin(1, 0).setDepth(51);

    // Charity counter at bottom
    this.add.rectangle(cx, height - 55, width, 50, 0x2a1f35, 0.85).setOrigin(0.5, 0).setDepth(50);
    this.add.text(cx, height - 38, `🎁 ${this.save.totalDonatedKg.toFixed(1)}kg Futter gespendet | 📅 Tag ${this.save.loginStreak}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#88cc88',
    }).setOrigin(0.5).setDepth(51);

    // Draw buildings
    this.hitAreas = [];
    BUILDINGS.forEach((b) => {
      const isUnlocked = b.unlocked || (this.save.stations[b.id] && this.save.stations[b.id].unlocked);
      this.drawBuilding(b, isUnlocked);
    });

    // Collection + Settings buttons
    this.add.text(cx - 80, height - 18, '📖 Sammlung', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ccaaee',
    }).setOrigin(0.5).setDepth(51);
    this.addHitArea(cx - 80, height - 18, 90, 25, () => this.scene.start('Collection'));

    this.add.text(cx + 80, height - 18, '🎒 Skills', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ccaaee',
    }).setOrigin(0.5).setDepth(51);
    this.addHitArea(cx + 80, height - 18, 80, 25, () => this.scene.start('Stations'));

    // Touch handler
    this.input.on('pointerdown', (pointer) => {
      for (const h of this.hitAreas) {
        if (pointer.x >= h.x - h.w / 2 && pointer.x <= h.x + h.w / 2 &&
            pointer.y >= h.y - h.h / 2 && pointer.y <= h.y + h.h / 2) {
          h.cb();
          return;
        }
      }
    });
  }

  drawBuilding(b, isUnlocked) {
    const { x, y, w, h } = b;

    if (isUnlocked) {
      // Building base (colored)
      const colors = {
        shelter: 0xcc7744, merge: 0x7744aa, vet: 0x4477aa,
        salon: 0xaa44aa, school: 0x44aa44, hotel: 0xaaaa44, cafe: 0xaa6644,
      };
      const col = colors[b.id] || 0x886644;

      // Try to use background asset as building image
      if (b.bgAsset && this.textures.exists(b.bgAsset)) {
        this.add.image(x, y, b.bgAsset).setDisplaySize(w, h).setDepth(5);
      } else {
        // Building shape
        this.add.rectangle(x, y, w, h - 15, col, 0.85).setDepth(5);
        // Roof
        const roof = this.add.triangle(x, y - h / 2 + 5, 0, 25, w / 2, 0, w, 25, col + 0x222222)
          .setDepth(6);
      }

      // Door
      this.add.rectangle(x, y + h / 2 - 18, 20, 25, 0x4a3020).setDepth(7);

      // Emoji on building
      this.add.text(x, y - 15, b.emoji, { fontSize: '28px' }).setOrigin(0.5).setDepth(8);

      // Name plate
      this.add.rectangle(x, y + h / 2 + 8, w + 10, 20, 0x2a1f35, 0.85).setDepth(8);
      this.add.text(x, y + h / 2 + 8, b.name, {
        fontSize: '10px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(9);

      // Pet count for shelter
      if (b.id === 'shelter' && this.save.pets.length > 0) {
        this.add.circle(x + w / 2 - 5, y - h / 2 + 10, 12, 0xff4466).setDepth(10);
        this.add.text(x + w / 2 - 5, y - h / 2 + 10, `${this.save.pets.length}`, {
          fontSize: '10px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(11);
      }

      // Tap to enter
      this.addHitArea(x, y, w + 10, h + 20, () => {
        this.scene.start(b.key);
      });

    } else {
      // Locked building
      this.add.rectangle(x, y, w, h - 15, 0x444444, 0.5).setDepth(5);
      this.add.triangle(x, y - h / 2 + 5, 0, 25, w / 2, 0, w, 25, 0x555555, 0.5).setDepth(6);
      this.add.text(x, y - 10, '🔒', { fontSize: '28px' }).setOrigin(0.5).setDepth(8);

      // Name + cost
      this.add.rectangle(x, y + h / 2 + 8, w + 10, 20, 0x2a1f35, 0.85).setDepth(8);
      this.add.text(x, y + h / 2 + 8, `${b.name}`, {
        fontSize: '9px', fontFamily: 'monospace', color: '#888888',
      }).setOrigin(0.5).setDepth(9);

      this.add.text(x, y + 15, `${b.unlockCost}❤️`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#ffaa44',
      }).setOrigin(0.5).setDepth(8);

      // Tap to unlock
      const canAfford = this.save.hearts >= b.unlockCost;
      if (canAfford) {
        this.addHitArea(x, y, w + 10, h + 20, () => {
          this.save.hearts -= b.unlockCost;
          if (!this.save.stations[b.id]) this.save.stations[b.id] = {};
          this.save.stations[b.id].unlocked = true;
          this.save.stations[b.id].level = 1;
          writeSave(this.save);
          // Celebration
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const star = this.add.text(x + Math.cos(angle) * 10, y + Math.sin(angle) * 10, '⭐', {
              fontSize: '16px',
            }).setDepth(20);
            this.tweens.add({
              targets: star,
              x: x + Math.cos(angle) * 50, y: y + Math.sin(angle) * 50,
              alpha: 0, duration: 600, onComplete: () => star.destroy(),
            });
          }
          this.time.delayedCall(700, () => this.scene.restart());
        });
      }
    }
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
