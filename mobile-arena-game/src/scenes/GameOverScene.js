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
    writeSave(save);

    // UI
    this.add.text(width / 2, 100, 'DESTROYED', {
      fontSize: '32px', fontFamily: 'monospace', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 150, `Reached Arena ${this.arenaIndex + 1}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5);

    let y = 210;
    const lines = [
      ['Earned credits', `${this.runCredits}`, '#ffdd00'],
      ['Kept (50%)', `${keptCredits}`, '#ffffff'],
      ['Earned scrap', `${this.runScrap}`, '#88aacc'],
      ['Kept (50%)', `${keptScrap}`, '#ffffff'],
      ['XP kept', `${keptXp}`, '#aaffaa'],
    ];

    lines.forEach(([label, value, color]) => {
      this.add.text(60, y, label, {
        fontSize: '13px', fontFamily: 'monospace', color: '#888888',
      });
      this.add.text(width - 60, y, value, {
        fontSize: '13px', fontFamily: 'monospace', color, fontStyle: 'bold',
      }).setOrigin(1, 0);
      y += 28;
    });

    this.add.text(width / 2, 420, 'Death costs 50% of run earnings.\nCash out between arenas to keep everything!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#666666', align: 'center',
    }).setOrigin(0.5);

    // Retry button
    const bg = this.add.rectangle(width / 2, 500, 260, 50, 0x3399ff, 0.2)
      .setStrokeStyle(2, 0x3399ff)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, 500, 'BACK TO MENU', {
      fontSize: '18px', fontFamily: 'monospace', color: '#3399ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerdown', () => this.scene.start('Menu'));
  }
}
