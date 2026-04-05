import EventBus from "./EventBus.js";
import { STATES, GAME, CANVAS, PHYSICS } from "../config/constants.js";
import Laser from "../entities/Laser.js";

/**
 * GameEventHandler - 全ゲームイベントの購読と処理を一元管理
 * main.js から依存関係を注入され、setup() で全イベントリスナーを登録する。
 */
class GameEventHandler {
  constructor(deps) {
    this.stateManager = deps.stateManager;
    this.comboSystem = deps.comboSystem;
    this.levelSystem = deps.levelSystem;
    this.menuScreen = deps.menuScreen;
    this.powerUpManager = deps.powerUpManager;
    this.collisionSystem = deps.collisionSystem;
    this.particleSystem = deps.particleSystem;
    this.getGameState = deps.getGameState;
    this.setGameState = deps.setGameState;
    this.resetGameState = deps.resetGameState;
    this.startLevel = deps.startLevel;
    this.initAudio = deps.initAudio;
    this.audioInitialized = false;
    this.stickyMode = false;
    this.laserMode = false;
    this.lasers = [];
    this.lastLaserTime = 0;
  }

  /**
   * 全イベントリスナーを登録
   */
  setup() {
    this.setupInputEvents();
    this.setupMenuEvents();
    this.setupPauseEvents();
    this.setupGameplayEvents();
    this.setupLevelEvents();
    this.setupHighScoreEvents();
    this.setupStickyPaddleEvents();
    this.setupLaserEvents();
    this.setupAudioInit();
  }

  /**
   * 入力系イベント
   */
  setupInputEvents() {
    EventBus.on("input_move", (data) => {
      if (!this.stateManager.isState(STATES.PLAYING)) return;
      const { paddle } = this.getGameState();
      if (!paddle) return;
      paddle.moveByKeyboard(data.direction, data.dt);
    });

    EventBus.on("input_mouse_move", (data) => {
      if (!this.stateManager.isState(STATES.PLAYING)) return;
      const { paddle } = this.getGameState();
      if (!paddle) return;
      paddle.moveToPosition(data.x);
    });

    EventBus.on("input_pause_toggle", () => {
      if (this.stateManager.isState(STATES.PLAYING)) {
        this.stateManager.setState(STATES.PAUSED);
      } else if (this.stateManager.isState(STATES.PAUSED)) {
        this.stateManager.setState(STATES.PLAYING);
      }
    });
  }

  /**
   * メニュー画面イベント
   */
  setupMenuEvents() {
    EventBus.on("menu_start_game", () => {
      EventBus.emit("transition_start", {
        type: "fade",
        duration: 600,
        onMidpoint: () => {
          this.resetGameState();
          this.startLevel(GAME.STARTING_LEVEL);
          this.stateManager.setState(STATES.PLAYING);
        },
      });
    });
  }

  /**
   * ポーズ画面イベント
   */
  setupPauseEvents() {
    EventBus.on("pause_resume", () => {
      this.stateManager.setState(STATES.PLAYING);
    });

    EventBus.on("pause_quit", () => {
      EventBus.emit("transition_start", {
        type: "fade",
        duration: 400,
        onMidpoint: () => {
          this.stateManager.reset();
        },
      });
    });
  }

  /**
   * ゲームプレイ中イベント（スコア、ライフ）
   */
  setupGameplayEvents() {
    EventBus.on("block_destroyed", (data) => {
      const { score } = this.getGameState();
      const basePoints = (data && data.points) || 10;
      const multiplier = this.comboSystem.getMultiplier();
      const gained = basePoints * multiplier;
      this.setGameState({ score: score + gained });
      EventBus.emit("score_updated", { score: score + gained });
    });

    EventBus.on("extra_life_gained", () => {
      const { lives } = this.getGameState();
      const newLives = lives + 1;
      this.setGameState({ lives: newLives });
      EventBus.emit("lives_updated", { lives: newLives });
    });
  }

