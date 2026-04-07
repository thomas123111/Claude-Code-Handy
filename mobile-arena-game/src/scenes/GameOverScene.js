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

    // Portrait layout - centered
    const cx = width / 2;
    this.add.text(cx, 80, 'DESTROYED', {
      fontSize: '32px', fontFamily: 'monospace', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 120, `Reached Arena ${this.arenaIndex + 1}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5);

    let y = 170;
    const lines = [
      ['Earned', `${this.runCredits}cr`, '#ffdd00'],
      ['Kept (50%)', `${keptCredits}cr`, '#ffffff'],
      ['Scrap kept', `${keptScrap}`, '#88aacc'],
      ['XP kept', `${keptXp}`, '#aaffaa'],
    ];

    lines.forEach(([label, value, color]) => {
      this.add.text(cx - 80, y, label, { fontSize: '14px', fontFamily: 'monospace', color: '#888888' });
      this.add.text(cx + 80, y, value, { fontSize: '14px', fontFamily: 'monospace', color, fontStyle: 'bold' }).setOrigin(1, 0);
      y += 30;
    });

    this.add.text(cx, height - 40, 'Death costs 50%. Cash out to keep everything!', {
      fontSize: '10px', fontFamily: 'monospace', color: '#555555',
    }).setOrigin(0.5);

    // Button
    const by = 420;
    this.add.rectangle(cx, by, 280, 50, 0x3399ff, 0.2).setStrokeStyle(2, 0x3399ff);
    this.add.text(cx, by, 'BACK TO MENU', {
      fontSize: '18px', fontFamily: 'monospace', color: '#3399ff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.input.on('pointerdown', (pointer) => {
      if (pointer.x >= cx - 140 && pointer.x <= cx + 140 &&
          pointer.y >= by - 25 && pointer.y <= by + 25) {
        this.scene.start('Menu');
      }
    });
  }
}
