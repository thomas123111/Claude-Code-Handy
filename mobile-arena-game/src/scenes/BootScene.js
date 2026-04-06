import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    // Generate all textures procedurally (no asset loading needed)
    this.generateTextures();
    this.scene.start('Menu');
  }

  generateTextures() {
    // Player mech - triangle ship
    const pg = this.add.graphics();

    // Striker - balanced blue mech
    pg.clear();
    pg.fillStyle(0x3399ff, 1);
    pg.beginPath();
    pg.moveTo(16, 0);
    pg.lineTo(32, 32);
    pg.lineTo(16, 26);
    pg.lineTo(0, 32);
    pg.closePath();
    pg.fill();
    pg.fillStyle(0x66bbff, 1);
    pg.fillRect(12, 10, 8, 12);
    pg.generateTexture('mech_striker', 32, 32);

    // Tank - wide heavy mech
    pg.clear();
    pg.fillStyle(0x44aa44, 1);
    pg.fillRect(2, 4, 28, 24);
    pg.fillStyle(0x66cc66, 1);
    pg.fillRect(10, 0, 12, 28);
    pg.fillStyle(0x88ee88, 1);
    pg.fillRect(13, 2, 6, 8);
    pg.generateTexture('mech_tank', 32, 32);

    // Scout - sleek small mech
    pg.clear();
    pg.fillStyle(0xffaa00, 1);
    pg.beginPath();
    pg.moveTo(16, 0);
    pg.lineTo(28, 28);
    pg.lineTo(16, 22);
    pg.lineTo(4, 28);
    pg.closePath();
    pg.fill();
    pg.fillStyle(0xffcc44, 1);
    pg.fillRect(13, 8, 6, 8);
    pg.generateTexture('mech_scout', 32, 32);

    // Bullet
    pg.clear();
    pg.fillStyle(0xffff44, 1);
    pg.fillCircle(4, 4, 4);
    pg.generateTexture('bullet', 8, 8);

    // Enemy bullet
    pg.clear();
    pg.fillStyle(0xff4444, 1);
    pg.fillCircle(3, 3, 3);
    pg.generateTexture('enemy_bullet', 6, 6);

    // Basic enemy - small square
    pg.clear();
    pg.fillStyle(0xff4444, 1);
    pg.fillRect(2, 2, 20, 20);
    pg.fillStyle(0xcc2222, 1);
    pg.fillRect(6, 6, 12, 12);
    pg.generateTexture('enemy_basic', 24, 24);

    // Fast enemy - diamond
    pg.clear();
    pg.fillStyle(0xff8844, 1);
    pg.beginPath();
    pg.moveTo(12, 0);
    pg.lineTo(24, 12);
    pg.lineTo(12, 24);
    pg.lineTo(0, 12);
    pg.closePath();
    pg.fill();
    pg.generateTexture('enemy_fast', 24, 24);

    // Tanky enemy - big circle
    pg.clear();
    pg.fillStyle(0xaa2266, 1);
    pg.fillCircle(16, 16, 16);
    pg.fillStyle(0xcc4488, 1);
    pg.fillCircle(16, 16, 10);
    pg.generateTexture('enemy_tank', 32, 32);

    // Loot - credit
    pg.clear();
    pg.fillStyle(0xffdd00, 1);
    pg.fillCircle(6, 6, 6);
    pg.fillStyle(0xffaa00, 1);
    pg.fillCircle(6, 6, 3);
    pg.generateTexture('loot_credit', 12, 12);

    // Loot - scrap
    pg.clear();
    pg.fillStyle(0x88aacc, 1);
    pg.fillRect(1, 1, 10, 10);
    pg.fillStyle(0xaaccee, 1);
    pg.fillRect(3, 3, 6, 6);
    pg.generateTexture('loot_scrap', 12, 12);

    // Loot - health
    pg.clear();
    pg.fillStyle(0x44ff44, 1);
    pg.fillRect(3, 0, 6, 12);
    pg.fillRect(0, 3, 12, 6);
    pg.generateTexture('loot_health', 12, 12);

    // Loot crate
    pg.clear();
    pg.fillStyle(0xcc8833, 1);
    pg.fillRect(2, 4, 20, 16);
    pg.fillStyle(0xffaa44, 1);
    pg.fillRect(4, 6, 16, 12);
    pg.lineStyle(2, 0x885522, 1);
    pg.strokeRect(2, 4, 20, 16);
    pg.fillStyle(0xffdd00, 1);
    pg.fillRect(9, 9, 6, 6);
    pg.generateTexture('loot_crate', 24, 24);

    // Portal
    pg.clear();
    pg.lineStyle(3, 0x9944ff, 1);
    pg.strokeCircle(20, 20, 18);
    pg.lineStyle(2, 0xcc88ff, 0.7);
    pg.strokeCircle(20, 20, 12);
    pg.fillStyle(0x6622cc, 0.4);
    pg.fillCircle(20, 20, 10);
    pg.generateTexture('portal', 40, 40);

    // Joystick base
    pg.clear();
    pg.fillStyle(0xffffff, 0.15);
    pg.fillCircle(50, 50, 50);
    pg.lineStyle(2, 0xffffff, 0.3);
    pg.strokeCircle(50, 50, 50);
    pg.generateTexture('joystick_base', 100, 100);

    // Joystick thumb
    pg.clear();
    pg.fillStyle(0xffffff, 0.4);
    pg.fillCircle(25, 25, 25);
    pg.generateTexture('joystick_thumb', 50, 50);

    pg.destroy();
  }
}
