import Phaser from 'phaser';
import { loadSave, writeSave, getSelectedMech, addXpToMech } from '../systems/SaveSystem.js';

export class ArenaCompleteScene extends Phaser.Scene {
  constructor() {
    super('ArenaComplete');
  }

  init(data) {
    this.arenaIndex = data.arenaIndex;
    this.runCredits = data.runCredits;
    this.runScrap = data.runScrap;
    this.runXp = data.runXp;
    this.timeBonus = data.timeBonus || 0;
    this.playerHpPercent = data.playerHpPercent || 1;
  }

  create() {
    const { width, height } = this.scale;
    const nextArena = this.arenaIndex + 1;

    this.cameras.main.fadeIn(400);

    this.add.text(width / 2, 80, `ARENA ${this.arenaIndex + 1}\nCOMPLETE!`, {
      fontSize: '28px', fontFamily: 'monospace', color: '#44ff44', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5);

    let y = 170;
    const stats = [
      [`Credits earned`, `${this.runCredits}`],
      [`Scrap earned`, `${this.runScrap}`],
      [`XP earned`, `${this.runXp}`],
    ];
    if (this.timeBonus > 0) {
      stats.push([`Speed bonus`, `+${this.timeBonus} credits`]);
    }
    stats.push([`HP remaining`, `${Math.round(this.playerHpPercent * 100)}%`]);

    stats.forEach(([label, value]) => {
      this.add.text(40, y, label, {
        fontSize: '14px', fontFamily: 'monospace', color: '#aaaaaa',
      });
      this.add.text(width - 40, y, value, {
        fontSize: '14px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(1, 0);
      y += 30;
    });

    // Next arena button
    this.createButton(width / 2, 420, `NEXT ARENA →`, '#3399ff', () => {
      this.scene.start('Arena', {
        arenaIndex: nextArena,
        runCredits: this.runCredits,
        runScrap: this.runScrap,
        runXp: this.runXp,
      });
    });

    // Cash out button - end run and save
    this.createButton(width / 2, 500, 'CASH OUT & SAVE', '#ffaa00', () => {
      this.cashOut();
    });

    // Info
    this.add.text(width / 2, 580, 'Cash out saves your earnings.\nContinuing risks losing on death!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#666666', align: 'center',
    }).setOrigin(0.5);
  }

  cashOut() {
    const save = loadSave();

    save.credits += this.runCredits;
    save.scrap += this.runScrap;
    if (this.arenaIndex + 1 > save.highestArena) {
      save.highestArena = this.arenaIndex + 1;
    }
    save.totalRuns++;

    const mech = getSelectedMech(save);
    addXpToMech(mech, this.runXp);

    writeSave(save);
    this.scene.start('Menu');
  }

  createButton(x, y, text, color, callback) {
    const bg = this.add.rectangle(x, y, 260, 50, Phaser.Display.Color.HexStringToColor(color).color, 0.2)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y, text, {
      fontSize: '16px', fontFamily: 'monospace', color, fontStyle: 'bold',
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.4));
    bg.on('pointerout', () => bg.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.2));
    bg.on('pointerdown', callback);
  }
}
