import EventBus from "./EventBus.js";
import { GAME } from "../config/constants.js";

/**
 * GameLoop - requestAnimationFrame + delta time ベースのゲームループ
 * 60fps目標。start/stop/pause/resume をサポート。
 */
class GameLoop {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.animationId = null;

    // タイミング管理
    this.lastFrameTime = null;
    this.deltaTime = 0;
    this.accumulator = 0;

    // 更新・描画コールバック（priority順）
    this.updateCallbacks = [];
    this.renderCallbacks = [];

    // 統計
    this.stats = {
      totalFrames: 0,
      skippedFrames: 0,
      startTime: 0,
    };

    this.setupVisibilityHandler();
  }

  /**
   * ページ可視性変更の監視
   */
  setupVisibilityHandler() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pause();
        EventBus.emit("game_focus_lost");
      } else {
        this.resume();
        EventBus.emit("game_focus_gained");
      }
    });
  }

  /**
   * ゲームループ開始
   */
  start() {
    if (this.isRunning) {
      console.warn("[GameLoop] Already running");
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = null;
    this.accumulator = 0;
    this.stats.startTime = Date.now();
    this.stats.totalFrames = 0;
    this.stats.skippedFrames = 0;

    console.log("[GameLoop] Started");
    EventBus.emit("game_loop_start");

    this.animationId = requestAnimationFrame((time) => this.loop(time));
  }

  /**
   * ゲームループ停止
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.isPaused = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    console.log("[GameLoop] Stopped");
    EventBus.emit("game_loop_stop");
  }

  /**
   * 一時停止
   */
  pause() {
    if (!this.isRunning || this.isPaused) return;

    this.isPaused = true;
    console.log("[GameLoop] Paused");
    EventBus.emit("game_loop_pause");
  }

  /**
   * 再開
   */
  resume() {
    if (!this.isRunning || !this.isPaused) return;

    this.isPaused = false;
    this.lastFrameTime = null;
    console.log("[GameLoop] Resumed");
    EventBus.emit("game_loop_resume");
  }

  /**
   * メインループ
   * @param {number} currentTime - requestAnimationFrame のタイムスタンプ
   */
  loop(currentTime) {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame((time) => this.loop(time));

    // 一時停止中はレンダリングのみ
    if (this.isPaused) {
      this.lastFrameTime = currentTime;
      this.executeRender(0);
      return;
    }

    // deltaTime 計算
    if (this.lastFrameTime === null) {
      this.lastFrameTime = currentTime;
      this.deltaTime = 0;
    } else {
      this.deltaTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;
    }

    // 異常に大きな deltaTime をクランプ
    if (this.deltaTime > GAME.MAX_FRAME_TIME) {
      this.deltaTime = GAME.MAX_FRAME_TIME;
      this.stats.skippedFrames++;
    }

    // 固定タイムステップでの更新
    this.accumulator += this.deltaTime;

    let updateCount = 0;
    while (
      this.accumulator >= GAME.FIXED_TIME_STEP &&
      updateCount < GAME.MAX_UPDATES_PER_FRAME
    ) {
      this.executeUpdate(GAME.FIXED_TIME_STEP);
      this.accumulator -= GAME.FIXED_TIME_STEP;
      updateCount++;
    }

    // スパイラルオブデス回避
    if (updateCount >= GAME.MAX_UPDATES_PER_FRAME) {
      this.accumulator = 0;
      this.stats.skippedFrames++;
    }

    // レンダリング（補間値付き）
    const alpha = this.accumulator / GAME.FIXED_TIME_STEP;
    this.executeRender(alpha);

    this.stats.totalFrames++;
  }

  /**
   * 登録された更新コールバックを実行
   * @param {number} deltaTime
   */
  executeUpdate(deltaTime) {
    this.updateCallbacks.forEach((item) => {
      try {
        item.callback(deltaTime);
      } catch (error) {
        console.error("[GameLoop] Update error:", error);
      }
    });

    EventBus.emit("game_update", { deltaTime });
  }

  /**
   * 登録されたレンダリングコールバックを実行
   * @param {number} alpha - 補間値 (0-1)
   */
  executeRender(alpha) {
    this.renderCallbacks.forEach((item) => {
      try {
        item.callback(alpha);
      } catch (error) {
        console.error("[GameLoop] Render error:", error);
      }
    });

    EventBus.emit("game_render", { alpha });
  }

  /**
   * 更新コールバックを追加
   * @param {Function} callback
   * @param {number} priority - 小さいほど先に実行
   */
  addUpdateCallback(callback, priority = 0) {
    this.updateCallbacks.push({ callback, priority });
    this.updateCallbacks.sort((a, b) => a.priority - b.priority);
  }

  /**
   * レンダリングコールバックを追加
   * @param {Function} callback
   * @param {number} priority - 小さいほど先に実行
   */
  addRenderCallback(callback, priority = 0) {
    this.renderCallbacks.push({ callback, priority });
    this.renderCallbacks.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 更新コールバックを削除
   * @param {Function} callback
   */
  removeUpdateCallback(callback) {
    this.updateCallbacks = this.updateCallbacks.filter(
      (item) => item.callback !== callback,
    );
  }

  /**
   * レンダリングコールバックを削除
   * @param {Function} callback
   */
  removeRenderCallback(callback) {
    this.renderCallbacks = this.renderCallbacks.filter(
      (item) => item.callback !== callback,
    );
  }

  /**
   * パフォーマンス統計を取得
   * @returns {Object}
   */
  getStats() {
    const runTime = Date.now() - this.stats.startTime;
    return {
      ...this.stats,
      runTime,
      averageFPS: runTime > 0 ? this.stats.totalFrames / (runTime / 1000) : 0,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
    };
  }
}

export default GameLoop;
