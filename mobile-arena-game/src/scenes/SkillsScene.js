import Phaser from 'phaser';
import { loadSave, writeSave } from '../systems/SaveSystem.js';
import { SKILLS, MAX_LOADOUT_SLOTS } from '../systems/SkillSystem.js';

export class SkillsScene extends Phaser.Scene {
  constructor() {
    super('Skills');
  }

  create() {
    this.save = loadSave();
    this.drawUI();
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];

    const { width, height } = this.scale;
    const cx = width / 2;
    const save = this.save;

    this.add.text(cx, 25, 'SKILLS', {
      fontSize: '24px', fontFamily: 'monospace', color: '#cc8800', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 50, `Credits: ${save.credits}  Scrap: ${save.scrap}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5);

    // Current loadout
    const loadout = save.loadout || [];
    const loadoutStr = loadout.length > 0
      ? loadout.map((id) => SKILLS[id] ? SKILLS[id].icon : '?').join('  ')
      : 'None equipped';
    this.add.text(cx, 72, `Loadout (${loadout.length}/${MAX_LOADOUT_SLOTS}): ${loadoutStr}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#44aa88',
    }).setOrigin(0.5);

    // Skill list
    let y = 100;
    const skillIds = Object.keys(SKILLS);

    skillIds.forEach((id) => {
      const skill = SKILLS[id];
      const level = save.skillLevels[id] || 0;
      const equipped = loadout.includes(id);
      const maxed = level >= skill.maxLevel;

      // Background
      const bgColor = equipped ? 0x334422 : 0x222233;
      this.add.rectangle(cx, y + 30, width - 20, 58, bgColor, 0.6)
        .setStrokeStyle(1, equipped ? 0x66aa44 : 0x333344);

      // Icon + Name
      this.add.text(15, y + 10, `${skill.icon} ${skill.name}`, {
        fontSize: '13px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
      });

      // Level
      const lvlStr = maxed ? `Lv.${level} MAX` : `Lv.${level}/${skill.maxLevel}`;
      this.add.text(15, y + 30, `${lvlStr} - ${skill.desc}`, {
        fontSize: '10px', fontFamily: 'monospace', color: '#999999',
      });

      // Level bar
      for (let i = 0; i < skill.maxLevel; i++) {
        const bx = 15 + i * 18;
        const col = i < level ? 0xffaa00 : 0x333344;
        this.add.rectangle(bx + 8, y + 48, 14, 6, col).setStrokeStyle(1, 0x555555);
      }

      // Upgrade button
      if (!maxed) {
        const cost = skill.costs[level];
        const scrapCost = skill.scrapCosts[level];
        const canAfford = save.credits >= cost && save.scrap >= scrapCost;
        const upgColor = canAfford ? '#ffaa00' : '#444444';

        this.add.text(width - 15, y + 14, `UP ${cost}cr ${scrapCost}sc`, {
          fontSize: '10px', fontFamily: 'monospace', color: upgColor,
        }).setOrigin(1, 0);

        if (canAfford) {
          this.addHitArea(width - 60, y + 18, 100, 22, () => {
            this.save.credits -= cost;
            this.save.scrap -= scrapCost;
            this.save.skillLevels[id] = level + 1;
            writeSave(this.save);
            this.drawUI();
          });
        }
      }

      // Equip/Unequip button
      if (level > 0) {
        const eqLabel = equipped ? 'REMOVE' : 'EQUIP';
        const eqColor = equipped ? '#ff6644' : '#44aa44';
        const canEquip = !equipped && loadout.length < MAX_LOADOUT_SLOTS;

        if (equipped || canEquip) {
          this.add.text(width - 15, y + 38, eqLabel, {
            fontSize: '10px', fontFamily: 'monospace', color: eqColor, fontStyle: 'bold',
          }).setOrigin(1, 0);

          this.addHitArea(width - 40, y + 42, 70, 20, () => {
            if (equipped) {
              this.save.loadout = this.save.loadout.filter((s) => s !== id);
            } else {
              this.save.loadout.push(id);
            }
            writeSave(this.save);
            this.drawUI();
          });
        }
      }

      y += 64;
    });

    // Back button
    this.add.text(cx, y + 20, '← BACK', {
      fontSize: '14px', fontFamily: 'monospace', color: '#888888', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.addHitArea(cx, y + 20, 120, 30, () => this.scene.start('Menu'));

    // Global touch handler
    this.input.on('pointerdown', (pointer) => {
      for (const h of this.hitAreas) {
        if (pointer.x >= h.x - h.w / 2 && pointer.x <= h.x + h.w / 2 &&
            pointer.y >= h.y - h.h / 2 && pointer.y <= h.y + h.h / 2) {
          h.cb();
          return;
        }
      }
    });
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
