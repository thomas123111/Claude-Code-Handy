import Phaser from 'phaser';
import { loadSave, writeSave, regenerateEnergy } from '../data/SaveManager.js';
import { startMusic, stopMusic, unlockAudio } from '../audio/MusicManager.js';

// Town layout: buildings placed on a grid with exact positions
// Map is 1200x1700 (scrollable, larger than screen — includes farm area)
const MAP_W = 1200;
const MAP_H = 1700;

const BUILDINGS = [
  // Tierheim oben mittig = die Basis
  { id: 'shelter', key: 'Shelter', name: 'Tierheim', tex: 'bld_shelter',
    x: 600, y: 200, scale: 1.1, unlockCost: 0, unlocked: true },
  // Werkstatt links oben
  { id: 'merge', key: 'MergeBoard', name: 'Werkstatt', tex: 'bld_workshop',
    x: 200, y: 350, scale: 1.0, unlockCost: 0, unlocked: true },
  // Tierarzt rechts oben
  { id: 'vet', key: 'Vet', name: 'Tierarzt', tex: 'bld_vet',
    x: 1000, y: 350, scale: 1.0, unlockCost: 0, unlocked: true },
  // Salon links mitte
  { id: 'salon', key: 'Salon', name: 'Salon', tex: 'bld_salon',
    x: 200, y: 750, scale: 1.0, unlockCost: 0, unlocked: true },
  // Hundeschule rechts mitte
  { id: 'school', key: 'School', name: 'Schule', tex: 'bld_school',
    x: 1000, y: 750, scale: 1.0, unlockCost: 0, unlocked: true },
  // Hotel links unten
  { id: 'hotel', key: 'Hotel', name: 'Pension', tex: 'bld_hotel',
    x: 200, y: 1100, scale: 1.0, unlockCost: 0, unlocked: true },
  // Café rechts unten
  { id: 'cafe', key: 'Cafe', name: 'Café', tex: 'bld_cafe',
    x: 1000, y: 1100, scale: 1.0, unlockCost: 0, unlocked: true },
  // Gilde unten mitte
  { id: 'guild', key: 'Guild', name: 'Gilde', tex: 'bld_guild',
    x: 600, y: 1250, scale: 1.0, unlockCost: 0, unlocked: true },
  // Bauernhof — neues Nachbar-Gebiet ganz unten
  { id: 'farm', key: 'Farm', name: '🌾 Bauernhof', tex: 'bld_farm',
    x: 600, y: 1550, scale: 1.2, unlockCost: 0, unlocked: true },
];

// Decoration - trees placed BETWEEN buildings, never on paths
const TREES = [
  // Top corners
  { x: 80, y: 150, type: 'big' }, { x: 1120, y: 150, type: 'big' },
  // Left side between buildings
  { x: 80, y: 550, type: 'small' }, { x: 80, y: 950, type: 'small' },
  // Right side between buildings
  { x: 1120, y: 550, type: 'small' }, { x: 1120, y: 950, type: 'small' },
  // Around fountain area (not on paths)
  { x: 400, y: 500, type: 'small' }, { x: 800, y: 500, type: 'small' },
  { x: 400, y: 700, type: 'small' }, { x: 800, y: 700, type: 'small' },
  // Bottom corners
  { x: 80, y: 1300, type: 'big' }, { x: 1120, y: 1300, type: 'big' },
];

const DECOR = [
  // Fountain CENTER with plaza
  { x: 600, y: 600, tex: 'env_fountain', scale: 1.0 },
  // Benches near fountain plaza
  { x: 480, y: 600, tex: 'env_bench', scale: 0.6 },
  { x: 720, y: 600, tex: 'env_bench', scale: 0.6 },
  // Lampposts along main paths
  { x: 350, y: 200, tex: 'env_lamppost', scale: 0.5 },
  { x: 850, y: 200, tex: 'env_lamppost', scale: 0.5 },
  { x: 350, y: 1100, tex: 'env_lamppost', scale: 0.5 },
  { x: 850, y: 1100, tex: 'env_lamppost', scale: 0.5 },
  // Flowerbeds near buildings
  { x: 320, y: 280, tex: 'env_flowerbed', scale: 0.5 },
  { x: 880, y: 280, tex: 'env_flowerbed', scale: 0.5 },
  { x: 600, y: 1000, tex: 'env_flowerbed', scale: 0.5 },
];

