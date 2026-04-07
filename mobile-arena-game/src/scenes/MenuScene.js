import Phaser from 'phaser';
import { loadSave, resetSave, getSelectedMech } from '../systems/SaveSystem.js';

export const GAME_VERSION = 'v0.6.1';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;
    const save = loadSave();
    const mech = getSelectedMech(save);
    const cx = width / 2;

    // Title
    this.add.text(cx, 40, 'MECH ARENA', {
      fontSize: '28px', fontFamily: 'monospace', color: '#3399ff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 68, mech.title || 'Roguelite Shooter', {
      fontSize: '11px', fontFamily: 'monospace', color: '#6688aa',
    }).setOrigin(0.5);

    // Hero display - map mech ID to dungeon sprite
    const heroSprites = { striker: 'hero_knight', titan: 'hero_knight', phantom: 'hero_mage' };
    const heroTex = heroSprites[mech.id] || 'hero_knight';
    this.add.image(cx, 140, heroTex).setScale(6);

    this.add.text(cx, 190, `${mech.name} - Lv.${mech.level}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(cx, 215, `Credits: ${save.credits}  |  Scrap: ${save.scrap}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(cx, 235, `Best: Arena ${save.highestArena}  |  Runs: ${save.totalRuns}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5);

    // Equipped skills
    const loadout = save.loadout || [];
    if (loadout.length > 0) {
      const skillStr = loadout.map((s) => s).join(' | ');
      this.add.text(cx, 260, `Skills: ${skillStr}`, {
        fontSize: '10px', fontFamily: 'monospace', color: '#44aa88',
      }).setOrigin(0.5);
    }

    // Buttons (portrait - stacked vertically)
    this.buttons = [];
    this.drawButton(cx, 330, 'START RUN', '#3399ff');
    this.drawButton(cx, 395, 'HANGAR', '#44aa44');
    this.drawButton(cx, 460, 'SKILLS', '#cc8800');
    this.drawButton(cx, 525, 'RESET SAVE', '#884444');

    // Controls hint
    this.add.text(cx, height - 60, 'Move joystick to dodge\nStop moving to auto-shoot', {
      fontSize: '10px', fontFamily: 'monospace', color: '#555555', align: 'center',
    }).setOrigin(0.5);

    // Version
    this.add.text(cx, height - 25, GAME_VERSION, {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Global touch handler
    this.input.on('pointerdown', (pointer) => {
      for (const btn of this.buttons) {
        if (pointer.x >= btn.x - btn.w / 2 && pointer.x <= btn.x + btn.w / 2 &&
            pointer.y >= btn.y - btn.h / 2 && pointer.y <= btn.y + btn.h / 2) {
          btn.action();
          return;
        }
      }
    });
  }

  drawButton(x, y, text, color) {
    // Use RPG UI button images
    const btnMap = { '#3399ff': 'btn_blue', '#44aa44': 'btn_brown', '#cc8800': 'btn_beige', '#884444': 'btn_grey' };
    const btnTex = btnMap[color] || 'btn_blue';
    const btn = this.add.image(x, y, btnTex).setDisplaySize(280, 45);
    this.add.text(x, y - 2, text, {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    let action;
    if (text === 'START RUN') {
      action = () => {
        const runSeed = Date.now();
        this.scene.start('Arena', { arenaIndex: 0, runCredits: 0, runScrap: 0, runXp: 0, runSeed });
      };
    } else if (text === 'HANGAR') {
      action = () => this.scene.start('Hangar');
    } else if (text === 'SKILLS') {
      action = () => this.scene.start('Skills');
    } else if (text === 'RESET SAVE') {
      action = () => { resetSave(); this.scene.restart(); };
    }

    this.buttons.push({ x, y, w: 300, h: 48, action });
  }
}
