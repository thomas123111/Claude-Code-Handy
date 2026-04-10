import Phaser from 'phaser';
import { loadSave, writeSave, regenerateEnergy, checkDailyLogin, updateDayCycle, getDayProgress, getTimeOfDay, shouldTriggerEvent, BUILDING_UNLOCK_ORDER } from '../data/SaveManager.js';
import { startMusic, stopMusic, unlockAudio } from '../audio/MusicManager.js';
import { checkStoryTrigger, getRandomEvent } from '../data/StoryData.js';

// Wider town: 1800x1500 — buildings at far ends of long paths
const MAP_W = 1800;
const MAP_H = 1500;

// Buildings positioned clockwise from Tierheim (top center)
// Unlock order: shelter→merge→vet→salon→futterladen→school→hotel→spielplatz→cafe→guild
// This way fog recedes clockwise from the shelter outward
const BUILDINGS = [
  // TOP CENTER — always visible
  { id: 'shelter', key: 'Shelter', name: 'Tierheim', tex: 'bld_shelter',
    x: 900, y: 180, scale: 1.2 },
  // CLOCKWISE: right side (top → bottom)
  { id: 'merge', key: 'MergeBoard', name: 'Werkstatt', tex: 'bld_workshop',
    x: 1650, y: 400, scale: 1.0 },
  { id: 'vet', key: 'Vet', name: 'Tierarzt', tex: 'bld_vet',
    x: 1650, y: 800, scale: 1.0 },
  { id: 'salon', key: 'Salon', name: 'Salon', tex: 'bld_salon',
    x: 1650, y: 1150, scale: 1.0 },
  // BOTTOM CENTER
  { id: 'futterladen', key: 'Futterladen', name: 'Futterladen', tex: 'bld_cafe',
    x: 900, y: 1250, scale: 1.0 },
  // LEFT side (bottom → top)
  { id: 'school', key: 'School', name: 'Schule', tex: 'bld_school',
    x: 150, y: 1150, scale: 1.0 },
  { id: 'hotel', key: 'Hotel', name: 'Pension', tex: 'bld_hotel',
    x: 150, y: 800, scale: 1.0 },
  { id: 'spielplatz', key: 'Spielplatz', name: 'Spielplatz', tex: 'bld_school',
    x: 150, y: 400, scale: 1.0 },
  // BACK TO TOP (completing the circle)
  { id: 'cafe', key: 'Cafe', name: 'Café', tex: 'bld_cafe',
    x: 500, y: 180, scale: 1.0 },
  { id: 'guild', key: 'Guild', name: 'Gilde', tex: 'bld_guild',
    x: 1300, y: 180, scale: 1.0 },
];

// Trees scattered around the wider map
const TREES = [
  { x: 80, y: 150, type: 'big' }, { x: 1720, y: 150, type: 'big' },
  { x: 80, y: 600, type: 'small' }, { x: 1720, y: 600, type: 'small' },
  { x: 80, y: 1000, type: 'small' }, { x: 1720, y: 1000, type: 'small' },
  { x: 500, y: 500, type: 'small' }, { x: 1300, y: 500, type: 'small' },
  { x: 500, y: 900, type: 'small' }, { x: 1300, y: 900, type: 'small' },
  { x: 80, y: 1400, type: 'big' }, { x: 1720, y: 1400, type: 'big' },
  { x: 400, y: 250, type: 'small' }, { x: 1400, y: 250, type: 'small' },
];

const DECOR = [
  { x: 900, y: 700, tex: 'env_fountain', scale: 1.2 },
  { x: 780, y: 700, tex: 'env_bench', scale: 0.7 },
  { x: 1020, y: 700, tex: 'env_bench', scale: 0.7 },
  { x: 450, y: 400, tex: 'env_lamppost', scale: 0.5 },
  { x: 1350, y: 400, tex: 'env_lamppost', scale: 0.5 },
  { x: 450, y: 1150, tex: 'env_lamppost', scale: 0.5 },
  { x: 1350, y: 1150, tex: 'env_lamppost', scale: 0.5 },
  { x: 650, y: 300, tex: 'env_flowerbed', scale: 0.5 },
  { x: 1150, y: 300, tex: 'env_flowerbed', scale: 0.5 },
  { x: 900, y: 1050, tex: 'env_flowerbed', scale: 0.5 },
];

