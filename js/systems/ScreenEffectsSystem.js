import EventBus from "../core/EventBus.js";
import { CANVAS, COLORS } from "../config/constants.js";

/**
 * ScreenEffectsSystem - 画面フラッシュ、グロウ、花火エフェクト
 */
class ScreenEffectsSystem {
  constructor(particleSystem) {
    this.particleSystem = particleSystem;
    this.glowEffects = [];
    this.fireworks = [];
    this.fireworkTimer = 0;
    this.fireworkActive = false;

    EventBus.on("block_destroyed", (data) => {
      if (data.type === "explosive") {
        EventBus.emit("screen_flash", {
          color: "#ff4400",
          alpha: 0.4,
          duration: 150,
        });
      }
    });

    EventBus.on("combo_updated", (data) => {
      if (data.count >= 10) {
        this.addGlow(COLORS.WARNING, 0.3, 500);
      } else if (data.count >= 5) {
        this.addGlow(COLORS.WARNING, 0.15, 300);
      }
    });

    EventBus.on("level_cleared", () => {
      this.startFireworks();
    });

    EventBus.on("powerup_collected", () => {
      EventBus.emit("screen_flash", {
        color: "#00ff88",
        alpha: 0.2,
        duration: 80,
      });
    });

    EventBus.on("ball_lost", () => {
      EventBus.emit("screen_flash", {
        color: "#ff0000",
        alpha: 0.3,
        duration: 200,
      });
    });
  }

  /**
   * グローエフェクトを追加
   * @param {string} color
   * @param {number} intensity - 0-1
   * @param {number} duration - ms
   */
  addGlow(color, intensity, duration) {
    this.glowEffects.push({
      color,
      intensity,
      duration,
      elapsed: 0,
    });
  }

  /**
   * 花火を開始
   */
  startFireworks() {
    this.fireworkActive = true;
    this.fireworkTimer = 0;
    this.fireworks = [];

    // 5発の花火をスケジュール
    for (let i = 0; i < 5; i++) {
      this.fireworks.push({
        x: 100 + Math.random() * (CANVAS.WIDTH - 200),
        y: 100 + Math.random() * 200,
        delay: i * 400,
        fired: false,
      });
    }
  }

  /**
   * 毎フレーム更新
   * @param {number} dt
   */
  update(dt) {
    // グローエフェクト更新
    for (let i = this.glowEffects.length - 1; i >= 0; i--) {
      this.glowEffects[i].elapsed += dt;
      if (this.glowEffects[i].elapsed >= this.glowEffects[i].duration) {
        this.glowEffects.splice(i, 1);
      }
    }

    // 花火更新
    if (this.fireworkActive) {
      this.fireworkTimer += dt;
      let allFired = true;

      for (let i = 0; i < this.fireworks.length; i++) {
        const fw = this.fireworks[i];
        if (!fw.fired && this.fireworkTimer >= fw.delay) {
          fw.fired = true;
          this.particleSystem.emitFirework(fw.x, fw.y);
          EventBus.emit("screen_flash", {
            color: "#ffffff",
            alpha: 0.15,
            duration: 80,
          });
        }
        if (!fw.fired) allFired = false;
      }

      if (allFired && this.fireworkTimer > 2500) {
        this.fireworkActive = false;
      }
    }
  }

  /**
   * 描画（グローオーバーレイ）
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    for (let i = 0; i < this.glowEffects.length; i++) {
      const glow = this.glowEffects[i];
      const progress = glow.elapsed / glow.duration;
      const alpha = glow.intensity * (1 - progress);

      ctx.fillStyle = glow.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
      ctx.globalAlpha = 1;
    }
  }

  /**
   * クリア
   */
  clear() {
    this.glowEffects = [];
    this.fireworks = [];
    this.fireworkActive = false;
  }
}

export default ScreenEffectsSystem;
