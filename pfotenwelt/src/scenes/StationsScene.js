import Phaser from 'phaser';
import { loadSave, writeSave } from '../data/SaveManager.js';

const STATIONS = [
  { id: 'shelter', emoji: '🏠', name: 'Tierheim', desc: 'Pflege & vermittle Tiere', unlockCost: 0, scene: 'Shelter' },
  { id: 'vet', emoji: '🏥', name: 'Tierarzt', desc: 'Heile kranke Tiere', unlockCost: 200, scene: 'Vet' },
  { id: 'salon', emoji: '✂️', name: 'Tiersalon', desc: 'Pflege & Style', unlockCost: 350, scene: 'Salon' },
  { id: 'school', emoji: '🎓', name: 'Hundeschule', desc: 'Trainiere Tricks', unlockCost: 500, scene: 'School' },
  { id: 'hotel', emoji: '🏨', name: 'Tierpension', desc: 'Passive Einnahmen', unlockCost: 800, scene: 'Hotel' },
  { id: 'cafe', emoji: '☕', name: 'Tier-Café', desc: 'Besucher & Herzen', unlockCost: 1200, scene: 'Cafe' },
];

export class StationsScene extends Phaser.Scene {
  constructor() { super('Stations'); }

  create() {
    this.save = loadSave();
    this.drawUI();
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];

    const { width, height } = this.scale;
    const cx = width / 2;
    const save = this.save;

    this.cameras.main.setBackgroundColor('#221a2e');

    // Header
    this.add.text(cx, 25, '🏗️ Stationen', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#ddaa77', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 52, `❤️ ${save.hearts} Herzen`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#998877',
    }).setOrigin(0.5);

    // Station cards
    let y = 80;
    const cardH = 120;
    const cardW = width - 30;

    STATIONS.forEach((station) => {
      const stationSave = save.stations[station.id] || { unlocked: false, level: 0 };
      const unlocked = stationSave.unlocked;
      const level = stationSave.level || (unlocked ? 1 : 0);
      const canAfford = save.hearts >= station.unlockCost;

      // Card background
      const bgColor = unlocked ? 0x2d2240 : 0x1a1525;
      const borderColor = unlocked ? 0x8866bb : 0x444444;
      this.add.rectangle(cx, y + cardH / 2, cardW, cardH, bgColor, unlocked ? 0.9 : 0.5)
        .setStrokeStyle(1, borderColor);

      // Emoji
      this.add.text(30, y + 15, station.emoji, {
        fontSize: '36px',
      }).setAlpha(unlocked ? 1 : 0.4);

      // Name
      this.add.text(80, y + 12, station.name, {
        fontSize: '16px', fontFamily: 'Georgia, serif',
        color: unlocked ? '#ffffff' : '#666666', fontStyle: 'bold',
      });

      // Description
      this.add.text(80, y + 34, station.desc, {
        fontSize: '11px', fontFamily: 'monospace',
        color: unlocked ? '#aaaacc' : '#555555',
      });

      // Level indicator
      if (unlocked) {
        this.add.text(80, y + 54, `Level ${level}`, {
          fontSize: '10px', fontFamily: 'monospace', color: '#88aa66',
        });

        // "Betreten" button
        this.add.text(width - 25, y + cardH / 2, 'Betreten ▶', {
          fontSize: '12px', fontFamily: 'monospace', color: '#ddaa77',
        }).setOrigin(1, 0.5);
        this.addHitArea(cx, y + cardH / 2, cardW, cardH, () => {
          this.scene.start(station.scene);
        });
      } else {
        // Lock icon and cost
        this.add.text(80, y + 54, '🔒 Gesperrt', {
          fontSize: '10px', fontFamily: 'monospace', color: '#665555',
        });

        const costColor = canAfford ? '#ffaa44' : '#554444';
        const costLabel = station.unlockCost === 0 ? 'Kostenlos' : `${station.unlockCost} ❤️`;
        this.add.text(width - 25, y + 30, costLabel, {
          fontSize: '12px', fontFamily: 'monospace', color: costColor,
        }).setOrigin(1, 0.5);

        if (canAfford) {
          this.add.text(width - 25, y + 50, 'Freischalten', {
            fontSize: '11px', fontFamily: 'monospace', color: '#44dd88',
          }).setOrigin(1, 0.5);

          this.addHitArea(cx, y + cardH / 2, cardW, cardH, () => {
            this.unlockStation(station.id, station.unlockCost);
          });
        } else {
          this.add.text(width - 25, y + 50, 'Zu wenig ❤️', {
            fontSize: '10px', fontFamily: 'monospace', color: '#554444',
          }).setOrigin(1, 0.5);
        }
      }

      y += cardH + 10;
    });

    // Back button
    this.add.text(cx, height - 40, '← Zurück', {
      fontSize: '14px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5);
    this.addHitArea(cx, height - 40, 120, 30, () => this.scene.start('Menu'));

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

  unlockStation(stationId, cost) {
    if (this.save.hearts < cost) return;
    this.save.hearts -= cost;
    this.save.stations[stationId].unlocked = true;
    this.save.stations[stationId].level = 1;
    writeSave(this.save);
    this.drawUI();
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
