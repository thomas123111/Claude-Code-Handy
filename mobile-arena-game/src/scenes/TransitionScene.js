import Phaser from 'phaser';

// Tiny bridge scene that transitions between arenas
// Needed because Phaser 3 scene.restart() is unreliable
export class TransitionScene extends Phaser.Scene {
  constructor() {
    super('Transition');
  }

  init(data) {
    this.nextData = data;
  }

  create() {
    // Brief black screen then start arena
    this.cameras.main.setBackgroundColor('#000000');
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Loading...', {
      fontSize: '14px', fontFamily: 'monospace', color: '#666666',
    }).setOrigin(0.5);

    // Start arena on next frame
    this.time.delayedCall(100, () => {
      this.scene.start('Arena', this.nextData);
    });
  }
}
