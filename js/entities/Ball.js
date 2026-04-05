import { BALL, CANVAS, PHYSICS } from "../config/constants.js";
import EventBus from "../core/EventBus.js";

/**
 * Ball - ボールエンティティ
 * 位置、速度、半径、トレイルエフェクト。update(dt)で移動、壁反射。
 */
class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = BALL.RADIUS;
    this.color = BALL.COLOR;

    // 速度（ランダム上方向で開始）
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    this.vx = Math.cos(angle) * PHYSICS.BALL_SPEED;
    this.vy = Math.sin(angle) * PHYSICS.BALL_SPEED;

    // トレイル
    this.trail = [];
    this.trailLength = BALL.TRAIL_LENGTH;

    this.active = true;
    this.stuck = false;
    this.stuckOffset = 0;
  }

  /**
   * ボールを更新
   * @param {number} dt - デルタタイム(ms)
   */
  update(dt) {
    if (!this.active || this.stuck) return;

    const step = dt / (1000 / 60);

    // トレイル記録
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }

    // 移動
    this.x += this.vx * step;
    this.y += this.vy * step;

    // 壁反射
    this.wallBounce();

    // 速度制限
    this.clampSpeed();
  }

  /**
   * 壁反射処理
   */
  wallBounce() {
    // 左壁
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx);
      EventBus.emit("ball_wall_hit", { side: "left" });
    }
    // 右壁
    if (this.x + this.radius > CANVAS.WIDTH) {
      this.x = CANVAS.WIDTH - this.radius;
      this.vx = -Math.abs(this.vx);
      EventBus.emit("ball_wall_hit", { side: "right" });
    }
    // 上壁
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy = Math.abs(this.vy);
      EventBus.emit("ball_wall_hit", { side: "top" });
    }
    // 下（落下 = ミス）
    if (this.y - this.radius > CANVAS.HEIGHT) {
      this.active = false;
      EventBus.emit("ball_lost", { x: this.x, y: this.y });
    }
  }

  /**
   * 速度を制限
   */
  clampSpeed() {
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > PHYSICS.BALL_MAX_SPEED) {
      const ratio = PHYSICS.BALL_MAX_SPEED / speed;
      this.vx *= ratio;
      this.vy *= ratio;
    }
  }

  /**
   * 速度を設定（角度と速さ指定）
   * @param {number} angle - ラジアン
   * @param {number} speed - 速さ
   */
  setVelocity(angle, speed) {
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  /**
   * 現在の速さを取得
   * @returns {number}
   */
  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  /**
   * Canvas に描画
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (!this.active) return;

    // トレイル描画
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const alpha = ((i + 1) / this.trail.length) * BALL.TRAIL_OPACITY;
      const size = (this.radius * (i + 1)) / this.trail.length;
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }

    // ボール本体
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(
      this.x - 2,
      this.y - 2,
      1,
      this.x,
      this.y,
      this.radius,
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(1, "#c0c0d0");
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  /**
   * ボールをリセット（パドル上に配置）
   * @param {number} x
   * @param {number} y
   */
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.trail = [];
    this.active = true;
    this.stuck = false;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    this.vx = Math.cos(angle) * PHYSICS.BALL_SPEED;
    this.vy = Math.sin(angle) * PHYSICS.BALL_SPEED;
  }
}

export default Ball;
