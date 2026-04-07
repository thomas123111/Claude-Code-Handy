import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Show loading text
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Loading...', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5);

    // Load sprite assets (Kenney Tiny Dungeon - CC0)
    this.load.image('hero_knight', 'assets/sprites/hero_knight.png');
    this.load.image('hero_mage', 'assets/sprites/hero_mage.png');
    this.load.image('hero_rogue', 'assets/sprites/hero_rogue.png');
    this.load.image('enemy_slime', 'assets/sprites/enemy_slime.png');
    this.load.image('enemy_skeleton', 'assets/sprites/enemy_skeleton.png');
    this.load.image('enemy_ghost', 'assets/sprites/enemy_ghost.png');
    this.load.image('enemy_orc', 'assets/sprites/enemy_orc.png');
    this.load.image('enemy_demon', 'assets/sprites/enemy_demon.png');
    this.load.image('chest_closed', 'assets/sprites/chest_closed.png');
    this.load.image('chest_open', 'assets/sprites/chest_open.png');
    this.load.image('item_potion_blue', 'assets/sprites/item_potion_blue.png');
    this.load.image('item_potion_red', 'assets/sprites/item_potion_red.png');
    this.load.image('item_sword', 'assets/sprites/item_sword.png');
    this.load.image('floor_dark', 'assets/sprites/floor_dark.png');
    this.load.image('floor_light', 'assets/sprites/floor_light.png');
    this.load.image('wall_brown', 'assets/sprites/wall_brown.png');
    this.load.image('wall_iron', 'assets/sprites/wall_iron.png');
    this.load.image('door', 'assets/sprites/door.png');
    this.load.image('gate', 'assets/sprites/gate.png');

    // Load UI assets (Kenney RPG UI - CC0)
    this.load.image('btn_blue', 'assets/ui/btn_blue.png');
    this.load.image('btn_blue_pressed', 'assets/ui/btn_blue_pressed.png');
    this.load.image('btn_brown', 'assets/ui/btn_brown.png');
    this.load.image('btn_brown_pressed', 'assets/ui/btn_brown_pressed.png');
    this.load.image('btn_grey', 'assets/ui/btn_grey.png');
    this.load.image('btn_beige', 'assets/ui/btn_beige.png');
    this.load.image('panel_blue', 'assets/ui/panel_blue.png');
    this.load.image('panel_brown', 'assets/ui/panel_brown.png');
    this.load.image('panel_beige', 'assets/ui/panel_beige.png');
  }

  create() {
    // Generate remaining textures procedurally (bullets, effects, joystick)
    this.generateTextures();
    this.scene.start('Menu');
  }

  generateTextures() {
    const pg = this.add.graphics();

    // Map hero sprites to mech IDs (for backward compat)
    // mech_striker → hero_knight, mech_titan → hero_knight (recolor), mech_phantom → hero_mage
    // We'll use the loaded sprites directly, but create aliases
    if (!this.textures.exists('mech_striker')) {
      // Create scaled-up versions of the 16x16 sprites for menu display
    }

    // Bullets - bigger and brighter for visibility
    pg.clear();
    pg.fillStyle(0xffff44, 1);
    pg.fillCircle(6, 6, 6);
    pg.fillStyle(0xffffff, 0.5);
    pg.fillCircle(6, 6, 3);
    pg.generateTexture('bullet', 12, 12);
    pg.generateTexture('bullet_basic', 12, 12);

    pg.clear();
    pg.fillStyle(0x44ddff, 1);
    pg.fillCircle(7, 7, 7);
    pg.fillStyle(0xaaeeff, 0.6);
    pg.fillCircle(7, 7, 4);
    pg.generateTexture('bullet_plasma', 14, 14);

    pg.clear();
    pg.fillStyle(0xff6622, 1);
    pg.fillCircle(7, 7, 7);
    pg.fillStyle(0xffaa44, 0.8);
    pg.fillCircle(7, 7, 3);
    pg.generateTexture('bullet_explosive', 14, 14);

    pg.clear();
    pg.fillStyle(0xcc44ff, 1);
    pg.fillRect(0, 2, 10, 6);
    pg.fillStyle(0xee88ff, 0.6);
    pg.fillRect(2, 3, 6, 4);
    pg.generateTexture('bullet_piercing', 8, 8);

    // Enemy bullet - red, visible
    pg.clear();
    pg.fillStyle(0xff2222, 1);
    pg.fillCircle(5, 5, 5);
    pg.fillStyle(0xff8888, 0.5);
    pg.fillCircle(5, 5, 2);
    pg.generateTexture('enemy_bullet', 10, 10);

    // Loot icons
    pg.clear();
    pg.fillStyle(0xffdd00, 1);
    pg.fillCircle(6, 6, 6);
    pg.fillStyle(0xffaa00, 1);
    pg.fillCircle(6, 6, 3);
    pg.generateTexture('loot_credit', 12, 12);

    pg.clear();
    pg.fillStyle(0x88aacc, 1);
    pg.fillRect(1, 1, 10, 10);
    pg.fillStyle(0xaaccee, 1);
    pg.fillRect(3, 3, 6, 6);
    pg.generateTexture('loot_scrap', 12, 12);

    pg.clear();
    pg.fillStyle(0x44ff44, 1);
    pg.fillRect(3, 0, 6, 12);
    pg.fillRect(0, 3, 12, 6);
    pg.generateTexture('loot_health', 12, 12);

    pg.clear();
    pg.fillStyle(0xff8800, 1);
    pg.fillRect(2, 1, 8, 10);
    pg.fillStyle(0xffaa44, 1);
    pg.fillRect(4, 0, 4, 3);
    pg.generateTexture('loot_ammo', 12, 12);

    // Loot crate - use chest sprite if available
    pg.clear();
    pg.fillStyle(0xcc8833, 1);
    pg.fillRect(2, 4, 20, 16);
    pg.fillStyle(0xffaa44, 1);
    pg.fillRect(4, 6, 16, 12);
    pg.fillStyle(0xffdd00, 1);
    pg.fillRect(9, 9, 6, 6);
    pg.generateTexture('loot_crate', 24, 24);

    // Ghost loot
    pg.clear();
    pg.fillStyle(0x44ddff, 0.6);
    pg.fillCircle(8, 8, 8);
    pg.fillStyle(0xaaeeff, 0.3);
    pg.fillCircle(8, 8, 12);
    pg.generateTexture('ghost_loot', 24, 24);

    // Portal - use gate sprite overlay
    pg.clear();
    pg.lineStyle(3, 0x9944ff, 1);
    pg.strokeCircle(20, 20, 18);
    pg.lineStyle(2, 0xcc88ff, 0.7);
    pg.strokeCircle(20, 20, 12);
    pg.fillStyle(0x6622cc, 0.4);
    pg.fillCircle(20, 20, 10);
    pg.generateTexture('portal', 40, 40);

    // Arena wall - use wall sprite tint
    pg.clear();
    pg.fillStyle(0xaabbcc, 1);
    pg.fillRect(0, 0, 12, 12);
    pg.lineStyle(1, 0xddeeff, 1);
    pg.strokeRect(0, 0, 12, 12);
    pg.generateTexture('arena_wall', 12, 12);

    // Joystick
    pg.clear();
    pg.fillStyle(0xffffff, 0.15);
    pg.fillCircle(50, 50, 50);
    pg.lineStyle(2, 0xffffff, 0.3);
    pg.strokeCircle(50, 50, 50);
    pg.generateTexture('joystick_base', 100, 100);

    pg.clear();
    pg.fillStyle(0xffffff, 0.4);
    pg.fillCircle(25, 25, 25);
    pg.generateTexture('joystick_thumb', 50, 50);

    // Switch textures
    pg.clear();
    pg.fillStyle(0x333344, 1);
    pg.fillCircle(14, 14, 14);
    pg.lineStyle(2, 0x555566, 1);
    pg.strokeCircle(14, 14, 14);
    pg.generateTexture('switch_off', 28, 28);

    pg.clear();
    pg.fillStyle(0x33ff88, 1);
    pg.fillCircle(14, 14, 14);
    pg.fillStyle(0xaaffcc, 0.6);
    pg.fillCircle(14, 14, 8);
    pg.generateTexture('switch_on', 28, 28);

    pg.clear();
    pg.fillStyle(0xff3333, 1);
    pg.fillCircle(14, 14, 14);
    pg.generateTexture('switch_error', 28, 28);

    // Shield effect
    pg.clear();
    pg.lineStyle(3, 0x44ff88, 0.6);
    pg.strokeCircle(20, 20, 18);
    pg.generateTexture('shield_effect', 40, 40);

    // Maze wall / goal
    pg.clear();
    pg.fillStyle(0x4466aa, 0.7);
    pg.fillRect(0, 0, 40, 40);
    pg.generateTexture('maze_wall', 40, 40);

    pg.clear();
    pg.fillStyle(0x44ffaa, 0.8);
    pg.fillCircle(12, 12, 12);
    pg.generateTexture('maze_goal', 24, 24);

    pg.destroy();
  }
}
