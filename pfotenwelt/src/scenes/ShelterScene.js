import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { calculateHappiness, decayNeeds, RARITY_COLORS, RARITY_LABELS } from '../data/PetData.js';

export class ShelterScene extends Phaser.Scene {
  constructor() { super('Shelter'); }

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

    this.cameras.main.setBackgroundColor('#221a2e');

    // Header
    this.add.text(cx, 25, '🏠 Dein Tierheim', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#ddaa77', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 52, `${save.pets.length} Tiere | ❤️ ${save.hearts}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#998877',
    }).setOrigin(0.5);

    if (save.pets.length === 0) {
      this.add.text(cx, height / 2, 'Noch keine Tiere!\n\nMerge Items im Merge Board\num Tiere freizuschalten.', {
        fontSize: '14px', fontFamily: 'monospace', color: '#776688', align: 'center',
      }).setOrigin(0.5);
    } else {
      // Pet cards
      let y = 80;
      save.pets.forEach((pet, idx) => {
        // Decay needs based on time
        const elapsed = (Date.now() - pet.arrivedAt) / 60000;
        decayNeeds(pet, Math.min(elapsed, 60)); // max 1h decay
        pet.happiness = calculateHappiness(pet);

        const cardH = 110;
        const rarityColor = RARITY_COLORS[pet.rarity];

        // Card background
        this.add.rectangle(cx, y + cardH / 2, width - 20, cardH, 0x2d2240, 0.8)
          .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(rarityColor).color);

        // Pet emoji + name
        this.add.text(25, y + 10, pet.emoji, { fontSize: '36px' });
        this.add.text(70, y + 8, pet.name, {
          fontSize: '15px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
        });
        this.add.text(70, y + 28, `${pet.breed} · ${RARITY_LABELS[pet.rarity]}`, {
          fontSize: '10px', fontFamily: 'monospace', color: rarityColor,
        });

        // Insurance badge
        if (pet.insured) {
          this.add.text(width - 25, y + 10, '🛡️', { fontSize: '16px' }).setOrigin(1, 0);
        }

        // Needs bars
        const barY = y + 50;
        const needs = [
          { key: 'hunger', label: '🍖', color: 0xff8844 },
          { key: 'hygiene', label: '🧼', color: 0x44aaff },
          { key: 'play', label: '🎾', color: 0x44dd44 },
          { key: 'health', label: '💊', color: 0xff4466 },
        ];

        needs.forEach((need, ni) => {
          const bx = 25 + ni * 125;
          const val = pet.needs[need.key];
          this.add.text(bx, barY, need.label, { fontSize: '12px' });
          this.add.rectangle(bx + 20 + 40, barY + 7, 80, 8, 0x333333)
            .setStrokeStyle(1, 0x444444);
          this.add.rectangle(bx + 20, barY + 7, 80 * (val / 100), 8, need.color)
            .setOrigin(0, 0.5);
        });

        // Action buttons
        const btnY = y + 78;
        // Feed button
        this.add.text(25, btnY, '🍖 Füttern (5❤️)', {
          fontSize: '10px', fontFamily: 'monospace', color: save.hearts >= 5 ? '#ffaa44' : '#555555',
        });
        if (save.hearts >= 5) {
          this.addHitArea(80, btnY + 6, 130, 18, () => this.feedPet(idx, 'hunger', 5));
        }

        // Clean
        this.add.text(170, btnY, '🧼 Pflegen (3❤️)', {
          fontSize: '10px', fontFamily: 'monospace', color: save.hearts >= 3 ? '#44aaff' : '#555555',
        });
        if (save.hearts >= 3) {
          this.addHitArea(230, btnY + 6, 120, 18, () => this.feedPet(idx, 'hygiene', 3));
        }

        // Play
        this.add.text(315, btnY, '🎾 Spielen (3❤️)', {
          fontSize: '10px', fontFamily: 'monospace', color: save.hearts >= 3 ? '#44dd44' : '#555555',
        });
        if (save.hearts >= 3) {
          this.addHitArea(375, btnY + 6, 120, 18, () => this.feedPet(idx, 'play', 3));
        }

        // Adoption progress
        pet.adoptionProgress = Math.min(100, pet.happiness * 1.2);
        if (pet.adoptionProgress >= 95) {
          this.add.text(cx, y + cardH - 8, '🎉 Bereit zur Vermittlung!', {
            fontSize: '10px', fontFamily: 'monospace', color: '#44ff88',
          }).setOrigin(0.5);
          this.addHitArea(cx, y + cardH - 8, 200, 18, () => this.adoptPet(idx));
        }

        y += cardH + 8;
      });
    }

    // Insurance section
    this.add.text(cx, height - 100, '🛡️ Tierversicherung', {
      fontSize: '13px', fontFamily: 'monospace', color: '#88aacc',
    }).setOrigin(0.5);
    this.add.text(cx, height - 80, 'Schützt vor hohen Tierarztkosten!', {
      fontSize: '10px', fontFamily: 'monospace', color: '#667788',
    }).setOrigin(0.5);

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

  feedPet(petIdx, need, cost) {
    const pet = this.save.pets[petIdx];
    if (!pet || this.save.hearts < cost) return;

    this.save.hearts -= cost;
    pet.needs[need] = Math.min(100, pet.needs[need] + 30);
    pet.happiness = calculateHappiness(pet);
    addXp(this.save, 5);
    writeSave(this.save);
    this.drawUI();
  }

  adoptPet(petIdx) {
    const pet = this.save.pets[petIdx];
    if (!pet) return;

    // Adoption rewards
    const rarityBonus = { common: 20, rare: 50, epic: 120, legendary: 300 };
    const bonus = rarityBonus[pet.rarity] || 20;
    this.save.hearts += bonus;
    this.save.adopted++;
    this.save.totalDonatedKg += 0.5; // Each adoption = 0.5kg donation

    // Add to collection
    if (!this.save.collection.includes(pet.breedId)) {
      this.save.collection.push(pet.breedId);
    }

    // Remove pet
    this.save.pets.splice(petIdx, 1);
    addXp(this.save, bonus);
    writeSave(this.save);
    this.drawUI();
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
