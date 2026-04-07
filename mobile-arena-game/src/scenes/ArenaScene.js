import Phaser from 'phaser';
import { loadSave, getSelectedMech, getMechStats } from '../systems/SaveSystem.js';
import { getArenaConfig, AMMO_TYPES } from '../systems/ArenaConfig.js';
import { generateArenaLayout, getRandomOpenPositions } from '../systems/ArenaLayoutGenerator.js';
import { getLoadoutEffects } from '../systems/SkillSystem.js';
import { getEnemyType, getBossConfig, isBossArena, BEHAVIOR, fanPattern } from '../systems/EnemyPatterns.js';
import { deathExplosion, hitSpark, lootPickupEffect, damageNumber, criticalHitEffect, healEffect, shieldActivateEffect } from '../systems/ParticleEffects.js';

export class ArenaScene extends Phaser.Scene {
  constructor() {
    super('Arena');
  }

  init(data) {
    this.arenaIndex = (data && data.arenaIndex) || 0;
    this.runCredits = (data && data.runCredits) || 0;
    this.runScrap = (data && data.runScrap) || 0;
    this.runXp = (data && data.runXp) || 0;
    this.runSeed = (data && data.runSeed) || 1;
  }

  create() {
    try {
      this._createInner();
    } catch (e) {
      // Show error visibly on screen
      this.cameras.main.setBackgroundColor('#330000');
      this.add.text(20, 20, 'ARENA CRASH:\n' + e.message + '\n\n' + (e.stack || '').substring(0, 500), {
        fontSize: '11px', fontFamily: 'monospace', color: '#ff4444',
        wordWrap: { width: 900 },
      });
      // Allow tapping to go back to menu
      this.input.on('pointerdown', () => this.scene.start('Menu'));
    }
  }

  _createInner() {
    const save = loadSave();
    const mechData = getSelectedMech(save);
    this.mechStats = getMechStats(mechData);
    this.mechData = mechData; // full mech data for weapon/special
    this.mechId = mechData.id;
    this.arenaConfig = getArenaConfig(this.arenaIndex);

    // Ammo system - load from save, basic is always available
    this.ammoStock = { ...save.ammo };
    this.currentAmmoType = 'basic';
    this.ammoTypeOrder = ['basic', 'plasma', 'explosive', 'piercing'];

    // Special ability state
    this.specialCharge = 0;
    this.specialActive = false;
    this.specialTimer = 0;

    const width = this.scale.width;
    const height = this.scale.height;

    // Load skill effects for this run
    const save2 = loadSave();
    const activeSkills = {};
    (save2.loadout || []).forEach((id) => {
      activeSkills[id] = save2.skillLevels[id] || 0;
    });
    this.skillEffects = getLoadoutEffects(activeSkills);

    // World = screen size (no scrolling, compact rooms)
    this.physics.world.setBounds(0, 0, width, height);

    // Background
    this.cameras.main.setBackgroundColor(this.arenaConfig.theme.bgColor);

    // Floor tiles - checkerboard dungeon pattern
    const tileSize = 32;
    for (let tx = 0; tx < width; tx += tileSize) {
      for (let ty = 70; ty < height; ty += tileSize) {
        const isLight = ((tx / tileSize) + (ty / tileSize)) % 2 === 0;
        const floorTex = isLight ? 'floor_light' : 'floor_dark';
        if (this.textures.exists(floorTex)) {
          this.add.image(tx + tileSize / 2, ty + tileSize / 2, floorTex)
            .setDisplaySize(tileSize, tileSize).setDepth(0).setAlpha(0.3);
        }
      }
    }

    // Arena boundary
    this.add.rectangle(width / 2, height / 2, width - 4, height - 4)
      .setStrokeStyle(2, this.arenaConfig.theme.color, 0.3)
      .setFillStyle(0x000000, 0).setDepth(1);

    // State
    this.playerHp = this.mechStats.hp;
    this.maxHp = this.mechStats.hp;
    this.enemiesKilled = 0;
    this.enemiesSpawned = 0;
    this.currentWave = 0;
    this.waveEnemiesLeft = 0;
    this.arenaCleared = false;
    this.arenaStartTime = this.time.now;
    this.lastFireTime = 0;

    // Portal unlock tracking - 3 ways to open portal:
    // 1) Collect all loot crates
    // 2) Kill all enemies (all waves)
    // 3) Timer runs out
    this.cratesCollected = 0;
    this.cratesTotal = this.arenaConfig.crateCount;
    this.portalTimerDone = false;
    this.clearMethod = null; // 'crates', 'kills', 'timer'

    // Ghost loot state
    this.ghostLoots = [];

    // Sequence switch state
    this.switches = [];
    this.switchSequence = [];
    this.switchPlayerInput = [];
    this.switchShowingSequence = false;
    this.switchPuzzleActive = false;
    this.switchPuzzleSolved = false;

    // Groups
    this.bullets = this.physics.add.group({ maxSize: 50, classType: Phaser.Physics.Arcade.Image });
    this.enemyBullets = this.physics.add.group({ maxSize: 30, classType: Phaser.Physics.Arcade.Image });
    this.enemies = this.physics.add.group();
    this.lootItems = this.physics.add.group();
    this.crates = this.physics.add.group();
    this.ghostLootGroup = this.physics.add.group();

    // Generate arena layout with walls - fits screen
    const topMargin = 70;
    this.arenaLayout = generateArenaLayout(this.arenaIndex, width, height, topMargin, this.runSeed);
    this.arenaRng = this.seedRng(this.arenaIndex * 3571 + 13);

    // Build wall physics - each segment is a small block
    this.walls = this.physics.add.staticGroup();
    this.arenaLayout.walls.forEach((w) => {
      const wall = this.walls.create(w.x, w.y, 'arena_wall');
      wall.setDisplaySize(w.w, w.h);
      wall.setTint(0x8b6b4a); // dungeon brown
      wall.body.setSize(w.w, w.h);
      wall.refreshBody();
      wall.setDepth(3);
    });

    // Player - starts at bottom center of world
    // Player at bottom center
    // Map mech IDs to dungeon hero sprites
    const heroMap = { striker: 'hero_knight', titan: 'hero_knight', phantom: 'hero_mage' };
    const heroTex = heroMap[this.mechId] || 'hero_knight';
    this.player = this.physics.add.image(width / 2, height - 60, heroTex);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setScale(2.5); // 16x16 sprite scaled to ~40px
    this.player.body.setSize(14, 14);

    // 1 second freeze at start
    this.startFrozen = true;
    this.player.body.enable = false;

    // Portal at random position (hidden until arena cleared)
    const pp = this.arenaLayout.portalPosition;
    this.portal = this.physics.add.image(pp.x, pp.y, 'portal');
    this.portal.setVisible(false);
    this.portal.setActive(false);
    this.portal.body.enable = false;

    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy, null, this);
    this.physics.add.overlap(this.enemyBullets, this.player, this.onEnemyBulletHitPlayer, null, this);
    this.physics.add.overlap(this.player, this.lootItems, this.onCollectLoot, null, this);
    this.physics.add.collider(this.player, this.enemies, this.onEnemyTouchPlayer, null, this);
    this.physics.add.overlap(this.player, this.portal, this.onEnterPortal, null, this);
    this.physics.add.overlap(this.player, this.crates, this.onCollectCrate, null, this);
    this.physics.add.overlap(this.bullets, this.ghostLootGroup, this.onShootGhostLoot, null, this);

