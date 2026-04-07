import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { generateAdopter, calculateMatchScore, getMatchLabel, getAdoptionFeedback } from '../data/AdopterData.js';
import { RARITY_COLORS, RARITY_LABELS } from '../data/PetData.js';

export class AdoptionScene extends Phaser.Scene {
  constructor() { super('Adoption'); }

  init(data) {
    this.petIdx = data.petIdx;
    this.petData = data.petData;
  }

  create() {
    this.save = loadSave();
    this.hitAreas = [];
    this.selectedAdopter = null;
    this.confirming = false;
    this.showingFeedback = false;

    // Generate 3 adopter candidates
    this.adopters = [];
    for (let i = 0; i < 3; i++) {
      const adopter = generateAdopter();
      adopter.matchScore = calculateMatchScore(this.petData, adopter);
      adopter.matchLabel = getMatchLabel(adopter.matchScore);
      this.adopters.push(adopter);
    }

    this.drawUI();
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];

    const { width, height } = this.scale;
    const cx = width / 2;
    const pet = this.petData;

    this.cameras.main.setBackgroundColor('#2a1a20');

    if (this.showingFeedback) {
      this.drawFeedback();
      return;
    }

    if (this.confirming && this.selectedAdopter !== null) {
      this.drawConfirmation();
      return;
    }

    // === HEADER ===
    this.add.rectangle(cx, 0, width, 50, 0x3a2030, 0.95).setOrigin(0.5, 0);
    this.add.rectangle(cx, 50, width, 2, 0x553344).setOrigin(0.5, 0);
    this.add.text(cx, 25, '🏠 Vermittlung', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5);

    // === PET PORTRAIT ===
    const breedTex = `breed_${pet.breedId}`;
    if (this.textures.exists(breedTex)) {
      this.add.image(cx, 110, breedTex).setScale(0.2);
    } else {
      this.add.text(cx, 100, pet.emoji, { fontSize: '50px' }).setOrigin(0.5);
    }

    this.add.text(cx, 170, pet.name, {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 192, `${pet.breed} · ${RARITY_LABELS[pet.rarity]}`, {
      fontSize: '11px', fontFamily: 'monospace', color: RARITY_COLORS[pet.rarity],
    }).setOrigin(0.5);

    // === INSTRUCTION ===
    this.add.text(cx, 218, 'Wähle eine Familie für dein Tier:', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#ccaa99',
    }).setOrigin(0.5);

    // === ADOPTER CARDS ===
    const cardStartY = 240;
    const cardH = 200;
    const cardGap = 10;

    this.adopters.forEach((adopter, idx) => {
      const cy = cardStartY + idx * (cardH + cardGap) + cardH / 2;
      this.drawAdopterCard(adopter, idx, cx, cy, width - 30, cardH);
    });

