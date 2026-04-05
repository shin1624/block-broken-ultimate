import EventBus from "../core/EventBus.js";
import { ParticlePool } from "../entities/Particle.js";
import { COLORS } from "../config/constants.js";

/**
 * ParticleSystem - パーティクル生成・更新・描画、オブジェクトプール管理
 */
class ParticleSystem {
  constructor() {
    this.pool = new ParticlePool(500);

    EventBus.on("block_destroyed", (data) => {
      this.emitBlockDestroy(data.x, data.y, data.type);
    });

    EventBus.on("block_explode", (data) => {
      this.emitExplosion(data.x, data.y);
    });

    EventBus.on("ball_paddle_hit", (data) => {
      this.emitPaddleHit(data.x, data.y);
    });

    EventBus.on("powerup_collected", (data) => {
      this.emitPowerUpCollect(data.x, data.y);
    });

    EventBus.on("combo_updated", (data) => {
      if (data.count >= 5) {
        this.emitComboFlare(data.count);
      }
    });
  }

  /**
   * ブロック破壊パーティクル
   */
  emitBlockDestroy(x, y, type) {
    const count = type === "explosive" ? 30 : 12;
    const colors = this.getBlockColors(type);

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 3;
      this.pool.acquire({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3,
        maxLife: 500 + Math.random() * 300,
        gravity: 0.03,
        shape: Math.random() > 0.5 ? "square" : "circle",
      });
    }
  }

  /**
   * 爆発パーティクル（大量）
   */
  emitExplosion(x, y) {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      this.pool.acquire({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: ["#ff4444", "#ff8800", "#ffcc00", "#ffffff"][
          Math.floor(Math.random() * 4)
        ],
        size: 3 + Math.random() * 4,
        maxLife: 600 + Math.random() * 400,
        gravity: 0.02,
      });
    }
  }

  /**
   * パドルヒットパーティクル
   */
  emitPaddleHit(x, y) {
    for (let i = 0; i < 5; i++) {
      this.pool.acquire({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * 2,
        color: COLORS.ACCENT,
        size: 1.5 + Math.random() * 2,
        maxLife: 300,
        gravity: 0.01,
      });
    }
  }

  /**
   * パワーアップ収集パーティクル
   */
  emitPowerUpCollect(x, y) {
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      this.pool.acquire({
        x,
        y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        color: "#00ff88",
        size: 2 + Math.random() * 2,
        maxLife: 400,
        gravity: 0,
      });
    }
  }

  /**
   * コンボフレアパーティクル
   */
  emitComboFlare(count) {
    const intensity = Math.min(count, 15);
    for (let i = 0; i < intensity; i++) {
      this.pool.acquire({
        x: Math.random() * 800,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 2,
        color: COLORS.WARNING,
        size: 1 + Math.random() * 2,
        maxLife: 800,
        gravity: -0.01,
      });
    }
  }

  /**
   * ブロックタイプに応じた色を取得
   */
  getBlockColors(type) {
    switch (type) {
      case "explosive":
        return ["#ff4444", "#ff8800", "#ffcc00"];
      case "hard":
        return ["#9a9aaa", "#c0c0d0", "#ffffff"];
      case "powerup":
        return ["#00ff88", "#00cc66", "#ffffff"];
      default:
        return COLORS.BLOCK_PALETTE;
    }
  }

  /**
   * 花火エフェクト（レベルクリア時用）
   * @param {number} x
   * @param {number} y
   */
  emitFirework(x, y) {
    const colors = ["#ff0066", "#00aaff", "#ffcc00", "#00ff88", "#ff6600"];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.pool.acquire({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3,
        maxLife: 800 + Math.random() * 400,
        gravity: 0.04,
      });
    }
  }

  /**
   * 毎フレーム更新
   * @param {number} dt
   */
  update(dt) {
    this.pool.update(dt);
  }

  /**
   * 描画
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    this.pool.render(ctx);
  }

  /**
   * 全パーティクルをクリア
   */
  clear() {
    this.pool.clear();
  }

  /**
   * アクティブ数を取得
   * @returns {number}
   */
  getActiveCount() {
    return this.pool.getActiveCount();
  }
}

export default ParticleSystem;
