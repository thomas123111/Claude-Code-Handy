import Phaser from 'phaser';
import { loadSave, getSelectedMech, getMechStats } from '../systems/SaveSystem.js';
import { getArenaConfig } from '../systems/ArenaConfig.js';
import { generateArenaLayout, getRandomOpenPositions } from '../systems/ArenaLayoutGenerator.js';

export class ArenaScene extends Phaser.Scene {
  constructor() {
    super('Arena');
  }

  init(data) {
    this.arenaIndex = data.arenaIndex || 0;
    this.runCredits = data.runCredits || 0;
    this.runScrap = data.runScrap || 0;
    this.runXp = data.runXp || 0;
    this.runSeed = data.runSeed || 1;
  }

  create() {
    const save = loadSave();
    const mechData = getSelectedMech(save);
    this.mechStats = getMechStats(mechData);
    this.mechId = mechData.id;
    this.arenaConfig = getArenaConfig(this.arenaIndex);

    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor(this.arenaConfig.theme.bgColor);

    // Arena boundary visuals
    this.add.rectangle(width / 2, height / 2, width - 10, height - 10)
      .setStrokeStyle(2, this.arenaConfig.theme.color, 0.5)
      .setFillStyle(0x000000, 0);

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

    // Generate arena layout with walls
    const topMargin = 50; // compact HUD for landscape
    this.arenaLayout = generateArenaLayout(this.arenaIndex, width, height, topMargin, this.runSeed);
    this.arenaRng = this.seedRng(this.arenaIndex * 3571 + 13);

    // Build wall physics - each segment is a small block
    this.walls = this.physics.add.staticGroup();
    this.arenaLayout.walls.forEach((w) => {
      const wall = this.walls.create(w.x, w.y, 'arena_wall');
      wall.setDisplaySize(w.w, w.h);
      wall.setTint(this.arenaConfig.theme.color);
      wall.body.setSize(w.w, w.h);
      wall.refreshBody();
      wall.setDepth(3);
      wall.setAlpha(0.85);
    });

    // Player - starts at very bottom
    this.player = this.physics.add.image(width / 2, height - 40, `mech_${this.mechId}`);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setScale(1.5);
    this.player.body.setSize(20, 20);

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
    this.physics.add.overlap(this.player, this.enemies, this.onEnemyTouchPlayer, null, this);
    this.physics.add.overlap(this.player, this.portal, this.onEnterPortal, null, this);
    this.physics.add.overlap(this.player, this.crates, this.onCollectCrate, null, this);
    this.physics.add.overlap(this.bullets, this.ghostLootGroup, this.onShootGhostLoot, null, this);

    // Wall collisions - block player, enemies, and destroy bullets
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.bullets, this.walls, (bullet) => {
      bullet.setActive(false).setVisible(false);
      bullet.body.enable = false;
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

    // Split-screen touch controls:
    // Left half = movement joystick, Right half = shoot (fires in facing direction)
    this.joystickActive = false;
    this.joystickDir = { x: 0, y: 0 };
    this.shootHeld = false;
    this.playerFacingAngle = -Math.PI / 2; // facing up initially
    this.joystickPointerId = null;
    this.shootPointerId = null;
    this.setupDualControls();

    // Keyboard shoot: Space bar
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Unfreeze after 1 second
    const { width: w2 } = this.scale;
    const readyText = this.add.text(w2 / 2, height / 2, 'GET READY...', {
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
      if (Math.random() < 0.6) {
        this.spawnLoot(pos.x, pos.y, 'credit', Phaser.Math.Between(3, 8 + this.arenaIndex));
      } else {
        this.spawnLoot(pos.x, pos.y, 'scrap', Phaser.Math.Between(1, 4));
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
      ghost.setData('value', Phaser.Math.Between(8, 20 + this.arenaIndex * 3));
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
    this.runScrap += Math.floor(value * 0.3);
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
    const reward = 25 + this.arenaIndex * 10;
    const scrapReward = 10 + this.arenaIndex * 3;
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

  setupDualControls() {
    const { width, height } = this.scale;
    const halfW = width / 2;

    // Joystick visuals (right side = movement)
    this.joystickBase = this.add.image(width - 100, height - 120, 'joystick_base')
      .setDepth(100).setAlpha(0);
    this.joystickThumb = this.add.image(width - 100, height - 120, 'joystick_thumb')
      .setDepth(101).setAlpha(0);

    // Shoot indicator (left side = shoot)
    this.shootIndicator = this.add.circle(70, height - 120, 30, 0xff4444, 0)
      .setDepth(100);

    this.input.on('pointerdown', (pointer) => {
      if (pointer.x >= halfW) {
        // RIGHT HALF: Movement joystick
        this.joystickActive = true;
        this.joystickPointerId = pointer.id;
        this.joystickBase.setPosition(pointer.x, pointer.y).setAlpha(1);
        this.joystickThumb.setPosition(pointer.x, pointer.y).setAlpha(1);
        this.joystickOrigin = { x: pointer.x, y: pointer.y };
      } else {
        // LEFT HALF: Shoot in facing direction (hold to keep firing)
        this.shootHeld = true;
        this.shootPointerId = pointer.id;
        this.shootIndicator.setPosition(pointer.x, pointer.y).setAlpha(0.3);
      }
    });

    this.input.on('pointermove', (pointer) => {
      // Joystick movement
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

      // Move shoot indicator with finger
      if (this.shootHeld && pointer.id === this.shootPointerId) {
        this.shootIndicator.setPosition(pointer.x, pointer.y);
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
      if (pointer.id === this.shootPointerId) {
        this.shootHeld = false;
        this.shootPointerId = null;
        this.shootIndicator.setAlpha(0);
      }
    });
  }

  createHUD() {
    const { width } = this.scale;

    // Compact single-line HUD for landscape
    // Top bar: Arena name | HP bar | Wave | Timer
    this.arenaLabel = this.add.text(5, 4, `A${this.arenaIndex + 1}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setDepth(100);

    // HP bar
    const hpBarX = 40;
    const hpBarW = 180;
    this.add.rectangle(hpBarX + hpBarW / 2, 10, hpBarW, 10, 0x333333, 0.8).setDepth(100);
    this.hpBar = this.add.rectangle(hpBarX, 10, hpBarW, 10, 0x44ff44, 0.9)
      .setOrigin(0, 0.5).setDepth(101);
    this.hpText = this.add.text(hpBarX + hpBarW / 2, 10, `${this.playerHp}/${this.maxHp}`, {
      fontSize: '8px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5).setDepth(102);

    // Crate bar (second line)
    const crateBarW = 120;
    this.add.rectangle(5 + crateBarW / 2, 26, crateBarW, 8, 0x333333, 0.5).setDepth(100);
    this.crateBar = this.add.rectangle(5, 26, 0, 8, 0xffaa00, 0.8)
      .setOrigin(0, 0.5).setDepth(101);
    this.crateText = this.add.text(5 + crateBarW / 2, 26, '', {
      fontSize: '7px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5).setDepth(102);

    // Wave info (right of HP bar)
    this.waveText = this.add.text(240, 4, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setDepth(100);

    // Timer (top right)
    this.timerText = this.add.text(width - 5, 4, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(1, 0).setDepth(100);

    // Loot display (right of crate bar)
    this.lootText = this.add.text(140, 22, '', {
      fontSize: '9px', fontFamily: 'monospace', color: '#ffdd00',
    }).setDepth(100);
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

    // Random enemy type
    const roll = Math.random();
    let texture, hp, speed, damage, size;

    if (roll < 0.15 && this.arenaIndex > 1) {
      // Tank enemy
      texture = 'enemy_tank';
      hp = config.enemyHp * 2.5;
      speed = config.enemySpeed * 0.6;
      damage = config.enemyDamage * 1.5;
      size = 28;
    } else if (roll < 0.4) {
      // Fast enemy
      texture = 'enemy_fast';
      hp = config.enemyHp * 0.6;
      speed = config.enemySpeed * 1.8;
      damage = config.enemyDamage * 0.8;
      size = 20;
    } else {
      // Basic enemy
      texture = 'enemy_basic';
      hp = config.enemyHp;
      speed = config.enemySpeed;
      damage = config.enemyDamage;
      size = 20;
    }

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
    enemy.setTint(config.theme.enemyTint);
    enemy.body.setSize(size, size);
    enemy.setData('hp', hp);
    enemy.setData('maxHp', hp);
    enemy.setData('speed', speed);
    enemy.setData('damage', damage);
    enemy.setData('shootTimer', 0);
    enemy.setData('shootInterval', Phaser.Math.Between(1500, 3000));
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
      this.timeBonus = elapsed < parTime ? Math.floor((parTime - elapsed) * 5) : 0;
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

    this.add.text(width / 2, 132, 'Enter Portal →', {
      fontSize: '16px', fontFamily: 'monospace', color: '#cc88ff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);

    if (this.timeBonus > 0) {
      this.add.text(width / 2, 155, `Speed Bonus: +${this.timeBonus} credits!`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#ffdd00',
      }).setOrigin(0.5).setDepth(200);
    }
  }

  onBulletHitEnemy(bullet, enemy) {
    bullet.setActive(false).setVisible(false);
    bullet.body.enable = false;

    const hp = enemy.getData('hp') - this.mechStats.damage;
    enemy.setData('hp', hp);

    // Flash white
    enemy.setTint(0xffffff);
    this.time.delayedCall(60, () => {
      if (enemy.active) enemy.setTint(this.arenaConfig.theme.enemyTint);
    });

    if (hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  killEnemy(enemy) {
    const x = enemy.x;
    const y = enemy.y;

    // Enemies give XP only, no loot drops
    this.runXp += Phaser.Math.Between(5, 10 + this.arenaIndex * 2);

    // XP popup
    const xpMsg = this.add.text(x, y - 10, `+XP`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#aaffaa', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({
      targets: xpMsg,
      y: y - 30, alpha: 0,
      duration: 600,
      onComplete: () => xpMsg.destroy(),
    });

    // Death particles (simple flash)
    const flash = this.add.circle(x, y, 15, 0xffffff, 0.8).setDepth(50);
    this.tweens.add({
      targets: flash,
      scale: { from: 1, to: 3 },
      alpha: { from: 0.8, to: 0 },
      duration: 200,
      onComplete: () => flash.destroy(),
    });

    enemy.destroy();
    this.enemiesKilled++;
    this.waveEnemiesLeft--;

    // Check wave complete - all enemies in this wave killed and all spawned
    const allSpawned = !this.spawnTimer || this.spawnTimer.getRepeatCount() === 0;
    const allDead = this.enemies.getChildren().filter((e) => e.active).length === 0;
    if (allDead && allSpawned) {
      this.time.delayedCall(800, () => this.startWave());
    }
  }

  spawnLoot(x, y, type, value) {
    const textures = { credit: 'loot_credit', scrap: 'loot_scrap', health: 'loot_health' };
    const loot = this.physics.add.image(x, y, textures[type]);
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
    }

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

    this.playerHp -= amount;
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

    // Transition effect
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('ArenaComplete', {
        arenaIndex: this.arenaIndex,
        runCredits: this.runCredits + this.arenaConfig.creditsReward + (this.timeBonus || 0),
        runScrap: this.runScrap + this.arenaConfig.scrapReward,
        runXp: this.runXp + this.arenaConfig.xpReward,
        timeBonus: this.timeBonus || 0,
        playerHpPercent: this.playerHp / this.maxHp,
        runSeed: this.runSeed,
      });
    });
  }

  gameOver() {
    this.physics.pause();
    this.scene.start('GameOver', {
      arenaIndex: this.arenaIndex,
      runCredits: this.runCredits,
      runScrap: this.runScrap,
      runXp: this.runXp,
    });
  }

  fireInFacingDirection() {
    if (this.time.now - this.lastFireTime < this.mechStats.fireRate * 0.5) return;
    this.lastFireTime = this.time.now;

    const bullet = this.bullets.get(this.player.x, this.player.y, 'bullet');
    if (!bullet) return;

    bullet.setActive(true).setVisible(true);
    bullet.body.enable = true;
    bullet.setDepth(8);
    bullet.setData('spawnTime', this.time.now);

    // Shoot in the direction the player is facing
    const angle = this.playerFacingAngle;
    const speed = 450;
    bullet.body.velocity.x = Math.cos(angle) * speed;
    bullet.body.velocity.y = Math.sin(angle) * speed;
  }

  enemyAI(enemy, delta) {
    if (!enemy.active || !this.player.active) return;

    const speed = enemy.getData('speed');
    const directAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    let moveX = Math.cos(directAngle);
    let moveY = Math.sin(directAngle);

    // Wall avoidance: probe ahead and to the sides
    const probeLen = 40;
    const ex = enemy.x;
    const ey = enemy.y;

    const aheadX = ex + moveX * probeLen;
    const aheadY = ey + moveY * probeLen;

    if (this.isInWall(aheadX, aheadY)) {
      // Try perpendicular directions to find a way around
      const leftAngle = directAngle - Math.PI / 2;
      const rightAngle = directAngle + Math.PI / 2;

      const leftX = ex + Math.cos(leftAngle) * probeLen;
      const leftY = ey + Math.sin(leftAngle) * probeLen;
      const rightX = ex + Math.cos(rightAngle) * probeLen;
      const rightY = ey + Math.sin(rightAngle) * probeLen;

      const leftBlocked = this.isInWall(leftX, leftY);
      const rightBlocked = this.isInWall(rightX, rightY);

      if (!leftBlocked && !rightBlocked) {
        // Both open - pick whichever is closer to player
        const leftDist = Phaser.Math.Distance.Between(leftX, leftY, this.player.x, this.player.y);
        const rightDist = Phaser.Math.Distance.Between(rightX, rightY, this.player.x, this.player.y);
        const chosen = leftDist < rightDist ? leftAngle : rightAngle;
        moveX = Math.cos(chosen);
        moveY = Math.sin(chosen);
      } else if (!leftBlocked) {
        moveX = Math.cos(leftAngle);
        moveY = Math.sin(leftAngle);
      } else if (!rightBlocked) {
        moveX = Math.cos(rightAngle);
        moveY = Math.sin(rightAngle);
      } else {
        // All blocked - try diagonal escapes
        const diagAngle = directAngle + Math.PI * 0.75;
        moveX = Math.cos(diagAngle);
        moveY = Math.sin(diagAngle);
      }

      // Store wall-avoidance direction briefly so enemy doesn't jitter
      enemy.setData('avoidTimer', 300);
      enemy.setData('avoidX', moveX);
      enemy.setData('avoidY', moveY);
    } else {
      // Check if we're still in avoidance mode
      const avoidTimer = enemy.getData('avoidTimer') || 0;
      if (avoidTimer > 0) {
        enemy.setData('avoidTimer', avoidTimer - delta);
        moveX = enemy.getData('avoidX') || moveX;
        moveY = enemy.getData('avoidY') || moveY;
      }
    }

    enemy.body.velocity.x = moveX * speed;
    enemy.body.velocity.y = moveY * speed;

    // Enemy shooting - starts from arena 1
    if (this.arenaIndex >= 1) {
      const timer = enemy.getData('shootTimer') + delta;
      enemy.setData('shootTimer', timer);
      if (timer >= enemy.getData('shootInterval')) {
        enemy.setData('shootTimer', 0);
        this.enemyShoot(enemy, directAngle);
      }
    }
  }

  enemyShoot(enemy, angle) {
    const bullet = this.enemyBullets.get(enemy.x, enemy.y, 'enemy_bullet');
    if (!bullet) return;
    bullet.setActive(true).setVisible(true);
    bullet.body.enable = true;
    bullet.setDepth(8);

    const speed = 200;
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

    // Normalize and apply speed
    const len = Math.sqrt(vx * vx + vy * vy);
    if (len > 0) {
      vx /= len;
      vy /= len;
    }
    this.player.body.velocity.x = vx * this.mechStats.speed;
    this.player.body.velocity.y = vy * this.mechStats.speed;

    // Update facing angle based on movement direction
    if (len > 0.1) {
      this.playerFacingAngle = Math.atan2(vy, vx);
      this.player.rotation = this.playerFacingAngle + Math.PI / 2;
    }

    // Shoot: hold right side of screen OR press Space
    if (this.shootHeld || this.spaceKey.isDown) {
      this.fireInFacingDirection();
    }

    // Enemy AI
    this.enemies.getChildren().forEach((enemy) => this.enemyAI(enemy, delta));

    // Clean up bullets: off-screen or expired (3 second lifetime)
    const now = this.time.now;
    this.bullets.getChildren().forEach((b) => {
      if (!b.active) return;
      const age = now - (b.getData('spawnTime') || 0);
      const { width: sw, height: sh } = this.scale;
      if (age > 3000 || b.y < -20 || b.y > sh + 20 || b.x < -20 || b.x > sw + 20) {
        b.setActive(false).setVisible(false);
        b.body.enable = false;
      }
    });

    // Update HUD
    this.updateHUD();
  }

  updateHUD() {
    const { width } = this.scale;
    const hpPercent = Math.max(0, this.playerHp / this.maxHp);
    this.hpBar.width = 180 * hpPercent;
    this.hpBar.fillColor = hpPercent > 0.5 ? 0x44ff44 : hpPercent > 0.25 ? 0xffaa00 : 0xff4444;
    this.hpText.setText(`${Math.ceil(this.playerHp)}/${this.maxHp}`);

    const aliveEnemies = this.enemies.getChildren().filter((e) => e.active).length;
    this.waveText.setText(
      this.arenaCleared
        ? 'CLEARED - Enter Portal!'
        : `Wave ${this.currentWave}/${this.arenaConfig.totalWaves} | Enemies: ${aliveEnemies}`
    );

    // Crate progress
    const cratePercent = this.cratesTotal > 0 ? this.cratesCollected / this.cratesTotal : 0;
    this.crateBar.width = 120 * cratePercent;
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
  }
}
