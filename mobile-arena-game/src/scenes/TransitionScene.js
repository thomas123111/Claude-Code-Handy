import Phaser from 'phaser';

export class TransitionScene extends Phaser.Scene {
  constructor() {
    super('Transition');
  }

  init(data) {
    this.nextData = data;
    this.frameCount = 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
  }

  update() {
    // Wait 2 frames then start Arena (guarantees clean lifecycle)
    this.frameCount++;
    if (this.frameCount >= 3 && this.nextData) {
      const d = this.nextData;
      this.nextData = null;
      this.scene.start('Arena', d);
    }
  }
}
