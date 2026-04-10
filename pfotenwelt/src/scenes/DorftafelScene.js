import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { refreshDailyTasks, claimDailyRewards } from '../data/DailyTasks.js';
import { refreshOrders, isOrderComplete } from '../data/OrderBoard.js';
import { getBoardEvent, applyEventChoice } from '../data/BoardEvents.js';
import { getItem } from '../data/MergeData.js';
import { THEME, drawButton, drawCard } from '../ui/Theme.js';

export class DorftafelScene extends Phaser.Scene {
  constructor() { super('Dorftafel'); }

  create() {
    this.save = loadSave();
    this.hitAreas = [];
    this.tab = 'tasks'; // tasks | orders | events
    const { width, height } = this.scale;

    // Hide HTML HUD
    const hud = document.getElementById('hud');
    if (hud) hud.classList.remove('visible');
    const bb = document.getElementById('bottom-bar');
    if (bb) bb.style.display = 'none';

    this.cameras.main.setBackgroundColor('#f5f0e8');
    this.drawUI();
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];

    const { width, height } = this.scale;
    const cx = width / 2;

    // Header — wooden board style
    this.add.rectangle(cx, 0, width, 50, 0x8B6B3A, 0.95).setOrigin(0.5, 0);
    this.add.text(cx, 25, '📌 Dorftafel', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#fff8e8', fontStyle: 'bold',
      stroke: '#5a4020', strokeThickness: 3,
    }).setOrigin(0.5);

    // Tabs
    const tabs = [
      { key: 'tasks', label: '📋 Aufgaben', x: cx - 120 },
      { key: 'orders', label: '📦 Aufträge', x: cx },
      { key: 'events', label: '⚡ Events', x: cx + 110 },
    ];
    tabs.forEach(t => {
      const active = this.tab === t.key;
      this.add.rectangle(t.x, 68, 110, 28, active ? 0xffffff : 0xe8ddd0, active ? 0.95 : 0.6)
        .setStrokeStyle(1, active ? 0x8B6B3A : 0xc0b0a0);
      this.add.text(t.x, 68, t.label, {
        fontSize: '11px', fontFamily: 'Georgia, serif', color: active ? '#5a4020' : '#8a7a6a', fontStyle: active ? 'bold' : 'normal',
      }).setOrigin(0.5);
      this.addHitArea(t.x, 68, 110, 28, () => { this.tab = t.key; this.drawUI(); });
    });

    // Content area
    const contentY = 95;
    if (this.tab === 'tasks') this.drawTasks(cx, width, contentY);
    else if (this.tab === 'orders') this.drawOrders(cx, width, contentY);
    else if (this.tab === 'events') this.drawEvents(cx, width, contentY);

    // Back button
    drawButton(this, cx, height - 30, 200, 40, '← Zurück', { type: 'secondary', fontSize: '14px' });
    this.addHitArea(cx, height - 30, 200, 40, () => this.scene.start('Town'));

    // Touch handler
    this.input.on('pointerdown', (pointer) => {
      for (const h of this.hitAreas) {
        if (pointer.x >= h.x - h.w / 2 && pointer.x <= h.x + h.w / 2 &&
            pointer.y >= h.y - h.h / 2 && pointer.y <= h.y + h.h / 2) {
          h.cb(); return;
        }
      }
    });
  }

  // === TAB 1: DAILY TASKS ===
  drawTasks(cx, width, startY) {
    const dt = refreshDailyTasks(this.save);
    writeSave(this.save);

    // Timer: hours until midnight (real time reset)
    const now = new Date();
    const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
    const hoursLeft = Math.ceil((midnight - now) / 3600000);
    this.add.text(cx, startY, 'Tägliche Aufgaben', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#6b4c8a', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, startY + 16, `⏰ Neue Aufgaben in ${hoursLeft}h`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#9888a8',
    }).setOrigin(0.5);

    dt.tasks.forEach((task, i) => {
      const ty = startY + 38 + i * 52;
      const current = dt.stats[task.stat] || 0;
      const done = task.claimed || current >= task.target;

      // Zettel (note card) style
      const angle = (i % 2 === 0 ? -1.5 : 1.5);
      const card = this.add.rectangle(cx, ty + 15, width - 30, 44, done ? 0xe8f5e8 : 0xfffff0, 0.95)
        .setStrokeStyle(1, done ? 0xaaddaa : 0xd8d0c0).setAngle(angle);
      // Pin
      this.add.circle(cx - (width / 2 - 30), ty + 2, 4, 0xcc3333).setDepth(2);

      this.add.text(25, ty + 4, `${done ? '✅' : '⬜'} ${task.icon} ${task.text}`, {
        fontSize: '12px', fontFamily: 'Georgia, serif', color: done ? '#33aa55' : '#4a3560',
      });
      this.add.text(width - 20, ty + 4, `+${task.reward}❤️`, {
        fontSize: '12px', fontFamily: 'monospace', color: done ? '#33aa55' : '#cc8844', fontStyle: 'bold',
      }).setOrigin(1, 0);
      this.add.text(25, ty + 20, `${Math.min(current, task.target)}/${task.target}`, {
        fontSize: '10px', fontFamily: 'monospace', color: '#9888a8',
      });

      // Claim if done but not claimed
      if (done && !task.claimed) {
        this.addHitArea(cx, ty + 15, width - 30, 44, () => {
          const reward = claimDailyRewards(this.save);
          this.save.totalDailyCompleted = (this.save.totalDailyCompleted || 0) + 1;
          writeSave(this.save);
          this.drawUI();
        });
      }
    });
  }

  // === TAB 2: ITEM ORDERS (Hay Day style) ===
  drawOrders(cx, width, startY) {
    const orders = refreshOrders(this.save);
    writeSave(this.save);

    this.add.text(cx, startY, 'Lieferaufträge — bringe Items aus der Werkstatt!', {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#8a7a6a',
    }).setOrigin(0.5);

    orders.list.forEach((order, i) => {
      const oy = startY + 30 + i * 100;
      const fulfilled = order.fulfilled;

      // Order card
      drawCard(this, cx, oy + 30, width - 25, 85, { borderColor: fulfilled ? 0xaaddaa : 0xd8c8b0 });
      if (fulfilled) {
        this.add.rectangle(cx, oy + 30, width - 29, 81, 0xeeffee, 0.5);
      }

      // Items needed with progress
      let ix = 20;
      order.items.forEach((req, ri) => {
        const item = getItem(req.id);
        const emoji = item ? item.emoji : '?';
        const name = item ? item.name : req.id;
        const prog = order.progress ? order.progress[ri] : 0;
        const done = prog >= req.qty;
        this.add.text(ix, oy + 8, `${done ? '✅' : '⬜'} ${emoji} ${prog}/${req.qty} ${name}`, {
          fontSize: '11px', fontFamily: 'monospace', color: done ? '#33aa55' : '#4a3560',
        });
        ix += 150;
      });

      // Reward
      this.add.text(width - 20, oy + 8, `→ ${order.reward}❤️`, {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: '#cc8844', fontStyle: 'bold',
      }).setOrigin(1, 0);

      const complete = isOrderComplete(order);
      if (fulfilled) {
        this.add.text(cx, oy + 42, '✅ Erledigt!', {
          fontSize: '14px', fontFamily: 'Georgia, serif', color: '#33aa55', fontStyle: 'bold',
        }).setOrigin(0.5);
      } else if (complete) {
        drawButton(this, cx, oy + 45, 160, 30, '✨ Abholen!', { fontSize: '13px' });
        this.addHitArea(cx, oy + 45, 160, 30, () => {
          order.fulfilled = true;
          this.save.hearts += order.reward;
          addXp(this.save, 5);
          writeSave(this.save);
          this.drawUI();
        });
      } else {
        // Show progress hint
        this.add.text(cx, oy + 45, '🔨 Merge die Items in der Werkstatt!', {
          fontSize: '10px', fontFamily: 'monospace', color: '#9888a8',
        }).setOrigin(0.5);
      }
    });
  }

  // === TAB 3: EVENTS ===
  drawEvents(cx, width, startY) {
    const evt = getBoardEvent(this.save.gameDay);
    const lastHandled = this.save.lastHandledEventDay || 0;

    if (!evt) {
      this.add.text(cx, startY + 80, '🌤️ Heute keine besonderen Ereignisse.', {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: '#8a7a6a',
      }).setOrigin(0.5);
      this.add.text(cx, startY + 105, 'Morgen gibt es vielleicht etwas Neues!', {
        fontSize: '12px', fontFamily: 'monospace', color: '#9888a8',
      }).setOrigin(0.5);
      return;
    }

    const alreadyHandled = lastHandled >= this.save.gameDay;

    // Event card
    drawCard(this, cx, startY + 80, width - 25, 120);
    this.add.text(cx, startY + 35, `${evt.emoji} ${evt.title}`, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#6b4c8a', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, startY + 58, evt.desc, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#4a3560',
      wordWrap: { width: width - 50 }, align: 'center',
    }).setOrigin(0.5);

    if (alreadyHandled) {
      this.add.text(cx, startY + 100, '✅ Bereits entschieden', {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: '#33aa55', fontStyle: 'bold',
      }).setOrigin(0.5);
      return;
    }

    // Choice buttons
    evt.choices.forEach((choice, ci) => {
      const cy = startY + 95 + ci * 48;
      const canAfford = this.save.hearts >= choice.cost;
      drawButton(this, cx, cy, width - 50, 38, choice.label, {
        fontSize: '12px', disabled: !canAfford,
      });
      this.add.text(cx, cy + 24, choice.reward, {
        fontSize: '10px', fontFamily: 'monospace', color: '#8a7a6a',
      }).setOrigin(0.5);

      if (canAfford) {
        this.addHitArea(cx, cy, width - 50, 38, () => {
          applyEventChoice(this.save, choice);
          this.save.lastHandledEventDay = this.save.gameDay;
          writeSave(this.save);
          this.drawUI();
        });
      }
    });
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
