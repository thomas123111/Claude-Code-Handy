import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { BREEDS } from '../data/PetData.js';
import { THEME, drawHeader, drawButton, drawCard, drawBackButton } from '../ui/Theme.js';

const VISIT_DURATION_MS = 10 * 60 * 1000; // 10 minutes

const VISITOR_NAMES = ['Anna', 'Thomas', 'Sarah', 'Michael', 'Lisa', 'Peter', 'Julia', 'Stefan', 'Maria', 'Andreas'];

const PET_TYPES = ['Hund', 'Katze', 'Kleintier'];

const INVITE_COST = 5;

const CAPACITY_UPGRADES = [
  { from: 3, cost: 50 },
  { from: 4, cost: 100 },
  { from: 5, cost: 200 },
  { from: 6, cost: 400 },
  { from: 7, cost: 800 },
];

function getUpgradeCost(currentCapacity) {
  const entry = CAPACITY_UPGRADES.find(u => u.from === currentCapacity);
  return entry ? entry.cost : null;
}

function calculateReward(guest, shelterPets) {
  let base = 15 + Math.floor(Math.random() * 26); // 15-40
  // Bonus if interacting pet is groomed or trained
  if (guest.interactingPetId && shelterPets) {
    const pet = shelterPets.find(p => p.id === guest.interactingPetId);
    if (pet) {
      if (pet.groomed) base += 5;
      if (pet.trained) base += 5;
    }
  }
  return base;
}

function assignInteractingPet(shelterPets) {
  if (!shelterPets || shelterPets.length === 0) return null;
  return shelterPets[Math.floor(Math.random() * shelterPets.length)].id;
}

export class CafeScene extends Phaser.Scene {
  constructor() { super('Cafe'); }

  create() {
    this.save = loadSave();
    // Initialize cafe data if missing
    if (!this.save.cafe) {
      this.save.cafe = { capacity: 3, guests: [] };
      writeSave(this.save);
    }
    this.message = null;

    // Timer to refresh countdowns
    this.refreshTimer = this.time.addEvent({
      delay: 1000,
      callback: () => this.drawUI(),
      loop: true,
    });

    this.drawUI();
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];

    const { width, height } = this.scale;
    const cx = width / 2;
    const save = this.save;
    const cafe = save.cafe;

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    // Header
    drawHeader(this, '☕ Tier-Café', save);

