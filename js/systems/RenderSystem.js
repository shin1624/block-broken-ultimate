import { CANVAS, COLORS } from "../config/constants.js";
import EventBus from "../core/EventBus.js";

/**
 * RenderSystem - Canvas描画統括
 * 背景、エンティティ、エフェクト描画順序管理
 */
class RenderSystem {
  constructor(ctx) {
    this.ctx = ctx;
    this.renderLayers = [];
    this.screenFlash = null;
    this.shieldActive = false;
    this.shieldY = 0;

    EventBus.on("screen_flash", (data) => {
      this.screenFlash = {
        color: data.color || "#ffffff",
        alpha: data.alpha || 0.5,
        duration: data.duration || 100,
        elapsed: 0,
      };
    });

    EventBus.on("shield_activated", (data) => {
      this.shieldActive = true;
      this.shieldY = data.y;
    });
    EventBus.on("shield_deactivated", () => {
      this.shieldActive = false;
    });
  }

  /**
   * レンダリングレイヤーを追加
   * @param {Function} renderFn - (ctx) => void
   * @param {number} zOrder - 描画順序（小さいほど先に描画）
   * @param {string} name - レイヤー名
   */
  addLayer(renderFn, zOrder = 0, name = "") {
    this.renderLayers.push({ renderFn, zOrder, name });
    this.renderLayers.sort((a, b) => a.zOrder - b.zOrder);
  }

  /**
   * レイヤーを削除
   * @param {string} name
   */
  removeLayer(name) {
    this.renderLayers = this.renderLayers.filter((l) => l.name !== name);
  }

  /**
   * 毎フレーム描画
   * @param {number} dt
   */
  update(dt) {
    const ctx = this.ctx;

    // 背景クリア
    ctx.fillStyle = CANVAS.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // 背景グリッド（薄い装飾）
    this.renderBackgroundGrid(ctx);

    // 各レイヤー描画
    for (let i = 0; i < this.renderLayers.length; i++) {
      this.renderLayers[i].renderFn(ctx);
    }

    // シールド描画
    if (this.shieldActive) {
      this.renderShield(ctx);
    }

    // 画面フラッシュ
    if (this.screenFlash) {
      this.renderFlash(ctx, dt);
    }
  }

  /**
   * 背景グリッド描画
   */
  renderBackgroundGrid(ctx) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
    ctx.lineWidth = 1;
    const gridSize = 40;

    for (let x = 0; x < CANVAS.WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS.HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS.HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS.WIDTH, y);
      ctx.stroke();
    }
  }

  /**
   * シールド描画
   */
  renderShield(ctx) {
    ctx.strokeStyle = COLORS.ACCENT;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLORS.ACCENT;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, this.shieldY);
    ctx.lineTo(CANVAS.WIDTH, this.shieldY);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /**
   * 画面フラッシュ描画
   */
  renderFlash(ctx, dt) {
    const flash = this.screenFlash;
    flash.elapsed += dt;

    const progress = flash.elapsed / flash.duration;
    if (progress >= 1) {
      this.screenFlash = null;
      return;
    }

    const alpha = flash.alpha * (1 - progress);
    ctx.fillStyle = flash.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    ctx.globalAlpha = 1;
  }
}

export default RenderSystem;
