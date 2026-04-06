import Phaser from 'phaser';
import { loadSave, getSelectedMech, getMechStats } from '../systems/SaveSystem.js';

// Simple maze generator using recursive backtracker
function generateMaze(cols, rows) {
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ top: true, right: true, bottom: true, left: true, visited: false }))
  );

  const stack = [];
  const start = { r: rows - 1, c: Math.floor(cols / 2) };
  grid[start.r][start.c].visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = [];
    const { r, c } = current;

    if (r > 0 && !grid[r - 1][c].visited) neighbors.push({ r: r - 1, c, dir: 'top' });
    if (r < rows - 1 && !grid[r + 1][c].visited) neighbors.push({ r: r + 1, c, dir: 'bottom' });
    if (c > 0 && !grid[r][c - 1].visited) neighbors.push({ r, c: c - 1, dir: 'left' });
    if (c < cols - 1 && !grid[r][c + 1].visited) neighbors.push({ r, c: c + 1, dir: 'right' });

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const next = Phaser.Utils.Array.GetRandom(neighbors);
      // Remove walls between current and next
      if (next.dir === 'top') { grid[r][c].top = false; grid[next.r][next.c].bottom = false; }
      if (next.dir === 'bottom') { grid[r][c].bottom = false; grid[next.r][next.c].top = false; }
      if (next.dir === 'left') { grid[r][c].left = false; grid[next.r][next.c].right = false; }
      if (next.dir === 'right') { grid[r][c].right = false; grid[next.r][next.c].left = false; }
      grid[next.r][next.c].visited = true;
      stack.push(next);
    }
  }

  return grid;
}

export class MazeArenaScene extends Phaser.Scene {
  constructor() {
    super('MazeArena');
  }

  init(data) {
    this.arenaIndex = data.arenaIndex || 0;
    this.runCredits = data.runCredits || 0;
    this.runScrap = data.runScrap || 0;
    this.runSeed = data.runSeed || 1;
    this.runXp = data.runXp || 0;
  }

