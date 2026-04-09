import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { generateAdopter, calculateMatchScore, getMatchLabel, getAdoptionFeedback } from '../data/AdopterData.js';
import { RARITY_COLORS, RARITY_LABELS } from '../data/PetData.js';
import { THEME, drawHeader, drawButton, drawCard } from '../ui/Theme.js';

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

    // Use existing adopter queue from pet, or generate fallback
    const pet = this.save.pets[this.petIdx] || this.petData;
    const queue = pet.adopterQueue || [];
    this.adopters = queue.map((a) => ({
      ...a,
      // Add full profile data for display
      emoji: ['👨', '👩', '👴', '👵', '👫', '🧑'][Math.floor(Math.random() * 6)],
      age: a.age || (25 + Math.floor(Math.random() * 45)),
      traits: a.traits || {
        housing: ['Haus mit Garten', 'Wohnung', 'Bauernhof', 'Haus'][Math.floor(Math.random() * 4)],
        experience: ['Erfahren', 'Anfänger', 'Etwas Erfahrung'][Math.floor(Math.random() * 3)],
        household: ['Familie', 'Single', 'Paar', 'Senioren'][Math.floor(Math.random() * 4)],
        activity: ['Sehr aktiv', 'Moderat', 'Ruhig'][Math.floor(Math.random() * 3)],
      },
      story: a.story || [`Sucht einen treuen Begleiter`, `Möchte einem Tier ein Zuhause geben`, `Hat schon lange einen ${pet.breed} gewollt`, `Die Kinder wünschen sich ein Haustier`][Math.floor(Math.random() * 4)],
      matchLabel: getMatchLabel(a.matchScore),
    }));

    this.drawUI();
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];

    const { width, height } = this.scale;
    const cx = width / 2;
    const pet = this.petData;

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    if (this.showingFeedback) {
      this.drawFeedback();
      return;
    }

    if (this.confirming && this.selectedAdopter !== null) {
      this.drawConfirmation();
      return;
    }

    // === HEADER ===
    this.add.rectangle(cx, 0, width, 58, THEME.bg.header, 0.98).setOrigin(0.5, 0);
    this.add.rectangle(cx, 58, width, 2, THEME.bg.headerBorder).setOrigin(0.5, 0);
    this.add.text(cx, 29, '🏠 Vermittlung', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    // === PET PORTRAIT ===
    const breedTex = `breed_${pet.breedId}`;
    if (this.textures.exists(breedTex)) {
      this.add.image(cx, 110, breedTex).setScale(0.2);
    } else {
      this.add.text(cx, 100, pet.emoji, { fontSize: '50px' }).setOrigin(0.5);
    }

    this.add.text(cx, 170, pet.name, {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 192, `${pet.breed} · ${RARITY_LABELS[pet.rarity]}`, {
      fontSize: '13px', fontFamily: 'monospace', color: RARITY_COLORS[pet.rarity],
    }).setOrigin(0.5);

    // === INSTRUCTION ===
    this.add.text(cx, 218, 'Wähle eine Familie für dein Tier:', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: THEME.text.muted,
    }).setOrigin(0.5);

    // === ADOPTER CARDS ===
    const cardStartY = 240;
    const availH = height - 70 - cardStartY; // leave room for back button
    const cardGap = 8;
    const cardH = Math.floor((availH - (this.adopters.length - 1) * cardGap) / this.adopters.length);

    this.adopters.forEach((adopter, idx) => {
      const cy = cardStartY + idx * (cardH + cardGap) + cardH / 2;
      this.drawAdopterCard(adopter, idx, cx, cy, width - 30, cardH);
    });

    // === BACK BUTTON ===
    drawButton(this, cx, height - 30, 260, 44, '← Zurück zum Tierheim', { type: 'secondary', fontSize: '15px' });
    this.addHitArea(cx, height - 30, 260, 44, () => {
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
    this.add.rectangle(cx, cy, cardW, cardH, THEME.bg.card, 0.95)
      .setStrokeStyle(2, scoreColor);

    // Emoji + name + age
    this.add.text(20, cy - cardH / 2 + 8, adopter.emoji, { fontSize: '22px' });
    this.add.text(52, cy - cardH / 2 + 6, adopter.name, {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
    });
    this.add.text(52, cy - cardH / 2 + 24, `${adopter.age} Jahre`, {
      fontSize: '12px', fontFamily: 'monospace', color: THEME.text.muted,
    });

    // Traits as tags
    const traits = adopter.traits || {};
    const tagValues = [traits.housing, traits.experience, traits.household, traits.activity].filter(Boolean);
    let tagX = 20;
    const tagY = cy - cardH / 2 + 44;
    const tagColors = [0xe8ddf5, 0xddf5e8, 0xf5edd8, 0xdde8f5];

    tagValues.forEach((val, ti) => {
      const textObj = this.add.text(0, 0, val, {
        fontSize: '11px', fontFamily: 'monospace', color: THEME.text.body,
      });
      const tw = textObj.width + 12;
      textObj.destroy();

      // Wrap to next line if needed
      if (tagX + tw > cardW + 10) {
        tagX = 20;
      }

      this.add.rectangle(tagX + tw / 2, tagY + (ti > 1 ? 20 : 0), tw, 16, tagColors[ti % tagColors.length], 0.8)
        .setStrokeStyle(1, THEME.bg.cardBorder);
      this.add.text(tagX + tw / 2, tagY + (ti > 1 ? 20 : 0), val, {
        fontSize: '11px', fontFamily: 'monospace', color: THEME.text.body,
      }).setOrigin(0.5);
      tagX += tw + 5;
      if (ti === 1) tagX = 20;
    });

    // Offer + story
    const offerY = cy + 5;
    if (adopter.offer) {
      this.add.text(20, offerY, `Bietet: ${adopter.offer}❤️`, {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.hearts, fontStyle: 'bold',
      });
    }

    // Story (only show if card is tall enough)
    if (cardH >= 150) {
      this.add.text(20, cy + 20, `"${adopter.story}"`, {
        fontSize: '11px', fontFamily: 'Georgia, serif', color: THEME.text.muted,
        fontStyle: 'italic', wordWrap: { width: cardW - 30 },
      });
    }

    // Match score bar
    const barY = cy + cardH / 2 - 28;
    const barW = cardW - 50;
    this.add.rectangle(cx, barY, barW, 14, THEME.bg.barBg).setStrokeStyle(1, THEME.bg.barBorder);
    const fillW = Math.max(1, barW * (adopter.matchScore / 100));
    this.add.rectangle(cx - barW / 2 + fillW / 2, barY, fillW, 14, scoreColor);
    this.add.text(cx, barY, `${adopter.matchScore}%`, {
      fontSize: '11px', fontFamily: 'monospace', color: THEME.text.dark, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Match label
    this.add.text(cx, barY + 16, match.label, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: match.color, fontStyle: 'bold',
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
    this.add.rectangle(cx, height / 2, width, height, THEME.bg.overlay, 0.85);

    // Confirmation card
    const cardY = height / 2 - 30;
    drawCard(this, cx, cardY, width - 30, Math.min(320, height - 160), {
      borderColor: Phaser.Display.Color.HexStringToColor(match.color).color,
    });

    this.add.text(cx, cardY - 130, 'Vermittlung bestätigen?', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Pet info
    const breedTex = `breed_${pet.breedId}`;
    if (this.textures.exists(breedTex)) {
      this.add.image(cx - 80, cardY - 60, breedTex).setScale(0.12);
    } else {
      this.add.text(cx - 80, cardY - 70, pet.emoji, { fontSize: '36px' }).setOrigin(0.5);
    }
    this.add.text(cx + 20, cardY - 75, pet.name, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
    });
    this.add.text(cx + 20, cardY - 55, pet.breed, {
      fontSize: '13px', fontFamily: 'monospace', color: RARITY_COLORS[pet.rarity],
    });

    // Arrow
    this.add.text(cx, cardY - 15, '→', {
      fontSize: '24px', color: THEME.text.title,
    }).setOrigin(0.5);

    // Adopter info
    this.add.text(cx, cardY + 15, `${adopter.emoji} ${adopter.name}`, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, cardY + 38, match.label, {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: match.color, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Reward preview
    const baseReward = this.getBaseReward();
    const multiplier = this.getMultiplier(adopter.matchScore);
    const reward = Math.floor(baseReward * multiplier);
    this.add.text(cx, cardY + 65, `Belohnung: +${reward}❤️ + 0.5kg Futterspende`, {
      fontSize: '13px', fontFamily: 'monospace', color: THEME.text.success,
    }).setOrigin(0.5);

    // Confirm button
    drawButton(this, cx, cardY + 110, 240, 46, `Vermittle ${pet.name}!`, { type: 'primary', fontSize: '16px' });
    this.addHitArea(cx, cardY + 110, 240, 46, () => {
      this.confirmAdoption();
    });

    // Cancel button
    this.add.text(cx, cardY + 150, '← Andere Familie wählen', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: THEME.text.muted,
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

    // Reward = adopter's offer (already calculated based on rarity)
    const reward = adopter.offer || 10;

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

    addXp(this.save, 15);
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
    const feedBg = score >= 70 ? '#eaf5ea' : score >= 50 ? THEME.bg.scene : '#f5eaea';
    this.cameras.main.setBackgroundColor(feedBg);

    // Title based on score
    const titleEmoji = score >= 70 ? '🎉' : score >= 50 ? '🤞' : '😔';
    this.add.text(cx, 80, titleEmoji, { fontSize: '48px' }).setOrigin(0.5);
    this.add.text(cx, 130, score >= 70 ? 'Vermittelt!' : 'Vermittelt...', {
      fontSize: '26px', fontFamily: 'Georgia, serif',
      color: score >= 70 ? THEME.text.title : THEME.text.muted, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Pet + adopter
    this.add.text(cx, 170, `${pet.emoji} ${pet.name} → ${adopter.emoji} ${adopter.name}`, {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.dark,
    }).setOrigin(0.5);

    // Match label
    this.add.text(cx, 200, match.label, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: match.color, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Feedback story
    drawCard(this, cx, 280, width - 50, 100);
    this.add.text(cx, 280, this.feedbackText, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: THEME.text.body,
      fontStyle: 'italic', wordWrap: { width: width - 80 }, align: 'center',
    }).setOrigin(0.5);

    // Rewards
    const rewardY = 360;
    this.add.text(cx, rewardY, `+${this.rewardAmount} ❤️`, {
      fontSize: '28px', fontFamily: 'Georgia, serif', color: THEME.text.hearts, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, rewardY + 35, '+0.5 kg Futterspende', {
      fontSize: '15px', fontFamily: 'monospace', color: THEME.text.success,
    }).setOrigin(0.5);

    if (this.feedbackScore >= 90) {
      this.add.text(cx, rewardY + 60, '3x Bonus für perfektes Match!', {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.energy,
      }).setOrigin(0.5);
    } else if (this.feedbackScore >= 70) {
      this.add.text(cx, rewardY + 60, '2x Bonus für gutes Match!', {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.xp,
      }).setOrigin(0.5);
    } else if (this.feedbackScore < 50) {
      this.add.text(cx, rewardY + 60, 'Halbe Belohnung. Nächstes Mal besser matchen!', {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.error,
      }).setOrigin(0.5);
    }

    // Auto-return countdown
    this.add.text(cx, height - 60, 'Zurück zum Tierheim...', {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Return after 3 seconds
    this.time.delayedCall(3000, () => {
      this.scene.start('Shelter');
    });

    // Also allow tap to return early
    this.add.text(cx, height - 35, '(Tippe zum Überspringen)', {
      fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
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
