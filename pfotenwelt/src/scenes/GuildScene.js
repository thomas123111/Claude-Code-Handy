import Phaser from 'phaser';
import { loadSave, writeSave } from '../data/SaveManager.js';
import { createDefaultGuild, generateNPCMember, processNPCHelp, addGuildXp } from '../data/GuildData.js';
import { THEME, drawHeader, drawButton, drawCard } from '../ui/Theme.js';

export class GuildScene extends Phaser.Scene {
  constructor() { super('Guild'); }

  create() {
    this.save = loadSave();
    if (!this.save.guild) {
      this.save.guild = createDefaultGuild();
      // Start with 2 NPC members
      this.save.guild.members.push(generateNPCMember());
      this.save.guild.members.push(generateNPCMember());
      writeSave(this.save);
    }

    // Process NPC help actions
    processNPCHelp(this.save);
    writeSave(this.save);

    this.drawUI();
  }

  drawUI() {
    this.children.removeAll();
    this.input.removeAllListeners();
    this.hitAreas = [];

    const { width, height } = this.scale;
    const cx = width / 2;
    const guild = this.save.guild;

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    // Custom header for guild (uses guild name from data)
    this.add.rectangle(cx, 0, width, 58, THEME.bg.header, 0.98).setOrigin(0.5, 0);
    this.add.rectangle(cx, 58, width, 2, THEME.bg.headerBorder).setOrigin(0.5, 0);
    this.add.text(cx, 29, `🤝 ${guild.name}`, {
      fontSize: '24px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle info
    this.add.text(cx, 70, `Level ${guild.level} | ${guild.members.length}/${guild.maxMembers} Mitglieder`, {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Members section
    this.add.text(20, 90, '👥 Mitglieder', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    });

    let y = 115;
    guild.members.forEach((member) => {
      drawCard(this, cx, y + 22, width - 30, 48);

      this.add.text(20, y + 8, `${member.emoji} ${member.name}`, {
        fontSize: '15px', fontFamily: 'monospace', color: THEME.text.dark,
      });
      this.add.text(20, y + 26, `${member.specialty} · Lv.${member.level} · ${member.trait}`, {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
      });
      this.add.text(width - 20, y + 18, `${member.helpCount}x geholfen`, {
        fontSize: '13px', fontFamily: 'monospace', color: THEME.text.success,
      }).setOrigin(1, 0.5);

      if (member.isNPC) {
        this.add.text(width - 20, y + 32, '🤖 NPC', {
          fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
        }).setOrigin(1, 0);
      }

      y += 55;
    });

    // Recruit button
    if (guild.members.length < guild.maxMembers) {
      const canRecruit = this.save.hearts >= 20;
      drawButton(this, cx, y + 20, 240, 40, '➕ Helfer rekrutieren (20❤️)', {
        fontSize: '15px',
        disabled: !canRecruit,
      });
      if (canRecruit) {
        this.addHitArea(cx, y + 20, 240, 40, () => {
          this.save.hearts -= 20;
          this.save.guild.members.push(generateNPCMember());
          addGuildXp(this.save.guild, 10);
          writeSave(this.save);
          this.drawUI();
        });
      }
      y += 50;
    }

    // Help log
    y += 15;
    this.add.text(20, y, '📋 Letzte Aktionen', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    });
    y += 25;

    const recentHelp = guild.helpLog.slice(0, 6);
    if (recentHelp.length === 0) {
      this.add.text(cx, y + 10, 'Noch keine Aktionen...', {
        fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
      }).setOrigin(0.5);
    } else {
      recentHelp.forEach((log) => {
        const timeAgo = this.formatTimeAgo(log.time);
        this.add.text(20, y, `${log.memberEmoji} ${log.memberName} hat ${log.petName} ${log.action.toLowerCase()} · ${timeAgo}`, {
          fontSize: '13px', fontFamily: 'monospace', color: THEME.text.muted,
        });
        y += 18;
      });
    }

    // Chat section
    y += 15;
    this.add.text(20, y, '💬 Gildenchat', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    });
    y += 25;

    const recentChat = guild.chatMessages.slice(0, 5);
    if (recentChat.length === 0) {
      this.add.text(cx, y + 10, 'Noch keine Nachrichten...', {
        fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
      }).setOrigin(0.5);
    } else {
      recentChat.forEach((msg) => {
        this.add.text(20, y, `${msg.emoji} ${msg.name}: ${msg.text}`, {
          fontSize: '13px', fontFamily: 'monospace', color: THEME.text.body,
          wordWrap: { width: width - 40 },
        });
        y += 22;
      });
    }

    // Back button
    drawButton(this, cx, height - 30, 280, 50, '← Zurück', { type: 'secondary' });
    this.addHitArea(cx, height - 30, 280, 50, () => this.scene.start('Town'));

    // Touch
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

  formatTimeAgo(timestamp) {
    const mins = Math.floor((Date.now() - timestamp) / 60000);
    if (mins < 1) return 'gerade eben';
    if (mins < 60) return `vor ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `vor ${hours}h`;
    return `vor ${Math.floor(hours / 24)}d`;
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