    // === BACK BUTTON ===
    this.add.text(cx, height - 30, '← Zurück zum Tierheim', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#887766',
    }).setOrigin(0.5);
    this.addHitArea(cx, height - 30, 250, 35, () => {
      this.scene.start('Shelter');
    });

    // Global touch
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

  drawAdopterCard(adopter, idx, cx, cy, cardW, cardH) {
    const match = adopter.matchLabel;
    const scoreColor = Phaser.Display.Color.HexStringToColor(match.color).color;

    // Card background
    this.add.rectangle(cx, cy, cardW, cardH, 0x352028, 0.9)
      .setStrokeStyle(2, scoreColor);

    // Emoji + name + age
    this.add.text(25, cy - cardH / 2 + 12, adopter.emoji, { fontSize: '28px' });
    this.add.text(65, cy - cardH / 2 + 10, adopter.name, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
    });
    this.add.text(65, cy - cardH / 2 + 30, `${adopter.age} Jahre`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#aa9988',
    });

    // Traits as tags
    const traits = adopter.traits;
    const tagValues = [traits.housing, traits.experience, traits.household, traits.activity, traits.workSchedule];
    let tagX = 25;
    const tagY = cy - cardH / 2 + 55;
    const tagColors = [0x443355, 0x335544, 0x554433, 0x334455, 0x553344];

    tagValues.forEach((val, ti) => {
      const textObj = this.add.text(0, 0, val, {
        fontSize: '9px', fontFamily: 'monospace', color: '#ccbbdd',
      });
      const tw = textObj.width + 12;
      textObj.destroy();

      // Wrap to next line if needed
      if (tagX + tw > cardW + 10) {
        tagX = 25;
      }

      this.add.rectangle(tagX + tw / 2, tagY + (ti > 2 ? 20 : 0), tw, 16, tagColors[ti], 0.6)
        .setStrokeStyle(1, 0x554466);
      this.add.text(tagX + tw / 2, tagY + (ti > 2 ? 20 : 0), val, {
        fontSize: '9px', fontFamily: 'monospace', color: '#ccbbdd',
      }).setOrigin(0.5);
      tagX += tw + 5;
      if (ti === 2) tagX = 25; // reset for second row
    });

    // Pet type preference
    this.add.text(25, cy + 15, `Sucht: ${adopter.preferences.petType} (${adopter.preferences.sizePreference})`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#998877',
    });

    // Story
    this.add.text(25, cy + 32, `"${adopter.story}"`, {
      fontSize: '9px', fontFamily: 'Georgia, serif', color: '#887766',
      fontStyle: 'italic', wordWrap: { width: cardW - 30 },
    });

    // Match score bar
    const barY = cy + cardH / 2 - 35;
    const barW = cardW - 50;
    this.add.rectangle(cx, barY, barW, 14, 0x222222).setStrokeStyle(1, 0x443344);
    const fillW = Math.max(1, barW * (adopter.matchScore / 100));
    this.add.rectangle(cx - barW / 2 + fillW / 2, barY, fillW, 14, scoreColor);
    this.add.text(cx, barY, `${adopter.matchScore}%`, {
      fontSize: '9px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Match label
    this.add.text(cx, barY + 16, match.label, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: match.color, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Tap to select
    this.addHitArea(cx, cy, cardW, cardH, () => {
      this.selectedAdopter = idx;
      this.confirming = true;
      this.drawUI();
    });
  }

  drawConfirmation() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const pet = this.petData;
    const adopter = this.adopters[this.selectedAdopter];
    const match = adopter.matchLabel;

    // Dimmed background
    this.add.rectangle(cx, height / 2, width, height, 0x1a1018, 0.95);

    // Confirmation card
    const cardY = height / 2 - 40;
    this.add.rectangle(cx, cardY, width - 40, 320, 0x2a1a20)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(match.color).color);

    this.add.text(cx, cardY - 130, 'Vermittlung bestätigen?', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Pet info
    const breedTex = `breed_${pet.breedId}`;
    if (this.textures.exists(breedTex)) {
      this.add.image(cx - 80, cardY - 60, breedTex).setScale(0.12);
    } else {
      this.add.text(cx - 80, cardY - 70, pet.emoji, { fontSize: '36px' }).setOrigin(0.5);
    }
    this.add.text(cx + 20, cardY - 75, pet.name, {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
    });
    this.add.text(cx + 20, cardY - 55, pet.breed, {
      fontSize: '11px', fontFamily: 'monospace', color: RARITY_COLORS[pet.rarity],
    });

    // Arrow
    this.add.text(cx, cardY - 15, '→', {
      fontSize: '24px', color: '#ffcc88',
    }).setOrigin(0.5);

    // Adopter info
    this.add.text(cx, cardY + 15, `${adopter.emoji} ${adopter.name}`, {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, cardY + 38, match.label, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: match.color, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Reward preview
    const baseReward = this.getBaseReward();
    const multiplier = this.getMultiplier(adopter.matchScore);
    const reward = Math.floor(baseReward * multiplier);
    this.add.text(cx, cardY + 65, `Belohnung: +${reward}❤️ + 0.5kg Futterspende`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#88aa88',
    }).setOrigin(0.5);

    // Confirm button
    this.add.rectangle(cx, cardY + 110, 240, 46, 0x337733, 0.6)
      .setStrokeStyle(2, 0x44aa44);
    this.add.text(cx, cardY + 110, `Vermittle ${pet.name}!`, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#88ff88', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.addHitArea(cx, cardY + 110, 240, 46, () => {
      this.confirmAdoption();
    });

    // Cancel button
    this.add.text(cx, cardY + 150, '← Andere Familie wählen', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#887766',
    }).setOrigin(0.5);
    this.addHitArea(cx, cardY + 150, 250, 30, () => {
      this.selectedAdopter = null;
      this.confirming = false;
      this.drawUI();
    });

    // Global touch
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

  getBaseReward() {
    const rarityBonus = { common: 20, rare: 50, epic: 120, legendary: 300 };
    return rarityBonus[this.petData.rarity] || 20;
  }

  getMultiplier(score) {
    if (score >= 90) return 3;
    if (score >= 70) return 2;
    if (score >= 50) return 1;
    return 0.5;
  }

  confirmAdoption() {
    const adopter = this.adopters[this.selectedAdopter];
    const pet = this.petData;
    const score = adopter.matchScore;

    // Calculate reward
    const baseReward = this.getBaseReward();
    const multiplier = this.getMultiplier(score);
    const reward = Math.floor(baseReward * multiplier);

    // Generate feedback
    this.feedbackText = getAdoptionFeedback(score, pet.name, adopter.name);
    this.rewardAmount = reward;
    this.feedbackScore = score;
    this.feedbackAdopter = adopter;

    // Update save
    this.save.hearts += reward;
    this.save.adopted++;
    this.save.totalDonatedKg += 0.5;

    if (!this.save.collection.includes(pet.breedId)) {
      this.save.collection.push(pet.breedId);
    }

    // Remove pet from shelter
    if (this.petIdx >= 0 && this.petIdx < this.save.pets.length) {
      this.save.pets.splice(this.petIdx, 1);
    }

    addXp(this.save, reward);
    writeSave(this.save);

    // Show feedback
    this.showingFeedback = true;
    this.drawUI();
  }

  drawFeedback() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const pet = this.petData;
    const adopter = this.feedbackAdopter;
    const match = adopter.matchLabel;
    const score = this.feedbackScore;

    // Background
    this.add.rectangle(cx, height / 2, width, height, 0x1a1018);

    // Title based on score
    const titleEmoji = score >= 70 ? '🎉' : score >= 50 ? '🤞' : '😔';
    this.add.text(cx, 80, titleEmoji, { fontSize: '48px' }).setOrigin(0.5);
    this.add.text(cx, 130, score >= 70 ? 'Vermittelt!' : 'Vermittelt...', {
      fontSize: '22px', fontFamily: 'Georgia, serif',
      color: score >= 70 ? '#ffcc88' : '#aa8866', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Pet + adopter
    this.add.text(cx, 170, `${pet.emoji} ${pet.name} → ${adopter.emoji} ${adopter.name}`, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ffffff',
    }).setOrigin(0.5);

    // Match label
    this.add.text(cx, 200, match.label, {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: match.color, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Feedback story
    this.add.rectangle(cx, 280, width - 50, 100, 0x352028, 0.8)
      .setStrokeStyle(1, 0x554444);
    this.add.text(cx, 280, this.feedbackText, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#ddccbb',
      fontStyle: 'italic', wordWrap: { width: width - 80 }, align: 'center',
    }).setOrigin(0.5);

    // Rewards
    const rewardY = 360;
    this.add.text(cx, rewardY, `+${this.rewardAmount} ❤️`, {
      fontSize: '28px', fontFamily: 'Georgia, serif', color: '#ff6688', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, rewardY + 35, '+0.5 kg Futterspende', {
      fontSize: '13px', fontFamily: 'monospace', color: '#88aa88',
    }).setOrigin(0.5);

    if (this.feedbackScore >= 90) {
      this.add.text(cx, rewardY + 60, '3x Bonus für perfektes Match!', {
        fontSize: '11px', fontFamily: 'monospace', color: '#ffcc44',
      }).setOrigin(0.5);
    } else if (this.feedbackScore >= 70) {
      this.add.text(cx, rewardY + 60, '2x Bonus für gutes Match!', {
        fontSize: '11px', fontFamily: 'monospace', color: '#4488ff',
      }).setOrigin(0.5);
    } else if (this.feedbackScore < 50) {
      this.add.text(cx, rewardY + 60, 'Halbe Belohnung. Nächstes Mal besser matchen!', {
        fontSize: '11px', fontFamily: 'monospace', color: '#ff6644',
      }).setOrigin(0.5);
    }

    // Auto-return countdown
    this.add.text(cx, height - 60, 'Zurück zum Tierheim...', {
      fontSize: '12px', fontFamily: 'monospace', color: '#776666',
    }).setOrigin(0.5);

    // Return after 3 seconds
    this.time.delayedCall(3000, () => {
      this.scene.start('Shelter');
    });

    // Also allow tap to return early
    this.add.text(cx, height - 35, '(Tippe zum Überspringen)', {
      fontSize: '10px', fontFamily: 'monospace', color: '#554444',
    }).setOrigin(0.5);
    this.addHitArea(cx, height / 2, width, height, () => {
      this.scene.start('Shelter');
    });

    // Global touch
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

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
