import Phaser from 'phaser';
import { loadSave, writeSave } from '../data/SaveManager.js';
import { applyEventReward } from '../data/EventData.js';
import { THEME, drawButton } from '../ui/Theme.js';

export class EventScene extends Phaser.Scene {
  constructor() { super('Event'); }

  init(data) {
    this.event = data.event;
  }

  create() {
    this.save = loadSave();
    const { width, height } = this.scale;
    const cx = width / 2;
    const evt = this.event;

    // Soft pastel background based on category
    const bgColors = {
      emergency: '#fcf0f0',
      community: '#f0fcf2',
      special: '#f0eefa',
    };
    this.cameras.main.setBackgroundColor(bgColors[evt.category] || THEME.bg.scene);

    // Urgency banner for emergencies
    if (evt.category === 'emergency') {
      this.add.rectangle(cx, 25, width, 50, 0xff4444, 0.12);
      this.add.text(cx, 25, '⚠️ NOTFALL ⚠️', {
        fontSize: '15px', fontFamily: 'monospace', color: '#cc3333', fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // Event title + emoji
    this.add.text(cx, 70, evt.emoji, { fontSize: '50px' }).setOrigin(0.5);
    this.add.text(cx, 115, evt.title, {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Story text
    this.add.text(cx, 170, evt.story, {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: THEME.text.body,
      wordWrap: { width: width - 50 }, align: 'center', lineSpacing: 5,
    }).setOrigin(0.5);

    // Timer (if event has duration)
    if (evt.duration > 0) {
      this.timeLeft = evt.duration;
      this.timerText = this.add.text(cx, 220, '', {
        fontSize: '16px', fontFamily: 'monospace', color: THEME.text.warning, fontStyle: 'bold',
      }).setOrigin(0.5);
      this.updateTimer();
      this.timerInterval = this.time.addEvent({
        delay: 1000, repeat: evt.duration - 1,
        callback: () => { this.timeLeft--; this.updateTimer(); },
      });
    }

    // Choice buttons - start lower to avoid overlap with story text
    this.hitAreas = [];
    let btnY = evt.duration > 0 ? 320 : 280;
    evt.choices.forEach((choice, idx) => {
      const canAfford = this.save.hearts >= (choice.cost || 0);

      drawButton(this, cx, btnY, width - 40, 60, '', { disabled: !canAfford });

      // Choice label
      this.add.text(cx, btnY - 10, choice.label, {
        fontSize: '16px', fontFamily: 'Georgia, serif',
        color: canAfford ? '#fff8e8' : '#999999', fontStyle: 'bold',
      }).setOrigin(0.5);

      // Cost + reward preview
      const costStr = choice.cost > 0 ? `Kosten: ${choice.cost}❤️ | ` : '';
      const rewardParts = [];
      if (choice.reward.hearts > 0) rewardParts.push(`+${choice.reward.hearts}❤️`);
      if (choice.reward.xp) rewardParts.push(`+${choice.reward.xp}XP`);
      if (choice.reward.pets) rewardParts.push(`+${choice.reward.pets} Tiere`);
      if (choice.reward.donationKg) rewardParts.push(`+${choice.reward.donationKg}kg Spende`);
      if (choice.puzzle) rewardParts.push('🧩 Rätsel');

      this.add.text(cx, btnY + 14, `${costStr}${rewardParts.join(' · ')}`, {
        fontSize: '11px', fontFamily: 'monospace', color: canAfford ? '#e8ddf0' : '#aaaaaa',
      }).setOrigin(0.5);

      if (canAfford) {
        this.addHitArea(cx, btnY, width - 40, 60, () => this.selectChoice(choice, idx));
      }

      btnY += 75;
    });

    // Touch handler
    this.input.on('pointerdown', (pointer) => {
      for (const h of this.hitAreas) {
        if (pointer.x >= h.x - h.w / 2 && pointer.x <= h.x + h.w / 2 &&
            pointer.y >= h.y - h.h / 2 && pointer.y <= h.y + h.h / 2) {
          h.cb();
          return;
        }
      }
    });
  }

  updateTimer() {
    if (this.timerText) {
      const m = Math.floor(this.timeLeft / 60);
      const s = this.timeLeft % 60;
      this.timerText.setText(`⏱️ ${m}:${s.toString().padStart(2, '0')}`);
      if (this.timeLeft <= 10) this.timerText.setColor(THEME.text.error);
    }
  }

  selectChoice(choice, idx) {
    const evt = this.event;

    // Deduct cost
    if (choice.cost) this.save.hearts -= choice.cost;

    // If puzzle required, start puzzle then come back
    if (choice.puzzle) {
      this.registry.set('pendingEvent', { event: evt, choiceIdx: idx });
      this.scene.start(choice.puzzle, {
        petName: 'Event',
        onComplete: 'EventResult',
      });
      return;
    }

    // Apply reward directly
    applyEventReward(this.save, choice);
    this.save.lastEventTime = Date.now();
    writeSave(this.save);

    // Show result
    const isGood = idx === 0 || (choice.reward.hearts && choice.reward.hearts > 0);
    this.showResult(isGood ? evt.feedbackGood : evt.feedbackBad, isGood);
  }

  showResult(feedback, isGood) {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Clear and show result
    this.children.removeAll();
    this.cameras.main.setBackgroundColor(isGood ? '#f0fcf2' : '#fcf0f0');

    this.add.text(cx, height / 2 - 40, isGood ? '🎉' : '😔', { fontSize: '50px' }).setOrigin(0.5);
    this.add.text(cx, height / 2 + 20, feedback, {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: isGood ? THEME.text.success : THEME.text.error,
      wordWrap: { width: width - 50 }, align: 'center', lineSpacing: 5,
    }).setOrigin(0.5);

    this.add.text(cx, height / 2 + 80, 'Tippe zum Fortfahren...', {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Use update-loop tap detection (more reliable than once listener)
    this.resultDone = true;
  }

  update() {
    // Tap to continue from result screen
    if (this.resultDone && this.input.activePointer.isDown) {
      this.resultDone = false;
      this.scene.start('Town');
    }
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}

// Result scene for after puzzle in event
export class EventResultScene extends Phaser.Scene {
  constructor() { super('EventResult'); }

  create() {
    const save = loadSave();
    const result = this.registry.get('puzzleResult');
    const pending = this.registry.get('pendingEvent');

    if (result && pending) {
      this.registry.remove('puzzleResult');
      this.registry.remove('pendingEvent');

      const choice = pending.event.choices[pending.choiceIdx];
      if (result.success) {
        applyEventReward(save, choice);
        save.lastEventTime = Date.now();
        writeSave(save);
      }

      const { width, height } = this.scale;
      const cx = width / 2;
      this.cameras.main.setBackgroundColor(result.success ? '#f0fcf2' : '#fcf0f0');

      this.add.text(cx, height / 2 - 40, result.success ? '🎉' : '😔', { fontSize: '50px' }).setOrigin(0.5);
      this.add.text(cx, height / 2 + 20,
        result.success ? pending.event.feedbackGood : 'Rätsel nicht geschafft...',
        {
          fontSize: '16px', fontFamily: 'Georgia, serif',
          color: result.success ? THEME.text.success : THEME.text.error,
          wordWrap: { width: width - 50 }, align: 'center',
        }).setOrigin(0.5);

      this.add.text(cx, height / 2 + 80, 'Tippe zum Fortfahren...', {
        fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
      }).setOrigin(0.5);
    }

    this.input.on('pointerdown', () => this.scene.start('Town'));
  }
}
