import Phaser from 'phaser';
import { loadSave, writeSave, getSelectedMech, getMechStats, xpForLevel } from '../systems/SaveSystem.js';
import { EQUIPMENT_SHOP, MECH_UNLOCK_COSTS, AMMO_SHOP } from '../systems/ArenaConfig.js';

export class HangarScene extends Phaser.Scene {
  constructor() {
    super('Hangar');
  }

  create() {
    this.save = loadSave();
    this.selectedTab = 'mechs'; // 'mechs' | 'shop'
    this.drawUI();
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];
    const { width, height } = this.scale;
    const save = this.save;

    // Header
    this.add.text(width / 2, 30, 'HANGAR', {
      fontSize: '28px', fontFamily: 'monospace', color: '#44aa44', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 58, `Credits: ${save.credits}  |  Scrap: ${save.scrap}`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5);

    // Ammo stock display
    const ammo = save.ammo || {};
    this.add.text(width / 2, 72, `Plasma: ${ammo.plasma || 0}  Explosive: ${ammo.explosive || 0}  Piercing: ${ammo.piercing || 0}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5);

    // Tabs
    const tabY = 90;
    this.createTab(width * 0.17, tabY, 'MECHS', this.selectedTab === 'mechs', () => {
      this.selectedTab = 'mechs';
      this.drawUI();
    });
    this.createTab(width * 0.5, tabY, 'SHOP', this.selectedTab === 'shop', () => {
      this.selectedTab = 'shop';
      this.drawUI();
    });
    this.createTab(width * 0.83, tabY, 'AMMO', this.selectedTab === 'ammo', () => {
      this.selectedTab = 'ammo';
      this.drawUI();
    });

    if (this.selectedTab === 'mechs') {
      this.drawMechsTab(save);
    } else if (this.selectedTab === 'shop') {
      this.drawShopTab(save);
    } else {
      this.drawAmmoTab(save);
    }

    // Back button
    this.addHitArea(width / 2, height - 50, 100, 30, () => this.scene.start('Menu'));
    this.add.text(width / 2, height - 50, '← BACK', {
      fontSize: '13px', fontFamily: 'monospace', color: '#888888', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Global pointer handler for all hit areas
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

  drawMechsTab(save) {
    const { width } = this.scale;
    let y = 130;

    save.mechs.forEach((mech) => {
      const isSelected = mech.id === save.selectedMechId;
      const bgColor = isSelected ? 0x334466 : 0x222233;
      const borderColor = isSelected ? 0x3399ff : 0x444455;

      this.add.rectangle(width / 2, y + 55, width - 30, 100, bgColor, 0.6)
        .setStrokeStyle(2, borderColor);

      // Mech sprite
      this.add.image(40, y + 55, `mech_${mech.id}`).setScale(2);

      // Name & level
      const nameColor = mech.unlocked ? '#ffffff' : '#666666';
      this.add.text(70, y + 25, `${mech.name}`, {
        fontSize: '16px', fontFamily: 'monospace', color: nameColor, fontStyle: 'bold',
      });

      if (mech.unlocked) {
        const stats = getMechStats(mech);
        const xpNeeded = xpForLevel(mech.level);
        this.add.text(70, y + 45, `Lv.${mech.level}  XP: ${mech.xp}/${xpNeeded}`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#aaaaaa',
        });
        this.add.text(70, y + 62, `HP:${stats.hp} DMG:${stats.damage} SPD:${stats.speed}`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#88aacc',
        });

        // Equipment display
        const eqParts = [];
        if (mech.equipment.weapon) eqParts.push(`W:${mech.equipment.weapon.name}`);
        if (mech.equipment.armor) eqParts.push(`A:${mech.equipment.armor.name}`);
        if (mech.equipment.engine) eqParts.push(`E:${mech.equipment.engine.name}`);
        if (eqParts.length > 0) {
          this.add.text(70, y + 79, eqParts.join(' | '), {
            fontSize: '9px', fontFamily: 'monospace', color: '#66aa88',
          });
        }

        if (!isSelected) {
          this.createSmallButton(width - 60, y + 55, 'SELECT', '#3399ff', () => {
            this.save.selectedMechId = mech.id;
            writeSave(this.save);
            this.drawUI();
          });
        }
      } else {
        const cost = MECH_UNLOCK_COSTS[mech.id];
        this.add.text(70, y + 48, `LOCKED - ${cost.credits}cr / ${cost.scrap}sc`, {
          fontSize: '12px', fontFamily: 'monospace', color: '#886644',
        });

        const canAfford = save.credits >= cost.credits && save.scrap >= cost.scrap;
        if (canAfford) {
          this.createSmallButton(width - 60, y + 55, 'UNLOCK', '#ffaa00', () => {
            this.save.credits -= cost.credits;
            this.save.scrap -= cost.scrap;
            mech.unlocked = true;
            writeSave(this.save);
            this.drawUI();
          });
        }
      }

      y += 115;
    });
  }

  drawShopTab(save) {
    const { width } = this.scale;
    const mech = getSelectedMech(save);

    this.add.text(width / 2, 130, `Equipping: ${mech.name}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5);

    let y = 160;
    const slotLabels = { weapon: 'WEAPONS', armor: 'ARMOR', engine: 'ENGINES' };

    ['weapon', 'armor', 'engine'].forEach((slot) => {
      this.add.text(20, y, slotLabels[slot], {
        fontSize: '13px', fontFamily: 'monospace', color: '#ffaa00', fontStyle: 'bold',
      });
      y += 22;

      const items = EQUIPMENT_SHOP.filter((e) => e.slot === slot);
      items.forEach((item) => {
        const equipped = mech.equipment[slot] && mech.equipment[slot].id === item.id;
        const owned = save.inventory.includes(item.id);
        const canAfford = save.credits >= item.cost && save.scrap >= item.costScrap;

        const bgColor = equipped ? 0x335533 : 0x222233;
        this.add.rectangle(width / 2, y + 16, width - 30, 32, bgColor, 0.5);

        const nameStr = `${item.name} (+${item.bonus})`;
        this.add.text(20, y + 6, nameStr, {
          fontSize: '12px', fontFamily: 'monospace', color: equipped ? '#44ff44' : '#cccccc',
        });

        if (equipped) {
          this.add.text(width - 20, y + 6, 'EQUIPPED', {
            fontSize: '10px', fontFamily: 'monospace', color: '#44ff44',
          }).setOrigin(1, 0);
        } else if (owned) {
          this.createSmallButton(width - 50, y + 16, 'EQUIP', '#44aa44', () => {
            mech.equipment[slot] = { id: item.id, name: item.name, bonus: item.bonus };
            writeSave(this.save);
            this.drawUI();
          });
        } else {
          const costStr = `${item.cost}cr ${item.costScrap}sc`;
          const col = canAfford ? '#ffaa00' : '#664422';
          const btn = this.add.text(width - 20, y + 6, costStr, {
            fontSize: '10px', fontFamily: 'monospace', color: col,
          }).setOrigin(1, 0);

          if (canAfford) {
            this.addHitArea(width - 50, y + 12, 80, 24, () => {
              this.save.credits -= item.cost;
              this.save.scrap -= item.costScrap;
              this.save.inventory.push(item.id);
              mech.equipment[slot] = { id: item.id, name: item.name, bonus: item.bonus };
              writeSave(this.save);
              this.drawUI();
            });
          }
        }

        y += 36;
      });

      y += 10;
    });
  }

