import Phaser from 'phaser';
import { loadSave, resetSave, getSelectedMech } from '../systems/SaveSystem.js';

export const GAME_VERSION = 'v0.4.6';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;
    const save = loadSave();
    const mech = getSelectedMech(save);

    // Left side: Title + Mech
    this.add.text(width * 0.3, 30, 'MECH ARENA', {
      fontSize: '32px', fontFamily: 'monospace', color: '#3399ff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width * 0.3, 60, mech.title || 'Top-Down Arena Shooter', {
      fontSize: '12px', fontFamily: 'monospace', color: '#6688aa',
    }).setOrigin(0.5);

    this.add.image(width * 0.3, 130, `mech_${mech.id}`).setScale(3);

    this.add.text(width * 0.3, 175, `${mech.name} - Lv.${mech.level}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(width * 0.3, 200, `Credits: ${save.credits}  |  Scrap: ${save.scrap}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(width * 0.3, 220, `Highest Arena: ${save.highestArena}  |  Runs: ${save.totalRuns}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5);

    this.add.text(width * 0.3, height - 30, 'Left: Move | Right: Aim+Shoot', {
      fontSize: '10px', fontFamily: 'monospace', color: '#555555',
    }).setOrigin(0.5);

    // Right side: Buttons (using manual hit detection)
    const bx = width * 0.72;
    this.buttons = [];
    this.drawButton(bx, 100, 'START RUN', '#3399ff');
    this.drawButton(bx, 170, 'HANGAR', '#44aa44');
    this.drawButton(bx, 240, 'RESET SAVE', '#884444');

    // Version number under buttons
    this.add.text(bx, 310, GAME_VERSION, {
      fontSize: '18px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Global pointer handler - check which button was hit
    this.input.on('pointerdown', (pointer) => {
      const px = pointer.x;
      const py = pointer.y;

      for (const btn of this.buttons) {
        if (px >= btn.x - btn.w / 2 && px <= btn.x + btn.w / 2 &&
            py >= btn.y - btn.h / 2 && py <= btn.y + btn.h / 2) {
          btn.action();
          return;
        }
      }
    });
  }

  drawButton(x, y, text, color) {
    const colorVal = Phaser.Display.Color.HexStringToColor(color).color;
    const bg = this.add.rectangle(x, y, 220, 50, colorVal, 0.2)
      .setStrokeStyle(2, colorVal);
    this.add.text(x, y, text, {
      fontSize: '16px', fontFamily: 'monospace', color, fontStyle: 'bold',
    }).setOrigin(0.5);

    let action;
    if (text === 'START RUN') {
      action = () => {
        const runSeed = Date.now();
        this.scene.start('Arena', { arenaIndex: 0, runCredits: 0, runScrap: 0, runXp: 0, runSeed });
      };
    } else if (text === 'HANGAR') {
      action = () => this.scene.start('Hangar');
    } else if (text === 'RESET SAVE') {
      action = () => { resetSave(); this.scene.restart(); };
    }

    this.buttons.push({ x, y, w: 220, h: 50, bg, colorVal, action });
  }
}
