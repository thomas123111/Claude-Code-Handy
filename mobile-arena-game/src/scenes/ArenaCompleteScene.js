import Phaser from 'phaser';
import { loadSave, writeSave, getSelectedMech, addXpToMech } from '../systems/SaveSystem.js';
import { getArenaSceneName, getArenaType } from '../systems/ArenaConfig.js';

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
    this.runSeed = data.runSeed || 1;
    this.ammoStock = data.ammoStock || {};
  }

  create() {
    const { width, height } = this.scale;
    const nextArena = this.arenaIndex + 1;

    this.cameras.main.fadeIn(400);

    // Left side: Stats
    this.add.text(width * 0.3, 30, `ARENA ${this.arenaIndex + 1} COMPLETE!`, {
      fontSize: '22px', fontFamily: 'monospace', color: '#44ff44', fontStyle: 'bold',
    }).setOrigin(0.5);

    let y = 65;
    const stats = [
      [`Credits`, `${this.runCredits}`],
      [`Scrap`, `${this.runScrap}`],
      [`XP`, `${this.runXp}`],
    ];
    if (this.timeBonus > 0) stats.push([`Speed bonus`, `+${this.timeBonus}cr`]);
    stats.push([`HP`, `${Math.round(this.playerHpPercent * 100)}%`]);

    stats.forEach(([label, value]) => {
      this.add.text(width * 0.1, y, label, {
        fontSize: '12px', fontFamily: 'monospace', color: '#aaaaaa',
      });
      this.add.text(width * 0.48, y, value, {
        fontSize: '12px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(1, 0);
      y += 22;
    });

    this.add.text(width * 0.3, height - 25, 'Cash out saves earnings. Continuing risks losing on death!', {
      fontSize: '9px', fontFamily: 'monospace', color: '#555555',
    }).setOrigin(0.5);

    // Right side: Buttons
    const bx = width * 0.72;
    const nextType = getArenaType(nextArena);
    const nextLabel = nextType === 'maze' ? 'MAZE ARENA →' : 'NEXT ARENA →';
    const nextColor = nextType === 'maze' ? '#4466aa' : '#3399ff';

    this.createButton(bx, height * 0.3, nextLabel, nextColor, () => {
      this.scene.start(getArenaSceneName(nextArena), {
        arenaIndex: nextArena,
        runCredits: this.runCredits,
        runScrap: this.runScrap,
        runXp: this.runXp,
        runSeed: this.runSeed,
        ammoStock: this.ammoStock,
      });
    });

    this.createButton(bx, height * 0.6, 'CASH OUT & SAVE', '#ffaa00', () => {
      this.cashOut();
    });
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

    // Save ammo stock back
    save.ammo = { ...save.ammo, ...this.ammoStock };

    writeSave(save);
    this.scene.start('Menu');
  }

  createButton(x, y, text, color, callback) {
    const colorVal = Phaser.Display.Color.HexStringToColor(color).color;
    const zone = this.add.zone(x, y, 220, 50).setInteractive();
    this.add.rectangle(x, y, 220, 50, colorVal, 0.2).setStrokeStyle(2, colorVal);
    this.add.text(x, y, text, {
      fontSize: '16px', fontFamily: 'monospace', color, fontStyle: 'bold',
    }).setOrigin(0.5);
    zone.on('pointerdown', callback);
  }
}
