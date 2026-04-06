import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { HangarScene } from './scenes/HangarScene.js';
import { ArenaScene } from './scenes/ArenaScene.js';
import { ArenaCompleteScene } from './scenes/ArenaCompleteScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  parent: document.body,
  backgroundColor: '#0a0a1a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, HangarScene, ArenaScene, ArenaCompleteScene, GameOverScene],
};

const game = new Phaser.Game(config);
