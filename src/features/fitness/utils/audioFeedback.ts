// Audio & Vibration Feedback Utility using Web Audio API (Zero external audio files required)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Toca um aviso sonoro duplo suave de fim de descanso (estilo timer de academia)
 */
export function playRestCompleteSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tom 1: 587.33 Hz (D5) - Sine suave
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Tom 2: 880 Hz (A5) - Triangle com timbre agradável
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.18);
    gain2.gain.setValueAtTime(0.25, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.55);
  } catch {
    // Ignora erros de áudio em navegadores com restrições
  }
}

/**
 * Toca fanfarra rápida de vitória ao bater Recorde Pessoal (PR)
 */
export function playPRCelebrationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  } catch {
    // Ignora erros
  }
}

/**
 * Feedback tátil (vibração) para celulares
 */
export function triggerHaptic(type: 'light' | 'success' | 'record' = 'light') {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'light') {
        navigator.vibrate(35);
      } else if (type === 'success') {
        navigator.vibrate([60, 40, 60]);
      } else if (type === 'record') {
        navigator.vibrate([100, 60, 100, 60, 250]);
      }
    }
  } catch {
    // Ignora
  }
}
