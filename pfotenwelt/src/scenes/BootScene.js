import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const { width, height } = this.scale;
    // Loading bar
    const bar = this.add.rectangle(width / 2, height / 2 + 20, 200, 16, 0x333333);
    const fill = this.add.rectangle(width / 2 - 98, height / 2 + 20, 0, 12, 0xffaa44).setOrigin(0, 0.5);
    this.add.text(width / 2, height / 2 - 20, '🐾 Pfotenwelt', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#ffcc88',
    }).setOrigin(0.5);
    this.load.on('progress', (p) => { fill.width = 196 * p; });

    // Pet sprites (Kenney Tiny Dungeon CC0 - used as pet avatars)
    this.load.image('pet_cat', 'assets/pet_mage.png');
    this.load.image('pet_dog', 'assets/pet_warrior.png');
    this.load.image('pet_small', 'assets/pet_monk.png');
    this.load.image('pet_big_dog', 'assets/pet_bear.png');
    this.load.image('pet_cute', 'assets/pet_slime.png');
    this.load.image('pet_guard', 'assets/pet_knight.png');

    // Item sprites
    this.load.image('potion_red', 'assets/potion_red.png');
    this.load.image('potion_blue', 'assets/potion_blue.png');
    this.load.image('chest', 'assets/chest.png');
    this.load.image('door', 'assets/door.png');

    // UI sprites (Kenney RPG UI CC0)
    this.load.image('panel_brown', 'assets/panel_brown.png');
    this.load.image('panel_beige', 'assets/panel_beige.png');
    this.load.image('btn_brown', 'assets/btn_brown.png');
    this.load.image('btn_blue', 'assets/btn_blue.png');

    // Town tiles (Kenney Tiny Town CC0)
    this.load.image('coin', 'assets/town_104.png');
    this.load.image('key', 'assets/town_105.png');
    this.load.image('cup', 'assets/town_107.png');
    this.load.image('house_1', 'assets/town_72.png');
    this.load.image('house_2', 'assets/town_73.png');
    this.load.image('house_3', 'assets/town_76.png');
    this.load.image('shop', 'assets/town_80.png');
    this.load.image('tree_1', 'assets/town_86.png');
    this.load.image('tree_2', 'assets/town_87.png');
    this.load.image('flower', 'assets/town_92.png');
  }

  create() {
    // Generate procedural textures for things without sprites
    const pg = this.add.graphics();

    // Heart icon
    pg.fillStyle(0xff4466, 1);
    pg.fillCircle(6, 5, 5);
    pg.fillCircle(14, 5, 5);
    pg.beginPath();
    pg.moveTo(1, 7); pg.lineTo(10, 18); pg.lineTo(19, 7);
    pg.closePath(); pg.fill();
    pg.generateTexture('heart_icon', 20, 20);

    // Energy bolt
    pg.clear();
    pg.fillStyle(0xffcc00, 1);
    pg.beginPath();
    pg.moveTo(12, 0); pg.lineTo(4, 10); pg.lineTo(9, 10);
    pg.lineTo(6, 20); pg.lineTo(16, 8); pg.lineTo(11, 8);
    pg.closePath(); pg.fill();
    pg.generateTexture('energy_icon', 20, 20);

    // Star
    pg.clear();
    pg.fillStyle(0xffdd00, 1);
    pg.fillCircle(8, 8, 8);
    pg.fillStyle(0xffffff, 0.5);
    pg.fillCircle(6, 6, 3);
    pg.generateTexture('star', 16, 16);

    // Paw print
    pg.clear();
    pg.fillStyle(0xddaa66, 1);
    pg.fillCircle(8, 12, 5);
    pg.fillCircle(4, 5, 3);
    pg.fillCircle(12, 5, 3);
    pg.fillCircle(8, 3, 2);
    pg.generateTexture('paw', 16, 16);

    pg.destroy();

    this.scene.start('Menu');
  }
}
