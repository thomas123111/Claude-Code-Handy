// Centralized UI theme — Pastel Kawaii style matching splash_screen.jpg
import Phaser from 'phaser';

// === COLOR PALETTE ===
export const THEME = {
  bg: {
    scene: '#f8f2fc',        // soft lavender — main scene background
    header: 0xf0e4f6,        // light lavender header
    headerBorder: 0xe0c8e8,
    card: 0xffffff,
    cardAlpha: 0.95,
    cardBorder: 0xe0c8e8,
    cardDark: 0xf5eefa,      // slightly tinted card variant
    overlay: 0x2a1a3a,
    barBg: 0xe0d0e8,
    barBorder: 0xd0b8d8,
  },
  text: {
    title: '#6b4c8a',
    subtitle: '#8a7399',
    body: '#4a3560',
    muted: '#9888a8',
    white: '#ffffff',
    dark: '#2a1a3a',
    hearts: '#e85577',
    energy: '#e89030',
    xp: '#5588cc',
    success: '#33aa55',
    warning: '#dd8833',
    error: '#dd4444',
  },
  rarity: {
    common: '#888888',
    rare: '#4488ff',
    epic: '#9944ee',
    legendary: '#ff9900',
  },
  accent: {
    pink: '#e87898',
    purple: '#9966cc',
    blue: '#5599cc',
    green: '#55aa66',
    orange: '#e89050',
    gold: '#ddaa33',
  },
};

export const RARITY_COLORS = THEME.rarity;

