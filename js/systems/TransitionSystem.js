import EventBus from "../core/EventBus.js";
import { CANVAS } from "../config/constants.js";

/**
 * TransitionSystem - 画面遷移アニメーション（フェードイン/アウト）
 */
class TransitionSystem {
  constructor() {
    this.active = false;
    this.type = "none";
    this.progress = 0;
    this.duration = 400;
    this.phase = "none";
    this.onMidpoint = null;
    this.onComplete = null;
    this.color = "#000000";

    EventBus.on("transition_start", (data) => {
      this.startTransition(data);
    });
  }

  /**
   * 遷移を開始
   * @param {Object} config
   * @param {string} config.type - "fade", "wipe", "circle"
   * @param {number} config.duration - 総時間(ms)
   * @param {Function} config.onMidpoint - 折り返し時点でのコールバック
   * @param {Function} config.onComplete - 完了時のコールバック
   * @param {string} config.color - 遷移色
   */
  startTransition(config) {
    this.active = true;
    this.type = config.type || "fade";
    this.duration = config.duration || 400;
    this.progress = 0;
    this.phase = "out";
    this.onMidpoint = config.onMidpoint || null;
    this.onComplete = config.onComplete || null;
    this.color = config.color || "#000000";

    EventBus.emit("transition_began", { type: this.type });
  }

  /**
   * 毎フレーム更新
   * @param {number} dt
   */
  update(dt) {
    if (!this.active) return;

    this.progress += dt / this.duration;

    if (this.phase === "out" && this.progress >= 0.5) {
      this.phase = "in";
      if (this.onMidpoint) {
        this.onMidpoint();
        this.onMidpoint = null;
      }
    }

    if (this.progress >= 1) {
      this.active = false;
      this.phase = "none";
      this.progress = 0;

      if (this.onComplete) {
        this.onComplete();
        this.onComplete = null;
      }

      EventBus.emit("transition_ended", { type: this.type });
    }
  }

  /**
   * 描画
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (!this.active) return;

    switch (this.type) {
      case "fade":
        this.renderFade(ctx);
        break;
      case "wipe":
        this.renderWipe(ctx);
        break;
      case "circle":
        this.renderCircle(ctx);
        break;
    }
  }

  /**
   * フェード遷移
   */
  renderFade(ctx) {
    let alpha;
    if (this.phase === "out") {
      alpha = this.progress * 2;
    } else {
      alpha = 2 - this.progress * 2;
    }
    alpha = Math.max(0, Math.min(1, alpha));

    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    ctx.globalAlpha = 1;
  }

  /**
   * ワイプ遷移
   */
  renderWipe(ctx) {
    let width;
    if (this.phase === "out") {
      width = this.progress * 2 * CANVAS.WIDTH;
    } else {
      width = (2 - this.progress * 2) * CANVAS.WIDTH;
    }
    width = Math.max(0, Math.min(CANVAS.WIDTH, width));

    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, width, CANVAS.HEIGHT);
  }

  /**
   * 円形遷移
   */
  renderCircle(ctx) {
    const cx = CANVAS.WIDTH / 2;
    const cy = CANVAS.HEIGHT / 2;
    const maxRadius = Math.sqrt(cx * cx + cy * cy);

    let radius;
    if (this.phase === "out") {
      radius = maxRadius * (1 - this.progress * 2);
    } else {
      radius = maxRadius * (this.progress * 2 - 1);
    }
    radius = Math.max(0, radius);

    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    if (radius > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * 遷移中かどうか
   * @returns {boolean}
   */
  isActive() {
    return this.active;
  }
}

export default TransitionSystem;
