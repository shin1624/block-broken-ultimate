import { BLOCK, COLORS } from "../config/constants.js";
import EventBus from "../core/EventBus.js";

/**
 * Block - ブロックエンティティ
 * 5種類: Normal, Hard, Unbreakable, PowerUp, Explosive
 */
export const BlockType = {
  NORMAL: "normal",
  HARD: "hard",
  UNBREAKABLE: "unbreakable",
  POWERUP: "powerup",
  EXPLOSIVE: "explosive",
};

const BLOCK_COLORS = {
  [BlockType.NORMAL]: COLORS.BLOCK_PALETTE,
  [BlockType.HARD]: ["#8a8a9a", "#6a6a7a"],
  [BlockType.UNBREAKABLE]: ["#404060", "#303050"],
  [BlockType.POWERUP]: ["#00ff88", "#00cc66"],
  [BlockType.EXPLOSIVE]: ["#ff3333", "#cc0000"],
};

const BLOCK_SCORES = {
  [BlockType.NORMAL]: 10,
  [BlockType.HARD]: 25,
  [BlockType.UNBREAKABLE]: 0,
  [BlockType.POWERUP]: 15,
  [BlockType.EXPLOSIVE]: 30,
};

class Block {
  constructor(row, col, type = BlockType.NORMAL) {
    this.row = row;
    this.col = col;
    this.type = type;

    // 位置計算
    this.width = BLOCK.WIDTH;
    this.height = BLOCK.HEIGHT;
    this.x = BLOCK.OFFSET_LEFT + col * (BLOCK.WIDTH + BLOCK.PADDING);
    this.y = BLOCK.OFFSET_TOP + row * (BLOCK.HEIGHT + BLOCK.PADDING);

    // HP
    this.maxHp = type === BlockType.HARD ? 2 : 1;
    this.hp = this.maxHp;
    this.destroyed = false;

    // ビジュアル
    this.colorIndex = row % COLORS.BLOCK_PALETTE.length;
    this.animationTime = Math.random() * Math.PI * 2;
    this.score = BLOCK_SCORES[type] || 10;
  }

  /**
   * ブロックにダメージを与える
   * @returns {boolean} 破壊されたか
   */
  hit() {
    if (this.destroyed) return false;
    if (this.type === BlockType.UNBREAKABLE) {
      EventBus.emit("block_hit_unbreakable", { block: this });
      return false;
    }

    this.hp--;
    if (this.hp <= 0) {
      this.destroyed = true;
      EventBus.emit("block_destroyed", {
        block: this,
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        type: this.type,
        score: this.score,
      });

      if (this.type === BlockType.EXPLOSIVE) {
        EventBus.emit("block_explode", {
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          row: this.row,
          col: this.col,
        });
      }

      if (this.type === BlockType.POWERUP) {
        EventBus.emit("powerup_spawn_request", {
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
        });
      }
      return true;
    }

    EventBus.emit("block_damaged", { block: this, hp: this.hp });
    return false;
  }

  /**
   * 更新（アニメーション用）
   * @param {number} dt
   */
  update(dt) {
    if (this.destroyed) return;
    this.animationTime += dt * 0.003;
  }

  /**
   * 描画
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (this.destroyed) return;

    switch (this.type) {
      case BlockType.NORMAL:
        this.renderNormal(ctx);
        break;
      case BlockType.HARD:
        this.renderHard(ctx);
        break;
      case BlockType.UNBREAKABLE:
        this.renderUnbreakable(ctx);
        break;
      case BlockType.POWERUP:
        this.renderPowerUp(ctx);
        break;
      case BlockType.EXPLOSIVE:
        this.renderExplosive(ctx);
        break;
    }
  }

  renderNormal(ctx) {
    const color = COLORS.BLOCK_PALETTE[this.colorIndex];
    ctx.fillStyle = color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    // 上部ハイライト
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(this.x, this.y, this.width, 3);
  }

  renderHard(ctx) {
    const gradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height,
    );
    gradient.addColorStop(0, "#9a9aaa");
    gradient.addColorStop(1, "#6a6a7a");
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // ヒビエフェクト（HP < maxHP のとき）
    if (this.hp < this.maxHp) {
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const cx = this.x + this.width * 0.4;
      const cy = this.y + this.height * 0.3;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 8, cy + 6);
      ctx.lineTo(cx + 4, cy + 12);
      ctx.lineTo(cx + 12, cy + 18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy + 6);
      ctx.lineTo(cx + 16, cy + 4);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(this.x, this.y, this.width, 2);
  }

  renderUnbreakable(ctx) {
    // メタリックエフェクト
    const gradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x + this.width,
      this.y + this.height,
    );
    gradient.addColorStop(0, "#505070");
    gradient.addColorStop(0.3, "#707090");
    gradient.addColorStop(0.5, "#505070");
    gradient.addColorStop(0.7, "#707090");
    gradient.addColorStop(1, "#404060");
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // ボルト装飾
    ctx.fillStyle = "rgba(200,200,220,0.4)";
    ctx.beginPath();
    ctx.arc(this.x + 6, this.y + this.height / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      this.x + this.width - 6,
      this.y + this.height / 2,
      3,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.strokeStyle = "rgba(150,150,170,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);
  }

  renderPowerUp(ctx) {
    // 光るエフェクト
    const glow = Math.sin(this.animationTime * 3) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(0, 255, 136, ${glow})`;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 星マーク
    ctx.fillStyle = `rgba(255, 255, 255, ${glow * 0.8})`;
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("*", this.x + this.width / 2, this.y + this.height / 2);
  }

  renderExplosive(ctx) {
    // 赤く脈動
    const pulse = Math.sin(this.animationTime * 4) * 0.3 + 0.7;
    const r = Math.floor(200 + pulse * 55);
    ctx.fillStyle = `rgb(${r}, 30, 30)`;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 爆発マーク
    ctx.fillStyle = `rgba(255, 200, 0, ${pulse})`;
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", this.x + this.width / 2, this.y + this.height / 2);

    // グローエフェクト
    ctx.shadowColor = `rgba(255, 50, 0, ${pulse * 0.5})`;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = `rgba(255, 100, 0, ${pulse * 0.5})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
  }
}

export default Block;
