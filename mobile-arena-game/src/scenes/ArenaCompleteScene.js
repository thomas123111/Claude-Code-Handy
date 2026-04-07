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

    // Right side: Buttons (manual hit detection)
    const bx = width * 0.72;
    const nextType = getArenaType(nextArena);
    const nextLabel = nextType === 'maze' ? 'MAZE ARENA' : 'NEXT ARENA';
    const nextColor = nextType === 'maze' ? '#4466aa' : '#3399ff';
    const nextColorVal = Phaser.Display.Color.HexStringToColor(nextColor).color;
    const cashColorVal = Phaser.Display.Color.HexStringToColor('#ffaa00').color;

    this.add.rectangle(bx, height * 0.35, 220, 50, nextColorVal, 0.2).setStrokeStyle(2, nextColorVal);
    this.add.text(bx, height * 0.35, nextLabel, {
      fontSize: '16px', fontFamily: 'monospace', color: nextColor, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.rectangle(bx, height * 0.6, 220, 50, cashColorVal, 0.2).setStrokeStyle(2, cashColorVal);
    this.add.text(bx, height * 0.6, 'CASH OUT', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffaa00', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.input.on('pointerdown', (pointer) => {
      const px = pointer.x, py = pointer.y;
      if (px >= bx - 110 && px <= bx + 110) {
        if (py >= height * 0.35 - 25 && py <= height * 0.35 + 25) {
          this.scene.start(getArenaSceneName(nextArena), {
            arenaIndex: nextArena, runCredits: this.runCredits,
            runScrap: this.runScrap, runXp: this.runXp,
            runSeed: this.runSeed, ammoStock: this.ammoStock,
          });
        } else if (py >= height * 0.6 - 25 && py <= height * 0.6 + 25) {
          this.cashOut();
        }
      }
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

}