// === FONT PRESETS (bigger for mobile readability) ===
export const FONTS = {
  title:    { fontSize: '26px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold' },
  subtitle: { fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.subtitle },
  heading:  { fontSize: '20px', fontFamily: 'Georgia, serif', color: THEME.text.body, fontStyle: 'bold' },
  body:     { fontSize: '15px', fontFamily: 'Georgia, serif', color: THEME.text.body },
  bodyMono: { fontSize: '14px', fontFamily: 'monospace', color: THEME.text.body },
  small:    { fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted },
  button:   { fontSize: '17px', fontFamily: 'Georgia, serif', color: '#fff8e8', fontStyle: 'bold' },
  stat:     { fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold' },
};

// === PET BREED SPRITE MAP ===
const BREED_SPRITE_MAP = {
  labrador: { sprite: 'animal_monkey', tint: 0xd4a854 },
  dackel: { sprite: 'animal_monkey', tint: 0x8b5e3c },
  schaeferhund: { sprite: 'animal_monkey', tint: 0x6b4226 },
  golden: { sprite: 'animal_monkey', tint: 0xe8c36a },
  husky: { sprite: 'animal_hippo', tint: 0x8899bb },
  pudel: { sprite: 'animal_monkey', tint: 0xeeeeee },
  corgi: { sprite: 'animal_monkey', tint: 0xf0a830 },
  dalmatiner: { sprite: 'animal_panda', tint: null },
  samojede: { sprite: 'animal_monkey', tint: 0xfff8f0 },
  hauskatze: { sprite: 'animal_panda', tint: 0x888888 },
  tiger_katze: { sprite: 'animal_panda', tint: 0xbb8844 },
  schwarze: { sprite: 'animal_panda', tint: 0x333333 },
  perser: { sprite: 'animal_panda', tint: 0xddc8a0 },
  maine_coon: { sprite: 'animal_panda', tint: 0xaa7744 },
  siam: { sprite: 'animal_panda', tint: 0xf5e6d0 },
  bengal: { sprite: 'animal_giraffe', tint: 0xd4a020 },
  kaninchen: { sprite: 'animal_rabbit', tint: null },
  hamster: { sprite: 'animal_pig', tint: 0xe8c080 },
  meerschwein: { sprite: 'animal_pig', tint: 0xbb8855 },
};

export function getPetSprite(breedId) {
  return BREED_SPRITE_MAP[breedId] || { sprite: 'animal_rabbit', tint: null };
}

export function drawPetAvatar(scene, x, y, breedId, scale) {
  const config = getPetSprite(breedId);
  const s = scale || 0.15;
  if (scene.textures.exists(config.sprite)) {
    const img = scene.add.image(x, y, config.sprite).setScale(s);
    if (config.tint) img.setTint(config.tint);
    return img;
  }
  return null;
}

// === UI HELPERS ===

// Draw header bar with optional stats (hearts, level)
export function drawHeader(scene, title, save) {
  // Hide HTML HUD when inside a building scene
  const hud = document.getElementById('hud');
  if (hud) hud.classList.remove('visible');
  const { width } = scene.scale;
  scene.add.rectangle(width / 2, 0, width, 58, THEME.bg.header, 0.98).setOrigin(0.5, 0);
  scene.add.rectangle(width / 2, 58, width, 2, THEME.bg.headerBorder).setOrigin(0.5, 0);
  scene.add.text(width / 2, 29, title, {
    fontSize: '22px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
  }).setOrigin(0.5);
  if (save) {
    // Hearts with real icon
    if (scene.textures.exists('ui_heart')) {
      scene.add.image(28, 14, 'ui_heart').setScale(0.065);
      scene.add.text(48, 8, `${save.hearts}`, {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.hearts, fontStyle: 'bold',
      });
    } else {
      scene.add.text(12, 8, `❤️ ${save.hearts}`, {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.hearts,
      });
    }
    scene.add.text(width - 14, 10, `Lv.${save.level}`, {
      fontSize: '13px', fontFamily: 'monospace', color: THEME.text.xp, fontStyle: 'bold',
    }).setOrigin(1, 0);
  }
}

// Draw NineSlice button (brown primary, blue secondary)
export function drawButton(scene, x, y, w, h, text, opts = {}) {
  const type = opts.type || 'primary';
  const tex = type === 'secondary' ? 'btn_blue' : 'btn_brown';
  const disabled = opts.disabled || false;

  if (scene.textures.exists(tex)) {
    const ns = scene.add.nineslice(x, y, tex, null, w, h, 18, 18, 18, 18);
    if (disabled) ns.setAlpha(0.4);
  } else {
    // Fallback: colored rectangle
    const color = type === 'secondary' ? 0x8899aa : 0xa08050;
    scene.add.rectangle(x, y, w, h, color, disabled ? 0.3 : 0.9)
      .setStrokeStyle(2, color);
  }

  const textColor = disabled ? '#999999' : (opts.textColor || '#fff8e8');
  scene.add.text(x, y, text, {
    fontSize: opts.fontSize || '17px',
    fontFamily: 'Georgia, serif',
    color: textColor,
    fontStyle: 'bold',
  }).setOrigin(0.5);
}

// Draw a card panel (white, soft border)
export function drawCard(scene, x, y, w, h, opts = {}) {
  const borderColor = opts.borderColor || THEME.bg.cardBorder;
  const bg = scene.add.rectangle(x, y, w, h, THEME.bg.card, THEME.bg.cardAlpha)
    .setStrokeStyle(2, borderColor);
  // Soft inner shadow
  scene.add.rectangle(x, y + 1, w - 4, h - 4, 0xf8f0fc, 0.3);
  return bg;
}

// Draw back button at bottom of scene
export function drawBackButton(scene, toScene, label) {
  const { width, height } = scene.scale;
  const text = label || '← Zurück';
  drawButton(scene, width / 2, height - 40, 280, 50, text, { type: 'secondary' });
  if (scene.addHitArea) {
    scene.addHitArea(width / 2, height - 40, 280, 50, () => scene.scene.start(toScene || 'Town'));
  }
}

// Draw a progress bar
export function drawProgressBar(scene, x, y, w, h, pct, color) {
  scene.add.rectangle(x + w / 2, y, w, h, THEME.bg.barBg).setStrokeStyle(1, THEME.bg.barBorder);
  const fillW = Math.max(1, w * Math.min(pct, 1));
  scene.add.rectangle(x + fillW / 2, y, fillW, h - 2, color || 0x55aa66);
}

// Animated number counter
export function animateNumber(scene, textObj, from, to, duration) {
  scene.tweens.addCounter({
    from, to, duration: duration || 500,
    onUpdate: (tween) => { textObj.setText(Math.floor(tween.getValue())); },
  });
}
