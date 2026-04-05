import EventBus from "../core/EventBus.js";
import { CANVAS } from "../config/constants.js";

/**
 * TouchControlSystem - タッチ/スワイプ入力
 * モバイル端末用のタッチ操作を処理
 */
class TouchControlSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.touchActive = false;
    this.touchX = CANVAS.WIDTH / 2;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.enabled = true;

    this.bindTouch();
  }

  /**
   * タッチイベントのバインド
   */
  bindTouch() {
    this.onTouchStart = (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      const touch = e.touches[0];
      this.touchActive = true;
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchX = this.getCanvasX(touch.clientX);

      EventBus.emit("input_action");
    };

    this.onTouchMove = (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      const touch = e.touches[0];
      this.touchX = this.getCanvasX(touch.clientX);

      EventBus.emit("input_mouse_move", { x: this.touchX });
    };

    this.onTouchEnd = (e) => {
      if (!this.enabled) return;
      e.preventDefault();

      if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const endX = touch.clientX;
        const endY = touch.clientY;
        const dx = endX - this.touchStartX;
        const dy = endY - this.touchStartY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // タップ判定（短距離）
        if (dist < 10) {
          const x = this.getCanvasX(endX);
          const y = this.getCanvasY(endY);
          EventBus.emit("input_click", { x, y });
        }
      }

      this.touchActive = false;
    };

    this.canvas.addEventListener("touchstart", this.onTouchStart, {
      passive: false,
    });
    this.canvas.addEventListener("touchmove", this.onTouchMove, {
      passive: false,
    });
    this.canvas.addEventListener("touchend", this.onTouchEnd, {
      passive: false,
    });
  }

  /**
   * クライアント座標をCanvas座標に変換（X）
   * @param {number} clientX
   * @returns {number}
   */
  getCanvasX(clientX) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CANVAS.WIDTH / rect.width;
    return (clientX - rect.left) * scaleX;
  }

  /**
   * クライアント座標をCanvas座標に変換（Y）
   * @param {number} clientY
   * @returns {number}
   */
  getCanvasY(clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleY = CANVAS.HEIGHT / rect.height;
    return (clientY - rect.top) * scaleY;
  }

  /**
   * 毎フレーム更新
   * @param {number} dt
   */
  update(dt) {
    if (!this.enabled || !this.touchActive) return;
    EventBus.emit("input_mouse_move", { x: this.touchX });
  }

  /**
   * 入力を有効/無効にする
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.touchActive = false;
    }
  }

  /**
   * クリーンアップ
   */
  destroy() {
    this.canvas.removeEventListener("touchstart", this.onTouchStart);
    this.canvas.removeEventListener("touchmove", this.onTouchMove);
    this.canvas.removeEventListener("touchend", this.onTouchEnd);
  }
}

export default TouchControlSystem;
