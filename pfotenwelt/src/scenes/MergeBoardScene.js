import Phaser from 'phaser';
import { loadSave, writeSave, regenerateEnergy, addXp } from '../data/SaveManager.js';
import { BOARD_COLS, BOARD_ROWS, getItem, getMergeResult, createInitialBoard, randomItem, findEmptyCell } from '../data/MergeData.js';
import { generatePet } from '../data/PetData.js';

const CELL_SIZE = 68;
const BOARD_OFFSET_X = 32;
const BOARD_OFFSET_Y = 120;

export class MergeBoardScene extends Phaser.Scene {
  constructor() { super('MergeBoard'); }

  create() {
    this.save = loadSave();
    regenerateEnergy(this.save);
    const { width, height } = this.scale;

    // Pretty gradient background
    this.cameras.main.setBackgroundColor('#1e1828');
    // Decorative top bar
    this.add.rectangle(width / 2, 0, width, 105, 0x2a2040, 0.9).setOrigin(0.5, 0);

    // Header with icon
    this.add.text(width / 2, 22, '🧩 Merge Board', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#cc99ff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Stats bar
    this.heartsText = this.add.text(15, 52, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ff6688',
    });
    this.energyText = this.add.text(160, 52, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffcc00',
    });
    this.add.text(width - 15, 52, `Lv.${this.save.level}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#88ccff',
    }).setOrigin(1, 0);

    // Pet needs info
    this.infoText = this.add.text(width / 2, 82, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#887799',
    }).setOrigin(0.5);
    this.updateTasksInfo();

    // Combo display
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboText = this.add.text(width / 2, 100, '', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffaa00', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Initialize board
    if (!this.save.mergeBoard) {
      this.save.mergeBoard = createInitialBoard();
    }
    this.board = this.save.mergeBoard;

    // Board background panel
    const boardW = BOARD_COLS * CELL_SIZE + 8;
    const boardH = BOARD_ROWS * CELL_SIZE + 8;
    this.add.rectangle(BOARD_OFFSET_X + boardW / 2 - 4, BOARD_OFFSET_Y + boardH / 2 - 4,
      boardW, boardH, 0x1a1424, 0.9).setStrokeStyle(2, 0x3a2a4a);

    // Cell backgrounds
    this.cellBgs = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const { x, y } = this.cellToScreen(r, c);
        const shade = (r + c) % 2 === 0 ? 0x2a2235 : 0x252030;
        const cell = this.add.rectangle(x, y, CELL_SIZE - 3, CELL_SIZE - 3, shade, 0.9)
          .setStrokeStyle(1, 0x3a2a4a);
        this.cellBgs.push(cell);
      }
    }

    // Item display layer
    this.itemSprites = [];

    // Drag state
    this.dragItem = null;
    this.dragSprite = null;
    this.dragSourceCell = null;
    this.selectedHighlight = this.add.rectangle(0, 0, CELL_SIZE - 2, CELL_SIZE - 2)
      .setStrokeStyle(3, 0xffcc00).setFillStyle(0xffcc00, 0.1).setVisible(false).setDepth(10);
    this.dropHighlight = this.add.rectangle(0, 0, CELL_SIZE - 2, CELL_SIZE - 2)
      .setStrokeStyle(2, 0x88ff88).setFillStyle(0x88ff88, 0.1).setVisible(false).setDepth(10);

    this.drawItems();

    // Bottom buttons
    const btnY = height - 110;
    this.add.rectangle(width / 2, btnY, 220, 46, 0x553388, 0.5)
      .setStrokeStyle(2, 0x7744aa);
    this.add.text(width / 2, btnY, '✨ Neues Item (1⚡)', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#ddbbff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 55, '← Zurück zum Menü', {
      fontSize: '13px', fontFamily: 'monospace', color: '#776688',
    }).setOrigin(0.5);

    // === DRAG & DROP INPUT ===
    this.input.on('pointerdown', (pointer) => {
      // Check buttons first
      if (pointer.y >= btnY - 23 && pointer.y <= btnY + 23 &&
          pointer.x >= width / 2 - 110 && pointer.x <= width / 2 + 110) {
        this.spawnItem();
        return;
      }
      if (pointer.y >= height - 75 && pointer.y <= height - 35) {
        this.saveAndExit();
        return;
      }

      // Start drag on board cell
      const { r, c } = this.pointerToCell(pointer.x, pointer.y);
      if (r < 0 || r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS) return;
      if (this.board[r][c] === null) return;

      this.dragSourceCell = { r, c };
      const item = getItem(this.board[r][c]);
      if (!item) return;

      // Highlight source
      const { x, y } = this.cellToScreen(r, c);
      this.selectedHighlight.setPosition(x, y).setVisible(true);

      // Create floating drag sprite
      this.dragSprite = this.add.text(pointer.x, pointer.y, item.emoji, {
        fontSize: '36px',
      }).setOrigin(0.5).setDepth(50).setAlpha(0.8);
      this.dragItem = this.board[r][c];
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.dragSprite) return;
      this.dragSprite.setPosition(pointer.x, pointer.y);

      // Show drop highlight
      const { r, c } = this.pointerToCell(pointer.x, pointer.y);
      if (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS &&
          !(r === this.dragSourceCell.r && c === this.dragSourceCell.c)) {
        const { x, y } = this.cellToScreen(r, c);
        const canMerge = this.board[r][c] && getMergeResult(this.dragItem, this.board[r][c]);
        this.dropHighlight.setPosition(x, y).setVisible(true);
        this.dropHighlight.setStrokeStyle(2, canMerge ? 0xffcc00 : 0x88ff88);
        this.dropHighlight.setFillStyle(canMerge ? 0xffcc00 : 0x88ff88, 0.15);
      } else {
        this.dropHighlight.setVisible(false);
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.dragSprite) return;

      this.dragSprite.destroy();
      this.dragSprite = null;
      this.selectedHighlight.setVisible(false);
      this.dropHighlight.setVisible(false);

      const src = this.dragSourceCell;
      if (!src) return;
      this.dragSourceCell = null;

      const { r, c } = this.pointerToCell(pointer.x, pointer.y);
      if (r < 0 || r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS) return;
      if (r === src.r && c === src.c) return; // dropped on self

      const srcItem = this.board[src.r][src.c];
      const dstItem = this.board[r][c];

      if (dstItem === null) {
        // Move to empty
        this.board[r][c] = srcItem;
        this.board[src.r][src.c] = null;
        this.animateMove(src, { r, c });
      } else {
        // Try merge
        const result = getMergeResult(srcItem, dstItem);
        if (result) {
          this.board[r][c] = result.id;
          this.board[src.r][src.c] = null;
          this.onMerge(result, r, c);
        } else {
          // Swap
          this.board[r][c] = srcItem;
          this.board[src.r][src.c] = dstItem;
        }
      }
      this.drawItems();
      this.autosave();
    });

    this.updateStats();
  }

  pointerToCell(px, py) {
    const c = Math.floor((px - BOARD_OFFSET_X) / CELL_SIZE);
    const r = Math.floor((py - BOARD_OFFSET_Y) / CELL_SIZE);
    return { r, c };
  }

  cellToScreen(r, c) {
    return {
      x: BOARD_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2,
      y: BOARD_OFFSET_Y + r * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  drawItems() {
    this.itemSprites.forEach((s) => s.destroy());
    this.itemSprites = [];

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const itemId = this.board[r][c];
        if (!itemId) continue;
        const item = getItem(itemId);
        if (!item) continue;

        const { x, y } = this.cellToScreen(r, c);

        // Item emoji
        const emoji = this.add.text(x, y - 5, item.emoji, {
          fontSize: '30px',
        }).setOrigin(0.5).setDepth(5);
        this.itemSprites.push(emoji);

        // Level badge
        const lvlColors = ['#888888', '#88ccff', '#88ff88', '#ffcc44', '#ff88cc'];
        const badge = this.add.text(x + 22, y + 20, `${item.level}`, {
          fontSize: '10px', fontFamily: 'monospace', color: lvlColors[item.level - 1] || '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(6);
        this.itemSprites.push(badge);

        // Glow for high-level items
        if (item.level >= 4) {
          const glow = this.add.circle(x, y, 24, 0xffcc00, 0.08).setDepth(4);
          this.itemSprites.push(glow);
        }
      }
    }
  }

  animateMove(from, to) {
    const { x: fx, y: fy } = this.cellToScreen(from.r, from.c);
    const { x: tx, y: ty } = this.cellToScreen(to.r, to.c);
    const ghost = this.add.circle(fx, fy, 8, 0xffffff, 0.3).setDepth(15);
    this.tweens.add({
      targets: ghost, x: tx, y: ty, alpha: 0, scale: 0.5,
      duration: 200, onComplete: () => ghost.destroy(),
    });
  }

  onMerge(result, r, c) {
    const { x, y } = this.cellToScreen(r, c);

    // Combo
    this.comboCount++;
    this.comboTimer = 3;
    if (this.comboCount > 1) {
      this.comboText.setText(`🔥 ${this.comboCount}x COMBO!`);
      this.tweens.add({
        targets: this.comboText, scale: { from: 1.4, to: 1 }, duration: 300,
      });
    }

    // Merge animation: sparkle burst
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const spark = this.add.circle(x, y, 4, 0xffcc00, 0.9).setDepth(20);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 35, y: y + Math.sin(angle) * 35,
        alpha: 0, scale: 0.3, duration: 400,
        onComplete: () => spark.destroy(),
      });
    }

    // Central flash
    const flash = this.add.circle(x, y, 8, 0xffffff, 0.7).setDepth(21);
    this.tweens.add({
      targets: flash, scale: { from: 1, to: 3 }, alpha: 0,
      duration: 300, onComplete: () => flash.destroy(),
    });

    // New item pop-in
    const popEmoji = this.add.text(x, y, result.emoji, { fontSize: '36px' })
      .setOrigin(0.5).setDepth(22).setScale(0.3);
    this.tweens.add({
      targets: popEmoji, scale: { from: 0.3, to: 1.2 }, duration: 200,
      yoyo: true, hold: 100,
      onComplete: () => popEmoji.destroy(),
    });

    // Rewards
    const comboMult = Math.min(this.comboCount, 5);
    const hearts = result.value * comboMult;
    this.save.hearts += hearts;
    addXp(this.save, result.value * 2 * comboMult);

    const comboLabel = comboMult > 1 ? ` ${comboMult}x!` : '';
    const reward = this.add.text(x, y - 25, `+${hearts}❤️${comboLabel}`, {
      fontSize: '15px', fontFamily: 'monospace', color: '#ff88aa', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: reward, y: y - 60, alpha: 0, duration: 1000,
      onComplete: () => reward.destroy(),
    });

    // Max level = new pet!
    if (result.value >= 50) this.spawnPetReward();

    this.save.totalDonatedKg += 0.01;
    this.updateStats();
  }

  spawnPetReward() {
    const pet = generatePet();
    this.save.pets.push(pet);
    const { width } = this.scale;

    // Celebration overlay
    const overlay = this.add.rectangle(width / 2, 480, width, 120, 0x2a1040, 0.95)
      .setDepth(40).setStrokeStyle(2, 0xffcc00);
    const title = this.add.text(width / 2, 445, '🎉 Neues Tier!', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ffcc44', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(41);
    const info = this.add.text(width / 2, 475, `${pet.emoji} ${pet.name} - ${pet.breed}`, {
      fontSize: '15px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5).setDepth(41);
    const rarity = this.add.text(width / 2, 500, pet.rarity.toUpperCase(), {
      fontSize: '12px', fontFamily: 'monospace', color: pet.rarity === 'legendary' ? '#ffaa00' : '#aa88ff',
    }).setOrigin(0.5).setDepth(41);

    // Auto dismiss
    this.time.delayedCall(3000, () => {
      [overlay, title, info, rarity].forEach((o) => {
        this.tweens.add({ targets: o, alpha: 0, duration: 500, onComplete: () => o.destroy() });
      });
    });
  }

  spawnItem() {
    if (this.save.energy < 1) {
      this.showMessage('Keine Energie! ⚡ Warte 1 Min pro Punkt.');
      return;
    }
    const empty = findEmptyCell(this.board);
    if (!empty) {
      this.showMessage('Board voll! Merge Items für Platz.');
      return;
    }

    this.save.energy--;
    const itemId = randomItem();
    this.board[empty.r][empty.c] = itemId;

    // Spawn animation
    const { x, y } = this.cellToScreen(empty.r, empty.c);
    const item = getItem(itemId);
    const spawn = this.add.text(x, y - 30, item ? item.emoji : '?', { fontSize: '30px' })
      .setOrigin(0.5).setDepth(15).setAlpha(0);
    this.tweens.add({
      targets: spawn, y, alpha: 1, duration: 300, ease: 'Bounce.Out',
      onComplete: () => { spawn.destroy(); this.drawItems(); },
    });

    this.updateStats();
    this.autosave();
  }

  showMessage(text) {
    const { width } = this.scale;
    const msg = this.add.text(width / 2, BOARD_OFFSET_Y - 15, text, {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff8888',
      backgroundColor: '#2a1020', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: msg, alpha: 0, duration: 2500, onComplete: () => msg.destroy() });
  }

  updateTasksInfo() {
    const pets = this.save.pets || [];
    if (pets.length === 0) {
      this.infoText.setText('Merge max-level Items → neue Tiere! 🐾');
      return;
    }
    const needs = [];
    pets.forEach((p) => {
      if (p.needs.hunger < 40) needs.push('🍖');
      if (p.needs.hygiene < 40) needs.push('🧼');
      if (p.needs.play < 40) needs.push('🧸');
      if (p.needs.health < 40) needs.push('💊');
    });
    if (needs.length > 0) {
      this.infoText.setText(`Deine Tiere brauchen: ${[...new Set(needs)].join(' ')}`);
    } else {
      this.infoText.setText(`${pets.length} glückliche Tiere im Heim! 🐾`);
    }
  }

  updateStats() {
    this.heartsText.setText(`❤️ ${this.save.hearts}`);
    this.energyText.setText(`⚡ ${this.save.energy}/${this.save.maxEnergy}`);
  }

  autosave() {
    this.save.mergeBoard = this.board;
    writeSave(this.save);
  }

  saveAndExit() {
    this.autosave();
    this.scene.start('Menu');
  }

  update(time, delta) {
    if (this.comboTimer > 0) {
      this.comboTimer -= delta / 1000;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboText.setText('');
      }
    }
  }
}
