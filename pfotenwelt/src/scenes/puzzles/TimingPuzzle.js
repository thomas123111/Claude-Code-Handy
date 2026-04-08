import Phaser from 'phaser';

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
    this.requiredSuccesses = 3;
    this.isComplete = false;
    this.canTap = false;
    this.indicatorDirection = 1; // 1 = right, -1 = left
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

    // Dog emoji
    this.dogEmoji = this.add.text(width / 2, height * 0.3, '🐕', {
      fontSize: '140px'
    }).setOrigin(0.5);

    // Timing bar setup
    this.barX = 70;
    this.barY = height * 0.55;
    this.barWidth = 400;
    this.barHeight = 40;

    // Bar background
    this.add.rectangle(this.barX + this.barWidth / 2, this.barY, this.barWidth, this.barHeight, 0xd8e8d8)
      .setOrigin(0.5).setStrokeStyle(2, 0xa8c8a8);

    // Sweet spot (starts at 20% width, shrinks each round)
    this.sweetSpotRatio = 0.20;
    this.sweetSpotX = 0;
    this.sweetSpotWidth = 0;
    this.sweetSpotRect = this.add.rectangle(0, this.barY, 0, this.barHeight - 4, 0x44aa44, 0.6).setOrigin(0.5);

    // Moving indicator
    this.indicator = this.add.rectangle(this.barX, this.barY, 6, this.barHeight + 10, 0xffffff).setOrigin(0.5);
    this.indicatorProgress = 0; // 0 to 1

    // Round counter
    this.roundText = this.add.text(width / 2, this.barY + 50, '', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#4a7a5a'
    }).setOrigin(0.5);

    // Success dots
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

  startRound() {
    this.currentRound++;
    if (this.currentRound > this.totalRounds) {
      this.puzzleComplete();
      return;
    }

    // Shrink sweet spot each round
    this.sweetSpotRatio = 0.20 - (this.currentRound - 1) * 0.02;
    this.sweetSpotWidth = this.barWidth * this.sweetSpotRatio;

    // Random position for sweet spot within bar
    const minX = this.barX + this.sweetSpotWidth / 2 + 10;
    const maxX = this.barX + this.barWidth - this.sweetSpotWidth / 2 - 10;
    this.sweetSpotX = Phaser.Math.Between(minX, maxX);

    this.sweetSpotRect.setPosition(this.sweetSpotX, this.barY);
    this.sweetSpotRect.setSize(this.sweetSpotWidth, this.barHeight - 4);
    this.sweetSpotRect.setAlpha(0.6);

    // Reset indicator
    this.indicatorProgress = 0;
    this.indicatorDirection = 1;
    this.indicator.setPosition(this.barX, this.barY);

    // Speed increases slightly each round
    this.indicatorSpeed = 0.008 + (this.currentRound - 1) * 0.0015;

    this.updateUI();
    this.canTap = true;
  }

  update() {
    if (!this.canTap || this.isComplete) return;

    // Move indicator back and forth
    this.indicatorProgress += this.indicatorSpeed * this.indicatorDirection;

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
    const inSweet = ix >= this.sweetSpotX - halfSweet && ix <= this.sweetSpotX + halfSweet;

    if (inSweet) {
      this.successes++;
      this.showFeedback('Gut! ⭐', '#ffdd00');
      this.animateDogSuccess();
    } else {
      this.showFeedback('Knapp! 😅', '#ff9966');
      this.animateDogMiss();
    }

    this.updateUI();

    // Next round after delay
    this.time.delayedCall(1200, () => {
      this.feedbackText.setAlpha(0);
      this.startRound();
    });
  }

  showFeedback(text, color) {
    const { width, height } = this.scale;
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

  animateDogSuccess() {
    this.tweens.add({
      targets: this.dogEmoji,
      y: this.dogEmoji.y - 30,
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });

    // Sparkles around dog
    const cx = this.dogEmoji.x;
    const cy = this.dogEmoji.y;
    for (let i = 0; i < 5; i++) {
      const star = this.add.text(
        cx + Phaser.Math.Between(-60, 60),
        cy + Phaser.Math.Between(-60, 60),
        '⭐', { fontSize: '24px' }
      ).setOrigin(0.5);
      this.tweens.add({
        targets: star,
        alpha: 0,
        y: star.y - 40,
        duration: 600,
        delay: i * 60,
        onComplete: () => star.destroy()
      });
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
    this.roundText.setText(`Runde ${Math.min(this.currentRound, this.totalRounds)}/${this.totalRounds}`);

    let dots = '';
    for (let i = 0; i < this.totalRounds; i++) {
      if (i < this.successes) {
        dots += '⭐';
      } else if (i < this.currentRound - 1 || (i === this.currentRound - 1 && !this.canTap)) {
        dots += '☆';
      } else {
        dots += '☆';
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
    this.indicator.setAlpha(0);
    this.instructionText.setAlpha(0);

    if (success) {
      const msg = this.add.text(width / 2, height * 0.7, `Bestanden! ${this.successes}/${this.totalRounds} ⭐`, {
        fontSize: '36px',
        fontFamily: 'Arial',
        color: '#33aa55',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0).setScale(0.5);

      this.tweens.add({
        targets: msg,
        alpha: 1,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut'
      });

      // Celebration sparkles
      for (let i = 0; i < 10; i++) {
        this.time.delayedCall(i * 100, () => {
          const star = this.add.text(
            Phaser.Math.Between(60, width - 60),
            Phaser.Math.Between(100, height - 150),
            '⭐', { fontSize: '28px' }
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
