import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { getRandomPuzzle } from '../data/PuzzleRotator.js';
import { BREEDS, RARITY_COLORS, RARITY_LABELS } from '../data/PetData.js';
import { THEME, drawHeader, drawButton, drawCard } from '../ui/Theme.js';

const DOG_BREED_IDS = BREEDS.dogs.map((b) => b.id);

const TRICKS = [
  { name: 'Sitz', cost: 10 },
  { name: 'Platz', cost: 15 },
  { name: 'Pfote', cost: 20 },
  { name: 'Rolle', cost: 30 },
  { name: 'Sprung', cost: 50 },
];

const COMPETITION_COST = 50;
const COMPETITION_WIN_CHANCE = 0.6;
const COMPETITION_PRIZE = 200;

export class SchoolScene extends Phaser.Scene {
  constructor() { super('School'); }

  create() {
    this.save = loadSave();
    this.message = null;
    this.checkPuzzleResult();
    this.drawUI();
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];

    const { width, height } = this.scale;
    const cx = width / 2;
    const save = this.save;

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    // Background image (dimmed behind UI)
    const bgKey = 'bg_school';
    if (this.textures.exists(bgKey)) {
      const bg = this.add.image(width / 2, height / 2, bgKey);
      bg.setDisplaySize(width, height);
      bg.setAlpha(0.15);
      bg.setDepth(-1);
    }

    // Header
    drawHeader(this, '🎓 Hundeschule', save);

    // Subtitle info
    this.add.text(cx, 70, 'Nur Hunde. Jeder Trick: +10 Vermittlungsbonus!', {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Filter dogs
    const dogs = save.pets.filter((pet) => DOG_BREED_IDS.includes(pet.breedId));

    // Status message
    if (this.message) {
      this.add.text(cx, 90, this.message, {
        fontSize: '15px', fontFamily: 'monospace', color: THEME.text.warning, fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    if (dogs.length === 0) {
      this.add.text(cx, height / 2, 'Keine Hunde im Tierheim.\n\nHunde über das Merge Board\nfreischalten!', {
        fontSize: '16px', fontFamily: 'monospace', color: THEME.text.muted, align: 'center',
      }).setOrigin(0.5);
    } else {
      let y = 108;
      dogs.forEach((pet) => {
        const petIdx = save.pets.indexOf(pet);
        if (!pet.tricks) pet.tricks = [];

        const learnedCount = pet.tricks.length;
        const cardH = 120;
        const rarityColor = RARITY_COLORS[pet.rarity];

        // Card background
        const rarityHex = Phaser.Display.Color.HexStringToColor(rarityColor).color;
        drawCard(this, cx, y + cardH / 2, width - 20, cardH, { borderColor: rarityHex });

        // Pet emoji + name
        this.add.text(25, y + 8, pet.emoji, { fontSize: '28px' });
        this.add.text(60, y + 8, pet.name, {
          fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
        });
        this.add.text(60, y + 26, `${pet.breed} · ${RARITY_LABELS[pet.rarity]}`, {
          fontSize: '13px', fontFamily: 'monospace', color: rarityColor,
        });

        // Show learned tricks
        if (learnedCount > 0) {
          this.add.text(25, y + 44, `Tricks: ${pet.tricks.join(', ')}`, {
            fontSize: '13px', fontFamily: 'monospace', color: THEME.text.success,
          });
        } else {
          this.add.text(25, y + 44, 'Noch keine Tricks gelernt', {
            fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
          });
        }

        // Trick buttons
        let bx = 10;
        const btnY = y + 68;
        const btnW = Math.floor((width - 20) / TRICKS.length);
        TRICKS.forEach((trick) => {
          const learned = pet.tricks.includes(trick.name);
          const canAfford = save.hearts >= trick.cost;

          if (learned) {
            this.add.text(bx + btnW / 2, btnY, `✅ ${trick.name}`, {
              fontSize: '13px', fontFamily: 'monospace', color: THEME.text.success,
            }).setOrigin(0.5);
          } else {
            const active = canAfford;
            drawButton(this, bx + btnW / 2, btnY, btnW - 4, 22, `${trick.name} ${trick.cost}❤️`, {
              fontSize: '13px',
              disabled: !active,
            });

            if (active) {
              this.addHitArea(bx + btnW / 2, btnY, btnW - 4, 22, () => this.learnTrick(petIdx, trick));
            }
          }
          bx += btnW;
        });

        // Competition button (3+ tricks)
        if (learnedCount >= 3) {
          const compX = cx;
          const compY = y + 98;
          const canComp = save.hearts >= COMPETITION_COST;

          drawButton(this, compX, compY, 220, 22, `🏆 Wettbewerb ${COMPETITION_COST}❤️`, {
            fontSize: '13px',
            disabled: !canComp,
          });

          if (canComp) {
            this.addHitArea(compX, compY, 220, 22, () => this.enterCompetition(petIdx));
          }
        }

        y += cardH + 8;
      });
    }

    // Back button
    drawButton(this, cx, height - 40, 280, 50, '← Zurück', { type: 'secondary' });
    this.addHitArea(cx, height - 40, 280, 50, () => this.scene.start('Town'));

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

  learnTrick(petIdx, trick) {
    const pet = this.save.pets[petIdx];
    if (!pet || this.save.hearts < trick.cost) return;
    if (!pet.tricks) pet.tricks = [];
    if (pet.tricks.includes(trick.name)) return;

    // Launch random puzzle from rotation pool
    this.registry.set('pendingTrick', { petIdx, trickName: trick.name, cost: trick.cost });
    const puzzle = getRandomPuzzle(this.save, 'school');
    writeSave(this.save);
    this.scene.start(puzzle, {
      petName: pet.name,
      trickName: trick.name,
      onComplete: 'School',
    });
  }

  checkPuzzleResult() {
    const result = this.registry.get('puzzleResult');
    const pending = this.registry.get('pendingTrick');
    if (!result || !pending) return;
    this.registry.remove('puzzleResult');
    this.registry.remove('pendingTrick');

    const pet = this.save.pets[pending.petIdx];
    if (pet && result.success) {
      if (!pet.tricks) pet.tricks = [];
      this.save.hearts -= pending.cost;
      pet.tricks.push(pending.trickName);
      addXp(this.save, 15);
      this.message = `${pet.name} hat "${pending.trickName}" gelernt! 🎉`;
      writeSave(this.save);
    } else if (!result.success) {
      this.message = 'Training nicht bestanden - versuch es nochmal!';
    }
  }

  enterCompetition(petIdx) {
    const pet = this.save.pets[petIdx];
    if (!pet || this.save.hearts < COMPETITION_COST) return;
    if (!pet.tricks || pet.tricks.length < 3) return;

    this.save.hearts -= COMPETITION_COST;

    if (Math.random() < COMPETITION_WIN_CHANCE) {
      this.save.hearts += COMPETITION_PRIZE;
      addXp(this.save, 50);
      this.message = `🏆 ${pet.name} hat gewonnen! +${COMPETITION_PRIZE}❤️`;
    } else {
      addXp(this.save, 10);
      this.message = `${pet.name} hat leider nicht gewonnen. Weiter trainieren!`;
    }

    writeSave(this.save);
    this.drawUI();
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
