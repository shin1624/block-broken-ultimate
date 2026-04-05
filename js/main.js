import EventBus from "./core/EventBus.js";
import GameLoop from "./core/GameLoop.js";
import GameStateManager from "./core/GameStateManager.js";
import GameEventHandler from "./core/GameEventHandler.js";
import { CANVAS, STATES, GAME, PHYSICS } from "./config/constants.js";
import Ball from "./entities/Ball.js";
import Paddle from "./entities/Paddle.js";
import CollisionSystem from "./systems/CollisionSystem.js";
import InputSystem from "./systems/InputSystem.js";
import TouchControlSystem from "./systems/TouchControlSystem.js";
import RenderSystem from "./systems/RenderSystem.js";
import LevelSystem from "./systems/LevelSystem.js";
import PowerUpManager from "./systems/PowerUpManager.js";
import ComboSystem from "./systems/ComboSystem.js";
import HighScoreSystem from "./systems/HighScoreSystem.js";
import ParticleSystem from "./systems/ParticleSystem.js";
import ScreenEffectsSystem from "./systems/ScreenEffectsSystem.js";
import TransitionSystem from "./systems/TransitionSystem.js";
import MusicSystem from "./systems/MusicSystem.js";
import AudioSystem from "./systems/AudioSystem.js";
import MenuScreen from "./ui/MenuScreen.js";
import HUD from "./ui/HUD.js";
import PauseScreen from "./ui/PauseScreen.js";
import GameOverScreen from "./ui/GameOverScreen.js";
import LevelCompleteScreen from "./ui/LevelCompleteScreen.js";

let canvas, ctx, gameLoop, stateManager;
let inputSystem, touchSystem, collisionSystem, renderSystem;
let levelSystem, powerUpManager, comboSystem, highScoreSystem;
let particleSystem, screenEffects, transitionSystem;
let musicSystem, audioSystem, audioContext;
let menuScreen, hud, pauseScreen, gameOverScreen, levelCompleteScreen;

let paddle, balls, score, lives;
let eventHandler;

function initCanvas() {
  canvas = document.getElementById("game-canvas");
  if (!canvas) return false;
  ctx = canvas.getContext("2d");
  canvas.width = CANVAS.WIDTH;
  canvas.height = CANVAS.HEIGHT;
  handleResize();
  window.addEventListener("resize", handleResize);
  return true;
}

function handleResize() {
  const container = canvas.parentElement;
  if (!container) return;
  const cw = container.clientWidth;
  const ch = container.clientHeight;
  const ar = CANVAS.WIDTH / CANVAS.HEIGHT;
  let dw = cw;
  let dh = cw / ar;
  if (dh > ch) {
    dh = ch;
    dw = ch * ar;
  }
  canvas.style.width = `${dw}px`;
  canvas.style.height = `${dh}px`;
}

function createBall(x, y) {
  return new Ball(x, y);
}

function resetGameState() {
  score = 0;
  lives = GAME.INITIAL_LIVES;
  paddle = new Paddle();
  balls = [
    new Ball(CANVAS.WIDTH / 2, paddle.getTopY() - PHYSICS.BALL_RADIUS - 2),
  ];
  comboSystem.reset();
  powerUpManager.clear();
  particleSystem.clear();
  EventBus.emit("score_updated", { score });
  EventBus.emit("lives_updated", { lives });
}

function startLevel(levelNum) {
  const blocks = levelSystem.loadLevel(levelNum);
  paddle.reset();
  balls = [
    new Ball(CANVAS.WIDTH / 2, paddle.getTopY() - PHYSICS.BALL_RADIUS - 2),
  ];
  comboSystem.reset();
  powerUpManager.clear();
  powerUpManager.setEntities(paddle, balls, createBall);
  collisionSystem.setEntities(
    balls,
    blocks,
    paddle,
    powerUpManager.getFallingPowerUps(),
  );
}

function initAudio() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  musicSystem.initialize(audioContext);
  audioSystem.initialize(audioContext);
  if (audioContext.state === "suspended") audioContext.resume();
}

function updateLasers(dt) {
  if (!eventHandler) return;
  const lasers = eventHandler.getLasers();
  const blocks = levelSystem.getBlocks();
  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];
    laser.update(dt);
    if (!laser.active) {
      lasers.splice(i, 1);
      continue;
    }
    const lb = laser.getBounds();
    for (let j = 0; j < blocks.length; j++) {
      const block = blocks[j];
      if (block.destroyed) continue;
      const hit =
        lb.x < block.x + block.width &&
        lb.x + lb.width > block.x &&
        lb.y < block.y + block.height &&
        lb.y + lb.height > block.y;
      if (hit) {
        block.hit();
        laser.active = false;
        lasers.splice(i, 1);
        break;
      }
    }
  }
}

