import Phaser from 'phaser';
import { loadSave, writeSave } from '../data/SaveManager.js';
import { applyEventReward } from '../data/EventData.js';

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

    // Dramatic background based on category
    const bgColors = {
      emergency: '#3a1015',
      community: '#1a2a15',
      special: '#1a1530',
    };
    this.cameras.main.setBackgroundColor(bgColors[evt.category] || '#1e1828');

    // Urgency banner for emergencies
    if (evt.category === 'emergency') {
      this.add.rectangle(cx, 25, width, 50, 0xff2222, 0.15);
      this.add.text(cx, 25, '⚠️ NOTFALL ⚠️', {
        fontSize: '12px', fontFamily: 'monospace', color: '#ff6644', fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // Event title + emoji
    this.add.text(cx, 70, evt.emoji, { fontSize: '50px' }).setOrigin(0.5);
    this.add.text(cx, 115, evt.title, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Story text
    this.add.text(cx, 170, evt.story, {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ddccee',
      wordWrap: { width: width - 50 }, align: 'center', lineSpacing: 5,
    }).setOrigin(0.5);

    // Timer (if event has duration)
    if (evt.duration > 0) {
      this.timeLeft = evt.duration;
      this.timerText = this.add.text(cx, 220, '', {
        fontSize: '14px', fontFamily: 'monospace', color: '#ff8844', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.updateTimer();
      this.timerInterval = this.time.addEvent({
        delay: 1000, repeat: evt.duration - 1,
        callback: () => { this.timeLeft--; this.updateTimer(); },
      });
    }

    // Choice buttons
    this.hitAreas = [];
    let btnY = 270;
    evt.choices.forEach((choice, idx) => {
      const canAfford = this.save.hearts >= (choice.cost || 0);
      const btnColor = canAfford ? 0x553388 : 0x332233;
      const borderColor = canAfford ? 0x7744aa : 0x444444;

      this.add.rectangle(cx, btnY, width - 40, 60, btnColor, 0.5)
        .setStrokeStyle(2, borderColor);

      // Choice label
      this.add.text(cx, btnY - 10, choice.label, {
        fontSize: '14px', fontFamily: 'Georgia, serif',
        color: canAfford ? '#ffffff' : '#666666', fontStyle: 'bold',
      }).setOrigin(0.5);

      // Cost + reward preview
      const costStr = choice.cost > 0 ? `Kosten: ${choice.cost}❤️ | ` : '';
      const rewardParts = [];
      if (choice.reward.hearts > 0) rewardParts.push(`+${choice.reward.hearts}❤️`);
      if (choice.reward.xp) rewardParts.push(`+${choice.reward.xp}XP`);
      if (choice.reward.pets) rewardParts.push(`+${choice.reward.pets} Tiere`);
      if (choice.reward.donationKg) rewardParts.push(`+${choice.reward.donationKg}kg Spende`);
      if (choice.puzzle) rewardParts.push('🧩 Rätsel');

      this.add.text(cx, btnY + 12, `${costStr}${rewardParts.join(' · ')}`, {
        fontSize: '9px', fontFamily: 'monospace', color: '#998888',
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
      if (this.timeLeft <= 10) this.timerText.setColor('#ff4444');
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
    this.cameras.main.setBackgroundColor(isGood ? '#1a2a1a' : '#2a1a1a');

    this.add.text(cx, height / 2 - 40, isGood ? '🎉' : '😔', { fontSize: '50px' }).setOrigin(0.5);
    this.add.text(cx, height / 2 + 20, feedback, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: isGood ? '#88ff88' : '#ff8888',
      wordWrap: { width: width - 50 }, align: 'center', lineSpacing: 5,
    }).setOrigin(0.5);

    this.add.text(cx, height / 2 + 80, 'Tippe zum Fortfahren...', {
      fontSize: '11px', fontFamily: 'monospace', color: '#776688',
    }).setOrigin(0.5);

    this.input.removeAllListeners();
    this.input.once('pointerdown', () => this.scene.start('Town'));
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
      this.cameras.main.setBackgroundColor(result.success ? '#1a2a1a' : '#2a1a1a');

      this.add.text(cx, height / 2 - 40, result.success ? '🎉' : '😔', { fontSize: '50px' }).setOrigin(0.5);
      this.add.text(cx, height / 2 + 20,
        result.success ? pending.event.feedbackGood : 'Rätsel nicht geschafft...',
        {
          fontSize: '14px', fontFamily: 'Georgia, serif',
          color: result.success ? '#88ff88' : '#ff8888',
          wordWrap: { width: width - 50 }, align: 'center',
        }).setOrigin(0.5);

      this.add.text(cx, height / 2 + 80, 'Tippe zum Fortfahren...', {
        fontSize: '11px', fontFamily: 'monospace', color: '#776688',
      }).setOrigin(0.5);
    }

    this.input.on('pointerdown', () => this.scene.start('Town'));
  }
}
