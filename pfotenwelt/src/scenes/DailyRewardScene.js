import Phaser from 'phaser';
import { writeSave, DAILY_REWARDS } from '../data/SaveManager.js';
import { THEME, drawButton, drawCard } from '../ui/Theme.js';

export class DailyRewardScene extends Phaser.Scene {
  constructor() { super('DailyReward'); }

  init(data) {
    this.streak = data.streak || 1;
    this.save = data.save;
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    // Header area
    this.add.rectangle(cx, 0, width, 58, THEME.bg.header, 0.98).setOrigin(0.5, 0);
    this.add.rectangle(cx, 58, width, 2, THEME.bg.headerBorder).setOrigin(0.5, 0);
    this.add.text(cx, 22, '🎁 Tägliche Belohnung!', {
      fontSize: '26px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 46, `Tag ${this.streak} Streak`, {
      fontSize: '15px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Show all 7 days
    let y = 90;
    DAILY_REWARDS.forEach((reward, idx) => {
      const day = idx + 1;
      const isCurrent = ((this.streak - 1) % 7) === idx;
      const isPast = ((this.streak - 1) % 7) > idx;

      const bgColor = isCurrent ? 0xfff5e0 : isPast ? 0xe8f5e8 : 0xf0eaf5;
      const borderColor = isCurrent ? 0xddaa33 : isPast ? 0xc0d8c0 : THEME.bg.cardBorder;

      this.add.rectangle(cx, y, width - 40, 42, bgColor, 0.9)
        .setStrokeStyle(isCurrent ? 2 : 1, borderColor);

      const check = isPast ? '✅' : isCurrent ? '🎁' : '⬜';
      this.add.text(30, y - 8, `${check} Tag ${day}`, {
        fontSize: '15px', fontFamily: 'monospace', color: isCurrent ? THEME.text.warning : THEME.text.body,
      });
      this.add.text(width - 30, y - 8, reward.label, {
        fontSize: '14px', fontFamily: 'monospace', color: isCurrent ? THEME.text.warning : THEME.text.muted,
      }).setOrigin(1, 0);

      y += 50;
    });

    // Claim button
    const btnY = y + 20;
    drawButton(this, cx, btnY, 260, 50, '✨ ABHOLEN!', { type: 'primary', fontSize: '20px' });

    this.input.on('pointerdown', (pointer) => {
      if (pointer.x >= cx - 130 && pointer.x <= cx + 130 &&
          pointer.y >= btnY - 25 && pointer.y <= btnY + 25) {
        this.claimReward();
      }
    });
  }

  claimReward() {
    const rewardIdx = (this.streak - 1) % 7;
    const reward = DAILY_REWARDS[rewardIdx];

    this.save.hearts += reward.hearts || 0;
    if (reward.energy) {
      this.save.energy = Math.min(this.save.maxEnergy, this.save.energy + reward.energy);
    }

    writeSave(this.save);
    this.scene.start('Town');
  }
}
