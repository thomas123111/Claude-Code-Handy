import Phaser from 'phaser';
import { loadSave, writeSave } from '../data/SaveManager.js';
import { BREEDS, RARITY_COLORS, RARITY_LABELS } from '../data/PetData.js';

const ALL_BREEDS = [...BREEDS.dogs, ...BREEDS.cats, ...BREEDS.small];

const CATEGORY_MAP = {};
BREEDS.dogs.forEach(b => { CATEGORY_MAP[b.id] = 'Hund'; });
BREEDS.cats.forEach(b => { CATEGORY_MAP[b.id] = 'Katze'; });
BREEDS.small.forEach(b => { CATEGORY_MAP[b.id] = 'Kleintier'; });

const RARITY_FILTERS = ['all', 'common', 'rare', 'epic', 'legendary'];
const RARITY_FILTER_LABELS = {
  all: 'Alle',
  common: 'Gewöhnlich',
  rare: 'Selten',
  epic: 'Episch',
  legendary: 'Legendär',
};

const COLLECTION_BONUSES = {
  common: { reward: 100, label: 'Sammle alle Gewöhnlichen' },
  rare: { reward: 300, label: 'Sammle alle Seltenen' },
  epic: { reward: 500, label: 'Sammle alle Epischen' },
  legendary: { reward: 1000, label: 'Sammle alle Legendären' },
};

export class CollectionScene extends Phaser.Scene {
  constructor() { super('Collection'); }

  create() {
    this.save = loadSave();
    this.activeFilter = 'all';
    this.scrollY = 0;

    // Initialize collection bonuses tracker
    if (!this.save.collectionBonuses) {
      this.save.collectionBonuses = {};
      writeSave(this.save);
    }

    // Check and award collection bonuses
    this.checkCollectionBonuses();

    this.drawUI();
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];

    const { width, height } = this.scale;
    const cx = width / 2;
    const save = this.save;
    const collection = save.collection || [];

    this.cameras.main.setBackgroundColor('#1a1a28');

