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

    // Bullet - basic (yellow)
    pg.clear();
    pg.fillStyle(0xffff44, 1);
    pg.fillCircle(4, 4, 4);
    pg.generateTexture('bullet', 8, 8);
    pg.generateTexture('bullet_basic', 8, 8);

    // Bullet - plasma (cyan, bigger)
    pg.clear();
    pg.fillStyle(0x44ddff, 1);
    pg.fillCircle(5, 5, 5);
    pg.fillStyle(0xaaeeff, 0.5);
    pg.fillCircle(5, 5, 3);
    pg.generateTexture('bullet_plasma', 10, 10);

    // Bullet - explosive (orange, big)
    pg.clear();
    pg.fillStyle(0xff6622, 1);
    pg.fillCircle(5, 5, 5);
    pg.fillStyle(0xffaa44, 0.7);
    pg.fillCircle(5, 5, 2);
    pg.generateTexture('bullet_explosive', 10, 10);

    // Bullet - piercing (purple, elongated)
    pg.clear();
    pg.fillStyle(0xcc44ff, 1);
    pg.fillRect(1, 2, 6, 4);
    pg.fillStyle(0xee88ff, 0.6);
    pg.fillRect(2, 3, 4, 2);
    pg.generateTexture('bullet_piercing', 8, 8);

    // Loot - ammo pickup
    pg.clear();
    pg.fillStyle(0xff8800, 1);
    pg.fillRect(2, 1, 8, 10);
    pg.fillStyle(0xffaa44, 1);
    pg.fillRect(4, 0, 4, 3);
    pg.generateTexture('loot_ammo', 12, 12);

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

    // Ghost loot - ethereal glowing orb
    pg.clear();
    pg.fillStyle(0x44ddff, 0.6);
    pg.fillCircle(8, 8, 8);
    pg.fillStyle(0xaaeeff, 0.3);
    pg.fillCircle(8, 8, 12);
    pg.generateTexture('ghost_loot', 24, 24);

    // Sequence switch - inactive (dark)
    pg.clear();
    pg.fillStyle(0x333344, 1);
    pg.fillCircle(14, 14, 14);
    pg.lineStyle(2, 0x555566, 1);
    pg.strokeCircle(14, 14, 14);
    pg.generateTexture('switch_off', 28, 28);

    // Sequence switch - showing (lit up)
    pg.clear();
    pg.fillStyle(0x33ff88, 1);
    pg.fillCircle(14, 14, 14);
    pg.fillStyle(0xaaffcc, 0.6);
    pg.fillCircle(14, 14, 8);
    pg.lineStyle(2, 0x66ffaa, 1);
    pg.strokeCircle(14, 14, 14);
    pg.generateTexture('switch_on', 28, 28);

    // Sequence switch - error (red)
    pg.clear();
    pg.fillStyle(0xff3333, 1);
    pg.fillCircle(14, 14, 14);
    pg.lineStyle(2, 0xff6666, 1);
    pg.strokeCircle(14, 14, 14);
    pg.generateTexture('switch_error', 28, 28);

    // Arena wall segment (small block for thin/diagonal walls)
    pg.clear();
    pg.fillStyle(0x667788, 1);
    pg.fillRect(0, 0, 12, 12);
    pg.generateTexture('arena_wall', 12, 12);

    // Maze wall segment
    pg.clear();
    pg.fillStyle(0x4466aa, 0.7);
    pg.fillRect(0, 0, 40, 40);
    pg.lineStyle(1, 0x6688cc, 0.4);
    pg.strokeRect(1, 1, 38, 38);
    pg.generateTexture('maze_wall', 40, 40);

    // Maze goal
    pg.clear();
    pg.fillStyle(0x44ffaa, 0.8);
    pg.fillCircle(12, 12, 12);
    pg.fillStyle(0xaaffdd, 0.5);
    pg.fillCircle(12, 12, 6);
    pg.generateTexture('maze_goal', 24, 24);

    pg.destroy();
  }
}
