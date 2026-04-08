import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { calculateHappiness } from '../data/PetData.js';
import { THEME, drawHeader, drawButton, drawCard, drawProgressBar } from '../ui/Theme.js';

const FOOD_TIERS = [
  { key: 'basic',   label: 'Basic Futter',  emoji: '🥫', cost: 5,  hunger: 20, feedAll: false },
  { key: 'premium', label: 'Premium Futter', emoji: '🍗', cost: 12, hunger: 40, feedAll: false },
  { key: 'bio',     label: 'Bio Futter',     emoji: '🥦', cost: 25, hunger: 30, feedAll: true },
];

export class FutterladenScene extends Phaser.Scene {
  constructor() { super('Futterladen'); }

  create() {
    this.save = loadSave();
    if (!this.save.foodStock) this.save.foodStock = { basic: 0, premium: 0, bio: 0 };
    this.feedMode = null;
    this.drawUI();
  }

  getDailySpecial() {
    const day = this.save.gameDay || 1;
    const idx = day % FOOD_TIERS.length;
    const discount = 20 + ((day * 7 + 13) % 21); // 20-40%
    return { idx, discount };
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];
    const { width, height } = this.scale;
    const cx = width / 2;
    this.cameras.main.setBackgroundColor(THEME.bg.scene);
    if (this.textures.exists('bg_shelter')) {
      this.add.image(cx, height / 2, 'bg_shelter')
        .setDisplaySize(width, height).setAlpha(0.15).setDepth(-1);
    }
    drawHeader(this, '🛒 Futterladen', this.save);
    this.feedMode ? this.drawFeedMode() : this.drawShop();

