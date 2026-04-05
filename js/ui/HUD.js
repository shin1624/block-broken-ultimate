import EventBus from "../core/EventBus.js";
import { CANVAS, COLORS, STATES } from "../config/constants.js";

/**
 * HUD - ヘッドアップディスプレイ
 * スコア、レベル、ライフ（ハートアイコン）、コンボ倍率表示
 */
class HUD {
  constructor() {
    this.visible = false;
    this.score = 0;
    this.displayScore = 0;
    this.level = 1;
    this.lives = 3;
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.comboTimerRatio = 0;
    this.activeEffects = [];

    EventBus.on("state_changed", (data) => {
      this.visible = data.to === STATES.PLAYING;
    });

    EventBus.on("score_updated", (data) => {
      this.score = data.score;
    });

    EventBus.on("lives_updated", (data) => {
      this.lives = data.lives;
    });

    EventBus.on("level_loaded", (data) => {
      this.level = data.level;
    });

    EventBus.on("combo_updated", (data) => {
      this.comboCount = data.count;
      this.comboMultiplier = data.multiplier;
    });

    EventBus.on("combo_reset", () => {
      this.comboCount = 0;
      this.comboMultiplier = 1;
    });
  }

  /**
   * コンボタイマー比率を設定（外部から呼ぶ）
   * @param {number} ratio - 0-1
   */
  setComboTimerRatio(ratio) {
    this.comboTimerRatio = ratio;
  }

  /**
   * アクティブエフェクト一覧を設定（外部から呼ぶ）
   * @param {Array} effects
   */
  setActiveEffects(effects) {
    this.activeEffects = effects;
  }

  /**
   * 毎フレーム更新
   * @param {number} dt
   */
  update(dt) {
    if (!this.visible) return;
    // スコアカウントアップアニメーション
    if (this.displayScore < this.score) {
      const diff = this.score - this.displayScore;
      this.displayScore += Math.ceil(diff * 0.15);
      if (this.displayScore > this.score) this.displayScore = this.score;
    }
  }

  /**
   * 描画
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (!this.visible) return;

    // 上部バー背景
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, CANVAS.WIDTH, 40);

    ctx.textBaseline = "middle";

    // スコア（左）
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = "bold 16px monospace";
    ctx.fillText(`SCORE: ${this.displayScore}`, 15, 20);

    // レベル（中央）
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.WARNING;
    ctx.font = "bold 14px monospace";
    ctx.fillText(`LEVEL ${this.level}`, CANVAS.WIDTH / 2, 20);

    // ライフ（右）
    this.renderLives(ctx);

    // コンボ表示
    if (this.comboCount >= 2) {
      this.renderCombo(ctx);
    }

    // アクティブパワーアップ表示
    this.renderActiveEffects(ctx);
  }

  /**
   * ライフ（ハートアイコン）描画
   */
  renderLives(ctx) {
    const startX = CANVAS.WIDTH - 20;
    const y = 20;
    const heartSize = 10;

    for (let i = 0; i < this.lives; i++) {
      const x = startX - i * 25;
      this.drawHeart(ctx, x, y, heartSize);
    }
  }

  /**
   * ハートアイコン描画
   */
  drawHeart(ctx, x, y, size) {
    ctx.fillStyle = COLORS.ACCENT;
    ctx.beginPath();
    const topY = y - size * 0.4;
    ctx.moveTo(x, topY + size * 0.3);
    ctx.bezierCurveTo(x, topY, x - size, topY, x - size, topY + size * 0.3);
    ctx.bezierCurveTo(
      x - size,
      topY + size * 0.7,
      x,
      topY + size,
      x,
      topY + size * 1.2,
    );
    ctx.bezierCurveTo(
      x,
      topY + size,
      x + size,
      topY + size * 0.7,
      x + size,
      topY + size * 0.3,
    );
    ctx.bezierCurveTo(x + size, topY, x, topY, x, topY + size * 0.3);
    ctx.fill();
  }

  /**
   * コンボ表示描画
   */
  renderCombo(ctx) {
    const x = CANVAS.WIDTH / 2;
    const y = 55;

    // コンボテキスト
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (this.comboMultiplier >= 3) {
      ctx.shadowColor = COLORS.WARNING;
      ctx.shadowBlur = 10;
    }

    ctx.fillStyle =
      this.comboMultiplier >= 5
        ? "#ff0066"
        : this.comboMultiplier >= 3
          ? COLORS.WARNING
          : COLORS.TEXT_PRIMARY;
    ctx.font = `bold ${14 + this.comboMultiplier * 2}px monospace`;
    ctx.fillText(`${this.comboCount} COMBO x${this.comboMultiplier}`, x, y);
    ctx.shadowBlur = 0;

    // コンボタイマーバー
    if (this.comboTimerRatio > 0) {
      const barWidth = 120;
      const barHeight = 3;
      const barX = x - barWidth / 2;
      const barY = y + 14;

      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(barX, barY, barWidth, barHeight);

      ctx.fillStyle = COLORS.WARNING;
      ctx.fillRect(barX, barY, barWidth * this.comboTimerRatio, barHeight);
    }
  }

  /**
   * アクティブパワーアップ描画
   */
  renderActiveEffects(ctx) {
    if (this.activeEffects.length === 0) return;

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "11px monospace";

    for (let i = 0; i < this.activeEffects.length; i++) {
      const effect = this.activeEffects[i];
      const x = 15;
      const y = CANVAS.HEIGHT - 20 - i * 18;
      const secs = Math.ceil(effect.remaining / 1000);

      ctx.fillStyle = "rgba(0, 255, 136, 0.7)";
      ctx.fillText(`[${effect.type}] ${secs}s`, x, y);
    }
  }
}

export default HUD;
