import EventBus from "../core/EventBus.js";
import PowerUp, { PowerUpType, POWERUP_DURATION } from "../entities/PowerUp.js";
import { CANVAS, PADDLE, PHYSICS } from "../config/constants.js";

/**
 * PowerUpManager - パワーアップのスポーン、効果適用、タイマー管理
 */
class PowerUpManager {
  constructor() {
    this.activePowerUps = [];
    this.fallingPowerUps = [];
    this.activeEffects = new Map();
    this.paddle = null;
    this.balls = [];
    this.getBallFactory = null;

    EventBus.on("powerup_spawn_request", (data) => {
      this.spawnPowerUp(data.x, data.y);
    });

    EventBus.on("powerup_collected", (data) => {
      this.applyEffect(data.type, data.duration);
    });
  }

  /**
   * エンティティ参照を設定
   */
  setEntities(paddle, balls, ballFactory) {
    this.paddle = paddle;
    this.balls = balls;
    this.getBallFactory = ballFactory;
  }

  /**
   * パワーアップをスポーン
   */
  spawnPowerUp(x, y) {
    const type = PowerUp.getRandomType();
    const pu = new PowerUp(x, y, type);
    this.fallingPowerUps.push(pu);
  }

  /**
   * 効果を適用
   * @param {string} type
   * @param {number} duration
   */
  applyEffect(type, duration) {
    EventBus.emit("powerup_activated", { type });

    switch (type) {
      case PowerUpType.MULTI_BALL:
        this.applyMultiBall();
        break;
      case PowerUpType.WIDE_PADDLE:
        this.applyWidePaddle(duration);
        break;
      case PowerUpType.STICKY_PADDLE:
        this.applyStickyPaddle(duration);
        break;
      case PowerUpType.LASER:
        this.applyLaser(duration);
        break;
      case PowerUpType.SLOW_BALL:
        this.applySlowBall(duration);
        break;
      case PowerUpType.EXTRA_LIFE:
        this.applyExtraLife();
        break;
      case PowerUpType.SHIELD:
        this.applyShield();
        break;
    }
  }

  applyMultiBall() {
    if (!this.getBallFactory) return;
    const activeBall = this.balls.find((b) => b.active);
    if (!activeBall) return;

    for (let i = 0; i < 2; i++) {
      const newBall = this.getBallFactory(activeBall.x, activeBall.y);
      if (newBall) {
        const angle = -Math.PI / 2 + (i === 0 ? -0.4 : 0.4);
        newBall.setVelocity(angle, activeBall.getSpeed());
        this.balls.push(newBall);
      }
    }
    EventBus.emit("multi_ball_spawned", { count: 2 });
  }

  applyWidePaddle(duration) {
    if (!this.paddle) return;
    this.clearEffect(PowerUpType.WIDE_PADDLE);
    this.paddle.setWidth(PADDLE.WIDTH * 1.5);
    this.setEffectTimer(PowerUpType.WIDE_PADDLE, duration, () => {
      if (this.paddle) this.paddle.resetWidth();
    });
  }

  applyStickyPaddle(duration) {
    this.clearEffect(PowerUpType.STICKY_PADDLE);
    EventBus.emit("sticky_paddle_on");
    this.setEffectTimer(PowerUpType.STICKY_PADDLE, duration, () => {
      EventBus.emit("sticky_paddle_off");
    });
  }

  applyLaser(duration) {
    this.clearEffect(PowerUpType.LASER);
    EventBus.emit("laser_on");
    this.setEffectTimer(PowerUpType.LASER, duration, () => {
      EventBus.emit("laser_off");
    });
  }

  applySlowBall(duration) {
    this.clearEffect(PowerUpType.SLOW_BALL);
    for (let i = 0; i < this.balls.length; i++) {
      const ball = this.balls[i];
      if (ball.active) {
        ball.vx *= 0.6;
        ball.vy *= 0.6;
      }
    }
    this.setEffectTimer(PowerUpType.SLOW_BALL, duration, () => {
      for (let i = 0; i < this.balls.length; i++) {
        const ball = this.balls[i];
        if (ball.active) {
          const speed = ball.getSpeed();
          if (speed < PHYSICS.BALL_SPEED) {
            const ratio = PHYSICS.BALL_SPEED / Math.max(speed, 0.1);
            ball.vx *= ratio;
            ball.vy *= ratio;
          }
        }
      }
    });
  }

  applyExtraLife() {
    EventBus.emit("extra_life_gained");
  }

  applyShield() {
    EventBus.emit("shield_activated", {
      y: CANVAS.HEIGHT - 10,
    });
  }

  /**
   * 効果タイマーを設定
   */
  setEffectTimer(type, duration, onExpire) {
    if (duration <= 0) return;

    const effect = {
      type,
      remaining: duration,
      onExpire,
    };
    this.activeEffects.set(type, effect);
  }

  /**
   * 効果をクリア
   */
  clearEffect(type) {
    const existing = this.activeEffects.get(type);
    if (existing) {
      existing.onExpire();
      this.activeEffects.delete(type);
      EventBus.emit("powerup_expired", { type });
    }
  }

  /**
   * 毎フレーム更新
   * @param {number} dt
   */
  update(dt) {
    // 落下中パワーアップ更新
    for (let i = this.fallingPowerUps.length - 1; i >= 0; i--) {
      this.fallingPowerUps[i].update(dt);
      if (!this.fallingPowerUps[i].active) {
        this.fallingPowerUps.splice(i, 1);
      }
    }

    // アクティブ効果のタイマー更新
    for (const [type, effect] of this.activeEffects) {
      effect.remaining -= dt;
      if (effect.remaining <= 0) {
        effect.onExpire();
        this.activeEffects.delete(type);
        EventBus.emit("powerup_expired", { type });
      }
    }
  }

  /**
   * 落下中パワーアップを描画
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    for (let i = 0; i < this.fallingPowerUps.length; i++) {
      this.fallingPowerUps[i].render(ctx);
    }
  }

  /**
   * 落下中パワーアップ配列を取得（衝突判定用）
   * @returns {PowerUp[]}
   */
  getFallingPowerUps() {
    return this.fallingPowerUps;
  }

  /**
   * 全てクリア
   */
  clear() {
    for (const [type, effect] of this.activeEffects) {
      effect.onExpire();
    }
    this.activeEffects.clear();
    this.fallingPowerUps = [];
    EventBus.emit("shield_deactivated");
  }

  /**
   * アクティブエフェクト一覧を取得（HUD用）
   * @returns {Array<{type: string, remaining: number}>}
   */
  getActiveEffects() {
    const result = [];
    for (const [type, effect] of this.activeEffects) {
      result.push({ type, remaining: effect.remaining });
    }
    return result;
  }
}

export default PowerUpManager;
