import EventBus from "../core/EventBus.js";
import Block, { BlockType } from "../entities/Block.js";
import { BLOCK } from "../config/constants.js";

/**
 * LevelSystem - 10レベルのブロック配置データ、レベル進行管理
 */

const N = BlockType.NORMAL;
const H = BlockType.HARD;
const U = BlockType.UNBREAKABLE;
const P = BlockType.POWERUP;
const E = BlockType.EXPLOSIVE;
const _ = null;

/**
 * 10レベルのブロック配置定義
 * 各レベルは2D配列。null = 空、文字 = ブロックタイプ
 */
const LEVEL_DATA = [
  // Level 1: Normal のみ 3行（入門）
  [
    [N, N, N, N, N, N, N, N, N, N],
    [N, N, N, N, N, N, N, N, N, N],
    [N, N, N, N, N, N, N, N, N, N],
  ],
  // Level 2: Normal 4行（密度増）
  [
    [N, N, N, N, N, N, N, N, N, N],
    [N, N, N, N, N, N, N, N, N, N],
    [N, N, N, N, N, N, N, N, N, N],
    [N, N, N, N, N, N, N, N, N, N],
  ],
  // Level 3: Normal + Hard 混在
  [
    [H, N, N, H, N, N, H, N, N, H],
    [N, N, H, N, N, N, N, H, N, N],
    [N, H, N, N, H, H, N, N, H, N],
    [H, N, N, N, N, N, N, N, N, H],
  ],
  // Level 4: Hard 多め + PowerUp ブロック登場
  [
    [H, H, H, P, H, H, P, H, H, H],
    [H, N, H, N, H, H, N, H, N, H],
    [N, H, P, H, N, N, H, P, H, N],
    [H, H, N, N, H, H, N, N, H, H],
  ],
  // Level 5: Unbreakable でパズル要素（通り道を作る）
  [
    [U, N, N, U, _, _, U, N, N, U],
    [N, N, N, N, U, U, N, N, N, N],
    [U, N, P, N, _, _, N, P, N, U],
    [N, N, N, U, N, N, U, N, N, N],
    [U, N, N, N, N, N, N, N, N, U],
  ],
  // Level 6: PowerUp 多め + Hard
  [
    [P, H, P, H, P, P, H, P, H, P],
    [H, P, H, N, H, H, N, H, P, H],
    [N, H, P, H, P, P, H, P, H, N],
    [H, N, H, P, H, H, P, H, N, H],
  ],
  // Level 7: Explosive 登場（連鎖の快感）
  [
    [N, N, E, N, N, N, N, E, N, N],
    [N, E, N, N, E, E, N, N, E, N],
    [E, N, N, E, N, N, E, N, N, E],
    [N, N, E, N, N, N, N, E, N, N],
    [N, E, N, N, E, E, N, N, E, N],
  ],
  // Level 8: Unbreakable + Explosive 組み合わせ
  [
    [U, E, N, U, E, E, U, N, E, U],
    [N, U, E, N, N, N, N, E, U, N],
    [E, N, U, P, E, E, P, U, N, E],
    [N, E, N, U, N, N, U, N, E, N],
    [U, N, E, N, U, U, N, E, N, U],
  ],
  // Level 9: 全タイプ混在、高密度
  [
    [H, E, P, U, H, H, U, P, E, H],
    [E, H, N, H, E, E, H, N, H, E],
    [P, N, H, E, P, P, E, H, N, P],
    [U, H, E, N, H, H, N, E, H, U],
    [H, P, N, H, E, E, H, N, P, H],
    [E, N, H, P, U, U, P, H, N, E],
  ],
  // Level 10: 最終ステージ、全タイプ、最大密度、ボス配置風
  [
    [U, U, H, E, P, P, E, H, U, U],
    [U, H, E, H, E, E, H, E, H, U],
    [H, E, P, E, H, H, E, P, E, H],
    [E, H, H, P, E, E, P, H, H, E],
    [H, P, E, H, U, U, H, E, P, H],
    [P, H, H, E, H, H, E, H, H, P],
    [U, E, P, H, E, E, H, P, E, U],
  ],
];

class LevelSystem {
  constructor() {
    this.currentLevel = 1;
    this.maxLevel = LEVEL_DATA.length;
    this.blocks = [];
    this.totalDestructible = 0;
    this.destroyedCount = 0;

    EventBus.on("block_destroyed", () => {
      this.destroyedCount++;
      const remaining = this.totalDestructible - this.destroyedCount;
      const ratio =
        this.totalDestructible > 0 ? remaining / this.totalDestructible : 0;
      EventBus.emit("blocks_progress", {
        ratio,
        remaining,
        total: this.totalDestructible,
      });
      if (this.destroyedCount >= this.totalDestructible) {
        EventBus.emit("level_cleared", { level: this.currentLevel });
      }
    });

    EventBus.on("block_explode", (data) => {
      this.handleExplosion(data.row, data.col);
    });
  }

  /**
   * レベルをロード
   * @param {number} level - レベル番号（1始まり）
   * @returns {Block[]}
   */
  loadLevel(level) {
    this.currentLevel = level;
    this.blocks = [];
    this.totalDestructible = 0;
    this.destroyedCount = 0;

    const index = Math.min(level - 1, LEVEL_DATA.length - 1);
    const data = LEVEL_DATA[index];

    for (let row = 0; row < data.length; row++) {
      for (let col = 0; col < data[row].length; col++) {
        const type = data[row][col];
        if (type === null) continue;

        const block = new Block(row, col, type);
        this.blocks.push(block);

        if (type !== BlockType.UNBREAKABLE) {
          this.totalDestructible++;
        }
      }
    }

    EventBus.emit("level_loaded", {
      level: this.currentLevel,
      blockCount: this.blocks.length,
      destructible: this.totalDestructible,
    });

    return this.blocks;
  }

  /**
   * 爆発処理（周囲8マスのブロックを破壊）
   */
  handleExplosion(row, col) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const target = this.blocks.find(
          (b) => b.row === row + dr && b.col === col + dc && !b.destroyed,
        );
        if (target) {
          target.hit();
        }
      }
    }
  }

  /**
   * 次のレベルへ進む
   * @returns {Block[]|null}
   */
  nextLevel() {
    if (this.currentLevel >= this.maxLevel) {
      EventBus.emit("game_completed");
      return null;
    }
    return this.loadLevel(this.currentLevel + 1);
  }

  /**
   * 全ブロックを更新
   * @param {number} dt
   */
  update(dt) {
    for (let i = 0; i < this.blocks.length; i++) {
      this.blocks[i].update(dt);
    }
  }

  /**
   * 全ブロックを描画
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    for (let i = 0; i < this.blocks.length; i++) {
      this.blocks[i].render(ctx);
    }
  }

  /**
   * 現在のブロック配列を取得
   * @returns {Block[]}
   */
  getBlocks() {
    return this.blocks;
  }

  /**
   * 現在のレベルを取得
   * @returns {number}
   */
  getCurrentLevel() {
    return this.currentLevel;
  }

  /**
   * 最大レベルを取得
   * @returns {number}
   */
  getMaxLevel() {
    return this.maxLevel;
  }
}

export default LevelSystem;