export class TownScene extends Phaser.Scene {
  constructor() { super('Town'); }

  create() {
    this.save = loadSave();
    regenerateEnergy(this.save);
    const { width, height } = this.scale;

    // Fade in
    this.cameras.main.fadeIn(400, 26, 21, 35);

    // Camera setup
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.centerOn(MAP_W / 2, 400);
    this.cameras.main.setZoom(Math.min(width / MAP_W * 1.8, 1.2));

    // === GREEN GRASS BACKGROUND (solid + subtle noise) ===
    this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x5a9a42).setDepth(0);
    // Add subtle variation patches (no tiling artifacts)
    for (let i = 0; i < 30; i++) {
      const gx = Phaser.Math.Between(0, MAP_W);
      const gy = Phaser.Math.Between(0, MAP_H);
      const shade = Phaser.Math.Between(0x4a8a3a, 0x6aaa52);
      this.add.circle(gx, gy, Phaser.Math.Between(40, 100), shade, 0.15).setDepth(0);
    }

    // === PATHS leading TO buildings (not through them) ===
    const pathColor = 0xc4a76c;

    // Central vertical main road (spine of the town — extends to farm)
    this.drawPath(600, 280, 600, 1480, pathColor);

    // Horizontal branches from main road to buildings
    // Top: main road → Werkstatt (left) and Tierarzt (right)
    this.drawPath(250, 350, 600, 350, pathColor);
    this.drawPath(600, 350, 950, 350, pathColor);

    // Middle: main road → Salon (left) and Schule (right)
    this.drawPath(250, 750, 600, 750, pathColor);
    this.drawPath(600, 750, 950, 750, pathColor);

    // Bottom: main road → Hotel (left) and Café (right)
    this.drawPath(250, 1100, 600, 1100, pathColor);
    this.drawPath(600, 1100, 950, 1100, pathColor);

    // Fountain plaza - circular-ish area around center
    this.add.circle(600, 600, 100, pathColor, 0.35).setDepth(0);
    this.add.circle(600, 600, 110, 0x8a7a5a, 0.12).setDepth(0);

    // === FARM AREA (bottom section) ===
    // Farm ground (lighter green, tilled earth)
    this.add.rectangle(600, 1550, 800, 250, 0x4a7a32).setDepth(0);
    // Fence around farm area
    const fenceColor = 0x8B6B3A;
    for (let fx = 220; fx <= 980; fx += 40) {
      this.add.rectangle(fx, 1430, 4, 16, fenceColor).setDepth(1);
      this.add.rectangle(fx, 1436, 40, 3, fenceColor).setDepth(1);
      this.add.rectangle(fx, 1426, 40, 3, fenceColor).setDepth(1);
    }
    // Farm fields (crop rows)
    for (let fy = 1470; fy <= 1600; fy += 22) {
      this.add.rectangle(350, fy, 200, 8, 0x6a5a2a, 0.4).setDepth(0);
      this.add.rectangle(850, fy, 200, 8, 0x6a5a2a, 0.4).setDepth(0);
      // Little green crops
      for (let cx = 260; cx <= 440; cx += 20) {
        this.add.circle(cx, fy - 3, 4, 0x55aa33, 0.6).setDepth(0);
      }
      for (let cx = 760; cx <= 940; cx += 20) {
        this.add.circle(cx, fy - 3, 4, 0x55aa33, 0.6).setDepth(0);
      }
    }
    // Gate opening in fence (at path)
    this.add.rectangle(600, 1430, 60, 20, 0x4a7a32).setDepth(1);
    // "Bauernhof" sign
    this.add.text(600, 1420, '🌾', { fontSize: '18px' }).setOrigin(0.5).setDepth(200);

    // Farm-area path branch to building
    this.drawPath(400, 1550, 600, 1550, pathColor);
    this.drawPath(600, 1550, 800, 1550, pathColor);

    // === DECORATIONS (Y-sorted like buildings) ===
    TREES.forEach((t) => {
      const tex = t.type === 'big' ? 'env_tree_big' : 'env_tree_small';
      if (this.textures.exists(tex)) {
        const treeDepth = 10 + Math.round(t.y / 10);
        this.add.image(t.x, t.y, tex).setScale(t.type === 'big' ? 0.8 : 0.5).setDepth(treeDepth);
      }
    });

