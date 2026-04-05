/**
 * Laser - レーザー弾エンティティ
 * パドルから発射され、上方向に移動してブロックを破壊する。
 */
class Laser {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 15;
    this.speed = 10;
    this.active = true;
  }

  /**
   * 毎フレーム更新: 上方向に移動
   * @param {number} dt - デルタタイム(ms)
   */
  update(dt) {
    if (!this.active) return;
    this.y -= this.speed * (dt / 16.67);
    if (this.y + this.height < 0) {
      this.active = false;
    }
  }

  /**
   * 描画: 赤い細長い矩形 + グロウエフェクト
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (!this.active) return;

    // グロウエフェクト
    ctx.shadowColor = "rgba(255, 50, 50, 0.8)";
    ctx.shadowBlur = 8;

    // メインビーム
    ctx.fillStyle = "#ff3333";
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

    // コア（明るい中心線）
    ctx.fillStyle = "#ff8888";
    ctx.fillRect(this.x - 1, this.y, 2, this.height);

    ctx.shadowBlur = 0;
  }

  /**
   * 衝突判定用の矩形を返す
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}

export default Laser;
