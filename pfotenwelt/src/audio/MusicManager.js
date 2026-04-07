// Procedural ambient music using Web Audio API
// Creates gentle, looping background music without external audio files

let audioCtx = null;
let currentTrack = null;
let masterGain = null;
let isPlaying = false;

// Pentatonic scale notes (peaceful, no dissonance)
const SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
const BASS_NOTES = [130.81, 146.83, 164.81, 196.00];

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.15;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function playNote(ctx, freq, startTime, duration, type = 'sine', volume = 0.3) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
  gain.gain.linearRampToValueAtTime(volume * 0.6, startTime + duration * 0.5);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function generateTownMusic(ctx) {
  const now = ctx.currentTime;
  const barLength = 2.0; // seconds per bar
  const bars = 8;
  const totalDuration = bars * barLength;

  for (let bar = 0; bar < bars; bar++) {
    const barStart = now + bar * barLength;

    // Bass note (warm pad)
    const bassNote = BASS_NOTES[bar % BASS_NOTES.length];
    playNote(ctx, bassNote, barStart, barLength * 0.9, 'sine', 0.25);

    // Melody notes (2-3 per bar, gentle)
    const notesPerBar = 2 + Math.floor(Math.random() * 2);
    for (let n = 0; n < notesPerBar; n++) {
      const noteTime = barStart + (n / notesPerBar) * barLength;
      const noteFreq = SCALE[Math.floor(Math.random() * SCALE.length)];
      const noteDur = 0.4 + Math.random() * 0.6;
      playNote(ctx, noteFreq, noteTime, noteDur, 'triangle', 0.12);
    }

    // Occasional high shimmer
    if (Math.random() > 0.5) {
      const shimmerTime = barStart + Math.random() * barLength;
      playNote(ctx, SCALE[5 + Math.floor(Math.random() * 3)] * 2, shimmerTime, 0.8, 'sine', 0.06);
    }
  }

  return totalDuration;
}

function generateFarmMusic(ctx) {
  const now = ctx.currentTime;
  const barLength = 2.5;
  const bars = 8;
  const totalDuration = bars * barLength;
  // Use a brighter, country feel
  const farmScale = [196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00];
  const farmBass = [98.00, 110.00, 130.81, 146.83];

  for (let bar = 0; bar < bars; bar++) {
    const barStart = now + bar * barLength;
    const bassNote = farmBass[bar % farmBass.length];
    playNote(ctx, bassNote, barStart, barLength * 0.8, 'sine', 0.2);

    // Simple pluck melody
    const notesPerBar = 3;
    for (let n = 0; n < notesPerBar; n++) {
      const noteTime = barStart + (n / notesPerBar) * barLength;
      const noteFreq = farmScale[Math.floor(Math.random() * farmScale.length)];
      playNote(ctx, noteFreq, noteTime, 0.3, 'triangle', 0.15);
    }
  }

  return totalDuration;
}

export function startMusic(trackName = 'town') {
  if (isPlaying && currentTrack === trackName) return;
  stopMusic();

  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();

  currentTrack = trackName;
  isPlaying = true;

  function loop() {
    if (!isPlaying || currentTrack !== trackName) return;
    let duration;
    if (trackName === 'farm') {
      duration = generateFarmMusic(ctx);
    } else {
      duration = generateTownMusic(ctx);
    }
    // Schedule next loop slightly before this one ends
    setTimeout(() => loop(), (duration - 0.5) * 1000);
  }

  loop();
}

export function stopMusic() {
  isPlaying = false;
  currentTrack = null;
}

export function setMusicVolume(vol) {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, vol));
  }
}

export function isMusicPlaying() {
  return isPlaying;
}

// Must be called from a user gesture (tap/click) to unlock audio
export function unlockAudio() {
  const ctx = getContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}
