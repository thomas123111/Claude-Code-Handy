import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { THEME, drawHeader, drawButton, drawCard } from '../ui/Theme.js';

const GUEST_STAY_MS = 30 * 60 * 1000; // 30 minutes

const GUEST_PETS = [
  { emoji: '🐱', name: 'Minka', rarity: 'common' },
  { emoji: '🐶', name: 'Rex', rarity: 'common' },
  { emoji: '🐰', name: 'Hopsi', rarity: 'common' },
  { emoji: '🐹', name: 'Krümel', rarity: 'common' },
  { emoji: '🐩', name: 'Fifi', rarity: 'rare' },
  { emoji: '🦮', name: 'Aron', rarity: 'rare' },
  { emoji: '🐈', name: 'Tigger', rarity: 'rare' },
  { emoji: '🐕‍🦺', name: 'Blitz', rarity: 'epic' },
  { emoji: '🦁', name: 'Simba', rarity: 'epic' },
  { emoji: '🐆', name: 'Nala', rarity: 'legendary' },
];

const RARITY_REWARD = {
  common: [20, 30],
  rare: [30, 40],
  epic: [35, 45],
  legendary: [40, 50],
};

const RARITY_COLORS = {
  common: '#aaaaaa',
  rare: '#4488ff',
  epic: '#aa44ff',
  legendary: '#ffaa00',
};

function getUpgradeCost(currentCapacity) {
  // 2->3: 100, 3->4: 200, 4->5: 400, etc.
  const step = currentCapacity - 2;
  return 100 * Math.pow(2, step);
}

export class HotelScene extends Phaser.Scene {
  constructor() { super('Hotel'); }

  create() {
    this.save = loadSave();
    // Initialize hotel data if missing
    if (!this.save.hotel) {
      this.save.hotel = { capacity: 2, guests: [] };
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
    const hotel = save.hotel;

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    // Header
    drawHeader(this, '🏨 Tierhotel', save);

    // Subtitle info
    this.add.text(cx, 70, `Kapazität: ${hotel.guests.length}/${hotel.capacity} · Beherberge Gäste und verdiene Herzen!`, {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Status message
    if (this.message) {
      this.add.text(cx, 90, this.message, {
        fontSize: '15px', fontFamily: 'monospace', color: THEME.text.warning, fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    let y = 110;

    // Active guests
    hotel.guests.forEach((guest, idx) => {
      const cardH = 60;
      const elapsed = Date.now() - guest.checkInTime;
      const remaining = Math.max(0, GUEST_STAY_MS - elapsed);
      const done = remaining <= 0;

      const borderColor = done ? 0x88aa44 : THEME.bg.cardBorder;
      drawCard(this, cx, y + cardH / 2, width - 20, cardH, { borderColor });

      // Guest info
      this.add.text(25, y + 8, guest.emoji, { fontSize: '28px' });
      this.add.text(60, y + 8, guest.name, {
        fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.dark, fontStyle: 'bold',
      });
      this.add.text(60, y + 26, guest.rarity, {
        fontSize: '13px', fontFamily: 'monospace', color: RARITY_COLORS[guest.rarity],
      });

      if (done) {
        // Collect button
        const reward = guest.reward;
        const btnX = width - 80;
        const btnY = y + cardH / 2;

        drawButton(this, btnX, btnY, 120, 30, `Abholen +${reward}❤️`, { fontSize: '14px' });
        this.addHitArea(btnX, btnY, 120, 30, () => this.collectGuest(idx));
      } else {
        // Countdown
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        this.add.text(width - 25, y + cardH / 2, `⏰ ${timeStr}`, {
          fontSize: '15px', fontFamily: 'monospace', color: THEME.text.warning,
        }).setOrigin(1, 0.5);
      }

      y += cardH + 6;
    });

    // Add guest button
    if (hotel.guests.length < hotel.capacity) {
      const btnY = y + 20;
      drawButton(this, cx, btnY, 250, 36, '🐾 Gast aufnehmen', { fontSize: '16px' });
      this.addHitArea(cx, btnY, 250, 36, () => this.addGuest());
      y = btnY + 30;
    } else if (hotel.guests.length > 0) {
      y += 10;
    }

    // Upgrade capacity button
    if (hotel.capacity < 10) {
      const upgradeCost = getUpgradeCost(hotel.capacity);
      const canUpgrade = save.hearts >= upgradeCost;
      const upY = y + 20;

      drawButton(this, cx, upY, 280, 36, `⬆️ Kapazität +1 (${upgradeCost}❤️)`, {
        fontSize: '15px',
        disabled: !canUpgrade,
      });

      if (canUpgrade) {
        this.addHitArea(cx, upY, 280, 36, () => this.upgradeCapacity());
      }
    } else {
      const upY = y + 20;
      this.add.text(cx, upY, 'Max. Kapazität erreicht!', {
        fontSize: '14px', fontFamily: 'monospace', color: THEME.text.warning,
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

  addGuest() {
    const hotel = this.save.hotel;
    if (hotel.guests.length >= hotel.capacity) return;

    const template = GUEST_PETS[Math.floor(Math.random() * GUEST_PETS.length)];
    const [minReward, maxReward] = RARITY_REWARD[template.rarity];
    const reward = minReward + Math.floor(Math.random() * (maxReward - minReward + 1));

    const guest = {
      emoji: template.emoji,
      name: template.name,
      rarity: template.rarity,
      reward,
      checkInTime: Date.now(),
    };

    hotel.guests.push(guest);
    this.message = `${guest.name} ${guest.emoji} ist eingecheckt!`;
    writeSave(this.save);
    this.drawUI();
  }

  collectGuest(guestIdx) {
    const hotel = this.save.hotel;
    const guest = hotel.guests[guestIdx];
    if (!guest) return;

    const elapsed = Date.now() - guest.checkInTime;
    if (elapsed < GUEST_STAY_MS) return;

    this.save.hearts += guest.reward;
    addXp(this.save, 15);
    this.message = `${guest.name} abgeholt! +${guest.reward}❤️`;
    hotel.guests.splice(guestIdx, 1);
    writeSave(this.save);
    this.drawUI();
  }

  upgradeCapacity() {
    const hotel = this.save.hotel;
    if (hotel.capacity >= 10) return;

    const cost = getUpgradeCost(hotel.capacity);
    if (this.save.hearts < cost) return;

    this.save.hearts -= cost;
    hotel.capacity++;
    addXp(this.save, 25);
    this.message = `Kapazität auf ${hotel.capacity} erhöht!`;
    writeSave(this.save);
    this.drawUI();
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
