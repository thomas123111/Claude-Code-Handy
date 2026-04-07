import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { startMusic, unlockAudio } from '../audio/MusicManager.js';

// Farm puzzles: mini-tasks you do on the farm to earn food for the shelter
const FARM_TASKS = [
  {
    id: 'harvest', name: 'Ernte einfahren', emoji: '🌾',
    desc: 'Tippe die reifen Felder ab!',
    reward: { food: 3, hearts: 15, xp: 10 },
    cooldownMs: 120000, // 2 min
  },
  {
    id: 'feed_animals', name: 'Tiere füttern', emoji: '🐔',
    desc: 'Sortiere das Futter zu den richtigen Tieren!',
    reward: { food: 2, hearts: 10, xp: 8 },
    cooldownMs: 90000,
  },
  {
    id: 'milk', name: 'Kühe melken', emoji: '🥛',
    desc: 'Tippe im richtigen Rhythmus!',
    reward: { food: 4, hearts: 20, xp: 12 },
    cooldownMs: 180000,
  },
  {
    id: 'eggs', name: 'Eier sammeln', emoji: '🥚',
    desc: 'Finde alle Eier bevor die Zeit abläuft!',
    reward: { food: 2, hearts: 10, xp: 8 },
    cooldownMs: 60000,
  },
  {
    id: 'deliver', name: 'Futter liefern', emoji: '🚜',
    desc: 'Liefere Futter ans Tierheim!',
    reward: { food: 5, hearts: 30, xp: 15 },
    cooldownMs: 300000,
  },
];

export class FarmScene extends Phaser.Scene {
  constructor() { super('Farm'); }

  create() {
    this.save = loadSave();
    if (!this.save.farm) {
      this.save.farm = { level: 1, totalDelivered: 0, taskCooldowns: {} };
      writeSave(this.save);
    }
    this.checkFarmResult();
    this.drawUI();
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];

    const { width, height } = this.scale;
    const cx = width / 2;
    const save = this.save;
    const farm = save.farm;

    this.cameras.main.setBackgroundColor('#1a2818');