    // Header
    this.add.text(cx, 25, '📖 Sammelbuch', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#aaaadd', fontStyle: 'bold',
    }).setOrigin(0.5);

    const discoveredCount = collection.length;
    const totalCount = ALL_BREEDS.length;
    this.add.text(cx, 52, `${discoveredCount}/${totalCount} entdeckt`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#8888aa',
    }).setOrigin(0.5);

    // Filter tabs
    let tabX = 15;
    const tabY = 75;
    RARITY_FILTERS.forEach((filter) => {
      const label = RARITY_FILTER_LABELS[filter];
      const isActive = this.activeFilter === filter;
      const color = filter === 'all' ? '#cccccc' : (RARITY_COLORS[filter] || '#cccccc');

      const textObj = this.add.text(tabX, tabY, label, {
        fontSize: '10px', fontFamily: 'monospace',
        color: isActive ? color : '#555566',
        fontStyle: isActive ? 'bold' : 'normal',
      });

      if (isActive) {
        // Underline active tab
        const tw = textObj.width;
        this.add.rectangle(tabX + tw / 2, tabY + 16, tw, 2,
          Phaser.Display.Color.HexStringToColor(color).color);
      }

      const tw = textObj.width;
      this.addHitArea(tabX + tw / 2, tabY + 6, tw + 10, 20, () => {
        this.activeFilter = filter;
        this.scrollY = 0;
        this.drawUI();
      });

      tabX += tw + 12;
    });

    // Filter breeds
    let filteredBreeds = ALL_BREEDS;
    if (this.activeFilter !== 'all') {
      filteredBreeds = ALL_BREEDS.filter(b => b.rarity === this.activeFilter);
    }

    // Grid layout
    const cols = 3;
    const cardW = (width - 40) / cols;
    const cardH = 100;
    const startY = 100;
    const gridStartX = 20;

    filteredBreeds.forEach((breed, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = gridStartX + col * cardW + cardW / 2;
      const y = startY + row * (cardH + 8) + cardH / 2;

      // Check if too far down to display
      if (y + cardH / 2 > height - 80) return;

      const discovered = collection.includes(breed.id);
      const rarityColor = RARITY_COLORS[breed.rarity];

      // Card background
      const bgColor = discovered ? 0x2a2a3a : 0x1a1a22;
      const borderColor = discovered
        ? Phaser.Display.Color.HexStringToColor(rarityColor).color
        : 0x333344;
      this.add.rectangle(x, y, cardW - 6, cardH, bgColor, discovered ? 0.9 : 0.5)
        .setStrokeStyle(1, borderColor);

      if (discovered) {
        // Emoji large
        this.add.text(x, y - 22, breed.emoji, {
          fontSize: '28px',
        }).setOrigin(0.5);

        // Name
        this.add.text(x, y + 12, breed.name, {
          fontSize: '9px', fontFamily: 'Georgia, serif', color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5);

        // Rarity label
        this.add.text(x, y + 26, RARITY_LABELS[breed.rarity], {
          fontSize: '8px', fontFamily: 'monospace', color: rarityColor,
        }).setOrigin(0.5);

        // Category
        this.add.text(x, y + 38, CATEGORY_MAP[breed.id] || '', {
          fontSize: '7px', fontFamily: 'monospace', color: '#666688',
        }).setOrigin(0.5);
      } else {
        // Undiscovered - silhouette
        this.add.text(x, y - 18, '?', {
          fontSize: '32px', fontFamily: 'Georgia, serif', color: '#333344',
        }).setOrigin(0.5);

        this.add.text(x, y + 18, '???', {
          fontSize: '9px', fontFamily: 'monospace', color: '#333344',
        }).setOrigin(0.5);
      }
    });

    // Reward tracker section
    const rewardY = height - 110;
    this.add.rectangle(cx, rewardY, width - 20, 50, 0x222236, 0.8)
      .setStrokeStyle(1, 0x444466);

    // Find next unclaimed bonus
    const bonusText = this.getNextBonusText(collection);
    this.add.text(cx, rewardY, bonusText, {
      fontSize: '10px', fontFamily: 'monospace', color: '#bbbb88', align: 'center',
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

  getNextBonusText(collection) {
    const bonuses = this.save.collectionBonuses || {};

    for (const rarity of ['common', 'rare', 'epic', 'legendary']) {
      if (bonuses[rarity]) continue; // Already claimed

      const breedsOfRarity = ALL_BREEDS.filter(b => b.rarity === rarity);
      const discoveredOfRarity = breedsOfRarity.filter(b => collection.includes(b.id));
      const bonus = COLLECTION_BONUSES[rarity];

      if (discoveredOfRarity.length >= breedsOfRarity.length) {
        return `${bonus.label} abgeschlossen! +${bonus.reward}❤️ Bonus erhalten!`;
      }

      return `${bonus.label} → ${bonus.reward}❤️ Bonus!\n(${discoveredOfRarity.length}/${breedsOfRarity.length})`;
    }

    return 'Alle Sammelbelohnungen erhalten! 🎉';
  }

  checkCollectionBonuses() {
    const collection = this.save.collection || [];
    const bonuses = this.save.collectionBonuses || {};
    let awarded = false;

    for (const rarity of ['common', 'rare', 'epic', 'legendary']) {
      if (bonuses[rarity]) continue; // Already claimed

      const breedsOfRarity = ALL_BREEDS.filter(b => b.rarity === rarity);
      const discoveredOfRarity = breedsOfRarity.filter(b => collection.includes(b.id));

      if (discoveredOfRarity.length >= breedsOfRarity.length) {
        const bonus = COLLECTION_BONUSES[rarity];
        this.save.hearts += bonus.reward;
        bonuses[rarity] = true;
        awarded = true;
      }
    }

    if (awarded) {
      this.save.collectionBonuses = bonuses;
      writeSave(this.save);
    }
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
