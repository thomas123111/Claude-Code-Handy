import Phaser from 'phaser';
import { loadSave, getSelectedMech, getMechStats } from '../systems/SaveSystem.js';
import { getArenaConfig } from '../systems/ArenaConfig.js';

export class ArenaScene extends Phaser.Scene {
  constructor() {
    super('Arena');
  }

  init(data) {
    this.arenaIndex = data.arenaIndex || 0;
    this.runCredits = data.runCredits || 0;
    this.runScrap = data.runScrap || 0;
    this.runXp = data.runXp || 0;
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

    // Groups
    this.bullets = this.physics.add.group({ maxSize: 50, classType: Phaser.Physics.Arcade.Image });
    this.enemyBullets = this.physics.add.group({ maxSize: 30, classType: Phaser.Physics.Arcade.Image });
    this.enemies = this.physics.add.group();
    this.lootItems = this.physics.add.group();

    // Player
    this.player = this.physics.add.image(width / 2, height - 100, `mech_${this.mechId}`);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setScale(1.5);
    this.player.body.setSize(20, 20);

    // Portal (hidden until arena cleared)
    this.portal = this.physics.add.image(width / 2, 80, 'portal');
    this.portal.setVisible(false);
    this.portal.setActive(false);
    this.portal.body.enable = false;

    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy, null, this);
    this.physics.add.overlap(this.enemyBullets, this.player, this.onEnemyBulletHitPlayer, null, this);
    this.physics.add.overlap(this.player, this.lootItems, this.onCollectLoot, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onEnemyTouchPlayer, null, this);
    this.physics.add.overlap(this.player, this.portal, this.onEnterPortal, null, this);

    // Input - keyboard
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Virtual joystick for touch
    this.joystickActive = false;
    this.joystickDir = { x: 0, y: 0 };
    this.setupTouchJoystick();

    // HUD
    this.createHUD();

