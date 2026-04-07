import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { MergeBoardScene } from './scenes/MergeBoardScene.js';
import { ShelterScene } from './scenes/ShelterScene.js';
import { DailyRewardScene } from './scenes/DailyRewardScene.js';

const config = {
  type: Phaser.AUTO,
  width: 540,
  height: 960,
  backgroundColor: '#1a1520',
  input: {
    activePointers: 2,
    touch: { capture: true },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, MergeBoardScene, ShelterScene, DailyRewardScene],
};

new Phaser.Game(config);
