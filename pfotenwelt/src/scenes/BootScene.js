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

    // AI-generated breed portraits (Gemini, kawaii style)
    const breeds = [
      'labrador', 'dackel', 'schaeferhund', 'golden', 'husky',
      'pudel', 'corgi', 'dalmatiner', 'samojede',
      'hauskatze', 'tiger_katze', 'schwarze', 'perser',
      'maine_coon', 'siam', 'bengal',
      'kaninchen', 'hamster', 'meerschwein',
    ];
    breeds.forEach((b) => this.load.image(`breed_${b}`, `assets/breed_${b}.png`));

    // AI-generated backgrounds (Gemini, compressed JPEG)
    const bgs = ['shelter', 'vet', 'salon', 'school', 'hotel', 'cafe'];
    bgs.forEach((b) => this.load.image(`bg_${b}`, `assets/bg_${b}.jpg`));

    // Building sprites (AI-generated, isometric)
    const buildings = ['shelter', 'vet', 'salon', 'school', 'hotel', 'cafe', 'guild', 'workshop'];
    buildings.forEach((b) => this.load.image(`bld_${b}`, `assets/bld_${b}.png`));

    // Town environment tiles (LimeZu Modern Exteriors, curated)
    this.load.image('lz_lamp', 'assets/tiles/lamp_1.png');
    this.load.image('lz_bench', 'assets/tiles/bench_1.png');
    this.load.image('lz_fountain', 'assets/tiles/fountain_lz.png');
    this.load.image('lz_hydrant', 'assets/tiles/hydrant.png');
    this.load.image('lz_trash', 'assets/tiles/trash.png');
    this.load.image('lz_car', 'assets/tiles/car.png');

    // Animated character spritesheets (LimeZu Modern Interiors Free)
    // Each sheet: 384x224, frames 16x32, 24 cols × 7 rows
    // Row 0: idle, Row 1: walk (all 4 dirs in one row, 6 frames each)
    // Direction order per row: Left(0-5), Down(6-11), Right(12-17), Up(18-23)
    this.load.spritesheet('char_adam', 'assets/chars/char_adam.png', { frameWidth: 16, frameHeight: 32 });
    this.load.spritesheet('char_amelia', 'assets/chars/char_amelia.png', { frameWidth: 16, frameHeight: 32 });
    this.load.spritesheet('char_alex', 'assets/chars/char_alex.png', { frameWidth: 16, frameHeight: 32 });
    this.load.spritesheet('char_bob', 'assets/chars/char_bob.png', { frameWidth: 16, frameHeight: 32 });

    // Farm animal spritesheets (LimeZu Modern Farm v1.2)
    // Dogs: 1152x416 → 48x32 frames, 24 cols × 13 rows (walk = row 4)
    this.load.spritesheet('farm_dog_lab', 'assets/farm/Dog_Labrador_Brown_16x16.png', { frameWidth: 48, frameHeight: 32 });
    this.load.spritesheet('farm_dog_shep', 'assets/farm/Dog_German_Shepherd_Brown_16x16.png', { frameWidth: 48, frameHeight: 32 });
    this.load.spritesheet('farm_dog_white', 'assets/farm/Dog_Labrador_White_16x16.png', { frameWidth: 48, frameHeight: 32 });
    // Small animals: 768x128 → 32x32 frames, 24 cols × 4 rows (walk = row 1)
    this.load.spritesheet('farm_rabbit', 'assets/farm/Rabbit_Brown_16x16.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('farm_rabbit_w', 'assets/farm/Rabbit_White_16x16.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('farm_piglet', 'assets/farm/Piglet_Pink_Light_16x16.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('farm_cow_baby', 'assets/farm/Cow_Baby_16x16.png', { frameWidth: 32, frameHeight: 32 });
    // Tiny animals: 384x64 → 16x16 frames, 24 cols × 4 rows (walk = row 1)
    this.load.spritesheet('farm_chicken', 'assets/farm/Chicken_Brown_16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('farm_duckling', 'assets/farm/Duckling_Yellow_16x16.png', { frameWidth: 16, frameHeight: 16 });

    // Farm building sprites (LimeZu Modern Farm, pre-composed singles)
    this.load.image('farm_barn', 'assets/farm/Barn_Small_16x16.png');
    this.load.image('farm_house', 'assets/farm/Farmer_House_1_16x16.png');
    this.load.image('farm_stable', 'assets/farm/Stable_Example_Outside_16x16.png');
    this.load.image('farm_coop', 'assets/farm/Chicken_Coop_16x16.png');
    this.load.image('farm_henhouse', 'assets/farm/Henhouse_16x16.png');
    this.load.image('farm_silo', 'assets/farm/Silos_1_16x16.png');
    this.load.image('farm_doghouse', 'assets/farm/Doghouse_Bone_16x16.png');
    this.load.image('farm_trough', 'assets/farm/Drinking_Trough_Horizontal_Full_16x16.png');

    // Town environment sprites
    this.load.image('env_fountain', 'assets/env_fountain.png');
    this.load.image('env_tree_big', 'assets/env_tree_big.png');
    this.load.image('env_tree_small', 'assets/env_tree_small.png');
    this.load.image('env_bench', 'assets/env_bench.png');
    this.load.image('env_lamppost', 'assets/env_lamppost.png');
    this.load.image('env_flowerbed', 'assets/env_flowerbed.png');
    this.load.image('tile_grass', 'assets/tile_grass.png');
    this.load.image('tile_path', 'assets/tile_path.png');

    // AI-generated item icons (Gemini)
    const items = ['kibble', 'treat', 'bowl', 'premium_food', 'feast',
      'yarn', 'ball', 'plush', 'cattree', 'playground',
      'bandage', 'medicine', 'medkit', 'soap', 'brush', 'shampoo',
      'blanket', 'cushion', 'bed'];
    items.forEach((i) => this.load.image(`item_${i}`, `assets/item_${i}.png`));

    // AI-generated UI icons (Gemini)
    this.load.image('ui_heart', 'assets/ui_heart.png');
    this.load.image('ui_energy', 'assets/ui_energy.png');
    this.load.image('ui_star', 'assets/ui_star.png');
    this.load.image('ui_coin', 'assets/ui_coin.png');
    this.load.image('ui_paw', 'assets/ui_paw.png');

    // App icon + splash
    this.load.image('icon_app', 'assets/icon_app.png');
    this.load.image('splash_screen', 'assets/splash_screen.jpg');
  }

  create() {
    // === UNIFIED ANIMATION SETUP ===
    // LimeZu spritesheets: 6 frames per direction, 4 directions per row = 24 frames
    // RPG Maker standard direction order: Down(0-5), Left(6-11), Right(12-17), Up(18-23)
    const COLS = 24;

    // Helper: create walk animations for a sprite key at a given row
    const createWalkAnims = (key, walkRow) => {
      if (!this.textures.exists(key)) return;
      const base = walkRow * COLS;
      this.anims.create({ key: `${key}_walk_down`, frames: this.anims.generateFrameNumbers(key, { start: base, end: base + 5 }), frameRate: 8, repeat: -1 });
      this.anims.create({ key: `${key}_walk_left`, frames: this.anims.generateFrameNumbers(key, { start: base + 6, end: base + 11 }), frameRate: 8, repeat: -1 });
      this.anims.create({ key: `${key}_walk_right`, frames: this.anims.generateFrameNumbers(key, { start: base + 12, end: base + 17 }), frameRate: 8, repeat: -1 });
      this.anims.create({ key: `${key}_walk_up`, frames: this.anims.generateFrameNumbers(key, { start: base + 18, end: base + 23 }), frameRate: 8, repeat: -1 });
      this.anims.create({ key: `${key}_idle`, frames: [{ key, frame: 0 }], frameRate: 1 });
    };

    // Characters (16x32 frames, 7 rows): walk = row 1
    ['char_adam', 'char_amelia', 'char_alex', 'char_bob'].forEach((k) => createWalkAnims(k, 1));

    // Dogs (48x32 frames, 13 rows): walk = row 4 (after preview, IDLE label, IDLE, WALK label)
    ['farm_dog_lab', 'farm_dog_shep', 'farm_dog_white'].forEach((k) => createWalkAnims(k, 4));

    // Small animals (32x32, 4 rows) + Tiny animals (16x16, 4 rows): walk = row 1
    ['farm_rabbit', 'farm_rabbit_w', 'farm_piglet', 'farm_cow_baby', 'farm_chicken', 'farm_duckling'].forEach((k) => createWalkAnims(k, 1));

    // Generate procedural textures for things without sprites
    const pg = this.add.graphics();

    // Farm building (barn) — procedural since we don't have a bld_farm.png
    pg.fillStyle(0x8B4513, 1); // brown barn base
    pg.fillRect(10, 40, 100, 70);
    pg.fillStyle(0xA0522D, 1); // lighter siding
    pg.fillRect(15, 45, 90, 60);
    pg.fillStyle(0xCC3333, 1); // red roof
    pg.beginPath();
    pg.moveTo(0, 42); pg.lineTo(60, 5); pg.lineTo(120, 42);
    pg.closePath(); pg.fill();
    pg.fillStyle(0xDD4444, 1); // roof highlight
    pg.beginPath();
    pg.moveTo(10, 42); pg.lineTo(60, 12); pg.lineTo(110, 42);
    pg.closePath(); pg.fill();
    pg.fillStyle(0x654321, 1); // barn door
    pg.fillRect(42, 65, 36, 45);
    pg.fillStyle(0x4a3520, 1); // door frame
    pg.fillRect(42, 65, 36, 3);
    pg.fillRect(42, 65, 3, 45);
    pg.fillRect(75, 65, 3, 45);
    pg.fillStyle(0xFFD700, 1); // hay window
    pg.fillRect(50, 30, 20, 12);
    pg.fillStyle(0xDAA520, 1);
    pg.fillRect(20, 55, 15, 12);
    pg.fillRect(85, 55, 15, 12);
    pg.generateTexture('bld_farm', 120, 110);
    pg.clear();

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