export class TownScene extends Phaser.Scene {
  constructor() { super('Town'); }

  create() {
    this.save = loadSave();
    regenerateEnergy(this.save);
    updateDayCycle(this.save);
    writeSave(this.save);
    const { width, height } = this.scale;

    // Redirect to onboarding if not done
    if (!this.save.onboardingDone) {
      this.scene.start('Onboarding');
      return;
    }

    // Daily login check
    const login = checkDailyLogin(this.save);
    if (login.isNew) {
      writeSave(this.save);
      this.scene.start('DailyReward', { streak: login.streak, save: this.save });
      return;
    }

    // Story trigger check
    const story = checkStoryTrigger(this.save);
    if (story) {
      this.save.seenStories.push(story.id);
      writeSave(this.save);
      this.scene.start('Story', { chapter: story });
      return;
    }

    // Day-based events (every 2 in-game days) — show as popup!
    this.pendingEvent = null;
    if (shouldTriggerEvent(this.save) && this.save.pets.length > 0) {
      this.save.lastEventDay = this.save.gameDay;
      const evt = getRandomEvent();
      if (evt.effect.hearts) this.save.hearts += evt.effect.hearts;
      if (evt.effect.need) {
        this.save.pets.forEach((p) => {
          p.needs[evt.effect.need] = Math.max(0, Math.min(100, p.needs[evt.effect.need] + evt.effect.change));
        });
      }
      writeSave(this.save);
      this.pendingEvent = evt;
    }

    // === DAY/NIGHT VISUAL ===
    const timeOfDay = getTimeOfDay(this.save);
    const dayFadeColors = {
      morning: { r: 26, g: 21, b: 35 },   // warm fade-in
      afternoon: { r: 26, g: 21, b: 35 },
      evening: { r: 40, g: 25, b: 15 },    // orange tint
      night: { r: 10, g: 10, b: 30 },      // dark blue
    };
    const fc = dayFadeColors[timeOfDay];
    this.cameras.main.fadeIn(400, fc.r, fc.g, fc.b);
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.centerOn(MAP_W / 2, 500);
    this.cameras.main.setZoom(Math.min(width / MAP_W * 2.87, 1.0));

    // Block input briefly to prevent click-through from previous scene
    this.inputBlocked = true;
    this.time.delayedCall(400, () => { this.inputBlocked = false; });

    // === GRASS BACKGROUND — tinted by time of day ===
    const grassColors = { morning: 0x5a9a42, afternoon: 0x5a9a42, evening: 0x4a7a32, night: 0x2a4a22 };
    this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, grassColors[timeOfDay]).setDepth(-2);

