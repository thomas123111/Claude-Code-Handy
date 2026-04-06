import Phaser from 'phaser';
import { loadSave, resetSave, getSelectedMech } from '../systems/SaveSystem.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;
    const save = loadSave();
    const mech = getSelectedMech(save);

    // Title
    this.add.text(width / 2, 80, 'MECH ARENA', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#3399ff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 120, 'Top-Down Arena Shooter', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#6688aa',
    }).setOrigin(0.5);

    // Mech display
    const mechSprite = this.add.image(width / 2, 240, `mech_${mech.id}`).setScale(3);

    this.add.text(width / 2, 290, `${mech.name} - Lv.${mech.level}`, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Stats
    this.add.text(width / 2, 330, `Credits: ${save.credits}  |  Scrap: ${save.scrap}`, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(width / 2, 355, `Highest Arena: ${save.highestArena}  |  Runs: ${save.totalRuns}`, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#888888',
    }).setOrigin(0.5);

    // Buttons
    this.createButton(width / 2, 440, 'START RUN', '#3399ff', () => {
      this.scene.start('Arena', { arenaIndex: 0, runCredits: 0, runScrap: 0, runXp: 0 });
    });

    this.createButton(width / 2, 510, 'HANGAR', '#44aa44', () => {
      this.scene.start('Hangar');
    });

    this.createButton(width / 2, 580, 'RESET SAVE', '#884444', () => {
      resetSave();
      this.scene.restart();
    });

    // Controls hint
    this.add.text(width / 2, 720, 'Touch: Virtual Joystick to move\nDesktop: WASD/Arrows to move\nAuto-fire at nearest enemy', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#555555',
      align: 'center',
    }).setOrigin(0.5);
  }

  createButton(x, y, text, color, callback) {
    const bg = this.add.rectangle(x, y, 220, 50, Phaser.Display.Color.HexStringToColor(color).color, 0.2)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color)
      .setInteractive({ useHandCursor: true });

    const label = this.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: color,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.4));
    bg.on('pointerout', () => bg.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.2));
    bg.on('pointerdown', callback);

    return { bg, label };
  }
}
