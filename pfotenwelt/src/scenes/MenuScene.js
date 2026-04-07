import Phaser from 'phaser';
import { loadSave, regenerateEnergy, checkDailyLogin, writeSave } from '../data/SaveManager.js';
import { checkStoryTrigger, getRandomEvent } from '../data/StoryData.js';
import { BREEDS } from '../data/PetData.js';

export const GAME_VERSION = 'v0.6.1';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const save = loadSave();
    regenerateEnergy(save);
    const { width, height } = this.scale;
    const cx = width / 2;

    // Check daily login
    const login = checkDailyLogin(save);
    if (login.isNew) {
      writeSave(save);
      this.scene.start('DailyReward', { streak: login.streak, save });
      return;
    }

    // Check story triggers
    const story = checkStoryTrigger(save);
    if (story) {
      this.scene.start('Story', { chapter: story, returnTo: 'Menu' });
      return;
    }

    // Random event (10% chance on each menu visit)
    if (Math.random() < 0.1 && save.pets.length > 0) {
      const evt = getRandomEvent();
      if (evt.effect.hearts) {
        save.hearts += evt.effect.hearts;
      }
      if (evt.effect.need) {
        save.pets.forEach((p) => {
          p.needs[evt.effect.need] = Math.max(0, Math.min(100, p.needs[evt.effect.need] + evt.effect.change));
        });
      }
      writeSave(save);
      // Show event briefly (stored for display below)
      this.eventText = evt;
    }

    // Background gradient feel
    this.cameras.main.setBackgroundColor('#2a1f35');

    // Title
    this.add.text(cx, 50, '🐾 Pfotenwelt', {
      fontSize: '32px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 85, 'Hilf Tieren. Spiel mit Herz.', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#aa8866',
    }).setOrigin(0.5);

    // Stats bar
    this.add.text(20, 115, `❤️ ${save.hearts}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#ff6688',
    });
    this.add.text(140, 115, `⚡ ${save.energy}/${save.maxEnergy}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffcc00',
    });
    this.add.text(300, 115, `Lv.${save.level}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#88ccff',
    });

    // Shelter preview - show pets
    const panelY = 160;
    this.add.rectangle(cx, panelY + 80, width - 30, 180, 0x352a40, 0.8)
      .setStrokeStyle(2, 0x554466);
    this.add.text(cx, panelY + 10, '🏠 Dein Tierheim', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ddccee', fontStyle: 'bold',
    }).setOrigin(0.5);

    if (save.pets.length === 0) {
      this.add.text(cx, panelY + 70, 'Noch keine Tiere...\nStarte dein erstes Merge!', {
        fontSize: '12px', fontFamily: 'monospace', color: '#887799', align: 'center',
      }).setOrigin(0.5);
    } else {
      // Show pet sprites in a row
      const showPets = save.pets.slice(0, 6);
      showPets.forEach((p, i) => {
        const px = cx - ((showPets.length - 1) * 28) + i * 56;
        const breedTex = `breed_${p.breedId}`;
        if (this.textures.exists(breedTex)) {
          this.add.image(px, panelY + 55, breedTex).setScale(0.12).setDepth(5);
        } else {
          this.add.text(px, panelY + 50, p.emoji, { fontSize: '24px' }).setOrigin(0.5);
        }
      });
      this.add.text(cx, panelY + 95, `${save.pets.length} Tiere | ${save.adopted} vermittelt`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#998899',
      }).setOrigin(0.5);
    }

    // Charity counter
    this.add.text(cx, panelY + 135, `🎁 ${save.totalDonatedKg.toFixed(1)}kg Futter gespendet!`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#88cc88',
    }).setOrigin(0.5);

    // Random event message
    if (this.eventText) {
      this.add.text(cx, panelY + 155, `${this.eventText.emoji} ${this.eventText.text}`, {
        fontSize: '10px', fontFamily: 'monospace', color: '#ccaa88',
        wordWrap: { width: width - 60 }, align: 'center',
      }).setOrigin(0.5);
    }

    // Login streak
    this.add.text(cx, panelY + 180, `📅 Tag ${save.loginStreak} Streak`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#aa9977',
    }).setOrigin(0.5);

    // Buttons
    this.buttons = [];
    this.drawButton(cx, 420, '🧩  MERGE BOARD', '#8855cc', () => {
      this.scene.start('MergeBoard');
    });
    this.drawButton(cx, 490, '🏠  TIERHEIM', '#cc7744', () => {
      this.scene.start('Shelter');
    });
    this.drawButton(cx, 560, '🏥  STATIONEN', '#4488aa', () => {
      this.scene.start('Stations');
    });
    this.drawButton(cx, 630, '📖  SAMMELBUCH', '#886644', () => {
      this.scene.start('Collection');
    });

    // Bottom info
    this.add.text(cx, height - 60, `Vermittelte Tiere: ${save.adopted}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#665577',
    }).setOrigin(0.5);

    this.add.text(cx, height - 35, GAME_VERSION, {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5);

    // Touch handler
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

  getPetCategory(breedId) {
    if (BREEDS.dogs.some((b) => b.id === breedId)) return 'dogs';
    if (BREEDS.cats.some((b) => b.id === breedId)) return 'cats';
    return 'small';
  }

  drawButton(x, y, text, color, action) {
    const colorVal = Phaser.Display.Color.HexStringToColor(color).color;
    this.add.rectangle(x, y, 340, 52, colorVal, 0.3)
      .setStrokeStyle(2, colorVal);
    this.add.text(x, y, text, {
      fontSize: '17px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.buttons.push({ x, y, w: 340, h: 52, action });
  }
}