    // Night overlay (dark tint over entire world)
    if (timeOfDay === 'night') {
      this.nightOverlay = this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x0a0a1e, 0.35).setDepth(400);
    } else if (timeOfDay === 'evening') {
      this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x331a00, 0.12).setDepth(400);
    }

    // === PATHS — only draw to visible (unlocked/next) buildings ===
    const pc = 0xc4a76c;
    const nextUnlock = BUILDING_UNLOCK_ORDER.find(bo =>
      !(this.save.stations[bo.id] && this.save.stations[bo.id].unlocked));
    const isVisible = (id) => {
      const unlocked = this.save.stations[id] && this.save.stations[id].unlocked;
      const isNext = nextUnlock && nextUnlock.id === id;
      return unlocked || isNext;
    };
    // Central spine (always visible — connects top to wherever player has reached)
    const rightVisible = isVisible('merge') || isVisible('vet') || isVisible('salon');
    const leftVisible = isVisible('school') || isVisible('hotel') || isVisible('spielplatz');
    const bottomVisible = isVisible('futterladen');
    // Vertical spine grows as buildings unlock
    let spineBottom = 260;
    if (rightVisible || leftVisible) spineBottom = 400;
    if (isVisible('vet') || isVisible('hotel')) spineBottom = 800;
    if (isVisible('salon') || isVisible('school') || bottomVisible) spineBottom = 1280;
    this.drawPath(900, 260, 900, spineBottom, pc);
    // Right branches
    if (rightVisible) this.drawPath(900, 400, 1600, 400, pc);
    if (isVisible('vet')) this.drawPath(900, 800, 1600, 800, pc);
    if (isVisible('salon')) this.drawPath(900, 1150, 1600, 1150, pc);
    // Left branches
    if (leftVisible) this.drawPath(200, 400, 900, 400, pc);
    if (isVisible('hotel')) this.drawPath(200, 800, 900, 800, pc);
    if (isVisible('school')) this.drawPath(200, 1150, 900, 1150, pc);
    // Horizontal at each row (connect left-right if both sides visible)
    if (rightVisible && !leftVisible) this.drawPath(900, 400, 1600, 400, pc);
    // Top branches for cafe/guild
    if (isVisible('cafe')) this.drawPath(500, 260, 500, 400, pc);
    if (isVisible('guild')) this.drawPath(1300, 260, 1300, 400, pc);
    // Fountain plaza (always visible — center of town)
    this.add.circle(900, 700, 100, pc, 0.3).setDepth(-1);

    // === FARM PORTAL at bottom (only if farm is unlocked) ===
    const farmUnlocked = this.save.stations.farm && this.save.stations.farm.unlocked;
    if (farmUnlocked) {
      this.drawPath(900, 1280, 900, 1450, pc);
      this.add.text(900, 1430, '🌾 Zum Bauernhof →', {
        fontSize: '16px', fontFamily: 'Georgia, serif', color: '#fff8e8', fontStyle: 'bold',
        stroke: '#2a3518', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(200);
    }

    // === DECORATIONS ===
    TREES.forEach((t) => {
      const tex = t.type === 'big' ? 'env_tree_big' : 'env_tree_small';
      if (this.textures.exists(tex)) {
        this.add.image(t.x, t.y, tex).setScale(t.type === 'big' ? 0.8 : 0.5)
          .setDepth(10 + Math.round(t.y / 10));
      }
    });
    DECOR.forEach((d) => {
      if (this.textures.exists(d.tex)) {
        this.add.image(d.x, d.y, d.tex).setScale(d.scale)
          .setDepth(10 + Math.round(d.y / 10));
      }
    });

    // === BUILDINGS (sequential unlock — hidden until unlocked or next) ===

    BUILDINGS.forEach((b) => {
      const isUnlocked = this.save.stations[b.id] && this.save.stations[b.id].unlocked;
      const isNext = nextUnlock && nextUnlock.id === b.id;

      // Only show unlocked buildings and the NEXT unlockable one
      if (!isUnlocked && !isNext) {
        b._sprite = null;
        return; // completely hidden
      }

      if (this.textures.exists(b.tex)) {
        const bldDepth = 10 + Math.round((b.y + 50) / 10);
        const img = this.add.image(b.x, b.y, b.tex).setScale(b.scale).setDepth(bldDepth);
        if (!isUnlocked) {
          // Next building: show silhouette with blur effect
          img.setTint(0x666688);
          img.setAlpha(0.5);
        }
        b._sprite = img;
      }

      if (isUnlocked) {
        // Name label for unlocked buildings
        this.add.text(b.x, b.y - 80, b.name, {
          fontSize: '18px', fontFamily: 'Georgia, serif', color: '#fff8e8', fontStyle: 'bold',
          stroke: '#2a1520', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(200);
      }

      if (!isUnlocked && isNext) {
        // Locked next building — show mystery + unlock cost (BIG & readable)
        this.add.text(b.x, b.y - 15, '❓', { fontSize: '48px' }).setOrigin(0.5).setDepth(201);
        this.add.text(b.x, b.y + 50, `${nextUnlock.cost}❤️`, {
          fontSize: '22px', fontFamily: 'Georgia, serif', color: '#ffcc66', fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(201);
        this.add.text(b.x, b.y + 78, `ab Level ${nextUnlock.minLevel}`, {
          fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ddbb88',
          stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(201);
        // Pulsing glow
        const glow = this.add.circle(b.x, b.y, 75, 0xffcc44, 0.15).setDepth(200);
        this.tweens.add({ targets: glow, alpha: 0.05, scale: 1.4, duration: 1200, yoyo: true, repeat: -1 });
      } else if (b.id === 'shelter' && this.save.pets.length > 0) {
        this.add.circle(b.x + 55, b.y - 55, 14, 0xff4466).setDepth(202);
        this.add.text(b.x + 55, b.y - 55, `${this.save.pets.length}`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(203);
      }
    });

    // === FOG OF WAR — mysterious fog on unexplored sectors ===
    // Sectors: right side, bottom, left side (clockwise from shelter)
    const fogDepth = 398;
    const fogColor = 0x1a2a18;
    const drawFogZone = (x, y, w, h, label) => {
      // Base fog (dark, opaque)
      this.add.rectangle(x, y, w, h, fogColor, 0.82).setDepth(fogDepth);
      // Layered mist (lighter, animated)
      for (let i = 0; i < 4; i++) {
        const mx = x + Phaser.Math.Between(-w * 0.3, w * 0.3);
        const my = y + Phaser.Math.Between(-h * 0.2, h * 0.2);
        const mist = this.add.circle(mx, my, Phaser.Math.Between(60, 140), 0x2a4a28, 0.3).setDepth(fogDepth + 1);
        this.tweens.add({ targets: mist, x: mx + Phaser.Math.Between(-40, 40), alpha: 0.1, scale: 1.5, duration: Phaser.Math.Between(3000, 6000), yoyo: true, repeat: -1 });
      }
      // Sparkle particles (mysterious)
      for (let i = 0; i < 3; i++) {
        const sx = x + Phaser.Math.Between(-w * 0.3, w * 0.3);
        const sy = y + Phaser.Math.Between(-h * 0.2, h * 0.2);
        const spark = this.add.circle(sx, sy, 2, 0x88ff88, 0.4).setDepth(fogDepth + 2);
        this.tweens.add({ targets: spark, alpha: 0, y: sy - 20, duration: 2000, delay: Phaser.Math.Between(0, 3000), repeat: -1, repeatDelay: Phaser.Math.Between(1000, 4000) });
      }
      // Label
      if (label) {
        this.add.text(x, y, label, {
          fontSize: '14px', fontFamily: 'Georgia, serif', color: '#6a8a6a', fontStyle: 'italic',
          stroke: '#1a2a18', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(fogDepth + 2);
      }
      // Soft gradient edges (8 strips fading outward)
      for (let i = 0; i < 6; i++) {
        const edgeAlpha = 0.12 * (6 - i);
        // Top edge
        this.add.rectangle(x, y - h / 2 - i * 8, w + i * 16, 10, fogColor, edgeAlpha).setDepth(fogDepth);
        // Bottom edge
        this.add.rectangle(x, y + h / 2 + i * 8, w + i * 16, 10, fogColor, edgeAlpha).setDepth(fogDepth);
      }
    };

    // Right sector fog (visible when merge/vet/salon NOT unlocked)
    if (!isVisible('vet') && !isVisible('salon')) {
      drawFogZone(1400, 800, 800, 800, '🌫️ ???');
    }
    if (!isVisible('salon') && isVisible('vet')) {
      drawFogZone(1400, 1100, 800, 400, '🌫️');
    }
    // Bottom sector fog
    if (!bottomVisible) {
      drawFogZone(900, 1300, MAP_W, 400, '🌫️ Unentdeckt');
    }
    // Left sector fog
    if (!leftVisible) {
      drawFogZone(400, 800, 800, 800, '🌫️ ???');
    }
    if (leftVisible && !isVisible('hotel')) {
      drawFogZone(400, 800, 800, 400, '🌫️');
    }
    if (isVisible('hotel') && !isVisible('spielplatz')) {
      drawFogZone(400, 400, 800, 400, '🌫️');
    }

    // === AMBIENT EFFECTS ===
    if (this.textures.exists('env_fountain')) {
      this.time.addEvent({ delay: 500, loop: true, callback: () => {
        const sp = this.add.circle(900 + Phaser.Math.Between(-15, 15), 690 + Phaser.Math.Between(-8, 8), 2, 0x88ddff, 0.6).setDepth(200);
        this.tweens.add({ targets: sp, y: sp.y - 15, alpha: 0, duration: 800, onComplete: () => sp.destroy() });
      }});
    }
    [[900, 130], [1650, 1100]].forEach(([sx, sy]) => {
      this.time.addEvent({ delay: 1000, loop: true, callback: () => {
        const sm = this.add.circle(sx + Phaser.Math.Between(-3, 3), sy, 3, 0xffffff, 0.2).setDepth(200);
        this.tweens.add({ targets: sm, y: sy - 30, x: sx + Phaser.Math.Between(-8, 8), alpha: 0, scale: 2.5, duration: 2000, onComplete: () => sm.destroy() });
      }});
    });

    // === WALKERS — human characters ===
    this.walkers = [];
    const charKeys = ['char_adam', 'char_amelia', 'char_alex', 'char_bob'];
    const walkerPaths = [
      [[200, 400], [900, 400], [900, 700], [200, 700], [200, 400]],
      [[1650, 400], [900, 400], [900, 800], [1650, 800], [1650, 400]],
      [[200, 800], [900, 800], [900, 1150], [200, 1150], [200, 800]],
      [[1650, 800], [900, 1150], [900, 1350], [1650, 1150], [1650, 800]],
    ];
    charKeys.forEach((key, i) => {
      if (!this.textures.exists(key)) return;
      const path = walkerPaths[i % walkerPaths.length];
      const start = path[0], next = path[1];
      const sprite = this.add.sprite(start[0], start[1], key).setScale(2.5);
      const initDir = this.getWalkDirection(next[0] - start[0], next[1] - start[1]);
      sprite.play(`${key}_walk_${initDir}`);
      sprite.setDepth(10 + Math.round(start[1] / 10));
      this.walkers.push({
        sprite, key, path, targetIdx: 1, speed: Phaser.Math.Between(30, 45),
        currentDir: initDir,
        idleTimer: 0, isIdle: false, idleDuration: 0,
      });
    });

    // === ROAMING PETS ===
    this.roamingPets = [];
    const petConfigs = [
      { key: 'farm_dog_lab', scale: 2.0, paths: [[300, 400], [900, 400], [900, 700], [300, 700]], speed: 40 },
      { key: 'farm_dog_shep', scale: 2.0, paths: [[1400, 400], [900, 400], [900, 800], [1400, 800]], speed: 35 },
      { key: 'farm_dog_white', scale: 2.0, paths: [[900, 260], [900, 700], [1400, 700], [1400, 260]], speed: 38 },
      { key: 'farm_rabbit', scale: 2.5, paths: [[750, 600], [900, 700], [1050, 600], [900, 550]], speed: 28 },
      { key: 'farm_rabbit_w', scale: 2.5, paths: [[1050, 800], [900, 700], [750, 800], [900, 850]], speed: 25 },
      { key: 'farm_duckling', scale: 3.0, paths: [[850, 680], [950, 720], [920, 660], [860, 710]], speed: 18 },
      { key: 'farm_chicken', scale: 3.0, paths: [[1200, 1150], [900, 1150], [900, 1300], [1200, 1300]], speed: 22 },
    ];
    petConfigs.forEach((cfg) => {
      if (!this.textures.exists(cfg.key)) return;
      const start = cfg.paths[0], next = cfg.paths[1];
      const pet = this.add.sprite(start[0], start[1], cfg.key).setScale(cfg.scale);
      const shadow = this.add.ellipse(start[0], start[1] + 10, 20, 7, 0x000000, 0.2).setDepth(-1);
      const initDir = this.getWalkDirection(next[0] - start[0], next[1] - start[1]);
      if (this.anims.exists(`${cfg.key}_walk_${initDir}`)) pet.play(`${cfg.key}_walk_${initDir}`);
      pet.setDepth(10 + Math.round(start[1] / 10));
      this.roamingPets.push({ sprite: pet, shadow, key: cfg.key, path: cfg.paths, targetIdx: 1, speed: cfg.speed, currentDir: initDir });
    });

    // === LimeZu PROPS ===
    const lzProps = [
      { x: 450, y: 400, tex: 'lz_lamp', scale: 2 }, { x: 1350, y: 400, tex: 'lz_lamp', scale: 2 },
      { x: 450, y: 1150, tex: 'lz_lamp', scale: 2 }, { x: 1350, y: 1150, tex: 'lz_lamp', scale: 2 },
      { x: 780, y: 700, tex: 'lz_bench', scale: 2 }, { x: 1020, y: 700, tex: 'lz_bench', scale: 2 },
      { x: 900, y: 700, tex: 'lz_fountain', scale: 2.5 },
      { x: 600, y: 550, tex: 'lz_hydrant', scale: 2 },
    ];
    lzProps.forEach((p) => {
      if (this.textures.exists(p.tex)) {
        this.add.image(p.x, p.y, p.tex).setScale(p.scale).setDepth(10 + Math.round(p.y / 10));
      }
    });

    // === INPUT ===
    this.isDragging = false;
    this.dragMoved = false;
    this.lastPinchDist = 0;

    this.input.on('pointerdown', (pointer) => {
      this.isDragging = true; this.dragMoved = false;
      this.dragStartX = pointer.x; this.dragStartY = pointer.y;
      this.camStartX = this.cameras.main.scrollX; this.camStartY = this.cameras.main.scrollY;
    });

    this.input.on('pointermove', (pointer) => {
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        const p1 = this.input.pointer1, p2 = this.input.pointer2;
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        if (this.lastPinchDist > 0) {
          this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom + (dist - this.lastPinchDist) * 0.004, 0.55, 2.5));
        }
        this.lastPinchDist = dist; this.dragMoved = true; return;
      }
      this.lastPinchDist = 0;
      if (!this.isDragging) return;
      const dx = pointer.x - this.dragStartX, dy = pointer.y - this.dragStartY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) this.dragMoved = true;
      if (this.dragMoved) {
        const z = this.cameras.main.zoom;
        this.cameras.main.scrollX = this.camStartX - dx / z;
        this.cameras.main.scrollY = this.camStartY - dy / z;
      }
    });

    this.input.on('pointerup', (pointer) => {
      this.isDragging = false; this.lastPinchDist = 0;
      if (this.dragMoved || this.inputBlocked) return;
      const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      // Check farm portal tap (only if farm unlocked)
      if (farmUnlocked && wp.x >= 750 && wp.x <= 1050 && wp.y >= 1400 && wp.y <= 1470) {
        this.cameras.main.fadeOut(300, 26, 40, 24);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Farm'));
        return;
      }

      // Check building taps
      for (const b of BUILDINGS) {
        if (!b._sprite) continue;
        const halfW = 70, halfH = 80;
        if (wp.x >= b.x - halfW && wp.x <= b.x + halfW && wp.y >= b.y - halfH && wp.y <= b.y + halfH) {
          const isUnlocked = this.save.stations[b.id] && this.save.stations[b.id].unlocked;
          if (isUnlocked) {
            this.tweens.add({ targets: b._sprite, scale: { from: b.scale, to: b.scale * 1.1 }, duration: 100, yoyo: true, onComplete: () => {
              this.cameras.main.fadeOut(300, 26, 21, 35);
              this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(b.key));
            }});
          } else {
            // Try to unlock if this is the next building in sequence
            const unlockInfo = BUILDING_UNLOCK_ORDER.find(bo => bo.id === b.id);
            if (unlockInfo && nextUnlock && nextUnlock.id === b.id) {
              if (this.save.level >= unlockInfo.minLevel && this.save.hearts >= unlockInfo.cost) {
                this.unlockBuilding(b, unlockInfo);
              } else {
                // Show "can't unlock yet" popup
                const msg = this.save.level < unlockInfo.minLevel
                  ? `Brauchst Level ${unlockInfo.minLevel}!`
                  : `Brauchst ${unlockInfo.cost}❤️!`;
                const popup = this.add.text(b.x, b.y - 40, msg, {
                  fontSize: '20px', fontFamily: 'Georgia, serif', color: '#ff6644', fontStyle: 'bold',
                  stroke: '#000000', strokeThickness: 4,
                }).setOrigin(0.5).setDepth(500);
                this.tweens.add({ targets: popup, y: popup.y - 40, alpha: 0, duration: 2000, onComplete: () => popup.destroy() });
              }
            } else {
              // Not the next building — show "unlock order" hint
              const popup = this.add.text(b.x, b.y - 30, 'Schalte zuerst andere Gebäude frei!', {
                fontSize: '12px', fontFamily: 'Georgia, serif', color: '#ffcc44',
                stroke: '#000000', strokeThickness: 3,
              }).setOrigin(0.5).setDepth(500);
              this.tweens.add({ targets: popup, y: popup.y - 25, alpha: 0, duration: 1500, onComplete: () => popup.destroy() });
            }
          }
          return;
        }
      }

      // Double-tap zoom
      const now = Date.now();
      if (this.lastTapTime && now - this.lastTapTime < 300) {
        const tz = this.cameras.main.zoom < 0.8 ? 1.2 : 0.6;
        this.tweens.add({ targets: this.cameras.main, zoom: tz, duration: 300, ease: 'Cubic.Out' });
        this.lastTapTime = 0;
      } else { this.lastTapTime = now; }
    });

    // === HTML HUD (fixed CSS bar above canvas, immune to everything) ===
    const timeEmojis = { morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' };
    const hud = document.getElementById('hud');
    if (hud) {
      document.getElementById('hud-hearts').textContent = `❤️ ${this.save.hearts}`;
      document.getElementById('hud-day').textContent = `${timeEmojis[timeOfDay]} Tag ${this.save.gameDay}`;
      document.getElementById('hud-level').textContent = `Lv.${this.save.level}`;
      hud.classList.add('visible');
    }

    // Music (auto-start)
    if (this.save.musicOn !== false) {
      this.input.once('pointerdown', () => { unlockAudio(); startMusic('town'); });
    }

    // Show event popup if one occurred
    if (this.pendingEvent) {
      const evt = this.pendingEvent;
      this.time.delayedCall(800, () => {
        const camCenter = this.cameras.main.getWorldPoint(width / 2, height * 0.3);
        const evtBg = this.add.rectangle(camCenter.x, camCenter.y, 350, 70, 0xffffff, 0.92)
          .setStrokeStyle(2, 0xe0c8e8).setDepth(450);
        const evtText = this.add.text(camCenter.x, camCenter.y - 8, `${evt.emoji} ${evt.text}`, {
          fontSize: '13px', fontFamily: 'Georgia, serif', color: '#4a3560',
          wordWrap: { width: 320 }, align: 'center',
        }).setOrigin(0.5).setDepth(451);
        const evtReward = this.add.text(camCenter.x, camCenter.y + 22, evt.effect.hearts ? `+${evt.effect.hearts}❤️` : '', {
          fontSize: '14px', fontFamily: 'monospace', color: '#cc4466', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(451);
        // Auto-dismiss after 3 seconds
        this.tweens.add({ targets: [evtBg, evtText, evtReward], alpha: 0, y: '-=30', duration: 500, delay: 3000,
          onComplete: () => { evtBg.destroy(); evtText.destroy(); evtReward.destroy(); },
        });
      });
    }

    // === TUTORIAL WIZARD (one-time, after first story) ===
    if (this.save.onboardingDone && !this.save.tutorialDone && this.save.seenStories && this.save.seenStories.length > 0) {
      this.time.delayedCall(this.pendingEvent ? 4500 : 1000, () => {
        const werkstatt = BUILDINGS.find(b => b.id === 'merge');
        if (!werkstatt || !werkstatt._sprite) return;

        // Pulsing highlight on Werkstatt
        const glow = this.add.circle(werkstatt.x, werkstatt.y, 80, 0xffdd44, 0.25).setDepth(450);
        this.tweens.add({ targets: glow, alpha: 0.08, scale: 1.4, duration: 800, yoyo: true, repeat: 3 });

        // Arrow pointing to Werkstatt
        const arrow = this.add.text(werkstatt.x, werkstatt.y - 120, '👇', { fontSize: '36px' }).setOrigin(0.5).setDepth(451);
        this.tweens.add({ targets: arrow, y: werkstatt.y - 100, duration: 500, yoyo: true, repeat: 5 });

        // Tooltip bubble
        const tipBg = this.add.rectangle(werkstatt.x, werkstatt.y - 160, 260, 50, 0xffffff, 0.95)
          .setStrokeStyle(2, 0xe0c8e8).setDepth(451);
        const tipText = this.add.text(werkstatt.x, werkstatt.y - 160, 'Tippe auf die Werkstatt!\nHier stellst du Items her.', {
          fontSize: '12px', fontFamily: 'Georgia, serif', color: '#4a3560', align: 'center',
        }).setOrigin(0.5).setDepth(452);

        // Auto-dismiss + mark done
        this.time.delayedCall(6000, () => {
          [glow, arrow, tipBg, tipText].forEach(o => {
            if (o && o.active) this.tweens.add({ targets: o, alpha: 0, duration: 400, onComplete: () => o.destroy() });
          });
          this.save.tutorialDone = true;
          writeSave(this.save);
        });
      });
    }
  }

  drawPath(x1, y1, x2, y2, color) {
    const isH = Math.abs(y2 - y1) < Math.abs(x2 - x1);
    const pw = 50;
    const w = isH ? Math.abs(x2 - x1) : pw;
    const h = isH ? pw : Math.abs(y2 - y1);
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    this.add.rectangle(cx, cy, w + 6, h + 6, 0x7a6a4a, 0.5).setDepth(-1);
    this.add.rectangle(cx, cy, w, h, color, 0.6).setDepth(-1);
    const cw = isH ? w - 20 : 4, ch = isH ? 4 : h - 20;
    this.add.rectangle(cx, cy, cw, ch, 0xddccaa, 0.15).setDepth(-1);
  }

  unlockBuilding(b, unlockInfo) {
    this.save.hearts -= unlockInfo.cost;
    if (!this.save.stations[b.id]) this.save.stations[b.id] = {};
    this.save.stations[b.id].unlocked = true;
    this.save.stations[b.id].level = 1;
    // Initialize farm data when farm is unlocked
    if (b.id === 'farm' && !this.save.farm) {
      this.save.farm = { level: 1, totalDelivered: 0, taskCooldowns: {}, buildings: { barn: true } };
    }
    writeSave(this.save);
    if (b._sprite) { b._sprite.clearTint(); b._sprite.setAlpha(1);
      this.tweens.add({ targets: b._sprite, scale: { from: 0.5, to: 1.0 }, duration: 500, ease: 'Back.Out' }); }
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const star = this.add.text(b.x, b.y, '⭐', { fontSize: '16px' }).setOrigin(0.5).setDepth(200);
      this.tweens.add({ targets: star, x: b.x + Math.cos(angle) * 70, y: b.y + Math.sin(angle) * 70, alpha: 0, duration: 700, onComplete: () => star.destroy() });
    }
    this.time.delayedCall(800, () => this.scene.restart());
  }

  getWalkDirection(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy) * 1.2) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }

  update(time, delta) {
    if (!this.walkers) return;
    // Update human walkers (with idle pauses)
    this.walkers.forEach((w) => {
      // Idle pause at waypoints
      if (w.isIdle) {
        w.idleTimer -= delta;
        if (w.idleTimer <= 0) {
          w.isIdle = false;
          w.sprite.play(`${w.key}_walk_${w.currentDir}`, true);
        }
        w.sprite.setDepth(10 + Math.round(w.sprite.y / 10));
        return;
      }

      const t = w.path[w.targetIdx];
      const dx = t[0] - w.sprite.x, dy = t[1] - w.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) {
        w.targetIdx = (w.targetIdx + 1) % w.path.length;
        const n = w.path[w.targetIdx];
        const nd = this.getWalkDirection(n[0] - w.sprite.x, n[1] - w.sprite.y);
        w.currentDir = nd;

        // 30% chance to idle for 1-3 seconds at waypoint
        if (Math.random() < 0.3) {
          w.isIdle = true;
          w.idleTimer = 1000 + Math.random() * 2000;
          w.sprite.play(`${w.key}_idle`, true);
        } else {
          w.sprite.play(`${w.key}_walk_${nd}`, true);
        }
      } else {
        const spd = w.speed * (delta / 1000);
        w.sprite.x += (dx / dist) * spd; w.sprite.y += (dy / dist) * spd;
      }
      w.sprite.setDepth(10 + Math.round(w.sprite.y / 10));
    });
    // Update roaming pets
    if (this.roamingPets) {
      this.roamingPets.forEach((p) => {
        const t = p.path[p.targetIdx];
        const dx = t[0] - p.sprite.x, dy = t[1] - p.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 5) {
          p.targetIdx = (p.targetIdx + 1) % p.path.length;
          const n = p.path[p.targetIdx];
          const nd = this.getWalkDirection(n[0] - p.sprite.x, n[1] - p.sprite.y);
          if (nd !== p.currentDir) { p.currentDir = nd; const ak = `${p.key}_walk_${nd}`; if (this.anims.exists(ak)) p.sprite.play(ak, true); }
        } else {
          const spd = p.speed * (delta / 1000);
          p.sprite.x += (dx / dist) * spd; p.sprite.y += (dy / dist) * spd;
        }
        p.shadow.setPosition(p.sprite.x, p.sprite.y + 10);
        p.sprite.setDepth(10 + Math.round(p.sprite.y / 10));
      });
    }
  }
}
