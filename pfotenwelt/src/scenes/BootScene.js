import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    // All graphics are emoji/text-based for MVP - no asset loading needed
    // Generate simple textures for UI elements
    const pg = this.add.graphics();

    // Heart icon
    pg.fillStyle(0xff4466, 1);
    pg.fillCircle(6, 5, 5);
    pg.fillCircle(14, 5, 5);
    pg.beginPath();
    pg.moveTo(1, 7);
    pg.lineTo(10, 18);
    pg.lineTo(19, 7);
    pg.closePath();
    pg.fill();
    pg.generateTexture('heart_icon', 20, 20);

    // Energy bolt
    pg.clear();
    pg.fillStyle(0xffcc00, 1);
    pg.beginPath();
    pg.moveTo(12, 0);
    pg.lineTo(4, 10);
    pg.lineTo(9, 10);
    pg.lineTo(6, 20);
    pg.lineTo(16, 8);
    pg.lineTo(11, 8);
    pg.closePath();
    pg.fill();
    pg.generateTexture('energy_icon', 20, 20);

    pg.destroy();

    this.scene.start('Menu');
  }
}
