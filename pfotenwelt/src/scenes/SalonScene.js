import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { RARITY_COLORS, RARITY_LABELS } from '../data/PetData.js';

export class SalonScene extends Phaser.Scene {
  constructor() { super('Salon'); }

  create() {
    this.save = loadSave();
    this.drawUI();
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];

    const { width, height } = this.scale;
    const cx = width / 2;
    const save = this.save;

    this.cameras.main.setBackgroundColor('#2a1a30');

    // Header
    this.add.text(cx, 25, '✂️ Pflegesalon', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#dd88cc', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 52, `${save.pets.length} Tiere | ❤️ ${save.hearts}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#aa7799',
    }).setOrigin(0.5);

    this.add.text(cx, 72, 'Gepflegte Tiere erhalten +25% Vermittlungsbonus!', {
      fontSize: '10px', fontFamily: 'monospace', color: '#886688',
    }).setOrigin(0.5);

    if (save.pets.length === 0) {
      this.add.text(cx, height / 2, 'Keine Tiere im Tierheim.\n\nBringe zuerst Tiere\nüber das Merge Board!', {
        fontSize: '14px', fontFamily: 'monospace', color: '#776688', align: 'center',
      }).setOrigin(0.5);
    } else {
      let y = 95;
      save.pets.forEach((pet, idx) => {
        const cardH = 70;
        const rarityColor = RARITY_COLORS[pet.rarity];

        // Card background
        this.add.rectangle(cx, y + cardH / 2, width - 20, cardH, 0x3a2240, 0.8)
          .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(rarityColor).color);

        // Pet emoji + name
        this.add.text(25, y + 8, pet.emoji, { fontSize: '30px' });
        this.add.text(65, y + 8, pet.name, {
          fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
        });
        this.add.text(65, y + 26, `${pet.breed} · ${RARITY_LABELS[pet.rarity]}`, {
          fontSize: '10px', fontFamily: 'monospace', color: rarityColor,
        });

        // Grooming status + button
        if (pet.groomed) {
          this.add.text(width - 25, y + 12, '✨ Gepflegt!', {
            fontSize: '13px', fontFamily: 'monospace', color: '#ff88dd', fontStyle: 'bold',
          }).setOrigin(1, 0);
          this.add.text(width - 25, y + 30, '+25% Bonus', {
            fontSize: '9px', fontFamily: 'monospace', color: '#aa66aa',
          }).setOrigin(1, 0);
        } else {
          const canAfford = save.hearts >= 15;
          const btnX = width - 80;
          const btnY = y + cardH / 2;

          this.add.rectangle(btnX, btnY, 120, 30, canAfford ? 0xcc44aa : 0x443344, canAfford ? 0.9 : 0.5)
            .setStrokeStyle(1, canAfford ? 0xff66cc : 0x554455);
          this.add.text(btnX, btnY, 'Pflegen 15❤️', {
            fontSize: '11px', fontFamily: 'monospace', color: canAfford ? '#ffffff' : '#665566',
          }).setOrigin(0.5);

          if (canAfford) {
            this.addHitArea(btnX, btnY, 120, 30, () => this.groomPet(idx));
          }
        }

        y += cardH + 6;
      });
    }

    // Back button
    this.add.text(cx, height - 40, '← Zurück', {
      fontSize: '14px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5);
    this.addHitArea(cx, height - 40, 120, 30, () => this.scene.start('Menu'));

    // Touch handler
    this.input.on('pointerdown', (pointer) => {
      for (const h of this.hitAreas) {
        if (pointer.x >= h.x - h.w / 2 && pointer.x <= h.x + h.w / 2 &&
            pointer.y >= h.y - h.h / 2 && pointer.y <= h.y + h.h / 2) {
          h.cb();
          return;
        }
      }
    });
  }

  groomPet(petIdx) {
    const pet = this.save.pets[petIdx];
    if (!pet || this.save.hearts < 15 || pet.groomed) return;

    this.save.hearts -= 15;
    pet.groomed = true;
    addXp(this.save, 10);
    writeSave(this.save);
    this.drawUI();
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
