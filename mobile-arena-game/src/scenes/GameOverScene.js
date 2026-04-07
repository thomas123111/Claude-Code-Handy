import Phaser from 'phaser';
import { loadSave, writeSave, getSelectedMech, addXpToMech } from '../systems/SaveSystem.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  init(data) {
    this.arenaIndex = data.arenaIndex;
    this.runCredits = data.runCredits;
    this.runScrap = data.runScrap;
    this.runXp = data.runXp;
    this.ammoStock = data.ammoStock || {};
  }

  create() {
    const { width, height } = this.scale;

    // Player keeps a portion of earned loot on death
    const keepPercent = 0.5;
    const keptCredits = Math.floor(this.runCredits * keepPercent);
    const keptScrap = Math.floor(this.runScrap * keepPercent);
    const keptXp = Math.floor(this.runXp * keepPercent);

    // Save progress
    const save = loadSave();
    save.credits += keptCredits;
    save.scrap += keptScrap;
    if (this.arenaIndex > save.highestArena) {
      save.highestArena = this.arenaIndex;
    }
    save.totalRuns++;

    const mech = getSelectedMech(save);
    addXpToMech(mech, keptXp);

    // Save remaining ammo (keep what's left, no penalty on ammo)
    save.ammo = { ...save.ammo, ...this.ammoStock };

    writeSave(save);

    // UI - landscape two-column layout
    // Left: Title + Stats
    this.add.text(width * 0.3, 30, 'DESTROYED', {
      fontSize: '28px', fontFamily: 'monospace', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width * 0.3, 60, `Reached Arena ${this.arenaIndex + 1}`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5);

    let y = 90;
    const lines = [
      ['Earned', `${this.runCredits}cr`, '#ffdd00'],
      ['Kept (50%)', `${keptCredits}cr`, '#ffffff'],
      ['Scrap kept', `${keptScrap}`, '#88aacc'],
      ['XP kept', `${keptXp}`, '#aaffaa'],
    ];

    lines.forEach(([label, value, color]) => {
      this.add.text(width * 0.1, y, label, {
        fontSize: '11px', fontFamily: 'monospace', color: '#888888',
      });
      this.add.text(width * 0.48, y, value, {
        fontSize: '11px', fontFamily: 'monospace', color, fontStyle: 'bold',
      }).setOrigin(1, 0);
      y += 22;
    });

    this.add.text(width * 0.3, height - 20, 'Death costs 50%. Cash out to keep everything!', {
      fontSize: '9px', fontFamily: 'monospace', color: '#555555',
    }).setOrigin(0.5);

    // Right: Button (manual hit detection)
    const bx = width * 0.72;
    const by = height * 0.45;
    this.add.rectangle(bx, by, 220, 50, 0x3399ff, 0.2).setStrokeStyle(2, 0x3399ff);
    this.add.text(bx, by, 'BACK TO MENU', {
      fontSize: '16px', fontFamily: 'monospace', color: '#3399ff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.input.on('pointerdown', (pointer) => {
      if (pointer.x >= bx - 110 && pointer.x <= bx + 110 &&
          pointer.y >= by - 25 && pointer.y <= by + 25) {
        this.scene.start('Menu');
      }
    });
  }
}
