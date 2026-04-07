import Phaser from 'phaser';
import { loadSave, writeSave, regenerateEnergy, addXp } from '../data/SaveManager.js';
import { BOARD_COLS, BOARD_ROWS, getItem, getMergeResult, createInitialBoard, randomItem, findEmptyCell, countItems } from '../data/MergeData.js';
import { generatePet } from '../data/PetData.js';

const CELL_SIZE = 68;
const BOARD_OFFSET_X = 32;
const BOARD_OFFSET_Y = 110;

export class MergeBoardScene extends Phaser.Scene {
  constructor() { super('MergeBoard'); }

  create() {
    this.save = loadSave();
    regenerateEnergy(this.save);
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#1e1828');

    // Header
    this.add.text(width / 2, 20, '🧩 Merge Board', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#cc99ff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Stats
    this.heartsText = this.add.text(15, 48, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ff6688',
    });
    this.energyText = this.add.text(150, 48, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffcc00',
    });
    this.add.text(width - 15, 48, 'Lv.' + this.save.level, {
      fontSize: '13px', fontFamily: 'monospace', color: '#88ccff',
    }).setOrigin(1, 0);

    // Info text + active tasks from pets
    this.infoText = this.add.text(width / 2, 75, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#887799',
    }).setOrigin(0.5);
    this.updateTasksInfo();

    // Combo counter
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboText = this.add.text(width - 15, 75, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffaa00', fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    // Initialize board
    if (!this.save.mergeBoard) {
      this.save.mergeBoard = createInitialBoard();
    }
    this.board = this.save.mergeBoard;

    // Draw board
    this.cellSprites = [];
    this.itemTexts = [];
    this.drawBoard();

    // Drag state
    this.selectedCell = null;
    this.selectedHighlight = this.add.rectangle(0, 0, CELL_SIZE - 4, CELL_SIZE - 4)
      .setStrokeStyle(3, 0xffcc00).setFillStyle(0xffcc00, 0.15).setVisible(false).setDepth(10);

    // Spawn button
    this.add.rectangle(width / 2, height - 120, 200, 44, 0x664488, 0.4)
      .setStrokeStyle(2, 0x8866aa);
    this.add.text(width / 2, height - 120, '✨ Neues Item (1⚡)', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ccaaff',
    }).setOrigin(0.5);

    // Back button
    this.add.text(width / 2, height - 60, '← Zurück', {
      fontSize: '14px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5);

    // Touch handler
    this.input.on('pointerdown', (pointer) => {
      const { r, c } = this.pointerToCell(pointer.x, pointer.y);

      // Spawn button
      if (pointer.y >= height - 145 && pointer.y <= height - 95 &&
          pointer.x >= width / 2 - 100 && pointer.x <= width / 2 + 100) {
        this.spawnItem();
        return;
      }

      // Back button
      if (pointer.y >= height - 80 && pointer.y <= height - 40) {
        this.saveAndExit();
        return;
      }

      if (r < 0 || r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS) return;

      if (this.selectedCell === null) {
        // Select cell
        if (this.board[r][c] !== null) {
          this.selectedCell = { r, c };
          const { x, y } = this.cellToScreen(r, c);
          this.selectedHighlight.setPosition(x, y).setVisible(true);
        }
      } else {
        // Try to merge or swap
        const src = this.selectedCell;
        this.selectedCell = null;
        this.selectedHighlight.setVisible(false);

        if (src.r === r && src.c === c) return; // deselect

        const srcItem = this.board[src.r][src.c];
        const dstItem = this.board[r][c];

        if (dstItem === null) {
          // Move to empty cell
          this.board[r][c] = srcItem;
          this.board[src.r][src.c] = null;
          this.drawBoard();
        } else {
          // Try merge
          const result = getMergeResult(srcItem, dstItem);
          if (result) {
            this.board[r][c] = result.id;
            this.board[src.r][src.c] = null;
            this.onMerge(result, r, c);
            this.drawBoard();
          } else {
            // Swap
            this.board[r][c] = srcItem;
            this.board[src.r][src.c] = dstItem;
            this.drawBoard();
          }
        }
      }
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

  drawBoard() {
    // Clear old
    this.itemTexts.forEach((t) => t.destroy());
    this.itemTexts = [];

    if (this.cellSprites.length === 0) {
      // Draw grid cells once
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          const { x, y } = this.cellToScreen(r, c);
          const cell = this.add.rectangle(x, y, CELL_SIZE - 4, CELL_SIZE - 4, 0x2a2235, 0.8)
            .setStrokeStyle(1, 0x443355);
          this.cellSprites.push(cell);
        }
      }
    }

    // Draw items
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const itemId = this.board[r][c];
        if (itemId) {
          const item = getItem(itemId);
          if (item) {
            const { x, y } = this.cellToScreen(r, c);
            const text = this.add.text(x, y - 4, item.emoji, {
              fontSize: '28px',
            }).setOrigin(0.5).setDepth(5);
            this.itemTexts.push(text);

            // Level indicator
            const lvl = this.add.text(x + 20, y + 18, `${item.level}`, {
              fontSize: '10px', fontFamily: 'monospace', color: '#ffcc00',
            }).setOrigin(0.5).setDepth(6);
            this.itemTexts.push(lvl);
          }
        }
      }
    }
  }

  updateTasksInfo() {
    // Show what pets need
    const pets = this.save.pets || [];
    if (pets.length === 0) {
      this.infoText.setText('Merge max-level Items um Tiere zu bekommen!');
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
      this.infoText.setText(`Tiere brauchen: ${[...new Set(needs)].join(' ')}`);
    } else {
      this.infoText.setText(`${pets.length} glückliche Tiere im Heim! 🐾`);
    }
  }

  onMerge(result, r, c) {
    const { x, y } = this.cellToScreen(r, c);

    // Combo system
    this.comboCount++;
    this.comboTimer = 3; // seconds
    if (this.comboCount > 1) {
      this.comboText.setText(`${this.comboCount}x COMBO!`);
      this.tweens.add({
        targets: this.comboText,
        scale: { from: 1.3, to: 1 },
        duration: 200,
      });
    }

    // Sparkle + merge animation
    const sparkle = this.add.text(x, y, '✨', { fontSize: '36px' }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: sparkle,
      scale: { from: 0.3, to: 2 },
      alpha: { from: 1, to: 0 },
      rotation: Math.PI,
      y: y - 30,
      duration: 600,
      onComplete: () => sparkle.destroy(),
    });

    // Ring burst effect
    const ring = this.add.circle(x, y, 5, 0xffcc00, 0.6).setDepth(19);
    this.tweens.add({
      targets: ring,
      scale: { from: 1, to: 4 },
      alpha: { from: 0.6, to: 0 },
      duration: 400,
      onComplete: () => ring.destroy(),
    });

    // XP + hearts (combo multiplier!)
    const comboMult = Math.min(this.comboCount, 5); // max 5x
    const hearts = result.value * comboMult;
    this.save.hearts += hearts;
    addXp(this.save, result.value * 2 * comboMult);

    // Show reward with combo info
    const comboLabel = comboMult > 1 ? ` (${comboMult}x!)` : '';
    const reward = this.add.text(x, y - 20, `+${hearts}❤️${comboLabel}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#ff88aa', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: reward,
      y: y - 50, alpha: 0,
      duration: 800,
      onComplete: () => reward.destroy(),
    });

    // Max level items produce pets!
    if (result.value >= 50) {
      this.spawnPetReward();
    }

    // Charity: every merge contributes tiny amount
    this.save.totalDonatedKg += 0.01;

    this.updateStats();
    this.autosave();
  }

  spawnPetReward() {
    const pet = generatePet();
    this.save.pets.push(pet);

    const { width } = this.scale;
    const msg = this.add.text(width / 2, 180, `🎉 Neues Tier: ${pet.emoji} ${pet.name}!\n${pet.breed} (${pet.rarity})`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffcc44', fontStyle: 'bold', align: 'center',
      backgroundColor: '#2a2040', padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: msg,
      alpha: { from: 1, to: 0 },
      y: 150,
      duration: 3000,
      onComplete: () => msg.destroy(),
    });
  }

  spawnItem() {
    if (this.save.energy < 1) {
      this.showMessage('Keine Energie! Warte oder schau Werbung.');
      return;
    }

    const empty = findEmptyCell(this.board);
    if (!empty) {
      this.showMessage('Board voll! Merge Items um Platz zu schaffen.');
      return;
    }

    this.save.energy--;
    this.board[empty.r][empty.c] = randomItem();
    this.drawBoard();
    this.updateStats();
    this.autosave();
  }

  showMessage(text) {
    const { width } = this.scale;
    const msg = this.add.text(width / 2, 95, text, {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff8888',
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: msg, alpha: 0, duration: 2000,
      onComplete: () => msg.destroy(),
    });
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
    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= delta / 1000;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboText.setText('');
      }
    }
  }
}
