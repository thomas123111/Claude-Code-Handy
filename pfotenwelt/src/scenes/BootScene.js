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

    // AI-generated backgrounds (Gemini)
    const bgs = ['shelter', 'vet', 'salon', 'school', 'hotel', 'cafe'];
    bgs.forEach((b) => this.load.image(`bg_${b}`, `assets/bg_${b}.png`));

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
    this.load.image('splash_screen', 'assets/splash_screen.png');
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
