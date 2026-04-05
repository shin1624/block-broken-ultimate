import EventBus from "../core/EventBus.js";

/** AudioSystem - Web Audio APIのみで全効果音を生成。外部ファイル不使用。 */
class AudioSystem {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.isInitialized = false;
    this.volume = 0.5;
    this.isMuted = false;
    this.setupEventListeners();
  }

  /** 初期化 — AudioContext は MusicSystem と共有 */
  initialize(audioContext) {
    if (this.isInitialized) return;
    this.audioContext = audioContext;
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.updateVolume();
    this.isInitialized = true;
  }

  /** EventBus リスナー登録 */
  setupEventListeners() {
    EventBus.on("block_damaged", (data) => this.playBlockHit(data));
    EventBus.on("block_destroyed", (data) => this.playBlockDestroyed(data));
    EventBus.on("ball_paddle_hit", () => this.playPaddleHit());
    EventBus.on("powerup_collected", () => this.playPowerupCollected());
    EventBus.on("ball_lost", () => this.playBallLost());
    EventBus.on("ball_wall_hit", () => this.playWallHit());
    EventBus.on("combo_updated", (data) => this.playComboMilestone(data));
    EventBus.on("block_explode", () => this.playExplosion());
    EventBus.on("laser_on", () => this.playLaserFire());
    EventBus.on("shield_activated", () => this.playShieldActivate());
  }

  /** ブロックヒット: 短い矩形波パルス（タイプで音高変化） */
  playBlockHit(data) {
    if (!this.isInitialized) return;
    const t = this.audioContext.currentTime;
    const typeOffset = data && data.blockType ? data.blockType * 100 : 0;
    const freq = 400 + typeOffset;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /** ブロック破壊: 下降スイープ + ノイズバースト */
  playBlockDestroyed(data) {
    if (!this.isInitialized) return;
    const t = this.audioContext.currentTime;
    const typeOffset = data && data.blockType ? data.blockType * 50 : 0;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(600 + typeOffset, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);

    this.playNoiseBurst(t, 0.08, 0.15);
  }

  /** パドルヒット: 軽いクリック音 */
  playPaddleHit() {
    if (!this.isInitialized) return;
    const t = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.03);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  /** パワーアップ取得: 上昇アルペジオ（3音） */
  playPowerupCollected() {
    if (!this.isInitialized) return;
    const t = this.audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const start = t + i * 0.08;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.12);
    });
  }

  /** ボールロスト: 長めの下降スイープ */
  playBallLost() {
    if (!this.isInitialized) return;
    const t = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.5);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  /** 壁ヒット: 軽いタップ音 */
  playWallHit() {
    if (!this.isInitialized) return;
    const t = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, t);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  /** コンボマイルストーン: 3,5,10 で異なるファンファーレ */
  playComboMilestone(data) {
    if (!this.isInitialized || !data) return;
    const combo = data.combo || 0;
    let notes = null;

    if (combo === 10) {
      notes = [523.25, 659.25, 783.99, 1046.5];
    } else if (combo === 5) {
      notes = [523.25, 659.25, 783.99];
    } else if (combo === 3) {
      notes = [523.25, 659.25];
    }

    if (!notes) return;
    const t = this.audioContext.currentTime;

    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const start = t + i * 0.06;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.15);
    });
  }

  /** 爆発: ノイズ + 低周波バースト */
  playExplosion() {
    if (!this.isInitialized) return;
    const t = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.3);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);

    this.playNoiseBurst(t, 0.3, 0.25);
  }

  /** レーザー発射: 高周波パルス */
  playLaserFire() {
    if (!this.isInitialized) return;
    const t = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /** シールド起動: 上昇シンセパッド */
  playShieldActivate() {
    if (!this.isInitialized) return;
    const t = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.3);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.1);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  /** ノイズバースト（汎用） */
  playNoiseBurst(startTime, duration, vol) {
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate,
    );
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      channelData[i] = Math.random() * 2 - 1;
    }

    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    source.connect(gain);
    gain.connect(this.masterGain);
    source.start(startTime);
    source.stop(startTime + duration);
  }

  /** 音量設定 */
  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    this.updateVolume();
  }

  /** ミュート切り替え */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.updateVolume();
    return this.isMuted;
  }

  /** マスターゲイン更新 */
  updateVolume() {
    if (!this.masterGain) return;
    const val = this.isMuted ? 0 : this.volume;
    this.masterGain.gain.setValueAtTime(val, this.audioContext.currentTime);
  }

  /** システム破棄 */
  destroy() {
    this.isInitialized = false;
  }
}

export default AudioSystem;
