/**
 * Particle - パーティクルクラス + オブジェクトプール
 * 色・サイズ・寿命・速度を持つ軽量オブジェクト
 */
class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = 3;
    this.color = "#ffffff";
    this.alpha = 1;
    this.life = 0;
    this.maxLife = 1000;
    this.decay = 0.02;
    this.gravity = 0.05;
    this.active = false;
    this.shape = "circle";
  }

  /**
   * パーティクルを初期化（プールから再利用時に呼ぶ）
   * @param {Object} config
   */
  init(config) {
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.vx = config.vx || (Math.random() - 0.5) * 4;
    this.vy = config.vy || (Math.random() - 0.5) * 4;
    this.size = config.size || 3;
    this.color = config.color || "#ffffff";
    this.alpha = 1;
    this.life = 0;
    this.maxLife = config.maxLife || 1000;
    this.decay = config.decay || 0.02;
    this.gravity = config.gravity !== undefined ? config.gravity : 0.05;
    this.active = true;
    this.shape = config.shape || "circle";
  }

  /**
   * 更新
   * @param {number} dt
   */
  update(dt) {
    if (!this.active) return;

    const step = dt / (1000 / 60);
    this.x += this.vx * step;
    this.y += this.vy * step;
    this.vy += this.gravity * step;
    this.life += dt;
    this.alpha = Math.max(0, 1 - this.life / this.maxLife);
    this.size *= 0.995;

    if (this.life >= this.maxLife || this.alpha <= 0 || this.size < 0.3) {
      this.active = false;
    }
  }

  /**
   * 描画
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (!this.active || this.alpha <= 0) return;

    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;

    if (this.shape === "square") {
      ctx.fillRect(
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size,
      );
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * 非アクティブにする（プールに返す）
   */
  deactivate() {
    this.active = false;
  }
}

/**
 * ParticlePool - オブジェクトプール
 */
class ParticlePool {
  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    this.pool = [];
    this.activeCount = 0;
    this.prefill(maxSize);
  }

  /**
   * プールを事前に満たす
   * @param {number} count
   */
  prefill(count) {
    for (let i = 0; i < count; i++) {
      this.pool.push(new Particle());
    }
  }

  /**
   * パーティクルを取得（プールから再利用 or 新規作成）
   * @param {Object} config
   * @returns {Particle|null}
   */
  acquire(config) {
    let particle = null;

    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        particle = this.pool[i];
        break;
      }
    }

    if (!particle) {
      if (this.pool.length < this.maxSize) {
        particle = new Particle();
        this.pool.push(particle);
      } else {
        return null;
      }
    }

    particle.init(config);
    this.activeCount++;
    return particle;
  }

  /**
   * 全パーティクルを更新
   * @param {number} dt
   */
  update(dt) {
    this.activeCount = 0;
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (p.active) {
        p.update(dt);
        if (p.active) this.activeCount++;
      }
    }
  }

  /**
   * 全アクティブパーティクルを描画
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].active) {
        this.pool[i].render(ctx);
      }
    }
  }

  /**
   * 全パーティクルをクリア
   */
  clear() {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].active = false;
    }
    this.activeCount = 0;
  }

  /**
   * アクティブ数を取得
   * @returns {number}
   */
  getActiveCount() {
    return this.activeCount;
  }
}

export { Particle, ParticlePool };
export default Particle;
