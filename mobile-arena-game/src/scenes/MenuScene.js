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

    // Left side: Title + Mech
    this.add.text(width * 0.3, 30, 'MECH ARENA', {
      fontSize: '32px', fontFamily: 'monospace', color: '#3399ff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width * 0.3, 58, 'Top-Down Arena Shooter', {
      fontSize: '12px', fontFamily: 'monospace', color: '#6688aa',
    }).setOrigin(0.5);

    this.add.image(width * 0.3, 120, `mech_${mech.id}`).setScale(3);

    this.add.text(width * 0.3, 160, `${mech.name} - Lv.${mech.level}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(width * 0.3, 185, `Credits: ${save.credits}  |  Scrap: ${save.scrap}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(width * 0.3, 205, `Highest Arena: ${save.highestArena}  |  Runs: ${save.totalRuns}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5);

    // Controls hint
    this.add.text(width * 0.3, height - 30, 'Left: Shoot | Right: Move | WASD on desktop', {
      fontSize: '10px', fontFamily: 'monospace', color: '#555555',
    }).setOrigin(0.5);

    // Right side: Buttons
    const bx = width * 0.72;
    this.createButton(bx, 80, 'START RUN', '#3399ff', () => {
      const runSeed = Date.now();
      this.scene.start('Arena', { arenaIndex: 0, runCredits: 0, runScrap: 0, runXp: 0, runSeed });
    });

    this.createButton(bx, 150, 'HANGAR', '#44aa44', () => {
      this.scene.start('Hangar');
    });

    this.createButton(bx, 220, 'RESET SAVE', '#884444', () => {
      resetSave();
      this.scene.restart();
    });
  }

  createButton(x, y, text, color, callback) {
    const colorVal = Phaser.Display.Color.HexStringToColor(color).color;
    const bg = this.add.rectangle(x, y, 220, 50, colorVal, 0.2)
      .setStrokeStyle(2, colorVal);

    const label = this.add.text(x, y, text, {
      fontSize: '16px', fontFamily: 'monospace', color, fontStyle: 'bold',
      padding: { x: 20, y: 12 },
      backgroundColor: 'transparent',
    }).setOrigin(0.5).setInteractive(
      new Phaser.Geom.Rectangle(-110, -25, 220, 50),
      Phaser.Geom.Rectangle.Contains
    );

    label.on('pointerover', () => bg.setFillStyle(colorVal, 0.4));
    label.on('pointerout', () => bg.setFillStyle(colorVal, 0.2));
    label.on('pointerdown', callback);
  }
}
