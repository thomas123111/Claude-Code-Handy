import Phaser from 'phaser';
import { loadSave, writeSave } from '../data/SaveManager.js';
import { THEME, drawButton, drawCard } from '../ui/Theme.js';

const DOG_CHOICES = [
  { breedId: 'labrador', name: 'Labrador', emoji: '🐕', desc: 'Treu & verspielt' },
  { breedId: 'dackel', name: 'Dackel', emoji: '🐕', desc: 'Klein & mutig' },
  { breedId: 'husky', name: 'Husky', emoji: '🐺', desc: 'Wild & abenteuerlustig' },
];

const CAT_CHOICES = [
  { breedId: 'hauskatze', name: 'Hauskatze', emoji: '🐱', desc: 'Gemütlich & neugierig' },
  { breedId: 'perser', name: 'Perserkatze', emoji: '🐱', desc: 'Elegant & ruhig' },
  { breedId: 'maine_coon', name: 'Maine Coon', emoji: '🐱', desc: 'Groß & sanft' },
];

export class CompanionSelectScene extends Phaser.Scene {
  constructor() { super('CompanionSelect'); }

  create() {
    this.save = loadSave();
    const { width, height } = this.scale;
    this.cx = width / 2;
    this.hitAreas = [];

    const pref = this.save.profile?.preference || 'both';

    // Determine which animals to show
    if (pref === 'dogs') {
      this.choices = DOG_CHOICES;
      this.phase = 'pick_dog'; // only dogs
    } else if (pref === 'cats') {
      this.choices = CAT_CHOICES;
      this.phase = 'pick_cat'; // only cats
    } else {
      this.choices = DOG_CHOICES;
      this.phase = 'pick_dog'; // first pick dog, then cat
    }

    this.selectedBreed = null;
    this.companions = [];

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    if (this.textures.exists('splash_screen')) {
      this.add.image(width / 2, height / 2, 'splash_screen')
        .setDisplaySize(width, height).setAlpha(0.1).setDepth(-1);
    }

    this.drawUI();
  }

