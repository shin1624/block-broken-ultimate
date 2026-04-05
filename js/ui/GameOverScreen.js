import EventBus from "../core/EventBus.js";
import { CANVAS, COLORS, STATES } from "../config/constants.js";
import { NAME_LENGTH } from "../systems/HighScoreSystem.js";

/**
 * GameOverScreen - ゲームオーバー画面
 * 最終スコア表示、ハイスコア名前入力、リトライボタン
 */
class GameOverScreen {
  constructor(highScoreSystem) {
    this.highScoreSystem = highScoreSystem;
    this.visible = false;
    this.finalScore = 0;
    this.level = 1;
    this.isHighScore = false;
    this.nameInput = "";
    this.nameSubmitted = false;
    this.rank = -1;
    this.animationTime = 0;

    this.buttons = [
      {
        label: "RETRY",
        x: CANVAS.WIDTH / 2 - 90,
        y: 440,
        width: 180,
        height: 45,
        action: "retry",
      },
      {
        label: "TITLE",
        x: CANVAS.WIDTH / 2 - 90,
        y: 500,
        width: 180,
        height: 45,
        action: "title",
      },
    ];

    EventBus.on("state_changed", (data) => {
      if (data.to === STATES.GAMEOVER) {
        this.visible = true;
        this.finalScore = data.data.finalScore || 0;
        this.level = data.data.level || 1;
        this.isHighScore = this.highScoreSystem.isHighScore(this.finalScore);
        this.nameInput = "";
        this.nameSubmitted = false;
        this.rank = -1;
        this.animationTime = 0;
      } else {
        this.visible = false;
      }
    });

    EventBus.on("input_click", (data) => {
      if (!this.visible) return;
      this.handleClick(data.x, data.y);
    });

    this.onKeyDown = (e) => {
      if (!this.visible || !this.isHighScore || this.nameSubmitted) return;
      this.handleKeyInput(e);
    };
    document.addEventListener("keydown", this.onKeyDown);
  }

  /**
   * キー入力処理（名前入力）
   */
  handleKeyInput(e) {
    if (e.key === "Backspace") {
      this.nameInput = this.nameInput.slice(0, -1);
      e.preventDefault();
      return;
    }

    if (e.key === "Enter" && this.nameInput.length > 0) {
      this.submitName();
      e.preventDefault();
      return;
    }

    if (/^[a-zA-Z0-9]$/.test(e.key) && this.nameInput.length < NAME_LENGTH) {
      this.nameInput += e.key.toUpperCase();
      e.preventDefault();
    }
  }

  /**
   * 名前を送信
   */
  submitName() {
    if (this.nameSubmitted || this.nameInput.length === 0) return;
    this.nameSubmitted = true;
    this.rank = this.highScoreSystem.addScore(
      this.nameInput,
      this.finalScore,
      this.level,
    );
  }

  /**
   * クリック処理
   */
  handleClick(x, y) {
    // 名前入力中でSubmitボタン未表示の場合
    if (this.isHighScore && !this.nameSubmitted && this.nameInput.length >= 1) {
      const submitBtn = {
        x: CANVAS.WIDTH / 2 + 50,
        y: 355,
        width: 80,
        height: 35,
      };
      if (
        x >= submitBtn.x &&
        x <= submitBtn.x + submitBtn.width &&
        y >= submitBtn.y &&
        y <= submitBtn.y + submitBtn.height
      ) {
        this.submitName();
        return;
      }
    }

    for (let i = 0; i < this.buttons.length; i++) {
      const btn = this.buttons[i];
      if (
        x >= btn.x &&
        x <= btn.x + btn.width &&
        y >= btn.y &&
        y <= btn.y + btn.height
      ) {
        if (btn.action === "retry") {
          EventBus.emit("gameover_retry");
        } else if (btn.action === "title") {
          EventBus.emit("gameover_title");
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

    // GAME OVER テキスト
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 15;
    ctx.fillStyle = COLORS.ACCENT;
    ctx.font = "bold 44px monospace";
    ctx.fillText("GAME OVER", CANVAS.WIDTH / 2, 120);
    ctx.shadowBlur = 0;

    // スコア
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = "bold 22px monospace";
    ctx.fillText(`SCORE: ${this.finalScore}`, CANVAS.WIDTH / 2, 200);

    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = "16px monospace";
    ctx.fillText(`Level ${this.level}`, CANVAS.WIDTH / 2, 235);

    // ハイスコア入力
    if (this.isHighScore && !this.nameSubmitted) {
      this.renderNameInput(ctx);
    } else if (this.nameSubmitted) {
      ctx.fillStyle = COLORS.WARNING;
      ctx.font = "bold 18px monospace";
      ctx.fillText(
        this.rank > 0 ? `RANK #${this.rank}!` : "SCORE SAVED!",
        CANVAS.WIDTH / 2,
        310,
      );
    }

    // ボタン
    for (let i = 0; i < this.buttons.length; i++) {
      this.renderButton(ctx, this.buttons[i]);
    }
  }

  /**
   * 名前入力欄描画
   */
  renderNameInput(ctx) {
    ctx.fillStyle = COLORS.WARNING;
    ctx.font = "bold 16px monospace";
    ctx.fillText("NEW HIGH SCORE!", CANVAS.WIDTH / 2, 280);

    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = "13px monospace";
    ctx.fillText("Enter your name (3 chars):", CANVAS.WIDTH / 2, 310);

    // 入力ボックス
    const boxX = CANVAS.WIDTH / 2 - 60;
    const boxY = 335;
    ctx.strokeStyle = COLORS.TEXT_PRIMARY;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, 100, 35);

    // 入力文字
    const display = this.nameInput.padEnd(NAME_LENGTH, "_");
    const blink = Math.sin(this.animationTime * 5) > 0;
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      blink
        ? display
        : this.nameInput + (this.nameInput.length < NAME_LENGTH ? "_" : ""),
      boxX + 50,
      boxY + 18,
    );

    // Submit ボタン
    if (this.nameInput.length >= 1) {
      ctx.fillStyle = "rgba(0, 200, 100, 0.7)";
      ctx.fillRect(CANVAS.WIDTH / 2 + 50, 355, 80, 35);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px monospace";
      ctx.fillText("OK", CANVAS.WIDTH / 2 + 90, 372);
    }
  }

  /**
   * ボタン描画
   */
  renderButton(ctx, btn) {
    ctx.fillStyle = "rgba(233, 69, 96, 0.6)";
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = "bold 15px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + btn.height / 2);
  }
}

export default GameOverScreen;
