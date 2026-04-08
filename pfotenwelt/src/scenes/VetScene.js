import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { calculateHappiness, decayNeeds, RARITY_COLORS, RARITY_LABELS } from '../data/PetData.js';
import { THEME, drawHeader, drawButton, drawCard, drawProgressBar } from '../ui/Theme.js';

const DIAGNOSES = [
  { name: 'Erkältung', cost: 20, cure: '💊', cureLabel: 'Tablette' },
  { name: 'Verletzung', cost: 35, cure: '🩹', cureLabel: 'Verband' },
  { name: 'Magen-Darm', cost: 25, cure: '🧴', cureLabel: 'Medizin' },
  { name: 'Allergie', cost: 15, cure: '💉', cureLabel: 'Spritze' },
];

const ALL_MEDICINES = ['💊', '💉', '🩹', '🧴', '🩺', '🌡️'];

const INSURANCE_COST = 30;

export class VetScene extends Phaser.Scene {
  constructor() { super('Vet'); }

  create() {
    this.save = loadSave();
    this.assignDiagnoses();
    this.treatingPetIdx = null;
    this.drawUI();
  }

  assignDiagnoses() {
    this.save.pets.forEach((pet) => {
      const elapsed = (Date.now() - pet.arrivedAt) / 60000;
      decayNeeds(pet, Math.min(elapsed, 60));
      pet.happiness = calculateHappiness(pet);
      if (pet.needs.health < 50 && !pet.diagnosis) {
        pet.diagnosis = DIAGNOSES[Math.floor(Math.random() * DIAGNOSES.length)].name;
      }
      if (pet.needs.health >= 50 && pet.diagnosis) {
        delete pet.diagnosis;
      }
    });
    writeSave(this.save);
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];

    if (this.treatingPetIdx !== null) {
      this.drawTreatmentMode();
      return;
    }

    const { width, height } = this.scale;
    const cx = width / 2;
    const save = this.save;

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    // Background image
    if (this.textures.exists('bg_vet')) {
      const bg = this.add.image(cx, height / 2, 'bg_vet');
      bg.setDisplaySize(width, height).setAlpha(0.15).setDepth(-1);
    }

    drawHeader(this, '🏥 Tierarzt', save);

