import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { MergeBoardScene } from './scenes/MergeBoardScene.js';
import { ShelterScene } from './scenes/ShelterScene.js';
import { DailyRewardScene } from './scenes/DailyRewardScene.js';
import { StationsScene } from './scenes/StationsScene.js';
import { VetScene } from './scenes/VetScene.js';
import { SalonScene } from './scenes/SalonScene.js';
import { SchoolScene } from './scenes/SchoolScene.js';
import { HotelScene } from './scenes/HotelScene.js';
import { CafeScene } from './scenes/CafeScene.js';
import { StoryScene } from './scenes/StoryScene.js';
import { CollectionScene } from './scenes/CollectionScene.js';

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
  scene: [BootScene, MenuScene, MergeBoardScene, ShelterScene, DailyRewardScene,
          StationsScene, VetScene, SalonScene, SchoolScene, HotelScene, CafeScene,
          StoryScene, CollectionScene],
};

new Phaser.Game(config);
