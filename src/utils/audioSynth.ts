/**
 * Web Audio API Synthesizer for high-quality natural sounds,
 * healing frequencies, and medication alarms without external audio asset dependencies.
 */

let audioCtx: AudioContext | null = null;
let activeNodes: { [key: string]: any } = {};
let isMuted = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function stopAllSounds() {
  try {
    Object.keys(activeNodes).forEach(key => {
      if (activeNodes[key]) {
        try {
          if (activeNodes[key].stop) activeNodes[key].stop();
          if (activeNodes[key].disconnect) activeNodes[key].disconnect();
        } catch {
          // ignore
        }
      }
    });
    activeNodes = {};
  } catch (e) {
    console.error('Error stopping sounds:', e);
  }
}

export function playSynthesizedTrack(synthType: string, volume: number = 0.6) {
  stopAllSounds();
  if (isMuted) return;

  const ctx = getAudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime);
  masterGain.connect(ctx.destination);
  activeNodes['masterGain'] = masterGain;

  if (synthType === 'rain') {
    // Pink noise with filtering for soothing gentle rain
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(masterGain);
    whiteNoise.start();
    activeNodes['source'] = whiteNoise;
  } else if (synthType === 'waves') {
    // Ocean surf modulation
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8s swell

    const surfGain = ctx.createGain();
    surfGain.gain.setValueAtTime(0.3, ctx.currentTime);

    // Pink noise
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(surfGain);
    surfGain.connect(masterGain);

    whiteNoise.start();
    activeNodes['source'] = whiteNoise;
  } else if (synthType === 'delta') {
    // Binaural Delta 4.5 Hz (Left 200 Hz, Right 204.5 Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(196, ctx.currentTime);
    osc2.frequency.setValueAtTime(200.5, ctx.currentTime);

    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    gain1.gain.setValueAtTime(0.4, ctx.currentTime);
    gain2.gain.setValueAtTime(0.4, ctx.currentTime);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(masterGain);
    gain2.connect(masterGain);

    osc1.start();
    osc2.start();
    activeNodes['osc1'] = osc1;
    activeNodes['osc2'] = osc2;
  } else if (synthType === 'bowl528') {
    // Solfeggio 528 Hz Healing Bell with warm harmonics
    const fundamental = 528;
    [1, 2, 3, 4.2].forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(fundamental * ratio, ctx.currentTime);
      gain.gain.setValueAtTime(0.3 / (idx + 1), ctx.currentTime);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      activeNodes[`osc_bowl_${idx}`] = osc;
    });
  } else if (synthType === 'stream') {
    // Mountain brook stream sound with gentle bubbling
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(3.5, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(60, ctx.currentTime);
    lfo.connect(osc.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.connect(gain);
    gain.connect(masterGain);

    osc.start();
    lfo.start();
    activeNodes['osc_stream'] = osc;
    activeNodes['lfo_stream'] = lfo;
  } else {
    // Gentle Piano Chord Ambience (C major 9)
    const freqs = [261.63, 329.63, 392.00, 493.88, 587.33];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      activeNodes[`piano_${idx}`] = osc;
    });
  }
}

// Medication Alarm Chime (loud, distinct melody for elderly)
let alarmInterval: any = null;

export function startMedicationAlarmSound() {
  stopMedicationAlarmSound();
  const playChimeSequence = () => {
    try {
      const ctx = getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
        gain.gain.setValueAtTime(0.01, ctx.currentTime + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + i * 0.18 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.4);
      });
    } catch (e) {
      console.warn('Alarm error:', e);
    }
  };

  playChimeSequence();
  alarmInterval = setInterval(playChimeSequence, 2400);
}

export function stopMedicationAlarmSound() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Speak Voice Reminder via browser speech synthesis
export function speakVoiceReminder(text: string) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.88; // Slightly slower, calm and clear for elderly listeners
    utterance.pitch = 1.05;

    // Pick Vietnamese voice if available
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VN'));
    if (viVoice) utterance.voice = viVoice;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis failed:', err);
  }
}
