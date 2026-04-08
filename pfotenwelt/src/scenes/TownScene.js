import Phaser from 'phaser';
import { loadSave, writeSave, regenerateEnergy, checkDailyLogin, updateDayCycle, getDayProgress, getTimeOfDay, shouldTriggerEvent, BUILDING_UNLOCK_ORDER } from '../data/SaveManager.js';
import { startMusic, stopMusic, unlockAudio } from '../audio/MusicManager.js';
import { checkStoryTrigger, getRandomEvent } from '../data/StoryData.js';

// Wider town: 1800x1500 — buildings at far ends of long paths
const MAP_W = 1800;
const MAP_H = 1500;

// Town buildings — positions on the map, unlock from SaveManager
const BUILDINGS = [
  { id: 'shelter', key: 'Shelter', name: 'Tierheim', tex: 'bld_shelter',
    x: 900, y: 180, scale: 1.2 },
  { id: 'merge', key: 'MergeBoard', name: 'Werkstatt', tex: 'bld_workshop',
    x: 150, y: 400, scale: 1.0 },
  { id: 'vet', key: 'Vet', name: 'Tierarzt', tex: 'bld_vet',
    x: 1650, y: 400, scale: 1.0 },
  { id: 'salon', key: 'Salon', name: 'Salon', tex: 'bld_salon',
    x: 150, y: 800, scale: 1.0 },
  { id: 'futterladen', key: 'Futterladen', name: 'Futterladen', tex: 'bld_cafe',
    x: 900, y: 600, scale: 1.0 },
  { id: 'school', key: 'School', name: 'Schule', tex: 'bld_school',
    x: 1650, y: 800, scale: 1.0 },
  { id: 'hotel', key: 'Hotel', name: 'Pension', tex: 'bld_hotel',
    x: 150, y: 1150, scale: 1.0 },
  { id: 'spielplatz', key: 'Spielplatz', name: 'Spielplatz', tex: 'bld_school',
    x: 900, y: 950, scale: 1.0 },
  { id: 'cafe', key: 'Cafe', name: 'Café', tex: 'bld_cafe',
    x: 1650, y: 1150, scale: 1.0 },
  { id: 'guild', key: 'Guild', name: 'Gilde', tex: 'bld_guild',
    x: 900, y: 1250, scale: 1.0 },
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

    // Day-based events (every 2 in-game days)
    if (shouldTriggerEvent(this.save) && this.save.pets.length > 0) {
      this.save.lastEventDay = this.save.gameDay;
      writeSave(this.save);
      const evt = getRandomEvent();
      if (evt.effect.hearts) this.save.hearts += evt.effect.hearts;
      if (evt.effect.need) {
        this.save.pets.forEach((p) => {
          p.needs[evt.effect.need] = Math.max(0, Math.min(100, p.needs[evt.effect.need] + evt.effect.change));
        });
      }
      writeSave(this.save);
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

    // === PATHS (depth -1, always below everything else) ===
    const pc = 0xc4a76c;
    // Central vertical spine
    this.drawPath(900, 260, 900, 1280, pc);
    // Horizontal branches — long paths to buildings at edges
    this.drawPath(200, 400, 900, 400, pc);
    this.drawPath(900, 400, 1600, 400, pc);
    this.drawPath(200, 800, 900, 800, pc);
    this.drawPath(900, 800, 1600, 800, pc);
    this.drawPath(200, 1150, 900, 1150, pc);
    this.drawPath(900, 1150, 1600, 1150, pc);
    // Fountain plaza
    this.add.circle(900, 700, 120, pc, 0.35).setDepth(-1);
    this.add.circle(900, 700, 130, 0x8a7a5a, 0.1).setDepth(-1);

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

    // === BUILDINGS (sequential unlock from SaveManager) ===
    // Find the next building that can be unlocked
    const nextUnlock = BUILDING_UNLOCK_ORDER.find(bo =>
      !(this.save.stations[bo.id] && this.save.stations[bo.id].unlocked));

    BUILDINGS.forEach((b) => {
      const isUnlocked = this.save.stations[b.id] && this.save.stations[b.id].unlocked;
      const isNext = nextUnlock && nextUnlock.id === b.id;

      if (this.textures.exists(b.tex)) {
        const bldDepth = 10 + Math.round((b.y + 50) / 10);
        const img = this.add.image(b.x, b.y, b.tex).setScale(b.scale).setDepth(bldDepth);
        if (!isUnlocked) { img.setTint(0x444444); img.setAlpha(isNext ? 0.75 : 0.4); }
        b._sprite = img;
      }
      // Building name label
      this.add.text(b.x, b.y - 80, b.name, {
        fontSize: '18px', fontFamily: 'Georgia, serif', color: '#fff8e8', fontStyle: 'bold',
        stroke: '#2a1520', strokeThickness: 5,
      }).setOrigin(0.5).setDepth(200);
      if (!isUnlocked) {
        this.add.text(b.x, b.y - 10, '🔒', { fontSize: '28px' }).setOrigin(0.5).setDepth(201);
        // Show unlock info for next building
        if (isNext) {
          this.add.text(b.x, b.y + 50, `${nextUnlock.cost}❤️ | Lv.${nextUnlock.minLevel}`, {
            fontSize: '14px', fontFamily: 'monospace', color: '#ffcc66', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
          }).setOrigin(0.5).setDepth(201);
        }
      } else if (b.id === 'shelter' && this.save.pets.length > 0) {
        this.add.circle(b.x + 55, b.y - 55, 14, 0xff4466).setDepth(202);
        this.add.text(b.x + 55, b.y - 55, `${this.save.pets.length}`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(203);
      }
    });

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

    // === COMPANION PET (follows camera center) ===
    this.companion = null;
    const companions = this.save.companions || [];
    if (companions.length > 0) {
      const comp = companions[0]; // primary companion
      // Map breedId to a sprite key
      const companionSpriteMap = {
        labrador: 'farm_dog_lab', dackel: 'farm_dog_lab', husky: 'farm_dog_white',
        hauskatze: 'farm_rabbit', perser: 'farm_rabbit_w', maine_coon: 'farm_rabbit',
      };
      const sprKey = companionSpriteMap[comp.breedId] || 'farm_dog_lab';
      const camCenter = this.cameras.main.getWorldPoint(this.scale.width / 2, this.scale.height / 2);
      if (this.textures.exists(sprKey)) {
        const compSprite = this.add.sprite(camCenter.x + 30, camCenter.y + 40, sprKey).setScale(2.2);
        const compShadow = this.add.ellipse(camCenter.x + 30, camCenter.y + 50, 18, 6, 0x000000, 0.2);
        const compLabel = this.add.text(camCenter.x + 30, camCenter.y + 20, comp.name, {
          fontSize: '10px', fontFamily: 'Georgia, serif', color: '#fff8e8', fontStyle: 'bold',
          stroke: '#2a1520', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(999);
        // Play idle animation
        const idleKey = `${sprKey}_idle`;
        if (this.anims.exists(idleKey)) compSprite.play(idleKey);
        this.companion = { sprite: compSprite, shadow: compShadow, label: compLabel, key: sprKey, targetX: camCenter.x + 30, targetY: camCenter.y + 40, currentDir: 'down' };
      }
    }

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

    // === TOP BAR (sticky, with day/night info) ===
    this.add.rectangle(width / 2, 0, width, 28, 0x000000, 0.45).setOrigin(0.5, 0).setScrollFactor(0).setDepth(500);
    this.add.text(8, 5, `❤️ ${this.save.hearts}`, { fontSize: '13px', fontFamily: 'monospace', color: '#ff8899', fontStyle: 'bold' }).setScrollFactor(0).setDepth(501);
    // Day/time indicator
    const timeEmojis = { morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' };
    this.add.text(width / 2, 5, `${timeEmojis[timeOfDay]} Tag ${this.save.gameDay}`, { fontSize: '13px', fontFamily: 'monospace', color: '#ffdd88', fontStyle: 'bold' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(501);
    this.add.text(width - 8, 5, `Lv.${this.save.level}`, { fontSize: '13px', fontFamily: 'monospace', color: '#88ccff', fontStyle: 'bold' }).setOrigin(1, 0).setScrollFactor(0).setDepth(501);

    // Music toggle (top right, small)
    if (this.save.musicOn !== false) {
      this.input.once('pointerdown', () => { unlockAudio(); startMusic('town'); });
    }
    const musicBtn = this.add.text(width - 8, 24, this.save.musicOn !== false ? '🎵' : '🔇', {
      fontSize: '14px',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(502).setInteractive();
    musicBtn.on('pointerdown', () => {
      this.save.musicOn = !(this.save.musicOn !== false);
      writeSave(this.save);
      if (this.save.musicOn) { unlockAudio(); startMusic('town'); musicBtn.setText('🎵'); }
      else { stopMusic(); musicBtn.setText('🔇'); }
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
          this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom + (dist - this.lastPinchDist) * 0.004, 0.35, 2.5));
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
                const popup = this.add.text(b.x, b.y - 30, msg, {
                  fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ff6644', fontStyle: 'bold',
                  stroke: '#000000', strokeThickness: 3,
                }).setOrigin(0.5).setDepth(500);
                this.tweens.add({ targets: popup, y: popup.y - 30, alpha: 0, duration: 1500, onComplete: () => popup.destroy() });
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
        const tz = this.cameras.main.zoom < 0.8 ? 1.2 : 0.5;
        this.tweens.add({ targets: this.cameras.main, zoom: tz, duration: 300, ease: 'Cubic.Out' });
        this.lastTapTime = 0;
      } else { this.lastTapTime = now; }
    });
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
    // Update companion — follows camera center with a lazy offset
    if (this.companion) {
      const cam = this.cameras.main;
      const targetX = cam.scrollX + cam.width / cam.zoom / 2 + 30;
      const targetY = cam.scrollY + cam.height / cam.zoom / 2 + 40;
      const c = this.companion;
      const cdx = targetX - c.sprite.x;
      const cdy = targetY - c.sprite.y;
      const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
      if (cdist > 8) {
        const cspd = Math.min(cdist * 0.03, 2.5);
        c.sprite.x += cdx * cspd * (delta / 16);
        c.sprite.y += cdy * cspd * (delta / 16);
        // Update walk animation direction
        const nd = this.getWalkDirection(cdx, cdy);
        if (nd !== c.currentDir) {
          c.currentDir = nd;
          const ak = `${c.key}_walk_${nd}`;
          if (this.anims.exists(ak)) c.sprite.play(ak, true);
        }
      } else {
        // Idle when close enough
        const ik = `${c.key}_idle`;
        if (this.anims.exists(ik) && c.currentDir !== 'idle') {
          c.sprite.play(ik, true);
          c.currentDir = 'idle';
        }
      }
      c.shadow.setPosition(c.sprite.x, c.sprite.y + 10);
      c.label.setPosition(c.sprite.x, c.sprite.y - 18);
      c.sprite.setDepth(10 + Math.round(c.sprite.y / 10));
      c.shadow.setDepth(c.sprite.depth - 1);
      c.label.setDepth(c.sprite.depth + 1);
    }
  }
}
