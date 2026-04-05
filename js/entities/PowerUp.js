import { CANVAS } from "../config/constants.js";
import EventBus from "../core/EventBus.js";

/**
 * PowerUp - パワーアップアイテム
 * 7種: MultiBall, WidePaddle, StickyPaddle, Laser, SlowBall, ExtraLife, Shield
 */
export const PowerUpType = {
  MULTI_BALL: "multi_ball",
  WIDE_PADDLE: "wide_paddle",
  STICKY_PADDLE: "sticky_paddle",
  LASER: "laser",
  SLOW_BALL: "slow_ball",
  EXTRA_LIFE: "extra_life",
  SHIELD: "shield",
};

const POWERUP_VISUALS = {
  [PowerUpType.MULTI_BALL]: { color: "#00aaff", icon: "M", label: "Multi" },
  [PowerUpType.WIDE_PADDLE]: { color: "#ff6600", icon: "W", label: "Wide" },
  [PowerUpType.STICKY_PADDLE]: { color: "#ffcc00", icon: "S", label: "Sticky" },
  [PowerUpType.LASER]: { color: "#ff0066", icon: "L", label: "Laser" },
  [PowerUpType.SLOW_BALL]: { color: "#6600ff", icon: "~", label: "Slow" },
  [PowerUpType.EXTRA_LIFE]: { color: "#00ff00", icon: "+", label: "Life" },
  [PowerUpType.SHIELD]: { color: "#00ffcc", icon: "=", label: "Shield" },
};

const POWERUP_DURATION = {
  [PowerUpType.MULTI_BALL]: 0,
  [PowerUpType.WIDE_PADDLE]: 10000,
  [PowerUpType.STICKY_PADDLE]: 8000,
  [PowerUpType.LASER]: 6000,
  [PowerUpType.SLOW_BALL]: 8000,
  [PowerUpType.EXTRA_LIFE]: 0,
  [PowerUpType.SHIELD]: 0,
};

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 30;
    this.height = 16;
    this.fallSpeed = 2;
    this.active = true;
    this.animationTime = 0;

    const visual = POWERUP_VISUALS[type];
    this.color = visual.color;
    this.icon = visual.icon;
    this.label = visual.label;
    this.duration = POWERUP_DURATION[type] || 0;
  }

  /**
   * 更新（落下アニメーション）
   * @param {number} dt
   */
  update(dt) {
    if (!this.active) return;

    const step = dt / (1000 / 60);
    this.y += this.fallSpeed * step;
    this.animationTime += dt * 0.005;

    // 画面外に落ちたら消滅
    if (this.y > CANVAS.HEIGHT + 20) {
      this.active = false;
    }
  }

  /**
   * パドルとの衝突判定用の矩形を取得
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * 描画
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (!this.active) return;

    const bounce = Math.sin(this.animationTime * 3) * 2;
    const drawX = this.x - this.width / 2;
    const drawY = this.y - this.height / 2 + bounce;

    // グローエフェクト
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;

    // 背景
    ctx.fillStyle = this.color;
    ctx.beginPath();
    const r = 4;
    ctx.moveTo(drawX + r, drawY);
    ctx.lineTo(drawX + this.width - r, drawY);
    ctx.quadraticCurveTo(
      drawX + this.width,
      drawY,
      drawX + this.width,
      drawY + r,
    );
    ctx.lineTo(drawX + this.width, drawY + this.height - r);
    ctx.quadraticCurveTo(
      drawX + this.width,
      drawY + this.height,
      drawX + this.width - r,
      drawY + this.height,
    );
    ctx.lineTo(drawX + r, drawY + this.height);
    ctx.quadraticCurveTo(
      drawX,
      drawY + this.height,
      drawX,
      drawY + this.height - r,
    );
    ctx.lineTo(drawX, drawY + r);
    ctx.quadraticCurveTo(drawX, drawY, drawX + r, drawY);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    // アイコン
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.icon, this.x, this.y + bounce);
  }

  /**
   * ランダムなパワーアップタイプを返す
   * @returns {string}
   */
  static getRandomType() {
    const types = Object.values(PowerUpType);
    const weights = [15, 20, 10, 10, 15, 10, 20];
    const total = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (let i = 0; i < types.length; i++) {
      rand -= weights[i];
      if (rand <= 0) return types[i];
    }
    return types[0];
  }
}

export { PowerUp, POWERUP_DURATION, POWERUP_VISUALS };
export default PowerUp;
