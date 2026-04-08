import Phaser from 'phaser';
import { loadSave, writeSave } from '../data/SaveManager.js';
import { THEME, drawButton, drawCard } from '../ui/Theme.js';

const COUNTRIES = [
  { code: 'DE', flag: '🇩🇪', name: 'Deutschland' },
  { code: 'AT', flag: '🇦🇹', name: 'Österreich' },
  { code: 'CH', flag: '🇨🇭', name: 'Schweiz' },
  { code: 'NL', flag: '🇳🇱', name: 'Niederlande' },
  { code: 'FR', flag: '🇫🇷', name: 'Frankreich' },
  { code: 'IT', flag: '🇮🇹', name: 'Italien' },
  { code: 'ES', flag: '🇪🇸', name: 'Spanien' },
  { code: 'UK', flag: '🇬🇧', name: 'Großbritannien' },
  { code: 'US', flag: '🇺🇸', name: 'USA' },
  { code: 'OTHER', flag: '🌍', name: 'Andere' },
];

const GENDERS = [
  { id: 'male', emoji: '👦', label: 'Männlich' },
  { id: 'female', emoji: '👧', label: 'Weiblich' },
  { id: 'diverse', emoji: '🧑', label: 'Divers' },
];

const PREFERENCES = [
  { id: 'dogs', emoji: '🐕', label: 'Hunde' },
  { id: 'cats', emoji: '🐱', label: 'Katzen' },
  { id: 'both', emoji: '🐾', label: 'Beides' },
];

export class OnboardingScene extends Phaser.Scene {
  constructor() { super('Onboarding'); }

  create() {
    this.save = loadSave();
    const { width, height } = this.scale;
    this.cx = width / 2;

    // Steps: 0=name, 1=gender, 2=country, 3=preference
    this.step = 0;
    this.profile = { name: '', gender: null, country: null, preference: null };

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    // Background image
    if (this.textures.exists('splash_screen')) {
      const bg = this.add.image(width / 2, height / 2, 'splash_screen');
      bg.setDisplaySize(width, height).setAlpha(0.12).setDepth(-1);
    }

    this.hitAreas = [];
    this.drawStep();
  }

