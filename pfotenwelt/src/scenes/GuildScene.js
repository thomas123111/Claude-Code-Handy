import Phaser from 'phaser';
import { loadSave, writeSave } from '../data/SaveManager.js';
import { createDefaultGuild, generateNPCMember, processNPCHelp, addGuildXp } from '../data/GuildData.js';

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

    this.cameras.main.setBackgroundColor('#1a1828');

    // Header
    this.add.rectangle(cx, 0, width, 50, 0x2a1f35, 0.95).setOrigin(0.5, 0);
    this.add.text(cx, 25, `🤝 ${guild.name}`, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ffcc88', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Guild stats
    this.add.text(cx, 60, `Level ${guild.level} | ${guild.members.length}/${guild.maxMembers} Mitglieder`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#aa88cc',
    }).setOrigin(0.5);

    // Members section
    this.add.text(20, 85, '👥 Mitglieder', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ddccee', fontStyle: 'bold',
    });

    let y = 110;
    guild.members.forEach((member) => {
      this.add.rectangle(cx, y + 22, width - 30, 48, 0x2d2240, 0.7)
        .setStrokeStyle(1, 0x443355);

      this.add.text(20, y + 8, `${member.emoji} ${member.name}`, {
        fontSize: '13px', fontFamily: 'monospace', color: '#ffffff',
      });
      this.add.text(20, y + 26, `${member.specialty} · Lv.${member.level} · ${member.trait}`, {
        fontSize: '9px', fontFamily: 'monospace', color: '#887799',
      });
      this.add.text(width - 20, y + 18, `${member.helpCount}x geholfen`, {
        fontSize: '9px', fontFamily: 'monospace', color: '#668866',
      }).setOrigin(1, 0.5);

      if (member.isNPC) {
        this.add.text(width - 20, y + 32, '🤖 NPC', {
          fontSize: '8px', fontFamily: 'monospace', color: '#555555',
        }).setOrigin(1, 0);
      }

      y += 55;
    });

    // Recruit button
    if (guild.members.length < guild.maxMembers) {
      this.add.rectangle(cx, y + 20, 240, 40, 0x334466, 0.5)
        .setStrokeStyle(2, 0x4488aa);
      this.add.text(cx, y + 20, '➕ Helfer rekrutieren (20❤️)', {
        fontSize: '12px', fontFamily: 'monospace', color: '#88ccff',
      }).setOrigin(0.5);
      if (this.save.hearts >= 20) {
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
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ddccee', fontStyle: 'bold',
    });
    y += 25;

    const recentHelp = guild.helpLog.slice(0, 6);
    if (recentHelp.length === 0) {
      this.add.text(cx, y + 10, 'Noch keine Aktionen...', {
        fontSize: '11px', fontFamily: 'monospace', color: '#665577',
      }).setOrigin(0.5);
    } else {
      recentHelp.forEach((log) => {
        const timeAgo = this.formatTimeAgo(log.time);
        this.add.text(20, y, `${log.memberEmoji} ${log.memberName} hat ${log.petName} ${log.action.toLowerCase()} · ${timeAgo}`, {
          fontSize: '9px', fontFamily: 'monospace', color: '#998899',
        });
        y += 18;
      });
    }

    // Chat section
    y += 15;
    this.add.text(20, y, '💬 Gildenchat', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ddccee', fontStyle: 'bold',
    });
    y += 25;

    const recentChat = guild.chatMessages.slice(0, 5);
    if (recentChat.length === 0) {
      this.add.text(cx, y + 10, 'Noch keine Nachrichten...', {
        fontSize: '11px', fontFamily: 'monospace', color: '#665577',
      }).setOrigin(0.5);
    } else {
      recentChat.forEach((msg) => {
        this.add.text(20, y, `${msg.emoji} ${msg.name}: ${msg.text}`, {
          fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa',
          wordWrap: { width: width - 40 },
        });
        y += 22;
      });
    }

    // Back button
    this.add.text(cx, height - 30, '← Zurück', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#887799',
    }).setOrigin(0.5);
    this.addHitArea(cx, height - 30, 140, 35, () => this.scene.start('Town'));

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
