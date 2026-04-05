import EventBus from "../core/EventBus.js";
import { CANVAS, COLORS, STATES } from "../config/constants.js";

/**
 * PauseScreen - ポーズ画面
 * ESCキーでトグル、Resume / Quit ボタン
 */
class PauseScreen {
  constructor() {
    this.visible = false;
    this.buttons = [
      {
        label: "RESUME",
        x: CANVAS.WIDTH / 2 - 90,
        y: 280,
        width: 180,
        height: 45,
        action: "resume",
      },
      {
        label: "QUIT TO TITLE",
        x: CANVAS.WIDTH / 2 - 90,
        y: 340,
        width: 180,
        height: 45,
        action: "quit",
      },
    ];

    EventBus.on("state_changed", (data) => {
      this.visible = data.to === STATES.PAUSED;
    });

    EventBus.on("input_click", (data) => {
      if (!this.visible) return;
      this.handleClick(data.x, data.y);
    });
  }

  /**
   * クリック処理
   */
  handleClick(x, y) {
    for (let i = 0; i < this.buttons.length; i++) {
      const btn = this.buttons[i];
      if (
        x >= btn.x &&
        x <= btn.x + btn.width &&
        y >= btn.y &&
        y <= btn.y + btn.height
      ) {
        if (btn.action === "resume") {
          EventBus.emit("pause_resume");
        } else if (btn.action === "quit") {
          EventBus.emit("pause_quit");
        }
        return;
      }
    }
  }

  /**
   * 毎フレーム更新
   * @param {number} dt
   */
  update(dt) {
    // no animation needed
  }

  /**
   * 描画
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (!this.visible) return;

    // オーバーレイ
    ctx.fillStyle = COLORS.UI_OVERLAY;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // タイトル
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = "bold 36px monospace";
    ctx.fillText("PAUSED", CANVAS.WIDTH / 2, 200);

    // ボタン描画
    for (let i = 0; i < this.buttons.length; i++) {
      this.renderButton(ctx, this.buttons[i]);
    }

    // 操作説明セクション
    this.renderControls(ctx);

    // ヒント（操作説明の下）
    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Press ESC to resume", CANVAS.WIDTH / 2, 570);
  }

  /**
   * 操作説明セクション描画
   */
  renderControls(ctx) {
    const centerX = CANVAS.WIDTH / 2;
    const startY = 430;

    // セクションヘッダー
    ctx.fillStyle = COLORS.ACCENT;
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("— CONTROLS —", centerX, startY);

    // 操作一覧
    const controls = [
      { key: "← → / A D", desc: "Move Paddle" },
      { key: "Mouse", desc: "Follow Cursor" },
      { key: "Touch", desc: "Drag to Move" },
      { key: "Space / Click", desc: "Launch Ball" },
      { key: "ESC", desc: "Pause / Resume" },
    ];

    const colLeft = centerX - 100;
    const colRight = centerX + 100;
    const lineHeight = 22;
    let y = startY + 28;

    for (let i = 0; i < controls.length; i++) {
      const row = controls[i];

      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.font = "13px monospace";
      ctx.textAlign = "left";
      ctx.fillText(row.key, colLeft, y);

      ctx.fillStyle = COLORS.TEXT_SECONDARY;
      ctx.font = "13px monospace";
      ctx.textAlign = "right";
      ctx.fillText(row.desc, colRight, y);

      y += lineHeight;
    }
  }

  /**
   * ボタン描画
   */
  renderButton(ctx, btn) {
    ctx.fillStyle = "rgba(233, 69, 96, 0.6)";

    const r = 6;
    ctx.beginPath();
    ctx.moveTo(btn.x + r, btn.y);
    ctx.lineTo(btn.x + btn.width - r, btn.y);
    ctx.quadraticCurveTo(
      btn.x + btn.width,
      btn.y,
      btn.x + btn.width,
      btn.y + r,
    );
    ctx.lineTo(btn.x + btn.width, btn.y + btn.height - r);
    ctx.quadraticCurveTo(
      btn.x + btn.width,
      btn.y + btn.height,
      btn.x + btn.width - r,
      btn.y + btn.height,
    );
    ctx.lineTo(btn.x + r, btn.y + btn.height);
    ctx.quadraticCurveTo(
      btn.x,
      btn.y + btn.height,
      btn.x,
      btn.y + btn.height - r,
    );
    ctx.lineTo(btn.x, btn.y + r);
    ctx.quadraticCurveTo(btn.x, btn.y, btn.x + r, btn.y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = "bold 15px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + btn.height / 2);
  }
}

export default PauseScreen;
