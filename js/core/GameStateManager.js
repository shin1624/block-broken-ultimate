import EventBus from "./EventBus.js";
import { STATES } from "../config/constants.js";

/**
 * GameStateManager - ゲーム状態遷移管理
 * TITLE, PLAYING, PAUSED, GAMEOVER, LEVELCOMPLETE の状態を管理し、
 * EventBus 経由で state_changed イベントを発火する。
 */
class GameStateManager {
  constructor() {
    this.currentState = STATES.TITLE;
    this.previousState = null;
    this.stateStartTime = Date.now();
    this.stateHistory = [];
    this.maxHistorySize = 50;
    this.debug = true;

    // 状態固有データ
    this.stateData = new Map();
    this.initializeStateData();

    // 許可される状態遷移の定義
    this.allowedTransitions = {
      [STATES.TITLE]: [STATES.PLAYING],
      [STATES.PLAYING]: [STATES.PAUSED, STATES.GAMEOVER, STATES.LEVELCOMPLETE],
      [STATES.PAUSED]: [STATES.PLAYING, STATES.TITLE],
      [STATES.GAMEOVER]: [STATES.TITLE, STATES.PLAYING],
      [STATES.LEVELCOMPLETE]: [STATES.PLAYING, STATES.TITLE],
    };

    if (this.debug) {
      console.log(
        "[GameStateManager] Initialized with state:",
        this.currentState,
      );
    }
  }

  /**
   * 状態固有データの初期化
   */
  initializeStateData() {
    this.stateData.set(STATES.TITLE, {});
    this.stateData.set(STATES.PLAYING, { score: 0, lives: 3, level: 1 });
    this.stateData.set(STATES.PAUSED, { pausedAt: 0 });
    this.stateData.set(STATES.GAMEOVER, {
      finalScore: 0,
      reason: "lives_depleted",
    });
    this.stateData.set(STATES.LEVELCOMPLETE, { nextLevel: 1, bonus: 0 });
  }

  /**
   * 状態を変更する
   * @param {string} newState - 新しい状態（STATES の値）
   * @param {Object} data - 状態固有のデータ（省略可）
   * @returns {boolean} 遷移が成功したか
   */
  setState(newState, data = {}) {
    if (!Object.values(STATES).includes(newState)) {
      console.error(`[GameStateManager] Invalid state: ${newState}`);
      return false;
    }

    if (!this.canTransitionTo(newState)) {
      console.warn(
        `[GameStateManager] Invalid transition: ${this.currentState} -> ${newState}`,
      );
      return false;
    }

    const from = this.currentState;
    const timestamp = Date.now();

    // 履歴に記録
    this.stateHistory.push({
      from,
      to: newState,
      timestamp,
      duration: timestamp - this.stateStartTime,
    });
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }

    // 退出処理
    this.onExit(from);

    // 状態更新
    this.previousState = from;
    this.currentState = newState;
    this.stateStartTime = timestamp;

    // 状態固有データをマージ
    if (Object.keys(data).length > 0) {
      const existing = this.stateData.get(newState) || {};
      this.stateData.set(newState, { ...existing, ...data });
    }

    // 入場処理
    this.onEnter(newState);

    // EventBus に state_changed を発火
    EventBus.emit("state_changed", {
      from,
      to: newState,
      data: this.getStateData(newState),
      timestamp,
    });

    if (this.debug) {
      console.log(`[GameStateManager] ${from} -> ${newState}`, data);
    }

    return true;
  }

  /**
   * 指定状態への遷移が許可されているか
   * @param {string} newState
   * @returns {boolean}
   */
  canTransitionTo(newState) {
    const allowed = this.allowedTransitions[this.currentState];
    return allowed ? allowed.includes(newState) : false;
  }

  /**
   * 状態入場時の処理
   * @param {string} state
   */
  onEnter(state) {
    switch (state) {
      case STATES.PLAYING:
        EventBus.emit("game_start");
        break;
      case STATES.PAUSED:
        EventBus.emit("game_pause");
        break;
      case STATES.GAMEOVER:
        EventBus.emit("game_over", this.getStateData(state));
        break;
      case STATES.LEVELCOMPLETE:
        EventBus.emit("level_complete", this.getStateData(state));
        break;
    }
  }

  /**
   * 状態退出時の処理
   * @param {string} state
   */
  onExit(state) {
    if (state === STATES.PAUSED) {
      EventBus.emit("game_resume");
    }
  }

  /**
   * 現在の状態を取得
   * @returns {string}
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * 前の状態を取得
   * @returns {string|null}
   */
  getPreviousState() {
    return this.previousState;
  }

  /**
   * 状態固有データを取得
   * @param {string} state - 状態（省略時は現在の状態）
   * @returns {Object}
   */
  getStateData(state = this.currentState) {
    return this.stateData.get(state) || {};
  }

  /**
   * 状態固有データを更新
   * @param {string} state
   * @param {Object} data
   */
  setStateData(state, data) {
    const existing = this.stateData.get(state) || {};
    this.stateData.set(state, { ...existing, ...data });

    if (state === this.currentState) {
      EventBus.emit("state_data_changed", {
        state,
        data: this.getStateData(state),
      });
    }
  }

  /**
   * 特定の状態かチェック
   * @param {string|string[]} states
   * @returns {boolean}
   */
  isState(states) {
    if (Array.isArray(states)) {
      return states.includes(this.currentState);
    }
    return this.currentState === states;
  }

  /**
   * 状態履歴を取得
   * @returns {Object[]}
   */
  getHistory() {
    return [...this.stateHistory];
  }

  /**
   * 現在状態の継続時間（ms）
   * @returns {number}
   */
  getStateDuration() {
    return Date.now() - this.stateStartTime;
  }

  /**
   * リセット（タイトル画面に戻す）
   */
  reset() {
    this.currentState = STATES.TITLE;
    this.previousState = null;
    this.stateStartTime = Date.now();
    this.stateHistory = [];
    this.initializeStateData();

    EventBus.emit("state_changed", {
      from: null,
      to: STATES.TITLE,
      data: {},
      timestamp: Date.now(),
    });

    if (this.debug) {
      console.log("[GameStateManager] Reset to TITLE");
    }
  }
}

export default GameStateManager;
