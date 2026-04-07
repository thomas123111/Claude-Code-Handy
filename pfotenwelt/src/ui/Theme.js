// Centralized UI theme and helpers for consistent look across all scenes

export const THEME = {
  // Colors
  bg: {
    primary: '#1e1828',
    secondary: '#2a2040',
    card: '#2d2240',
    cardHover: '#3a2d55',
    header: '#2a1f35',
    dark: '#15101e',
  },
  text: {
    title: '#ffcc88',
    subtitle: '#aa8866',
    body: '#ddccee',
    muted: '#887799',
    white: '#ffffff',
    hearts: '#ff6688',
    energy: '#ffcc00',
    xp: '#88ccff',
    success: '#44ff88',
    error: '#ff6644',
  },
  rarity: {
    common: '#aaaaaa',
    rare: '#4499ff',
    epic: '#bb55ff',
    legendary: '#ffaa00',
  },
  accent: {
    purple: '#8855cc',
    pink: '#cc5588',
    blue: '#4488aa',
    green: '#44aa55',
    orange: '#cc7744',
    gold: '#ddaa33',
  },
  border: {
    light: '#554466',
    medium: '#443355',
    dark: '#332244',
  },
};

// Font presets
export const FONTS = {
  title: { fontSize: '24px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold' },
  subtitle: { fontSize: '14px', fontFamily: 'Georgia, serif', color: THEME.text.subtitle },
  heading: { fontSize: '18px', fontFamily: 'Georgia, serif', color: THEME.text.body, fontStyle: 'bold' },
  body: { fontSize: '13px', fontFamily: 'monospace', color: THEME.text.body },
  small: { fontSize: '11px', fontFamily: 'monospace', color: THEME.text.muted },
  button: { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'bold' },
  stat: { fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold' },
};

// Map pet breed IDs to animal sprites
// Dogs use monkey (brown, playful face), cats use panda (round face),
// small animals use rabbit, exotic = parrot/snake etc.
const BREED_SPRITE_MAP = {
  // Dogs → monkey with tinting
  labrador: { sprite: 'animal_monkey', tint: 0xd4a854 },
  dackel: { sprite: 'animal_monkey', tint: 0x8b5e3c },
  schaeferhund: { sprite: 'animal_monkey', tint: 0x6b4226 },
  golden: { sprite: 'animal_monkey', tint: 0xe8c36a },
  husky: { sprite: 'animal_hippo', tint: 0x8899bb },
  pudel: { sprite: 'animal_monkey', tint: 0xeeeeee },
  corgi: { sprite: 'animal_monkey', tint: 0xf0a830 },
  dalmatiner: { sprite: 'animal_panda', tint: null }, // panda already looks dalmatiner-ish
  samojede: { sprite: 'animal_monkey', tint: 0xfff8f0 },

  // Cats → panda with tinting
  hauskatze: { sprite: 'animal_panda', tint: 0x888888 },
  tiger_katze: { sprite: 'animal_panda', tint: 0xbb8844 },
  schwarze: { sprite: 'animal_panda', tint: 0x333333 },
  perser: { sprite: 'animal_panda', tint: 0xddc8a0 },
  maine_coon: { sprite: 'animal_panda', tint: 0xaa7744 },
  siam: { sprite: 'animal_panda', tint: 0xf5e6d0 },
  bengal: { sprite: 'animal_giraffe', tint: 0xd4a020 }, // giraffe spots = bengal pattern

  // Small animals
  kaninchen: { sprite: 'animal_rabbit', tint: null },
  hamster: { sprite: 'animal_pig', tint: 0xe8c080 },
  meerschwein: { sprite: 'animal_pig', tint: 0xbb8855 },
};

// Get sprite config for a breed
export function getPetSprite(breedId) {
  return BREED_SPRITE_MAP[breedId] || { sprite: 'animal_rabbit', tint: null };
}

// Draw a pet avatar at position (returns the image object)
export function drawPetAvatar(scene, x, y, breedId, scale) {
  const config = getPetSprite(breedId);
  const s = scale || 0.15; // animal pack images are ~250px, scale down
  if (scene.textures.exists(config.sprite)) {
    const img = scene.add.image(x, y, config.sprite).setScale(s);
    if (config.tint) img.setTint(config.tint);
    return img;
  }
  // Fallback: use pet emoji from PetData
  return null;
}

// Draw a styled button
export function drawStyledButton(scene, x, y, width, height, text, colorHex) {
  const color = Phaser.Display.Color.HexStringToColor(colorHex || '#8855cc').color;
  const bg = scene.add.rectangle(x, y, width, height, color, 0.25)
    .setStrokeStyle(2, color);
  // Rounded corner effect (inner lighter rect)
  scene.add.rectangle(x, y, width - 6, height - 6, color, 0.08);
  scene.add.text(x, y, text, FONTS.button).setOrigin(0.5);
  return bg;
}

// Draw a card/panel
export function drawCard(scene, x, y, width, height, borderColor) {
  const border = borderColor || 0x554466;
  scene.add.rectangle(x, y, width, height, 0x2d2240, 0.85)
    .setStrokeStyle(2, border);
  // Inner shadow
  scene.add.rectangle(x, y, width - 4, height - 4, 0x252035, 0.3);
}

// Draw header bar at top of scene
export function drawHeader(scene, title, save) {
  const { width } = scene.scale;
  // Header background
  scene.add.rectangle(width / 2, 0, width, 45, 0x2a1f35, 0.95).setOrigin(0.5, 0);
  scene.add.rectangle(width / 2, 45, width, 2, 0x443355).setOrigin(0.5, 0);

  // Title
  scene.add.text(width / 2, 22, title, {
    fontSize: '18px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
  }).setOrigin(0.5);

  // Stats if save provided
  if (save) {
    scene.add.text(10, 6, `❤️ ${save.hearts}`, {
      fontSize: '11px', fontFamily: 'monospace', color: THEME.text.hearts,
    });
    scene.add.text(10, 22, `⚡ ${save.energy}`, {
      fontSize: '11px', fontFamily: 'monospace', color: THEME.text.energy,
    });
    scene.add.text(width - 10, 14, `Lv.${save.level}`, {
      fontSize: '12px', fontFamily: 'monospace', color: THEME.text.xp, fontStyle: 'bold',
    }).setOrigin(1, 0);
  }
}

// Draw back button (returns hitArea)
export function drawBackButton(scene, toScene) {
  const { width, height } = scene.scale;
  scene.add.text(width / 2, height - 35, '← Zurück', {
    fontSize: '14px', fontFamily: 'Georgia, serif', color: '#887799',
  }).setOrigin(0.5);
  return { x: width / 2, y: height - 35, w: 140, h: 35, cb: () => scene.scene.start(toScene || 'Menu') };
}

// Animated number counter (for hearts/score)
export function animateNumber(scene, textObj, from, to, duration) {
  const d = duration || 500;
  scene.tweens.addCounter({
    from, to, duration: d,
    onUpdate: (tween) => {
      textObj.setText(Math.floor(tween.getValue()));
    },
  });
}

// Import Phaser for Color utility
import Phaser from 'phaser';
