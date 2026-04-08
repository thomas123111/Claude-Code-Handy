import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { RARITY_COLORS, RARITY_LABELS } from '../data/PetData.js';
import { THEME, drawHeader, drawButton, drawCard, drawBackButton } from '../ui/Theme.js';

export class SalonScene extends Phaser.Scene {
  constructor() { super('Salon'); }

  create() {
    this.save = loadSave();
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
    const bgKey = 'bg_salon';
    if (this.textures.exists(bgKey)) {
      const bg = this.add.image(width / 2, height / 2, bgKey);
      bg.setDisplaySize(width, height);
      bg.setAlpha(0.15);
      bg.setDepth(-1);
    }

    // Header
    drawHeader(this, '✂️ Pflegesalon', save);

    // Subtitle
    this.add.text(cx, 70, 'Gepflegte Tiere erhalten +25% Vermittlungsbonus!', {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    if (save.pets.length === 0) {
      this.add.text(cx, height / 2, 'Keine Tiere im Tierheim.\n\nBringe zuerst Tiere\nüber das Merge Board!', {
        fontSize: '16px', fontFamily: 'monospace', color: THEME.text.muted, align: 'center',
      }).setOrigin(0.5);
    } else {
      let y = 95;
      save.pets.forEach((pet, idx) => {
        const cardH = 70;
        const rarityColor = RARITY_COLORS[pet.rarity];
        const rarityCol = Phaser.Display.Color.HexStringToColor(rarityColor).color;

        // Card background
        drawCard(this, cx, y + cardH / 2, width - 20, cardH, { borderColor: rarityCol });

        // Pet emoji + name
        this.add.text(25, y + 8, pet.emoji, { fontSize: '30px' });
        this.add.text(65, y + 8, pet.name, {
          fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
        });
        this.add.text(65, y + 26, `${pet.breed} · ${RARITY_LABELS[pet.rarity]}`, {
          fontSize: '13px', fontFamily: 'monospace', color: rarityColor,
        });

        // Grooming status + button
        if (pet.groomed) {
          this.add.text(width - 25, y + 12, '✨ Gepflegt!', {
            fontSize: '16px', fontFamily: 'monospace', color: THEME.accent.pink, fontStyle: 'bold',
          }).setOrigin(1, 0);
          this.add.text(width - 25, y + 30, '+25% Bonus', {
            fontSize: '13px', fontFamily: 'monospace', color: THEME.accent.purple,
          }).setOrigin(1, 0);
        } else {
          const canAfford = save.hearts >= 15;
          const btnX = width - 80;
          const btnY = y + cardH / 2;

          drawButton(this, btnX, btnY, 120, 30, 'Pflegen 15❤️', {
            disabled: !canAfford,
            fontSize: '14px',
          });

          if (canAfford) {
            this.addHitArea(btnX, btnY, 120, 30, () => this.groomPet(idx));
          }
        }

        y += cardH + 6;
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

  groomPet(petIdx) {
    const pet = this.save.pets[petIdx];
    if (!pet || this.save.hearts < 15 || pet.groomed) return;

    this.registry.set('pendingGroom', { petIdx });
    this.scene.start('SwipePuzzle', {
      petName: pet.name,
      petEmoji: pet.emoji,
      onComplete: 'Salon',
    });
  }

  checkPuzzleResult() {
    const result = this.registry.get('puzzleResult');
    const pending = this.registry.get('pendingGroom');
    if (!result || !pending) return;
    this.registry.remove('puzzleResult');
    this.registry.remove('pendingGroom');

    if (result.success) {
      const pet = this.save.pets[pending.petIdx];
      if (pet) {
        this.save.hearts -= 15;
        pet.groomed = true;
        addXp(this.save, 15);
        writeSave(this.save);
      }
    }
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
