import EventBus from "../core/EventBus.js";
import { CANVAS, COLORS, STATES } from "../config/constants.js";

/**
 * LevelCompleteScreen - レベルクリア画面
 * レベルクリアスコア、ボーナス、Next Level ボタン
 */
class LevelCompleteScreen {
  constructor() {
    this.visible = false;
    this.level = 1;
    this.score = 0;
    this.bonus = 0;
    this.animationTime = 0;
    this.isLastLevel = false;

    this.nextButton = {
      label: "NEXT LEVEL",
      x: CANVAS.WIDTH / 2 - 100,
      y: 380,
      width: 200,
      height: 45,
      action: "next",
    };

    this.titleButton = {
      label: "TITLE",
      x: CANVAS.WIDTH / 2 - 80,
      y: 440,
      width: 160,
      height: 40,
      action: "title",
    };

    EventBus.on("state_changed", (data) => {
      if (data.to === STATES.LEVELCOMPLETE) {
        this.visible = true;
        this.level = data.data.level || 1;
        this.score = data.data.score || 0;
        this.bonus = data.data.bonus || 0;
        this.isLastLevel = data.data.isLastLevel || false;
        this.animationTime = 0;

        if (this.isLastLevel) {
          this.nextButton.label = "YOU WIN!";
        } else {
          this.nextButton.label = "NEXT LEVEL";
        }
      } else {
        this.visible = false;
      }
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
    const nb = this.nextButton;
    if (
      x >= nb.x &&
      x <= nb.x + nb.width &&
      y >= nb.y &&
      y <= nb.y + nb.height
    ) {
      if (this.isLastLevel) {
        EventBus.emit("levelcomplete_title");
      } else {
        EventBus.emit("levelcomplete_next");
      }
      return;
    }

    const tb = this.titleButton;
    if (
      x >= tb.x &&
      x <= tb.x + tb.width &&
      y >= tb.y &&
      y <= tb.y + tb.height
    ) {
      EventBus.emit("levelcomplete_title");
    }
  }

  /**
   * 毎フレーム更新
   * @param {number} dt
   */
  update(dt) {
    if (!this.visible) return;
    this.animationTime += dt * 0.003;
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

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // タイトル
    const bounceY = Math.sin(this.animationTime * 2) * 5;

    if (this.isLastLevel) {
      ctx.shadowColor = COLORS.WARNING;
      ctx.shadowBlur = 20;
      ctx.fillStyle = COLORS.WARNING;
      ctx.font = "bold 40px monospace";
      ctx.fillText("CONGRATULATIONS!", CANVAS.WIDTH / 2, 130 + bounceY);
      ctx.shadowBlur = 0;

      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.font = "bold 20px monospace";
      ctx.fillText("ALL LEVELS CLEARED!", CANVAS.WIDTH / 2, 180);
    } else {
      ctx.shadowColor = "#00aaff";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#00aaff";
      ctx.font = "bold 36px monospace";
      ctx.fillText("LEVEL CLEAR!", CANVAS.WIDTH / 2, 140 + bounceY);
      ctx.shadowBlur = 0;

      ctx.fillStyle = COLORS.TEXT_SECONDARY;
      ctx.font = "18px monospace";
      ctx.fillText(`Level ${this.level} Complete`, CANVAS.WIDTH / 2, 190);
    }

    // スコア
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = "bold 20px monospace";
    ctx.fillText(`SCORE: ${this.score}`, CANVAS.WIDTH / 2, 250);

    // ボーナス
    if (this.bonus > 0) {
      ctx.fillStyle = COLORS.WARNING;
      ctx.font = "bold 18px monospace";
      ctx.fillText(`BONUS: +${this.bonus}`, CANVAS.WIDTH / 2, 290);
    }

    // トータル
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = "bold 16px monospace";
    ctx.fillText(`TOTAL: ${this.score + this.bonus}`, CANVAS.WIDTH / 2, 330);

    // ボタン
    this.renderButton(ctx, this.nextButton, true);
    this.renderButton(ctx, this.titleButton, false);
  }

  /**
   * ボタン描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} btn
   * @param {boolean} primary
   */
  renderButton(ctx, btn, primary) {
    ctx.fillStyle = primary
      ? "rgba(0, 170, 255, 0.7)"
      : "rgba(100, 100, 120, 0.6)";

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
    ctx.font = `bold ${primary ? 16 : 14}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + btn.height / 2);
  }
}

export default LevelCompleteScreen;
