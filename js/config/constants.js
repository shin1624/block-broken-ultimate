/**
 * constants.js - 全定数一元管理
 * Canvas サイズ、物理パラメータ、ゲーム設定、色定義等
 */

export const CANVAS = {
  WIDTH: 800,
  HEIGHT: 600,
  BACKGROUND_COLOR: "#1a1a2e",
};

export const PHYSICS = {
  BALL_SPEED: 5,
  BALL_RADIUS: 8,
  BALL_MAX_SPEED: 12,
  PADDLE_SPEED: 8,
  FRICTION: 0.99,
  BOUNCE_ANGLE_MAX: Math.PI / 3, // 60度
};

export const GAME = {
  TARGET_FPS: 60,
  FIXED_TIME_STEP: 1000 / 60,
  MAX_FRAME_TIME: 50,
  MAX_UPDATES_PER_FRAME: 5,
  INITIAL_LIVES: 3,
  STARTING_LEVEL: 1,
};

export const PADDLE = {
  WIDTH: 100,
  HEIGHT: 15,
  OFFSET_BOTTOM: 40,
  COLOR: "#e94560",
  BORDER_RADIUS: 4,
};

export const BALL = {
  RADIUS: PHYSICS.BALL_RADIUS,
  COLOR: "#ffffff",
  TRAIL_LENGTH: 5,
  TRAIL_OPACITY: 0.3,
};

export const BLOCK = {
  ROWS: 5,
  COLS: 10,
  WIDTH: 70,
  HEIGHT: 25,
  PADDING: 5,
  OFFSET_TOP: 60,
  OFFSET_LEFT: 30,
};

export const COLORS = {
  BACKGROUND: CANVAS.BACKGROUND_COLOR,
  TEXT_PRIMARY: "#ffffff",
  TEXT_SECONDARY: "#a0a0b0",
  ACCENT: "#e94560",
  SUCCESS: "#0f3460",
  WARNING: "#f5a623",
  BLOCK_PALETTE: ["#e94560", "#0f3460", "#16213e", "#533483", "#f5a623"],
  UI_OVERLAY: "rgba(0, 0, 0, 0.7)",
};

export const STATES = {
  TITLE: "title",
  PLAYING: "playing",
  PAUSED: "paused",
  GAMEOVER: "gameover",
  LEVELCOMPLETE: "levelcomplete",
};