    // Subtitle
    this.add.text(cx, 70, 'Besucher interagieren mit deinen Tieren!', {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Status message
    if (this.message) {
      this.add.text(cx, 90, this.message, {
        fontSize: '15px', fontFamily: 'monospace', color: THEME.text.warning, fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    let y = 110;

    // Active visitors
    cafe.guests.forEach((guest, idx) => {
      const cardH = 70;
      const elapsed = Date.now() - guest.arrivedAt;
      const remaining = Math.max(0, VISIT_DURATION_MS - elapsed);
      const done = remaining <= 0;

      const borderCol = done ? 0xaa8844 : THEME.bg.cardBorder;
      drawCard(this, cx, y + cardH / 2, width - 20, cardH, { borderColor: borderCol });

      // Visitor info
      this.add.text(25, y + 8, '👤', { fontSize: '26px' });
      this.add.text(60, y + 8, guest.name, {
        fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
      });
      this.add.text(60, y + 26, `Liebt: ${guest.favPetType}`, {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
      });

      // Show interacting pet
      if (guest.interactingPetId) {
        const pet = save.pets.find(p => p.id === guest.interactingPetId);
        if (pet) {
          this.add.text(60, y + 40, `Spielt mit ${pet.emoji} ${pet.name}`, {
            fontSize: '13px', fontFamily: 'monospace', color: THEME.text.success,
          });
        }
      }

      if (done) {
        // Collect button
        const btnX = width - 80;
        const btnY = y + cardH / 2;

        drawButton(this, btnX, btnY, 120, 30, `Sammeln +${guest.reward}❤️`, {
          type: 'primary',
          fontSize: '14px',
        });
        this.addHitArea(btnX, btnY, 120, 30, () => this.collectVisitor(idx));
      } else {
        // Countdown
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        this.add.text(width - 25, y + cardH / 2, `⏰ ${timeStr}`, {
          fontSize: '16px', fontFamily: 'monospace', color: THEME.text.warning,
        }).setOrigin(1, 0.5);
      }

      y += cardH + 6;
    });

    // Invite visitor button
    if (cafe.guests.length < cafe.capacity) {
      const canAfford = save.hearts >= INVITE_COST;
      const btnY = y + 20;

      drawButton(this, cx, btnY, 280, 36, `👤 Besucher einladen (${INVITE_COST}❤️)`, {
        type: 'primary',
        disabled: !canAfford,
        fontSize: '16px',
      });

      if (canAfford) {
        this.addHitArea(cx, btnY, 280, 36, () => this.inviteVisitor());
      }
      y = btnY + 30;
    } else if (cafe.guests.length > 0) {
      y += 10;
    }

    // Upgrade capacity button
    const upgradeCost = getUpgradeCost(cafe.capacity);
    if (upgradeCost !== null) {
      const canUpgrade = save.hearts >= upgradeCost;
      const upY = y + 20;

      drawButton(this, cx, upY, 280, 36, `⬆️ Kapazität +1 (${upgradeCost}❤️)`, {
        type: 'secondary',
        disabled: !canUpgrade,
        fontSize: '16px',
      });

      if (canUpgrade) {
        this.addHitArea(cx, upY, 280, 36, () => this.upgradeCapacity());
      }
    } else {
      const upY = y + 20;
      this.add.text(cx, upY, 'Max. Kapazität erreicht! (8 Plätze)', {
        fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
      }).setOrigin(0.5);
    }

    // Back button
    drawButton(this, cx, height - 40, 280, 50, '← Zurück', { type: 'secondary' });
    this.addHitArea(cx, height - 40, 280, 50, () => {
      if (this.refreshTimer) this.refreshTimer.remove();
      this.scene.start('Town');
    });

    // Touch handler
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

  inviteVisitor() {
    const cafe = this.save.cafe;
    if (cafe.guests.length >= cafe.capacity) return;
    if (this.save.hearts < INVITE_COST) return;

    this.save.hearts -= INVITE_COST;

    const name = VISITOR_NAMES[Math.floor(Math.random() * VISITOR_NAMES.length)];
    const favPetType = PET_TYPES[Math.floor(Math.random() * PET_TYPES.length)];
    const interactingPetId = assignInteractingPet(this.save.pets);

    const guest = {
      name,
      favPetType,
      arrivedAt: Date.now(),
      reward: calculateReward({ interactingPetId }, this.save.pets),
      interactingPetId,
    };

    // Boost happiness of interacting pet
    if (interactingPetId) {
      const pet = this.save.pets.find(p => p.id === interactingPetId);
      if (pet) {
        pet.happiness = Math.min(100, (pet.happiness || 50) + 5);
      }
    }

    cafe.guests.push(guest);
    this.message = `${name} besucht das Café!`;
    writeSave(this.save);
    this.drawUI();
  }

  collectVisitor(guestIdx) {
    const cafe = this.save.cafe;
    const guest = cafe.guests[guestIdx];
    if (!guest) return;

    const elapsed = Date.now() - guest.arrivedAt;
    if (elapsed < VISIT_DURATION_MS) return;

    this.save.hearts += guest.reward;
    addXp(this.save, 10);

    // Boost happiness of interacting pet on collection too
    if (guest.interactingPetId) {
      const pet = this.save.pets.find(p => p.id === guest.interactingPetId);
      if (pet) {
        pet.happiness = Math.min(100, (pet.happiness || 50) + 5);
      }
    }

    this.message = `${guest.name} verabschiedet sich! +${guest.reward}❤️`;
    cafe.guests.splice(guestIdx, 1);
    writeSave(this.save);
    this.drawUI();
  }

  upgradeCapacity() {
    const cafe = this.save.cafe;
    const upgradeCost = getUpgradeCost(cafe.capacity);
    if (upgradeCost === null) return;
    if (this.save.hearts < upgradeCost) return;

    this.save.hearts -= upgradeCost;
    cafe.capacity++;
    addXp(this.save, 20);
    this.message = `Kapazität auf ${cafe.capacity} erhöht!`;
    writeSave(this.save);
    this.drawUI();
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