function checkBallLoss() {
  const activeBalls = balls.filter((b) => b.active);
  if (activeBalls.length === 0 && balls.length > 0) {
    lives--;
    EventBus.emit("lives_updated", { lives });
    if (lives <= 0) {
      stateManager.setState(STATES.GAMEOVER, {
        finalScore: score,
        level: levelSystem.getCurrentLevel(),
      });
    } else {
      balls = [
        new Ball(CANVAS.WIDTH / 2, paddle.getTopY() - PHYSICS.BALL_RADIUS - 2),
      ];
      paddle.reset();
      powerUpManager.clear();
      powerUpManager.setEntities(paddle, balls, createBall);
      collisionSystem.setEntities(
        balls,
        levelSystem.getBlocks(),
        paddle,
        powerUpManager.getFallingPowerUps(),
      );
    }
  }
}

function initSystems() {
  stateManager = new GameStateManager();
  gameLoop = new GameLoop();

  inputSystem = new InputSystem(canvas);
  touchSystem = new TouchControlSystem(canvas);
  collisionSystem = new CollisionSystem();
  renderSystem = new RenderSystem(ctx);
  levelSystem = new LevelSystem();
  powerUpManager = new PowerUpManager();
  comboSystem = new ComboSystem();
  highScoreSystem = new HighScoreSystem();
  particleSystem = new ParticleSystem();
  screenEffects = new ScreenEffectsSystem(particleSystem);
  transitionSystem = new TransitionSystem();
  musicSystem = new MusicSystem();
  audioSystem = new AudioSystem();

  menuScreen = new MenuScreen();
  hud = new HUD();
  pauseScreen = new PauseScreen();
  gameOverScreen = new GameOverScreen(highScoreSystem);
  levelCompleteScreen = new LevelCompleteScreen();

  paddle = new Paddle();
  balls = [];
  score = 0;
  lives = GAME.INITIAL_LIVES;
  menuScreen.setHighScores(highScoreSystem.getScores());

  setupUpdateLoop();
  setupRenderLayers();
}

function setupUpdateLoop() {
  gameLoop.addUpdateCallback((dt) => {
    if (stateManager.isState(STATES.PLAYING)) {
      inputSystem.update(dt);
      touchSystem.update(dt);
      paddle.update(dt);
      for (let i = 0; i < balls.length; i++) {
        balls[i].updateStuck(paddle);
        balls[i].update(dt);
      }
      levelSystem.update(dt);
      collisionSystem.setEntities(
        balls,
        levelSystem.getBlocks(),
        paddle,
        powerUpManager.getFallingPowerUps(),
      );
      collisionSystem.update(dt);
      powerUpManager.update(dt);
      comboSystem.update(dt);
      hud.setComboTimerRatio(comboSystem.getTimerRatio());
      hud.setActiveEffects(powerUpManager.getActiveEffects());
      updateLasers(dt);
      checkBallLoss();
    }
    particleSystem.update(dt);
    screenEffects.update(dt);
    transitionSystem.update(dt);
    menuScreen.update(dt);
    hud.update(dt);
    gameOverScreen.update(dt);
    levelCompleteScreen.update(dt);
  }, 0);
}

function setupRenderLayers() {
  renderSystem.addLayer(() => levelSystem.render(ctx), 10, "blocks");
  renderSystem.addLayer(
    () => {
      if (stateManager.isState(STATES.PLAYING)) {
        paddle.render(ctx);
        for (let i = 0; i < balls.length; i++) balls[i].render(ctx);
      }
    },
    20,
    "entities",
  );
  renderSystem.addLayer(
    () => {
      if (!eventHandler) return;
      const lasers = eventHandler.getLasers();
      for (let i = 0; i < lasers.length; i++) {
        lasers[i].render(ctx);
      }
    },
    22,
    "lasers",
  );
  renderSystem.addLayer(() => powerUpManager.render(ctx), 25, "powerups");
  renderSystem.addLayer(() => particleSystem.render(ctx), 30, "particles");
  renderSystem.addLayer(() => screenEffects.render(ctx), 35, "effects");
  renderSystem.addLayer(() => hud.render(ctx), 40, "hud");
  renderSystem.addLayer(() => menuScreen.render(ctx), 50, "menu");
  renderSystem.addLayer(() => pauseScreen.render(ctx), 55, "pause");
  renderSystem.addLayer(() => gameOverScreen.render(ctx), 60, "gameover");
  renderSystem.addLayer(
    () => levelCompleteScreen.render(ctx),
    65,
    "levelcomplete",
  );
  renderSystem.addLayer(() => transitionSystem.render(ctx), 100, "transition");
  gameLoop.addRenderCallback(() => renderSystem.update(16.67), 0);
}

function init() {
  if (!initCanvas()) return;
  initSystems();

  eventHandler = new GameEventHandler({
    stateManager,
    comboSystem,
    levelSystem,
    menuScreen,
    powerUpManager,
    collisionSystem,
    particleSystem,
    getGameState: () => ({ paddle, balls, score, lives }),
    setGameState: (s) => {
      if (s.score !== undefined) score = s.score;
      if (s.lives !== undefined) lives = s.lives;
    },
    resetGameState,
    startLevel,
    initAudio,
  });
  eventHandler.setup();

  gameLoop.start();
  window.__game = { EventBus, gameLoop, stateManager, canvas, ctx };
}

document.addEventListener("DOMContentLoaded", init);