  drawStep() {
    // Clear previous UI (except background)
    this.children.list.filter(c => c.depth >= 0).forEach(c => c.destroy());
    this.hitAreas = [];
    this.input.removeAllListeners();

    const { width, height } = this.scale;
    const cx = this.cx;

    // Progress dots
    for (let i = 0; i < 4; i++) {
      const dotX = cx - 30 + i * 20;
      this.add.circle(dotX, 25, 5, i <= this.step ? 0x9966cc : 0xd8c8e0).setDepth(10);
    }

    if (this.step === 0) this.drawNameStep(cx, width, height);
    else if (this.step === 1) this.drawGenderStep(cx, width, height);
    else if (this.step === 2) this.drawCountryStep(cx, width, height);
    else if (this.step === 3) this.drawPreferenceStep(cx, width, height);

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

  // === STEP 0: NAME ===
  drawNameStep(cx, width, height) {
    this.add.text(cx, 70, '🐾 Willkommen!', {
      fontSize: '24px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 110, 'Wie heißt du?', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.body,
    }).setOrigin(0.5);

    // Name display field
    drawCard(this, cx, 170, width - 60, 50);
    this.nameText = this.add.text(cx, 170, this.profile.name || 'Tippe hier...', {
      fontSize: '18px', fontFamily: 'Georgia, serif',
      color: this.profile.name ? THEME.text.dark : THEME.text.muted,
    }).setOrigin(0.5);

    // Tap the card to enter name via prompt
    this.addHitArea(cx, 170, width - 60, 50, () => {
      // Use browser prompt for text input (mobile-friendly)
      const name = prompt('Dein Name:', this.profile.name || '');
      if (name && name.trim().length > 0) {
        this.profile.name = name.trim().substring(0, 20);
        this.nameText.setText(this.profile.name).setColor(THEME.text.dark);
      }
    });

    // Suggested names
    const suggestions = ['Mia', 'Luca', 'Emma', 'Max', 'Sophie', 'Leon'];
    this.add.text(cx, 215, 'oder wähle:', {
      fontSize: '12px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    const sugW = Math.floor((width - 30) / 3);
    suggestions.forEach((name, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const sx = 15 + col * sugW + sugW / 2;
      const sy = 245 + row * 38;
      drawButton(this, sx, sy, sugW - 8, 30, name, { type: 'secondary', fontSize: '14px' });
      this.addHitArea(sx, sy, sugW - 8, 30, () => {
        this.profile.name = name;
        this.nameText.setText(name).setColor(THEME.text.dark);
      });
    });

    // Next button
    this.drawNextButton(height, () => {
      if (!this.profile.name) {
        this.showError('Bitte gib einen Namen ein!');
        return;
      }
      this.step = 1;
      this.drawStep();
    });
  }

  // === STEP 1: GENDER ===
  drawGenderStep(cx, width, height) {
    this.add.text(cx, 70, `Hey ${this.profile.name}!`, {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 105, 'Wer bist du?', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.body,
    }).setOrigin(0.5);

    GENDERS.forEach((g, i) => {
      const gy = 160 + i * 70;
      const selected = this.profile.gender === g.id;
      const borderColor = selected ? 0x9966cc : THEME.bg.cardBorder;
      drawCard(this, cx, gy, width - 50, 55, { borderColor });
      if (selected) {
        this.add.rectangle(cx, gy, width - 54, 51, 0xe8ddf5, 0.5);
      }
      this.add.text(cx, gy, `${g.emoji}  ${g.label}`, {
        fontSize: '18px', fontFamily: 'Georgia, serif', color: THEME.text.dark,
      }).setOrigin(0.5);
      this.addHitArea(cx, gy, width - 50, 55, () => {
        this.profile.gender = g.id;
        this.drawStep();
      });
    });

    this.drawNextButton(height, () => {
      if (!this.profile.gender) { this.showError('Bitte wähle aus!'); return; }
      this.step = 2;
      this.drawStep();
    });
    this.drawBackButton(height);
  }

  // === STEP 2: COUNTRY ===
  drawCountryStep(cx, width, height) {
    this.add.text(cx, 60, 'Woher kommst du?', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    const cols = 2;
    const cw = Math.floor((width - 30) / cols);
    COUNTRIES.forEach((c, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const fx = 15 + col * cw + cw / 2;
      const fy = 100 + row * 48;
      const selected = this.profile.country === c.code;
      const borderColor = selected ? 0x9966cc : THEME.bg.cardBorder;
      drawCard(this, fx, fy, cw - 8, 40, { borderColor });
      if (selected) {
        this.add.rectangle(fx, fy, cw - 12, 36, 0xe8ddf5, 0.5);
      }
      this.add.text(fx, fy, `${c.flag} ${c.name}`, {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: THEME.text.dark,
      }).setOrigin(0.5);
      this.addHitArea(fx, fy, cw - 8, 40, () => {
        this.profile.country = c.code;
        this.drawStep();
      });
    });

    this.drawNextButton(height, () => {
      if (!this.profile.country) { this.showError('Bitte wähle ein Land!'); return; }
      this.step = 3;
      this.drawStep();
    });
    this.drawBackButton(height);
  }

  // === STEP 3: PET PREFERENCE ===
  drawPreferenceStep(cx, width, height) {
    this.add.text(cx, 60, 'Was magst du lieber?', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 90, 'Das beeinflusst deine Begleiter & Tiere', {
      fontSize: '12px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    PREFERENCES.forEach((p, i) => {
      const py = 150 + i * 80;
      const selected = this.profile.preference === p.id;
      const borderColor = selected ? 0x9966cc : THEME.bg.cardBorder;
      drawCard(this, cx, py, width - 40, 65, { borderColor });
      if (selected) {
        this.add.rectangle(cx, py, width - 44, 61, 0xe8ddf5, 0.5);
      }
      this.add.text(cx, py - 8, p.emoji, { fontSize: '28px' }).setOrigin(0.5);
      this.add.text(cx, py + 18, p.label, {
        fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
      }).setOrigin(0.5);
      this.addHitArea(cx, py, width - 40, 65, () => {
        this.profile.preference = p.id;
        this.drawStep();
      });
    });

    // Finish button
    const btnY = height - 40;
    drawButton(this, cx, btnY, width - 60, 50, 'Weiter zum Begleiter! 🐾');
    this.addHitArea(cx, btnY, width - 60, 50, () => {
      if (!this.profile.preference) { this.showError('Bitte wähle!'); return; }
      // Save profile
      this.save.profile = { ...this.profile };
      writeSave(this.save);
      this.scene.start('CompanionSelect');
    });
    this.drawBackButton(height);
  }

  // === HELPERS ===
  drawNextButton(height, cb) {
    const { width } = this.scale;
    const btnY = height - 40;
    drawButton(this, this.cx, btnY, width - 80, 46, 'Weiter →');
    this.addHitArea(this.cx, btnY, width - 80, 46, cb);
  }

  drawBackButton(height) {
    const backY = height - 40;
    this.add.text(30, backY, '←', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: THEME.text.muted,
    });
    this.addHitArea(30, backY, 40, 40, () => {
      this.step--;
      this.drawStep();
    });
  }

  showError(msg) {
    const popup = this.add.text(this.cx, 50, msg, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ff4444',
      backgroundColor: '#fff0f0', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({ targets: popup, alpha: 0, y: 30, duration: 1500, onComplete: () => popup.destroy() });
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
