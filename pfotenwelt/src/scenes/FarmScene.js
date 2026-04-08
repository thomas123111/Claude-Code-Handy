import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { startMusic, unlockAudio } from '../audio/MusicManager.js';

// Farm world map: 1400x1200
const FARM_W = 1400;
const FARM_H = 1200;

// Farm buildings — tappable to start tasks
const FARM_BUILDINGS = [
  { id: 'barn', name: 'Scheune', emoji: '🏚️', x: 700, y: 200, w: 140, h: 100,
    color: 0x8B4513, roofColor: 0xCC3333, task: 'harvest' },
  { id: 'stable', name: 'Kuhstall', emoji: '🐄', x: 200, y: 450, w: 120, h: 80,
    color: 0x7a6040, roofColor: 0x886644, task: 'milk' },
  { id: 'coop', name: 'Hühnerstall', emoji: '🐔', x: 1200, y: 450, w: 100, h: 70,
    color: 0x9a7a50, roofColor: 0xaa8855, task: 'eggs' },
  { id: 'trough', name: 'Futtertrog', emoji: '🍽️', x: 200, y: 800, w: 100, h: 60,
    color: 0x6a5a40, roofColor: 0x7a6a50, task: 'feed_animals' },
  { id: 'delivery', name: 'Lieferrampe', emoji: '🚜', x: 1200, y: 800, w: 120, h: 70,
    color: 0x5a6a40, roofColor: 0x6a7a50, task: 'deliver' },
];

const FARM_TASKS = {
  harvest: { name: 'Ernte einfahren', reward: { hearts: 15, xp: 10 }, cooldownMs: 120000, puzzle: 'SwipePuzzle' },
  milk: { name: 'Kühe melken', reward: { hearts: 20, xp: 12 }, cooldownMs: 180000, puzzle: 'TimingPuzzle' },
  eggs: { name: 'Eier sammeln', reward: { hearts: 10, xp: 8 }, cooldownMs: 60000, puzzle: 'MemoryPuzzle' },
  feed_animals: { name: 'Tiere füttern', reward: { hearts: 10, xp: 8 }, cooldownMs: 90000, puzzle: 'SortPuzzle' },
  deliver: { name: 'Futter liefern', reward: { hearts: 30, xp: 15 }, cooldownMs: 300000, puzzle: 'Match3Puzzle' },
};

export class FarmScene extends Phaser.Scene {
  constructor() { super('Farm'); }