  drawAmmoTab(save) {
    const { width } = this.scale;
    this.add.text(width / 2, 115, 'BUY AMMO', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ff8800', fontStyle: 'bold',
    }).setOrigin(0.5);

    let y = 140;
    AMMO_SHOP.forEach((item) => {
      const canAfford = save.credits >= item.cost && save.scrap >= item.costScrap;
      const bgColor = 0x222233;
      this.add.rectangle(width / 2, y + 14, width - 30, 28, bgColor, 0.5);

      const colorMap = { plasma: '#44ddff', explosive: '#ff6622', piercing: '#cc44ff' };
      this.add.text(20, y + 4, `${item.name} (x${item.amount})`, {
        fontSize: '11px', fontFamily: 'monospace', color: colorMap[item.id] || '#cccccc',
      });

      const costStr = `${item.cost}cr ${item.costScrap}sc`;
      const col = canAfford ? '#ffaa00' : '#664422';
      const btn = this.add.text(width - 20, y + 4, costStr, {
        fontSize: '10px', fontFamily: 'monospace', color: col,
      }).setOrigin(1, 0);

      if (canAfford) {
        this.addHitArea(width - 50, y + 10, 80, 24, () => {
          this.save.credits -= item.cost;
          this.save.scrap -= item.costScrap;
          if (!this.save.ammo) this.save.ammo = { plasma: 0, explosive: 0, piercing: 0 };
          this.save.ammo[item.id] = (this.save.ammo[item.id] || 0) + item.amount;
          writeSave(this.save);
          this.drawUI();
        });
      }

      y += 32;
    });

    // Current stock
    y += 10;
    const ammo = save.ammo || {};
    this.add.text(20, y, `Stock: Plasma ${ammo.plasma || 0} | Explosive ${ammo.explosive || 0} | Piercing ${ammo.piercing || 0}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa',
    });
  }

  createTab(x, y, text, active, callback) {
    const color = active ? '#ffffff' : '#666666';
    this.add.rectangle(x, y, 120, 30, active ? 0x334466 : 0x1a1a2a, 0.8)
      .setStrokeStyle(1, active ? 0x3399ff : 0x333344);
    this.add.text(x, y, text, {
      fontSize: '14px', fontFamily: 'monospace', color, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.addHitArea(x, y, 120, 30, callback);
  }

  createSmallButton(x, y, text, color, callback) {
    this.add.text(x, y, text, {
      fontSize: '13px', fontFamily: 'monospace', color, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.addHitArea(x, y, 80, 25, callback);
  }
}