  create() {
    const save = loadSave();
    const mechData = getSelectedMech(save);
    this.mechStats = getMechStats(mechData);
    this.mechId = mechData.id;

    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#080818');

    // Maze config
    this.mazeCols = 7;
    this.mazeRows = 12;
    this.cellW = Math.floor((width - 30) / this.mazeCols);
    this.cellH = Math.floor((height - 160) / this.mazeRows);
    this.mazeOffsetX = Math.floor((width - this.mazeCols * this.cellW) / 2);
    this.mazeOffsetY = 100;

    // Generate maze
    this.mazeGrid = generateMaze(this.mazeCols, this.mazeRows);

    // Wall physics group
    this.walls = this.physics.add.staticGroup();
    this.wallSprites = [];
    this.buildMazeWalls();

    // Walls start visible, then fade out after 3 seconds
    this.wallsVisible = true;
    this.add.text(width / 2, 20, 'INVISIBLE MAZE', {
      fontSize: '18px', fontFamily: 'monospace', color: '#4466aa', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    this.hintText = this.add.text(width / 2, 45, 'Memorize the walls... 3', {
      fontSize: '13px', fontFamily: 'monospace', color: '#8899bb',
    }).setOrigin(0.5).setDepth(100);

    // Countdown: show walls for 3 seconds
    this.wallRevealTime = 3000;
    this.wallTimer = 0;
    this.countdownDone = false;

    // Player at bottom center
    const startC = Math.floor(this.mazeCols / 2);
    const startR = this.mazeRows - 1;
    const px = this.mazeOffsetX + startC * this.cellW + this.cellW / 2;
    const py = this.mazeOffsetY + startR * this.cellH + this.cellH / 2;
    this.player = this.physics.add.image(px, py, `mech_${this.mechId}`);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setScale(1.2);
    this.player.body.setSize(16, 16);

    // Goal at top center
    const goalC = Math.floor(this.mazeCols / 2);
    const gx = this.mazeOffsetX + goalC * this.cellW + this.cellW / 2;
    const gy = this.mazeOffsetY + this.cellH / 2;
    this.goal = this.physics.add.image(gx, gy, 'maze_goal');
    this.goal.setDepth(9);
    this.tweens.add({
      targets: this.goal,
      scale: { from: 0.8, to: 1.2 },
      alpha: { from: 0.6, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Scatter some loot in the maze
    this.lootItems = this.physics.add.group();
    this.spawnMazeLoot();

    // Collisions
    this.physics.add.collider(this.player, this.walls, this.onHitWall, null, this);
    this.physics.add.overlap(this.player, this.goal, this.onReachGoal, null, this);
    this.physics.add.overlap(this.player, this.lootItems, this.onCollectLoot, null, this);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.joystickActive = false;
    this.joystickDir = { x: 0, y: 0 };
    this.setupTouchJoystick();

    // HUD
    this.lootText = this.add.text(10, 70, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffdd00',
    }).setDepth(100);

    this.arenaStartTime = this.time.now;
    this.transitioning = false;
  }

  buildMazeWalls() {
    const wallThickness = 4;

    for (let r = 0; r < this.mazeRows; r++) {
      for (let c = 0; c < this.mazeCols; c++) {
        const cell = this.mazeGrid[r][c];
        const x = this.mazeOffsetX + c * this.cellW;
        const y = this.mazeOffsetY + r * this.cellH;

        // Top wall
        if (cell.top) {
          const wall = this.walls.create(x + this.cellW / 2, y, 'maze_wall');
          wall.setDisplaySize(this.cellW, wallThickness);
          wall.body.setSize(this.cellW, wallThickness);
          wall.refreshBody();
          this.wallSprites.push(wall);
        }
        // Left wall
        if (cell.left) {
          const wall = this.walls.create(x, y + this.cellH / 2, 'maze_wall');
          wall.setDisplaySize(wallThickness, this.cellH);
          wall.body.setSize(wallThickness, this.cellH);
          wall.refreshBody();
          this.wallSprites.push(wall);
        }
        // Right wall (only rightmost column)
        if (c === this.mazeCols - 1 && cell.right) {
          const wall = this.walls.create(x + this.cellW, y + this.cellH / 2, 'maze_wall');
          wall.setDisplaySize(wallThickness, this.cellH);
          wall.body.setSize(wallThickness, this.cellH);
          wall.refreshBody();
          this.wallSprites.push(wall);
        }
        // Bottom wall (only bottom row)
        if (r === this.mazeRows - 1 && cell.bottom) {
          const wall = this.walls.create(x + this.cellW / 2, y + this.cellH, 'maze_wall');
          wall.setDisplaySize(this.cellW, wallThickness);
          wall.body.setSize(this.cellW, wallThickness);
          wall.refreshBody();
          this.wallSprites.push(wall);
        }
      }
    }
  }

  spawnMazeLoot() {
    const lootCount = 5 + Math.floor(this.arenaIndex * 0.5);
    for (let i = 0; i < lootCount; i++) {
      const c = Phaser.Math.Between(0, this.mazeCols - 1);
      const r = Phaser.Math.Between(0, this.mazeRows - 2); // not bottom row
      const x = this.mazeOffsetX + c * this.cellW + this.cellW / 2 + Phaser.Math.Between(-5, 5);
      const y = this.mazeOffsetY + r * this.cellH + this.cellH / 2 + Phaser.Math.Between(-5, 5);

      const isScrap = Math.random() < 0.3;
      const texture = isScrap ? 'loot_scrap' : 'loot_credit';
      const loot = this.physics.add.image(x, y, texture);
      loot.setData('type', isScrap ? 'scrap' : 'credit');
      loot.setData('value', isScrap ? Phaser.Math.Between(2, 5) : Phaser.Math.Between(5, 15));
      loot.setDepth(5);
      this.lootItems.add(loot);
    }
  }

  onHitWall() {
    // Just a small screen shake - no hints, memorize the layout!
    this.cameras.main.shake(50, 0.003);
  }

  onReachGoal(player, goal) {
    if (this.transitioning) return;
    this.transitioning = true;

    const elapsed = (this.time.now - this.arenaStartTime) / 1000;
    const timeBonus = elapsed < 30 ? Math.floor((30 - elapsed) * 3) : 0;
    const mazeBonus = 30 + this.arenaIndex * 10;

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('ArenaComplete', {
        arenaIndex: this.arenaIndex,
        runCredits: this.runCredits + mazeBonus + timeBonus,
        runScrap: this.runScrap + Math.floor(mazeBonus * 0.3),
        runXp: this.runXp + Math.floor(mazeBonus * 0.8),
        timeBonus,
        playerHpPercent: 1,
        runSeed: this.runSeed,
      });
    });
  }

  onCollectLoot(player, loot) {
    const type = loot.getData('type');
    const value = loot.getData('value');
    if (type === 'credit') this.runCredits += value;
    else if (type === 'scrap') this.runScrap += value;
    loot.destroy();
  }

  setupTouchJoystick() {
    const { height } = this.scale;
    this.joystickBase = this.add.image(100, height - 80, 'joystick_base')
      .setDepth(100).setAlpha(0);
    this.joystickThumb = this.add.image(100, height - 80, 'joystick_thumb')
      .setDepth(101).setAlpha(0);

    this.input.on('pointerdown', (pointer) => {
      if (pointer.y > this.scale.height * 0.5) {
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

    this.input.on('pointerup', () => {
      this.joystickActive = false;
      this.joystickDir.x = 0;
      this.joystickDir.y = 0;
      this.joystickBase.setAlpha(0);
      this.joystickThumb.setAlpha(0);
    });
  }

  update(time, delta) {
    if (!this.player || this.transitioning) return;

    // Countdown phase - walls visible
    if (!this.countdownDone) {
      this.wallTimer += delta;
      const remaining = Math.max(0, Math.ceil((this.wallRevealTime - this.wallTimer) / 1000));
      this.hintText.setText(`Memorize the walls... ${remaining}`);

      if (this.wallTimer >= this.wallRevealTime) {
        this.countdownDone = true;
        this.wallsVisible = false;
        this.hintText.setText('Find the exit at the top!');

        // Fade walls out
        this.tweens.add({
          targets: this.wallSprites,
          alpha: 0,
          duration: 500,
        });
      }
      // Don't allow movement during countdown
      this.player.body.velocity.x = 0;
      this.player.body.velocity.y = 0;
      return;
    }

    // Player movement
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;

    if (this.joystickActive) {
      vx = this.joystickDir.x;
      vy = this.joystickDir.y;
    }

    const len = Math.sqrt(vx * vx + vy * vy);
    if (len > 0) { vx /= len; vy /= len; }

    const speed = this.mechStats.speed * 0.7; // slower in maze
    this.player.body.velocity.x = vx * speed;
    this.player.body.velocity.y = vy * speed;

    if (len > 0.1) {
      const targetAngle = Math.atan2(vy, vx) + Math.PI / 2;
      this.player.rotation = Phaser.Math.Angle.RotateTo(this.player.rotation, targetAngle, 0.15);
    }

    this.lootText.setText(`Credits: ${this.runCredits}  Scrap: ${this.runScrap}`);
  }
}