  create() {
    this.save = loadSave();
    if (!this.save.farm) {
      this.save.farm = { level: 1, totalDelivered: 0, taskCooldowns: {} };
      writeSave(this.save);
    }
    this.checkFarmResult();

    const { width, height } = this.scale;

    // Music
    if (this.save.musicOn !== false) { unlockAudio(); startMusic('farm'); }

    // Camera
    this.cameras.main.fadeIn(400, 26, 40, 24);
    this.cameras.main.setBounds(0, 0, FARM_W, FARM_H);
    this.cameras.main.centerOn(FARM_W / 2, FARM_H / 2);
    this.cameras.main.setZoom(Math.min(width / FARM_W * 2.0, 1.0));

    // === GROUND ===
    // Main farm ground (earthy green)
    this.add.rectangle(FARM_W / 2, FARM_H / 2, FARM_W, FARM_H, 0x4a7a32).setDepth(-2);
    // Dirt patches
    for (let i = 0; i < 20; i++) {
      this.add.circle(Phaser.Math.Between(0, FARM_W), Phaser.Math.Between(0, FARM_H),
        Phaser.Math.Between(30, 80), 0x3a6a28, 0.2).setDepth(-2);
    }

    // === PATHS ===
    const pc = 0xb89a5c;
    // Central path from gate to barn
    this.drawPath(700, 100, 700, FARM_H - 50, pc);
    // Cross paths to buildings
    this.drawPath(250, 450, 700, 450, pc);
    this.drawPath(700, 450, 1150, 450, pc);
    this.drawPath(250, 800, 700, 800, pc);
    this.drawPath(700, 800, 1150, 800, pc);

    // === FIELDS (crop rows on left and right) ===
    // Left field
    for (let fy = 550; fy <= 700; fy += 18) {
      this.add.rectangle(400, fy, 250, 6, 0x6a5a2a, 0.5).setDepth(-1);
      for (let cx = 290; cx <= 510; cx += 22) {
        const cropColor = [0x55aa33, 0x66bb44, 0x44aa22][Math.floor(Math.random() * 3)];
        this.add.circle(cx, fy - 4, 5, cropColor, 0.7).setDepth(-1);
      }
    }
    // Right field
    for (let fy = 550; fy <= 700; fy += 18) {
      this.add.rectangle(1000, fy, 250, 6, 0x6a5a2a, 0.5).setDepth(-1);
      for (let cx = 890; cx <= 1110; cx += 22) {
        const cropColor = [0xccaa22, 0xddbb33, 0xbbaa11][Math.floor(Math.random() * 3)];
        this.add.circle(cx, fy - 4, 5, cropColor, 0.7).setDepth(-1);
      }
    }

    // === POND (bottom center) ===
    this.add.ellipse(700, 1050, 200, 100, 0x4488bb, 0.6).setDepth(-1);
    this.add.ellipse(700, 1045, 180, 85, 0x55aadd, 0.4).setDepth(-1);
    // Reeds around pond
    for (let i = 0; i < 6; i++) {
      const rx = 620 + i * 28, ry = 1000 + Math.sin(i) * 15;
      this.add.rectangle(rx, ry, 3, 20, 0x447733).setDepth(10 + Math.round(ry / 10));
      this.add.circle(rx, ry - 10, 4, 0x558833).setDepth(10 + Math.round(ry / 10));
    }

    // === FENCE around entire farm ===
    const fenceC = 0x8B6B3A;
    // Top fence
    for (let fx = 30; fx <= FARM_W - 30; fx += 40) {
      this.add.rectangle(fx, 50, 4, 20, fenceC).setDepth(1);
      this.add.rectangle(fx, 44, 40, 3, fenceC).setDepth(1);
      this.add.rectangle(fx, 56, 40, 3, fenceC).setDepth(1);
    }
    // Bottom fence
    for (let fx = 30; fx <= FARM_W - 30; fx += 40) {
      this.add.rectangle(fx, FARM_H - 30, 4, 20, fenceC).setDepth(1);
      this.add.rectangle(fx, FARM_H - 36, 40, 3, fenceC).setDepth(1);
      this.add.rectangle(fx, FARM_H - 24, 40, 3, fenceC).setDepth(1);
    }
    // Left fence
    for (let fy = 50; fy <= FARM_H - 30; fy += 40) {
      this.add.rectangle(30, fy, 4, 20, fenceC).setDepth(1);
      this.add.rectangle(24, fy, 3, 40, fenceC).setDepth(1);
      this.add.rectangle(36, fy, 3, 40, fenceC).setDepth(1);
    }
    // Right fence
    for (let fy = 50; fy <= FARM_H - 30; fy += 40) {
      this.add.rectangle(FARM_W - 30, fy, 4, 20, fenceC).setDepth(1);
    }
    // Gate at top center
    this.add.rectangle(700, 50, 80, 24, 0x4a7a32).setDepth(2);

    // === BUILDINGS ===
    FARM_BUILDINGS.forEach((b) => {
      const bDepth = 10 + Math.round((b.y + b.h / 2) / 10);
      // Building base
      this.add.rectangle(b.x, b.y, b.w, b.h, b.color).setDepth(bDepth);
      // Roof (triangle-ish via overlapping rect)
      this.add.rectangle(b.x, b.y - b.h / 2 - 8, b.w + 20, 18, b.roofColor).setDepth(bDepth);
      // Door
      this.add.rectangle(b.x, b.y + b.h / 4, 20, b.h / 2, 0x4a3520).setDepth(bDepth);
      // Label
      this.add.text(b.x, b.y + b.h / 2 + 18, `${b.emoji} ${b.name}`, {
        fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
        backgroundColor: '#00000088', padding: { x: 8, y: 3 },
      }).setOrigin(0.5).setDepth(200);

      // Task status indicator
      const task = FARM_TASKS[b.task];
      const now = Date.now();
      const lastDone = this.save.farm.taskCooldowns[b.task] || 0;
      const isReady = (now - lastDone) >= task.cooldownMs;
      if (isReady) {
        // Green glow/indicator
        const glow = this.add.circle(b.x + b.w / 2 - 5, b.y - b.h / 2 - 5, 8, 0x44ff44, 0.8).setDepth(201);
        this.tweens.add({ targets: glow, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
        this.add.text(b.x + b.w / 2 - 5, b.y - b.h / 2 - 5, '!', {
          fontSize: '10px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(202);
      }
    });

    // === FARM ANIMALS walking around ===
    this.farmWalkers = [];
    const animalConfigs = [
      // Cow near stable
      { key: 'farm_cow_baby', scale: 2.5, paths: [[150, 500], [350, 500], [350, 380], [150, 380]], speed: 15 },
      // Piglet near trough
      { key: 'farm_piglet', scale: 2.5, paths: [[150, 850], [350, 850], [350, 750], [150, 750]], speed: 18 },
      // Chickens near coop
      { key: 'farm_chicken', scale: 3.0, paths: [[1100, 500], [1300, 500], [1300, 380], [1100, 380]], speed: 20 },
      { key: 'farm_chicken', scale: 3.0, paths: [[1150, 520], [1250, 420], [1150, 350], [1050, 450]], speed: 16 },
      // Ducklings at pond
      { key: 'farm_duckling', scale: 3.0, paths: [[650, 1020], [750, 1050], [700, 1080], [640, 1040]], speed: 12 },
      { key: 'farm_duckling', scale: 3.0, paths: [[720, 1060], [770, 1030], [740, 1000], [690, 1040]], speed: 10 },
      // Dogs roaming
      { key: 'farm_dog_lab', scale: 1.8, paths: [[500, 300], [700, 300], [700, 500], [500, 500]], speed: 30 },
      { key: 'farm_dog_shep', scale: 1.8, paths: [[900, 800], [1100, 800], [1100, 950], [900, 950]], speed: 28 },
      // Rabbits in field area
      { key: 'farm_rabbit', scale: 2.0, paths: [[350, 580], [450, 650], [350, 700], [290, 630]], speed: 22 },
      { key: 'farm_rabbit_w', scale: 2.0, paths: [[950, 580], [1050, 650], [950, 700], [890, 630]], speed: 20 },
    ];

    animalConfigs.forEach((cfg) => {
      if (!this.textures.exists(cfg.key)) return;
      const start = cfg.paths[0], next = cfg.paths[1];
      const spr = this.add.sprite(start[0], start[1], cfg.key).setScale(cfg.scale);
      const dir = this.getDir(next[0] - start[0], next[1] - start[1]);
      const ak = `${cfg.key}_walk_${dir}`;
      if (this.anims.exists(ak)) spr.play(ak);
      spr.setDepth(10 + Math.round(start[1] / 10));
      this.farmWalkers.push({ sprite: spr, key: cfg.key, path: cfg.paths, targetIdx: 1, speed: cfg.speed, currentDir: dir });
    });

    // === TREES around edges ===
    const treePositions = [
      [80, 150], [1320, 150], [80, 600], [1320, 600], [80, 950], [1320, 950],
      [450, 150], [950, 150], [450, 950], [950, 950],
    ];
    treePositions.forEach(([tx, ty]) => {
      if (this.textures.exists('env_tree_small')) {
        this.add.image(tx, ty, 'env_tree_small').setScale(0.5).setDepth(10 + Math.round(ty / 10));
      }
    });

    // === HUD (same style as TownScene) ===
    this.add.rectangle(width / 2, 0, width, 50, 0x2a1f35, 0.92).setOrigin(0.5, 0).setScrollFactor(0).setDepth(500);
    this.add.text(width / 2, 15, '🌾 Nachbars Bauernhof', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
    this.add.text(12, 8, `❤️ ${this.save.hearts}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff6688',
    }).setScrollFactor(0).setDepth(501);
    this.add.text(12, 28, `⚡ ${this.save.energy}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffcc00',
    }).setScrollFactor(0).setDepth(501);
    const farm = this.save.farm;
    this.add.text(width - 12, 8, `Lv.${farm.level}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#88ccff', fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(501);
    this.add.text(width - 12, 25, `🚜 ${farm.totalDelivered} Lieferungen`, {
      fontSize: '9px', fontFamily: 'monospace', color: '#88aa66',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(501);

    // Bottom bar with back button (interactive!)
    this.add.rectangle(width / 2, height - 38, width, 42, 0x2a1f35, 0.9).setOrigin(0.5, 0).setScrollFactor(0).setDepth(500);
    const backBtn = this.add.text(width / 2, height - 20, '← Zurück zur Stadt', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 26, 21, 35);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Town'));
    });

    // === INPUT ===
    this.isDragging = false;
    this.dragMoved = false;

    this.input.on('pointerdown', (pointer) => {
      this.isDragging = true; this.dragMoved = false;
      this.dragStartX = pointer.x; this.dragStartY = pointer.y;
      this.camStartX = this.cameras.main.scrollX; this.camStartY = this.cameras.main.scrollY;
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.isDragging) return;
      const dx = pointer.x - this.dragStartX, dy = pointer.y - this.dragStartY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) this.dragMoved = true;
      if (this.dragMoved) {
        const z = this.cameras.main.zoom;
        this.cameras.main.scrollX = this.camStartX - dx / z;
        this.cameras.main.scrollY = this.camStartY - dy / z;
      }
    });

    this.input.on('pointerup', (pointer) => {
      this.isDragging = false;
      if (this.dragMoved) return;
      const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      // Check building taps
      for (const b of FARM_BUILDINGS) {
        if (wp.x >= b.x - b.w / 2 - 20 && wp.x <= b.x + b.w / 2 + 20 &&
            wp.y >= b.y - b.h / 2 - 20 && wp.y <= b.y + b.h / 2 + 20) {
          this.handleBuildingTap(b);
          return;
        }
      }
    });
  }

  handleBuildingTap(building) {
    const task = FARM_TASKS[building.task];
    if (!task) return;
    const now = Date.now();
    const lastDone = this.save.farm.taskCooldowns[building.task] || 0;
    const isReady = (now - lastDone) >= task.cooldownMs;

    if (!isReady) {
      const secsLeft = Math.ceil((task.cooldownMs - (now - lastDone)) / 1000);
      const mins = Math.floor(secsLeft / 60), secs = secsLeft % 60;
      // Show cooldown popup
      const popup = this.add.text(building.x, building.y - 60, `⏳ ${mins}:${secs.toString().padStart(2, '0')}`, {
        fontSize: '16px', fontFamily: 'monospace', color: '#ffcc44',
        backgroundColor: '#00000099', padding: { x: 10, y: 5 },
      }).setOrigin(0.5).setDepth(300);
      this.tweens.add({ targets: popup, y: popup.y - 20, alpha: 0, duration: 1500, onComplete: () => popup.destroy() });
      return;
    }

    // Start puzzle
    this.registry.set('pendingFarmTask', { taskId: building.task, reward: task.reward });
    this.scene.start(task.puzzle, { petName: `Bauernhof: ${task.name}`, onComplete: 'Farm', farmTask: true });
  }

  checkFarmResult() {
    const result = this.registry.get('puzzleResult');
    const pending = this.registry.get('pendingFarmTask');
    if (!result || !pending) return;
    this.registry.remove('puzzleResult');
    this.registry.remove('pendingFarmTask');
    if (result.success) {
      const farm = this.save.farm;
      this.save.hearts += pending.reward.hearts;
      addXp(this.save, pending.reward.xp);
      farm.totalDelivered++;
      farm.taskCooldowns[pending.taskId] = Date.now();
      if (farm.totalDelivered >= farm.level * 5) farm.level++;
      writeSave(this.save);
    }
  }

  getDir(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy) * 1.2) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }

  drawPath(x1, y1, x2, y2, color) {
    const isH = Math.abs(y2 - y1) < Math.abs(x2 - x1);
    const pw = 40;
    const w = isH ? Math.abs(x2 - x1) : pw;
    const h = isH ? pw : Math.abs(y2 - y1);
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    this.add.rectangle(cx, cy, w + 4, h + 4, 0x7a6a4a, 0.4).setDepth(-1);
    this.add.rectangle(cx, cy, w, h, color, 0.5).setDepth(-1);
  }

  update(time, delta) {
    if (!this.farmWalkers) return;
    this.farmWalkers.forEach((w) => {
      const t = w.path[w.targetIdx];
      const dx = t[0] - w.sprite.x, dy = t[1] - w.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) {
        w.targetIdx = (w.targetIdx + 1) % w.path.length;
        const n = w.path[w.targetIdx];
        const nd = this.getDir(n[0] - w.sprite.x, n[1] - w.sprite.y);
        if (nd !== w.currentDir) {
          w.currentDir = nd;
          const ak = `${w.key}_walk_${nd}`;
          if (this.anims.exists(ak)) w.sprite.play(ak, true);
        }
      } else {
        const spd = w.speed * (delta / 1000);
        w.sprite.x += (dx / dist) * spd;
        w.sprite.y += (dy / dist) * spd;
      }
      w.sprite.setDepth(10 + Math.round(w.sprite.y / 10));
    });
  }
}
