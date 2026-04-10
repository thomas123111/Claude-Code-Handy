import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { OnboardingScene } from './scenes/OnboardingScene.js';
import { CompanionSelectScene } from './scenes/CompanionSelectScene.js';
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
import { FutterladenScene } from './scenes/FutterladenScene.js';
import { HundespielplatzScene } from './scenes/HundespielplatzScene.js';
import { StoryScene } from './scenes/StoryScene.js';
import { AchievementsScene } from './scenes/AchievementsScene.js';
import { CollectionScene } from './scenes/CollectionScene.js';
import { AdoptionScene } from './scenes/AdoptionScene.js';
import { EventScene, EventResultScene } from './scenes/EventScene.js';
import { GuildScene } from './scenes/GuildScene.js';
import { FarmScene } from './scenes/FarmScene.js';
import { DorftafelScene } from './scenes/DorftafelScene.js';
import { ArenaScene } from './scenes/ArenaScene.js';
// Mini-puzzles
import { Match3Puzzle } from './scenes/puzzles/Match3Puzzle.js';
import { MemoryPuzzle } from './scenes/puzzles/MemoryPuzzle.js';
import { SortPuzzle } from './scenes/puzzles/SortPuzzle.js';
import { SwipePuzzle } from './scenes/puzzles/SwipePuzzle.js';
import { TimingPuzzle } from './scenes/puzzles/TimingPuzzle.js';
import { WashPuzzle } from './scenes/puzzles/WashPuzzle.js';
import { ArrowPuzzle } from './scenes/puzzles/ArrowPuzzle.js';

const config = {
  type: Phaser.AUTO,
  width: 414,
  height: 736,
  backgroundColor: '#4a8a32',
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
    BootScene, OnboardingScene, CompanionSelectScene,
    MenuScene, TownScene,
    MergeBoardScene, ShelterScene, DailyRewardScene,
    StationsScene, VetScene, SalonScene, SchoolScene, HotelScene, CafeScene,
    FutterladenScene, HundespielplatzScene,
    StoryScene, AchievementsScene, CollectionScene, AdoptionScene,
    EventScene, EventResultScene, GuildScene, FarmScene, DorftafelScene, ArenaScene,
    Match3Puzzle, MemoryPuzzle, SortPuzzle, SwipePuzzle, TimingPuzzle, WashPuzzle, ArrowPuzzle,
  ],
};

new Phaser.Game(config);
