import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { TownScene } from './scenes/TownScene.js';
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
import { AdoptionScene } from './scenes/AdoptionScene.js';
import { EventScene, EventResultScene } from './scenes/EventScene.js';
import { GuildScene } from './scenes/GuildScene.js';
import { FarmScene } from './scenes/FarmScene.js';
// Mini-puzzles
import { Match3Puzzle } from './scenes/puzzles/Match3Puzzle.js';
import { MemoryPuzzle } from './scenes/puzzles/MemoryPuzzle.js';
import { SortPuzzle } from './scenes/puzzles/SortPuzzle.js';
import { SwipePuzzle } from './scenes/puzzles/SwipePuzzle.js';
import { TimingPuzzle } from './scenes/puzzles/TimingPuzzle.js';

const config = {
  type: Phaser.AUTO,
  width: 540,
  height: 960,
  backgroundColor: '#1a1520',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  input: {
    activePointers: 3,
    touch: { capture: true },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene, MenuScene, TownScene,
    MergeBoardScene, ShelterScene, DailyRewardScene,
    StationsScene, VetScene, SalonScene, SchoolScene, HotelScene, CafeScene,
    StoryScene, CollectionScene, AdoptionScene,
    EventScene, EventResultScene, GuildScene, FarmScene,
    Match3Puzzle, MemoryPuzzle, SortPuzzle, SwipePuzzle, TimingPuzzle,
  ],
};

new Phaser.Game(config);
