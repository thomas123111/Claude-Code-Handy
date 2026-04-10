import Phaser from 'phaser';
import { loadSave, writeSave, addXp } from '../data/SaveManager.js';
import { getRandomPuzzle } from '../data/PuzzleRotator.js';
import { THEME, drawHeader, drawButton, drawCard } from '../ui/Theme.js';

// NPC competitors with names and skill levels
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

export class ArenaScene extends Phaser.Scene {
  constructor() { super('Arena'); }

  create() {
    this.save = loadSave();
    this.hitAreas = [];
    const { width, height } = this.scale;
    const cx = width / 2;

    // Hide HTML HUD
    const hud = document.getElementById('hud');
    if (hud) hud.classList.remove('visible');
    const bb = document.getElementById('bottom-bar');
    if (bb) bb.style.display = 'none';

    this.cameras.main.setBackgroundColor(THEME.bg.scene);
    drawHeader(this, '🏟️ Arena', this.save);

    // Check tournament state
    if (!this.save.arena) this.save.arena = {};
    const now = new Date();
    const weekNum = this.getWeekNumber(now);

    // Check for returning from a puzzle round
    const puzzleResult = this.registry.get('puzzleResult');
    if (puzzleResult && this.save.arena.inTournament) {
      this.registry.remove('puzzleResult');
      this.handleRoundResult(puzzleResult);
    }

    const tournament = this.save.arena;
    const isThisWeek = tournament.week === weekNum;
    const isComplete = isThisWeek && tournament.completed;
    const isInProgress = isThisWeek && tournament.inTournament;
    const hasEnteredThisWeek = isThisWeek && (tournament.completed || tournament.inTournament);

    // Tournament info
    const nextMonday = this.getNextMonday(now);
    const daysLeft = Math.ceil((nextMonday - now) / 86400000);

    if (isComplete) {
      // Show results
      this.drawResults(cx, width, height, tournament);
    } else if (isInProgress) {
      // Continue tournament
      this.drawInProgress(cx, width, height, tournament);
    } else {
      // Entry screen
      this.drawEntry(cx, width, height, weekNum, daysLeft);
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

  drawEntry(cx, width, height, weekNum, daysLeft) {
    this.add.text(cx, 85, '🏆 Wöchentliches Turnier', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 110, `Woche ${weekNum} — noch ${daysLeft} Tage`, {
      fontSize: '12px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);

    drawCard(this, cx, 200, width - 40, 160);
    this.add.text(cx, 145, '3 Runden, 3 zufällige Puzzles', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: THEME.text.body,
    }).setOrigin(0.5);
    this.add.text(cx, 170, 'Tritt gegen andere Tierschützer an!', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: THEME.text.muted,
    }).setOrigin(0.5);

    // Show NPC opponents preview
    const opponents = this.pickOpponents(weekNum);
    opponents.forEach((npc, i) => {
      this.add.text(cx - 80 + i * 55, 205, npc.emoji, { fontSize: '24px' }).setOrigin(0.5);
      this.add.text(cx - 80 + i * 55, 225, npc.name, {
        fontSize: '9px', fontFamily: 'monospace', color: THEME.text.muted,
      }).setOrigin(0.5);
    });

    this.add.text(cx, 255, 'Preise:', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: THEME.text.body, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 275, '🥇 50❤ + 20 XP   🥈 25❤   🥉 10❤', {
      fontSize: '11px', fontFamily: 'monospace', color: '#cc8844',
    }).setOrigin(0.5);

    // Entry button
    const canEnter = this.save.hearts >= 10;
    drawButton(this, cx, 330, width - 60, 48, '🏟️ Teilnehmen (10❤)', { disabled: !canEnter });
    if (canEnter) {
      this.addHitArea(cx, 330, width - 60, 48, () => {
        this.save.hearts -= 10;
        this.save.arena = {
          week: weekNum,
          inTournament: true,
          completed: false,
          round: 0,
          scores: [],
          opponents: this.pickOpponents(weekNum),
        };
        writeSave(this.save);
        this.scene.restart();
      });
    }
    if (!canEnter) {
      this.add.text(cx, 360, 'Brauchst 10❤ zum Teilnehmen', {
        fontSize: '11px', fontFamily: 'monospace', color: THEME.text.error,
      }).setOrigin(0.5);
    }
  }

  drawInProgress(cx, width, height, tournament) {
    const round = tournament.round + 1;
    this.add.text(cx, 85, `🏆 Runde ${round} von 3`, {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Previous round scores
    if (tournament.scores.length > 0) {
      this.add.text(cx, 115, 'Bisherige Punkte:', {
        fontSize: '12px', fontFamily: 'monospace', color: THEME.text.muted,
      }).setOrigin(0.5);
      tournament.scores.forEach((s, i) => {
        this.add.text(cx, 135 + i * 18, `Runde ${i + 1}: ${s} Punkte`, {
          fontSize: '11px', fontFamily: 'monospace', color: s > 50 ? '#33aa55' : '#cc8844',
        }).setOrigin(0.5);
      });
    }

    // Start next round
    const btnY = 220 + tournament.scores.length * 18;
    drawButton(this, cx, btnY, width - 60, 48, `▶️ Runde ${round} starten!`);
    this.addHitArea(cx, btnY, width - 60, 48, () => {
      const puzzle = getRandomPuzzle(this.save, 'arena');
      writeSave(this.save);
      this.scene.start(puzzle, { petName: 'Turnier', onComplete: 'Arena', need: 'play' });
    });
  }

  drawResults(cx, width, height, tournament) {
    // Calculate placement
    const playerTotal = tournament.scores.reduce((a, b) => a + b, 0);
    const opponents = tournament.opponents || [];
    const allScores = [
      { name: this.save.profile?.name || 'Du', score: playerTotal, isPlayer: true },
      ...opponents.map(npc => ({
        name: npc.name,
        score: Math.floor(npc.skill * 3 * (0.7 + Math.random() * 0.6)),
        isPlayer: false,
      })),
    ].sort((a, b) => b.score - a.score);

    const playerRank = allScores.findIndex(s => s.isPlayer) + 1;
    const medals = ['🥇', '🥈', '🥉', '4.'];

    this.add.text(cx, 85, '🏆 Turnier-Ergebnis', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 115, `Du bist ${medals[playerRank - 1] || `${playerRank}.`} geworden!`, {
      fontSize: '16px', fontFamily: 'Georgia, serif',
      color: playerRank === 1 ? '#ddaa33' : playerRank <= 3 ? '#8888cc' : '#888888',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Leaderboard
    allScores.forEach((entry, i) => {
      const ey = 150 + i * 35;
      const medal = medals[i] || `${i + 1}.`;
      drawCard(this, cx, ey, width - 40, 30, {
        borderColor: entry.isPlayer ? 0xddaa33 : THEME.bg.cardBorder,
      });
      if (entry.isPlayer) this.add.rectangle(cx, ey, width - 44, 26, 0xfff8e0, 0.5);
      this.add.text(25, ey - 6, `${medal} ${entry.name}`, {
        fontSize: '13px', fontFamily: 'Georgia, serif',
        color: entry.isPlayer ? '#6b4c8a' : THEME.text.body,
        fontStyle: entry.isPlayer ? 'bold' : 'normal',
      });
      this.add.text(width - 25, ey - 6, `${entry.score} Pkt`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#cc8844',
      }).setOrigin(1, 0);
    });

    // Reward info
    const rewards = { 1: { hearts: 50, xp: 20 }, 2: { hearts: 25, xp: 10 }, 3: { hearts: 10, xp: 5 } };
    const reward = rewards[playerRank];
    if (reward && !tournament.rewardClaimed) {
      const ry = 150 + allScores.length * 35 + 20;
      this.add.text(cx, ry, `Dein Preis: +${reward.hearts}❤️ + ${reward.xp} XP`, {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: '#33aa55', fontStyle: 'bold',
      }).setOrigin(0.5);
      drawButton(this, cx, ry + 35, 180, 38, '🎁 Preis abholen!');
      this.addHitArea(cx, ry + 35, 180, 38, () => {
        this.save.hearts += reward.hearts;
        addXp(this.save, reward.xp);
        tournament.rewardClaimed = true;
        this.save.totalTournaments = (this.save.totalTournaments || 0) + 1;
        writeSave(this.save);
        this.scene.restart();
      });
    } else if (tournament.rewardClaimed) {
      const ry = 150 + allScores.length * 35 + 20;
      this.add.text(cx, ry, '✅ Preis bereits abgeholt', {
        fontSize: '13px', fontFamily: 'monospace', color: '#33aa55',
      }).setOrigin(0.5);
      this.add.text(cx, ry + 22, 'Nächstes Turnier nächste Woche!', {
        fontSize: '11px', fontFamily: 'monospace', color: THEME.text.muted,
      }).setOrigin(0.5);
    }
  }

  handleRoundResult(result) {
    const tournament = this.save.arena;
    const score = result.success ? (result.score || 80) : Math.floor(Math.random() * 30);
    tournament.scores.push(score);
    tournament.round++;
    if (tournament.round >= 3) {
      tournament.inTournament = false;
      tournament.completed = true;
    }
    writeSave(this.save);
  }

  pickOpponents(weekNum) {
    // Deterministic pick of 3 opponents based on week
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

  getNextMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  addHitArea(x, y, w, h, cb) {
    this.hitAreas.push({ x, y, w, h, cb });
  }
}