    DECOR.forEach((d) => {
      if (this.textures.exists(d.tex)) {
        const decorDepth = 10 + Math.round(d.y / 10);
        this.add.image(d.x, d.y, d.tex).setScale(d.scale).setDepth(decorDepth);
      }
    });

    // === BUILDINGS ===
    this.buildingSprites = [];
    BUILDINGS.forEach((b) => {
      const isUnlocked = b.unlocked || (this.save.stations[b.id] && this.save.stations[b.id].unlocked);

      if (this.textures.exists(b.tex)) {
        // Y-sort: building depth based on bottom edge so walkers can go behind/in front
        const bldDepth = 10 + Math.round((b.y + 50) / 10);
        const img = this.add.image(b.x, b.y, b.tex).setScale(b.scale).setDepth(bldDepth);

        if (!isUnlocked) {
          img.setTint(0x444444); // greyed out
          img.setAlpha(0.6);
        }

        b._sprite = img;
      }

      // Name label (above Y-sort layer)
      this.add.text(b.x, b.y + 70, b.name, {
        fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
        backgroundColor: '#00000088', padding: { x: 8, y: 3 },
      }).setOrigin(0.5).setDepth(200);

      if (!isUnlocked) {
        // Lock + cost
        this.add.text(b.x, b.y - 10, '🔒', { fontSize: '28px' }).setOrigin(0.5).setDepth(201);
        this.add.text(b.x, b.y + 25, `${b.unlockCost}❤️`, {
          fontSize: '12px', fontFamily: 'monospace', color: '#ffaa44', fontStyle: 'bold',
          backgroundColor: '#00000066', padding: { x: 4, y: 2 },
        }).setOrigin(0.5).setDepth(201);
      } else if (b.id === 'shelter' && this.save.pets.length > 0) {
        // Pet count badge
        this.add.circle(b.x + 55, b.y - 55, 14, 0xff4466).setDepth(202);
        this.add.text(b.x + 55, b.y - 55, `${this.save.pets.length}`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(203);
      }
    });

    // === AMBIENT EFFECTS ===
    // Fountain sparkle
    if (this.textures.exists('env_fountain')) {
      this.time.addEvent({
        delay: 500, loop: true,
        callback: () => {
          const sparkle = this.add.circle(
            600 + Phaser.Math.Between(-12, 12), 590 + Phaser.Math.Between(-8, 8),
            2, 0x88ddff, 0.6
          ).setDepth(4);
          this.tweens.add({
            targets: sparkle, y: sparkle.y - 15, alpha: 0,
            duration: 800, onComplete: () => sparkle.destroy(),
          });
        },
      });
    }

    // Chimney smoke on shelter and cafe
    // Chimney smoke on shelter (top) and cafe (right bottom)
    [[600, 150], [1000, 1050]].forEach(([sx, sy]) => {
      this.time.addEvent({
        delay: 1000, loop: true,
        callback: () => {
          const smoke = this.add.circle(sx + Phaser.Math.Between(-3, 3), sy, 3, 0xffffff, 0.2).setDepth(4);
          this.tweens.add({
            targets: smoke,
            y: sy - 30, x: sx + Phaser.Math.Between(-8, 8),
            alpha: 0, scale: 2.5, duration: 2000,
            onComplete: () => smoke.destroy(),
          });
        },
      });
    });

    // === LIVING CITY - animated LimeZu character sprites ===
    this.walkers = [];
    const charKeys = ['char_adam', 'char_amelia', 'char_alex', 'char_bob'];
    const walkerPaths = [
      [[200, 350], [600, 350], [600, 600], [200, 600], [200, 350]],
      [[1000, 350], [600, 350], [600, 750], [1000, 750], [1000, 350]],
      [[200, 750], [600, 750], [600, 1100], [200, 1100], [200, 750]],
      [[1000, 750], [600, 1100], [600, 1250], [1000, 1100], [1000, 750]],
    ];

    charKeys.forEach((key, i) => {
      if (!this.textures.exists(key)) return;
      const path = walkerPaths[i % walkerPaths.length];
      const start = path[0];
      const next = path[1];
      const sprite = this.add.sprite(start[0], start[1], key)
        .setScale(2.5);
      // depth is set dynamically via Y-sorting in update()

      // Set correct initial direction based on first path segment
      const initDx = next[0] - start[0];
      const initDy = next[1] - start[1];
      const initDir = this.getWalkDirection(initDx, initDy);
      sprite.play(`${key}_walk_${initDir}`);

      this.walkers.push({
        sprite, key, path,
        targetIdx: 1,
        speed: Phaser.Math.Between(25, 40),
        currentDir: initDir,
      });
    });

    // === ROAMING PETS — LimeZu Modern Farm animated sprites ===
    this.roamingPets = [];
    const petSpriteConfigs = [
      // Dogs patrol along main paths
      { key: 'farm_dog_lab', scale: 2.0, paths: [[150, 350], [600, 350], [600, 600], [150, 600]], speed: 38 },
      { key: 'farm_dog_shep', scale: 2.0, paths: [[1000, 350], [600, 350], [600, 750], [1000, 750]], speed: 32 },
      { key: 'farm_dog_white', scale: 2.0, paths: [[600, 200], [600, 600], [1000, 600], [1000, 200]], speed: 35 },
      // Rabbits hop around the fountain plaza
      { key: 'farm_rabbit', scale: 2.5, paths: [[450, 500], [600, 600], [750, 500], [600, 450]], speed: 28 },
      { key: 'farm_rabbit_w', scale: 2.5, paths: [[750, 700], [600, 600], [450, 700], [600, 750]], speed: 25 },
      // Duckling near fountain
      { key: 'farm_duckling', scale: 3.0, paths: [[550, 580], [650, 620], [620, 560], [560, 610]], speed: 18 },
      // Chicken wanders near cafe/guild
      { key: 'farm_chicken', scale: 3.0, paths: [[800, 1100], [600, 1100], [600, 1200], [800, 1200]], speed: 22 },
    ];

    petSpriteConfigs.forEach((cfg) => {
      if (!this.textures.exists(cfg.key)) return;
      const start = cfg.paths[0];
      const next = cfg.paths[1];
      const pet = this.add.sprite(start[0], start[1], cfg.key).setScale(cfg.scale);
      const shadow = this.add.ellipse(start[0], start[1] + 10, 20, 7, 0x000000, 0.2).setDepth(1);

      // Set initial direction
      const initDx = next[0] - start[0];
      const initDy = next[1] - start[1];
      const initDir = this.getWalkDirection(initDx, initDy);
      const animKey = `${cfg.key}_walk_${initDir}`;
      if (this.anims.exists(animKey)) pet.play(animKey);

      this.roamingPets.push({
        sprite: pet, shadow, key: cfg.key, path: cfg.paths,
        targetIdx: 1, speed: cfg.speed, currentDir: initDir,
      });
    });

    // LimeZu environment props on paths
    const lzProps = [
      { x: 350, y: 200, tex: 'lz_lamp', scale: 2 },
      { x: 850, y: 200, tex: 'lz_lamp', scale: 2 },
      { x: 350, y: 1100, tex: 'lz_lamp', scale: 2 },
      { x: 850, y: 1100, tex: 'lz_lamp', scale: 2 },
      { x: 480, y: 600, tex: 'lz_bench', scale: 2 },
      { x: 720, y: 600, tex: 'lz_bench', scale: 2 },
      { x: 600, y: 600, tex: 'lz_fountain', scale: 2.5 },
      { x: 400, y: 450, tex: 'lz_hydrant', scale: 2 },
      { x: 800, y: 850, tex: 'lz_trash', scale: 2 },
    ];
    lzProps.forEach((p) => {
      if (this.textures.exists(p.tex)) {
        const propDepth = 10 + Math.round(p.y / 10);
        this.add.image(p.x, p.y, p.tex).setScale(p.scale).setDepth(propDepth);
      }
    });

    // === HUD (fixed to camera) ===
    this.add.rectangle(width / 2, 0, width, 50, 0x2a1f35, 0.92).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);
    this.add.text(width / 2, 15, '🐾 Pfotenwelt', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.add.text(12, 8, `❤️ ${this.save.hearts}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff6688',
    }).setScrollFactor(0).setDepth(51);
    this.add.text(12, 28, `⚡ ${this.save.energy}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffcc00',
    }).setScrollFactor(0).setDepth(51);
    this.add.text(width - 12, 15, `Lv.${this.save.level}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#88ccff', fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51);

    // Bottom bar
    this.add.rectangle(width / 2, height - 38, width, 42, 0x2a1f35, 0.9).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);
    this.add.text(width / 2, height - 20, `🎁 ${this.save.totalDonatedKg.toFixed(1)}kg gespendet | 📅 Tag ${this.save.loginStreak}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#88cc88',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    // === MUSIC ===
    if (this.save.musicOn !== false) {
      this.input.once('pointerdown', () => {
        unlockAudio();
        startMusic('town');
      });
    }

    // Music toggle button (top-right in HUD)
    const musicIcon = this.save.musicOn !== false ? '🎵' : '🔇';
    const musicBtn = this.add.text(width - 40, 35, musicIcon, {
      fontSize: '16px',
    }).setScrollFactor(0).setDepth(52).setInteractive();
    musicBtn.on('pointerdown', () => {
      this.save.musicOn = !(this.save.musicOn !== false);
      writeSave(this.save);
      if (this.save.musicOn) {
        unlockAudio();
        startMusic('town');
        musicBtn.setText('🎵');
      } else {
        stopMusic();
        musicBtn.setText('🔇');
      }
    });

    // === INPUT: Drag to scroll, tap buildings ===
    this.isDragging = false;
    this.dragMoved = false;
    this.lastPinchDist = 0;

    this.input.on('pointerdown', (pointer) => {
      this.isDragging = true;
      this.dragMoved = false;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.camStartX = this.cameras.main.scrollX;
      this.camStartY = this.cameras.main.scrollY;
    });

    this.input.on('pointermove', (pointer) => {
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        const p1 = this.input.pointer1;
        const p2 = this.input.pointer2;
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        if (this.lastPinchDist > 0) {
          const newZoom = Phaser.Math.Clamp(
            this.cameras.main.zoom + (dist - this.lastPinchDist) * 0.004, 0.5, 2.5
          );
          this.cameras.main.setZoom(newZoom);
        }
        this.lastPinchDist = dist;
        this.dragMoved = true;
        return;
      }
      this.lastPinchDist = 0;

      if (!this.isDragging) return;
      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) this.dragMoved = true;
      if (this.dragMoved) {
        const z = this.cameras.main.zoom;
        this.cameras.main.scrollX = this.camStartX - dx / z;
        this.cameras.main.scrollY = this.camStartY - dy / z;
      }
    });

    this.input.on('pointerup', (pointer) => {
      this.isDragging = false;
      this.lastPinchDist = 0;
      if (this.dragMoved) return;

      const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      // Check building taps - the tap zone IS the sprite image
      for (const b of BUILDINGS) {
        if (!b._sprite) continue;
        const bx = b.x, by = b.y;
        const halfW = 60, halfH = 70; // approximate clickable area
        if (wp.x >= bx - halfW && wp.x <= bx + halfW &&
            wp.y >= by - halfH && wp.y <= by + halfH) {
          const isUnlocked = b.unlocked || (this.save.stations[b.id] && this.save.stations[b.id].unlocked);
          if (isUnlocked) {
            // Bounce animation then fade-out and enter
            this.tweens.add({
              targets: b._sprite, scale: { from: b.scale, to: b.scale * 1.1 },
              duration: 100, yoyo: true,
              onComplete: () => {
                this.cameras.main.fadeOut(300, 26, 21, 35);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                  this.scene.start(b.key);
                });
              },
            });
          } else if (this.save.hearts >= b.unlockCost) {
            this.unlockBuilding(b);
          }
          return;
        }
      }

      // Double-tap zoom
      const now = Date.now();
      if (this.lastTapTime && now - this.lastTapTime < 300) {
        const targetZoom = this.cameras.main.zoom < 1.2 ? 1.8 : 0.8;
        this.tweens.add({
          targets: this.cameras.main, zoom: targetZoom, duration: 300, ease: 'Cubic.Out',
        });
        this.lastTapTime = 0;
      } else {
        this.lastTapTime = now;
      }
    });
  }

  drawPath(x1, y1, x2, y2, color) {
    const isHorizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1);
    const pathW = 50;
    const w = isHorizontal ? Math.abs(x2 - x1) : pathW;
    const h = isHorizontal ? pathW : Math.abs(y2 - y1);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    // Path edge (darker)
    this.add.rectangle(cx, cy, w + 6, h + 6, 0x7a6a4a, 0.5).setDepth(0);
    // Path fill
    this.add.rectangle(cx, cy, w, h, color, 0.6).setDepth(0);
    // Center line (subtle lighter)
    const cw = isHorizontal ? w - 20 : 4;
    const ch = isHorizontal ? 4 : h - 20;
    this.add.rectangle(cx, cy, cw, ch, 0xddccaa, 0.15).setDepth(0);
  }

  unlockBuilding(b) {
    this.save.hearts -= b.unlockCost;
    if (!this.save.stations[b.id]) this.save.stations[b.id] = {};
    this.save.stations[b.id].unlocked = true;
    this.save.stations[b.id].level = 1;
    writeSave(this.save);

    // Celebration
    if (b._sprite) {
      b._sprite.clearTint();
      b._sprite.setAlpha(1);
      this.tweens.add({
        targets: b._sprite, scale: { from: 0.5, to: 1.0 },
        duration: 500, ease: 'Back.Out',
      });
    }
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const star = this.add.text(b.x, b.y, '⭐', { fontSize: '16px' }).setOrigin(0.5).setDepth(20);
      this.tweens.add({
        targets: star,
        x: b.x + Math.cos(angle) * 70, y: b.y + Math.sin(angle) * 70,
        alpha: 0, duration: 700, onComplete: () => star.destroy(),
      });
    }
    this.time.delayedCall(800, () => this.scene.restart());
  }

  // Helper: determine walk direction from delta, with dead zone to prevent flicker
  getWalkDirection(dx, dy) {
    // Use a threshold ratio to prevent flickering when dx ≈ dy
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx > absDy * 1.2) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
  }

  update(time, delta) {
    if (!this.walkers) return;

    // Collect all Y-sortable objects (walkers + buildings) for proper depth
    // Buildings get depth based on their bottom edge (y + half height)
    // Walkers get depth based on their y position
    this.walkers.forEach((w) => {
      const target = w.path[w.targetIdx];
      const dx = target[0] - w.sprite.x;
      const dy = target[1] - w.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        w.targetIdx = (w.targetIdx + 1) % w.path.length;
        const next = w.path[w.targetIdx];
        const ndx = next[0] - w.sprite.x;
        const ndy = next[1] - w.sprite.y;
        const newDir = this.getWalkDirection(ndx, ndy);
        if (newDir !== w.currentDir) {
          w.currentDir = newDir;
          w.sprite.play(`${w.key}_walk_${newDir}`, true);
        }
      } else {
        const spd = w.speed * (delta / 1000);
        w.sprite.x += (dx / dist) * spd;
        w.sprite.y += (dy / dist) * spd;
      }

      // Y-sort: depth based on Y position (higher Y = closer to camera = higher depth)
      // Base depth 10 + normalized Y so walkers sort among themselves and with buildings
      w.sprite.setDepth(10 + Math.round(w.sprite.y / 10));
    });

    // Update roaming pets (same logic as human walkers)
    if (this.roamingPets) {
      this.roamingPets.forEach((p) => {
        const target = p.path[p.targetIdx];
        const dx = target[0] - p.sprite.x;
        const dy = target[1] - p.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
          p.targetIdx = (p.targetIdx + 1) % p.path.length;
          const next = p.path[p.targetIdx];
          const ndx = next[0] - p.sprite.x;
          const ndy = next[1] - p.sprite.y;
          const newDir = this.getWalkDirection(ndx, ndy);
          if (newDir !== p.currentDir) {
            p.currentDir = newDir;
            const animKey = `${p.key}_walk_${newDir}`;
            if (this.anims.exists(animKey)) p.sprite.play(animKey, true);
          }
        } else {
          const spd = p.speed * (delta / 1000);
          p.sprite.x += (dx / dist) * spd;
          p.sprite.y += (dy / dist) * spd;
        }

        // Shadow follows pet
        p.shadow.setPosition(p.sprite.x, p.sprite.y + 10);
        // Y-sort pets
        p.sprite.setDepth(10 + Math.round(p.sprite.y / 10));
        p.shadow.setDepth(1);
      });
    }
  }
}
