import Phaser from 'phaser';
import { loadSave, writeSave, regenerateEnergy } from '../data/SaveManager.js';
import { shouldTriggerEvent, getRandomEvent } from '../data/EventData.js';
import { processNPCHelp } from '../data/GuildData.js';

// All station buildings with positions on the 1024x1024 town map
// Coordinates are in world-space (map pixels)
const BUILDINGS = [
  {
    id: 'shelter', key: 'Shelter', name: 'Tierheim', emoji: '🏠',
    x: 200, y: 180, w: 120, h: 100,
    unlockCost: 0, unlocked: true,
    desc: 'Pflege & vermittle Tiere',
  },
  {
    id: 'merge', key: 'MergeBoard', name: 'Werkstatt', emoji: '🧩',
    x: 500, y: 150, w: 110, h: 90,
    unlockCost: 0, unlocked: true,
    desc: 'Items herstellen',
  },
  {
    id: 'vet', key: 'Vet', name: 'Tierarzt', emoji: '🏥',
    x: 800, y: 200, w: 110, h: 90,
    unlockCost: 200,
    desc: 'Heile kranke Tiere',
  },
  {
    id: 'salon', key: 'Salon', name: 'Tiersalon', emoji: '✂️',
    x: 150, y: 500, w: 110, h: 90,
    unlockCost: 350,
    desc: 'Pflege & Style',
  },
  {
    id: 'school', key: 'School', name: 'Hundeschule', emoji: '🎓',
    x: 500, y: 550, w: 110, h: 90,
    unlockCost: 500,
    desc: 'Trainiere Tricks',
  },
  {
    id: 'hotel', key: 'Hotel', name: 'Tierpension', emoji: '🏨',
    x: 830, y: 500, w: 110, h: 90,
    unlockCost: 800,
    desc: 'Passive Einnahmen',
  },
  {
    id: 'cafe', key: 'Cafe', name: 'Tier-Café', emoji: '☕',
    x: 350, y: 380, w: 100, h: 80,
    unlockCost: 1200,
    desc: 'Besucher & Herzen',
  },
  {
    id: 'guild', key: 'Guild', name: 'Gilde', emoji: '🤝',
    x: 700, y: 380, w: 100, h: 80,
    unlockCost: 300,
    desc: 'Helfer & Gemeinschaft',
  },
];

// Animated NPC walker paths (world coordinates)
const WALKER_PATHS = [
  // Person walking dog horizontally
  { type: 'dog_walker', emoji: '🚶‍♀️🐕', speed: 20, path: [[50, 350], [950, 350]] },
  // Cat sitting, occasionally moves
  { type: 'cat', emoji: '🐱', speed: 8, path: [[680, 280], [720, 260], [700, 300], [680, 280]] },
  // Person jogging with dog
  { type: 'jogger', emoji: '🏃‍♂️🐕', speed: 40, path: [[900, 700], [100, 700]] },
  // Car driving
  { type: 'car', emoji: '🚗', speed: 60, path: [[0, 620], [1024, 620]] },
  // Another dog walker vertical
  { type: 'dog_walker2', emoji: '🚶‍♂️🦮', speed: 15, path: [[400, 50], [400, 950]] },
  // Bird flying
  { type: 'bird', emoji: '🐦', speed: 35, path: [[100, 80], [900, 120], [500, 60], [100, 80]] },
  // Kid playing
  { type: 'kid', emoji: '👧', speed: 12, path: [[250, 650], [350, 680], [300, 720], [250, 650]] },
  // Another cat
  { type: 'cat2', emoji: '🐈', speed: 6, path: [[820, 440], [860, 460], [840, 480], [820, 440]] },
];

// Easter egg tap spots (world coordinates)
const EASTER_EGGS = [
  { x: 500, y: 300, emoji: '⛲', msg: 'Der Brunnen plätschert friedlich... 💧', radius: 40 },
  { x: 150, y: 700, emoji: '🌸', msg: 'So schöne Blumen! Die Bienen summen... 🐝', radius: 30 },
  { x: 850, y: 100, emoji: '🌳', msg: 'Ein Eichhörnchen versteckt Nüsse! 🐿️', radius: 35 },
  { x: 450, y: 800, emoji: '🎪', msg: 'Hier könnte bald ein Fest stattfinden! 🎉', radius: 30 },
];

