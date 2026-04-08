import Phaser from 'phaser';

const TRICK_VISUALS = {
  'Sitz': { emoji: '🐕', successEmoji: '🐕‍🦺', action: 'sitzt!' },
  'Platz': { emoji: '🐕', successEmoji: '🦮', action: 'liegt!' },
  'Pfote': { emoji: '🐾', successEmoji: '🤝', action: 'gibt Pfote!' },
  'Rolle': { emoji: '🐕', successEmoji: '🔄', action: 'rollt!' },
  'Sprung': { emoji: '🐕', successEmoji: '⬆️', action: 'springt!' },
};

export class TimingPuzzle extends Phaser.Scene {
  constructor() {
    super({ key: 'TimingPuzzle' });
  }

  init(data) {
    this.petName = data.petName || 'Rex';
    this.trickName = data.trickName || 'Sitz';
    this.onComplete = data.onComplete || 'School';
    this.totalRounds = 5;
    this.currentRound = 0;
    this.successes = 0;
    this.perfects = 0;
    this.requiredSuccesses = 3;
    this.isComplete = false;
    this.canTap = false;
    this.indicatorDirection = 1; // 1 = right, -1 = left
    this.roundResults = []; // track per-round result: 'perfect', 'success', 'fail', or null
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor('#f0f8f0');

    // Title
    this.add.text(width / 2, 40, `${this.petName}: ${this.trickName}`, {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#4a7a5a',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Dog emoji - use trick-specific visuals
    const visuals = TRICK_VISUALS[this.trickName] || TRICK_VISUALS['Sitz'];
    this.dogEmoji = this.add.text(width / 2, height * 0.3, visuals.emoji, {
      fontSize: '140px'
    }).setOrigin(0.5);

    // Timing bar setup
    this.barX = 70;
    this.barY = height * 0.55;
    this.barWidth = 400;
    this.barHeight = 40;

    // Bar background
    this.barBg = this.add.rectangle(this.barX + this.barWidth / 2, this.barY, this.barWidth, this.barHeight, 0xd8e8d8)
      .setOrigin(0.5).setStrokeStyle(2, 0xa8c8a8);

    // Tick marks on the bar (every 20%)
    this.tickMarks = [];
    for (let pct = 0.2; pct < 1.0; pct += 0.2) {
      const tickX = this.barX + this.barWidth * pct;
      const tick = this.add.rectangle(tickX, this.barY, 2, this.barHeight * 0.5, 0xa8c8a8, 0.6)
        .setOrigin(0.5);
      this.tickMarks.push(tick);
    }

    // Sweet spot (starts at 20% width, shrinks each round)
    this.sweetSpotRatio = 0.20;
    this.sweetSpotX = 0;
    this.sweetSpotWidth = 0;
    this.sweetSpotRect = this.add.rectangle(0, this.barY, 0, this.barHeight - 4, 0x44aa44, 0.6).setOrigin(0.5);

    // Perfect zone (gold, inside sweet spot)
    this.perfectZoneRect = this.add.rectangle(0, this.barY, 0, this.barHeight - 4, 0xffd700, 0.7).setOrigin(0.5);

    // Moving indicator (dark on light background)
    this.indicator = this.add.rectangle(this.barX, this.barY, 6, this.barHeight + 10, 0x4a3560).setOrigin(0.5);
    this.indicatorProgress = 0; // 0 to 1

    // Golden round label (hidden by default)
    this.goldenRoundText = this.add.text(width / 2, this.barY - 40, '🏆 GOLD RUNDE!', {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#cc8800',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);

    // Round counter
    this.roundText = this.add.text(width / 2, this.barY + 50, '', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#4a7a5a'
    }).setOrigin(0.5);

    // Success dots (streak indicator)
    this.dotsText = this.add.text(width / 2, this.barY + 85, '', {
      fontSize: '30px'
    }).setOrigin(0.5);

    // Feedback text
    this.feedbackText = this.add.text(width / 2, height * 0.75, '', {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);

    // Action text (trick-specific, shown on success)
    this.actionText = this.add.text(width / 2, height * 0.82, '', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#4a7a5a',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);

    // Instruction
    this.instructionText = this.add.text(width / 2, height - 80, 'Tippe im grünen Bereich!', {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#558866'
    }).setOrigin(0.5);

    // Global tap input
    this.input.on('pointerdown', () => {
      if (!this.canTap || this.isComplete) return;
      this.handleTap();
    });

    // Start first round
    this.time.delayedCall(500, () => this.startRound());
  }

  isGoldenRound() {
    return this.currentRound === 3;
  }

  getRoundConfig(round) {
    // Variable speed pattern per round
    switch (round) {
      case 1: // Normal speed, normal direction
        return { speed: 0.008, wobble: false };
      case 2: // Slightly faster
        return { speed: 0.010, wobble: false };
      case 3: // GOLDEN - slower but smaller target
        return { speed: 0.007, wobble: false };
      case 4: // Fast, bounces quickly
        return { speed: 0.013, wobble: false };
      case 5: // Normal speed but wobbles
        return { speed: 0.008, wobble: true };
      default:
        return { speed: 0.008, wobble: false };
    }
  }

  startRound() {
    this.currentRound++;
    if (this.currentRound > this.totalRounds) {
      this.puzzleComplete();
      return;
    }

    const isGolden = this.isGoldenRound();
    const roundConfig = this.getRoundConfig(this.currentRound);

    // Base sweet spot ratio shrinks each round
    this.sweetSpotRatio = 0.20 - (this.currentRound - 1) * 0.02;

    // Golden round: sweet spot is 30% smaller
    if (isGolden) {
      this.sweetSpotRatio *= 0.70;
    }

    this.sweetSpotWidth = this.barWidth * this.sweetSpotRatio;

    // Perfect zone: 40% of sweet spot width, centered
    this.perfectZoneWidth = this.sweetSpotWidth * 0.4;

    // Random position for sweet spot within bar
    const minX = this.barX + this.sweetSpotWidth / 2 + 10;
    const maxX = this.barX + this.barWidth - this.sweetSpotWidth / 2 - 10;
    this.sweetSpotX = Phaser.Math.Between(minX, maxX);

    // Position sweet spot
    this.sweetSpotRect.setPosition(this.sweetSpotX, this.barY);
    this.sweetSpotRect.setSize(this.sweetSpotWidth, this.barHeight - 4);
    this.sweetSpotRect.setAlpha(0.6);

    // Position perfect zone (centered inside sweet spot)
    this.perfectZoneRect.setPosition(this.sweetSpotX, this.barY);
    this.perfectZoneRect.setSize(this.perfectZoneWidth, this.barHeight - 4);
    this.perfectZoneRect.setAlpha(0.7);

    // Golden round visual: gold tint on bar
    if (isGolden) {
      this.barBg.setFillStyle(0xfff0c0);
      this.barBg.setStrokeStyle(2, 0xccaa44);
      this.goldenRoundText.setAlpha(1);
      // Pulse the golden round text
      this.tweens.add({
        targets: this.goldenRoundText,
        scale: 1.1,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      this.barBg.setFillStyle(0xd8e8d8);
      this.barBg.setStrokeStyle(2, 0xa8c8a8);
      this.goldenRoundText.setAlpha(0);
      this.tweens.killTweensOf(this.goldenRoundText);
      this.goldenRoundText.setScale(1);
    }

    // Reset indicator
    this.indicatorProgress = 0;
    this.indicatorDirection = 1;
    this.indicator.setPosition(this.barX, this.barY);

    // Speed from round config
    this.indicatorSpeed = roundConfig.speed;
    this.indicatorWobble = roundConfig.wobble;

    this.updateUI();
    this.canTap = true;
  }

  update() {
    if (!this.canTap || this.isComplete) return;

    // Calculate effective speed (with optional wobble for round 5)
    let speed = this.indicatorSpeed;
    if (this.indicatorWobble) {
      // Slight random speed variation each frame
      speed += (Math.random() - 0.5) * 0.004;
      speed = Math.max(0.004, speed); // never go negative or too slow
    }

    // Move indicator back and forth
    this.indicatorProgress += speed * this.indicatorDirection;

    if (this.indicatorProgress >= 1) {
      this.indicatorProgress = 1;
      this.indicatorDirection = -1;
    } else if (this.indicatorProgress <= 0) {
      this.indicatorProgress = 0;
      this.indicatorDirection = 1;
    }

    const ix = this.barX + this.indicatorProgress * this.barWidth;
    this.indicator.setPosition(ix, this.barY);
  }

  handleTap() {
    this.canTap = false;

    const ix = this.indicator.x;
    const halfSweet = this.sweetSpotWidth / 2;
    const halfPerfect = this.perfectZoneWidth / 2;
    const inSweet = ix >= this.sweetSpotX - halfSweet && ix <= this.sweetSpotX + halfSweet;
    const inPerfect = ix >= this.sweetSpotX - halfPerfect && ix <= this.sweetSpotX + halfPerfect;

    const isGolden = this.isGoldenRound();
    const visuals = TRICK_VISUALS[this.trickName] || TRICK_VISUALS['Sitz'];

    if (inPerfect) {
      // Perfect hit
      this.successes++;
      this.perfects++;
      this.roundResults.push('perfect');
      this.showFeedback('Perfekt! 🌟', '#ffdd00');
      this.showActionText(`${visuals.successEmoji} ${this.petName} ${visuals.action}`);
      this.animateDogSuccess(true, isGolden);
    } else if (inSweet) {
      // Good hit
      this.successes++;
      this.roundResults.push('success');
      this.showFeedback('Gut! ⭐', '#ffdd00');
      this.showActionText(`${visuals.successEmoji} ${this.petName} ${visuals.action}`);
      this.animateDogSuccess(false, isGolden);
    } else {
      // Miss
      this.roundResults.push('fail');
      this.showFeedback('Knapp! 😅', '#ff9966');
      this.animateDogMiss();
    }

    this.updateUI();

    // Next round after delay
    this.time.delayedCall(1200, () => {
      this.feedbackText.setAlpha(0);
      this.actionText.setAlpha(0);
      this.startRound();
    });
  }

  showFeedback(text, color) {
    this.feedbackText.setText(text);
    this.feedbackText.setColor(color);
    this.feedbackText.setAlpha(0);
    this.feedbackText.setScale(0.5);

    this.tweens.add({
      targets: this.feedbackText,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  showActionText(text) {
    this.actionText.setText(text);
    this.actionText.setAlpha(0);
    this.actionText.setScale(0.8);

    this.tweens.add({
      targets: this.actionText,
      alpha: 1,
      scale: 1,
      duration: 300,
      delay: 150,
      ease: 'Back.easeOut'
    });
  }

  animateDogSuccess(isPerfect, isGolden) {
    const visuals = TRICK_VISUALS[this.trickName] || TRICK_VISUALS['Sitz'];

    // Briefly show success emoji on the dog
    const originalEmoji = visuals.emoji;
    this.dogEmoji.setText(visuals.successEmoji);
    this.time.delayedCall(900, () => {
      if (!this.isComplete) {
        this.dogEmoji.setText(originalEmoji);
      }
    });

    // Bounce height varies: perfect and golden get bigger bounce
    const bounceHeight = (isPerfect || isGolden) ? 50 : 30;
    this.tweens.add({
      targets: this.dogEmoji,
      y: this.dogEmoji.y - bounceHeight,
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });

    // Sparkles around dog
    const cx = this.dogEmoji.x;
    const cy = this.dogEmoji.y;
    const sparkleCount = isPerfect ? 10 : (isGolden ? 8 : 5);
    const sparkleEmoji = isPerfect ? '🌟' : '⭐';

    for (let i = 0; i < sparkleCount; i++) {
      const star = this.add.text(
        cx + Phaser.Math.Between(-80, 80),
        cy + Phaser.Math.Between(-80, 80),
        sparkleEmoji, { fontSize: isPerfect ? '28px' : '24px' }
      ).setOrigin(0.5);
      this.tweens.add({
        targets: star,
        alpha: 0,
        y: star.y - 50,
        duration: 700,
        delay: i * 50,
        onComplete: () => star.destroy()
      });
    }

    // Golden round: extra gold sparkles
    if (isGolden) {
      for (let i = 0; i < 5; i++) {
        const trophy = this.add.text(
          cx + Phaser.Math.Between(-70, 70),
          cy + Phaser.Math.Between(-70, 70),
          '🏆', { fontSize: '20px' }
        ).setOrigin(0.5);
        this.tweens.add({
          targets: trophy,
          alpha: 0,
          y: trophy.y - 60,
          scale: 0.3,
          duration: 800,
          delay: 200 + i * 80,
          onComplete: () => trophy.destroy()
        });
      }
    }
  }

  animateDogMiss() {
    this.tweens.add({
      targets: this.dogEmoji,
      x: this.dogEmoji.x - 10,
      duration: 60,
      yoyo: true,
      repeat: 3
    });
  }

  updateUI() {
    const roundLabel = this.isGoldenRound()
      ? `Runde ${Math.min(this.currentRound, this.totalRounds)}/${this.totalRounds} 🏆`
      : `Runde ${Math.min(this.currentRound, this.totalRounds)}/${this.totalRounds}`;
    this.roundText.setText(roundLabel);

    // Streak indicator dots using round results
    let dots = '';
    for (let i = 0; i < this.totalRounds; i++) {
      if (i < this.roundResults.length) {
        const result = this.roundResults[i];
        if (result === 'perfect') {
          dots += '🌟';
        } else if (result === 'success') {
          dots += '⭐';
        } else {
          dots += '☆';
        }
      } else {
        dots += '○';
      }
    }
    this.dotsText.setText(dots);
  }

  puzzleComplete() {
    if (this.isComplete) return;
    this.isComplete = true;

    const { width, height } = this.scale;
    const success = this.successes >= this.requiredSuccesses;

    // Hide bar elements
    this.sweetSpotRect.setAlpha(0);
    this.perfectZoneRect.setAlpha(0);
    this.indicator.setAlpha(0);
    this.instructionText.setAlpha(0);
    this.goldenRoundText.setAlpha(0);
    this.tweens.killTweensOf(this.goldenRoundText);

    // Reset bar background
    this.barBg.setFillStyle(0xd8e8d8);
    this.barBg.setStrokeStyle(2, 0xa8c8a8);

    // Hide tick marks
    this.tickMarks.forEach(t => t.setAlpha(0));

    if (success) {
      // Build result string with perfect count
      let resultStr = `Bestanden! ${this.successes}/${this.totalRounds} ⭐`;
      if (this.perfects > 0) {
        resultStr += `\n${this.perfects}x Perfekt 🌟`;
      }

      const msg = this.add.text(width / 2, height * 0.7, resultStr, {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#33aa55',
        fontStyle: 'bold',
        align: 'center'
      }).setOrigin(0.5).setAlpha(0).setScale(0.5);

      this.tweens.add({
        targets: msg,
        alpha: 1,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut'
      });

      // Celebration sparkles - bigger if there were perfects
      const celebrationCount = this.perfects > 0 ? 15 : 10;
      const celebrationEmojis = this.perfects > 0
        ? ['⭐', '🌟', '🏆', '✨']
        : ['⭐'];

      for (let i = 0; i < celebrationCount; i++) {
        this.time.delayedCall(i * 80, () => {
          const emoji = celebrationEmojis[i % celebrationEmojis.length];
          const star = this.add.text(
            Phaser.Math.Between(60, width - 60),
            Phaser.Math.Between(100, height - 150),
            emoji, { fontSize: '28px' }
          ).setOrigin(0.5);
          this.tweens.add({
            targets: star,
            alpha: 0,
            y: star.y - 50,
            scale: 0.3,
            duration: 800,
            onComplete: () => star.destroy()
          });
        });
      }
    } else {
      const msg = this.add.text(width / 2, height * 0.7, `${this.successes}/${this.totalRounds} - Nächstes Mal!`, {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#dd4444',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: msg,
        alpha: 1,
        duration: 400
      });
    }

    // Transition
    this.time.delayedCall(2000, () => {
      this.registry.set('puzzleResult', { success });
      this.scene.start(this.onComplete);
    });
  }
}
