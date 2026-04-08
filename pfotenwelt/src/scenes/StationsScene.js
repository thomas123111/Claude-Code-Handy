import Phaser from 'phaser';
import { loadSave, writeSave } from '../data/SaveManager.js';
import { THEME, drawButton, drawCard } from '../ui/Theme.js';

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

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    // Header
    this.add.rectangle(cx, 0, width, 58, THEME.bg.header, 0.98).setOrigin(0.5, 0);
    this.add.rectangle(cx, 58, width, 2, THEME.bg.headerBorder).setOrigin(0.5, 0);
    this.add.text(cx, 20, '🏗️ Stationen', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 42, `❤️ ${save.hearts} Herzen`, {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
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
      const borderColor = unlocked ? 0xc8a8e8 : 0xe0d0e8;
      drawCard(this, cx, y + cardH / 2, cardW, cardH, { borderColor });
      if (!unlocked) this.add.rectangle(cx, y + cardH / 2, cardW, cardH, 0xf0e8f4, 0.4);

      // Emoji
      this.add.text(30, y + 15, station.emoji, {
        fontSize: '36px',
      }).setAlpha(unlocked ? 1 : 0.4);

      // Name
      this.add.text(80, y + 12, station.name, {
        fontSize: '18px', fontFamily: 'Georgia, serif',
        color: unlocked ? THEME.text.dark : THEME.text.muted, fontStyle: 'bold',
      });

      // Description
      this.add.text(80, y + 34, station.desc, {
        fontSize: '14px', fontFamily: 'monospace',
        color: unlocked ? THEME.text.body : THEME.text.muted,
      });

      // Level indicator
      if (unlocked) {
        this.add.text(80, y + 54, `Level ${level}`, {
          fontSize: '13px', fontFamily: 'monospace', color: THEME.text.success,
        });

        // "Betreten" button
        this.add.text(width - 25, y + cardH / 2, 'Betreten ▶', {
          fontSize: '15px', fontFamily: 'monospace', color: THEME.accent.purple,
        }).setOrigin(1, 0.5);
        this.addHitArea(cx, y + cardH / 2, cardW, cardH, () => {
          this.scene.start(station.scene);
        });
      } else {
        // Lock icon and cost
        this.add.text(80, y + 54, '🔒 Gesperrt', {
          fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
        });

        const costColor = canAfford ? THEME.text.warning : THEME.text.muted;
        const costLabel = station.unlockCost === 0 ? 'Kostenlos' : `${station.unlockCost} ❤️`;
        this.add.text(width - 25, y + 30, costLabel, {
          fontSize: '15px', fontFamily: 'monospace', color: costColor,
        }).setOrigin(1, 0.5);

        if (canAfford) {
          this.add.text(width - 25, y + 50, 'Freischalten', {
            fontSize: '14px', fontFamily: 'monospace', color: THEME.text.success,
          }).setOrigin(1, 0.5);

          this.addHitArea(cx, y + cardH / 2, cardW, cardH, () => {
            this.unlockStation(station.id, station.unlockCost);
          });
        } else {
          this.add.text(width - 25, y + 50, 'Zu wenig ❤️', {
            fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
          }).setOrigin(1, 0.5);
        }
      }

      y += cardH + 10;
    });

    // Back button
    drawButton(this, cx, height - 40, 280, 50, '← Zurück', { type: 'secondary' });
    this.addHitArea(cx, height - 40, 260, 40, () => this.scene.start('Town'));

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
