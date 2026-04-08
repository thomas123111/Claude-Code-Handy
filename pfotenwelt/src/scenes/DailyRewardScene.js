import Phaser from 'phaser';
import { writeSave, DAILY_REWARDS } from '../data/SaveManager.js';

export class DailyRewardScene extends Phaser.Scene {
  constructor() { super('DailyReward'); }

  init(data) {
    this.streak = data.streak || 1;
    this.save = data.save;
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor('#2a1f35');

    this.add.text(cx, 60, '🎁 Tägliche Belohnung!', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#ffcc44', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 95, `Tag ${this.streak} Streak`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#aa9977',
    }).setOrigin(0.5);

    // Show all 7 days
    let y = 150;
    DAILY_REWARDS.forEach((reward, idx) => {
      const day = idx + 1;
      const isCurrent = ((this.streak - 1) % 7) === idx;
      const isPast = ((this.streak - 1) % 7) > idx;

      const bgColor = isCurrent ? 0x554400 : isPast ? 0x333333 : 0x222233;
      const borderColor = isCurrent ? 0xffcc00 : 0x444444;

      this.add.rectangle(cx, y, width - 40, 42, bgColor, 0.7)
        .setStrokeStyle(isCurrent ? 2 : 1, borderColor);

      const check = isPast ? '✅' : isCurrent ? '🎁' : '⬜';
      this.add.text(30, y - 8, `${check} Tag ${day}`, {
        fontSize: '13px', fontFamily: 'monospace', color: isCurrent ? '#ffcc00' : '#888888',
      });
      this.add.text(width - 30, y - 8, reward.label, {
        fontSize: '11px', fontFamily: 'monospace', color: isCurrent ? '#ffcc00' : '#666666',
      }).setOrigin(1, 0);

      y += 50;
    });

    // Claim button
    const btnY = y + 20;
    this.add.rectangle(cx, btnY, 260, 50, 0x2a1f35, 0.4)
      .setStrokeStyle(2, 0xffaa00);
    this.add.text(cx, btnY, '✨ ABHOLEN!', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.input.on('pointerdown', (pointer) => {
      if (pointer.y >= btnY - 25 && pointer.y <= btnY + 25) {
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
    this.scene.start('Menu');
  }
}