  /**
   * レベル関連イベント
   */
  setupLevelEvents() {
    EventBus.on("level_cleared", (data) => {
      const { score } = this.getGameState();
      const level = data.level;
      const bonus = level * 500;
      const newScore = score + bonus;
      this.setGameState({ score: newScore });
      EventBus.emit("score_updated", { score: newScore });

      this.stateManager.setState(STATES.LEVELCOMPLETE, {
        level,
        bonus,
        nextLevel: level + 1,
        totalScore: newScore,
        isLastLevel: level >= this.levelSystem.getMaxLevel(),
      });
    });

    EventBus.on("levelcomplete_next", () => {
      const currentLevel = this.levelSystem.getCurrentLevel();
      EventBus.emit("transition_start", {
        type: "circle",
        duration: 600,
        onMidpoint: () => {
          this.startLevel(currentLevel + 1);
          this.stateManager.setState(STATES.PLAYING);
        },
      });
    });

    EventBus.on("levelcomplete_title", () => {
      EventBus.emit("transition_start", {
        type: "fade",
        duration: 400,
        onMidpoint: () => {
          this.stateManager.reset();
        },
      });
    });

    EventBus.on("gameover_retry", () => {
      EventBus.emit("transition_start", {
        type: "fade",
        duration: 600,
        onMidpoint: () => {
          this.resetGameState();
          this.startLevel(GAME.STARTING_LEVEL);
          this.stateManager.setState(STATES.PLAYING);
        },
      });
    });

    EventBus.on("gameover_title", () => {
      EventBus.emit("transition_start", {
        type: "fade",
        duration: 400,
        onMidpoint: () => {
          this.stateManager.reset();
        },
      });
    });
  }

  /**
   * スティッキーパドル関連イベント
   */
  setupStickyPaddleEvents() {
    EventBus.on("sticky_paddle_on", () => {
      this.stickyMode = true;
    });

    EventBus.on("sticky_paddle_off", () => {
      this.stickyMode = false;
      const { balls } = this.getGameState();
      for (let i = 0; i < balls.length; i++) {
        if (balls[i].stuck) balls[i].launch();
      }
    });

    EventBus.on("ball_paddle_hit", (data) => {
      if (!this.stickyMode || !data.ball) return;
      const { paddle } = this.getGameState();
      if (!paddle) return;
      data.ball.stickTo(paddle);
    });

    EventBus.on("input_action", () => {
      if (!this.stateManager.isState(STATES.PLAYING)) return;
      const { balls, paddle } = this.getGameState();
      if (!paddle) return;
      let launched = false;
      for (let i = 0; i < balls.length; i++) {
        if (balls[i].stuck) {
          balls[i].launch();
          launched = true;
        }
      }
      if (launched) return;

      // レーザーモード中: パドルからレーザーを発射
      if (this.laserMode) {
        const now = performance.now();
        if (now - this.lastLaserTime >= 200) {
          this.lastLaserTime = now;
          const laserLeft = new Laser(paddle.x + paddle.width * 0.2, paddle.y);
          const laserRight = new Laser(paddle.x + paddle.width * 0.8, paddle.y);
          this.lasers.push(laserLeft, laserRight);
        }
      }
    });
  }

  /**
   * レーザー関連イベント
   */
  setupLaserEvents() {
    EventBus.on("laser_on", () => {
      this.laserMode = true;
    });

    EventBus.on("laser_off", () => {
      this.laserMode = false;
    });
  }

  /**
   * レーザー配列を取得（main.js の update/render 用）
   * @returns {Laser[]}
   */
  getLasers() {
    return this.lasers;
  }

  /**
   * ハイスコア関連イベント
   */
  setupHighScoreEvents() {
    EventBus.on("highscore_updated", (data) => {
      if (this.menuScreen && data.scores) {
        this.menuScreen.setHighScores(data.scores);
      }
    });
  }

  /**
   * 初回ユーザーインタラクションで AudioContext を初期化
   */
  setupAudioInit() {
    const initOnce = () => {
      if (this.audioInitialized) return;
      this.audioInitialized = true;
      this.initAudio();
      document.removeEventListener("click", initOnce);
      document.removeEventListener("keydown", initOnce);
      document.removeEventListener("touchstart", initOnce);
    };

    document.addEventListener("click", initOnce);
    document.addEventListener("keydown", initOnce);
    document.addEventListener("touchstart", initOnce);
  }
}

export default GameEventHandler;
