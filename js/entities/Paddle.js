import { PADDLE, CANVAS, PHYSICS } from "../config/constants.js";

/**
 * Paddle - パドルエンティティ
 * 位置、幅、高さ。グラデーション描画対応。
 */
class Paddle {
  constructor() {
    this.width = PADDLE.WIDTH;
    this.height = PADDLE.HEIGHT;
    this.x = (CANVAS.WIDTH - this.width) / 2;
    this.y = CANVAS.HEIGHT - PADDLE.OFFSET_BOTTOM;
    this.speed = PHYSICS.PADDLE_SPEED;
    this.targetX = this.x;
    this.useSmoothing = true;
    this.smoothingFactor = 0.15;
  }

  /**
   * パドルを更新
   * @param {number} dt - デルタタイム(ms)
   */
  update(dt) {
    if (this.useSmoothing) {
      this.x += (this.targetX - this.x) * this.smoothingFactor;
    }
    this.clampPosition();
  }

  /**
   * キーボード入力で移動
   * @param {number} direction - -1: 左, 0: 停止, 1: 右
   * @param {number} dt - デルタタイム(ms)
   */
  moveByKeyboard(direction, dt) {
    const step = dt / (1000 / 60);
    this.targetX += direction * this.speed * step;
    if (!this.useSmoothing) {
      this.x = this.targetX;
    }
    this.clampPosition();
  }

  /**
   * マウス/タッチ位置で移動
   * @param {number} mouseX - Canvas 座標でのX位置
   */
  moveToPosition(mouseX) {
    this.targetX = mouseX - this.width / 2;
    if (!this.useSmoothing) {
      this.x = this.targetX;
    }
    this.clampPosition();
  }

  /**
   * 画面端の制限
   */
  clampPosition() {
    if (this.targetX < 0) this.targetX = 0;
    if (this.targetX + this.width > CANVAS.WIDTH) {
      this.targetX = CANVAS.WIDTH - this.width;
    }
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CANVAS.WIDTH) {
      this.x = CANVAS.WIDTH - this.width;
    }
  }

  /**
   * パドルの中心X座標
   * @returns {number}
   */
  getCenterX() {
    return this.x + this.width / 2;
  }

  /**
   * パドルの上端Y座標
   * @returns {number}
   */
  getTopY() {
    return this.y;
  }

  /**
   * パドル幅を変更（パワーアップ用）
   * @param {number} newWidth
   */
  setWidth(newWidth) {
    const centerX = this.getCenterX();
    this.width = newWidth;
    this.x = centerX - this.width / 2;
    this.targetX = this.x;
    this.clampPosition();
  }

  /**
   * パドル幅をリセット
   */
  resetWidth() {
    this.setWidth(PADDLE.WIDTH);
  }

  /**
   * Canvas に描画
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    const gradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height,
    );
    gradient.addColorStop(0, "#ff6b8a");
    gradient.addColorStop(0.5, PADDLE.COLOR);
    gradient.addColorStop(1, "#c0354d");

    ctx.beginPath();
    const r = PADDLE.BORDER_RADIUS;
    ctx.moveTo(this.x + r, this.y);
    ctx.lineTo(this.x + this.width - r, this.y);
    ctx.quadraticCurveTo(
      this.x + this.width,
      this.y,
      this.x + this.width,
      this.y + r,
    );
    ctx.lineTo(this.x + this.width, this.y + this.height - r);
    ctx.quadraticCurveTo(
      this.x + this.width,
      this.y + this.height,
      this.x + this.width - r,
      this.y + this.height,
    );
    ctx.lineTo(this.x + r, this.y + this.height);
    ctx.quadraticCurveTo(
      this.x,
      this.y + this.height,
      this.x,
      this.y + this.height - r,
    );
    ctx.lineTo(this.x, this.y + r);
    ctx.quadraticCurveTo(this.x, this.y, this.x + r, this.y);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // 光沢エフェクト
    ctx.beginPath();
    ctx.rect(this.x + 4, this.y + 2, this.width - 8, 3);
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fill();
  }

  /**
   * リセット
   */
  reset() {
    this.width = PADDLE.WIDTH;
    this.x = (CANVAS.WIDTH - this.width) / 2;
    this.targetX = this.x;
  }
}

export default Paddle;
