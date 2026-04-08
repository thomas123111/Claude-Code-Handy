import Phaser from 'phaser';
import { loadSave, regenerateEnergy, checkDailyLogin, writeSave } from '../data/SaveManager.js';
import { checkStoryTrigger, getRandomEvent } from '../data/StoryData.js';
import { BREEDS } from '../data/PetData.js';

export const GAME_VERSION = 'v1.4.1';

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

    // Check story triggers - DISABLED for now to prevent loop issues
    // Stories are triggered from Town scene instead

    // Random event (10% chance) - simple cosmetic only
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

    // Background
    this.cameras.main.setBackgroundColor('#f8f2fc');

    // Title
    this.add.text(cx, 50, '🐾 Pfotenwelt', {
      fontSize: '34px', fontFamily: 'Georgia, serif', color: '#6b4c8a', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 88, 'Hilf Tieren. Spiel mit Herz.', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#8a7399',
    }).setOrigin(0.5);

    // Stats bar
    this.add.text(20, 115, `❤️ ${save.hearts}`, {
      fontSize: '15px', fontFamily: 'monospace', color: '#e85577',
    });
    this.add.text(140, 115, `⚡ ${save.energy}/${save.maxEnergy}`, {
      fontSize: '15px', fontFamily: 'monospace', color: '#e89030',
    });
    this.add.text(300, 115, `Lv.${save.level}`, {
      fontSize: '15px', fontFamily: 'monospace', color: '#5588cc',
    });

    // Shelter preview - show pets
    const panelY = 160;
    this.add.rectangle(cx, panelY + 80, width - 30, 180, 0xffffff, 0.95)
      .setStrokeStyle(2, 0xe0c8e8);
    this.add.text(cx, panelY + 10, '🏠 Dein Tierheim', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#6b4c8a', fontStyle: 'bold',
    }).setOrigin(0.5);

    if (save.pets.length === 0) {
      this.add.text(cx, panelY + 70, 'Noch keine Tiere...\nStarte dein erstes Merge!', {
        fontSize: '14px', fontFamily: 'monospace', color: '#9888a8', align: 'center',
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
        fontSize: '14px', fontFamily: 'monospace', color: '#9888a8',
      }).setOrigin(0.5);
    }

    // Charity counter
    this.add.text(cx, panelY + 135, `🎁 ${save.totalDonatedKg.toFixed(1)}kg Futter gespendet!`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#33aa55',
    }).setOrigin(0.5);

    // Random event message
    if (this.eventText) {
      this.add.text(cx, panelY + 155, `${this.eventText.emoji} ${this.eventText.text}`, {
        fontSize: '13px', fontFamily: 'monospace', color: '#8a7399',
        wordWrap: { width: width - 60 }, align: 'center',
      }).setOrigin(0.5);
    }

    // Login streak
    this.add.text(cx, panelY + 180, `📅 Tag ${save.loginStreak} Streak`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#8a7399',
    }).setOrigin(0.5);

    // Main buttons - positioned to be always visible
    this.buttons = [];
    this.drawButton(cx, 380, '🏘️  STADT BETRETEN', '#8855cc', () => {
      this.scene.start('Town');
    });
    this.drawButton(cx, 445, '📖  SAMMELBUCH', '#886644', () => {
      this.scene.start('Collection');
    });

    // Bottom info
    this.add.text(cx, height - 60, `Vermittelte Tiere: ${save.adopted}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#9888a8',
    }).setOrigin(0.5);

    this.add.text(cx, height - 35, GAME_VERSION, {
      fontSize: '14px', fontFamily: 'monospace', color: '#6b4c8a',
    }).setOrigin(0.5);

    // Touch handler
    this.input.on('pointerdown', (pointer) => {
      for (const btn of this.buttons) {
        if (pointer.x >= btn.x - btn.w / 2 && pointer.x <= btn.x + btn.w / 2 &&
            pointer.y >= btn.y - btn.h / 2 && pointer.y <= btn.y + btn.h / 2) {
          // Button press feedback: quick scale bounce
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
    // Use NineSlice brown button if available
    if (this.textures.exists('btn_brown')) {
      this.add.nineslice(x, y, 'btn_brown', null, 340, 54, 18, 18, 18, 18);
    } else {
      const colorVal = Phaser.Display.Color.HexStringToColor(color).color;
      this.add.rectangle(x, y, 340, 54, colorVal, 0.5).setStrokeStyle(2, colorVal);
    }
    this.add.text(x, y, text, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#fff8e8', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.buttons.push({ x, y, w: 340, h: 54, action });
  }
}
