import Phaser from 'phaser';
import { loadSave } from '../data/SaveManager.js';
import { getAllAchievements } from '../data/Achievements.js';
import { THEME, drawHeader, drawButton } from '../ui/Theme.js';

export class AchievementsScene extends Phaser.Scene {
  constructor() { super('Achievements'); }

  create() {
    this.save = loadSave();
    this.achievements = getAllAchievements(this.save);
    this.scrollY = 0;
    this.dragStartY = 0;
    this.dragStartScroll = 0;
    this.isDragging = false;
    this.hitAreas = [];

    const { width, height } = this.scale;
    const cx = width / 2;
    const bgHex = Phaser.Display.Color.HexStringToColor(THEME.bg.scene).color;

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    // Scrollable container for achievement cards
    this.container = this.add.container(0, 0);
    const cardH = 68, gap = 8, startY = 90;

    this.achievements.forEach((ach, i) => {
      const y = startY + i * (cardH + gap);
      const u = ach.unlocked;
      this.container.add(
        this.add.rectangle(cx, y, width - 24, cardH, u ? THEME.bg.card : 0xe8e0ee, u ? 0.95 : 0.5)
          .setStrokeStyle(1, u ? THEME.bg.cardBorder : 0xd0c0d8));
      this.container.add(
        this.add.text(32, y, u ? ach.icon : '🔒', { fontSize: '26px' }).setOrigin(0.5));
      this.container.add(
        this.add.text(58, y - 14, ach.name, {
          fontSize: '15px', fontFamily: 'Georgia, serif',
          color: u ? THEME.text.dark : THEME.text.muted, fontStyle: 'bold',
        }));
      this.container.add(
        this.add.text(58, y + 6, ach.desc, {
          fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
        }));
      const rTxt = u ? `✓ +${ach.reward}❤️ erhalten` : `+${ach.reward}❤️`;
      this.container.add(
        this.add.text(width - 18, y, rTxt, {
          fontSize: '13px', fontFamily: 'monospace', color: u ? THEME.text.success : THEME.text.muted,
        }).setOrigin(1, 0.5));
    });

    this.contentHeight = startY + this.achievements.length * (cardH + gap);

    // Scroll masks (hide cards behind header & footer)
    this.add.rectangle(cx, 0, width, 68, bgHex).setOrigin(0.5, 0).setDepth(5);
    this.add.rectangle(cx, height - 62, width, 62, bgHex).setOrigin(0.5, 0).setDepth(5);

    // Fixed header + count (on top of mask)
    drawHeader(this, '🏆 Erfolge', this.save);
    const unlockedN = this.achievements.filter(a => a.unlocked).length;
    this.add.text(cx, 50, `${unlockedN}/${this.achievements.length} freigeschaltet`, {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5).setDepth(6);

    // Back button (fixed)
    drawButton(this, cx, height - 36, 260, 46, '← Zurück', { type: 'secondary', fontSize: '16px' });
    this.addHitArea(cx, height - 36, 260, 46, () => this.scene.start('Town'));

    // Drag to scroll + tap for hit areas
    this.input.on('pointerdown', (pointer) => {
      this.dragStartY = pointer.y;
      this.dragStartScroll = this.scrollY;
      this.isDragging = false;
    });
    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      const dy = pointer.y - this.dragStartY;
      if (Math.abs(dy) > 6) this.isDragging = true;
      const max = Math.max(0, this.contentHeight - height + 80);
      this.scrollY = Phaser.Math.Clamp(this.dragStartScroll - dy, 0, max);
      this.container.y = -this.scrollY;
    });
    this.input.on('pointerup', (pointer) => {
      if (this.isDragging) return;
      for (const h of this.hitAreas) {
        if (pointer.x >= h.x - h.w / 2 && pointer.x <= h.x + h.w / 2 &&
            pointer.y >= h.y - h.h / 2 && pointer.y <= h.y + h.h / 2) {
          h.cb(); return;
        }
      }
    });
  }

  addHitArea(x, y, w, h, cb) { this.hitAreas.push({ x, y, w, h, cb }); }
}
