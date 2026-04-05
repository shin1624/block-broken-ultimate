import EventBus from "../core/EventBus.js";

/**
 * ComboSystem - 連続破壊カウント、3秒タイムアウト、スコア倍率計算
 */
class ComboSystem {
  constructor() {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboTimeout = 3000;
    this.maxCombo = 0;

    EventBus.on("block_destroyed", () => {
      this.incrementCombo();
    });
  }

  /**
   * コンボをインクリメント
   */
  incrementCombo() {
    this.comboCount++;
    this.comboTimer = this.comboTimeout;

    if (this.comboCount > this.maxCombo) {
      this.maxCombo = this.comboCount;
    }

    EventBus.emit("combo_updated", {
      count: this.comboCount,
      multiplier: this.getMultiplier(),
    });
  }

  /**
   * コンボ倍率を計算
   * @returns {number}
   */
  getMultiplier() {
    if (this.comboCount >= 10) return 5;
    if (this.comboCount >= 5) return 3;
    if (this.comboCount >= 3) return 2;
    return 1;
  }

  /**
   * 毎フレーム更新
   * @param {number} dt
   */
  update(dt) {
    if (this.comboCount === 0) return;

    this.comboTimer -= dt;
    if (this.comboTimer <= 0) {
      this.resetCombo();
    }
  }

  /**
   * コンボをリセット
   */
  resetCombo() {
    if (this.comboCount === 0) return;

    const prevCount = this.comboCount;
    this.comboCount = 0;
    this.comboTimer = 0;

    EventBus.emit("combo_reset", {
      previousCount: prevCount,
      maxCombo: this.maxCombo,
    });
  }

  /**
   * 現在のコンボ数を取得
   * @returns {number}
   */
  getComboCount() {
    return this.comboCount;
  }

  /**
   * 最大コンボを取得
   * @returns {number}
   */
  getMaxCombo() {
    return this.maxCombo;
  }

  /**
   * 残りタイマーの割合（0-1）
   * @returns {number}
   */
  getTimerRatio() {
    if (this.comboCount === 0) return 0;
    return Math.max(0, this.comboTimer / this.comboTimeout);
  }

  /**
   * 全リセット
   */
  reset() {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
  }
}

export default ComboSystem;