    const backLabel = this.feedMode ? '← Zurück zum Laden' : '← Zurück';
    drawButton(this, cx, height - 30, 260, 44, backLabel, { type: 'secondary' });
    this.addHitArea(cx, height - 30, 260, 44, () => {
      if (this.feedMode) { this.feedMode = null; this.drawUI(); }
      else { this.scene.start('Town'); }
    });
    this.input.on('pointerdown', (pointer) => {
      for (const h of this.hitAreas) {
        if (pointer.x >= h.x - h.w / 2 && pointer.x <= h.x + h.w / 2 &&
            pointer.y >= h.y - h.h / 2 && pointer.y <= h.y + h.h / 2) {
          h.cb(); return;
        }
      }
    });
  }

  drawShop() {
    const { width } = this.scale;
    const cx = width / 2;
    const save = this.save;
    const stock = save.foodStock;
    const special = this.getDailySpecial();

    this.add.text(cx, 72, `Vorrat: 🥫${stock.basic}  🍗${stock.premium}  🥦${stock.bio}`, {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.body,
    }).setOrigin(0.5);

    // Daily special banner
    drawCard(this, cx, 108, width - 30, 40);
    this.add.text(cx, 108, `⭐ Tagesangebot: ${FOOD_TIERS[special.idx].label} -${special.discount}%!`, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: THEME.accent.gold, fontStyle: 'bold',
    }).setOrigin(0.5);

    let y = 148;
    const cardW = width - 30;
    FOOD_TIERS.forEach((tier, i) => {
      const isSpecial = i === special.idx;
      const price = isSpecial ? Math.ceil(tier.cost * (1 - special.discount / 100)) : tier.cost;
      const canAfford = save.hearts >= price;
      const cardH = 105;
      const cy = y + cardH / 2;
      drawCard(this, cx, cy, cardW, cardH);

      this.add.text(22, y + 10, tier.emoji, { fontSize: '32px' });
      this.add.text(65, y + 10, tier.label, {
        fontSize: '17px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
      });
      if (isSpecial) this.add.text(65, y + 32, `⭐ -${special.discount}%`, {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.accent.gold,
      });
      this.add.text(22, y + 52, tier.feedAll ? `Alle Tiere +${tier.hunger} Hunger` : `1 Tier +${tier.hunger} Hunger`, {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
      });
      this.add.text(22, y + 72, `Vorrat: ${stock[tier.key]}`, {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.body,
      });

      // Buy button
      const btnX = width - 65;
      drawButton(this, btnX, y + 22, 80, 32, `${price}❤️`, { disabled: !canAfford, fontSize: '14px' });
      this.addHitArea(btnX, y + 22, 80, 32, () => {
        if (!canAfford) { this.showPopup(cx, y, 'Nicht genug ❤️!'); return; }
        save.hearts -= price;
        save.foodStock[tier.key]++;
        addXp(save, 3);
        writeSave(save);
        this.drawUI();
      });

      // Feed button (if stock > 0)
      if (stock[tier.key] > 0) {
        drawButton(this, btnX, y + 62, 80, 32, 'Füttern', { type: 'secondary', fontSize: '13px' });
        this.addHitArea(btnX, y + 62, 80, 32, () => {
          if (tier.feedAll) this.feedAllPets(tier.key, tier.hunger);
          else { this.feedMode = tier.key; this.drawUI(); }
        });
      }
      y += cardH + 12;
    });
  }

  drawFeedMode() {
    const { width } = this.scale;
    const cx = width / 2;
    const save = this.save;
    const tier = FOOD_TIERS.find(t => t.key === this.feedMode);
    this.add.text(cx, 72, `${tier.emoji} ${tier.label} verfüttern`, {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 92, 'Wähle ein Tier:', {
      fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);
    if (save.pets.length === 0) {
      this.add.text(cx, 200, 'Keine Tiere im Tierheim!', {
        fontSize: '15px', fontFamily: 'monospace', color: THEME.text.muted,
      }).setOrigin(0.5);
      return;
    }
    let y = 112;
    const cardW = width - 30;
    save.pets.forEach((pet, idx) => {
      const cardH = 54;
      const cy = y + cardH / 2;
      drawCard(this, cx, cy, cardW, cardH);
      this.add.text(22, y + 8, `${pet.emoji} ${pet.name}`, {
        fontSize: '15px', fontFamily: 'Georgia, serif', color: THEME.text.dark,
      });
      drawProgressBar(this, 200, y + 18, 100, 12, pet.needs.hunger / 100, 0xff8844);
      this.add.text(310, y + 12, `${Math.round(pet.needs.hunger)}%`, {
        fontSize: '12px', fontFamily: 'monospace', color: THEME.text.muted,
      });
      if (pet.needs.hunger < 100) {
        const btnX = width - 45;
        drawButton(this, btnX, cy, 60, 30, tier.emoji, { fontSize: '18px' });
        this.addHitArea(btnX, cy, 60, 30, () => this.feedSinglePet(idx, this.feedMode, tier.hunger));
      } else {
        this.add.text(width - 45, cy, '✅', { fontSize: '18px' }).setOrigin(0.5);
      }
      y += cardH + 8;
    });
  }

  feedSinglePet(petIdx, foodKey, amount) {
    const save = this.save;
    if (save.foodStock[foodKey] <= 0) return;
    const pet = save.pets[petIdx];
    if (!pet) return;
    save.foodStock[foodKey]--;
    pet.needs.hunger = Math.min(100, pet.needs.hunger + amount);
    pet.happiness = calculateHappiness(pet);
    addXp(save, 5);
    writeSave(save);
    this.drawUI();
  }

  feedAllPets(foodKey, amount) {
    const save = this.save;
    if (save.foodStock[foodKey] <= 0 || save.pets.length === 0) return;
    save.foodStock[foodKey]--;
    save.pets.forEach(pet => {
      pet.needs.hunger = Math.min(100, pet.needs.hunger + amount);
      pet.happiness = calculateHappiness(pet);
    });
    addXp(save, 10);
    writeSave(save);
    this.drawUI();
  }

  showPopup(x, y, msg) {
    const popup = this.add.text(x, y - 10, msg, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ff4444', fontStyle: 'bold',
      backgroundColor: '#fff0f0', padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setDepth(300);
    this.tweens.add({ targets: popup, y: popup.y - 20, alpha: 0, duration: 1200, onComplete: () => popup.destroy() });
  }

  addHitArea(x, y, w, h, cb) { this.hitAreas.push({ x, y, w, h, cb }); }
}