    // Start first wave
    this.startWave();
  }

  setupTouchJoystick() {
    const { height } = this.scale;
    this.joystickBase = this.add.image(100, height - 120, 'joystick_base')
      .setDepth(100).setAlpha(0);
    this.joystickThumb = this.add.image(100, height - 120, 'joystick_thumb')
      .setDepth(101).setAlpha(0);

    this.input.on('pointerdown', (pointer) => {
      if (pointer.y > height * 0.4) {
        this.joystickActive = true;
        this.joystickBase.setPosition(pointer.x, pointer.y).setAlpha(1);
        this.joystickThumb.setPosition(pointer.x, pointer.y).setAlpha(1);
        this.joystickOrigin = { x: pointer.x, y: pointer.y };
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (this.joystickActive && this.joystickOrigin) {
        const dx = pointer.x - this.joystickOrigin.x;
        const dy = pointer.y - this.joystickOrigin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 50;
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const thumbX = this.joystickOrigin.x + Math.cos(angle) * clampedDist;
        const thumbY = this.joystickOrigin.y + Math.sin(angle) * clampedDist;
        this.joystickThumb.setPosition(thumbX, thumbY);

        if (dist > 10) {
          this.joystickDir.x = Math.cos(angle);
          this.joystickDir.y = Math.sin(angle);
        } else {
          this.joystickDir.x = 0;
          this.joystickDir.y = 0;
        }
      }
    });

    this.input.on('pointerup', () => {
      this.joystickActive = false;
      this.joystickDir.x = 0;
      this.joystickDir.y = 0;
      this.joystickBase.setAlpha(0);
      this.joystickThumb.setAlpha(0);
    });
  }

  createHUD() {
    const { width } = this.scale;

    // Arena name
    this.arenaLabel = this.add.text(width / 2, 12, `Arena ${this.arenaIndex + 1}: ${this.arenaConfig.name}`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    // HP bar background
    this.add.rectangle(width / 2, 35, width - 40, 14, 0x333333, 0.8).setDepth(100);
    this.hpBar = this.add.rectangle(20, 35, width - 40, 14, 0x44ff44, 0.9)
      .setOrigin(0, 0.5).setDepth(101);

    this.hpText = this.add.text(width / 2, 35, `${this.playerHp}/${this.maxHp}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5).setDepth(102);

    // Wave info
    this.waveText = this.add.text(width / 2, 55, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(100);

    // Run loot display
    this.lootText = this.add.text(10, 65, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffdd00',
    }).setDepth(100);
  }

  startWave() {
    this.currentWave++;
    if (this.currentWave > this.arenaConfig.totalWaves) {
      this.clearArena();
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

    // Spawn position - top or sides
    let x, y;
    const side = Math.random();
    if (side < 0.6) {
      x = Phaser.Math.Between(30, width - 30);
      y = -20;
    } else if (side < 0.8) {
      x = -20;
      y = Phaser.Math.Between(60, 300);
    } else {
      x = width + 20;
      y = Phaser.Math.Between(60, 300);
    }

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
    this.arenaCleared = true;

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

    // Time bonus calculation
    const elapsed = (this.time.now - this.arenaStartTime) / 1000;
    const parTime = this.arenaConfig.parTimeSeconds;
    this.timeBonus = elapsed < parTime ? Math.floor((parTime - elapsed) * 5) : 0;

    const { width, height } = this.scale;
    const portalText = this.add.text(width / 2, 120, 'ARENA CLEARED!\nEnter Portal →', {
      fontSize: '16px', fontFamily: 'monospace', color: '#cc88ff', align: 'center', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);

    if (this.timeBonus > 0) {
      this.add.text(width / 2, 160, `Speed Bonus: +${this.timeBonus} credits!`, {
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
    // Drop loot
    const x = enemy.x;
    const y = enemy.y;

    // Always drop credits
    this.spawnLoot(x, y, 'credit', Phaser.Math.Between(2, 5 + this.arenaIndex));

    // Sometimes drop scrap
    if (Math.random() < 0.3) {
      this.spawnLoot(x + Phaser.Math.Between(-15, 15), y + Phaser.Math.Between(-15, 15), 'scrap', Phaser.Math.Between(1, 3));
    }

    // Rare health drop
    if (Math.random() < 0.15) {
      this.spawnLoot(x + Phaser.Math.Between(-15, 15), y + Phaser.Math.Between(-15, 15), 'health', Math.floor(this.maxHp * 0.15));
    }

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

    // Check wave complete
    if (this.waveEnemiesLeft <= 0 && (!this.spawnTimer || !this.spawnTimer.getRemaining())) {
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

  autoFire() {
    if (this.time.now - this.lastFireTime < this.mechStats.fireRate) return;

    // Find nearest enemy
    let nearest = null;
    let nearestDist = Infinity;
    this.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = enemy;
      }
    });

    if (!nearest || nearestDist > 400) return;

    this.lastFireTime = this.time.now;
    const bullet = this.bullets.get(this.player.x, this.player.y - 10, 'bullet');
    if (!bullet) return;

    bullet.setActive(true).setVisible(true);
    bullet.body.enable = true;
    bullet.setDepth(8);

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearest.x, nearest.y);
    const speed = 450;
    bullet.body.velocity.x = Math.cos(angle) * speed;
    bullet.body.velocity.y = Math.sin(angle) * speed;

    // Destroy bullet after 2 seconds
    this.time.delayedCall(2000, () => {
      if (bullet.active) {
        bullet.setActive(false).setVisible(false);
        bullet.body.enable = false;
      }
    });
  }

  enemyAI(enemy, delta) {
    if (!enemy.active || !this.player.active) return;

    const speed = enemy.getData('speed');
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

    // Move toward player
    enemy.body.velocity.x = Math.cos(angle) * speed;
    enemy.body.velocity.y = Math.sin(angle) * speed;

    // Enemy shooting (only for basic/tank type at higher arenas)
    if (this.arenaIndex >= 2) {
      const timer = enemy.getData('shootTimer') + delta;
      enemy.setData('shootTimer', timer);
      if (timer >= enemy.getData('shootInterval')) {
        enemy.setData('shootTimer', 0);
        this.enemyShoot(enemy, angle);
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

    // Rotate player toward movement
    if (len > 0.1) {
      const targetAngle = Math.atan2(vy, vx) + Math.PI / 2;
      this.player.rotation = Phaser.Math.Angle.RotateTo(this.player.rotation, targetAngle, 0.15);
    }

    // Auto fire
    this.autoFire();

    // Enemy AI
    this.enemies.getChildren().forEach((enemy) => this.enemyAI(enemy, delta));

    // Clean up off-screen bullets
    this.bullets.getChildren().forEach((b) => {
      if (b.active && (b.y < -20 || b.y > 900 || b.x < -20 || b.x > 420)) {
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
    this.hpBar.width = (width - 40) * hpPercent;
    this.hpBar.fillColor = hpPercent > 0.5 ? 0x44ff44 : hpPercent > 0.25 ? 0xffaa00 : 0xff4444;
    this.hpText.setText(`${Math.ceil(this.playerHp)}/${this.maxHp}`);

    const aliveEnemies = this.enemies.getChildren().filter((e) => e.active).length;
    this.waveText.setText(
      this.arenaCleared
        ? 'CLEARED - Enter Portal!'
        : `Wave ${this.currentWave}/${this.arenaConfig.totalWaves} | Enemies: ${aliveEnemies}`
    );

    this.lootText.setText(`Credits: ${this.runCredits}  Scrap: ${this.runScrap}`);
  }
}
