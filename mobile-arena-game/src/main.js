import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { HangarScene } from './scenes/HangarScene.js';
import { ArenaScene } from './scenes/ArenaScene.js';
import { ArenaCompleteScene } from './scenes/ArenaCompleteScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { MazeArenaScene } from './scenes/MazeArenaScene.js';

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: document.body,
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
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  scene: [BootScene, MenuScene, HangarScene, ArenaScene, ArenaCompleteScene, GameOverScene, MazeArenaScene],
};

const game = new Phaser.Game(config);
