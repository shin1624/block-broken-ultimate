import EventBus from "../core/EventBus.js";
import { CANVAS } from "../config/constants.js";

/**
 * InputSystem - キーボード・マウス入力
 * 矢印/WASD キーボード入力、マウス追従入力を処理
 */
class InputSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.mouseX = CANVAS.WIDTH / 2;
    this.mouseActive = false;
    this.enabled = true;

    this.bindKeyboard();
    this.bindMouse();
  }

  /**
   * キーボードイベントのバインド
   */
  bindKeyboard() {
    this.onKeyDown = (e) => {
      if (!this.enabled) return;
      this.keys[e.code] = true;

      if (e.code === "Escape") {
        EventBus.emit("input_pause_toggle");
      }
      if (e.code === "Space") {
        EventBus.emit("input_action");
        e.preventDefault();
      }
      if (e.code === "Enter") {
        EventBus.emit("input_confirm");
      }

      // 矢印キーのスクロール防止
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)
      ) {
        e.preventDefault();
      }
    };

    this.onKeyUp = (e) => {
      this.keys[e.code] = false;
    };

    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
  }

  /**
   * マウスイベントのバインド
   */
  bindMouse() {
    this.onMouseMove = (e) => {
      if (!this.enabled) return;
      this.mouseActive = true;
      this.mouseX = this.getCanvasX(e.clientX);
      EventBus.emit("input_mouse_move", { x: this.mouseX });
    };

    this.onClick = (e) => {
      if (!this.enabled) return;
      const x = this.getCanvasX(e.clientX);
      const y = this.getCanvasY(e.clientY);
      EventBus.emit("input_click", { x, y });
      EventBus.emit("input_action");
    };

    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("click", this.onClick);
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
   * 水平移動方向を取得（-1, 0, 1）
   * @returns {number}
   */
  getHorizontalDirection() {
    let dir = 0;
    if (this.keys["ArrowLeft"] || this.keys["KeyA"]) dir -= 1;
    if (this.keys["ArrowRight"] || this.keys["KeyD"]) dir += 1;
    return dir;
  }

  /**
   * マウスが有効かどうか
   * @returns {boolean}
   */
  isMouseActive() {
    return this.mouseActive;
  }

  /**
   * マウスX座標を取得
   * @returns {number}
   */
  getMouseX() {
    return this.mouseX;
  }

  /**
   * 入力を有効/無効にする
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.keys = {};
      this.mouseActive = false;
    }
  }

  /**
   * 毎フレーム更新
   * @param {number} dt
   */
  update(dt) {
    if (!this.enabled) return;

    const dir = this.getHorizontalDirection();
    if (dir !== 0) {
      this.mouseActive = false;
      EventBus.emit("input_move", { direction: dir, dt });
    } else if (this.mouseActive) {
      EventBus.emit("input_mouse_move", { x: this.mouseX });
    }
  }

  /**
   * クリーンアップ
   */
  destroy() {
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("click", this.onClick);
  }
}

export default InputSystem;
