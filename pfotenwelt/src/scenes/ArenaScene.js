import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { getRandomPuzzle } from '../data/PuzzleRotator.js';
import { THEME, drawHeader, drawButton, drawCard } from '../ui/Theme.js';

const ARENA_MIN_LEVEL = 8;
const ROUNDS_PER_DAY = 3;
const REWARDS = {
  1: { hearts: 150, xp: 60, label: '🥇 150❤ + 60 XP' },
  2: { hearts: 75, xp: 30, label: '🥈 75❤ + 30 XP' },
  3: { hearts: 30, xp: 15, label: '🥉 30❤ + 15 XP' },
};

const NPC_COMPETITORS = [
  { name: 'Luna', emoji: '👩', skill: 60 },
  { name: 'Max', emoji: '👦', skill: 70 },
  { name: 'Oma Gerda', emoji: '👵', skill: 45 },
  { name: 'Trainer Kai', emoji: '🧑', skill: 80 },
  { name: 'Frau Fischer', emoji: '👩', skill: 55 },
  { name: 'Herr Braun', emoji: '👨', skill: 65 },
  { name: 'Die Schmidts', emoji: '👫', skill: 50 },
  { name: 'Clara', emoji: '👧', skill: 75 },
];

const DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

export class ArenaScene extends Phaser.Scene {
  constructor() { super('Arena'); }

  create() {
    this.save = loadSave();
    this.hitAreas = [];
    const { width, height } = this.scale;
    const cx = width / 2;

    const hud = document.getElementById('hud');
    if (hud) hud.classList.remove('visible');
    const bb = document.getElementById('bottom-bar');
    if (bb) bb.style.display = 'none';

    this.cameras.main.setBackgroundColor(THEME.bg.scene);
    drawHeader(this, '🏟️ Arena', this.save);

    // Init arena state
    if (!this.save.arena) this.save.arena = {};
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sunday
    const weekNum = this.getWeekNumber(now);
    const todayStr = now.toDateString();
    const isSunday = dayOfWeek === 0;

    // Ensure this week's data exists
    if (this.save.arena.week !== weekNum) {
      this.save.arena = {
        week: weekNum,
        dailyScores: {}, // { "Mon Apr 7": [score, score, score], ... }
        opponents: this.pickOpponents(weekNum),
        rewardClaimed: false,
      };
      writeSave(this.save);
    }

    // Check puzzle return
    const puzzleResult = this.registry.get('puzzleResult');
    if (puzzleResult && this.save.arena._pendingDay) {
      this.registry.remove('puzzleResult');
      const score = puzzleResult.success ? (puzzleResult.score || 80) : Math.floor(Math.random() * 20);
      const pendingDay = this.save.arena._pendingDay;
      if (!this.save.arena.dailyScores[pendingDay]) this.save.arena.dailyScores[pendingDay] = [];
      this.save.arena.dailyScores[pendingDay].push(score);
      delete this.save.arena._pendingDay;
      writeSave(this.save);
    }

    const todayScores = this.save.arena.dailyScores[todayStr] || [];
    const todayRoundsLeft = ROUNDS_PER_DAY - todayScores.length;
    const totalPlayerScore = Object.values(this.save.arena.dailyScores).flat().reduce((a, b) => a + b, 0);

    if (isSunday) {
      this.drawSunday(cx, width, height, totalPlayerScore);
    } else {
      this.drawWeekday(cx, width, height, todayScores, todayRoundsLeft, totalPlayerScore, todayStr);
    }

    // Back button
    drawButton(this, cx, height - 30, 200, 40, '← Zurück', { type: 'secondary', fontSize: '14px' });
    this.addHitArea(cx, height - 30, 200, 40, () => this.scene.start('Town'));

    this.input.on('pointerdown', (pointer) => {
      for (const h of this.hitAreas) {
        if (pointer.x >= h.x - h.w / 2 && pointer.x <= h.x + h.w / 2 &&
            pointer.y >= h.y - h.h / 2 && pointer.y <= h.y + h.h / 2) {
          h.cb(); return;
        }
      }
    });
  }