    // === HEADER ===
    this.add.rectangle(cx, 0, width, 55, 0x2a3520, 0.95).setOrigin(0.5, 0);
    this.add.rectangle(cx, 55, width, 2, 0x445533).setOrigin(0.5, 0);
    this.add.text(cx, 18, '🌾 Nachbars Bauernhof', {
      fontSize: '17px', fontFamily: 'Georgia, serif', color: '#ccdd88', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 40, `Lv.${farm.level} · ${farm.totalDelivered} Lieferungen ans Tierheim`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#88aa66',
    }).setOrigin(0.5);
    this.add.text(15, 20, `❤️ ${save.hearts}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#ff6688',
    });

    // === STORY INTRO ===
    const introY = 75;
    this.add.rectangle(cx, introY + 30, width - 20, 55, 0x223318, 0.6)
      .setStrokeStyle(1, 0x446633);
    this.add.text(cx, introY + 20, '🐄 Der Bauernhof nebenan beliefert dein Tierheim', {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#bbcc99',
    }).setOrigin(0.5);
    this.add.text(cx, introY + 40, 'Hilf bei den Aufgaben und verdiene Futter für deine Tiere!', {
      fontSize: '10px', fontFamily: 'monospace', color: '#88aa66',
    }).setOrigin(0.5);

    // === FARM ANIMALS DISPLAY ===
    const animY = 150;
    this.add.text(cx, animY, 'Bauernhof-Tiere', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ccdd88', fontStyle: 'bold',
    }).setOrigin(0.5);

    const farmAnimals = [
      { key: 'farm_cow_baby', label: 'Kälbchen', x: cx - 160 },
      { key: 'farm_piglet', label: 'Ferkel', x: cx - 55 },
      { key: 'farm_chicken', label: 'Huhn', x: cx + 55 },
      { key: 'farm_duckling', label: 'Entchen', x: cx + 160 },
    ];

    farmAnimals.forEach((a) => {
      if (this.textures.exists(a.key)) {
        const spr = this.add.sprite(a.x, animY + 40, a.key).setScale(2.5);
        const animKey = `${a.key}_walk_down`;
        if (this.anims.exists(animKey)) spr.play(animKey);
      } else {
        this.add.text(a.x, animY + 35, '🐾', { fontSize: '24px' }).setOrigin(0.5);
      }
      this.add.text(a.x, animY + 65, a.label, {
        fontSize: '9px', fontFamily: 'monospace', color: '#99aa77',
      }).setOrigin(0.5);
    });

    // === TASK LIST ===
    const tasksY = 240;
    this.add.text(cx, tasksY, '📋 Aufgaben', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ccdd88', fontStyle: 'bold',
    }).setOrigin(0.5);

    const now = Date.now();
    FARM_TASKS.forEach((task, i) => {
      const ty = tasksY + 25 + i * 75;
      const lastDone = farm.taskCooldowns[task.id] || 0;
      const cooldownLeft = Math.max(0, task.cooldownMs - (now - lastDone));
      const isReady = cooldownLeft === 0;

      // Task card
      this.add.rectangle(cx, ty + 20, width - 30, 65, isReady ? 0x2a3520 : 0x1a1e14, 0.8)
        .setStrokeStyle(1, isReady ? 0x557733 : 0x333322);

      // Emoji + Name
      this.add.text(25, ty + 5, task.emoji, { fontSize: '24px' });
      this.add.text(60, ty + 5, task.name, {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: isReady ? '#ddeeaa' : '#777766', fontStyle: 'bold',
      });
      this.add.text(60, ty + 25, task.desc, {
        fontSize: '10px', fontFamily: 'monospace', color: '#88aa66',
      });

      // Reward info
      const rewardText = `+${task.reward.food}🍖 +${task.reward.hearts}❤️ +${task.reward.xp}XP`;
      this.add.text(60, ty + 40, rewardText, {
        fontSize: '9px', fontFamily: 'monospace', color: '#aacc88',
      });

      if (isReady) {
        // Play button
        const btnX = width - 55;
        this.add.rectangle(btnX, ty + 20, 70, 40, 0x447733, 0.6)
          .setStrokeStyle(2, 0x66aa44);
        this.add.text(btnX, ty + 20, '▶ Los!', {
          fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ccffaa', fontStyle: 'bold',
        }).setOrigin(0.5);
        this.addHitArea(btnX, ty + 20, 70, 40, () => this.startTask(task));
      } else {
        // Cooldown display
        const secsLeft = Math.ceil(cooldownLeft / 1000);
        const mins = Math.floor(secsLeft / 60);
        const secs = secsLeft % 60;
        this.add.text(width - 55, ty + 20, `⏳ ${mins}:${secs.toString().padStart(2, '0')}`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#666655',
        }).setOrigin(0.5);
      }
    });

    // === DELIVERY PROGRESS ===
    const delY = tasksY + 25 + FARM_TASKS.length * 75 + 15;
    this.add.rectangle(cx, delY + 20, width - 30, 55, 0x223318, 0.7)
      .setStrokeStyle(1, 0x446633);
    this.add.text(cx, delY + 10, '🚜 Lieferungen ans Tierheim', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ccdd88', fontStyle: 'bold',
    }).setOrigin(0.5);
    const nextMilestone = Math.ceil((farm.totalDelivered + 1) / 5) * 5;
    this.add.text(cx, delY + 30, `${farm.totalDelivered} / ${nextMilestone} für nächstes Farm-Level`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#88aa66',
    }).setOrigin(0.5);

    // Progress bar
    const progW = width - 80;
    const prog = (farm.totalDelivered % 5) / 5;
    this.add.rectangle(cx, delY + 45, progW, 10, 0x333322).setStrokeStyle(1, 0x444433);
    this.add.rectangle(cx - progW / 2, delY + 45, progW * prog, 10, 0x88aa44).setOrigin(0, 0.5);

    // === BACK BUTTON ===
    this.add.text(cx, height - 30, '← Zurück zur Stadt', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#887799',
    }).setOrigin(0.5);
    this.addHitArea(cx, height - 30, 250, 35, () => this.scene.start('Town'));

    // Start farm music
    if (this.save.musicOn !== false) {
      unlockAudio();
      startMusic('farm');
    }

    // Global touch handler
    this.input.on('pointerdown', (pointer) => {
      for (const h of this.hitAreas) {
        if (pointer.x >= h.x - h.w / 2 && pointer.x <= h.x + h.w / 2 &&
            pointer.y >= h.y - h.h / 2 && pointer.y <= h.y + h.h / 2) {
          h.cb();
          return;
        }
      }
    });

    // Auto-refresh cooldowns
    this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        // Check if any cooldown just finished
        const now = Date.now();
        for (const task of FARM_TASKS) {
          const lastDone = farm.taskCooldowns[task.id] || 0;
          const left = task.cooldownMs - (now - lastDone);
          if (left > -1000 && left <= 0) {
            this.drawUI(); // Refresh when a cooldown finishes
            return;
          }
        }
      },
    });
  }

  startTask(task) {
    // Route to appropriate puzzle with farm context
    const puzzleMap = {
      harvest: 'SwipePuzzle',
      feed_animals: 'SortPuzzle',
      milk: 'TimingPuzzle',
      eggs: 'MemoryPuzzle',
      deliver: 'Match3Puzzle',
    };

    this.registry.set('pendingFarmTask', {
      taskId: task.id,
      reward: task.reward,
    });

    const puzzleKey = puzzleMap[task.id] || 'Match3Puzzle';
    this.scene.start(puzzleKey, {
      petName: `Bauernhof: ${task.name}`,
      onComplete: 'Farm',
      farmTask: true,
    });
  }

  checkFarmResult() {
    const result = this.registry.get('puzzleResult');
    const pending = this.registry.get('pendingFarmTask');
    if (!result || !pending) return;
    this.registry.remove('puzzleResult');
    this.registry.remove('pendingFarmTask');

    if (result.success) {
      const farm = this.save.farm;
      const reward = pending.reward;

      // Apply rewards
      this.save.hearts += reward.hearts;
      addXp(this.save, reward.xp);

      // Food delivered to shelter
      farm.totalDelivered += reward.food;

      // Set cooldown
      farm.taskCooldowns[pending.taskId] = Date.now();

      // Level up check
      if (farm.totalDelivered >= farm.level * 5) {
        farm.level++;
      }

      writeSave(this.save);
    }
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