  drawUI() {
    this.children.list.filter(c => c.depth >= 0).forEach(c => c.destroy());
    this.hitAreas = [];
    this.input.removeAllListeners();

    const { width, height } = this.scale;
    const cx = this.cx;

    if (this.phase === 'pick_dog' || this.phase === 'pick_cat') {
      this.drawPickPhase(cx, width, height);
    } else if (this.phase === 'name') {
      this.drawNamePhase(cx, width, height);
    }

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

  drawPickPhase(cx, width, height) {
    const isDog = this.phase === 'pick_dog';
    const pref = this.save.profile?.preference || 'both';
    const stepLabel = pref === 'both'
      ? (isDog ? 'Wähle deinen Hunde-Begleiter!' : 'Jetzt deine Katze!')
      : (isDog ? 'Wähle deinen Begleiter!' : 'Wähle deinen Begleiter!');

    this.add.text(cx, 50, isDog ? '🐕' : '🐱', { fontSize: '40px' }).setOrigin(0.5);
    this.add.text(cx, 95, stepLabel, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 120, 'Dein Begleiter folgt dir überall hin!', {
      fontSize: '12px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    this.choices.forEach((choice, i) => {
      const cy = 180 + i * 95;
      const selected = this.selectedBreed === choice.breedId;
      const borderColor = selected ? 0x9966cc : THEME.bg.cardBorder;

      drawCard(this, cx, cy, width - 30, 80, { borderColor });
      if (selected) {
        this.add.rectangle(cx, cy, width - 34, 76, 0xe8ddf5, 0.5);
      }

      // Portrait
      const breedTex = `breed_${choice.breedId}`;
      if (this.textures.exists(breedTex)) {
        this.add.image(50, cy, breedTex).setScale(0.16);
      } else {
        this.add.text(40, cy, choice.emoji, { fontSize: '32px' }).setOrigin(0.5);
      }

      // Name + description
      this.add.text(90, cy - 12, choice.name, {
        fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
      });
      this.add.text(90, cy + 10, choice.desc, {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
      });

      // Selection check
      if (selected) {
        this.add.text(width - 35, cy, '✓', {
          fontSize: '22px', fontFamily: 'Georgia, serif', color: '#9966cc', fontStyle: 'bold',
        }).setOrigin(0.5);
      }

      this.addHitArea(cx, cy, width - 30, 80, () => {
        this.selectedBreed = choice.breedId;
        this.drawUI();
      });
    });

    // Continue button
    if (this.selectedBreed) {
      const btnY = height - 40;
      drawButton(this, cx, btnY, width - 60, 50, 'Auswählen! →');
      this.addHitArea(cx, btnY, width - 60, 50, () => {
        const chosen = this.choices.find(c => c.breedId === this.selectedBreed);
        this.pendingCompanion = {
          breedId: chosen.breedId,
          type: this.phase === 'pick_dog' ? 'dog' : 'cat',
          breed: chosen.name,
        };
        this.phase = 'name';
        this.companionName = '';
        this.drawUI();
      });
    }
  }

  drawNamePhase(cx, width, height) {
    const comp = this.pendingCompanion;
    const isDog = comp.type === 'dog';

    this.add.text(cx, 50, isDog ? '🐕' : '🐱', { fontSize: '40px' }).setOrigin(0.5);
    this.add.text(cx, 95, `Wie soll dein ${comp.breed} heißen?`, {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Portrait
    const breedTex = `breed_${comp.breedId}`;
    if (this.textures.exists(breedTex)) {
      this.add.image(cx, 165, breedTex).setScale(0.28);
    }

    // Name field
    drawCard(this, cx, 250, width - 60, 50);
    this.nameText = this.add.text(cx, 250, this.companionName || 'Tippe hier...', {
      fontSize: '18px', fontFamily: 'Georgia, serif',
      color: this.companionName ? THEME.text.dark : THEME.text.muted,
    }).setOrigin(0.5);

    this.addHitArea(cx, 250, width - 60, 50, () => {
      const name = prompt(`Name für deinen ${comp.breed}:`, this.companionName || '');
      if (name && name.trim()) {
        this.companionName = name.trim().substring(0, 16);
        this.nameText.setText(this.companionName).setColor(THEME.text.dark);
      }
    });

    // Suggested names
    const dogNames = ['Buddy', 'Luna', 'Balu', 'Milo', 'Bella', 'Rocky'];
    const catNames = ['Mimi', 'Felix', 'Lilly', 'Simba', 'Nala', 'Minka'];
    const suggestions = isDog ? dogNames : catNames;

    this.add.text(cx, 290, 'Vorschläge:', {
      fontSize: '12px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    const sugW = Math.floor((width - 30) / 3);
    suggestions.forEach((name, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const sx = 15 + col * sugW + sugW / 2;
      const sy = 318 + row * 38;
      drawButton(this, sx, sy, sugW - 8, 30, name, { type: 'secondary', fontSize: '14px' });
      this.addHitArea(sx, sy, sugW - 8, 30, () => {
        this.companionName = name;
        this.nameText.setText(name).setColor(THEME.text.dark);
      });
    });

    // Confirm button
    const btnY = height - 40;
    drawButton(this, cx, btnY, width - 60, 50, 'Bestätigen! ✓');
    this.addHitArea(cx, btnY, width - 60, 50, () => {
      if (!this.companionName) {
        const popup = this.add.text(cx, 45, 'Gib einen Namen ein!', {
          fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ff4444',
          backgroundColor: '#fff0f0', padding: { x: 12, y: 6 },
        }).setOrigin(0.5).setDepth(100);
        this.tweens.add({ targets: popup, alpha: 0, y: 25, duration: 1500, onComplete: () => popup.destroy() });
        return;
      }

      // Store companion
      this.companions.push({
        name: this.companionName,
        breedId: comp.breedId,
        type: comp.type,
        breed: comp.breed,
      });

      const pref = this.save.profile?.preference || 'both';

      // If "both" preference and just finished picking dog, now pick cat
      if (pref === 'both' && comp.type === 'dog') {
        this.choices = CAT_CHOICES;
        this.phase = 'pick_cat';
        this.selectedBreed = null;
        this.drawUI();
        return;
      }

      // Done! Save everything and proceed to story intro
      this.save.companions = this.companions;
      this.save.onboardingDone = true;
      writeSave(this.save);

      this.cameras.main.fadeOut(500, 26, 21, 35);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Story', { chapterId: 'ch1_arrival' });
      });
    });
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
