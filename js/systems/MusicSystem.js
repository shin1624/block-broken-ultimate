import EventBus from "../core/EventBus.js";
import MusicSequencer from "./MusicSequencer.js";
import { PROGRESSION_CONFIG } from "./MusicScales.js";

/**
 * MusicSystem - 5レイヤー動的音楽システム
 * ゲーム状況に応じて tempo/intensity/tension/progression が変化し、
 * MusicSequencer が Bass/Melody/Harmony/Percussion/Ambient を同時再生する。
 */
class MusicSystem {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.sequencer = null;
    this.isInitialized = false;
    this.isPlaying = false;
    this.volume = 0.3;
    this.isMuted = false;

    this.musicState = {
      tempo: 120,
      intensity: 0.5,
      tension: 0.0,
      progression: "peaceful",
      scale: "major",
      percPattern: "basic",
    };

    this.tensionDecayTimers = [];
    this.setupEventListeners();
  }

  /**
   * AudioContext を受け取って初期化
   * @param {AudioContext} audioContext
   */
  initialize(audioContext) {
    if (this.isInitialized) return;

    this.audioContext = audioContext;
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.updateVolume();

    this.sequencer = new MusicSequencer(this.audioContext, this.masterGain);
    this.isInitialized = true;
  }

  /** EventBus リスナー登録 */
  setupEventListeners() {
    EventBus.on("state_changed", (data) =>
      this.handleStateChange(data.from, data.to),
    );
    EventBus.on("block_destroyed", () => this.onBlockDestroyed());
    EventBus.on("ball_lost", () => this.onBallLost());
    EventBus.on("combo_updated", (data) => this.onComboUpdated(data));
    EventBus.on("level_complete", () => this.setProgression("victory"));
    EventBus.on("game_over", () => this.onGameOver());
    EventBus.on("blocks_progress", (data) => this.onBlocksProgress(data));
  }

  /** 状態遷移ハンドラ */
  handleStateChange(from, to) {
    switch (to) {
      case "title":
        this.applyProgression("peaceful");
        this.startMusic();
        break;
      case "playing":
        this.applyProgression("action");
        if (!this.isPlaying) this.startMusic();
        break;
      case "paused":
        this.pauseMusic();
        break;
      case "gameover":
        this.onGameOver();
        break;
      case "levelcomplete":
        this.setProgression("victory");
        break;
    }

    if (from === "paused" && to === "playing") {
      this.resumeMusic();
    }
  }

  /** 音楽再生開始 */
  startMusic() {
    if (!this.isInitialized || this.isPlaying) return;
    this.isPlaying = true;
    this.sequencer.start(this.musicState);
  }

  /** 一時停止 */
  pauseMusic() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.sequencer.stop();
  }

  /** 再開 */
  resumeMusic() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.sequencer.start(this.musicState);
  }

  /** 完全停止 */
  stopMusic() {
    this.isPlaying = false;
    if (this.sequencer) this.sequencer.stop();
    this.clearTensionTimers();
  }

  /** Progression を切り替え、関連パラメータを適用 */
  setProgression(name) {
    this.applyProgression(name);
  }

  /** Progression 設定の内部適用 */
  applyProgression(name) {
    const cfg = PROGRESSION_CONFIG[name];
    if (!cfg) return;

    this.musicState.progression = name;
    this.musicState.scale = cfg.scale;
    this.musicState.percPattern = cfg.rhythmPattern;
    this.musicState.tempo =
      cfg.tempoRange[0] +
      (cfg.tempoRange[1] - cfg.tempoRange[0]) * this.musicState.intensity;
  }

  /** ブロック破壊 -> tension 微増 */
  onBlockDestroyed() {
    this.addTension(0.02);
  }

  /** ボールロスト -> tension 急上昇、tempo 微減 */
  onBallLost() {
    this.addTension(0.15);
    this.musicState.tempo = Math.max(100, this.musicState.tempo - 5);
  }

  /** コンボ更新 -> intensity 上昇、パーカッションパターン変更 */
  onComboUpdated(data) {
    if (!data) return;
    const combo = data.combo || 0;
    this.musicState.intensity = Math.min(1, 0.4 + combo * 0.05);
    this.applyProgression(this.musicState.progression);

    if (combo >= 10) {
      this.musicState.percPattern = "complex";
    } else if (combo >= 5) {
      this.musicState.percPattern = "driving";
    }
  }

  /** ブロック残数による progression 自動切替 */
  onBlocksProgress(data) {
    if (!data) return;
    const ratio = data.remaining / Math.max(data.total, 1);
    if (ratio <= 0.2) {
      this.applyProgression("intense");
    } else if (ratio <= 0.5) {
      this.applyProgression("action");
    }
  }

  /** ゲームオーバー -> defeat + フェードアウト */
  onGameOver() {
    this.applyProgression("defeat");
    this.fadeOut(3000);
  }

  /** tension を加算し、2秒後に同量減衰 */
  addTension(amount) {
    this.musicState.tension = Math.min(1, this.musicState.tension + amount);
    const timer = setTimeout(() => {
      this.musicState.tension = Math.max(0, this.musicState.tension - amount);
    }, 2000);
    this.tensionDecayTimers.push(timer);
  }

  /** tension タイマーをクリア */
  clearTensionTimers() {
    this.tensionDecayTimers.forEach((t) => clearTimeout(t));
    this.tensionDecayTimers = [];
  }

  /** フェードアウト */
  fadeOut(durationMs) {
    if (!this.masterGain) return;
    const now = this.audioContext.currentTime;
    this.masterGain.gain.linearRampToValueAtTime(0, now + durationMs / 1000);
    setTimeout(() => this.stopMusic(), durationMs);
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

  /** 統計取得 */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      volume: this.volume,
      isMuted: this.isMuted,
      activeOscillators: this.sequencer ? this.sequencer.oscillators.size : 0,
      musicState: { ...this.musicState },
    };
  }

  /** システム破棄 */
  destroy() {
    this.stopMusic();
    this.clearTensionTimers();
    this.isInitialized = false;
  }
}

export default MusicSystem;
