import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { BREEDS, RARITY_COLORS, RARITY_LABELS } from '../data/PetData.js';

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

    this.cameras.main.setBackgroundColor('#231a2e');

    // Header
    this.add.text(cx, 25, '🎓 Hundeschule', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 52, `❤️ ${save.hearts}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#ff6688',
    }).setOrigin(0.5);

    this.add.text(cx, 72, 'Nur Hunde. Jeder Trick: +10 Vermittlungsbonus!', {
      fontSize: '10px', fontFamily: 'monospace', color: '#bbaacc',
    }).setOrigin(0.5);

    // Filter dogs
    const dogs = save.pets.filter((pet) => DOG_BREED_IDS.includes(pet.breedId));

    // Status message
    if (this.message) {
      this.add.text(cx, 90, this.message, {
        fontSize: '12px', fontFamily: 'monospace', color: '#ffcc44', fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    if (dogs.length === 0) {
      this.add.text(cx, height / 2, 'Keine Hunde im Tierheim.\n\nHunde über das Merge Board\nfreischalten!', {
        fontSize: '14px', fontFamily: 'monospace', color: '#bbaacc', align: 'center',
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
        this.add.rectangle(cx, y + cardH / 2, width - 20, cardH, 0x2d2240, 0.8)
          .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(rarityColor).color);

        // Pet emoji + name
        this.add.text(25, y + 8, pet.emoji, { fontSize: '28px' });
        this.add.text(60, y + 8, pet.name, {
          fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold',
        });
        this.add.text(60, y + 26, `${pet.breed} · ${RARITY_LABELS[pet.rarity]}`, {
          fontSize: '10px', fontFamily: 'monospace', color: rarityColor,
        });

        // Show learned tricks
        if (learnedCount > 0) {
          this.add.text(25, y + 44, `Tricks: ${pet.tricks.join(', ')}`, {
            fontSize: '10px', fontFamily: 'monospace', color: '#88cc88',
          });
        } else {
          this.add.text(25, y + 44, 'Noch keine Tricks gelernt', {
            fontSize: '10px', fontFamily: 'monospace', color: '#bbaacc',
          });
        }

        // Trick buttons
        let bx = 25;
        const btnY = y + 68;
        TRICKS.forEach((trick) => {
          const learned = pet.tricks.includes(trick.name);
          const canAfford = save.hearts >= trick.cost;
          const btnW = 90;

          if (learned) {
            this.add.text(bx + btnW / 2, btnY, `✅ ${trick.name}`, {
              fontSize: '9px', fontFamily: 'monospace', color: '#66aa66',
            }).setOrigin(0.5);
          } else {
            const active = canAfford;
            this.add.rectangle(bx + btnW / 2, btnY, btnW - 4, 22, active ? 0x2a1f35 : 0x1a1525, active ? 0.9 : 0.5)
              .setStrokeStyle(1, active ? 0x7744aa : 0x443355);
            this.add.text(bx + btnW / 2, btnY, `${trick.name} ${trick.cost}❤️`, {
              fontSize: '9px', fontFamily: 'monospace', color: active ? '#ffffff' : '#776688',
            }).setOrigin(0.5);

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

          this.add.rectangle(compX, compY, 220, 22, canComp ? 0xaa8800 : 0x3a3a2a, canComp ? 0.9 : 0.5)
            .setStrokeStyle(1, canComp ? 0xddaa00 : 0x444433);
          this.add.text(compX, compY, `🏆 Wettbewerb ${COMPETITION_COST}❤️`, {
            fontSize: '10px', fontFamily: 'monospace', color: canComp ? '#ffdd44' : '#665544',
          }).setOrigin(0.5);

          if (canComp) {
            this.addHitArea(compX, compY, 220, 22, () => this.enterCompetition(petIdx));
          }
        }

        y += cardH + 8;
      });
    }

    // Back button
    this.add.rectangle(cx, height - 40, 260, 40, 0x2a1f35, 0.9).setStrokeStyle(1, 0x443355);
    this.add.text(cx, height - 40, '← Zurück', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.addHitArea(cx, height - 40, 260, 40, () => this.scene.start('Town'));

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

    // Launch timing puzzle
    this.registry.set('pendingTrick', { petIdx, trickName: trick.name, cost: trick.cost });
    this.scene.start('TimingPuzzle', {
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