export class TownScene extends Phaser.Scene {
  constructor() { super('Town'); }

  create() {
    try {
      this._createInner();
    } catch (e) {
      this.cameras.main.setBackgroundColor('#330000');
      this.add.text(20, 20, `TOWN ERROR:\n${e.message}`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#ff4444', wordWrap: { width: 500 },
      });
      this.input.on('pointerdown', () => this.scene.start('Menu'));
    }
  }

  _createInner() {
    this.save = loadSave();
    regenerateEnergy(this.save);

    // Process guild NPC help (safely)
    try {
      if (this.save.guild) {
        processNPCHelp(this.save);
        writeSave(this.save);
      }
    } catch (e) { /* guild processing failed, continue */ }

    // Events disabled on town load for now - trigger from menu instead

    const { width, height } = this.scale;
    const mapW = 1024;
    const mapH = 1024;

    // World bounds for scrolling
    this.physics.world.setBounds(0, 0, mapW, mapH);
    this.cameras.main.setBounds(0, 0, mapW, mapH);

    // === BACKGROUND MAP IMAGE ===
    if (this.textures.exists('town_map_clean')) {
      this.add.image(mapW / 2, mapH / 2, 'town_map_clean')
        .setDisplaySize(mapW, mapH).setDepth(0);
    } else if (this.textures.exists('town_map_main')) {
      this.add.image(mapW / 2, mapH / 2, 'town_map_main')
        .setDisplaySize(mapW, mapH).setDepth(0);
    } else {
      // Fallback: draw simple town
      this.cameras.main.setBackgroundColor('#5a8a3c');
      // Roads
      this.add.rectangle(mapW / 2, mapH / 2, mapW, 80, 0xc4a76c, 0.5);
      this.add.rectangle(mapW / 2, mapH / 2, 80, mapH, 0xc4a76c, 0.5);
    }

    // === BUILDING HOTSPOTS ===
    this.hitAreas = [];
    BUILDINGS.forEach((b) => {
      const isUnlocked = b.unlocked || (this.save.stations[b.id] && this.save.stations[b.id].unlocked);

      // Building marker overlay
      if (isUnlocked) {
        // Glowing circle under building
        const glow = this.add.circle(b.x, b.y, 45, 0xffffff, 0.12).setDepth(1);
        this.tweens.add({
          targets: glow, scale: { from: 0.9, to: 1.1 }, alpha: { from: 0.08, to: 0.18 },
          duration: 1500, yoyo: true, repeat: -1,
        });

        // Emoji icon
        this.add.text(b.x, b.y - 20, b.emoji, { fontSize: '32px' })
          .setOrigin(0.5).setDepth(5);

        // Name plate
        const plate = this.add.rectangle(b.x, b.y + 20, 100, 22, 0x2a1f35, 0.85)
          .setDepth(5).setStrokeStyle(1, 0x554466);
        this.add.text(b.x, b.y + 20, b.name, {
          fontSize: '10px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(6);

        // Pet count badge for shelter
        if (b.id === 'shelter' && this.save.pets.length > 0) {
          this.add.circle(b.x + 35, b.y - 35, 14, 0xff4466).setDepth(7);
          this.add.text(b.x + 35, b.y - 35, `${this.save.pets.length}`, {
            fontSize: '11px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
          }).setOrigin(0.5).setDepth(8);
        }

        // Tap zone
        this.hitAreas.push({
          x: b.x, y: b.y, w: b.w, h: b.h,
          cb: () => this.scene.start(b.key),
        });
      } else {
        // Locked overlay
        this.add.circle(b.x, b.y, 40, 0x000000, 0.5).setDepth(2);
        this.add.text(b.x, b.y - 10, '🔒', { fontSize: '24px' }).setOrigin(0.5).setDepth(5);
        this.add.text(b.x, b.y + 18, `${b.unlockCost}❤️`, {
          fontSize: '10px', fontFamily: 'monospace', color: '#ffaa44',
        }).setOrigin(0.5).setDepth(5);

        if (this.save.hearts >= b.unlockCost) {
          this.hitAreas.push({
            x: b.x, y: b.y, w: b.w, h: b.h,
            cb: () => this.unlockBuilding(b),
          });
        }
      }
    });

    // === ANIMATED NPCs ===
    this.walkers = [];
    WALKER_PATHS.forEach((wp) => {
      const startIdx = Math.floor(Math.random() * wp.path.length);
      const start = wp.path[startIdx];
      const walker = this.add.text(start[0], start[1], wp.emoji, {
        fontSize: '18px',
      }).setDepth(4).setOrigin(0.5);

      this.walkers.push({
        sprite: walker,
        path: wp.path,
        speed: wp.speed,
        currentTarget: (startIdx + 1) % wp.path.length,
        type: wp.type,
      });
    });

    // === EASTER EGG SPOTS ===
    EASTER_EGGS.forEach((ee) => {
      this.hitAreas.push({
        x: ee.x, y: ee.y, w: ee.radius * 2, h: ee.radius * 2,
        cb: () => this.showEasterEgg(ee),
      });
    });

    // === HUD (fixed to camera) ===
    const hud = this.add.container(0, 0).setDepth(100).setScrollFactor(0);

    // Top bar
    hud.add(this.add.rectangle(width / 2, 0, width, 52, 0x2a1f35, 0.92).setOrigin(0.5, 0).setScrollFactor(0));
    hud.add(this.add.rectangle(width / 2, 52, width, 2, 0x443355).setOrigin(0.5, 0).setScrollFactor(0));

    hud.add(this.add.text(width / 2, 14, '🐾 Pfotenwelt', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0));

    hud.add(this.add.text(15, 8, `❤️ ${this.save.hearts}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#ff6688',
    }).setScrollFactor(0));
    hud.add(this.add.text(15, 26, `⚡ ${this.save.energy}/${this.save.maxEnergy}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffcc00',
    }).setScrollFactor(0));
    hud.add(this.add.text(width - 15, 8, `Lv.${this.save.level}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#88ccff', fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0));
    hud.add(this.add.text(width - 15, 26, `${this.save.pets.length} Tiere | ${this.save.adopted} ✓`, {
      fontSize: '9px', fontFamily: 'monospace', color: '#aa88cc',
    }).setOrigin(1, 0).setScrollFactor(0));

    // Bottom bar
    hud.add(this.add.rectangle(width / 2, height - 40, width, 45, 0x2a1f35, 0.9).setOrigin(0.5, 0).setScrollFactor(0));
    hud.add(this.add.text(width / 2, height - 24, `🎁 ${this.save.totalDonatedKg.toFixed(1)}kg gespendet | 📅 Tag ${this.save.loginStreak}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#88cc88',
    }).setOrigin(0.5).setScrollFactor(0));

    // Bottom nav buttons
    const navBtns = [
      { label: '📖', x: 50, scene: 'Collection' },
      { label: '🏠', x: width / 2, scene: null }, // center on shelter
      { label: '⚙️', x: width - 50, scene: 'Menu' },
    ];
    navBtns.forEach((nb) => {
      hud.add(this.add.circle(nb.x, height - 18, 18, 0x443355, 0.7).setScrollFactor(0));
      hud.add(this.add.text(nb.x, height - 18, nb.label, { fontSize: '16px' }).setOrigin(0.5).setScrollFactor(0));
      this.hitAreas.push({
        x: nb.x, y: height - 18, w: 40, h: 40,
        isScreen: true, // these use screen coords, not world coords
        cb: () => {
          if (nb.scene) this.scene.start(nb.scene);
          else this.cameras.main.pan(200, 180, 500); // pan to shelter
        },
      });
    });

    // Easter egg message display
    this.msgText = this.add.text(width / 2, height - 70, '', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#ffcc88',
      backgroundColor: '#2a1f35aa', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0);

    // === CAMERA SETUP ===
    // Start centered on shelter
    this.cameras.main.centerOn(mapW / 2, mapH / 2);
    this.cameras.main.setZoom(1.4);

    // Drag to scroll
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.camStart = { x: 0, y: 0 };

    this.input.on('pointerdown', (pointer) => {
      // Check HUD buttons first (screen coords)
      for (const h of this.hitAreas) {
        if (h.isScreen) {
          if (pointer.x >= h.x - h.w / 2 && pointer.x <= h.x + h.w / 2 &&
              pointer.y >= h.y - h.h / 2 && pointer.y <= h.y + h.h / 2) {
            h.cb();
            return;
          }
        }
      }
      this.isDragging = true;
      this.dragStart = { x: pointer.x, y: pointer.y };
      this.camStart = { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY };
      this.dragMoved = false;
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.isDragging) return;
      const dx = pointer.x - this.dragStart.x;
      const dy = pointer.y - this.dragStart.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) this.dragMoved = true;
      const zoom = this.cameras.main.zoom;
      this.cameras.main.scrollX = this.camStart.x - dx / zoom;
      this.cameras.main.scrollY = this.camStart.y - dy / zoom;
    });

    this.input.on('pointerup', (pointer) => {
      this.isDragging = false;
      if (this.dragMoved) return; // was a drag, not a tap

      // Convert screen tap to world coords
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      // Check building taps (world coords)
      for (const h of this.hitAreas) {
        if (h.isScreen) continue;
        if (worldPoint.x >= h.x - h.w / 2 && worldPoint.x <= h.x + h.w / 2 &&
            worldPoint.y >= h.y - h.h / 2 && worldPoint.y <= h.y + h.h / 2) {
          h.cb();
          return;
        }
      }
    });

    // Pinch zoom (basic - use scroll wheel on desktop)
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom - deltaY * 0.001, 0.8, 2.5);
      this.cameras.main.setZoom(newZoom);
    });
  }

  unlockBuilding(b) {
    this.save.hearts -= b.unlockCost;
    if (!this.save.stations[b.id]) this.save.stations[b.id] = {};
    this.save.stations[b.id].unlocked = true;
    this.save.stations[b.id].level = 1;
    writeSave(this.save);

    // Celebration particles
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 / 10) * i;
      const star = this.add.text(b.x, b.y, '⭐', { fontSize: '18px' }).setOrigin(0.5).setDepth(20);
      this.tweens.add({
        targets: star,
        x: b.x + Math.cos(angle) * 60, y: b.y + Math.sin(angle) * 60,
        alpha: 0, scale: 0.3, duration: 700,
        onComplete: () => star.destroy(),
      });
    }

    this.time.delayedCall(800, () => this.scene.restart());
  }

  showEasterEgg(ee) {
    this.msgText.setText(`${ee.emoji} ${ee.msg}`);
    this.msgText.setAlpha(1);
    this.tweens.add({
      targets: this.msgText,
      alpha: 0, duration: 3000, delay: 1000,
    });
  }

  update(time, delta) {
    // Animate walkers along their paths
    this.walkers.forEach((w) => {
      const target = w.path[w.currentTarget];
      const dx = target[0] - w.sprite.x;
      const dy = target[1] - w.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        w.currentTarget = (w.currentTarget + 1) % w.path.length;
        // Flip sprite based on direction
        const next = w.path[w.currentTarget];
        if (next[0] < w.sprite.x) w.sprite.setScale(-1, 1);
        else w.sprite.setScale(1, 1);
      } else {
        const speed = w.speed * (delta / 1000);
        w.sprite.x += (dx / dist) * speed;
        w.sprite.y += (dy / dist) * speed;
      }
    });

    // Subtle ambient animation - sway trees (via slight map tint changes)
    // This is handled by the walker animations for now
  }
}
