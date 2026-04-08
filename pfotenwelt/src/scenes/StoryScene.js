import Phaser from 'phaser';
import { loadSave, writeSave } from '../data/SaveManager.js';
import { THEME, drawCard } from '../ui/Theme.js';

export class StoryScene extends Phaser.Scene {
  constructor() { super('Story'); }

  init(data) {
    this.chapter = data.chapter;
    this.dialogueIdx = 0;
    this.returnTo = data.returnTo || 'Menu';
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor(THEME.bg.scene);

    // Title
    this.add.text(cx, 50, this.chapter.title, {
      fontSize: '26px', fontFamily: 'Georgia, serif', color: THEME.text.title, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Dialogue box
    drawCard(this, cx, height - 200, width - 40, 180);

    // Speaker emoji
    this.speakerText = this.add.text(50, height - 280, '', {
      fontSize: '40px',
    }).setDepth(10);

    // Dialogue text
    this.dialogueText = this.add.text(cx, height - 200, '', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: THEME.text.body,
      wordWrap: { width: width - 80 }, align: 'center', lineSpacing: 6,
    }).setOrigin(0.5).setDepth(10);

    // Tap to continue
    this.tapText = this.add.text(cx, height - 120, 'Tippen zum Fortfahren...', {
      fontSize: '14px', fontFamily: 'monospace', color: THEME.text.muted,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: this.tapText,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Show first dialogue
    this.showDialogue();

    // Tap handler
    this.input.on('pointerdown', () => {
      this.dialogueIdx++;
      if (this.dialogueIdx >= this.chapter.dialogues.length) {
        this.finishStory();
      } else {
        this.showDialogue();
      }
    });
  }

  showDialogue() {
    const d = this.chapter.dialogues[this.dialogueIdx];
    this.speakerText.setText(d.speaker);

    // Typewriter effect
    this.dialogueText.setText('');
    const fullText = d.text;
    let charIdx = 0;
    if (this.typeTimer) this.typeTimer.remove();
    this.typeTimer = this.time.addEvent({
      delay: 30,
      repeat: fullText.length - 1,
      callback: () => {
        charIdx++;
        this.dialogueText.setText(fullText.substring(0, charIdx));
      },
    });
  }

  finishStory() {
    // Mark as seen
    const save = loadSave();
    if (!save.seenStories) save.seenStories = [];
    save.seenStories.push(this.chapter.id);
    writeSave(save);

    this.scene.start(this.returnTo);
  }
}
