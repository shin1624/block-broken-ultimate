import {
  SCALES,
  CHORD_PROGRESSIONS,
  RHYTHM_PATTERNS,
  LAYER_DEFAULTS,
  degreeToFrequency,
} from "./MusicScales.js";

/**
 * MusicSequencer - 5レイヤー音楽シーケンサー
 * AudioContext 上でベース・メロディ・ハーモニー・パーカッション・アンビエントを生成
 */
class MusicSequencer {
  constructor(audioContext, masterGain) {
    this.ctx = audioContext;
    this.master = masterGain;
    this.oscillators = new Set();
    this.ambientOsc = null;
    this.ambientGain = null;
    this.sequenceStep = 0;
    this.lastStepTime = 0;
    this.isPlaying = false;
    this.animFrameId = null;
  }

  /**
   * シーケンス再生開始
   * @param {Object} musicState - { tempo, intensity, tension, progression, scale }
   */
  start(musicState) {
    this.isPlaying = true;
    this.sequenceStep = 0;
    this.lastStepTime = this.ctx.currentTime;
    this.startAmbientLayer(musicState);
    this.loop(musicState);
  }

  /**
   * シーケンス停止
   */
  stop() {
    this.isPlaying = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.stopAmbientLayer();
    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch (_) {
        /* already stopped */
      }
    });
    this.oscillators.clear();
  }

  /**
   * メインループ（requestAnimationFrame ベース）
   * @param {Object} musicState
   */
  loop(musicState) {
    if (!this.isPlaying) return;

    const now = this.ctx.currentTime;
    const stepDur = this.stepDuration(musicState.tempo);

    if (now >= this.lastStepTime + stepDur) {
      this.playStep(musicState, stepDur);
      this.lastStepTime = now;
      this.sequenceStep = (this.sequenceStep + 1) % 16;
    }

    this.animFrameId = requestAnimationFrame(() => this.loop(musicState));
  }

  /** 16分音符の長さ（秒） */
  stepDuration(tempo) {
    return 60 / tempo / 4;
  }

  /**
   * 1ステップ分の全レイヤーを再生
   * @param {Object} ms - musicState
   * @param {number} dur - ステップ長（秒）
   */
  playStep(ms, dur) {
    const t = this.ctx.currentTime;
    const idx = this.sequenceStep;

    if (idx % 4 === 0) this.playBass(t, dur, ms);
    if (idx % 2 === 0) this.playMelody(t, dur, ms, idx);
    if (idx % 8 === 4) this.playHarmony(t, dur, ms);
    this.playPercussion(t, dur, ms, idx);
    if (idx === 0) this.updateAmbient(ms);
  }

  /** Bass レイヤー: sine波 オクターブ2 */
  playBass(t, dur, ms) {
    const cfg = LAYER_DEFAULTS.bass;
    const degree = Math.floor(Math.random() * 3);
    const freq = degreeToFrequency(degree, ms.scale, cfg.octave);
    const vol = cfg.volume * ms.intensity;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = cfg.waveType;
    osc.frequency.setValueAtTime(freq, t);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, t + dur * 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    this.scheduleOsc(osc, t, t + dur);
  }

  /** Melody レイヤー: triangle波 オクターブ4 */
  playMelody(t, dur, ms, stepIdx) {
    const cfg = LAYER_DEFAULTS.melody;
    const chords =
      CHORD_PROGRESSIONS[ms.progression] || CHORD_PROGRESSIONS.peaceful;
    const chordIdx = Math.floor(stepIdx / 4) % 4;
    const chord = chords[chordIdx];
    const degree = chord[Math.floor(Math.random() * chord.length)];
    const freq = degreeToFrequency(degree, ms.scale, cfg.octave);
    const vol = cfg.volume * (0.5 + ms.intensity * 0.5);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = cfg.waveType;
    osc.frequency.setValueAtTime(freq, t);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1000 + ms.tension * 2000, t);
    filter.Q.setValueAtTime(2, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, t + dur * 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    this.scheduleOsc(osc, t, t + dur * 0.8);
  }

  /** Harmony レイヤー: sawtooth波 オクターブ3、三和音パッド */
  playHarmony(t, dur, ms) {
    const cfg = LAYER_DEFAULTS.harmony;
    const chordDegrees = [0, 2, 4];

    chordDegrees.forEach((deg, i) => {
      const freq = degreeToFrequency(deg, ms.scale, cfg.octave);
      const vol = cfg.volume * 0.3 * (1 - i * 0.1);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = cfg.waveType;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur * 2);

      osc.connect(gain);
      gain.connect(this.master);

      this.scheduleOsc(osc, t, t + dur * 2);
    });
  }

  /** Percussion レイヤー: ノイズ生成によるキック・スネア・ハイハット */
  playPercussion(t, dur, ms, stepIdx) {
    const patternName = ms.percPattern || LAYER_DEFAULTS.percussion.pattern;
    const pattern = RHYTHM_PATTERNS[patternName] || RHYTHM_PATTERNS.basic;
    const vel = pattern[stepIdx % pattern.length];
    if (vel <= 0) return;

    const vol = LAYER_DEFAULTS.percussion.volume;

    if (stepIdx % 4 === 0)
      this.playPercHit(t, 60, "sine", vel * vol * 0.8, 0.1);
    if (stepIdx % 8 === 4)
      this.playPercHit(t, 200, "square", vel * vol * 0.6, 0.05);
    if (vel < 1) this.playPercHit(t, 8000, "square", vel * vol * 0.3, 0.02);
  }

  /** パーカッション単音 */
  playPercHit(t, freq, wave, vol, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(freq * 0.1, 20),
      t + duration,
    );

    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    osc.connect(gain);
    gain.connect(this.master);

    this.scheduleOsc(osc, t, t + duration);
  }

  /** Ambient レイヤー開始: 持続 sine ドローン */
  startAmbientLayer(ms) {
    this.stopAmbientLayer();
    const cfg = LAYER_DEFAULTS.ambient;

    this.ambientOsc = this.ctx.createOscillator();
    this.ambientGain = this.ctx.createGain();

    this.ambientOsc.type = cfg.waveType;
    this.ambientOsc.frequency.setValueAtTime(220, this.ctx.currentTime);
    this.ambientGain.gain.setValueAtTime(
      cfg.volume * (0.5 + ms.tension * 0.5),
      this.ctx.currentTime,
    );

    this.ambientOsc.connect(this.ambientGain);
    this.ambientGain.connect(this.master);
    this.ambientOsc.start(this.ctx.currentTime);
  }

  /** Ambient パラメータ更新 */
  updateAmbient(ms) {
    if (!this.ambientGain) return;
    const cfg = LAYER_DEFAULTS.ambient;
    const vol = cfg.volume * (0.5 + ms.tension * 0.5);
    this.ambientGain.gain.linearRampToValueAtTime(
      vol,
      this.ctx.currentTime + 0.1,
    );

    if (this.ambientOsc) {
      const baseFreq = 220 + ms.tension * 110;
      this.ambientOsc.frequency.linearRampToValueAtTime(
        baseFreq,
        this.ctx.currentTime + 0.5,
      );
    }
  }

  /** Ambient レイヤー停止 */
  stopAmbientLayer() {
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
      } catch (_) {
        /* already stopped */
      }
      this.ambientOsc = null;
    }
    this.ambientGain = null;
  }

  /** オシレーターをスケジュール・トラッキング */
  scheduleOsc(osc, startTime, stopTime) {
    osc.start(startTime);
    osc.stop(stopTime);
    this.oscillators.add(osc);
    osc.addEventListener("ended", () => this.oscillators.delete(osc));
  }
}

export default MusicSequencer;
