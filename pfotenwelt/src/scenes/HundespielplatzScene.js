import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { calculateHappiness } from '../data/PetData.js';
import { THEME, drawHeader, drawButton, drawCard, drawProgressBar } from '../ui/Theme.js';

const ACTIVITIES = [
  {
    id: 'frisbee', emoji: '🥏', name: 'Frisbee werfen',
    desc: 'Wirf die Scheibe und dein Tier fängt sie!',
    cost: 3, playBoost: 25, allPets: false, puzzle: 'TimingPuzzle',
  },
  {
    id: 'agility', emoji: '🏃', name: 'Agility-Parcours',
    desc: 'Hindernisse, Tunnel und Sprünge meistern.',
    cost: 5, playBoost: 35, allPets: false, puzzle: 'SwipePuzzle',
  },
  {
    id: 'freeplay', emoji: '🎾', name: 'Freies Spielen',
    desc: 'Alle Tiere toben gemeinsam auf der Wiese.',
    cost: 8, playBoost: 15, allPets: true, puzzle: null,
  },
];

export class HundespielplatzScene extends Phaser.Scene {
  constructor() { super('Spielplatz'); }

  create() {
    this.save = loadSave();
    this.checkParkResult();
    this.drawUI();
  }

  checkParkResult() {
    const result = this.registry.get('puzzleResult');
    const pending = this.registry.get('pendingPark');
    if (!result || !pending) return;
    this.registry.remove('puzzleResult');
    this.registry.remove('pendingPark');

    const pet = this.save.pets[pending.petIdx];
    const activity = ACTIVITIES.find((a) => a.id === pending.activity);
    if (pet && activity && result.success) {
      this.save.hearts -= activity.cost;
      pet.needs.play = Math.min(100, pet.needs.play + activity.playBoost);
      pet.happiness = calculateHappiness(pet);
      addXp(this.save, 10);
      writeSave(this.save);
    }
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];

    const { width, height } = this.scale;
    const cx = width / 2;
    const save = this.save;

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    // Background image (dimmed)
    if (this.textures.exists('bg_school')) {
      const bg = this.add.image(cx, height / 2, 'bg_school');
      bg.setDisplaySize(width, height).setAlpha(0.15).setDepth(-1);
    }

    // Header
    drawHeader(this, '🌳 Hundespielplatz', save);

    // Empty state
    if (save.pets.length === 0) {
      this.add.text(cx, height / 2 - 30, '🐾', { fontSize: '52px' }).setOrigin(0.5);
      this.add.text(cx, height / 2 + 30, 'Adoptiere zuerst Tiere im Tierheim!', {
        fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.muted,
        wordWrap: { width: width - 40 }, align: 'center',
      }).setOrigin(0.5);
      this.drawBackButton(cx, height);
      this.attachInput();
      return;
    }

    // Pet count + average play
    const avgPlay = Math.round(save.pets.reduce((s, p) => s + (p.needs.play || 0), 0) / save.pets.length);
    this.add.text(cx, 68, `${save.pets.length} Tiere · Ø Spieltrieb: ${avgPlay}%`, {
      fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Average play bar
    const barColor = avgPlay >= 60 ? 0x44dd44 : avgPlay >= 30 ? 0xddaa33 : 0xdd4444;
    drawProgressBar(this, cx - 80, 88, 160, 12, avgPlay / 100, barColor);

    // Activity cards
    let y = 115;
    const cardW = width - 24;

    ACTIVITIES.forEach((act) => {
      const cardH = 110;
      drawCard(this, cx, y + cardH / 2, cardW, cardH);

      // Emoji
      this.add.text(24, y + 10, act.emoji, { fontSize: '32px' });

      // Name
      this.add.text(68, y + 10, act.name, {
        fontSize: '17px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
      });

      // Description
      this.add.text(68, y + 32, act.desc, {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
        wordWrap: { width: cardW - 90 },
      });

      // Cost + target info
      const targetLabel = act.allPets ? 'Alle Tiere' : '1 Tier';
      this.add.text(68, y + 55, `${act.cost}❤️ · Spielen +${act.playBoost} · ${targetLabel}`, {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.body,
      });

      if (act.allPets) {
        this.add.text(68, y + 72, '+10% Glücksbonus für alle!', {
          fontSize: '12px', fontFamily: 'monospace', color: THEME.text.success,
        });
      }

      // Play button
      const canAfford = save.hearts >= act.cost;
      const btnX = width - 55;
      const btnY = y + cardH / 2;
      drawButton(this, btnX, btnY, 70, 34, '▶ Los!', {
        fontSize: '14px', disabled: !canAfford,
      });

      this.addHitArea(btnX, btnY, 70, 34, () => {
        if (!canAfford) {
          this.showPopup('Nicht genug ❤️!');
          return;
        }
        this.startActivity(act);
      });

      y += cardH + 10;
    });

    // Back button
    this.drawBackButton(cx, height);
    this.attachInput();
  }

  startActivity(activity) {
    const save = this.save;

    if (activity.allPets) {
      // Freies Spielen: instant, all pets
      if (save.hearts < activity.cost) return;
      save.hearts -= activity.cost;
      save.pets.forEach((pet) => {
        pet.needs.play = Math.min(100, pet.needs.play + activity.playBoost);
        // +10% happiness bonus
        pet.happiness = Math.min(100, calculateHappiness(pet) * 1.1);
      });
      addXp(save, 15);
      writeSave(save);
      this.showPopup('Alle Tiere haben gespielt! 🎉');
      this.time.delayedCall(800, () => this.drawUI());
      return;
    }

    // Single pet: pick first pet with lowest play need
    const petIdx = save.pets.reduce((best, pet, idx) => {
      if (best === -1) return idx;
      return pet.needs.play < save.pets[best].needs.play ? idx : best;
    }, -1);

    if (petIdx < 0) return;
    const pet = save.pets[petIdx];

    this.registry.set('pendingPark', { petIdx, activity: activity.id });
    this.scene.start(activity.puzzle, {
      petName: pet.name,
      onComplete: 'Spielplatz',
    });
  }

  showPopup(message) {
    const { width } = this.scale;
    const popup = this.add.text(width / 2, 105, message, {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: THEME.text.success, fontStyle: 'bold',
      backgroundColor: '#f0fff0', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(300);
    this.tweens.add({
      targets: popup, y: popup.y - 25, alpha: 0, duration: 1400,
      onComplete: () => popup.destroy(),
    });
  }

  drawBackButton(cx, height) {
    drawButton(this, cx, height - 30, 260, 44, '← Zurück', { type: 'secondary' });
    this.addHitArea(cx, height - 30, 260, 44, () => this.scene.start('Town'));
  }

  attachInput() {
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
