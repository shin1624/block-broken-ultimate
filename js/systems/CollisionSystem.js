import EventBus from "../core/EventBus.js";
import { PHYSICS } from "../config/constants.js";

/**
 * CollisionSystem - 衝突判定システム
 * パドル-ボール、ボール-ブロック、パワーアップ-パドル衝突を処理
 */
class CollisionSystem {
  constructor() {
    this.balls = [];
    this.blocks = [];
    this.paddle = null;
    this.powerUps = [];
    this.shieldActive = false;
    this.shieldY = 0;

    EventBus.on("shield_activated", (data) => {
      this.shieldActive = true;
      this.shieldY = data.y;
    });
    EventBus.on("shield_deactivated", () => {
      this.shieldActive = false;
    });
  }

  /**
   * 参照を設定
   */
  setEntities(balls, blocks, paddle, powerUps) {
    this.balls = balls;
    this.blocks = blocks;
    this.paddle = paddle;
    this.powerUps = powerUps;
  }

  /**
   * 毎フレーム更新
   * @param {number} dt
   */
  update(dt) {
    if (!this.paddle) return;

    for (let i = 0; i < this.balls.length; i++) {
      const ball = this.balls[i];
      if (!ball.active) continue;

      this.checkPaddleCollision(ball);
      this.checkBlockCollisions(ball);
      this.checkShieldCollision(ball);
    }

    this.checkPowerUpCollisions();
  }

  /**
   * パドル-ボール衝突
   * 当たり位置で反射角が変化する
   */
  checkPaddleCollision(ball) {
    const p = this.paddle;
    if (ball.vy < 0) return;

    if (
      ball.x + ball.radius > p.x &&
      ball.x - ball.radius < p.x + p.width &&
      ball.y + ball.radius > p.y &&
      ball.y - ball.radius < p.y + p.height
    ) {
      // パドル上の当たり位置 (-1 ~ 1)
      const hitPos = (ball.x - (p.x + p.width / 2)) / (p.width / 2);
      const clampedHit = Math.max(-1, Math.min(1, hitPos));

      // 反射角: 中央=真上, 端=最大角度
      const angle = -Math.PI / 2 + clampedHit * PHYSICS.BOUNCE_ANGLE_MAX;
      const speed = ball.getSpeed();

      ball.setVelocity(angle, speed);
      ball.y = p.y - ball.radius;

      EventBus.emit("ball_paddle_hit", {
        hitPos: clampedHit,
        x: ball.x,
        y: ball.y,
        ball,
      });
    }
  }

  /**
   * ボール-ブロック衝突
   */
  checkBlockCollisions(ball) {
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      if (block.destroyed) continue;

      if (this.ballBlockIntersect(ball, block)) {
        this.resolveBallBlockCollision(ball, block);
        block.hit();
        break;
      }
    }
  }

  /**
   * ボールとブロックの交差判定
   */
  ballBlockIntersect(ball, block) {
    const closestX = Math.max(block.x, Math.min(ball.x, block.x + block.width));
    const closestY = Math.max(
      block.y,
      Math.min(ball.y, block.y + block.height),
    );
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    return dx * dx + dy * dy < ball.radius * ball.radius;
  }

  /**
   * ボール-ブロック衝突の反射処理
   */
  resolveBallBlockCollision(ball, block) {
    const cx = ball.x;
    const cy = ball.y;
    const bx = block.x;
    const by = block.y;
    const bw = block.width;
    const bh = block.height;

    // 各辺への距離
    const distLeft = Math.abs(cx - bx);
    const distRight = Math.abs(cx - (bx + bw));
    const distTop = Math.abs(cy - by);
    const distBottom = Math.abs(cy - (by + bh));

    const minDist = Math.min(distLeft, distRight, distTop, distBottom);

    if (minDist === distLeft || minDist === distRight) {
      ball.vx = -ball.vx;
    } else {
      ball.vy = -ball.vy;
    }
  }

  /**
   * シールド衝突
   */
  checkShieldCollision(ball) {
    if (!this.shieldActive) return;
    if (ball.vy > 0 && ball.y + ball.radius >= this.shieldY) {
      ball.vy = -Math.abs(ball.vy);
      ball.y = this.shieldY - ball.radius;
      EventBus.emit("shield_hit", { x: ball.x });
      EventBus.emit("shield_deactivated");
    }
  }

  /**
   * パワーアップ-パドル衝突
   */
  checkPowerUpCollisions() {
    const p = this.paddle;
    for (let i = 0; i < this.powerUps.length; i++) {
      const pu = this.powerUps[i];
      if (!pu.active) continue;

      const bounds = pu.getBounds();
      if (
        bounds.x + bounds.width > p.x &&
        bounds.x < p.x + p.width &&
        bounds.y + bounds.height > p.y &&
        bounds.y < p.y + p.height
      ) {
        pu.active = false;
        EventBus.emit("powerup_collected", {
          type: pu.type,
          duration: pu.duration,
          x: pu.x,
          y: pu.y,
        });
      }
    }
  }
}

export default CollisionSystem;