  drawWeekday(cx, width, height, todayScores, roundsLeft, totalScore, todayStr) {
    const now = new Date();
    const dayName = DAY_NAMES[now.getDay()];

    this.add.text(cx, 80, '🏆 Wöchentliches Turnier', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 100, `${dayName} — Auswertung am Sonntag`, {
      fontSize: '11px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Weekly progress card
    drawCard(this, cx, 155, width - 30, 70);
    const playedDays = Object.keys(this.save.arena.dailyScores).length;
    const totalRounds = Object.values(this.save.arena.dailyScores).flat().length;
    this.add.text(cx, 135, `Gesamt: ${totalScore} Punkte (${totalRounds} Runden, ${playedDays} Tage)`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#6b4c8a',
    }).setOrigin(0.5);
    this.add.text(cx, 155, `Preise: ${REWARDS[1].label}  ${REWARDS[2].label}  ${REWARDS[3].label}`, {
      fontSize: '9px', fontFamily: 'monospace', color: '#cc8844',
    }).setOrigin(0.5);
    // NPC opponents
    const opponents = this.save.arena.opponents || [];
    let ox = cx - 70;
    opponents.forEach(npc => {
      this.add.text(ox, 172, `${npc.emoji} ${npc.name}`, {
        fontSize: '9px', fontFamily: 'monospace', color: THEME.text.muted,
      });
      ox += 50;
    });

    // Today's rounds
    const roundsY = 210;
    this.add.text(cx, roundsY, `Heute: ${todayScores.length}/${ROUNDS_PER_DAY} Runden gespielt`, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: THEME.text.body, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Show today's scores
    todayScores.forEach((score, i) => {
      this.add.text(cx - 80 + i * 80, roundsY + 25, `Runde ${i + 1}: ${score}`, {
        fontSize: '11px', fontFamily: 'monospace', color: score > 50 ? '#33aa55' : '#cc8844',
      }).setOrigin(0.5);
    });

    // Play button
    if (roundsLeft > 0) {
      const btnY = roundsY + 60;
      drawButton(this, cx, btnY, width - 60, 48, `▶️ Runde ${todayScores.length + 1} spielen!`);
      this.addHitArea(cx, btnY, width - 60, 48, () => {
        this.save.arena._pendingDay = todayStr;
        const puzzle = getRandomPuzzle(this.save, 'arena');
        writeSave(this.save);
        this.scene.start(puzzle, { petName: 'Turnier', onComplete: 'Arena', need: 'play' });
      });
    } else {
      this.add.text(cx, roundsY + 55, '✅ Alle Runden für heute gespielt!', {
        fontSize: '13px', fontFamily: 'Georgia, serif', color: '#33aa55',
      }).setOrigin(0.5);
      this.add.text(cx, roundsY + 75, 'Komm morgen wieder für 3 neue Runden.', {
        fontSize: '11px', fontFamily: 'monospace', color: THEME.text.muted,
      }).setOrigin(0.5);
    }
  }

  drawSunday(cx, width, height, totalPlayerScore) {
    this.add.text(cx, 80, '🏆 Turnier-Auswertung!', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 102, 'Sonntag — Ergebnisse der Woche', {
      fontSize: '11px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Calculate final standings
    const opponents = this.save.arena.opponents || [];
    const maxPossible = 6 * ROUNDS_PER_DAY * 100; // 6 days * 3 rounds * max 100
    const allScores = [
      { name: this.save.profile?.name || 'Du', score: totalPlayerScore, isPlayer: true },
      ...opponents.map(npc => ({
        name: npc.name, emoji: npc.emoji,
        score: Math.floor(npc.skill * 18 * (0.6 + Math.random() * 0.5)),
        isPlayer: false,
      })),
    ].sort((a, b) => b.score - a.score);

    const playerRank = allScores.findIndex(s => s.isPlayer) + 1;
    const medals = ['🥇', '🥈', '🥉', '4.'];

    // Placement
    this.add.text(cx, 130, `${medals[playerRank - 1] || `${playerRank}.`} Platz!`, {
      fontSize: '24px', fontFamily: 'Georgia, serif',
      color: playerRank === 1 ? '#ddaa33' : playerRank <= 3 ? '#8888cc' : '#888888',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Leaderboard
    allScores.forEach((entry, i) => {
      const ey = 170 + i * 38;
      drawCard(this, cx, ey, width - 35, 32, {
        borderColor: entry.isPlayer ? 0xddaa33 : THEME.bg.cardBorder,
      });
      if (entry.isPlayer) this.add.rectangle(cx, ey, width - 39, 28, 0xfff8e0, 0.5);
      this.add.text(22, ey - 7, `${medals[i] || `${i + 1}.`} ${entry.emoji || '🐾'} ${entry.name}`, {
        fontSize: '12px', fontFamily: 'Georgia, serif',
        color: entry.isPlayer ? '#6b4c8a' : THEME.text.body,
        fontStyle: entry.isPlayer ? 'bold' : 'normal',
      });
      this.add.text(width - 22, ey - 7, `${entry.score} Pkt`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#cc8844',
      }).setOrigin(1, 0);
    });

    // Reward
    const reward = REWARDS[playerRank];
    const ry = 170 + allScores.length * 38 + 15;
    if (reward && !this.save.arena.rewardClaimed) {
      this.add.text(cx, ry, `Dein Preis: ${reward.label}`, {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: '#33aa55', fontStyle: 'bold',
      }).setOrigin(0.5);
      drawButton(this, cx, ry + 35, 200, 42, '🎁 Preis abholen!');
      this.addHitArea(cx, ry + 35, 200, 42, () => {
        this.save.hearts += reward.hearts;
        addXp(this.save, reward.xp);
        this.save.arena.rewardClaimed = true;
        this.save.totalTournaments = (this.save.totalTournaments || 0) + 1;
        writeSave(this.save);
        this.scene.restart();
      });
    } else if (this.save.arena.rewardClaimed) {
      this.add.text(cx, ry, '✅ Preis abgeholt!', {
        fontSize: '13px', fontFamily: 'monospace', color: '#33aa55',
      }).setOrigin(0.5);
      this.add.text(cx, ry + 20, 'Neues Turnier startet morgen (Montag)!', {
        fontSize: '11px', fontFamily: 'monospace', color: THEME.text.muted,
      }).setOrigin(0.5);
    } else {
      // No placement reward (4th place)
      this.add.text(cx, ry, 'Leider kein Preis. Nächste Woche mehr Glück!', {
        fontSize: '12px', fontFamily: 'Georgia, serif', color: THEME.text.muted,
      }).setOrigin(0.5);
    }
  }

  pickOpponents(weekNum) {
    const shuffled = [...NPC_COMPETITORS].sort((a, b) =>
      ((weekNum * 31 + a.name.charCodeAt(0)) % 100) - ((weekNum * 31 + b.name.charCodeAt(0)) % 100)
    );
    return shuffled.slice(0, 3);
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
