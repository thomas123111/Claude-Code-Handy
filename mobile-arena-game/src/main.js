import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { HangarScene } from './scenes/HangarScene.js';
import { ArenaScene } from './scenes/ArenaScene.js';
import { ArenaCompleteScene } from './scenes/ArenaCompleteScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { MazeArenaScene } from './scenes/MazeArenaScene.js';
import { SkillsScene } from './scenes/SkillsScene.js';
import { TransitionScene } from './scenes/TransitionScene.js';

const config = {
  type: Phaser.AUTO,
  width: 540,
  height: 960,
  backgroundColor: '#0a0a1a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  input: {
    activePointers: 3,
    touch: { capture: true },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, HangarScene, ArenaScene, ArenaCompleteScene, GameOverScene, MazeArenaScene, SkillsScene, TransitionScene],
};

new Phaser.Game(config);
