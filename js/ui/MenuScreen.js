import EventBus from "../core/EventBus.js";
import { CANVAS, COLORS, STATES } from "../config/constants.js";

/**
 * MenuScreen - タイトル画面
 * タイトル「BLOCK BROKEN ULTIMATE」、Start ボタン、High Scores ボタン
 */
class MenuScreen {
  constructor() {
    this.visible = true;
    this.animationTime = 0;
    this.showHighScores = false;
    this.highScores = [];
    this.buttons = [
      {
        label: "START GAME",
        x: CANVAS.WIDTH / 2 - 100,
        y: 340,
        width: 200,
        height: 45,
        action: "start",
      },
      {
        label: "HIGH SCORES",
        x: CANVAS.WIDTH / 2 - 100,
        y: 400,
        width: 200,
        height: 45,
        action: "highscores",
      },
    ];
    this.backButton = {
      label: "BACK",
      x: CANVAS.WIDTH / 2 - 60,
      y: 500,
      width: 120,
      height: 40,
      action: "back",
    };
    this.hoveredButton = null;

    EventBus.on("state_changed", (data) => {
      this.visible = data.to === STATES.TITLE;
      if (this.visible) {
        this.showHighScores = false;
      }
    });

    EventBus.on("highscore_updated", (data) => {
      this.highScores = data.scores || [];
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
    if (this.showHighScores) {
      if (this.isInsideButton(x, y, this.backButton)) {
        this.showHighScores = false;
      }
      return;
    }

    for (let i = 0; i < this.buttons.length; i++) {
      const btn = this.buttons[i];
      if (this.isInsideButton(x, y, btn)) {
        if (btn.action === "start") {
          EventBus.emit("menu_start_game");
        } else if (btn.action === "highscores") {
          this.showHighScores = true;
        }
        return;
      }
    }
  }

  /**
   * ボタン内判定
   */
  isInsideButton(x, y, btn) {
    return (
      x >= btn.x &&
      x <= btn.x + btn.width &&
      y >= btn.y &&
      y <= btn.y + btn.height
    );
  }

  /**
   * ハイスコアを設定
   * @param {Array} scores
   */
  setHighScores(scores) {
    this.highScores = scores;
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

    if (this.showHighScores) {
      this.renderHighScores(ctx);
      return;
    }

    // タイトル
    const titleY = 150 + Math.sin(this.animationTime) * 5;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // グロー
    ctx.shadowColor = COLORS.ACCENT;
    ctx.shadowBlur = 20;
    ctx.fillStyle = COLORS.ACCENT;
    ctx.font = "bold 42px monospace";
    ctx.fillText("BLOCK BROKEN", CANVAS.WIDTH / 2, titleY);

    ctx.shadowBlur = 10;
    ctx.fillStyle = COLORS.WARNING;
    ctx.font = "bold 28px monospace";
    ctx.fillText("ULTIMATE", CANVAS.WIDTH / 2, titleY + 45);
    ctx.shadowBlur = 0;

    // サブテキスト
    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = "14px monospace";
    ctx.fillText("Press START or click to begin", CANVAS.WIDTH / 2, 280);

    // ボタン描画
    for (let i = 0; i < this.buttons.length; i++) {
      this.renderButton(ctx, this.buttons[i]);
    }

    // バージョン
    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = "11px monospace";
    ctx.fillText("v1.0", CANVAS.WIDTH / 2, CANVAS.HEIGHT - 20);
  }

  /**
   * ボタン描画
   */
  renderButton(ctx, btn) {
    const gradient = ctx.createLinearGradient(
      btn.x,
      btn.y,
      btn.x,
      btn.y + btn.height,
    );
    gradient.addColorStop(0, "rgba(233, 69, 96, 0.8)");
    gradient.addColorStop(1, "rgba(180, 40, 70, 0.8)");
    ctx.fillStyle = gradient;

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
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + btn.height / 2);
  }

  /**
   * ハイスコア画面描画
   */
  renderHighScores(ctx) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = COLORS.WARNING;
    ctx.font = "bold 28px monospace";
    ctx.fillText("HIGH SCORES", CANVAS.WIDTH / 2, 80);

    ctx.font = "16px monospace";
    if (this.highScores.length === 0) {
      ctx.fillStyle = COLORS.TEXT_SECONDARY;
      ctx.fillText("No scores yet", CANVAS.WIDTH / 2, 200);
    } else {
      for (let i = 0; i < this.highScores.length; i++) {
        const s = this.highScores[i];
        const y = 140 + i * 35;
        const rank = `${i + 1}.`.padStart(3);
        const name = s.name.padEnd(4);
        const score = String(s.score).padStart(8);
        const lvl = `Lv${s.level}`;

        ctx.fillStyle = i === 0 ? COLORS.WARNING : COLORS.TEXT_PRIMARY;
        ctx.textAlign = "center";
        ctx.fillText(`${rank} ${name} ${score}  ${lvl}`, CANVAS.WIDTH / 2, y);
      }
    }

    this.renderButton(ctx, this.backButton);
  }
}

export default MenuScreen;