    // Wall collisions - block player, enemies, and destroy bullets
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.bullets, this.walls, (bullet, wall) => {
      // Ricochet skill: bounce off walls
      const bounces = bullet.getData('bouncesLeft') || 0;
      if (bounces > 0) {
        bullet.setData('bouncesLeft', bounces - 1);
        // Reflect velocity based on which side was hit
        const bx = bullet.body.velocity.x;
        const by = bullet.body.velocity.y;
        if (Math.abs(bullet.x - wall.x) > Math.abs(bullet.y - wall.y)) {
          bullet.body.velocity.x = -bx;
        } else {
          bullet.body.velocity.y = -by;
        }
        bullet.setData('spawnTime', this.time.now); // reset lifetime on bounce
      } else {
        bullet.setActive(false).setVisible(false);
        bullet.body.enable = false;
      }
    });
    this.physics.add.collider(this.enemyBullets, this.walls, (bullet) => {
      bullet.setActive(false).setVisible(false);
      bullet.body.enable = false;
    });

    // Input - keyboard
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Single joystick for movement, auto-shoot when idle
    this.joystickActive = false;
    this.joystickDir = { x: 0, y: 0 };
    this.playerFacingAngle = -Math.PI / 2;
    this.joystickPointerId = null;
    this.playerMoving = false;
    this.setupSingleJoystick();

    // Keyboard
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.qKey.on('down', () => this.switchAmmo());
    this.eKey.on('down', () => this.activateSpecial());

    // No camera scroll - entire room visible

    // Unfreeze after 1 second
    const readyText = this.add.text(this.player.x, this.player.y - 40, 'GET READY...', {
      fontSize: '24px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);
    this.time.delayedCall(1000, () => {
      this.startFrozen = false;
      this.player.body.enable = true;
      readyText.setText('GO!');
      this.tweens.add({
        targets: readyText,
        alpha: 0, scale: 2,
        duration: 400,
        onComplete: () => readyText.destroy(),
      });
    });

    // HUD
    this.createHUD();

    // Spawn loot crates across the arena
    this.spawnCrates();

    // Spawn ghost loot (visible briefly, then invisible, shoot to collect)
    this.spawnGhostLoot();

    // Spawn sequence switches (every 3rd arena starting from arena 2)
    if (this.arenaIndex >= 2 && this.arenaIndex % 3 === 0) {
      this.spawnSequenceSwitches();
    }

    // Portal timer - opens portal after X seconds regardless
    this.portalTimerEvent = this.time.delayedCall(
      this.arenaConfig.portalTimerSeconds * 1000,
      () => {
        if (!this.arenaCleared) {
          this.portalTimerDone = true;
          this.clearMethod = 'timer';
          this.clearArena();
        }
      }
    );

    // Start first wave
    this.startWave();
  }

  seedRng(seed) {
    let s = seed;
    return function () {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }

  // Check if a world position is inside an occupied cell
  isInWall(wx, wy) {
    const layout = this.arenaLayout;
    const c = Math.floor(wx / layout.cellSize);
    const r = Math.floor((wy - layout.topMargin) / layout.cellSize);
    if (r < 0 || r >= layout.rows || c < 0 || c >= layout.cols) return true;
    return layout.occupied[r][c];
  }

  // Find nearest open position to given world coordinates
  findOpenPosition(wx, wy) {
    if (!this.isInWall(wx, wy)) return { x: wx, y: wy };
    // Search nearby open spaces
    let best = null;
    let bestDist = Infinity;
    this.arenaLayout.openSpaces.forEach((s) => {
      const d = Math.abs(s.x - wx) + Math.abs(s.y - wy);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    });
    return best || { x: wx, y: wy };
  }

  spawnCrates() {
    const positions = getRandomOpenPositions(this.arenaLayout, this.cratesTotal, this.arenaRng, 1, this.arenaLayout.rows - 3);
    for (let i = 0; i < positions.length; i++) {
      const { x, y } = positions[i];
      const crate = this.physics.add.image(x, y, 'loot_crate');
      crate.setScale(1.3);
      crate.setDepth(6);
      crate.body.setImmovable(true);
      this.crates.add(crate);

      // Gentle float animation
      this.tweens.add({
        targets: crate,
        y: y - 5,
        duration: Phaser.Math.Between(800, 1200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  onCollectCrate(player, crate) {
    if (this.arenaCleared) return;

    this.cratesCollected++;

    // Crate collect effect
    const x = crate.x;
    const y = crate.y;
    crate.destroy();

    // Burst effect
    const flash = this.add.circle(x, y, 12, 0xffaa00, 0.9).setDepth(50);
    this.tweens.add({
      targets: flash,
      scale: { from: 1, to: 3 },
      alpha: { from: 0.9, to: 0 },
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    // Drop loot from crate - ensure it lands in open space
    const lootCount = Phaser.Math.Between(2, 4);
    for (let i = 0; i < lootCount; i++) {
      const offX = Phaser.Math.Between(-25, 25);
      const offY = Phaser.Math.Between(-25, 25);
      const pos = this.findOpenPosition(x + offX, y + offY);
      const roll = Math.random();
      if (roll < 0.4) {
        this.spawnLoot(pos.x, pos.y, 'credit', Phaser.Math.Between(1, 2));
      } else if (roll < 0.65) {
        this.spawnLoot(pos.x, pos.y, 'scrap', 1);
      } else {
        // Ammo drop
        const ammoTypes = ['plasma', 'explosive', 'piercing'];
        const ammoType = ammoTypes[Math.floor(Math.random() * ammoTypes.length)];
        this.spawnLoot(pos.x, pos.y, 'ammo', Phaser.Math.Between(3, 8), ammoType);
      }
    }

    // Show progress
    const { width } = this.scale;
    const msg = this.add.text(width / 2, 180, `Crate ${this.cratesCollected}/${this.cratesTotal}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffaa00', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: msg,
      alpha: { from: 1, to: 0 },
      y: 160,
      duration: 800,
      onComplete: () => msg.destroy(),
    });

    // Check if all crates collected
    if (this.cratesCollected >= this.cratesTotal && !this.arenaCleared) {
      this.clearMethod = 'crates';
      this.clearArena();
    }
  }

  // === GHOST LOOT ===
  spawnGhostLoot() {
    const count = 3 + Math.floor(this.arenaIndex * 0.3);
    const positions = getRandomOpenPositions(this.arenaLayout, count, this.arenaRng, 1, this.arenaLayout.rows - 3);

    for (let i = 0; i < positions.length; i++) {
      const { x, y } = positions[i];
      const ghost = this.physics.add.image(x, y, 'ghost_loot');
      ghost.setDepth(5);
      ghost.setScale(1.2);
      ghost.body.setImmovable(true);
      ghost.setData('revealed', true);
      ghost.setData('value', Phaser.Math.Between(2, 5));
      this.ghostLootGroup.add(ghost);
      this.ghostLoots.push(ghost);

      // Visible for 1 second with pulsing, then completely invisible
      this.tweens.add({
        targets: ghost,
        alpha: { from: 0.9, to: 0.5 },
        scale: { from: 1.0, to: 1.3 },
        duration: 500,
        yoyo: true,
        repeat: 0, // 1 cycle = ~1 second
        onComplete: () => {
          ghost.setData('revealed', false);
          ghost.setAlpha(0);
        },
      });
    }
  }

  onShootGhostLoot(bullet, ghost) {
    if (!ghost.active) return;

    bullet.setActive(false).setVisible(false);
    bullet.body.enable = false;

    const value = ghost.getData('value');
    const x = ghost.x;
    const y = ghost.y;

    // Reveal and collect effect
    ghost.destroy();

    // Sparkle burst
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const spark = this.add.circle(
        x + Math.cos(angle) * 5,
        y + Math.sin(angle) * 5,
        3, 0x44ddff, 1
      ).setDepth(50);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 25,
        y: y + Math.sin(angle) * 25,
        alpha: 0,
        duration: 400,
        onComplete: () => spark.destroy(),
      });
    }

    // Reward text
    const { width } = this.scale;
    const msg = this.add.text(x, y - 15, `GHOST +${value}cr`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#44ddff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: msg,
      y: y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => msg.destroy(),
    });

    this.runCredits += value;

    // Small scrap bonus too
    this.runScrap += 1;
  }

  // === SEQUENCE SWITCHES (Simon Says) ===
  spawnSequenceSwitches() {
    const { width } = this.scale;
    const count = Math.min(3 + Math.floor((this.arenaIndex - 2) / 3), 6);

    // Place switches in open spaces
    const switchPositions = getRandomOpenPositions(this.arenaLayout, count, this.arenaRng, 3, this.arenaLayout.rows - 4);
    for (let i = 0; i < count; i++) {
      const pos = switchPositions[i] || { x: 50 + ((width - 100) / (count - 1 || 1)) * i, y: 350 };
      const sw = this.add.image(pos.x, pos.y, 'switch_off').setScale(1.3).setDepth(7);
      sw.setInteractive({ useHandCursor: true });
      sw.setData('index', i);
      this.switches.push(sw);

      // Click/tap handler
      sw.on('pointerdown', () => this.onSwitchPressed(i));
    }

    // Generate random sequence
    for (let i = 0; i < count; i++) {
      this.switchSequence.push(Phaser.Math.Between(0, count - 1));
    }

    // Start showing the sequence after a delay
    this.switchPuzzleActive = true;
    this.time.delayedCall(2000, () => this.showSequence());
  }

  showSequence() {
    if (!this.switchPuzzleActive || this.switchPuzzleSolved) return;
    this.switchShowingSequence = true;
    this.switchPlayerInput = [];

    const { width } = this.scale;
    const hint = this.add.text(width / 2, 230, 'WATCH THE SEQUENCE...', {
      fontSize: '12px', fontFamily: 'monospace', color: '#33ff88', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);

    // Flash each switch in sequence
    this.switchSequence.forEach((switchIdx, seqPos) => {
      this.time.delayedCall(600 * (seqPos + 1), () => {
        const sw = this.switches[switchIdx];
        if (!sw) return;
        sw.setTexture('switch_on');
        this.time.delayedCall(400, () => {
          sw.setTexture('switch_off');
        });
      });
    });

    // After sequence shown, allow input
    this.time.delayedCall(600 * (this.switchSequence.length + 1), () => {
      this.switchShowingSequence = false;
      hint.setText('YOUR TURN - Tap the switches!');
      this.time.delayedCall(1500, () => hint.destroy());
    });
  }

  onSwitchPressed(index) {
    if (!this.switchPuzzleActive || this.switchShowingSequence || this.switchPuzzleSolved) return;

    const sw = this.switches[index];
    const expectedIdx = this.switchPlayerInput.length;
    const expected = this.switchSequence[expectedIdx];

    if (index === expected) {
      // Correct
      sw.setTexture('switch_on');
      this.time.delayedCall(300, () => sw.setTexture('switch_off'));
      this.switchPlayerInput.push(index);

      // Check if complete
      if (this.switchPlayerInput.length === this.switchSequence.length) {
        this.onSequenceSolved();
      }
    } else {
      // Wrong - flash all red, reset
      this.switches.forEach((s) => s.setTexture('switch_error'));
      this.time.delayedCall(600, () => {
        this.switches.forEach((s) => s.setTexture('switch_off'));
        this.switchPlayerInput = [];
        // Replay sequence
        this.time.delayedCall(500, () => this.showSequence());
      });
    }
  }

  onSequenceSolved() {
    this.switchPuzzleSolved = true;
    const { width } = this.scale;

    // All switches glow green
    this.switches.forEach((sw) => {
      sw.setTexture('switch_on');
      this.tweens.add({
        targets: sw,
        scale: { from: 1.3, to: 1.8 },
        alpha: { from: 1, to: 0.3 },
        duration: 600,
        onComplete: () => sw.destroy(),
      });
    });

    // Big reward
    const reward = 5 + this.arenaIndex * 2;
    const scrapReward = 2 + this.arenaIndex;
    this.runCredits += reward;
    this.runScrap += scrapReward;

    const msg = this.add.text(width / 2, 300, `PUZZLE SOLVED!\n+${reward}cr +${scrapReward}sc`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#33ff88', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: msg,
      y: 270,
      alpha: { from: 1, to: 0 },
      duration: 2000,
      onComplete: () => msg.destroy(),
    });
  }

  setupSingleJoystick() {
    const { width, height } = this.scale;

    // Single joystick - appears wherever you touch
    this.joystickBase = this.add.image(width / 2, height - 100, 'joystick_base')
      .setDepth(100).setAlpha(0);
    this.joystickThumb = this.add.image(width / 2, height - 100, 'joystick_thumb')
      .setDepth(101).setAlpha(0);

    this.input.on('pointerdown', (pointer) => {
      this.joystickActive = true;
      this.joystickPointerId = pointer.id;
      this.joystickBase.setPosition(pointer.x, pointer.y).setAlpha(1);
      this.joystickThumb.setPosition(pointer.x, pointer.y).setAlpha(1);
      this.joystickOrigin = { x: pointer.x, y: pointer.y };
    });

    this.input.on('pointermove', (pointer) => {
      if (this.joystickActive && pointer.id === this.joystickPointerId && this.joystickOrigin) {
        const dx = pointer.x - this.joystickOrigin.x;
        const dy = pointer.y - this.joystickOrigin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 50;
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        this.joystickThumb.setPosition(
          this.joystickOrigin.x + Math.cos(angle) * clampedDist,
          this.joystickOrigin.y + Math.sin(angle) * clampedDist,
        );

        if (dist > 10) {
          this.joystickDir.x = Math.cos(angle);
          this.joystickDir.y = Math.sin(angle);
        } else {
          this.joystickDir.x = 0;
          this.joystickDir.y = 0;
        }
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (pointer.id === this.joystickPointerId) {
        this.joystickActive = false;
        this.joystickPointerId = null;
        this.joystickDir.x = 0;
        this.joystickDir.y = 0;
        this.joystickBase.setAlpha(0);
        this.joystickThumb.setAlpha(0);
      }
    });
  }

  createHUD() {
    const { width, height } = this.scale;
    const sf = 0; // scrollFactor 0 = fixed to camera

    // HUD - bigger, more visible
    // Hearts system: each heart = 25 HP
    this.heartSize = 25;
    this.maxHearts = Math.ceil(this.maxHp / this.heartSize);

    this.heartsText = this.add.text(8, 6, '', {
      fontSize: '18px', fontFamily: 'Arial',
    }).setDepth(102).setScrollFactor(sf);

    // Arena + Wave info
    this.waveText = this.add.text(8, 30, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setDepth(100).setScrollFactor(sf);

    // Crate progress
    this.crateText = this.add.text(8, 48, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffaa00',
    }).setDepth(100).setScrollFactor(sf);

    // Timer (top right, big)
    this.timerText = this.add.text(width - 8, 6, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(sf);

    // Loot display (below timer)
    this.lootText = this.add.text(width - 8, 26, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffdd00',
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(sf);

    // Ammo indicator (below loot)
    this.ammoText = this.add.text(width - 8, 44, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(sf);

    // Portal direction arrow (shows when portal is off-screen)
    this.portalArrow = this.add.triangle(0, 0, 0, 12, 6, 0, 12, 12, 0x9944ff, 1)
      .setDepth(150).setScrollFactor(sf).setVisible(false);

    // Special ability button (bottom center)
    const specLabel = this.mechData.specialType === 'dash' ? 'DASH' :
      this.mechData.specialType === 'shield' ? 'SHIELD' : 'CLOAK';
    this.specialBtn = this.add.text(width / 2, height - 15, `[ ${specLabel} ]`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#444444', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100).setScrollFactor(sf);

    // Special charge bar (above button)
    this.add.rectangle(width / 2, height - 30, 80, 6, 0x333333, 0.6).setDepth(100).setScrollFactor(sf);
    this.specialBar = this.add.rectangle(width / 2 - 40, height - 30, 0, 6, 0xffaa00, 0.8)
      .setOrigin(0, 0.5).setDepth(101).setScrollFactor(sf);
  }

  startWave() {
    if (this.arenaCleared) return;

    this.currentWave++;
    if (this.currentWave > this.arenaConfig.totalWaves) {
      if (!this.arenaCleared) {
        this.clearMethod = 'kills';
        this.clearArena();
      }
      return;
    }

    const enemiesInWave = Math.ceil(this.arenaConfig.enemyCount / this.arenaConfig.totalWaves);
    this.waveEnemiesLeft = enemiesInWave;
    this.enemiesSpawned = 0;

    this.waveText.setText(`Wave ${this.currentWave}/${this.arenaConfig.totalWaves}`);

    // Show wave announcement
    const { width, height } = this.scale;
    const announce = this.add.text(width / 2, height / 2 - 40, `WAVE ${this.currentWave}`, {
      fontSize: '28px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200).setAlpha(0);

    this.tweens.add({
      targets: announce,
      alpha: { from: 0, to: 1 },
      y: height / 2 - 60,
      duration: 400,
      yoyo: true,
      hold: 600,
      onComplete: () => announce.destroy(),
    });

    // Spawn enemies over time
    this.spawnTimer = this.time.addEvent({
      delay: this.arenaConfig.spawnInterval,
      callback: () => this.spawnEnemy(),
      repeat: enemiesInWave - 1,
    });
  }

  spawnEnemy() {
    const { width } = this.scale;
    const config = this.arenaConfig;

    // Use EnemyPatterns system for varied enemy types
    const roll = Math.random();
    const enemyType = getEnemyType(this.arenaIndex, roll);

    const texture = enemyType.textureKey;
    const hp = config.enemyHp * enemyType.hpMult;
    const speed = config.enemySpeed * enemyType.speedMult;
    const damage = config.enemyDamage * enemyType.damageMult;
    const size = 14;

    // Spawn in open space, preferring spots far from player
    const spawnPositions = getRandomOpenPositions(this.arenaLayout, 5, () => Math.random(), 0, Math.floor(this.arenaLayout.rows * 0.7));
    let bestPos = { x: Phaser.Math.Between(30, width - 30), y: 30 }; // fallback
    let bestDist = 0;
    spawnPositions.forEach((pos) => {
      const d = Phaser.Math.Distance.Between(pos.x, pos.y, this.player.x, this.player.y);
      if (d > bestDist) {
        bestDist = d;
        bestPos = pos;
      }
    });
    const x = bestPos.x;
    const y = bestPos.y;

    const enemy = this.physics.add.image(x, y, texture);
    enemy.setScale(2); // 16x16 → 32px
    enemy.body.setSize(size, size);
    enemy.setData('hp', hp);
    enemy.setData('maxHp', hp);
    enemy.setData('speed', speed);
    enemy.setData('damage', damage);
    enemy.setData('shootTimer', 0);
    enemy.setData('shootInterval', enemyType.shootInterval || Phaser.Math.Between(1500, 3000));
    enemy.setData('behavior', enemyType.behaviorType);
    enemy.setData('bulletSpeed', enemyType.bulletSpeed || 200);
    enemy.setData('dashTimer', 0);
    enemy.setData('dashCooldown', enemyType.dashCooldown || 2000);
    enemy.setData('dashSpeed', enemyType.dashSpeed || 400);
    enemy.setData('orbitAngle', Math.random() * Math.PI * 2);
    enemy.setData('teleportTimer', 0);
    enemy.setData('teleportInterval', enemyType.teleportInterval || 3000);
    this.enemies.add(enemy);
    this.enemiesSpawned++;
  }

  clearArena() {
    if (this.arenaCleared) return;
    this.arenaCleared = true;

    // Cancel portal timer if still running
    if (this.portalTimerEvent) {
      this.portalTimerEvent.remove(false);
    }

    // Show portal
    this.portal.setVisible(true);
    this.portal.setActive(true);
    this.portal.body.enable = true;

    // Pulse animation on portal
    this.tweens.add({
      targets: this.portal,
      scaleX: { from: 0.8, to: 1.2 },
      scaleY: { from: 0.8, to: 1.2 },
      alpha: { from: 0.6, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Time bonus - only for crates/kills (not for timer-out)
    const elapsed = (this.time.now - this.arenaStartTime) / 1000;
    const parTime = this.arenaConfig.parTimeSeconds;
    if (this.clearMethod === 'timer') {
      this.timeBonus = 0;
    } else {
      this.timeBonus = elapsed < parTime ? Math.floor((parTime - elapsed) * 0.5) : 0;
    }

    const { width } = this.scale;
    const methodLabels = {
      crates: 'ALL CRATES COLLECTED!',
      kills: 'ALL ENEMIES DEFEATED!',
      timer: 'TIME UP - PORTAL OPEN!',
    };
    const methodColors = {
      crates: '#ffaa00',
      kills: '#ff4444',
      timer: '#8888aa',
    };

    this.add.text(width / 2, 110, methodLabels[this.clearMethod] || 'CLEARED!', {
      fontSize: '14px', fontFamily: 'monospace', color: methodColors[this.clearMethod] || '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);

    if (this.timeBonus > 0) {
      this.add.text(width / 2, 140, `Speed Bonus: +${this.timeBonus} credits!`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#ffdd00',
      }).setOrigin(0.5).setDepth(200);
    }

    // Auto-transition: go directly to next arena after 2 seconds
    const { height } = this.scale;
    this.add.text(width / 2, height / 2 + 30, 'ARENA CLEAR!', {
      fontSize: '18px', fontFamily: 'monospace', color: '#cc88ff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(201);

    // Store next arena data
    this.nextArenaData = {
      arenaIndex: this.arenaIndex + 1,
      runCredits: this.runCredits + this.arenaConfig.creditsReward + (this.timeBonus || 0),
      runScrap: this.runScrap + this.arenaConfig.scrapReward,
      runXp: this.runXp + this.arenaConfig.xpReward,
      runSeed: this.runSeed,
      ammoStock: this.ammoStock,
    };

    // Set flag - transition happens in update() loop
    this.pendingTransition = this.time.now + 2000;
    this.clearTapHandler = true;
  }

  goToArenaComplete() {
    if (this.transitioning) return;
    this.transitioning = true;
    // Remove any pending timers

    // Auto-collect all remaining loot
    this.lootItems.getChildren().forEach((loot) => {
      if (!loot.active) return;
      const type = loot.getData('type');
      const value = loot.getData('value');
      if (type === 'credit') this.runCredits += value;
      else if (type === 'scrap') this.runScrap += value;
      else if (type === 'health') this.playerHp = Math.min(this.maxHp, this.playerHp + value);
      else if (type === 'ammo') {
        const at = loot.getData('ammoType');
        if (at && this.ammoStock[at] !== undefined) this.ammoStock[at] += value;
      }
    });
    this.scene.start('ArenaComplete', {
      arenaIndex: this.arenaIndex,
      runCredits: this.runCredits + this.arenaConfig.creditsReward + (this.timeBonus || 0),
      runScrap: this.runScrap + this.arenaConfig.scrapReward,
      runXp: this.runXp + this.arenaConfig.xpReward,
      timeBonus: this.timeBonus || 0,
      playerHpPercent: this.playerHp / this.maxHp,
      runSeed: this.runSeed,
      ammoStock: this.ammoStock,
    });
  }

  onBulletHitEnemy(bullet, enemy) {
    const isPiercing = bullet.getData('piercing');
    const isSplash = bullet.getData('splash');
    const damageMult = bullet.getData('damageMult') || 1;

    // Piercing bullets don't stop on hit
    if (!isPiercing) {
      bullet.setActive(false).setVisible(false);
      bullet.body.enable = false;
    }

    const damage = Math.floor(this.mechStats.damage * damageMult);
    const hp = enemy.getData('hp') - damage;
    enemy.setData('hp', hp);

    // Hit effects
    enemy.setTint(0xffffff);
    this.time.delayedCall(60, () => { if (enemy.active) enemy.clearTint(); });
    hitSpark(this, enemy.x, enemy.y);
    const isCrit = bullet.getData('isCrit');
    damageNumber(this, enemy.x, enemy.y - 15, damage, isCrit);
    if (isCrit) criticalHitEffect(this, enemy.x, enemy.y);

    // Splash damage: hurt nearby enemies
    if (isSplash) {
      const splashR = 50;
      this.enemies.getChildren().forEach((other) => {
        if (!other.active || other === enemy) return;
        const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, other.x, other.y);
        if (d < splashR) {
          const splashDmg = Math.floor(damage * 0.5);
          other.setData('hp', other.getData('hp') - splashDmg);
          other.setTint(0xffaa00);
          this.time.delayedCall(60, () => {
            if (other.active) other.clearTint();
          });
          if (other.getData('hp') <= 0) this.killEnemy(other);
        }
      });
    }

    if (hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  killEnemy(enemy) {
    const x = enemy.x;
    const y = enemy.y;

    // Enemies give XP only, no loot drops
    this.runXp += Phaser.Math.Between(2, 5);

    // Death explosion particles
    deathExplosion(this, x, y);
    damageNumber(this, x, y - 10, 'XP', false);

    // Bomber: explode on death dealing area damage
    if (enemy.getData('behavior') === BEHAVIOR.BOMBER) {
      const splashR = 60;
      this.cameras.main.shake(150, 0.01);
      deathExplosion(this, x, y, 0xff6600);
      // Damage player if close
      const pDist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
      if (pDist < splashR) this.takeDamage(enemy.getData('damage'));
    }

    enemy.destroy();
    this.enemiesKilled++;
    this.waveEnemiesLeft--;
    this.chargeSpecial(); // charge special on kill

    // Lifesteal skill
    const healOnKill = this.skillEffects ? this.skillEffects.healOnKill : 0;
    if (healOnKill > 0) {
      this.playerHp = Math.min(this.maxHp, this.playerHp + healOnKill);
      healEffect(this, this.player.x, this.player.y);
    }

    // Check wave complete - all active enemies dead
    const allDead = this.enemies.getChildren().filter((e) => e.active).length === 0;
    if (allDead) {
      // Cancel any remaining spawn timer
      if (this.spawnTimer) {
        this.spawnTimer.remove(false);
        this.spawnTimer = null;
      }
      this.time.delayedCall(500, () => this.startWave());
    }
  }

  spawnLoot(x, y, type, value, ammoType) {
    const textures = { credit: 'loot_credit', scrap: 'loot_scrap', health: 'loot_health', ammo: 'loot_ammo' };
    const loot = this.physics.add.image(x, y, textures[type] || 'loot_credit');
    if (ammoType) loot.setData('ammoType', ammoType);
    loot.setData('type', type);
    loot.setData('value', value);
    loot.setDepth(5);
    this.lootItems.add(loot);

    // Small bounce animation
    this.tweens.add({
      targets: loot,
      y: y - 10,
      duration: 200,
      yoyo: true,
      ease: 'Bounce',
    });

    // Auto-despawn after 8 seconds
    this.time.delayedCall(8000, () => {
      if (loot.active) {
        this.tweens.add({
          targets: loot,
          alpha: 0,
          duration: 300,
          onComplete: () => loot.destroy(),
        });
      }
    });
  }

  onCollectLoot(player, loot) {
    const type = loot.getData('type');
    const value = loot.getData('value');

    if (type === 'credit') {
      this.runCredits += value;
    } else if (type === 'scrap') {
      this.runScrap += value;
    } else if (type === 'health') {
      this.playerHp = Math.min(this.maxHp, this.playerHp + value);
    } else if (type === 'ammo') {
      const ammoType = loot.getData('ammoType');
      if (ammoType && this.ammoStock[ammoType] !== undefined) {
        this.ammoStock[ammoType] += value;
      }
    }

    lootPickupEffect(this, loot.x, loot.y, type);
    loot.destroy();
  }

  onEnemyBulletHitPlayer(player, bullet) {
    bullet.setActive(false).setVisible(false);
    bullet.body.enable = false;
    this.takeDamage(5 + this.arenaIndex * 2);
  }

  onEnemyTouchPlayer(player, enemy) {
    const dmg = enemy.getData('damage');
    this.takeDamage(dmg);

    // Push enemy back
    const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
    enemy.body.velocity.x = Math.cos(angle) * 200;
    enemy.body.velocity.y = Math.sin(angle) * 200;
  }

  takeDamage(amount) {
    if (this.playerInvuln) return;

    // Minimum damage = 1/4 heart
    const minDmg = Math.ceil(this.heartSize * 0.25);
    this.playerHp -= Math.max(amount, minDmg);
    this.playerInvuln = true;

    // Flash player
    this.tweens.add({
      targets: this.player,
      alpha: { from: 0.3, to: 1 },
      duration: 100,
      repeat: 3,
      onComplete: () => {
        this.playerInvuln = false;
        this.player.setAlpha(1);
      },
    });

    // Screen shake
    this.cameras.main.shake(100, 0.005);

    if (this.playerHp <= 0) {
      this.playerHp = 0;
      this.gameOver();
    }
  }

  onEnterPortal(player, portal) {
    if (!this.arenaCleared || this.transitioning) return;
    this.transitioning = true;

    const nextData = {
      arenaIndex: this.arenaIndex,
      runCredits: this.runCredits + this.arenaConfig.creditsReward + (this.timeBonus || 0),
      runScrap: this.runScrap + this.arenaConfig.scrapReward,
      runXp: this.runXp + this.arenaConfig.xpReward,
      timeBonus: this.timeBonus || 0,
      playerHpPercent: this.playerHp / this.maxHp,
      runSeed: this.runSeed,
      ammoStock: this.ammoStock,
    };

    // Go directly to next scene (skip fade which can hang)
    this.scene.start('ArenaComplete', nextData);
  }

  gameOver() {
    this.physics.pause();
    this.scene.start('GameOver', {
      arenaIndex: this.arenaIndex,
      runCredits: this.runCredits,
      runScrap: this.runScrap,
      runXp: this.runXp,
      ammoStock: this.ammoStock,
    });
  }

  autoShootAtNearest() {
    // Find nearest enemy and shoot at it
    let nearest = null;
    let nearestDist = Infinity;
    this.enemies.getChildren().forEach((e) => {
      if (!e.active) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (d < nearestDist) { nearestDist = d; nearest = e; }
    });
    if (!nearest || nearestDist > 500) return;

    // Face the target
    this.playerFacingAngle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y, nearest.x, nearest.y
    );
    this.player.rotation = this.playerFacingAngle + Math.PI / 2;

    // Fire
    this.fireInFacingDirection();
  }

  fireInFacingDirection() {
    const frMult = this.skillEffects ? this.skillEffects.fireRateMult : 1;
    if (this.time.now - this.lastFireTime < this.mechStats.fireRate * 0.5 * frMult) return;

    // Check ammo
    const ammoType = AMMO_TYPES[this.currentAmmoType];
    if (!ammoType.infinite) {
      if ((this.ammoStock[this.currentAmmoType] || 0) <= 0) {
        this.currentAmmoType = 'basic';
        return;
      }
      this.ammoStock[this.currentAmmoType]--;
    }

    this.lastFireTime = this.time.now;
    const mech = this.mechData;
    const angle = this.playerFacingAngle;
    const extraBullets = this.skillEffects ? this.skillEffects.extraBullets : 0;
    const bulletCount = (mech.bulletCount || 1) + extraBullets;
    const spread = mech.bulletSpread || 0;

    // Fire multiple bullets for shotgun, single for others
    for (let i = 0; i < bulletCount; i++) {
      let shotAngle = angle;
      if (bulletCount > 1) {
        // Spread pellets evenly across spread arc
        shotAngle = angle - spread / 2 + (spread / (bulletCount - 1)) * i;
        // Add tiny random variation
        shotAngle += (Math.random() - 0.5) * 0.1;
      }

      const textureName = `bullet_${this.currentAmmoType}`;
      const bullet = this.bullets.get(this.player.x, this.player.y, textureName);
      if (!bullet) continue;

      bullet.setActive(true).setVisible(true);
      bullet.body.enable = true;
      bullet.setDepth(8);
      bullet.setTexture(textureName);
      bullet.setScale(mech.bulletSize || 1);
      bullet.setData('spawnTime', this.time.now);
      bullet.setData('ammoType', this.currentAmmoType);
      // Apply crit chance from skills
      const critChance = this.skillEffects ? this.skillEffects.critChance : 0;
      const isCrit = Math.random() < critChance;
      bullet.setData('damageMult', ammoType.damageMult * (isCrit ? 2 : 1));
      bullet.setData('isCrit', isCrit);
      // Phantom's laser always pierces, others depend on ammo type
      bullet.setData('piercing', ammoType.piercing || mech.weaponType === 'laser');
      bullet.setData('splash', ammoType.splash);
      // Tint bullet to mech color if using basic ammo
      if (this.currentAmmoType === 'basic') {
        bullet.setTint(mech.bulletColor || 0xffff44);
      } else {
        bullet.clearTint();
      }

      bullet.body.velocity.x = Math.cos(shotAngle) * ammoType.speed;
      bullet.body.velocity.y = Math.sin(shotAngle) * ammoType.speed;

      // Shotgun pellets: shorter lifetime (1.5s vs 3s for others)
      const lifetime = mech.weaponType === 'shotgun' ? 1500 : 3000;
      bullet.setData('lifetime', lifetime);
      bullet.setData('bouncesLeft', this.skillEffects ? this.skillEffects.bounces : 0);
    }
  }

  // === SPECIAL ABILITIES ===
  activateSpecial() {
    if (this.specialActive || this.specialCharge < 100) return;
    this.specialCharge = 0;
    this.specialActive = true;
    const mech = this.mechData;

    if (mech.specialType === 'dash') {
      // Striker: burst of speed + invulnerable
      this.playerInvuln = true;
      const dashSpeed = this.mechStats.speed * 3;
      const angle = this.playerFacingAngle;
      this.player.body.velocity.x = Math.cos(angle) * dashSpeed;
      this.player.body.velocity.y = Math.sin(angle) * dashSpeed;
      // Trail effect
      const trail = this.add.circle(this.player.x, this.player.y, 8, 0x3399ff, 0.6).setDepth(5);
      this.tweens.add({ targets: trail, alpha: 0, scale: 2, duration: 300, onComplete: () => trail.destroy() });
      this.time.delayedCall(mech.specialDuration, () => {
        this.specialActive = false;
        this.playerInvuln = false;
      });

    } else if (mech.specialType === 'shield') {
      // Titan: damage shield
      this.shieldSprite = this.add.image(this.player.x, this.player.y, 'shield_effect')
        .setDepth(11).setScale(1.5);
      this.playerInvuln = true;
      this.time.delayedCall(mech.specialDuration, () => {
        this.specialActive = false;
        this.playerInvuln = false;
        if (this.shieldSprite) { this.shieldSprite.destroy(); this.shieldSprite = null; }
      });

    } else if (mech.specialType === 'cloak') {
      // Phantom: invisible to enemies
      this.player.setAlpha(0.2);
      this.playerCloaked = true;
      this.time.delayedCall(mech.specialDuration, () => {
        this.specialActive = false;
        this.playerCloaked = false;
        this.player.setAlpha(1);
      });
    }
  }

  chargeSpecial(amount) {
    if (!this.mechData) return;
    this.specialCharge = Math.min(100, this.specialCharge + (amount || this.mechData.specialChargeRate));
  }

  switchAmmo() {
    // Cycle to next ammo type that has stock (or basic)
    const idx = this.ammoTypeOrder.indexOf(this.currentAmmoType);
    for (let i = 1; i <= this.ammoTypeOrder.length; i++) {
      const nextType = this.ammoTypeOrder[(idx + i) % this.ammoTypeOrder.length];
      if (nextType === 'basic' || (this.ammoStock[nextType] || 0) > 0) {
        this.currentAmmoType = nextType;
        return;
      }
    }
    this.currentAmmoType = 'basic';
  }

  enemyAI(enemy, delta) {
    if (!enemy.active || !this.player.active) return;

    if (this.playerCloaked) {
      const wa = enemy.getData('wanderAngle') || Math.random() * Math.PI * 2;
      if (Math.random() < 0.02) enemy.setData('wanderAngle', Math.random() * Math.PI * 2);
      enemy.body.velocity.x = Math.cos(wa) * enemy.getData('speed') * 0.3;
      enemy.body.velocity.y = Math.sin(wa) * enemy.getData('speed') * 0.3;
      return;
    }

    const speed = enemy.getData('speed');
    const behavior = enemy.getData('behavior') || BEHAVIOR.CHASE;
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

    // Movement based on behavior type
    switch (behavior) {
      case BEHAVIOR.CHASE:
      default:
        enemy.body.velocity.x = Math.cos(angle) * speed;
        enemy.body.velocity.y = Math.sin(angle) * speed;
        break;

      case BEHAVIOR.CIRCLE: {
        const orbit = enemy.getData('orbitAngle') + delta * 0.002;
        enemy.setData('orbitAngle', orbit);
        const orbitR = 120;
        if (dist > orbitR + 30) {
          enemy.body.velocity.x = Math.cos(angle) * speed;
          enemy.body.velocity.y = Math.sin(angle) * speed;
        } else {
          enemy.body.velocity.x = Math.cos(orbit) * speed * 0.7;
          enemy.body.velocity.y = Math.sin(orbit) * speed * 0.7;
        }
        break;
      }

      case BEHAVIOR.DASH: {
        const dt = (enemy.getData('dashTimer') || 0) + delta;
        enemy.setData('dashTimer', dt);
        const cd = enemy.getData('dashCooldown');
        if (dt < cd * 0.7) {
          // Pause phase - slow approach
          enemy.body.velocity.x = Math.cos(angle) * speed * 0.2;
          enemy.body.velocity.y = Math.sin(angle) * speed * 0.2;
        } else if (dt < cd) {
          // Dash phase
          const ds = enemy.getData('dashSpeed');
          enemy.body.velocity.x = Math.cos(angle) * ds;
          enemy.body.velocity.y = Math.sin(angle) * ds;
        } else {
          enemy.setData('dashTimer', 0);
        }
        break;
      }

      case BEHAVIOR.SNIPER:
        if (dist < 180) {
          // Back away
          enemy.body.velocity.x = -Math.cos(angle) * speed * 0.6;
          enemy.body.velocity.y = -Math.sin(angle) * speed * 0.6;
        } else if (dist > 250) {
          enemy.body.velocity.x = Math.cos(angle) * speed * 0.4;
          enemy.body.velocity.y = Math.sin(angle) * speed * 0.4;
        } else {
          enemy.body.velocity.x = 0;
          enemy.body.velocity.y = 0;
        }
        break;

      case BEHAVIOR.BOMBER:
        // Rush at player, faster as closer
        const rushMult = dist < 80 ? 2 : 1;
        enemy.body.velocity.x = Math.cos(angle) * speed * rushMult;
        enemy.body.velocity.y = Math.sin(angle) * speed * rushMult;
        break;

      case BEHAVIOR.SWARM:
        // Slight zigzag toward player
        const zig = Math.sin(this.time.now * 0.01 + enemy.x) * 0.5;
        enemy.body.velocity.x = Math.cos(angle + zig) * speed;
        enemy.body.velocity.y = Math.sin(angle + zig) * speed;
        break;

      case BEHAVIOR.TELEPORT: {
        const tt = (enemy.getData('teleportTimer') || 0) + delta;
        enemy.setData('teleportTimer', tt);
        if (tt >= enemy.getData('teleportInterval')) {
          enemy.setData('teleportTimer', 0);
          const { width, height } = this.scale;
          enemy.setPosition(Phaser.Math.Between(40, width - 40), Phaser.Math.Between(100, height - 100));
          enemy.setAlpha(0);
          this.tweens.add({ targets: enemy, alpha: 1, duration: 300 });
        }
        enemy.body.velocity.x = Math.cos(angle) * speed * 0.3;
        enemy.body.velocity.y = Math.sin(angle) * speed * 0.3;
        break;
      }
    }

    // Shooting
    const shootTimer = (enemy.getData('shootTimer') || 0) + delta;
    enemy.setData('shootTimer', shootTimer);
    if (shootTimer >= enemy.getData('shootInterval')) {
      enemy.setData('shootTimer', 0);
      if (behavior === BEHAVIOR.SNIPER) {
        // Accurate fast shot
        this.enemyShoot(enemy, angle, enemy.getData('bulletSpeed') || 350);
      } else if (behavior === BEHAVIOR.CIRCLE) {
        // Fan pattern
        const angles = fanPattern(3, 0.4);
        angles.forEach((a) => this.enemyShoot(enemy, angle + a));
      } else if (behavior !== BEHAVIOR.SWARM && behavior !== BEHAVIOR.BOMBER) {
        this.enemyShoot(enemy, angle);
      }
    }
  }

  enemyShoot(enemy, angle, bulletSpeed) {
    const bullet = this.enemyBullets.get(enemy.x, enemy.y, 'enemy_bullet');
    if (!bullet) return;
    bullet.setActive(true).setVisible(true);
    bullet.body.enable = true;
    bullet.setDepth(8);

    const speed = bulletSpeed || 200;
    bullet.body.velocity.x = Math.cos(angle) * speed;
    bullet.body.velocity.y = Math.sin(angle) * speed;

    this.time.delayedCall(3000, () => {
      if (bullet.active) {
        bullet.setActive(false).setVisible(false);
        bullet.body.enable = false;
      }
    });
  }

  update(time, delta) {
    if (!this.player || !this.player.active) return;
    if (this.startFrozen) return;

    // Pending arena transition (timer or tap to skip)
    if (this.pendingTransition && !this.transitioning) {
      if (this.time.now >= this.pendingTransition ||
          (this.clearTapHandler && this.input.activePointer.isDown)) {
        this.transitioning = true;
        this.clearTapHandler = false;
        // Auto-collect all loot
        this.lootItems.getChildren().forEach((l) => {
          if (!l.active) return;
          const t = l.getData('type'), v = l.getData('value');
          if (t === 'credit') this.nextArenaData.runCredits += v;
          else if (t === 'scrap') this.nextArenaData.runScrap += v;
        });
        // Go via Transition scene (scene can't restart itself reliably)
        this.scene.start('Transition', this.nextArenaData);
        return;
      }
    }

    // Player movement
    let vx = 0;
    let vy = 0;

    // Keyboard
    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;

    // Touch joystick
    if (this.joystickActive) {
      vx = this.joystickDir.x;
      vy = this.joystickDir.y;
    }

    // Apply speed (with skill boost)
    const len = Math.sqrt(vx * vx + vy * vy);
    if (len > 0) { vx /= len; vy /= len; }
    const speedMult = this.skillEffects ? this.skillEffects.speedMult : 1;
    this.player.body.velocity.x = vx * this.mechStats.speed * speedMult;
    this.player.body.velocity.y = vy * this.mechStats.speed * speedMult;
    this.playerMoving = len > 0.1;

    // Face movement direction
    if (this.playerMoving) {
      this.playerFacingAngle = Math.atan2(vy, vx);
      this.player.rotation = this.playerFacingAngle + Math.PI / 2;
    }

    // AUTO-SHOOT: fire at nearest enemy when NOT moving
    if (!this.playerMoving) {
      this.autoShootAtNearest();
    }

    // Loot magnet skill - attract nearby loot toward player
    if (this.skillEffects && this.skillEffects.magnetRange > 40) {
      const mr = this.skillEffects.magnetRange;
      this.lootItems.getChildren().forEach((l) => {
        if (!l.active) return;
        const d = Phaser.Math.Distance.Between(l.x, l.y, this.player.x, this.player.y);
        if (d < mr && d > 5) {
          const a = Phaser.Math.Angle.Between(l.x, l.y, this.player.x, this.player.y);
          l.x += Math.cos(a) * 3;
          l.y += Math.sin(a) * 3;
        }
      });
    }

    // Shield skill - periodic auto-activation
    if (this.skillEffects && this.skillEffects.shieldInterval > 0) {
      this.shieldSkillTimer = (this.shieldSkillTimer || 0) + delta;
      if (this.shieldSkillTimer >= this.skillEffects.shieldInterval && !this.playerInvuln) {
        this.shieldSkillTimer = 0;
        this.playerInvuln = true;
        shieldActivateEffect(this, this.player.x, this.player.y);
        this.player.setTint(0x4488ff);
        this.time.delayedCall(2000, () => {
          this.playerInvuln = false;
          this.player.clearTint();
        });
      }
    }

    // Enemy AI
    this.enemies.getChildren().forEach((enemy) => this.enemyAI(enemy, delta));

    // Clean up bullets: off-screen or expired (3 second lifetime)
    const now = this.time.now;
    this.bullets.getChildren().forEach((b) => {
      if (!b.active) return;
      const age = now - (b.getData('spawnTime') || 0);
      const { width: sw, height: sh } = this.scale;
      const maxAge = b.getData('lifetime') || 3000;
      if (age > maxAge || b.y < -20 || b.y > sh + 20 || b.x < -20 || b.x > sw + 20) {
        b.setActive(false).setVisible(false);
        b.body.enable = false;
      }
    });

    // Update HUD
    this.updateHUD();
  }

  updateHUD() {
    const { width } = this.scale;

    // Hearts display
    const fullHearts = Math.floor(this.playerHp / this.heartSize);
    const partialHp = this.playerHp % this.heartSize;
    const hasHalf = partialHp >= this.heartSize * 0.25;
    let hearts = '';
    for (let i = 0; i < this.maxHearts; i++) {
      if (i < fullHearts) hearts += '\u2764\uFE0F'; // red heart
      else if (i === fullHearts && hasHalf) hearts += '\uD83E\uDE76'; // half heart or orange
      else hearts += '\uD83D\uDDA4'; // black heart (empty)
    }
    this.heartsText.setText(hearts);

    const aliveEnemies = this.enemies.getChildren().filter((e) => e.active).length;
    this.waveText.setText(
      this.arenaCleared
        ? 'A' + (this.arenaIndex + 1) + ' CLEARED!'
        : `A${this.arenaIndex + 1} W${this.currentWave}/${this.arenaConfig.totalWaves} E:${aliveEnemies}`
    );

    // Crate progress
    this.crateText.setText(`Crates: ${this.cratesCollected}/${this.cratesTotal}`);

    // Timer countdown
    if (!this.arenaCleared) {
      const elapsed = (this.time.now - this.arenaStartTime) / 1000;
      const remaining = Math.max(0, this.arenaConfig.portalTimerSeconds - elapsed);
      this.timerText.setText(`${Math.ceil(remaining)}s`);
      if (remaining < 10) {
        this.timerText.setColor('#ff6644');
      }
    } else {
      this.timerText.setText('');
    }

    this.lootText.setText(`Credits: ${this.runCredits}  Scrap: ${this.runScrap}`);

    // Ammo display
    const ammo = AMMO_TYPES[this.currentAmmoType];
    const stock = ammo.infinite ? '∞' : (this.ammoStock[this.currentAmmoType] || 0);
    const colorMap = { basic: '#ffff44', plasma: '#44ddff', explosive: '#ff6622', piercing: '#cc44ff' };
    this.ammoText.setText(`[${ammo.name}: ${stock}] TAP`);
    this.ammoText.setColor(colorMap[this.currentAmmoType] || '#ffffff');

    // Special charge bar
    this.specialBar.width = 80 * (this.specialCharge / 100);
    this.specialBar.fillColor = this.specialCharge >= 100 ? 0x44ff44 : 0xffaa00;
    const specColor = this.specialCharge >= 100 ? '#44ff44' : '#444444';
    this.specialBtn.setColor(specColor);

    // Shield sprite follows player
    if (this.shieldSprite && this.shieldSprite.active) {
      this.shieldSprite.setPosition(this.player.x, this.player.y);
    }

    // Portal arrow - show when portal is active and off-screen
    this.updatePortalArrow();
  }

  updatePortalArrow() {
    if (!this.portal || !this.portal.visible) {
      this.portalArrow.setVisible(false);
      return;
    }

    const cam = this.cameras.main;
    const px = this.portal.x;
    const py = this.portal.y;
    const camL = cam.scrollX;
    const camT = cam.scrollY;
    const camR = camL + cam.width;
    const camB = camT + cam.height;
    const margin = 30;

    // Check if portal is on screen
    if (px >= camL + margin && px <= camR - margin && py >= camT + margin && py <= camB - margin) {
      this.portalArrow.setVisible(false);
      return;
    }

    // Show arrow at screen edge pointing to portal
    this.portalArrow.setVisible(true);
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    const angle = Math.atan2(py - (camT + cy), px - (camL + cx));

    // Clamp to screen edges
    const edgeMargin = 25;
    const ax = Math.max(edgeMargin, Math.min(cam.width - edgeMargin, cx + Math.cos(angle) * (cx - edgeMargin)));
    const ay = Math.max(edgeMargin, Math.min(cam.height - edgeMargin, cy + Math.sin(angle) * (cy - edgeMargin)));

    this.portalArrow.setPosition(ax, ay);
    this.portalArrow.setRotation(angle + Math.PI / 2);
    this.portalArrow.setAlpha(0.5 + Math.sin(this.time.now * 0.005) * 0.3);
  }
}