    this.add.text(cx, 72, 'Tippe auf ein Tier um es zu behandeln', {
      fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Find sick pets
    const sickPets = [];
    save.pets.forEach((pet, idx) => {
      if (pet.needs.health < 50) sickPets.push({ pet, idx });
    });

    if (sickPets.length === 0) {
      this.add.text(cx, height / 2 - 40, '🎉', { fontSize: '48px' }).setOrigin(0.5);
      this.add.text(cx, height / 2 + 20, 'Alle Tiere sind gesund!', {
        fontSize: '18px', fontFamily: 'Georgia, serif', color: THEME.text.success,
      }).setOrigin(0.5);
      this.add.text(cx, height / 2 + 50, 'Komm wieder, wenn ein Tier\nkrank wird.', {
        fontSize: '15px', fontFamily: 'monospace', color: THEME.text.muted, align: 'center',
      }).setOrigin(0.5);
    } else {
      let y = 95;
      const cardW = width - 30;

      sickPets.forEach(({ pet, idx }) => {
        const diagnosis = DIAGNOSES.find((d) => d.name === pet.diagnosis) || DIAGNOSES[0];
        const isInsured = pet.insured;
        const treatCost = isInsured ? Math.ceil(diagnosis.cost / 2) : diagnosis.cost;
        const canAfford = save.hearts >= treatCost;
        const rarityColor = RARITY_COLORS[pet.rarity];
        const rarityCol = Phaser.Display.Color.HexStringToColor(rarityColor).color;

        const cardH = 125;
        drawCard(this, cx, y + cardH / 2, cardW, cardH, { borderColor: rarityCol });

        // Pet emoji + name
        this.add.text(22, y + 12, pet.emoji, { fontSize: '32px' });
        this.add.text(65, y + 12, pet.name, {
          fontSize: '17px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
        });
        this.add.text(65, y + 33, `${pet.breed} · ${RARITY_LABELS[pet.rarity]}`, {
          fontSize: '13px', fontFamily: 'monospace', color: rarityColor,
        });

        // Insurance badge
        if (isInsured) {
          this.add.text(width - 22, y + 12, '🛡️', { fontSize: '18px' }).setOrigin(1, 0);
        }

        // Health bar
        const barY = y + 56;
        const healthPct = pet.needs.health / 100;
        this.add.text(22, barY, '💊', { fontSize: '14px' });
        drawProgressBar(this, 48, barY + 8, 180, 12, healthPct, 0xff4466);
        this.add.text(235, barY + 2, `${Math.round(pet.needs.health)}%`, {
          fontSize: '13px', fontFamily: 'monospace', color: THEME.text.hearts,
        });

        // Diagnosis + cost
        this.add.text(22, y + 80, `${diagnosis.cure} ${diagnosis.name}`, {
          fontSize: '14px', fontFamily: 'Georgia, serif', color: THEME.text.warning,
        });
        this.add.text(width - 22, y + 80, canAfford ? `${treatCost}❤️` : 'Zu wenig ❤️', {
          fontSize: '14px', fontFamily: 'monospace',
          color: canAfford ? THEME.text.hearts : THEME.text.muted,
        }).setOrigin(1, 0);

        // Tappable: entire card → treatment mode
        if (canAfford) {
          this.addHitArea(cx, y + cardH / 2, cardW, cardH, () => {
            this.treatingPetIdx = idx;
            this.drawUI();
          });
        }

        y += cardH + 12;
      });
    }

    // Back button
    drawButton(this, cx, height - 40, 280, 50, '← Zurück', { type: 'secondary' });
    this.addHitArea(cx, height - 40, 280, 50, () => this.scene.start('Town'));

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

  // === DRAG & DROP TREATMENT MODE ===
  drawTreatmentMode() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const save = this.save;
    const pet = save.pets[this.treatingPetIdx];
    if (!pet) { this.treatingPetIdx = null; this.drawUI(); return; }

    const diagnosis = DIAGNOSES.find((d) => d.name === pet.diagnosis) || DIAGNOSES[0];
    const isInsured = pet.insured;
    const treatCost = isInsured ? Math.ceil(diagnosis.cost / 2) : diagnosis.cost;

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    // Background image
    if (this.textures.exists('bg_vet')) {
      const bg = this.add.image(cx, height / 2, 'bg_vet');
      bg.setDisplaySize(width, height).setAlpha(0.2).setDepth(-1);
    }

    // Header
    this.add.rectangle(cx, 0, width, 50, THEME.bg.header, 0.98).setOrigin(0.5, 0);
    this.add.text(cx, 25, `${pet.emoji} ${pet.name} behandeln`, {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Diagnosis info
    this.add.text(cx, 65, `Diagnose: ${diagnosis.name}`, {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.warning,
    }).setOrigin(0.5);
    this.add.text(cx, 88, `Kosten: ${treatCost}❤️${isInsured ? ' (🛡️ -50%)' : ''}`, {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Pet portrait — drop zone
    const dropY = height * 0.35;
    const dropZone = this.add.circle(cx, dropY, 70, 0xf0e4f6, 0.6)
      .setStrokeStyle(3, 0xe0c8e8);
    this.dropZone = { x: cx, y: dropY, radius: 75 };

    // Pet breed portrait or emoji
    const breedTex = `breed_${pet.breedId}`;
    if (this.textures.exists(breedTex)) {
      this.add.image(cx, dropY, breedTex).setScale(0.25);
    } else {
      this.add.text(cx, dropY, pet.emoji, { fontSize: '64px' }).setOrigin(0.5);
    }

    // Hint text
    this.add.text(cx, dropY + 85, 'Ziehe die richtige Medizin hierher!', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Health bar
    const barY = dropY + 110;
    drawProgressBar(this, cx - 100, barY, 200, 14, pet.needs.health / 100, 0xff4466);
    this.add.text(cx, barY, `${Math.round(pet.needs.health)}%`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Medicine items — draggable at bottom
    const correctCure = diagnosis.cure;
    // Pick 3 wrong + 1 correct, shuffle
    const wrongMeds = ALL_MEDICINES.filter(m => m !== correctCure);
    Phaser.Utils.Array.Shuffle(wrongMeds);
    const choices = [correctCure, wrongMeds[0], wrongMeds[1], wrongMeds[2]];
    Phaser.Utils.Array.Shuffle(choices);

    const medY = height * 0.7;
    this.add.text(cx, medY - 45, '⬇️ Medizin wählen & ziehen', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: THEME.text.body,
    }).setOrigin(0.5);

    this.medSprites = [];
    const spacing = 80;
    const startX = cx - (choices.length - 1) * spacing / 2;

    choices.forEach((med, i) => {
      const mx = startX + i * spacing;
      // Background circle
      this.add.circle(mx, medY, 32, 0xffffff, 0.9).setStrokeStyle(2, 0xe0c8e8);
      const sprite = this.add.text(mx, medY, med, { fontSize: '36px' })
        .setOrigin(0.5).setDepth(10);
      this.medSprites.push({ sprite, emoji: med, origX: mx, origY: medY, isCorrect: med === correctCure });
    });

    // Feedback text (hidden initially)
    this.feedbackText = this.add.text(cx, dropY + 60, '', {
      fontSize: '22px', fontFamily: 'Georgia, serif', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0).setDepth(20);

    // Back button
    drawButton(this, cx, height - 40, 280, 50, '← Zurück', { type: 'secondary' });

    // === DRAG INPUT ===
    this.dragTarget = null;

    this.input.on('pointerdown', (pointer) => {
      // Back button check
      if (pointer.y >= height - 65 && pointer.y <= height - 15 &&
          pointer.x >= cx - 140 && pointer.x <= cx + 140) {
        this.treatingPetIdx = null;
        this.drawUI();
        return;
      }

      // Find medicine under pointer
      for (let i = this.medSprites.length - 1; i >= 0; i--) {
        const m = this.medSprites[i];
        const d = Phaser.Math.Distance.Between(pointer.x, pointer.y, m.sprite.x, m.sprite.y);
        if (d < 45) {
          this.dragTarget = m;
          m.sprite.setScale(1.3).setDepth(50);
          return;
        }
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.dragTarget) return;
      this.dragTarget.sprite.setPosition(pointer.x, pointer.y);

      // Highlight drop zone when hovering
      const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.dropZone.x, this.dropZone.y);
      dropZone.setStrokeStyle(3, dist < this.dropZone.radius ? 0x44aa66 : 0xe0c8e8);
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.dragTarget) return;
      const m = this.dragTarget;
      m.sprite.setScale(1).setDepth(10);
      this.dragTarget = null;
      dropZone.setStrokeStyle(3, 0xe0c8e8);

      // Check if dropped on pet
      const dist = Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, this.dropZone.x, this.dropZone.y);
      if (dist < this.dropZone.radius) {
        if (m.isCorrect) {
          this.treatSuccess(m, treatCost);
        } else {
          this.treatFail(m);
        }
      } else {
        // Snap back
        this.tweens.add({
          targets: m.sprite, x: m.origX, y: m.origY, duration: 200, ease: 'Back.Out',
        });
      }
    });
  }

  treatSuccess(med, cost) {
    const { width, height } = this.scale;
    const cx = width / 2;
    const pet = this.save.pets[this.treatingPetIdx];

    // Animate medicine flying to pet
    this.tweens.add({
      targets: med.sprite,
      x: this.dropZone.x, y: this.dropZone.y,
      scale: 0.5, alpha: 0, duration: 300,
    });

    // Sparkle burst
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 / 10) * i;
      const spark = this.add.text(
        this.dropZone.x + Math.cos(angle) * 10,
        this.dropZone.y + Math.sin(angle) * 10,
        '✨', { fontSize: '20px' }
      ).setOrigin(0.5).setDepth(25);
      this.tweens.add({
        targets: spark,
        x: this.dropZone.x + Math.cos(angle) * 60,
        y: this.dropZone.y + Math.sin(angle) * 60,
        alpha: 0, scale: 0.3, duration: 600, delay: i * 30,
        onComplete: () => spark.destroy(),
      });
    }

    // Success feedback
    this.feedbackText.setText('Geheilt! 🎉').setColor(THEME.text.success);
    this.tweens.add({
      targets: this.feedbackText,
      alpha: 1, scale: { from: 0.5, to: 1 }, duration: 400, ease: 'Back.Out',
    });

    // Green flash on drop zone
    const flash = this.add.circle(this.dropZone.x, this.dropZone.y, 70, 0x44ff44, 0.4).setDepth(15);
    this.tweens.add({
      targets: flash, alpha: 0, scale: 1.5, duration: 500,
      onComplete: () => flash.destroy(),
    });

    // Apply healing
    this.save.hearts -= cost;
    pet.needs.health = 100;
    delete pet.diagnosis;
    pet.happiness = calculateHappiness(pet);
    addXp(this.save, 20);
    writeSave(this.save);

    // Disable further dragging
    this.input.removeAllListeners();

    // Return to list after delay
    this.time.delayedCall(1500, () => {
      this.treatingPetIdx = null;
      this.drawUI();
    });
  }

  treatFail(med) {
    // Shake animation
    this.tweens.add({
      targets: med.sprite,
      x: { from: med.sprite.x - 8, to: med.sprite.x + 8 },
      duration: 50, repeat: 3, yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: med.sprite, x: med.origX, y: med.origY,
          duration: 300, ease: 'Back.Out',
        });
      },
    });

    // Red flash
    const flash = this.add.circle(this.dropZone.x, this.dropZone.y, 70, 0xff4444, 0.3).setDepth(15);
    this.tweens.add({
      targets: flash, alpha: 0, duration: 400,
      onComplete: () => flash.destroy(),
    });

    // Wrong feedback
    this.feedbackText.setText('Falsche Medizin! ❌').setColor(THEME.text.error);
    this.feedbackText.setAlpha(1);
    this.tweens.add({
      targets: this.feedbackText, alpha: 0, duration: 1200, delay: 400,
    });
  }

  insurePet(petIdx) {
    const pet = this.save.pets[petIdx];
    if (!pet || this.save.hearts < INSURANCE_COST) return;
    this.save.hearts -= INSURANCE_COST;
    pet.insured = true;
    if (!this.save.insuredPets.includes(pet.id)) {
      this.save.insuredPets.push(pet.id);
    }
    addXp(this.save, 10);
    writeSave(this.save);
    this.drawUI();
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
